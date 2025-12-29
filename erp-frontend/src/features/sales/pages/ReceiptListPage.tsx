import { useEffect, useState } from "react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { useNavigate, Link } from "react-router-dom";
import {
  fetchFilteredReceipts,
} from "../store/receipt.slice";
import { ReceiptFilterDto, ArReceiptDto } from "../dto/receipt.dto";
import { formatVND } from "@/utils/currency.helper";
import PageHeader from "@/components/layout/PageHeader";
import { Plus, Eye, Download } from "lucide-react";
import StatusBadge from "../components/ar.components.ts/StatusBadge";
import { exportExcelReport } from "@/utils/excel/exportExcelReport";

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

  const { user } = useAppSelector((state) => state.auth);

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

  // Load initial
  useEffect(() => {
    dispatch(fetchFilteredReceipts(filters));
  }, [dispatch]);

  const handleSearchChange = (val: string) => {
    const updated = { ...filters, search: val, page: 1 };
    setFilters(updated);
    // Debounce usually handled here, but for direct consistency I'll dispatch immediately or user can press enter
    // For now simple immediate dispatch on change like SaleOrder/Invoice
    dispatch(fetchFilteredReceipts(updated));
  };

  const handleStatusChange = (val: string) => {
    const updated = { ...filters, status: val as any, page: 1 };
    setFilters(updated);
    dispatch(fetchFilteredReceipts(updated));
  };

  const handlePageChange = (newPage: number) => {
    const updated: ReceiptFilterDto = { ...filters, page: newPage };
    setFilters(updated);
    dispatch(fetchFilteredReceipts(updated));
  };

  const handleExport = async () => {
    try {
      await exportExcelReport({
        title: "DANH SÁCH PHIẾU THU (RECEIPTS)",
        columns: [
          { header: "Số phiếu", key: "receipt_no", width: 15 },
          { header: "Ngày phiếu", key: "receipt_date", width: 15, formatter: (val) => val ? new Date(String(val)).toLocaleDateString('vi-VN') : "" },
          { header: "Khách hàng", key: "customer", width: 30, formatter: (val: any) => val?.name || "-" },
          { header: "Số tiền", key: "amount", width: 20, format: "currency", align: "right" },
          { header: "Phương thức", key: "method", width: 15, formatter: (val) => String(val).toUpperCase() },
          { header: "Trạng thái", key: "status", width: 15, formatter: (val) => String(val).toUpperCase() },
          { header: "Duyệt", key: "approval_status", width: 15, formatter: (val) => String(val).toUpperCase() },
        ],
        data: items,
        fileName: `Bao_Cao_Phieu_Thu_${new Date().getTime()}.xlsx`,
        footer: {
          creator: user?.full_name || "Admin"
        }
      });
    } catch (err) {
      console.error(err);
      alert("Lỗi xuất file excel");
    }
  };

  return (
    <div className="p-6">
      {/* Error Alert */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          <p className="font-medium">Error</p>
          <p className="text-sm mt-1">{error}</p>
        </div>
      )}

      <div className="bg-white rounded-lg shadow-lg overflow-hidden border">
        {/* ========== PAGE HEADER ========== */}
        <PageHeader
          title="Receipts"
          description="Manage payment receipts"
          action={
            <div className="flex gap-2">
              <button
                onClick={handleExport}
                className="bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
              >
                <Download size={18} />
                Export Excel
              </button>
              <Link
                to="/receipts/create"
                className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
              >
                <Plus size={18} />
                New Receipt
              </Link>
            </div>
          }
        />

        {/* ========== FILTERS ========== */}
        <div className="p-6 border-b bg-gray-50 space-y-4">
          <div className="flex gap-4 flex-wrap items-end">
            <div className="flex-1 min-w-64">
              <label className="block text-sm font-medium mb-1">Search</label>
              <input
                value={filters.search}
                placeholder="Search by Receipt # or Customer..."
                onChange={(e) => handleSearchChange(e.target.value)}
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>

            <div className="min-w-48">
              <label className="block text-sm font-medium mb-1">Status</label>
              <select
                value={filters.status}
                onChange={(e) => handleStatusChange(e.target.value)}
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
              >
                <option value="">All Status</option>
                <option value="draft">Draft</option>
                <option value="posted">Posted</option>
              </select>
            </div>

            <div className="min-w-48">
              <label className="block text-sm font-medium mb-1">Approval</label>
              <select
                value={filters.approval_status}
                onChange={(e) => {
                  const updated = { ...filters, approval_status: e.target.value as any, page: 1 };
                  setFilters(updated);
                  dispatch(fetchFilteredReceipts(updated));
                }}
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
              >
                <option value="">All Approval</option>
                <option value="draft">Draft</option>
                <option value="waiting_approval">Waiting Approval</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>
          </div>
        </div>

        {/* ========== TABLE ========== */}
        {loading ? (
          <div className="p-6 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div>
            <p className="mt-2 text-gray-500">Loading...</p>
          </div>
        ) : items.length === 0 ? (
          <div className="p-6 text-center text-gray-500">
            <p>No receipts found</p>
          </div>
        ) : (
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
              <tbody className="divide-y divide-gray-200">
                {items.map((receipt: ArReceiptDto) => (
                  <tr
                    key={receipt.id}
                    className="hover:bg-orange-50 transition"
                  >
                    <td className="px-6 py-4 font-medium text-orange-600">
                      <button onClick={() => navigate(`/receipts/${receipt.id}`)}>
                        {receipt.receipt_no}
                      </button>
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
                    <td className="px-6 py-4 text-right font-semibold">
                      {formatVND(receipt.amount)}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {receipt.method}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <StatusBadge status={receipt.status} type="status" />
                    </td>
                    <td className="px-6 py-4 text-center">
                      <StatusBadge status={receipt.approval_status} type="approval" />
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex justify-center gap-2">
                        <button
                          onClick={() => navigate(`/receipts/${receipt.id}`)}
                          className="p-1.5 border border-gray-300 rounded text-blue-600 hover:bg-blue-50 transition"
                          title="View Details"
                        >
                          <Eye size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* ========== PAGINATION ========== */}
        {!loading && (
          <div className="px-6 py-4 border-t bg-gray-50 flex justify-between items-center">
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
  );
}