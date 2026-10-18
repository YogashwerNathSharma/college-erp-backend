import { useState, useCallback, useMemo } from "react";

//////////////////////////////////////////////////////
// 📄 PAGINATION HOOK
//////////////////////////////////////////////////////

interface PaginationOptions {
  initialPage?: number;
  initialLimit?: number;
}

export function usePagination(totalItems: number, options: PaginationOptions = {}) {
  const { initialPage = 1, initialLimit = 20 } = options;
  const [page, setPage] = useState(initialPage);
  const [limit, setLimit] = useState(initialLimit);

  const totalPages = useMemo(() => Math.ceil(totalItems / limit), [totalItems, limit]);
  const hasNext = page < totalPages;
  const hasPrev = page > 1;

  const goToPage = useCallback((p: number) => {
    setPage(Math.max(1, Math.min(p, totalPages)));
  }, [totalPages]);

  const nextPage = useCallback(() => {
    if (hasNext) setPage((p) => p + 1);
  }, [hasNext]);

  const prevPage = useCallback(() => {
    if (hasPrev) setPage((p) => p - 1);
  }, [hasPrev]);

  const reset = useCallback(() => setPage(1), []);

  return {
    page,
    limit,
    totalPages,
    hasNext,
    hasPrev,
    setPage: goToPage,
    setLimit,
    nextPage,
    prevPage,
    reset,
    offset: (page - 1) * limit,
  };
}
