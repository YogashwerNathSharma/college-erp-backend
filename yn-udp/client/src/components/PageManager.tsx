import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  Plus,
  Copy,
  Trash2,
  ChevronLeft,
  ChevronRight,
  FileText,
  Maximize2,
  MoreVertical,
  GripVertical,
} from 'lucide-react';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface Page {
  id: string;
  name: string;
  width: number;
  height: number;
  canvasJSON: object;
  thumbnail?: string;
}

export interface PageSize {
  label: string;
  width: number;
  height: number;
  category: string;
}

export const PAGE_SIZES: PageSize[] = [
  { label: 'A4 Portrait', width: 595, height: 842, category: 'Standard' },
  { label: 'A4 Landscape', width: 842, height: 595, category: 'Standard' },
  { label: 'A3 Portrait', width: 842, height: 1191, category: 'Standard' },
  { label: 'A3 Landscape', width: 1191, height: 842, category: 'Standard' },
  { label: 'Letter Portrait', width: 612, height: 792, category: 'Standard' },
  { label: 'Letter Landscape', width: 792, height: 612, category: 'Standard' },
  { label: 'A5 Portrait', width: 420, height: 595, category: 'Standard' },
  { label: 'A5 Landscape', width: 595, height: 420, category: 'Standard' },
  { label: 'ID Card (CR80)', width: 243, height: 153, category: 'Card' },
  { label: 'ID Card (CR80) Portrait', width: 153, height: 243, category: 'Card' },
  { label: 'Certificate (A3 Landscape)', width: 1191, height: 842, category: 'Certificate' },
  { label: 'Certificate (A4 Landscape)', width: 842, height: 595, category: 'Certificate' },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

function generateId(): string {
  return `page_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

function createEmptyPage(pageSize?: PageSize, index?: number): Page {
  const size = pageSize || PAGE_SIZES[0]; // Default A4 Portrait
  return {
    id: generateId(),
    name: `Page ${(index ?? 0) + 1}`,
    width: size.width,
    height: size.height,
    canvasJSON: { version: '5.3.0', objects: [] },
    thumbnail: undefined,
  };
}

// ─── Props ───────────────────────────────────────────────────────────────────

interface PageManagerProps {
  pages: Page[];
  activePageIndex: number;
  onPagesChange: (pages: Page[]) => void;
  onActivePageChange: (index: number) => void;
  onPageSwitch: (page: Page, index: number) => void;
  canvas?: fabric.Canvas | null;
  className?: string;
}

// ─── Component ───────────────────────────────────────────────────────────────

const PageManager: React.FC<PageManagerProps> = ({
  pages,
  activePageIndex,
  onPagesChange,
  onActivePageChange,
  onPageSwitch,
  canvas,
  className = '',
}) => {
  const [showSizeDropdown, setShowSizeDropdown] = useState(false);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; pageIndex: number } | null>(null);
  const [renamingIndex, setRenamingIndex] = useState<number | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const thumbnailsRef = useRef<HTMLDivElement>(null);
  const sizeDropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (sizeDropdownRef.current && !sizeDropdownRef.current.contains(e.target as Node)) {
        setShowSizeDropdown(false);
      }
      if (contextMenu) {
        setContextMenu(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [contextMenu]);

  // ─── Save current canvas to active page ──────────────────────────────────

  const saveCurrentPageState = useCallback(() => {
    if (!canvas) return pages;
    const currentJSON = canvas.toJSON(['id', 'name', 'lockLevel', 'conditions', 'dataSource']);
    const thumbnail = canvas.toDataURL({
      format: 'png',
      quality: 0.3,
      multiplier: 0.2,
    });
    const updatedPages = [...pages];
    updatedPages[activePageIndex] = {
      ...updatedPages[activePageIndex],
      canvasJSON: currentJSON,
      thumbnail,
    };
    return updatedPages;
  }, [canvas, pages, activePageIndex]);

  // ─── Add Page ─────────────────────────────────────────────────────────────

  const handleAddPage = useCallback(
    (pageSize?: PageSize) => {
      const updatedPages = saveCurrentPageState();
      const newPage = createEmptyPage(pageSize, updatedPages.length);
      const newPages = [...updatedPages, newPage];
      onPagesChange(newPages);
      const newIndex = newPages.length - 1;
      onActivePageChange(newIndex);
      onPageSwitch(newPage, newIndex);
      setShowSizeDropdown(false);
    },
    [saveCurrentPageState, onPagesChange, onActivePageChange, onPageSwitch]
  );

  // ─── Duplicate Page ───────────────────────────────────────────────────────

  const handleDuplicatePage = useCallback(
    (index: number) => {
      const updatedPages = saveCurrentPageState();
      const sourcePage = updatedPages[index];
      const duplicated: Page = {
        ...sourcePage,
        id: generateId(),
        name: `${sourcePage.name} (Copy)`,
        thumbnail: sourcePage.thumbnail,
      };
      const newPages = [
        ...updatedPages.slice(0, index + 1),
        duplicated,
        ...updatedPages.slice(index + 1),
      ];
      onPagesChange(newPages);
      const newIndex = index + 1;
      onActivePageChange(newIndex);
      onPageSwitch(duplicated, newIndex);
      setContextMenu(null);
    },
    [saveCurrentPageState, onPagesChange, onActivePageChange, onPageSwitch]
  );

  // ─── Delete Page ──────────────────────────────────────────────────────────

  const handleDeletePage = useCallback(
    (index: number) => {
      if (pages.length <= 1) return; // Can't delete last page
      const updatedPages = [...pages];
      updatedPages.splice(index, 1);
      onPagesChange(updatedPages);

      let newActiveIndex = activePageIndex;
      if (index <= activePageIndex) {
        newActiveIndex = Math.max(0, activePageIndex - 1);
      }
      onActivePageChange(newActiveIndex);
      onPageSwitch(updatedPages[newActiveIndex], newActiveIndex);
      setContextMenu(null);
    },
    [pages, activePageIndex, onPagesChange, onActivePageChange, onPageSwitch]
  );

  // ─── Switch Page ──────────────────────────────────────────────────────────

  const handleSwitchPage = useCallback(
    (index: number) => {
      if (index === activePageIndex) return;
      const updatedPages = saveCurrentPageState();
      onPagesChange(updatedPages);
      onActivePageChange(index);
      onPageSwitch(updatedPages[index], index);
    },
    [activePageIndex, saveCurrentPageState, onPagesChange, onActivePageChange, onPageSwitch]
  );

  // ─── Navigate ─────────────────────────────────────────────────────────────

  const handlePrev = () => {
    if (activePageIndex > 0) handleSwitchPage(activePageIndex - 1);
  };

  const handleNext = () => {
    if (activePageIndex < pages.length - 1) handleSwitchPage(activePageIndex + 1);
  };

  // ─── Rename ───────────────────────────────────────────────────────────────

  const startRename = (index: number) => {
    setRenamingIndex(index);
    setRenameValue(pages[index].name);
    setContextMenu(null);
  };

  const finishRename = () => {
    if (renamingIndex !== null && renameValue.trim()) {
      const updatedPages = [...pages];
      updatedPages[renamingIndex] = { ...updatedPages[renamingIndex], name: renameValue.trim() };
      onPagesChange(updatedPages);
    }
    setRenamingIndex(null);
    setRenameValue('');
  };

  // ─── Change Page Size ─────────────────────────────────────────────────────

  const handleChangePageSize = (index: number, size: PageSize) => {
    const updatedPages = [...pages];
    updatedPages[index] = {
      ...updatedPages[index],
      width: size.width,
      height: size.height,
    };
    onPagesChange(updatedPages);
    if (index === activePageIndex && canvas) {
      canvas.setWidth(size.width);
      canvas.setHeight(size.height);
      canvas.renderAll();
    }
    setContextMenu(null);
  };

  // ─── Context Menu ─────────────────────────────────────────────────────────

  const handleContextMenu = (e: React.MouseEvent, index: number) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenu({ x: e.clientX, y: e.clientY, pageIndex: index });
  };

  // ─── Scroll to active thumbnail ──────────────────────────────────────────

  useEffect(() => {
    if (thumbnailsRef.current) {
      const activeThumb = thumbnailsRef.current.children[activePageIndex] as HTMLElement;
      if (activeThumb) {
        activeThumb.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
      }
    }
  }, [activePageIndex]);

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <div className={`bg-slate-900 border-t border-slate-700 ${className}`}>
      {/* Top Bar: Navigation + Actions */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-slate-700/50">
        {/* Left: Page Navigation */}
        <div className="flex items-center gap-2">
          <button
            onClick={handlePrev}
            disabled={activePageIndex === 0}
            className="p-1 rounded hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed text-slate-300"
            title="Previous Page"
          >
            <ChevronLeft size={16} />
          </button>
          <span className="text-xs text-slate-400 font-medium min-w-[80px] text-center">
            Page {activePageIndex + 1} of {pages.length}
          </span>
          <button
            onClick={handleNext}
            disabled={activePageIndex === pages.length - 1}
            className="p-1 rounded hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed text-slate-300"
            title="Next Page"
          >
            <ChevronRight size={16} />
          </button>
        </div>

        {/* Center: Active Page Info */}
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <FileText size={12} />
          <span>{pages[activePageIndex]?.name}</span>
          <span className="text-slate-600">|</span>
          <span>
            {pages[activePageIndex]?.width} × {pages[activePageIndex]?.height}
          </span>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-1">
          <div className="relative" ref={sizeDropdownRef}>
            <button
              onClick={() => setShowSizeDropdown(!showSizeDropdown)}
              className="flex items-center gap-1 px-2 py-1 text-xs bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors"
              title="Add New Page"
            >
              <Plus size={14} />
              <span>Add Page</span>
            </button>

            {/* Page Size Dropdown */}
            {showSizeDropdown && (
              <div className="absolute bottom-full right-0 mb-2 w-56 bg-slate-800 border border-slate-600 rounded-lg shadow-xl z-50 max-h-64 overflow-y-auto">
                <div className="p-2 border-b border-slate-700">
                  <p className="text-xs font-semibold text-slate-300">Select Page Size</p>
                </div>
                {['Standard', 'Card', 'Certificate'].map((category) => (
                  <div key={category}>
                    <p className="px-3 pt-2 pb-1 text-[10px] uppercase text-slate-500 font-bold">
                      {category}
                    </p>
                    {PAGE_SIZES.filter((s) => s.category === category).map((size) => (
                      <button
                        key={size.label}
                        onClick={() => handleAddPage(size)}
                        className="w-full text-left px-3 py-1.5 text-xs text-slate-300 hover:bg-slate-700 transition-colors flex justify-between"
                      >
                        <span>{size.label}</span>
                        <span className="text-slate-500">
                          {size.width}×{size.height}
                        </span>
                      </button>
                    ))}
                  </div>
                ))}
              </div>
            )}
          </div>

          <button
            onClick={() => handleDuplicatePage(activePageIndex)}
            className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-700 rounded transition-colors"
            title="Duplicate Current Page"
          >
            <Copy size={14} />
          </button>

          <button
            onClick={() => handleDeletePage(activePageIndex)}
            disabled={pages.length <= 1}
            className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-slate-700 rounded transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            title="Delete Current Page"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      {/* Thumbnails Strip */}
      <div
        ref={thumbnailsRef}
        className="flex items-center gap-2 px-4 py-3 overflow-x-auto scrollbar-thin scrollbar-thumb-slate-600 scrollbar-track-transparent"
      >
        {pages.map((page, index) => (
          <div
            key={page.id}
            onClick={() => handleSwitchPage(index)}
            onContextMenu={(e) => handleContextMenu(e, index)}
            className={`
              relative flex-shrink-0 cursor-pointer rounded-lg border-2 transition-all group
              ${
                index === activePageIndex
                  ? 'border-blue-500 shadow-lg shadow-blue-500/20'
                  : 'border-slate-600 hover:border-slate-400'
              }
            `}
            style={{ width: 100, height: 70 }}
            title={`${page.name} (${page.width}×${page.height})`}
          >
            {/* Thumbnail */}
            <div className="w-full h-full rounded-md overflow-hidden bg-white flex items-center justify-center">
              {page.thumbnail ? (
                <img
                  src={page.thumbnail}
                  alt={page.name}
                  className="w-full h-full object-contain"
                />
              ) : (
                <div className="flex flex-col items-center justify-center text-slate-400">
                  <FileText size={16} />
                  <span className="text-[8px] mt-0.5">{page.width}×{page.height}</span>
                </div>
              )}
            </div>

            {/* Page Number Badge */}
            <div
              className={`
                absolute -top-1 -left-1 w-4 h-4 rounded-full text-[9px] font-bold flex items-center justify-center
                ${index === activePageIndex ? 'bg-blue-500 text-white' : 'bg-slate-600 text-slate-300'}
              `}
            >
              {index + 1}
            </div>

            {/* Page Name */}
            {renamingIndex === index ? (
              <input
                type="text"
                value={renameValue}
                onChange={(e) => setRenameValue(e.target.value)}
                onBlur={finishRename}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') finishRename();
                  if (e.key === 'Escape') setRenamingIndex(null);
                }}
                autoFocus
                className="absolute bottom-0 left-0 right-0 bg-slate-800 text-white text-[9px] px-1 py-0.5 rounded-b outline-none border-t border-blue-500"
              />
            ) : (
              <div className="absolute bottom-0 left-0 right-0 bg-slate-900/80 text-[9px] text-slate-300 text-center py-0.5 rounded-b truncate px-1">
                {page.name}
              </div>
            )}

            {/* Context Menu Button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleContextMenu(e, index);
              }}
              className="absolute top-0.5 right-0.5 p-0.5 rounded opacity-0 group-hover:opacity-100 hover:bg-slate-700/80 transition-opacity text-slate-400"
            >
              <MoreVertical size={10} />
            </button>
          </div>
        ))}
      </div>

      {/* Context Menu */}
      {contextMenu && (
        <div
          className="fixed bg-slate-800 border border-slate-600 rounded-lg shadow-xl z-[9999] py-1 min-w-[160px]"
          style={{ left: contextMenu.x, top: contextMenu.y - 200 }}
        >
          <button
            onClick={() => startRename(contextMenu.pageIndex)}
            className="w-full text-left px-3 py-1.5 text-xs text-slate-300 hover:bg-slate-700"
          >
            Rename
          </button>
          <button
            onClick={() => handleDuplicatePage(contextMenu.pageIndex)}
            className="w-full text-left px-3 py-1.5 text-xs text-slate-300 hover:bg-slate-700"
          >
            Duplicate
          </button>
          <div className="border-t border-slate-700 my-1" />
          <div className="px-3 py-1 text-[10px] text-slate-500 font-semibold uppercase">
            Change Size
          </div>
          {PAGE_SIZES.slice(0, 6).map((size) => (
            <button
              key={size.label}
              onClick={() => handleChangePageSize(contextMenu.pageIndex, size)}
              className="w-full text-left px-3 py-1 text-xs text-slate-400 hover:bg-slate-700 hover:text-slate-200"
            >
              {size.label}
            </button>
          ))}
          <div className="border-t border-slate-700 my-1" />
          <button
            onClick={() => handleDeletePage(contextMenu.pageIndex)}
            disabled={pages.length <= 1}
            className="w-full text-left px-3 py-1.5 text-xs text-red-400 hover:bg-red-900/30 disabled:opacity-30"
          >
            Delete Page
          </button>
        </div>
      )}
    </div>
  );
};

export default PageManager;

// ─── Hook for managing pages state ──────────────────────────────────────────

export function usePageManager(initialPageSize?: PageSize) {
  const [pages, setPages] = useState<Page[]>([createEmptyPage(initialPageSize, 0)]);
  const [activePageIndex, setActivePageIndex] = useState(0);

  const loadFromTemplate = useCallback((templatePages: Page[]) => {
    if (templatePages.length > 0) {
      setPages(templatePages);
      setActivePageIndex(0);
    }
  }, []);

  const saveAllPages = useCallback(
    (canvas: fabric.Canvas | null): Page[] => {
      if (!canvas) return pages;
      const currentJSON = canvas.toJSON(['id', 'name', 'lockLevel', 'conditions', 'dataSource']);
      const thumbnail = canvas.toDataURL({ format: 'png', quality: 0.3, multiplier: 0.2 });
      const updatedPages = [...pages];
      updatedPages[activePageIndex] = {
        ...updatedPages[activePageIndex],
        canvasJSON: currentJSON,
        thumbnail,
      };
      setPages(updatedPages);
      return updatedPages;
    },
    [pages, activePageIndex]
  );

  const getExportData = useCallback(
    (canvas: fabric.Canvas | null) => {
      const allPages = saveAllPages(canvas);
      return {
        pages: allPages.map(({ thumbnail, ...rest }) => rest),
        totalPages: allPages.length,
        activePageIndex,
      };
    },
    [saveAllPages, activePageIndex]
  );

  return {
    pages,
    setPages,
    activePageIndex,
    setActivePageIndex,
    loadFromTemplate,
    saveAllPages,
    getExportData,
  };
}
