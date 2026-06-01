import { useEffect, useMemo, useState } from "react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { useNavigate } from "react-router-dom";
import { fetchFilteredReceipts } from "../store/receipt.slice";
import { ReceiptFilterDto, ArReceiptDto } from "../dto/receipt.dto";
import { StatusBadge } from "@/components/common";
import { exportExcelReport } from "@/utils/excel/exportExcelReport";
import { Wallet, Plus, Download, Search } from "lucide-react";

export default function ReceiptListPage() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const { items, loading, total, page, total_pages } = useAppSelector((s) => s.receipt);
  const { user } = useAppSelector((s) => s.auth);

  const [filters, setFilters] = useState<ReceiptFilterDto>({
    page: 1,
    page_size: 20,
    search: "",
    status: "",
    approval_status: "",
  });

  useEffect(() => { dispatch(fetchFilteredReceipts(filters)); }, [dispatch]);

  const update = (patch: Partial<ReceiptFilterDto>) => {
    const updated = { ...filters, ...patch, page: 1 };
    setFilters(updated);
    dispatch(fetchFilteredReceipts(updated));
  };

  const handlePageChange = (newPage: number) => {
    const updated = { ...filters, page: newPage };
    setFilters(updated);
    dispatch(fetchFilteredReceipts(updated));
  };

  const handleExport = async () => {
    try {
      await exportExcelReport({
        title: "DANH SÁCH PHIẾU THU (RECEIPTS)",
        columns: [
          { header: "Số phiếu", key: "receipt_no", width: 15 },
          { header: "Ngày phiếu", key: "receipt_date", width: 15, formatter: (v) => v ? new Date(String(v)).toLocaleDateString("vi-VN") : "" },
          { header: "Khách hàng", key: "customer", width: 30, formatter: (v: any) => v?.name || "-" },
          { header: "Số tiền", key: "amount", width: 20, format: "currency", align: "right" },
          { header: "Phương thức", key: "method", width: 15, formatter: (v) => String(v).toUpperCase() },
          { header: "Trạng thái", key: "status", width: 15, formatter: (v) => String(v).toUpperCase() },
          { header: "Duyệt", key: "approval_status", width: 15, formatter: (v) => String(v).toUpperCase() },
        ],
        data: items,
        fileName: `Bao_Cao_Phieu_Thu_${Date.now()}.xlsx`,
        footer: { creator: user?.full_name || "Admin" },
      });
    } catch {
      alert("Lỗi xuất file excel");
    }
  };

  const canCreate = ["ACCOUNT", "CHACC"].includes(user?.role?.code ?? "");

  // Compute display range
  const from = total === 0 ? 0 : ((page - 1) * (filters.page_size ?? 20)) + 1;
  const to = Math.min(page * (filters.page_size ?? 20), total);

  return (
    <div className="page-container">
      <div className="erp-card overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200">
          <div className="flex items-center gap-2.5">
            <span className="w-8 h-8 bg-orange-50 rounded-lg flex items-center justify-center">
              <Wallet className="w-4 h-4 text-orange-500" />
            </span>
            <div>
              <h1 className="text-base font-semibold text-gray-900">Phiếu thu</h1>
              <p className="text-xs text-gray-400 mt-0.5">Quản lý các phiếu thu thanh toán</p>
            </div>
            <span className="ml-1 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-orange-50 text-orange-600">
              {total}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleExport}
              className="inline-flex items-center gap-1.5 h-8 px-3 text-sm font-medium text-gray-600 border border-gray-300 bg-white rounded-md hover:bg-gray-50 transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              Xuất báo cáo
            </button>
            {canCreate && (
              <button
                onClick={() => navigate("/receipts/create")}
                className="inline-flex items-center gap-1.5 h-8 px-3 text-sm font-medium text-white bg-orange-500 rounded-md hover:bg-orange-600 transition-colors shadow-sm"
              >
                <Plus className="w-3.5 h-3.5" />
                Tạo phiếu thu
              </button>
            )}
          </div>
        </div>

        {/* Filters */}
        <div className="px-5 py-3 border-b border-gray-100 bg-gray-50/50">
          <div className="flex gap-3 flex-wrap items-end">
            <div className="flex-1 min-w-56 relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
              <input
                value={filters.search}
                placeholder="Số phiếu, khách hàng..."
                onChange={(e) => update({ search: e.target.value })}
                className="w-full pl-8 pr-3 h-8 text-sm border border-gray-200 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent"
              />
            </div>

            <select
              value={filters.status}
              onChange={(e) => update({ status: e.target.value as any })}
              className="h-8 px-3 text-sm border border-gray-200 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-orange-400 min-w-40"
            >
              <option value="">Tất cả trạng thái</option>
              <option value="draft">Nháp</option>
              <option value="posted">Đã phát hành</option>
            </select>

            <select
              value={filters.approval_status}
              onChange={(e) => update({ approval_status: e.target.value as any })}
              className="h-8 px-3 text-sm border border-gray-200 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-orange-400 min-w-40"
            >
              <option value="">Tất cả phê duyệt</option>
              <option value="draft">Nháp</option>
              <option value="waiting_approval">Chờ duyệt</option>
              <option value="approved">Đã duyệt</option>
              <option value="rejected">Từ chối</option>
            </select>
          </div>
        </div>

        {/* Table */}
        {loading ? (
          <div className="py-16 flex flex-col items-center gap-3 text-gray-400">
            <div className="w-6 h-6 border-2 border-orange-200 border-t-orange-500 rounded-full animate-spin" />
            <span className="text-sm">Đang tải phiếu thu...</span>
          </div>
        ) : items.length === 0 ? (
          <div className="py-16 text-center text-gray-400">
            <Wallet className="w-10 h-10 mx-auto mb-3 text-gray-200" />
            <p className="text-sm font-medium">Không tìm thấy phiếu thu.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/80">
                  <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Số phiếu thu</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Khách hàng</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Ngày phiếu</th>
                  <th className="px-5 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Số tiền</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Phương thức</th>
                  <th className="px-5 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">Trạng thái</th>
                  <th className="px-5 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">Phê duyệt</th>
                  <th className="px-5 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {items.map((receipt: ArReceiptDto) => {
                  const sym = receipt.currency?.symbol || receipt.currency?.code || "VND";
                  const amount = `${Number(receipt.amount || 0).toLocaleString("vi-VN", { maximumFractionDigits: 2 })} ${sym}`;
                  return (
                    <tr key={receipt.id} className="hover:bg-orange-50/30 transition-colors">
                      <td className="px-5 py-3.5">
                        <button
                          onClick={() => navigate(`/receipts/${receipt.id}`)}
                          className="font-semibold text-orange-600 hover:text-orange-700 hover:underline text-sm"
                        >
                          {receipt.receipt_no}
                        </button>
                      </td>
                      <td className="px-5 py-3.5">
                        <p className="text-sm font-medium text-gray-900">{receipt.customer?.name || "—"}</p>
                        {receipt.customer?.phone && (
                          <p className="text-xs text-gray-400 mt-0.5">{receipt.customer.phone}</p>
                        )}
                      </td>
                      <td className="px-5 py-3.5 text-sm text-gray-600">
                        {receipt.receipt_date ? new Date(receipt.receipt_date).toLocaleDateString("vi-VN") : "—"}
                      </td>
                      <td className="px-5 py-3.5 text-right text-sm font-semibold text-gray-900">{amount}</td>
                      <td className="px-5 py-3.5 text-sm text-gray-600 capitalize">{receipt.method || "—"}</td>
                      <td className="px-5 py-3.5 text-center">
                        <StatusBadge status={receipt.status} />
                      </td>
                      <td className="px-5 py-3.5 text-center">
                        <StatusBadge status={receipt.approval_status} />
                      </td>
                      <td className="px-5 py-3.5 text-center">
                        <button
                          onClick={() => navigate(`/receipts/${receipt.id}`)}
                          className="inline-flex items-center gap-1 h-7 px-2.5 text-xs font-medium text-gray-600 border border-gray-200 rounded-md hover:bg-orange-50 hover:border-orange-300 hover:text-orange-600 transition-colors"
                        >
                          Xem
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {!loading && total > 0 && (
          <div className="flex items-center justify-between px-5 py-3 border-t border-gray-100 bg-gray-50/50">
            <p className="text-xs text-gray-500">
              Hiển thị{" "}
              <span className="font-semibold text-gray-700">{from}–{to}</span>{" "}
              / <span className="font-semibold text-gray-700">{total}</span>
            </p>
            <div className="flex items-center gap-1">
              <button
                disabled={page <= 1}
                onClick={() => handlePageChange(page - 1)}
                className="h-7 px-3 text-xs font-medium border border-gray-300 rounded-md text-gray-600 hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                ← Trước
              </button>
              <span className="h-7 px-3 text-xs font-semibold flex items-center bg-orange-500 text-white rounded-md">
                {page} / {total_pages}
              </span>
              <button
                disabled={page >= total_pages}
                onClick={() => handlePageChange(page + 1)}
                className="h-7 px-3 text-xs font-medium border border-gray-300 rounded-md text-gray-600 hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                Sau →
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
