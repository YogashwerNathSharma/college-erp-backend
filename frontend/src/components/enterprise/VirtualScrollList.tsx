import React, {
  useState,
  useEffect,
  useCallback,
  useRef,
  useMemo,
  forwardRef,
  useImperativeHandle,
} from "react";
import { Loader2, ChevronsDown } from "lucide-react";

// ══════════════════════════════════════════════════════════════════
// TYPES
// ══════════════════════════════════════════════════════════════════

export interface VirtualScrollListProps<T> {
  items: T[];
  rowHeight: number | ((index: number) => number);
  containerHeight: number;
  overscan?: number;
  renderRow: (item: T, index: number, style: React.CSSProperties) => React.ReactNode;
  keyExtractor?: (item: T, index: number) => string;
  onEndReached?: () => void;
  endReachedThreshold?: number;
  loading?: boolean;
  loadingMore?: boolean;
  emptyComponent?: React.ReactNode;
  className?: string;
  innerClassName?: string;
  smoothScroll?: boolean;
  stickyIndices?: number[];
  onScroll?: (scrollTop: number) => void;
  scrollToAlignment?: "start" | "center" | "end" | "auto";
  gap?: number;
}

export interface VirtualScrollListRef {
  scrollToIndex: (index: number, alignment?: "start" | "center" | "end" | "auto") => void;
  scrollToTop: () => void;
  scrollToBottom: () => void;
  getScrollTop: () => number;
  setScrollTop: (top: number) => void;
}

// ══════════════════════════════════════════════════════════════════
// HELPER: Calculate item offsets for variable height
// ══════════════════════════════════════════════════════════════════

function buildOffsetMap(
  itemCount: number,
  rowHeight: number | ((index: number) => number),
  gap: number
): { offsets: number[]; totalHeight: number } {
  const offsets: number[] = new Array(itemCount);
  let currentOffset = 0;

  for (let i = 0; i < itemCount; i++) {
    offsets[i] = currentOffset;
    const height = typeof rowHeight === "function" ? rowHeight(i) : rowHeight;
    currentOffset += height + (i < itemCount - 1 ? gap : 0);
  }

  return { offsets, totalHeight: currentOffset };
}

function getRowHeight(rowHeight: number | ((index: number) => number), index: number): number {
  return typeof rowHeight === "function" ? rowHeight(index) : rowHeight;
}

// ══════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ══════════════════════════════════════════════════════════════════

function VirtualScrollListInner<T>(
  {
    items,
    rowHeight,
    containerHeight,
    overscan = 5,
    renderRow,
    keyExtractor,
    onEndReached,
    endReachedThreshold = 200,
    loading = false,
    loadingMore = false,
    emptyComponent,
    className = "",
    innerClassName = "",
    smoothScroll = true,
    stickyIndices = [],
    onScroll,
    scrollToAlignment = "auto",
    gap = 0,
  }: VirtualScrollListProps<T>,
  ref: React.Ref<VirtualScrollListRef>
) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scrollTop, setScrollTop] = useState(0);
  const endReachedCalledRef = useRef(false);

  // Build offset map for all items
  const { offsets, totalHeight } = useMemo(
    () => buildOffsetMap(items.length, rowHeight, gap),
    [items.length, rowHeight, gap]
  );

  // Calculate visible range
  const { startIndex, endIndex } = useMemo(() => {
    if (items.length === 0) return { startIndex: 0, endIndex: 0 };

    // Binary search for start index
    let start = 0;
    let end = items.length - 1;

    while (start <= end) {
      const mid = Math.floor((start + end) / 2);
      const midBottom = offsets[mid] + getRowHeight(rowHeight, mid);

      if (midBottom <= scrollTop) {
        start = mid + 1;
      } else {
        end = mid - 1;
      }
    }

    const visibleStart = Math.max(0, start - overscan);

    // Find end index
    let visibleEnd = start;
    const viewportBottom = scrollTop + containerHeight;

    while (visibleEnd < items.length && offsets[visibleEnd] < viewportBottom) {
      visibleEnd++;
    }
    visibleEnd = Math.min(items.length, visibleEnd + overscan);

    return { startIndex: visibleStart, endIndex: visibleEnd };
  }, [items.length, scrollTop, containerHeight, overscan, offsets, rowHeight]);

  // Handle scroll
  const handleScroll = useCallback(
    (e: React.UIEvent<HTMLDivElement>) => {
      const target = e.currentTarget;
      const newScrollTop = target.scrollTop;
      setScrollTop(newScrollTop);

      onScroll?.(newScrollTop);

      // Check if we've reached the end
      const distanceFromEnd =
        totalHeight - newScrollTop - containerHeight;
      if (
        distanceFromEnd < endReachedThreshold &&
        onEndReached &&
        !endReachedCalledRef.current &&
        !loadingMore
      ) {
        endReachedCalledRef.current = true;
        onEndReached();
      }

      // Reset endReached flag when scrolling back up
      if (distanceFromEnd > endReachedThreshold * 2) {
        endReachedCalledRef.current = false;
      }
    },
    [totalHeight, containerHeight, endReachedThreshold, onEndReached, loadingMore, onScroll]
  );

  // Reset endReached when items change
  useEffect(() => {
    endReachedCalledRef.current = false;
  }, [items.length]);

  // Imperative handle
  useImperativeHandle(ref, () => ({
    scrollToIndex: (index: number, alignment?: "start" | "center" | "end" | "auto") => {
      if (!containerRef.current || index < 0 || index >= items.length) return;
      const align = alignment || scrollToAlignment;
      const itemOffset = offsets[index];
      const itemHeight = getRowHeight(rowHeight, index);

      let targetScroll: number;

      switch (align) {
        case "start":
          targetScroll = itemOffset;
          break;
        case "end":
          targetScroll = itemOffset - containerHeight + itemHeight;
          break;
        case "center":
          targetScroll = itemOffset - containerHeight / 2 + itemHeight / 2;
          break;
        case "auto":
        default:
          // Only scroll if item is not fully visible
          if (itemOffset < scrollTop) {
            targetScroll = itemOffset;
          } else if (itemOffset + itemHeight > scrollTop + containerHeight) {
            targetScroll = itemOffset - containerHeight + itemHeight;
          } else {
            return; // Already visible
          }
          break;
      }

      targetScroll = Math.max(0, Math.min(targetScroll, totalHeight - containerHeight));

      if (smoothScroll) {
        containerRef.current.scrollTo({ top: targetScroll, behavior: "smooth" });
      } else {
        containerRef.current.scrollTop = targetScroll;
      }
    },
    scrollToTop: () => {
      containerRef.current?.scrollTo({
        top: 0,
        behavior: smoothScroll ? "smooth" : "auto",
      });
    },
    scrollToBottom: () => {
      containerRef.current?.scrollTo({
        top: totalHeight - containerHeight,
        behavior: smoothScroll ? "smooth" : "auto",
      });
    },
    getScrollTop: () => containerRef.current?.scrollTop || 0,
    setScrollTop: (top: number) => {
      if (containerRef.current) containerRef.current.scrollTop = top;
    },
  }));

  // Visible items slice
  const visibleItems = useMemo(
    () => items.slice(startIndex, endIndex),
    [items, startIndex, endIndex]
  );

  // ── Loading state ──
  if (loading) {
    return (
      <div
        className={`flex items-center justify-center ${className}`}
        style={{ height: containerHeight }}
      >
        <div className="flex flex-col items-center gap-2">
          <Loader2 size={24} className="animate-spin text-indigo-500" />
          <span className="text-xs text-gray-400 dark:text-slate-500">Loading...</span>
        </div>
      </div>
    );
  }

  // ── Empty state ──
  if (items.length === 0) {
    return (
      <div
        className={`flex items-center justify-center ${className}`}
        style={{ height: containerHeight }}
      >
        {emptyComponent || (
          <div className="flex flex-col items-center gap-2">
            <ChevronsDown size={24} className="text-gray-300 dark:text-slate-600" />
            <span className="text-xs text-gray-400 dark:text-slate-500">
              No items to display
            </span>
          </div>
        )}
      </div>
    );
  }

  // ── Scroll Progress indicator ──
  const scrollProgress = totalHeight > containerHeight
    ? scrollTop / (totalHeight - containerHeight)
    : 0;

  return (
    <div className={`relative ${className}`}>
      {/* Scroll Progress Bar */}
      {totalHeight > containerHeight && (
        <div className="absolute top-0 right-0 w-0.5 h-full z-10 bg-gray-100 dark:bg-slate-800">
          <div
            className="w-full bg-indigo-400/50 dark:bg-indigo-500/50 rounded-full transition-all duration-75"
            style={{
              height: `${Math.max(10, (containerHeight / totalHeight) * 100)}%`,
              transform: `translateY(${scrollProgress * (containerHeight - (containerHeight / totalHeight) * containerHeight)}px)`,
            }}
          />
        </div>
      )}

      {/* Scroll Container */}
      <div
        ref={containerRef}
        className={`overflow-y-auto overflow-x-hidden ${
          smoothScroll ? "scroll-smooth" : ""
        }`}
        style={{ height: containerHeight }}
        onScroll={handleScroll}
        role="list"
        aria-rowcount={items.length}
      >
        {/* Inner spacer for total content height */}
        <div
          className={`relative ${innerClassName}`}
          style={{ height: totalHeight }}
        >
          {/* Render only visible items */}
          {visibleItems.map((item, relativeIndex) => {
            const actualIndex = startIndex + relativeIndex;
            const top = offsets[actualIndex];
            const height = getRowHeight(rowHeight, actualIndex);
            const isSticky = stickyIndices.includes(actualIndex);

            const style: React.CSSProperties = {
              position: isSticky ? "sticky" : "absolute",
              top: isSticky ? 0 : top,
              left: 0,
              right: 0,
              height,
              ...(isSticky && { zIndex: 20 }),
            };

            const key = keyExtractor
              ? keyExtractor(item, actualIndex)
              : String(actualIndex);

            return (
              <React.Fragment key={key}>
                {renderRow(item, actualIndex, style)}
              </React.Fragment>
            );
          })}
        </div>

        {/* Loading More Indicator */}
        {loadingMore && (
          <div className="flex items-center justify-center py-4">
            <Loader2 size={16} className="animate-spin text-indigo-500 mr-2" />
            <span className="text-xs text-gray-400 dark:text-slate-500">
              Loading more...
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

// Forward ref with generics workaround
const VirtualScrollList = forwardRef(VirtualScrollListInner) as <T>(
  props: VirtualScrollListProps<T> & { ref?: React.Ref<VirtualScrollListRef> }
) => React.ReactElement;

export default VirtualScrollList;
