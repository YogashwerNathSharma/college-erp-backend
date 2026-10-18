import React, { useState, useEffect, useCallback } from 'react';
import {
  Lock,
  Unlock,
  ShieldCheck,
  ShieldAlert,
  ShieldX,
  Eye,
  EyeOff,
  Users,
  Crown,
  Info,
} from 'lucide-react';

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────

export type LockLevel = 'unlocked' | 'teacher_locked' | 'fully_locked';

export interface AccessControlConfig {
  lockLevel: LockLevel;
  lockedBy?: string;
  lockedAt?: string;
  allowedRoles?: string[];
}

interface AccessControlProps {
  canvas: fabric.Canvas | null;
  selectedObject: fabric.Object | null;
  userRole: string; // 'SUPER_ADMIN' | 'ADMIN' | 'TEACHER' | 'STAFF'
  userName?: string;
  onLockChange?: (objectId: string, lockLevel: LockLevel) => void;
}

interface AccessControlPanelProps extends AccessControlProps {
  isOpen: boolean;
  onClose: () => void;
}

// ─────────────────────────────────────────────────────────────
// Lock Level Definitions
// ─────────────────────────────────────────────────────────────

const LOCK_LEVELS: Array<{
  level: LockLevel;
  label: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  bgColor: string;
}> = [
  {
    level: 'unlocked',
    label: 'Unlocked',
    description: 'Anyone can edit this element',
    icon: <Unlock className="w-4 h-4" />,
    color: 'text-green-600',
    bgColor: 'bg-green-50 border-green-200',
  },
  {
    level: 'teacher_locked',
    label: 'Admin Only',
    description: 'Only admins can edit (teachers can view)',
    icon: <ShieldCheck className="w-4 h-4" />,
    color: 'text-amber-600',
    bgColor: 'bg-amber-50 border-amber-200',
  },
  {
    level: 'fully_locked',
    label: 'Fully Locked',
    description: 'No one can modify (fixed position & content)',
    icon: <ShieldX className="w-4 h-4" />,
    color: 'text-red-600',
    bgColor: 'bg-red-50 border-red-200',
  },
];

// ─────────────────────────────────────────────────────────────
// Apply Access Control to Canvas
// ─────────────────────────────────────────────────────────────

export function applyAccessControl(
  canvas: fabric.Canvas,
  userRole: string
): void {
  if (!canvas) return;

  const isAdmin = userRole === 'ADMIN' || userRole === 'SUPER_ADMIN';

  canvas.getObjects().forEach((obj: any) => {
    const lockLevel: LockLevel = obj.lockLevel || 'unlocked';

    switch (lockLevel) {
      case 'teacher_locked':
        if (!isAdmin) {
          obj.selectable = false;
          obj.evented = false;
          obj.hoverCursor = 'not-allowed';
          obj.lockMovementX = true;
          obj.lockMovementY = true;
          obj.lockRotation = true;
          obj.lockScalingX = true;
          obj.lockScalingY = true;
          obj.hasControls = false;
          obj.hasBorders = false;
        } else {
          // Admin can still edit
          obj.selectable = true;
          obj.evented = true;
          obj.hoverCursor = 'move';
          obj.lockMovementX = false;
          obj.lockMovementY = false;
          obj.lockRotation = false;
          obj.lockScalingX = false;
          obj.lockScalingY = false;
          obj.hasControls = true;
          obj.hasBorders = true;
        }
        break;

      case 'fully_locked':
        obj.selectable = false;
        obj.evented = false;
        obj.hoverCursor = 'not-allowed';
        obj.lockMovementX = true;
        obj.lockMovementY = true;
        obj.lockRotation = true;
        obj.lockScalingX = true;
        obj.lockScalingY = true;
        obj.hasControls = false;
        obj.hasBorders = false;
        break;

      case 'unlocked':
      default:
        obj.selectable = true;
        obj.evented = true;
        obj.hoverCursor = 'move';
        obj.lockMovementX = false;
        obj.lockMovementY = false;
        obj.lockRotation = false;
        obj.lockScalingX = false;
        obj.lockScalingY = false;
        obj.hasControls = true;
        obj.hasBorders = true;
        break;
    }
  });

  canvas.renderAll();
}

// ─────────────────────────────────────────────────────────────
// Draw Lock Indicators (overlay icons on locked elements)
// ─────────────────────────────────────────────────────────────

export function drawLockIndicators(canvas: fabric.Canvas): void {
  if (!canvas) return;

  // Remove previous indicators
  const indicators = canvas.getObjects().filter((o: any) => o._isLockIndicator);
  indicators.forEach((ind) => canvas.remove(ind));

  canvas.getObjects().forEach((obj: any) => {
    if (obj._isLockIndicator) return;
    const lockLevel: LockLevel = obj.lockLevel || 'unlocked';
    if (lockLevel === 'unlocked') return;

    const left = obj.left + (obj.width * (obj.scaleX || 1)) - 16;
    const top = obj.top - 4;

    const indicator = new fabric.Circle({
      left,
      top,
      radius: 8,
      fill: lockLevel === 'fully_locked' ? '#EF4444' : '#F59E0B',
      stroke: '#FFFFFF',
      strokeWidth: 1.5,
      selectable: false,
      evented: false,
      excludeFromExport: true,
    });
    (indicator as any)._isLockIndicator = true;
    canvas.add(indicator);
  });

  canvas.renderAll();
}

// ─────────────────────────────────────────────────────────────
// Quick Lock Button (inline in properties panel)
// ─────────────────────────────────────────────────────────────

export const QuickLockButton: React.FC<AccessControlProps> = ({
  canvas,
  selectedObject,
  userRole,
  userName,
  onLockChange,
}) => {
  const [currentLevel, setCurrentLevel] = useState<LockLevel>('unlocked');

  useEffect(() => {
    if (selectedObject) {
      setCurrentLevel((selectedObject as any).lockLevel || 'unlocked');
    }
  }, [selectedObject]);

  const isAdmin = userRole === 'ADMIN' || userRole === 'SUPER_ADMIN';

  const cycleLock = useCallback(() => {
    if (!selectedObject || !canvas || !isAdmin) return;

    const levels: LockLevel[] = ['unlocked', 'teacher_locked', 'fully_locked'];
    const currentIdx = levels.indexOf(currentLevel);
    const nextLevel = levels[(currentIdx + 1) % levels.length];

    (selectedObject as any).lockLevel = nextLevel;
    (selectedObject as any).lockedBy = userName || userRole;
    (selectedObject as any).lockedAt = new Date().toISOString();

    setCurrentLevel(nextLevel);
    applyAccessControl(canvas, userRole);
    drawLockIndicators(canvas);

    if (onLockChange) {
      onLockChange((selectedObject as any).id || '', nextLevel);
    }
  }, [canvas, selectedObject, currentLevel, userRole, userName, isAdmin, onLockChange]);

  if (!selectedObject) return null;

  const levelConfig = LOCK_LEVELS.find((l) => l.level === currentLevel)!;

  return (
    <button
      onClick={cycleLock}
      disabled={!isAdmin}
      title={isAdmin ? `Click to change: ${levelConfig.label}` : 'Only admins can change locks'}
      className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md border text-xs font-medium transition-colors ${
        isAdmin ? 'cursor-pointer hover:opacity-80' : 'cursor-not-allowed opacity-60'
      } ${levelConfig.bgColor} ${levelConfig.color}`}
    >
      {levelConfig.icon}
      {levelConfig.label}
    </button>
  );
};

// ─────────────────────────────────────────────────────────────
// Full Access Control Panel
// ─────────────────────────────────────────────────────────────

const AccessControl: React.FC<AccessControlPanelProps> = ({
  canvas,
  selectedObject,
  userRole,
  userName,
  onLockChange,
  isOpen,
  onClose,
}) => {
  const [selectedLevel, setSelectedLevel] = useState<LockLevel>('unlocked');
  const [bulkMode, setBulkMode] = useState(false);
  const [stats, setStats] = useState({ unlocked: 0, teacherLocked: 0, fullyLocked: 0 });

  const isAdmin = userRole === 'ADMIN' || userRole === 'SUPER_ADMIN';

  // Update stats
  useEffect(() => {
    if (!canvas) return;
    const objects = canvas.getObjects().filter((o: any) => !o._isLockIndicator);
    const stats = {
      unlocked: objects.filter((o: any) => !o.lockLevel || o.lockLevel === 'unlocked').length,
      teacherLocked: objects.filter((o: any) => o.lockLevel === 'teacher_locked').length,
      fullyLocked: objects.filter((o: any) => o.lockLevel === 'fully_locked').length,
    };
    setStats(stats);
  }, [canvas, selectedObject]);

  // Sync selected level with selected object
  useEffect(() => {
    if (selectedObject) {
      setSelectedLevel((selectedObject as any).lockLevel || 'unlocked');
    }
  }, [selectedObject]);

  const applyLockLevel = useCallback(
    (level: LockLevel) => {
      if (!canvas || !isAdmin) return;

      if (bulkMode) {
        // Apply to all selected or all objects
        const activeObjects = canvas.getActiveObjects();
        const targets = activeObjects.length > 0 ? activeObjects : canvas.getObjects();

        targets.forEach((obj: any) => {
          if (obj._isLockIndicator) return;
          obj.lockLevel = level;
          obj.lockedBy = userName || userRole;
          obj.lockedAt = new Date().toISOString();
        });
      } else if (selectedObject) {
        (selectedObject as any).lockLevel = level;
        (selectedObject as any).lockedBy = userName || userRole;
        (selectedObject as any).lockedAt = new Date().toISOString();
      }

      setSelectedLevel(level);
      applyAccessControl(canvas, userRole);
      drawLockIndicators(canvas);

      if (onLockChange && selectedObject) {
        onLockChange((selectedObject as any).id || '', level);
      }
    },
    [canvas, selectedObject, bulkMode, userRole, userName, isAdmin, onLockChange]
  );

  const unlockAll = useCallback(() => {
    if (!canvas || !isAdmin) return;
    canvas.getObjects().forEach((obj: any) => {
      if (obj._isLockIndicator) return;
      obj.lockLevel = 'unlocked';
    });
    applyAccessControl(canvas, userRole);
    drawLockIndicators(canvas);
  }, [canvas, userRole, isAdmin]);

  const lockAllExceptText = useCallback(() => {
    if (!canvas || !isAdmin) return;
    canvas.getObjects().forEach((obj: any) => {
      if (obj._isLockIndicator) return;
      if (obj.type === 'textbox' || obj.type === 'i-text' || obj.type === 'text') {
        obj.lockLevel = 'unlocked';
      } else {
        obj.lockLevel = 'teacher_locked';
      }
    });
    applyAccessControl(canvas, userRole);
    drawLockIndicators(canvas);
  }, [canvas, userRole, isAdmin]);

  if (!isOpen) return null;

  return (
    <div className="fixed right-0 top-0 h-full w-80 bg-white shadow-xl border-l border-gray-200 z-40 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 bg-gray-50">
        <div className="flex items-center gap-2">
          <Lock className="w-4 h-4 text-indigo-600" />
          <h3 className="text-sm font-semibold text-gray-900">Access Control</h3>
        </div>
        <button
          onClick={onClose}
          className="p-1 rounded hover:bg-gray-200 text-gray-500"
        >
          ×
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-5">
        {/* Role Badge */}
        <div className="flex items-center gap-2 px-3 py-2 bg-indigo-50 rounded-lg border border-indigo-100">
          <Crown className="w-4 h-4 text-indigo-600" />
          <span className="text-sm font-medium text-indigo-700">
            Your Role: {userRole}
          </span>
          {isAdmin && (
            <span className="ml-auto text-xs bg-indigo-600 text-white px-2 py-0.5 rounded-full">
              Can Lock
            </span>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-2">
          <div className="text-center p-2 bg-green-50 rounded-lg border border-green-100">
            <p className="text-lg font-bold text-green-700">{stats.unlocked}</p>
            <p className="text-[10px] text-green-600">Unlocked</p>
          </div>
          <div className="text-center p-2 bg-amber-50 rounded-lg border border-amber-100">
            <p className="text-lg font-bold text-amber-700">{stats.teacherLocked}</p>
            <p className="text-[10px] text-amber-600">Admin Only</p>
          </div>
          <div className="text-center p-2 bg-red-50 rounded-lg border border-red-100">
            <p className="text-lg font-bold text-red-700">{stats.fullyLocked}</p>
            <p className="text-[10px] text-red-600">Fully Locked</p>
          </div>
        </div>

        {/* Selected Element */}
        {selectedObject ? (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-gray-700">Selected Element</p>
              <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                {(selectedObject as any).type}
              </span>
            </div>

            {/* Lock Level Options */}
            <div className="space-y-2">
              {LOCK_LEVELS.map((config) => (
                <button
                  key={config.level}
                  onClick={() => applyLockLevel(config.level)}
                  disabled={!isAdmin}
                  className={`w-full flex items-center gap-3 p-3 rounded-lg border-2 transition-all text-left ${
                    selectedLevel === config.level
                      ? `${config.bgColor} border-current`
                      : 'border-gray-100 hover:border-gray-200'
                  } ${!isAdmin ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                >
                  <div className={config.color}>{config.icon}</div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{config.label}</p>
                    <p className="text-xs text-gray-500">{config.description}</p>
                  </div>
                </button>
              ))}
            </div>

            {/* Locked By Info */}
            {(selectedObject as any).lockedBy && selectedLevel !== 'unlocked' && (
              <div className="flex items-center gap-2 text-xs text-gray-500 bg-gray-50 rounded-lg p-2">
                <Info className="w-3 h-3" />
                <span>
                  Locked by {(selectedObject as any).lockedBy}{' '}
                  {(selectedObject as any).lockedAt &&
                    `on ${new Date((selectedObject as any).lockedAt).toLocaleDateString()}`}
                </span>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-6 text-gray-400">
            <Lock className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">Select an element to set its access level</p>
          </div>
        )}

        {/* Bulk Mode Toggle */}
        <div className="border-t border-gray-200 pt-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-gray-700">Bulk Mode</span>
            <button
              onClick={() => setBulkMode(!bulkMode)}
              className={`relative w-10 h-5 rounded-full transition-colors ${
                bulkMode ? 'bg-indigo-600' : 'bg-gray-300'
              }`}
            >
              <div
                className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${
                  bulkMode ? 'translate-x-5' : 'translate-x-0.5'
                }`}
              />
            </button>
          </div>
          {bulkMode && (
            <p className="text-xs text-amber-600 bg-amber-50 p-2 rounded">
              Lock level will apply to all selected objects (or all if none selected)
            </p>
          )}
        </div>

        {/* Quick Actions */}
        {isAdmin && (
          <div className="border-t border-gray-200 pt-4 space-y-2">
            <p className="text-sm font-medium text-gray-700 mb-2">Quick Actions</p>
            <button
              onClick={unlockAll}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-green-700 bg-green-50 rounded-lg hover:bg-green-100 border border-green-200 transition-colors"
            >
              <Unlock className="w-4 h-4" />
              Unlock All Elements
            </button>
            <button
              onClick={lockAllExceptText}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-amber-700 bg-amber-50 rounded-lg hover:bg-amber-100 border border-amber-200 transition-colors"
            >
              <ShieldCheck className="w-4 h-4" />
              Lock All Except Text Fields
            </button>
          </div>
        )}

        {/* Info Box */}
        <div className="bg-blue-50 border border-blue-100 rounded-lg p-3">
          <div className="flex items-start gap-2">
            <Info className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
            <div className="text-xs text-blue-700 space-y-1">
              <p className="font-medium">How Access Control Works:</p>
              <ul className="list-disc ml-3 space-y-0.5">
                <li><b>Unlocked</b> — All users can edit</li>
                <li><b>Admin Only</b> — Teachers can see but not edit</li>
                <li><b>Fully Locked</b> — Nobody can modify (design-time only)</li>
              </ul>
              <p className="mt-1 text-blue-600">
                Tip: Lock your school logo and header, then teachers can only fill in the content areas.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AccessControl;
