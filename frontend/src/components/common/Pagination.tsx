//////////////////////////////////////////////////////
// 📄 PAGINATION COMPONENT
//////////////////////////////////////////////////////

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  showInfo?: boolean;
  totalItems?: number;
  itemsPerPage?: number;
}

export default function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  showInfo = true,
  totalItems = 0,
  itemsPerPage = 20,
}: PaginationProps) {
  if (totalPages <= 1) return null;

  const pages = Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
    if (totalPages <= 5) return i + 1;
    if (currentPage <= 3) return i + 1;
    if (currentPage >= totalPages - 2) return totalPages - 4 + i;
    return currentPage - 2 + i;
  });

  return (
    <div className="flex items-center justify-between px-4 py-3">
      {showInfo && (
        <p className="text-sm text-gray-500">
          Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, totalItems)} of {totalItems}
        </p>
      )}
      <div className="flex items-center gap-1">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="px-3 py-1.5 text-sm border rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
        >
          Prev
        </button>
        {pages.map((page) => (
          <button
            key={page}
            onClick={() => onPageChange(page)}
            className={`px-3 py-1.5 text-sm rounded-lg ${
              currentPage === page ? "bg-indigo-600 text-white" : "border hover:bg-gray-50"
            }`}
          >
            {page}
          </button>
        ))}
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="px-3 py-1.5 text-sm border rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
        >
          Next
        </button>
      </div>
    </div>
  );
}
