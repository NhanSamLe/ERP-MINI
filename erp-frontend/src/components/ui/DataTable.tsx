import React, { useState } from "react";
import { DataTableProps } from "../../types/common";
import {
  ChevronLeft,
  ChevronRight,
  Eye,
  Edit2,
  Trash2,
  RefreshCw,
  Search,
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
  showSelection = true,
  showActions = true,
}: DataTableProps<T>) {
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [sortConfig, setSortConfig] = useState<{
    key: string;
    direction: "asc" | "desc";
  } | null>(null);

  const filteredData = data.filter((item) => {
    if (!searchTerm) return true;
    return searchKeys.some((key) => {
      const value = item[key];
      return (
        value && String(value).toLowerCase().includes(searchTerm.toLowerCase())
      );
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

  const totalPages = Math.ceil(sortedData.length / itemsPerPage);
  const paginatedData = sortedData.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleSort = (key: string) => {
    setSortConfig((prev) => {
      if (prev?.key === key) {
        return { key, direction: prev.direction === "asc" ? "desc" : "asc" };
      }
      return { key, direction: "asc" };
    });
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <RefreshCw className="w-8 h-8 animate-spin text-orange-500" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {searchable && (
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
          />
        </div>
      )}

      <div className="overflow-x-auto bg-white rounded-lg shadow">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              {showSelection && (
                <th className="px-6 py-3 text-left">
                  <input type="checkbox" className="rounded" />
                </th>
              )}
              {columns.map((col, idx) => (
                <th
                  key={idx}
                  onClick={() => col.sortable && handleSort(String(col.key))}
                  className={`px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider ${
                    col.sortable ? "cursor-pointer hover:bg-gray-100" : ""
                  }`}
                >
                  {col.label}
                </th>
              ))}
              {showActions && (
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {paginatedData.map((item) => (
              <tr key={item.id} className="hover:bg-gray-50">
                {showSelection && (
                  <td className="px-6 py-4">
                    <input type="checkbox" className="rounded" />
                  </td>
                )}
                {columns.map((col, idx) => (
                  <td key={idx} className="px-6 py-4 text-sm text-gray-900">
                    {col.render
                      ? col.render(item)
                      : String(item[col.key as keyof T] || "")}
                  </td>
                ))}
                <td className="px-6 py-4 text-right space-x-2 whitespace-nowrap">
                  {onView && (
                    <button
                      onClick={() => onView(item)}
                      className="text-gray-600 hover:text-gray-900"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                  )}
                  {onEdit &&
                    (canEdit?.(item) ? (
                      <button
                        onClick={() => onEdit(item)}
                        className="text-gray-600 hover:text-orange-600"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                    ) : (
                      <span className="inline-block w-4 h-4 opacity-0">
                        <Edit2 className="w-4 h-4" />
                      </span>
                    ))}

                  {onDelete &&
                    (canDelete?.(item) ? (
                      <button
                        onClick={() => onDelete(item)}
                        className="text-gray-600 hover:text-red-600"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    ) : (
                      <span className="inline-block w-4 h-4 opacity-0">
                        <Trash2 className="w-4 h-4" />
                      </span>
                    ))}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between">
        <div className="text-sm text-gray-700">
          Showing {(currentPage - 1) * itemsPerPage + 1} to{" "}
          {Math.min(currentPage * itemsPerPage, sortedData.length)} of{" "}
          {sortedData.length} entries
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="p-2 rounded border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="px-4 py-2 bg-orange-500 text-white rounded">
            {currentPage}
          </span>
          <button
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="p-2 rounded border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
