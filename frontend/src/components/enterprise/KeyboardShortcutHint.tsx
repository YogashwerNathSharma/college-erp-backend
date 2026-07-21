import React, { useState, useEffect, useCallback } from "react";
import { X, Keyboard, Command } from "lucide-react";

// ══════════════════════════════════════════════════════════════════
// TYPES
// ══════════════════════════════════════════════════════════════════

export interface ShortcutDef {
  keys: string[];
  description: string;
  category: string;
}

export interface KeyboardShortcutHintProps {
  shortcuts?: ShortcutDef[];
  onShortcut?: (keys: string[]) => void;
  showFloatingHint?: boolean;
  className?: string;
}

// ══════════════════════════════════════════════════════════════════
// DEFAULT SHORTCUTS
// ══════════════════════════════════════════════════════════════════

const DEFAULT_SHORTCUTS: ShortcutDef[] = [
  // Navigation
  { keys: ["↑", "↓"], description: "Navigate rows", category: "Navigation" },
  { keys: ["Enter"], description: "Open selected student", category: "Navigation" },
  { keys: ["Esc"], description: "Close modal / Deselect", category: "Navigation" },
  { keys: ["Home"], description: "Go to first page", category: "Navigation" },
  { keys: ["End"], description: "Go to last page", category: "Navigation" },
  { keys: ["←", "→"], description: "Previous / Next page", category: "Navigation" },

  // Selection
  { keys: ["Space"], description: "Select / Deselect row", category: "Selection" },
  { keys: ["Ctrl", "A"], description: "Select all on page", category: "Selection" },
  { keys: ["Ctrl", "Shift", "A"], description: "Deselect all", category: "Selection" },

  // Actions
  { keys: ["Ctrl", "N"], description: "New student admission", category: "Actions" },
  { keys: ["Ctrl", "F"], description: "Focus search / Advanced search", category: "Actions" },
  { keys: ["Ctrl", "P"], description: "Print current view", category: "Actions" },
  { keys: ["Ctrl", "E"], description: "Export to Excel", category: "Actions" },
  { keys: ["Ctrl", "S"], description: "Save changes", category: "Actions" },
  { keys: ["Del"], description: "Delete selected", category: "Actions" },
  { keys: ["Ctrl", "D"], description: "Duplicate / Clone", category: "Actions" },
  { keys: ["Ctrl", "R"], description: "Refresh data", category: "Actions" },

  // Search & Filter
  { keys: ["/"], description: "Quick search", category: "Search" },
  { keys: ["Ctrl", "Shift", "F"], description: "Toggle advanced search", category: "Search" },
  { keys: ["Ctrl", "Shift", "S"], description: "Save current filter", category: "Search" },
  { keys: ["Ctrl", "Shift", "R"], description: "Reset all filters", category: "Search" },
];

// ══════════════════════════════════════════════════════════════════
// KEY BADGE COMPONENT
// ══════════════════════════════════════════════════════════════════

function KeyBadge({ keyLabel }: { keyLabel: string }) {
  const isSpecial = ["Ctrl", "Shift", "Alt", "Cmd", "⌘"].includes(keyLabel);

  return (
    <kbd
      className={`inline-flex items-center justify-center min-w-[24px] h-6 px-1.5 text-[10px] font-semibold rounded-md border shadow-sm ${
        isSpecial
          ? "bg-gray-100 dark:bg-slate-700 border-gray-300 dark:border-slate-600 text-gray-600 dark:text-slate-300"
          : "bg-white dark:bg-slate-800 border-gray-300 dark:border-slate-600 text-gray-800 dark:text-slate-200"
      }`}
    >
      {keyLabel}
    </kbd>
  );
}

// ══════════════════════════════════════════════════════════════════
// FLOATING HINT COMPONENT
// ══════════════════════════════════════════════════════════════════

function FloatingHint({ onDismiss, onClick }: { onDismiss: () => void; onClick: () => void }) {
  return (
    <div className="fixed bottom-4 right-4 z-40 animate-in slide-in-from-bottom-2 duration-300">
      <div className="flex items-center gap-2 px-3 py-2 bg-gray-900/90 dark:bg-slate-700/90 backdrop-blur-sm rounded-lg shadow-lg">
        <button
          onClick={onClick}
          className="flex items-center gap-1.5 text-[11px] text-gray-200 dark:text-slate-300 hover:text-white transition-colors"
        >
          <Keyboard size={13} className="text-gray-400 dark:text-slate-400" />
          Press <KeyBadge keyLabel="?" /> for shortcuts
        </button>
        <button
          onClick={onDismiss}
          className="p-0.5 text-gray-500 hover:text-gray-300 transition-colors"
          aria-label="Dismiss hint"
        >
          <X size={12} />
        </button>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════
// SHORTCUTS MODAL
// ══════════════════════════════════════════════════════════════════

function ShortcutsModal({
  shortcuts,
  onClose,
}: {
  shortcuts: ShortcutDef[];
  onClose: () => void;
}) {
  // Group by category
  const categories = shortcuts.reduce<Record<string, ShortcutDef[]>>((acc, s) => {
    if (!acc[s.category]) acc[s.category] = [];
    acc[s.category].push(s);
    return acc;
  }, {});

  const categoryOrder = ["Navigation", "Selection", "Actions", "Search"];
  const sortedCategories = categoryOrder.filter((c) => categories[c]);

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-[2px]"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden animate-in zoom-in-95 fade-in duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-slate-700">
          <div className="flex items-center gap-2.5">
            <div className="flex items-center justify-center w-8 h-8 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg">
              <Keyboard size={16} className="text-indigo-600 dark:text-indigo-400" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-gray-800 dark:text-slate-200">
                Keyboard Shortcuts
              </h2>
              <p className="text-[10px] text-gray-400 dark:text-slate-500">
                Student Module Quick Actions
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="max-h-[60vh] overflow-y-auto px-6 py-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {sortedCategories.map((category) => (
              <div key={category}>
                <h3 className="text-[10px] font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider mb-2.5">
                  {category}
                </h3>
                <div className="space-y-2">
                  {categories[category].map((shortcut, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between py-1.5"
                    >
                      <span className="text-xs text-gray-600 dark:text-slate-300">
                        {shortcut.description}
                      </span>
                      <div className="flex items-center gap-0.5">
                        {shortcut.keys.map((key, ki) => (
                          <React.Fragment key={ki}>
                            {ki > 0 && (
                              <span className="text-[10px] text-gray-300 dark:text-slate-600 mx-0.5">
                                +
                              </span>
                            )}
                            <KeyBadge keyLabel={key} />
                          </React.Fragment>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-gray-100 dark:border-slate-700 bg-gray-50/50 dark:bg-slate-800/50">
          <p className="text-[10px] text-gray-400 dark:text-slate-500 text-center">
            Press <KeyBadge keyLabel="?" /> anytime to toggle this panel • Press{" "}
            <KeyBadge keyLabel="Esc" /> to close
          </p>
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ══════════════════════════════════════════════════════════════════

export default function KeyboardShortcutHint({
  shortcuts = DEFAULT_SHORTCUTS,
  onShortcut,
  showFloatingHint: showHintProp = true,
  className = "",
}: KeyboardShortcutHintProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showHint, setShowHint] = useState(() => {
    try {
      return localStorage.getItem("kb_hint_dismissed") !== "true";
    } catch {
      return true;
    }
  });

  // Listen for "?" key to open modal
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      // Don't trigger if typing in an input/textarea
      const target = e.target as HTMLElement;
      if (
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable
      ) {
        return;
      }

      if (e.key === "?" && !e.ctrlKey && !e.altKey && !e.metaKey) {
        e.preventDefault();
        setIsModalOpen((prev) => !prev);
      }

      // Escape to close modal
      if (e.key === "Escape" && isModalOpen) {
        setIsModalOpen(false);
      }

      // Forward shortcut events
      if (onShortcut) {
        const keys: string[] = [];
        if (e.ctrlKey || e.metaKey) keys.push("Ctrl");
        if (e.shiftKey) keys.push("Shift");
        if (e.altKey) keys.push("Alt");
        if (e.key !== "Control" && e.key !== "Shift" && e.key !== "Alt" && e.key !== "Meta") {
          keys.push(e.key.length === 1 ? e.key.toUpperCase() : e.key);
        }

        // Check if this matches any defined shortcut
        const matched = shortcuts.find(
          (s) =>
            s.keys.length === keys.length &&
            s.keys.every((k, i) => k.toUpperCase() === keys[i].toUpperCase())
        );

        if (matched) {
          e.preventDefault();
          onShortcut(matched.keys);
        }
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isModalOpen, onShortcut, shortcuts]);

  // Dismiss floating hint
  const dismissHint = useCallback(() => {
    setShowHint(false);
    try {
      localStorage.setItem("kb_hint_dismissed", "true");
    } catch {}
  }, []);

  return (
    <div className={className}>
      {/* Floating Hint */}
      {showHintProp && showHint && !isModalOpen && (
        <FloatingHint
          onDismiss={dismissHint}
          onClick={() => setIsModalOpen(true)}
        />
      )}

      {/* Shortcuts Modal */}
      {isModalOpen && (
        <ShortcutsModal
          shortcuts={shortcuts}
          onClose={() => setIsModalOpen(false)}
        />
      )}
    </div>
  );
}

export { DEFAULT_SHORTCUTS, KeyBadge };
export type { ShortcutDef };
