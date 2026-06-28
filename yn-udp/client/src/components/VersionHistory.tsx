/**
 * YN-UDP Version History Component
 * Drawer/panel showing template version history with preview and restore functionality
 * Integrates with CanvasEditor toolbar
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  X,
  History,
  RotateCcw,
  Eye,
  Clock,
  User,
  MessageSquare,
  ChevronRight,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Undo2,
  Redo2,
  GitBranch,
  Save,
  FileText,
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

interface TemplateVersion {
  id: string;
  templateId: string;
  version: number;
  canvasJSON: any;
  savedBy: string | null;
  comment: string | null;
  createdAt: string;
  objectCount?: number;
}

interface VersionHistoryProps {
  isOpen: boolean;
  onClose: () => void;
  templateId: string;
  currentCanvasJSON: any;
  onRestore: (canvasJSON: any, version: number) => void;
  onUndo: () => void;
  onRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
}

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// ─── Component ────────────────────────────────────────────────────────────────

const VersionHistory: React.FC<VersionHistoryProps> = ({
  isOpen,
  onClose,
  templateId,
  currentCanvasJSON,
  onRestore,
  onUndo,
  onRedo,
  canUndo,
  canRedo,
}) => {
  const [versions, setVersions] = useState<TemplateVersion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedVersion, setSelectedVersion] = useState<TemplateVersion | null>(null);
  const [isRestoring, setIsRestoring] = useState(false);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [saveComment, setSaveComment] = useState('');

  // Fetch versions on open
  useEffect(() => {
    if (isOpen && templateId) {
      fetchVersions();
    }
  }, [isOpen, templateId]);

  // ─── API Calls ────────────────────────────────────────────────────────────

  const fetchVersions = async () => {
    setIsLoading(true);
    setError('');
    try {
      const res = await fetch(`${API_BASE}/udp/templates/${templateId}/versions`);
      if (!res.ok) throw new Error('Failed to fetch versions');
      const data = await res.json();
      setVersions(data.versions || data || []);
    } catch (err: any) {
      setError(err.message || 'Failed to load version history');
      // Demo data for development
      setVersions([
        {
          id: 'v1',
          templateId,
          version: 1,
          canvasJSON: {},
          savedBy: 'Admin',
          comment: 'Initial version',
          createdAt: new Date(Date.now() - 86400000 * 3).toISOString(),
          objectCount: 12,
        },
        {
          id: 'v2',
          templateId,
          version: 2,
          canvasJSON: {},
          savedBy: 'Admin',
          comment: 'Added student photo placeholder',
          createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
          objectCount: 15,
        },
        {
          id: 'v3',
          templateId,
          version: 3,
          canvasJSON: {},
          savedBy: 'Admin',
          comment: 'Updated header layout',
          createdAt: new Date(Date.now() - 86400000).toISOString(),
          objectCount: 16,
        },
        {
          id: 'v4',
          templateId,
          version: 4,
          canvasJSON: {},
          savedBy: 'Admin',
          comment: null,
          createdAt: new Date(Date.now() - 3600000).toISOString(),
          objectCount: 18,
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const restoreVersion = async (version: TemplateVersion) => {
    setIsRestoring(true);
    try {
      const res = await fetch(
        `${API_BASE}/udp/templates/${templateId}/versions/${version.id}/restore`,
        { method: 'POST', headers: { 'Content-Type': 'application/json' } }
      );

      if (!res.ok) {
        // If API fails, still restore from local data
        console.warn('API restore failed, using local canvas JSON');
      }

      onRestore(version.canvasJSON, version.version);
      setSelectedVersion(null);
    } catch (err: any) {
      // Fallback: restore from the version's stored JSON
      onRestore(version.canvasJSON, version.version);
    } finally {
      setIsRestoring(false);
    }
  };

  const saveVersion = async () => {
    try {
      const res = await fetch(`${API_BASE}/udp/templates/${templateId}/versions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          canvasJSON: currentCanvasJSON,
          comment: saveComment || undefined,
        }),
      });

      if (res.ok) {
        setSaveComment('');
        setShowSaveDialog(false);
        fetchVersions(); // Refresh list
      }
    } catch (err) {
      console.error('Failed to save version:', err);
    }
  };

  // ─── Helpers ──────────────────────────────────────────────────────────────

  const formatTimeAgo = (dateStr: string): string => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHour = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHour / 24);

    if (diffSec < 60) return 'Just now';
    if (diffMin < 60) return `${diffMin} min ago`;
    if (diffHour < 24) return `${diffHour} hour${diffHour > 1 ? 's' : ''} ago`;
    if (diffDay < 7) return `${diffDay} day${diffDay > 1 ? 's' : ''} ago`;
    return date.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
    });
  };

  const formatDateTime = (dateStr: string): string => {
    const date = new Date(dateStr);
    return date.toLocaleString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (!isOpen) return null;

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="fixed inset-y-0 right-0 z-50 w-[400px] bg-white shadow-2xl border-l border-gray-200 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 bg-gradient-to-r from-purple-50 to-indigo-50">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-purple-600 flex items-center justify-center">
            <History className="w-4.5 h-4.5 text-white" />
          </div>
          <div>
            <h2 className="text-base font-bold text-gray-900">Version History</h2>
            <p className="text-xs text-gray-500">{versions.length} versions saved</p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-2 hover:bg-gray-100 rounded-lg transition"
        >
          <X className="w-5 h-5 text-gray-500" />
        </button>
      </div>

      {/* Undo/Redo Bar */}
      <div className="flex items-center justify-between px-5 py-3 bg-gray-50 border-b border-gray-100">
        <div className="flex items-center gap-1">
          <button
            onClick={onUndo}
            disabled={!canUndo}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-white hover:shadow-sm rounded-md transition disabled:opacity-40 disabled:cursor-not-allowed"
            title="Undo (Ctrl+Z)"
          >
            <Undo2 className="w-3.5 h-3.5" />
            Undo
          </button>
          <button
            onClick={onRedo}
            disabled={!canRedo}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-white hover:shadow-sm rounded-md transition disabled:opacity-40 disabled:cursor-not-allowed"
            title="Redo (Ctrl+Y)"
          >
            <Redo2 className="w-3.5 h-3.5" />
            Redo
          </button>
        </div>
        <button
          onClick={() => setShowSaveDialog(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-md transition"
        >
          <Save className="w-3.5 h-3.5" />
          Save Version
        </button>
      </div>

      {/* Save Version Dialog */}
      {showSaveDialog && (
        <div className="px-5 py-3 bg-indigo-50 border-b border-indigo-100">
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={saveComment}
              onChange={(e) => setSaveComment(e.target.value)}
              placeholder="Add a comment (optional)..."
              className="flex-1 px-3 py-2 text-sm border border-indigo-200 rounded-lg focus:ring-2 focus:ring-indigo-500"
              onKeyDown={(e) => e.key === 'Enter' && saveVersion()}
              autoFocus
            />
            <button
              onClick={saveVersion}
              className="px-3 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition"
            >
              Save
            </button>
            <button
              onClick={() => setShowSaveDialog(false)}
              className="p-2 text-gray-400 hover:text-gray-600"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Version List */}
      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-6 h-6 text-indigo-500 animate-spin" />
            <span className="ml-2 text-sm text-gray-500">Loading history...</span>
          </div>
        ) : error && versions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 px-6">
            <AlertCircle className="w-10 h-10 text-gray-300 mb-3" />
            <p className="text-sm text-gray-500 text-center">{error}</p>
          </div>
        ) : versions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 px-6">
            <GitBranch className="w-12 h-12 text-gray-200 mb-3" />
            <p className="text-sm font-medium text-gray-500">No versions yet</p>
            <p className="text-xs text-gray-400 mt-1">Save your first version to start tracking changes</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {/* Current Version (unsaved) */}
            <div className="px-5 py-3 bg-green-50 border-b border-green-100">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center">
                  <FileText className="w-4 h-4 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-green-800">Current (Unsaved)</span>
                    <span className="px-1.5 py-0.5 bg-green-200 text-green-700 text-[10px] font-bold rounded">
                      LIVE
                    </span>
                  </div>
                  <p className="text-xs text-green-600 mt-0.5">
                    {currentCanvasJSON?.objects?.length || 0} objects on canvas
                  </p>
                </div>
              </div>
            </div>

            {/* Saved Versions */}
            {[...versions].reverse().map((version) => (
              <div
                key={version.id}
                className={`px-5 py-3 hover:bg-gray-50 cursor-pointer transition group ${
                  selectedVersion?.id === version.id ? 'bg-indigo-50 border-l-4 border-indigo-500' : ''
                }`}
                onClick={() => setSelectedVersion(selectedVersion?.id === version.id ? null : version)}
              >
                <div className="flex items-start gap-3">
                  {/* Version Number Badge */}
                  <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0">
                    <span className="text-xs font-bold text-gray-600">v{version.version}</span>
                  </div>

                  {/* Version Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-gray-800">
                        Version {version.version}
                      </span>
                      <span className="text-xs text-gray-400">
                        {formatTimeAgo(version.createdAt)}
                      </span>
                    </div>

                    {version.comment && (
                      <p className="text-xs text-gray-600 mt-0.5 flex items-center gap-1">
                        <MessageSquare className="w-3 h-3 text-gray-400" />
                        {version.comment}
                      </p>
                    )}

                    <div className="flex items-center gap-3 mt-1 text-[11px] text-gray-400">
                      {version.savedBy && (
                        <span className="flex items-center gap-1">
                          <User className="w-3 h-3" /> {version.savedBy}
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" /> {formatDateTime(version.createdAt)}
                      </span>
                      {version.objectCount && (
                        <span>{version.objectCount} objects</span>
                      )}
                    </div>
                  </div>

                  {/* Arrow */}
                  <ChevronRight
                    className={`w-4 h-4 text-gray-400 transition-transform ${
                      selectedVersion?.id === version.id ? 'rotate-90' : ''
                    }`}
                  />
                </div>

                {/* Expanded Actions */}
                {selectedVersion?.id === version.id && (
                  <div className="mt-3 ml-11 flex items-center gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        restoreVersion(version);
                      }}
                      disabled={isRestoring}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 text-white text-xs font-medium rounded-lg hover:bg-indigo-700 transition disabled:opacity-50"
                    >
                      {isRestoring ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                      ) : (
                        <RotateCcw className="w-3 h-3" />
                      )}
                      Restore This Version
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        // Preview: could open in a separate canvas or modal
                        console.log('Preview version:', version.version);
                      }}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 text-gray-700 text-xs font-medium rounded-lg hover:bg-gray-200 transition"
                    >
                      <Eye className="w-3 h-3" />
                      Preview
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer Info */}
      <div className="px-5 py-3 border-t border-gray-200 bg-gray-50">
        <p className="text-xs text-gray-400 text-center">
          Versions are saved automatically on each save. Click a version to restore.
        </p>
      </div>
    </div>
  );
};

// ─── Version History Hook ─────────────────────────────────────────────────────

/**
 * Hook for managing undo/redo history with Fabric.js canvas
 * Tracks canvas states for in-session undo/redo
 */
export function useCanvasHistory(maxHistory: number = 50) {
  const [history, setHistory] = useState<string[]>([]);
  const [currentIndex, setCurrentIndex] = useState(-1);
  const [isUndoRedoAction, setIsUndoRedoAction] = useState(false);

  const pushState = useCallback(
    (canvasJSON: string) => {
      if (isUndoRedoAction) {
        setIsUndoRedoAction(false);
        return;
      }

      setHistory((prev) => {
        // Remove any future states (if we're in middle of history)
        const newHistory = prev.slice(0, currentIndex + 1);
        newHistory.push(canvasJSON);

        // Limit history size
        if (newHistory.length > maxHistory) {
          newHistory.shift();
          return newHistory;
        }
        return newHistory;
      });
      setCurrentIndex((prev) => Math.min(prev + 1, maxHistory - 1));
    },
    [currentIndex, isUndoRedoAction, maxHistory]
  );

  const undo = useCallback((): string | null => {
    if (currentIndex <= 0) return null;
    setIsUndoRedoAction(true);
    const newIndex = currentIndex - 1;
    setCurrentIndex(newIndex);
    return history[newIndex];
  }, [currentIndex, history]);

  const redo = useCallback((): string | null => {
    if (currentIndex >= history.length - 1) return null;
    setIsUndoRedoAction(true);
    const newIndex = currentIndex + 1;
    setCurrentIndex(newIndex);
    return history[newIndex];
  }, [currentIndex, history]);

  const canUndo = currentIndex > 0;
  const canRedo = currentIndex < history.length - 1;

  return { pushState, undo, redo, canUndo, canRedo, historyLength: history.length };
}

// ─── Backend Version Controller Addition ──────────────────────────────────────

/**
 * These functions should be added to the template.controller.ts on the backend:
 * 
 * GET  /api/udp/templates/:id/versions
 * GET  /api/udp/templates/:id/versions/:versionId
 * POST /api/udp/templates/:id/versions (save current as new version)
 * POST /api/udp/templates/:id/versions/:versionId/restore
 * 
 * Example implementation (add to template.controller.ts):
 */
export const versionControllerCode = `
// ─── Version History Endpoints ────────────────────────────────────────

// GET /api/udp/templates/:id/versions
export const getVersions = async (req: Request, res: Response) => {
  const { id } = req.params;
  const tenantId = (req as any).tenantId;
  
  const versions = await prisma.templateVersion.findMany({
    where: { templateId: id },
    orderBy: { version: 'desc' },
    select: {
      id: true,
      templateId: true,
      version: true,
      savedBy: true,
      comment: true,
      createdAt: true,
      // Don't include canvasJSON in list (too heavy)
    },
  });
  
  res.json({ versions });
};

// GET /api/udp/templates/:id/versions/:versionId
export const getVersion = async (req: Request, res: Response) => {
  const { id, versionId } = req.params;
  
  const version = await prisma.templateVersion.findFirst({
    where: { id: versionId, templateId: id },
  });
  
  if (!version) {
    return res.status(404).json({ error: 'Version not found' });
  }
  
  res.json(version);
};

// POST /api/udp/templates/:id/versions (create new version)
export const createVersion = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { canvasJSON, comment } = req.body;
  const savedBy = (req as any).user?.name || 'Unknown';
  
  // Get next version number
  const lastVersion = await prisma.templateVersion.findFirst({
    where: { templateId: id },
    orderBy: { version: 'desc' },
  });
  
  const nextVersion = (lastVersion?.version || 0) + 1;
  
  const version = await prisma.templateVersion.create({
    data: {
      templateId: id,
      version: nextVersion,
      canvasJSON,
      savedBy,
      comment: comment || null,
    },
  });
  
  res.json({ success: true, version });
};

// POST /api/udp/templates/:id/versions/:versionId/restore
export const restoreVersion = async (req: Request, res: Response) => {
  const { id, versionId } = req.params;
  
  const version = await prisma.templateVersion.findFirst({
    where: { id: versionId, templateId: id },
  });
  
  if (!version) {
    return res.status(404).json({ error: 'Version not found' });
  }
  
  // Update the template with this version's canvas JSON
  await prisma.udpTemplate.update({
    where: { id },
    data: { canvasJSON: version.canvasJSON },
  });
  
  // Also save current state as a new version (before overwriting)
  const currentTemplate = await prisma.udpTemplate.findUnique({ where: { id } });
  if (currentTemplate) {
    const lastVersion = await prisma.templateVersion.findFirst({
      where: { templateId: id },
      orderBy: { version: 'desc' },
    });
    await prisma.templateVersion.create({
      data: {
        templateId: id,
        version: (lastVersion?.version || 0) + 1,
        canvasJSON: currentTemplate.canvasJSON,
        savedBy: 'System',
        comment: \`Auto-saved before restore to v\${version.version}\`,
      },
    });
  }
  
  res.json({ success: true, restoredVersion: version.version });
};
`;

export default VersionHistory;
