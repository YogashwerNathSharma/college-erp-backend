import { useState, useEffect, useRef, useCallback } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { getFullUrl } from "../utils/url";
import {
  Search,
  X,
  GraduationCap,
  UserCog,
  BookOpen,
  Bus,
  Award,
  Package,
  FileText,
  Calendar,
  Users,
  IndianRupee,
  Clock,
  ArrowRight,
  Command,
  CornerDownLeft,
} from "lucide-react";

// ═══════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════

interface SearchResult {
  entityType: string;
  entityId: string;
  title: string;
  subtitle?: string;
  description?: string;
  route: string;
  icon?: string;
  category?: string;
}

// ═══════════════════════════════════════════════════════
// ICON MAPPING
// ═══════════════════════════════════════════════════════

const ENTITY_ICONS: Record<string, { icon: any; color: string }> = {
  STUDENT: { icon: GraduationCap, color: "text-blue-500 bg-blue-50 dark:bg-blue-950" },
  STAFF: { icon: UserCog, color: "text-green-500 bg-green-50 dark:bg-green-950" },
  BOOK: { icon: BookOpen, color: "text-rose-500 bg-rose-50 dark:bg-rose-950" },
  VEHICLE: { icon: Bus, color: "text-amber-500 bg-amber-50 dark:bg-amber-950" },
  CERTIFICATE: { icon: Award, color: "text-purple-500 bg-purple-50 dark:bg-purple-950" },
  ASSET: { icon: Package, color: "text-cyan-500 bg-cyan-50 dark:bg-cyan-950" },
  RECEIPT: { icon: IndianRupee, color: "text-emerald-500 bg-emerald-50 dark:bg-emerald-950" },
  EVENT: { icon: Calendar, color: "text-orange-500 bg-orange-50 dark:bg-orange-950" },
  VISITOR: { icon: Users, color: "text-indigo-500 bg-indigo-50 dark:bg-indigo-950" },
};

const ENTITY_LABELS: Record<string, string> = {
  STUDENT: "Student",
  STAFF: "Staff",
  BOOK: "Book",
  VEHICLE: "Vehicle",
  CERTIFICATE: "Certificate",
  ASSET: "Asset",
  RECEIPT: "Receipt",
  EVENT: "Event",
  VISITOR: "Visitor",
};

// ═══════════════════════════════════════════════════════
// GLOBAL SEARCH COMPONENT
// ═══════════════════════════════════════════════════════

export default function GlobalSearch() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [grouped, setGrouped] = useState<Record<string, SearchResult[]>>({});
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);

  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ─────────────────────────────────────────────────────
  // KEYBOARD SHORTCUT (Cmd+K or Ctrl+K)
  // ─────────────────────────────────────────────────────

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setIsOpen(true);
      }
      if (e.key === "/" && !isOpen) {
        const target = e.target as HTMLElement;
        if (target.tagName !== "INPUT" && target.tagName !== "TEXTAREA") {
          e.preventDefault();
          setIsOpen(true);
        }
      }
      if (e.key === "Escape") {
        setIsOpen(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  // Focus input when modal opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
      loadRecentSearches();
    } else {
      setQuery("");
      setResults([]);
      setGrouped({});
      setSelectedIndex(0);
    }
  }, [isOpen]);

  // ─────────────────────────────────────────────────────
  // SEARCH
  // ─────────────────────────────────────────────────────

  useEffect(() => {
    if (debounceTimer.current) clearTimeout(debounceTimer.current);

    if (query.length < 2) {
      setResults([]);
      setGrouped({});
      return;
    }

    debounceTimer.current = setTimeout(() => {
      performSearch(query);
    }, 300);

    return () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
    };
  }, [query]);

  const performSearch = async (searchQuery: string) => {
    try {
      setLoading(true);
      const res = await axios.get(getFullUrl("/api/search"), {
        params: { q: searchQuery, limit: 20 },
      });
      setResults(res.data.data.results);
      setGrouped(res.data.data.grouped);
      setSelectedIndex(0);
    } catch (error) {
      console.error("Search failed:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadRecentSearches = () => {
    const saved = localStorage.getItem("erp_recent_searches");
    if (saved) {
      setRecentSearches(JSON.parse(saved));
    }
  };

  const saveRecentSearch = (term: string) => {
    const existing = JSON.parse(localStorage.getItem("erp_recent_searches") || "[]");
    const updated = [term, ...existing.filter((s: string) => s !== term)].slice(0, 8);
    localStorage.setItem("erp_recent_searches", JSON.stringify(updated));
  };

  // ─────────────────────────────────────────────────────
  // NAVIGATION
  // ─────────────────────────────────────────────────────

  const handleSelect = (result: SearchResult) => {
    saveRecentSearch(query);
    setIsOpen(false);
    navigate(result.route);
  };

  const handleKeyboardNav = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => Math.min(prev + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => Math.max(prev - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (results[selectedIndex]) {
        handleSelect(results[selectedIndex]);
      }
    }
  };

  // ─────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────

  if (!isOpen) {
    // Compact search trigger button (for TopNavbar)
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 px-3 py-2 bg-gray-100 dark:bg-slate-700 rounded-full hover:bg-gray-200 dark:hover:bg-slate-600 transition-colors text-sm text-gray-500 dark:text-gray-400 w-full max-w-xs"
      >
        <Search size={16} />
        <span className="hidden sm:inline">Search anything...</span>
        <kbd className="hidden md:inline-flex items-center gap-0.5 ml-auto px-1.5 py-0.5 bg-white dark:bg-slate-600 rounded text-[10px] font-mono text-gray-400 border border-gray-200 dark:border-slate-500">
          <Command size={10} />K
        </kbd>
      </button>
    );
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[10vh] p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={() => setIsOpen(false)}
      />

      {/* Search Modal */}
      <div className="relative w-full max-w-2xl bg-white dark:bg-slate-800 rounded-2xl shadow-2xl overflow-hidden border border-gray-200 dark:border-slate-700">
        {/* Search Input */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-100 dark:border-slate-700">
          <Search size={20} className="text-gray-400 flex-shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyboardNav}
            placeholder="Search students, staff, books, vehicles, receipts..."
            className="flex-1 bg-transparent outline-none text-base text-gray-900 dark:text-white placeholder-gray-400"
          />
          {query && (
            <button onClick={() => setQuery("")} className="p-1 rounded hover:bg-gray-100 dark:hover:bg-slate-700">
              <X size={16} className="text-gray-400" />
            </button>
          )}
          <kbd className="hidden sm:flex items-center px-2 py-1 bg-gray-100 dark:bg-slate-700 rounded text-xs text-gray-400 border border-gray-200 dark:border-slate-600">
            ESC
          </kbd>
        </div>

        {/* Results */}
        <div className="max-h-[60vh] overflow-y-auto">
          {/* Loading */}
          {loading && (
            <div className="flex items-center justify-center py-8">
              <div className="w-6 h-6 border-3 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
            </div>
          )}

          {/* Results grouped by type */}
          {!loading && Object.keys(grouped).length > 0 && (
            <div className="py-2">
              {Object.entries(grouped).map(([type, items]) => {
                const config = ENTITY_ICONS[type] || { icon: FileText, color: "text-gray-500 bg-gray-50" };
                const Icon = config.icon;
                return (
                  <div key={type} className="mb-1">
                    <div className="px-5 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                      {ENTITY_LABELS[type] || type} ({items.length})
                    </div>
                    {items.map((result, idx) => {
                      const globalIdx = results.indexOf(result);
                      return (
                        <button
                          key={`${result.entityType}-${result.entityId}`}
                          onClick={() => handleSelect(result)}
                          className={`w-full flex items-center gap-3 px-5 py-3 text-left transition-colors ${
                            globalIdx === selectedIndex
                              ? "bg-indigo-50 dark:bg-indigo-950/50"
                              : "hover:bg-gray-50 dark:hover:bg-slate-700/50"
                          }`}
                        >
                          <div className={`w-9 h-9 rounded-lg ${config.color} flex items-center justify-center flex-shrink-0`}>
                            <Icon size={16} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                              {result.title}
                            </p>
                            {result.subtitle && (
                              <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                                {result.subtitle}
                              </p>
                            )}
                          </div>
                          <ArrowRight size={14} className="text-gray-300 flex-shrink-0" />
                        </button>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          )}

          {/* No Results */}
          {!loading && query.length >= 2 && results.length === 0 && (
            <div className="py-12 text-center">
              <Search size={32} className="mx-auto text-gray-300 mb-3" />
              <p className="text-sm text-gray-500">No results found for "{query}"</p>
              <p className="text-xs text-gray-400 mt-1">Try different keywords or check spelling</p>
            </div>
          )}

          {/* Recent Searches (when no query) */}
          {!loading && query.length < 2 && recentSearches.length > 0 && (
            <div className="py-2">
              <div className="px-5 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                Recent Searches
              </div>
              {recentSearches.map((term, idx) => (
                <button
                  key={idx}
                  onClick={() => setQuery(term)}
                  className="w-full flex items-center gap-3 px-5 py-2.5 text-left hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors"
                >
                  <Clock size={14} className="text-gray-400" />
                  <span className="text-sm text-gray-700 dark:text-gray-300">{term}</span>
                </button>
              ))}
            </div>
          )}

          {/* Quick Links (when no query and no recent) */}
          {!loading && query.length < 2 && recentSearches.length === 0 && (
            <div className="py-6 px-5">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Quick Access</p>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { label: "Students", route: "/students", icon: GraduationCap, color: "text-blue-500" },
                  { label: "Teachers", route: "/teachers", icon: UserCog, color: "text-green-500" },
                  { label: "Fee Collection", route: "/fees/collection", icon: IndianRupee, color: "text-emerald-500" },
                  { label: "Library", route: "/library", icon: BookOpen, color: "text-rose-500" },
                  { label: "Transport", route: "/transport", icon: Bus, color: "text-amber-500" },
                  { label: "Reports", route: "/reports", icon: FileText, color: "text-indigo-500" },
                ].map((link) => (
                  <button
                    key={link.route}
                    onClick={() => { setIsOpen(false); navigate(link.route); }}
                    className="flex items-center gap-2 p-2.5 rounded-lg border border-gray-100 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors"
                  >
                    <link.icon size={16} className={link.color} />
                    <span className="text-sm text-gray-700 dark:text-gray-300">{link.label}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-5 py-3 bg-gray-50 dark:bg-slate-700/50 border-t border-gray-100 dark:border-slate-700 text-xs text-gray-400">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-white dark:bg-slate-600 rounded border border-gray-200 dark:border-slate-500 text-[10px]">↑↓</kbd>
              Navigate
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-white dark:bg-slate-600 rounded border border-gray-200 dark:border-slate-500 text-[10px]">
                <CornerDownLeft size={9} />
              </kbd>
              Select
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-white dark:bg-slate-600 rounded border border-gray-200 dark:border-slate-500 text-[10px]">Esc</kbd>
              Close
            </span>
          </div>
          <span>{results.length > 0 ? `${results.length} results` : "Type to search"}</span>
        </div>
      </div>
    </div>
  );
}
