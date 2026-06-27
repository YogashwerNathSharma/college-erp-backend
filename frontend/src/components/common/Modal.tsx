import { ReactNode, useEffect, useRef, useState, useCallback } from "react";
import { X } from "lucide-react";

//////////////////////////////////////////////////////
// 🪟 MOBILE-FIRST MODAL COMPONENT
// - Desktop: centered overlay with animation
// - Mobile: full-screen bottom sheet
// - Swipe down to dismiss on mobile
// - Focus trap for accessibility
// - Multiple sizes (sm, md, lg, xl, full)
//////////////////////////////////////////////////////

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  size?: "sm" | "md" | "lg" | "xl" | "full";
  showCloseButton?: boolean;
  footer?: ReactNode;
  preventClose?: boolean;
  className?: string;
}

const sizeClasses = {
  sm: "max-w-sm",
  md: "max-w-md",
  lg: "max-w-lg",
  xl: "max-w-2xl",
  full: "max-w-full mx-4",
};

export default function Modal({
  isOpen,
  onClose,
  title,
  children,
  size = "md",
  showCloseButton = true,
  footer,
  preventClose = false,
  className = "",
}: ModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchDelta, setTouchDelta] = useState(0);
  const [isMobile, setIsMobile] = useState(false);
  const [isClosing, setIsClosing] = useState(false);

  // Detect mobile
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  // Lock body scroll
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [isOpen]);

  // Focus trap
  useEffect(() => {
    if (!isOpen || !modalRef.current) return;

    const focusableElements = modalRef.current.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    const firstFocusable = focusableElements[0] as HTMLElement;
    const lastFocusable = focusableElements[focusableElements.length - 1] as HTMLElement;

    const handleTab = (e: KeyboardEvent) => {
      if (e.key !== "Tab") return;
      if (e.shiftKey) {
        if (document.activeElement === firstFocusable) {
          e.preventDefault();
          lastFocusable?.focus();
        }
      } else {
        if (document.activeElement === lastFocusable) {
          e.preventDefault();
          firstFocusable?.focus();
        }
      }
    };

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !preventClose) {
        handleClose();
      }
    };

    document.addEventListener("keydown", handleTab);
    document.addEventListener("keydown", handleEscape);
    firstFocusable?.focus();

    return () => {
      document.removeEventListener("keydown", handleTab);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen, preventClose]);

  const handleClose = useCallback(() => {
    if (preventClose) return;
    setIsClosing(true);
    setTimeout(() => {
      setIsClosing(false);
      onClose();
    }, 200);
  }, [onClose, preventClose]);

  // Touch handling for mobile swipe-to-dismiss
  const handleTouchStart = (e: React.TouchEvent) => {
    if (!isMobile) return;
    // Only allow swipe from the header/drag-handle area
    const target = e.target as HTMLElement;
    if (target.closest('.modal-body-content')) return;
    setTouchStart(e.touches[0].clientY);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (touchStart === null || !isMobile) return;
    const delta = e.touches[0].clientY - touchStart;
    if (delta > 0) {
      setTouchDelta(delta);
    }
  };

  const handleTouchEnd = () => {
    if (!isMobile) return;
    if (touchDelta > 100) {
      handleClose();
    }
    setTouchStart(null);
    setTouchDelta(0);
  };

  if (!isOpen && !isClosing) return null;

  const mobileTransform = touchDelta > 0 ? `translateY(${touchDelta}px)` : undefined;
  const mobileOpacity = touchDelta > 0 ? Math.max(0.3, 1 - touchDelta / 300) : 1;

  return (
    <div
      ref={modalRef}
      className={`fixed inset-0 z-[9999] flex ${isMobile ? "items-end" : "items-center justify-center"} p-0 md:p-4`}
      role="dialog"
      aria-modal="true"
      aria-labelledby={title ? "modal-title" : undefined}
    >
      {/* Backdrop */}
      <div
        className={`absolute inset-0 bg-black/50 transition-opacity duration-200 ${
          isClosing ? "opacity-0" : "opacity-100 animate-fade-in"
        }`}
        style={{ opacity: mobileOpacity }}
        onClick={handleClose}
        aria-hidden="true"
      />

      {/* Modal Content */}
      <div
        ref={contentRef}
        className={`relative bg-white dark:bg-slate-800 shadow-2xl w-full transition-all duration-200 ${
          isMobile
            ? `rounded-t-2xl max-h-[92vh] ${isClosing ? "translate-y-full" : "animate-slide-up"}`
            : `rounded-2xl ${sizeClasses[size]} max-h-[90vh] ${isClosing ? "opacity-0 scale-95" : "animate-scale-in"}`
        } ${className}`}
        style={isMobile ? { transform: mobileTransform } : undefined}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Mobile drag handle */}
        {isMobile && (
          <div className="flex justify-center pt-3 pb-1 cursor-grab active:cursor-grabbing">
            <div className="w-10 h-1 rounded-full bg-gray-300 dark:bg-slate-600" />
          </div>
        )}

        {/* Header */}
        {(title || showCloseButton) && (
          <div className="flex items-center justify-between px-5 md:px-6 py-3 md:py-4 border-b border-gray-100 dark:border-slate-700">
            {title && (
              <h3 id="modal-title" className="text-base md:text-lg font-semibold text-gray-900 dark:text-white">
                {title}
              </h3>
            )}
            {showCloseButton && !preventClose && (
              <button
                onClick={handleClose}
                className="tap-target rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors ml-auto"
                aria-label="Close modal"
              >
                <X size={20} />
              </button>
            )}
          </div>
        )}

        {/* Body */}
        <div className="modal-body-content px-5 md:px-6 py-4 overflow-y-auto scrollbar-thin" style={{ maxHeight: isMobile ? "calc(92vh - 120px)" : "calc(90vh - 140px)" }}>
          {children}
        </div>

        {/* Footer */}
        {footer && (
          <div className="px-5 md:px-6 py-3 md:py-4 border-t border-gray-100 dark:border-slate-700 flex items-center justify-end gap-3 pb-safe">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
