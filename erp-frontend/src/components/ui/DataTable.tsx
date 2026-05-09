import React, { useState } from "react";
import { DataTableProps } from "../../types/common";
import {
  ChevronLeft,
  ChevronRight,
  Eye,
  Edit2,
  Trash2,
  Loader2,
  Search,
  ChevronsUpDown,
  ChevronUp,
  ChevronDown,
  Inbox,
} from "lucide-react";

export function DataTable<T extends { id: number }>({
  data,
  columns,
  onView,
  onEdit,
  onDelete,
  canEdit,
  canDelete,
  loading = false,
  searchable = true,
  searchKeys = [],
  itemsPerPage = 10,
  showSelection = false,
  showActions = true,
  onRowClick,
  extraActions,
}: DataTableProps<T>) {
  const [searchTerm, setSearchTerm]   = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [sortConfig, setSortConfig]   = useState<{ key: string; direction: "asc" | "desc" } | null>(null);

  const prevLengthRef = React.useRef(data.length);
  React.useEffect(() => {
    if (data.length !== prevLengthRef.current) {
      setCurrentPage(1);
      prevLengthRef.current = data.length;
    }
  }, [data.length]);

  const filteredData = data.filter((item) => {
    if (!searchTerm) return true;
    return searchKeys.some((key) => {
      const value = item[key];
      return value && String(value).toLowerCase().includes(searchTerm.toLowerCase());
    });
  });

  const sortedData = [...filteredData].sort((a, b) => {
    if (!sortConfig) return 0;
    const aVal = a[sortConfig.key as keyof T];
    const bVal = b[sortConfig.key as keyof T];
    if (aVal < bVal) return sortConfig.direction === "asc" ? -1 : 1;
    if (aVal > bVal) return sortConfig.direction === "asc" ? 1 : -1;
    return 0;
  });

  const totalPages    = Math.ceil(sortedData.length / itemsPerPage);
  const paginatedData = sortedData.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const handleSort = (key: string) => {
    setSortConfig((prev) => {
      if (prev?.key === key) return { key, direction: prev.direction === "asc" ? "desc" : "asc" };
      return { key, direction: "asc" };
    });
  };

  const SortIcon = ({ colKey }: { colKey: string }) => {
    if (sortConfig?.key !== colKey) return <ChevronsUpDown className="w-3 h-3 text-gray-400" />;
    return sortConfig.direction === "asc"
      ? <ChevronUp className="w-3 h-3 text-orange-500" />
      : <ChevronDown className="w-3 h-3 text-orange-500" />;
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3 text-gray-400">
        <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
        <span className="text-sm">Loading data...</span>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Search bar */}
      {searchable && (
        <div className="relative max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4 pointer-events-none" />
          <input
            type="text"
            placeholder="Search..."
            value={searchTerm}
            onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
            className="w-full h-9 pl-9 pr-3 text-sm border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 placeholder:text-gray-400"
          />
        </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50/80">
              {showSelection && (
                <th className="w-10 px-4 py-3 text-left">
                  <input type="checkbox" className="rounded border-gray-300 text-orange-500 focus:ring-orange-500" />
                </th>
              )}
              {columns.map((col, idx) => (
                <th
                  key={idx}
                  onClick={() => col.sortable && handleSort(String(col.key))}
                  className={[
                    "px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap select-none",
                    col.sortable ? "cursor-pointer hover:text-gray-700 hover:bg-gray-100/60" : "",
                  ].join(" ")}
                >
                  <div className="flex items-center gap-1.5">
                    {col.label}
                    {col.sortable && <SortIcon colKey={String(col.key)} />}
                  </div>
                </th>
              ))}
              {showActions && (
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider w-28">
                  Actions
                </th>
              )}
            </tr>
          </thead>

          <tbody className="divide-y divide-gray-100">
            {paginatedData.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length + (showSelection ? 1 : 0) + (showActions ? 1 : 0)}
                  className="py-16 text-center"
                >
                  <div className="flex flex-col items-center gap-2 text-gray-400">
                    <Inbox className="w-10 h-10" />
                    <p className="text-sm font-medium">No records found</p>
                  </div>
                </td>
              </tr>
            ) : (
              paginatedData.map((item) => (
                <tr
                  key={item.id}
                  onClick={() => onRowClick?.(item)}
                  className={[
                    "group transition-colors duration-100",
                    onRowClick ? "cursor-pointer hover:bg-orange-50/60" : "hover:bg-gray-50/60",
                  ].join(" ")}
                >
                  {showSelection && (
                    <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                      <input type="checkbox" className="rounded border-gray-300 text-orange-500 focus:ring-orange-500" />
                    </td>
                  )}
                  {columns.map((col, idx) => (
                    <td key={idx} className="px-4 py-3 text-gray-800">
                      {col.render ? col.render(item) : String(item[col.key as keyof T] ?? "")}
                    </td>
                  ))}
                  {showActions && (
                    <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1">
                        {onView && (
                          <button
                            onClick={() => onView(item)}
                            title="View"
                            className="p-1.5 rounded text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                        )}
                        {onEdit && canEdit?.(item) && (
                          <button
                            onClick={() => onEdit(item)}
                            title="Edit"
                            className="p-1.5 rounded text-gray-400 hover:text-orange-600 hover:bg-orange-50 transition-colors"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                        {onDelete && canDelete?.(item) && (
                          <button
                            onClick={() => onDelete(item)}
                            title="Delete"
                            className="p-1.5 rounded text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                        {extraActions && (
                          <span onClick={(e) => e.stopPropagation()} className="inline-flex items-center">
                            {extraActions(item)}
                          </span>
                        )}
                      </div>
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {sortedData.length > 0 && (
        <div className="flex items-center justify-between pt-1">
          <p className="text-xs text-gray-500">
            Showing{" "}
            <span className="font-semibold text-gray-700">
              {(currentPage - 1) * itemsPerPage + 1}–{Math.min(currentPage * itemsPerPage, sortedData.length)}
            </span>{" "}
            of <span className="font-semibold text-gray-700">{sortedData.length}</span> records
          </p>

          <div className="flex items-center gap-1">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="h-8 w-8 flex items-center justify-center rounded border border-gray-300 text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
              const page = i + 1;
              return (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={[
                    "h-8 min-w-[2rem] px-2 rounded border text-sm font-medium transition-colors",
                    currentPage === page
                      ? "bg-orange-500 border-orange-500 text-white"
                      : "border-gray-300 text-gray-600 hover:bg-gray-50",
                  ].join(" ")}
                >
                  {page}
                </button>
              );
            })}

            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="h-8 w-8 flex items-center justify-center rounded border border-gray-300 text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
