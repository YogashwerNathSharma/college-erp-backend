import React, { useState, useCallback, useMemo } from "react";
import {
  Trash2,
  Download,
  Mail,
  MessageSquare,
  Phone,
  Printer,
  CreditCard,
  Award,
  ArrowUpCircle,
  ArrowRightCircle,
  ToggleLeft,
  X,
  AlertTriangle,
  Check,
} from "lucide-react";

// ══════════════════════════════════════════════════════════════════
// TYPES
// ══════════════════════════════════════════════════════════════════

export interface BulkAction {
  id: string;
  label: string;
  icon?: React.ReactNode;
  variant?: "danger" | "warning" | "primary" | "success" | "default";
  confirmMessage?: string;
  requireConfirm?: boolean;
  disabled?: boolean;
  tooltip?: string;
}

export interface BulkActionBarProps {
  selectedCount: number;
  totalCount?: number;
  actions: BulkAction[];
  onAction: (actionId: string) => void;
  onDeselect: () => void;
  onSelectAll?: () => void;
  className?: string;
}

// ══════════════════════════════════════════════════════════════════
// DEFAULT STUDENT BULK ACTIONS
// ══════════════════════════════════════════════════════════════════

export const DEFAULT_STUDENT_BULK_ACTIONS: BulkAction[] = [
  {
    id: "export",
    label: "Export",
    icon: <Download size={15} />,
    variant: "default",
  },
  {
    id: "print",
    label: "Print",
    icon: <Printer size={15} />,
    variant: "default",
  },
  {
    id: "sms",
    label: "SMS",
    icon: <Phone size={15} />,
    variant: "primary",
  },
  {
    id: "email",
    label: "Email",
    icon: <Mail size={15} />,
    variant: "primary",
  },
  {
    id: "whatsapp",
    label: "WhatsApp",
    icon: <MessageSquare size={15} />,
    variant: "success",
  },
  {
    id: "id-card",
    label: "ID Card",
    icon: <CreditCard size={15} />,
    variant: "default",
  },
  {
    id: "certificate",
    label: "Certificate",
    icon: <Award size={15} />,
    variant: "default",
  },
  {
    id: "promote",
    label: "Promote",
    icon: <ArrowUpCircle size={15} />,
    variant: "primary",
    requireConfirm: true,
    confirmMessage: "Are you sure you want to promote the selected students?",
  },
  {
    id: "transfer",
    label: "Transfer",
    icon: <ArrowRightCircle size={15} />,
    variant: "warning",
    requireConfirm: true,
    confirmMessage: "This will transfer selected students. Continue?",
  },
  {
    id: "status",
    label: "Status",
    icon: <ToggleLeft size={15} />,
    variant: "warning",
  },
  {
    id: "delete",
    label: "Delete",
    icon: <Trash2 size={15} />,
    variant: "danger",
    requireConfirm: true,
    confirmMessage: "Are you sure you want to delete the selected students? This action can be undone from recycle bin.",
  },
];

// ══════════════════════════════════════════════════════════════════
// CONFIRMATION DIALOG (inline)
// ══════════════════════════════════════════════════════════════════

function InlineConfirmDialog({
  message,
  onConfirm,
  onCancel,
  variant = "danger",
}: {
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  variant?: string;
}) {
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-[2px]"
        onClick={onCancel}
      />
      <div className="relative bg-white dark:bg-slate-800 rounded-xl shadow-2xl w-full max-w-sm mx-4 p-5 animate-in zoom-in-95 duration-200">
        <div className="flex items-start gap-3">
          <div
            className={`flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center ${
              variant === "danger"
                ? "bg-red-100 dark:bg-red-900/30"
                : "bg-amber-100 dark:bg-amber-900/30"
            }`}
          >
            <AlertTriangle
              size={18}
              className={
                variant === "danger"
                  ? "text-red-600 dark:text-red-400"
                  : "text-amber-600 dark:text-amber-400"
              }
            />
          </div>
          <div className="flex-1">
            <h4 className="text-sm font-semibold text-gray-800 dark:text-slate-200 mb-1">
              Confirm Action
            </h4>
            <p className="text-xs text-gray-600 dark:text-slate-400 leading-relaxed">
              {message}
            </p>
          </div>
        </div>
        <div className="flex gap-2 mt-4 justify-end">
          <button
            onClick={onCancel}
            className="px-3.5 py-2 text-xs font-medium text-gray-600 dark:text-slate-400 bg-gray-100 dark:bg-slate-700 rounded-lg hover:bg-gray-200 dark:hover:bg-slate-600 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className={`px-3.5 py-2 text-xs font-medium text-white rounded-lg transition-colors ${
              variant === "danger"
                ? "bg-red-500 hover:bg-red-600"
                : "bg-amber-500 hover:bg-amber-600"
            }`}
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ══════════════════════════════════════════════════════════════════

export default function BulkActionBar({
  selectedCount,
  totalCount,
  actions,
  onAction,
  onDeselect,
  onSelectAll,
  className = "",
}: BulkActionBarProps) {
  const [confirmAction, setConfirmAction] = useState<BulkAction | null>(null);

  const handleActionClick = useCallback(
    (action: BulkAction) => {
      if (action.requireConfirm) {
        setConfirmAction(action);
      } else {
        onAction(action.id);
      }
    },
    [onAction]
  );

  const handleConfirm = useCallback(() => {
    if (confirmAction) {
      onAction(confirmAction.id);
      setConfirmAction(null);
    }
  }, [confirmAction, onAction]);

  // Variant color mapping
  const getButtonClasses = useCallback((variant: string = "default") => {
    switch (variant) {
      case "danger":
        return "text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 border-red-200 dark:border-red-800";
      case "warning":
        return "text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-900/20 border-amber-200 dark:border-amber-800";
      case "primary":
        return "text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 border-indigo-200 dark:border-indigo-800";
      case "success":
        return "text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800";
      default:
        return "text-gray-600 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-700 border-gray-200 dark:border-slate-600";
    }
  }, []);

  if (selectedCount === 0) return null;

  return (
    <>
      {/* Floating Bar */}
      <div
        className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-bottom-4 duration-300 ${className}`}
      >
        <div className="flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-2xl shadow-2xl shadow-black/10 dark:shadow-black/30 backdrop-blur-lg">
          {/* Selection Info */}
          <div className="flex items-center gap-2 pr-3 border-r border-gray-200 dark:border-slate-700">
            <div className="flex items-center justify-center w-7 h-7 rounded-full bg-indigo-100 dark:bg-indigo-900/30">
              <Check size={14} className="text-indigo-600 dark:text-indigo-400" />
            </div>
            <div className="flex flex-col">
              <span className="text-xs font-semibold text-gray-800 dark:text-slate-200 leading-tight">
                {selectedCount} selected
              </span>
              {totalCount && (
                <span className="text-[10px] text-gray-400 dark:text-slate-500 leading-tight">
                  of {totalCount} total
                </span>
              )}
            </div>
          </div>

          {/* Select All (if not all selected) */}
          {onSelectAll && totalCount && selectedCount < totalCount && (
            <button
              onClick={onSelectAll}
              className="px-2.5 py-1.5 text-[11px] font-medium text-indigo-500 hover:text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-md transition-colors whitespace-nowrap"
            >
              Select All ({totalCount})
            </button>
          )}

          {/* Divider */}
          <div className="w-px h-6 bg-gray-200 dark:bg-slate-700 mx-1" />

          {/* Action Buttons */}
          <div className="flex items-center gap-1">
            {actions.map((action) => (
              <button
                key={action.id}
                onClick={() => handleActionClick(action)}
                disabled={action.disabled}
                className={`group relative flex items-center gap-1.5 px-2.5 py-1.5 text-[11px] font-medium border rounded-lg transition-all disabled:opacity-40 disabled:cursor-not-allowed ${getButtonClasses(
                  action.variant
                )}`}
                aria-label={action.tooltip || action.label}
              >
                {action.icon}
                <span className="hidden md:inline">{action.label}</span>

                {/* Tooltip */}
                {action.tooltip && (
                  <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 text-[10px] text-white bg-gray-900 dark:bg-slate-700 rounded whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity">
                    {action.tooltip}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Divider */}
          <div className="w-px h-6 bg-gray-200 dark:bg-slate-700 mx-1" />

          {/* Deselect */}
          <button
            onClick={onDeselect}
            className="flex items-center gap-1 px-2.5 py-1.5 text-[11px] font-medium text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-200 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
            aria-label="Deselect all"
          >
            <X size={13} />
            <span className="hidden sm:inline">Clear</span>
          </button>
        </div>
      </div>

      {/* Confirmation Dialog */}
      {confirmAction && (
        <InlineConfirmDialog
          message={
            confirmAction.confirmMessage ||
            `Are you sure you want to ${confirmAction.label.toLowerCase()} ${selectedCount} student${
              selectedCount > 1 ? "s" : ""
            }?`
          }
          onConfirm={handleConfirm}
          onCancel={() => setConfirmAction(null)}
          variant={confirmAction.variant}
        />
      )}
    </>
  );
}

export { DEFAULT_STUDENT_BULK_ACTIONS };
