import { useEffect, useState } from "react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { useNavigate } from "react-router-dom";
import {
  fetchFilteredReceipts,
} from "../store/receipt.slice";
import { ReceiptFilterDto, ArReceiptDto } from "../dto/receipt.dto";

export default function ReceiptListPage() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const {
    items,
    loading,
    total,
    page,
    total_pages,
    error,
  } = useAppSelector((state) => state.receipt);

  // Filter State
  const [filters, setFilters] = useState<ReceiptFilterDto>({
    page: 1,
    page_size: 20,
    search: "",
    status: "",
    approval_status: "",
    date_from: "",
    date_to: "",
  });

  const [isFilterOpen, setIsFilterOpen] = useState(false);

  // Load initial
  useEffect(() => {
    dispatch(fetchFilteredReceipts(filters));
  }, [dispatch]);

  const handleSearch = () => {
    const updated = { ...filters, page: 1 };
    setFilters(updated);
    dispatch(fetchFilteredReceipts(updated));
  };

  const handleReset = () => {
    const reset: ReceiptFilterDto = {
      page: 1,
      page_size: 20,
      search: "",
      status: "",
      approval_status: "",
      date_from: "",
      date_to: "",
    };
    setFilters(reset);
    dispatch(fetchFilteredReceipts(reset));
  };

  const handlePageChange = (newPage: number) => {
    const updated: ReceiptFilterDto = { ...filters, page: newPage };
    setFilters(updated);
    dispatch(fetchFilteredReceipts(updated));
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "draft":
        return "bg-gray-100 text-gray-800";
      case "posted":
        return "bg-blue-100 text-blue-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getApprovalStatusColor = (status: string) => {
    switch (status) {
      case "draft":
        return "bg-gray-100 text-gray-800";
      case "waiting_approval":
        return "bg-yellow-100 text-yellow-800";
      case "approved":
        return "bg-green-100 text-green-800";
      case "rejected":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const formatCurrency = (amount: number) => {
    return amount.toLocaleString("vi-VN", {
      style: "currency",
      currency: "VND",
      minimumFractionDigits: 0,
    });
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("vi-VN");
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-4xl font-bold text-gray-900">Receipts</h1>
            <p className="text-gray-600 mt-1">Manage payment receipts</p>
          </div>
          <button
            onClick={() => navigate("/receipts/create")}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium flex items-center gap-2"
          >
            <span>+</span>
            Create Receipt
          </button>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            <p className="font-medium">Error</p>
            <p className="text-sm mt-1">{error}</p>
          </div>
        )}

        {/* Filter Section */}
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
          <button
            onClick={() => setIsFilterOpen(!isFilterOpen)}
            className="w-full px-6 py-4 flex justify-between items-center hover:bg-gray-50 transition"
          >
            <div className="flex items-center gap-2">
              <span className="text-lg font-semibold text-gray-900">
                Filters
              </span>
              {(filters.search ||
                filters.status ||
                filters.approval_status ||
                filters.date_from ||
                filters.date_to) && (
                <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-semibold rounded-full">
                  Active
                </span>
              )}
            </div>
            <span className={`text-gray-500 transition ${isFilterOpen ? "rotate-180" : ""}`}>
              ▼
            </span>
          </button>

          {isFilterOpen && (
            <div className="border-t border-gray-200 p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
                {/* Search */}
                <div className="lg:col-span-2">
                  <label className="block text-xs font-semibold text-gray-600 mb-2 uppercase">
                    Search
                  </label>
                  <input
                    type="text"
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Receipt no, customer..."
                    value={filters.search}
                    onChange={(e) =>
                      setFilters({ ...filters, search: e.target.value })
                    }
                  />
                </div>

                {/* Status */}
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-2 uppercase">
                    Status
                  </label>
                  <select
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={filters.status}
                    onChange={(e) =>
                      setFilters({
                        ...filters,
                        status: e.target.value as ReceiptFilterDto["status"],
                      })
                    }
                  >
                    <option value="">All</option>
                    <option value="draft">Draft</option>
                    <option value="posted">Posted</option>
                  </select>
                </div>

                {/* Approval Status */}
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-2 uppercase">
                    Approval
                  </label>
                  <select
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={filters.approval_status}
                    onChange={(e) =>
                      setFilters({
                        ...filters,
                        approval_status: e.target.value as ReceiptFilterDto["approval_status"],
                      })
                    }
                  >
                    <option value="">All</option>
                    <option value="draft">Draft</option>
                    <option value="waiting_approval">Waiting</option>
                    <option value="approved">Approved</option>
                    <option value="rejected">Rejected</option>
                  </select>
                </div>

                {/* Date From */}
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-2 uppercase">
                    From Date
                  </label>
                  <input
                    type="date"
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={filters.date_from || ""}
                    onChange={(e) =>
                      setFilters({ ...filters, date_from: e.target.value })
                    }
                  />
                </div>

                {/* Date To */}
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-2 uppercase">
                    To Date
                  </label>
                  <input
                    type="date"
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={filters.date_to || ""}
                    onChange={(e) =>
                      setFilters({ ...filters, date_to: e.target.value })
                    }
                  />
                </div>
              </div>

              {/* Filter Buttons */}
              <div className="flex gap-3 pt-2">
                <button
                  onClick={handleSearch}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium"
                >
                  Search
                </button>
                <button
                  onClick={handleReset}
                  className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition font-medium"
                >
                  Reset
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Table */}
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase">
                    Receipt No
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase">
                    Customer
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase">
                    Date
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-semibold text-gray-700 uppercase">
                    Amount
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase">
                    Method
                  </th>
                  <th className="px-6 py-4 text-center text-xs font-semibold text-gray-700 uppercase">
                    Status
                  </th>
                  <th className="px-6 py-4 text-center text-xs font-semibold text-gray-700 uppercase">
                    Approval
                  </th>
                  <th className="px-6 py-4 text-center text-xs font-semibold text-gray-700 uppercase">
                    Action
                  </th>
                </tr>
              </thead>

              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-8 text-center">
                      <div className="flex justify-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                      </div>
                    </td>
                  </tr>
                ) : items.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-8 text-center text-gray-500">
                      <p className="text-sm">No receipts found</p>
                    </td>
                  </tr>
                ) : (
                  items.map((receipt: ArReceiptDto) => (
                    <tr
                      key={receipt.id}
                      className="border-b border-gray-200 hover:bg-gray-50 transition"
                    >
                      <td className="px-6 py-4">
                        <span className="font-medium text-gray-900">
                          {receipt.receipt_no}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {receipt.customer?.name}
                          </p>
                          <p className="text-xs text-gray-500">
                            {receipt.customer?.phone}
                          </p>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {formatDate(receipt.receipt_date)}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className="font-semibold text-gray-900">
                          {formatCurrency(receipt.amount)}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {receipt.method}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span
                          className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(
                            receipt.status
                          )}`}
                        >
                          {receipt.status.toUpperCase()}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span
                          className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${getApprovalStatusColor(
                            receipt.approval_status
                          )}`}
                        >
                          {receipt.approval_status.replace("_", " ").toUpperCase()}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <button
                          onClick={() => navigate(`/receipts/${receipt.id}`)}
                          className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition font-medium"
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {!loading && items.length > 0 && (
            <div className="border-t border-gray-200 px-6 py-4 flex justify-between items-center bg-gray-50">
              <div className="text-sm text-gray-600">
                Page <span className="font-semibold">{page}</span> of{" "}
                <span className="font-semibold">{total_pages}</span>
                {" • "}
                <span className="font-semibold">{total}</span> total receipts
              </div>

              <div className="flex gap-2">
                <button
                  disabled={page <= 1}
                  onClick={() => handlePageChange(page - 1)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed transition font-medium text-sm"
                >
                  ← Previous
                </button>

                <button
                  disabled={page >= total_pages}
                  onClick={() => handlePageChange(page + 1)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed transition font-medium text-sm"
                >
                  Next →
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}