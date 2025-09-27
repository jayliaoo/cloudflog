import { Link } from "react-router";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  totalCount: number;
  itemsPerPage?: number;
  itemName?: string;
  baseUrl?: string;
  searchParams?: URLSearchParams;
}

export default function Pagination({
  currentPage,
  totalPages,
  totalCount,
  itemsPerPage = 10,
  itemName = "items",
  baseUrl = "",
  searchParams,
}: PaginationProps) {
  // Helper function to build URL with search parameters
  const buildUrl = (page: number) => {
    const params = new URLSearchParams(searchParams);
    params.set("page", page.toString());
    return `${baseUrl}?${params.toString()}`;
  };

  // If no search params provided, use simple page parameter
  const getPageUrl = (page: number) => {
    if (searchParams) {
      return buildUrl(page);
    }
    return `${baseUrl}?page=${page}`;
  };

  if (totalPages <= 1) {
    return null;
  }

  return (
    <div className="flex items-center justify-between border-t border-gray-200 pt-6">
      <div className="text-sm">
        Showing {(currentPage - 1) * itemsPerPage + 1} to{" "}
        {Math.min(currentPage * itemsPerPage, totalCount)} of {totalCount} {itemName}
      </div>
      <div className="flex items-center -space-x-px h-10 text-base">
        {/* Previous Button */}
        <Link
          to={getPageUrl(Math.max(1, currentPage - 1))}
          className={`flex 
            items-center 
            justify-center 
            px-4 
            h-10 
            ms-0 
            leading-tight
            text-gray-500
            bg-white
            border
            border-gray-300
            rounded-s-lg
            hover:bg-gray-100
            hover:text-gray-700
            ${
              currentPage === 1
                ? "opacity-50 cursor-not-allowed"
                : ""
            }`}
        >
          <svg
            className="w-3.5 h-3.5"
            aria-hidden="true"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 6 10"
          >
            <path
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M5 1 1 5l4 4"
            />
          </svg>
        </Link>

        {/* Page numbers */}
        {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
          let pageNum;
          if (totalPages <= 5) {
            pageNum = i + 1;
          } else if (currentPage <= 3) {
            pageNum = i + 1;
          } else if (currentPage >= totalPages - 2) {
            pageNum = totalPages - 4 + i;
          } else {
            pageNum = currentPage - 2 + i;
          }

          return (
            <Link
              key={pageNum}
              to={getPageUrl(pageNum)}
              className={`z-10 flex items-center justify-center px-4 h-10 leading-tight border ${
                currentPage === pageNum
                  ? "bg-indigo-600 border-indigo-600 text-white"
                  : "text-gray-500 bg-white border-gray-300 hover:bg-indigo-100 hover:text-gray-700 transition-colors duration-200"
              }`}
            >
              {pageNum}
            </Link>
          );
        })}

        {/* Next Button */}
        <Link
          to={getPageUrl(Math.min(totalPages, currentPage + 1))}
          className={`flex items-center justify-center px-4 h-10 leading-tight text-gray-500 bg-white border border-gray-300 rounded-e-lg hover:bg-gray-100 hover:text-gray-700 ${
            currentPage === totalPages
              ? "opacity-50 cursor-not-allowed"
              : ""
          }`}
        >
          <svg
            className="w-3.5 h-3.5"
            aria-hidden="true"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 6 10"
          >
            <path
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="m1 9 4-4-4-4"
            />
          </svg>
        </Link>
      </div>
    </div>
  );
}