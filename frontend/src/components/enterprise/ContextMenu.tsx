import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import {
  Eye,
  Edit,
  Trash2,
  Printer,
  Copy,
  Phone,
  Mail,
  CreditCard,
  ChevronRight,
  MessageSquare,
  ArrowUpCircle,
  ArrowRightCircle,
  QrCode,
  FileText,
  UserCheck,
  Clock,
} from "lucide-react";

// ══════════════════════════════════════════════════════════════════
// TYPES
// ══════════════════════════════════════════════════════════════════

export interface MenuItem {
  id: string;
  label: string;
  icon?: React.ReactNode;
  shortcut?: string;
  disabled?: boolean;
  variant?: "danger" | "warning" | "default";
  dividerBefore?: boolean;
  children?: MenuItem[];
}

export interface ContextMenuProps {
  items: MenuItem[];
  position: { x: number; y: number } | null;
  onClose: () => void;
  onSelect: (itemId: string) => void;
  className?: string;
}

// ══════════════════════════════════════════════════════════════════
// DEFAULT STUDENT CONTEXT MENU ITEMS
// ══════════════════════════════════════════════════════════════════

export const DEFAULT_STUDENT_MENU_ITEMS: MenuItem[] = [
  { id: "view", label: "View Profile", icon: <Eye size={14} /> },
  { id: "edit", label: "Edit Student", icon: <Edit size={14} />, shortcut: "E" },
  { id: "print", label: "Print Profile", icon: <Printer size={14} />, shortcut: "Ctrl+P" },
  { id: "copy-id", label: "Copy Admission No", icon: <Copy size={14} /> },
  {
    id: "communicate",
    label: "Communicate",
    icon: <MessageSquare size={14} />,
    dividerBefore: true,
    children: [
      { id: "send-sms", label: "Send SMS", icon: <Phone size={14} /> },
      { id: "send-email", label: "Send Email", icon: <Mail size={14} /> },
      { id: "send-whatsapp", label: "WhatsApp", icon: <MessageSquare size={14} /> },
    ],
  },
  {
    id: "generate",
    label: "Generate",
    icon: <FileText size={14} />,
    children: [
      { id: "gen-id-card", label: "ID Card", icon: <CreditCard size={14} /> },
      { id: "gen-qr", label: "QR Code", icon: <QrCode size={14} /> },
      { id: "gen-certificate", label: "Certificate", icon: <FileText size={14} /> },
    ],
  },
  { id: "promote", label: "Promote", icon: <ArrowUpCircle size={14} />, dividerBefore: true },
  { id: "transfer", label: "Transfer", icon: <ArrowRightCircle size={14} /> },
  { id: "status", label: "Change Status", icon: <UserCheck size={14} /> },
  { id: "timeline", label: "View Timeline", icon: <Clock size={14} /> },
  {
    id: "delete",
    label: "Delete",
    icon: <Trash2 size={14} />,
    variant: "danger",
    dividerBefore: true,
    shortcut: "Del",
  },
];

// ══════════════════════════════════════════════════════════════════
// SUBMENU COMPONENT
// ══════════════════════════════════════════════════════════════════

function SubMenu({
  items,
  parentRect,
  onSelect,
  onClose,
}: {
  items: MenuItem[];
  parentRect: DOMRect;
  onSelect: (id: string) => void;
  onClose: () => void;
}) {
  const subRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState<"right" | "left">("right");

  useEffect(() => {
    if (subRef.current) {
      const rect = subRef.current.getBoundingClientRect();
      if (rect.right > window.innerWidth) {
        setPosition("left");
      }
    }
  }, []);

  return (
    <div
      ref={subRef}
      className={`absolute top-0 ${
        position === "right" ? "left-full ml-0.5" : "right-full mr-0.5"
      } w-48 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg shadow-xl z-[60] py-1 animate-in fade-in zoom-in-95 duration-150`}
    >
      {items.map((item) => (
        <button
          key={item.id}
          onClick={(e) => {
            e.stopPropagation();
            if (!item.disabled) {
              onSelect(item.id);
              onClose();
            }
          }}
          disabled={item.disabled}
          className={`w-full flex items-center gap-2.5 px-3 py-2 text-xs text-left transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${
            item.variant === "danger"
              ? "text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
              : "text-gray-700 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-700"
          }`}
        >
          {item.icon && (
            <span className="flex-shrink-0 text-gray-400 dark:text-slate-500">
              {item.icon}
            </span>
          )}
          <span className="flex-1">{item.label}</span>
          {item.shortcut && (
            <span className="text-[10px] text-gray-400 dark:text-slate-500 font-mono">
              {item.shortcut}
            </span>
          )}
        </button>
      ))}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ══════════════════════════════════════════════════════════════════

export default function ContextMenu({
  items,
  position,
  onClose,
  onSelect,
  className = "",
}: ContextMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const [openSubmenuId, setOpenSubmenuId] = useState<string | null>(null);
  const [adjustedPosition, setAdjustedPosition] = useState<{ x: number; y: number } | null>(null);

  // Flatten items for keyboard nav (skip dividers/submenus for focus)
  const flatItems = useMemo(() => items.filter((i) => !i.children), [items]);

  // Adjust position to keep menu in viewport
  useEffect(() => {
    if (!position || !menuRef.current) {
      setAdjustedPosition(null);
      return;
    }

    const rect = menuRef.current.getBoundingClientRect();
    let x = position.x;
    let y = position.y;

    if (x + rect.width > window.innerWidth) {
      x = window.innerWidth - rect.width - 8;
    }
    if (y + rect.height > window.innerHeight) {
      y = window.innerHeight - rect.height - 8;
    }
    if (x < 8) x = 8;
    if (y < 8) y = 8;

    setAdjustedPosition({ x, y });
  }, [position]);

  // Close on outside click
  useEffect(() => {
    if (!position) return;

    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    }
    function handleScroll() {
      onClose();
    }

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("scroll", handleScroll, true);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("scroll", handleScroll, true);
    };
  }, [position, onClose]);

  // Keyboard navigation
  useEffect(() => {
    if (!position) return;

    function handleKeyDown(e: KeyboardEvent) {
      switch (e.key) {
        case "Escape":
          e.preventDefault();
          onClose();
          break;
        case "ArrowDown":
          e.preventDefault();
          setFocusedIndex((prev) => {
            const next = prev + 1;
            return next >= items.length ? 0 : next;
          });
          break;
        case "ArrowUp":
          e.preventDefault();
          setFocusedIndex((prev) => {
            const next = prev - 1;
            return next < 0 ? items.length - 1 : next;
          });
          break;
        case "Enter":
          e.preventDefault();
          if (focusedIndex >= 0 && focusedIndex < items.length) {
            const item = items[focusedIndex];
            if (item.children) {
              setOpenSubmenuId(item.id);
            } else if (!item.disabled) {
              onSelect(item.id);
              onClose();
            }
          }
          break;
        case "ArrowRight":
          if (focusedIndex >= 0 && items[focusedIndex]?.children) {
            setOpenSubmenuId(items[focusedIndex].id);
          }
          break;
        case "ArrowLeft":
          setOpenSubmenuId(null);
          break;
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [position, onClose, onSelect, items, focusedIndex]);

  // Reset state when position changes
  useEffect(() => {
    setFocusedIndex(-1);
    setOpenSubmenuId(null);
  }, [position]);

  if (!position) return null;

  const pos = adjustedPosition || position;

  return (
    <>
      {/* Backdrop (invisible click catcher) */}
      <div className="fixed inset-0 z-[55]" onClick={onClose} />

      {/* Menu */}
      <div
        ref={menuRef}
        className={`fixed z-[56] w-52 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl shadow-2xl overflow-hidden py-1 animate-in fade-in zoom-in-95 duration-150 origin-top-left ${className}`}
        style={{ top: `${pos.y}px`, left: `${pos.x}px` }}
        role="menu"
        aria-label="Context menu"
      >
        {items.map((item, index) => (
          <React.Fragment key={item.id}>
            {/* Divider */}
            {item.dividerBefore && index > 0 && (
              <div className="my-1 mx-2 h-px bg-gray-100 dark:bg-slate-700" role="separator" />
            )}

            {/* Menu Item */}
            <div
              className="relative"
              onMouseEnter={() => {
                setFocusedIndex(index);
                if (item.children) setOpenSubmenuId(item.id);
                else setOpenSubmenuId(null);
              }}
            >
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (item.children) {
                    setOpenSubmenuId(openSubmenuId === item.id ? null : item.id);
                  } else if (!item.disabled) {
                    onSelect(item.id);
                    onClose();
                  }
                }}
                disabled={item.disabled}
                className={`w-full flex items-center gap-2.5 px-3 py-2 text-xs text-left transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${
                  focusedIndex === index
                    ? "bg-gray-50 dark:bg-slate-700"
                    : ""
                } ${
                  item.variant === "danger"
                    ? "text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
                    : item.variant === "warning"
                    ? "text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-900/20"
                    : "text-gray-700 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-700"
                }`}
                role="menuitem"
                aria-disabled={item.disabled}
              >
                {item.icon && (
                  <span className="flex-shrink-0 opacity-70">{item.icon}</span>
                )}
                <span className="flex-1 font-medium">{item.label}</span>
                {item.shortcut && (
                  <span className="text-[10px] text-gray-400 dark:text-slate-500 font-mono">
                    {item.shortcut}
                  </span>
                )}
                {item.children && (
                  <ChevronRight size={12} className="text-gray-400 dark:text-slate-500" />
                )}
              </button>

              {/* Submenu */}
              {item.children && openSubmenuId === item.id && menuRef.current && (
                <SubMenu
                  items={item.children}
                  parentRect={menuRef.current.getBoundingClientRect()}
                  onSelect={onSelect}
                  onClose={onClose}
                />
              )}
            </div>
          </React.Fragment>
        ))}
      </div>
    </>
  );
}

export { DEFAULT_STUDENT_MENU_ITEMS };
