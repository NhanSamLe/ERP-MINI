import { useEffect, useMemo, useState } from "react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { useNavigate } from "react-router-dom";
import {
  fetchInvoices,
  fetchAvailableOrders,
  createInvoice,
} from "../store/invoice.slice";
import { ArInvoiceDto } from "../dto/invoice.dto";
import { StatusBadge } from "@/components/common";
import { exportExcelReport } from "@/utils/excel/exportExcelReport";
import CreateInvoiceModal from "../components/ar.components.ts/InvoiceCreateModal";
import { FileText, Plus, Download, Search, Eye } from "lucide-react";
import { toast } from "react-toastify";

export default function InvoiceListPage() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const { items, loading, availableOrders } = useAppSelector((s) => s.invoice);
  const { user } = useAppSelector((s) => s.auth);

  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [approvalStatus, setApprovalStatus] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const itemsPerPage = 20;

  useEffect(() => { dispatch(fetchInvoices()); }, [dispatch]);
  useEffect(() => { setCurrentPage(1); }, [search, status, approvalStatus]);

  const canCreate = ["ACCOUNT", "CHACC"].includes(user?.role?.code ?? "");

  const filtered = useMemo(() => {
    return items.filter((inv) => {
      const s = search.toLowerCase();
      const customerName =
        inv.customer?.name ||
        inv.order?.customer?.name ||
        "";
      const matchSearch =
        !search ||
        inv.invoice_no.toLowerCase().includes(s) ||
        customerName.toLowerCase().includes(s);
      const matchStatus = !status || inv.status === status;
      const matchApproval = !approvalStatus || inv.approval_status === approvalStatus;
      return matchSearch && matchStatus && matchApproval;
    });
  }, [items, search, status, approvalStatus]);

  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const paginated = useMemo(
    () => filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage),
    [filtered, currentPage]
  );

  const handleOpenModal = () => {
    dispatch(fetchAvailableOrders());
    setModalOpen(true);
  };

  const handleSelectOrder = (orderId: number) => {
    dispatch(createInvoice({ order_id: orderId })).then((action: any) => {
      setModalOpen(false);
      dispatch(fetchInvoices());
      if (action.payload?.id) navigate(`/invoices/${action.payload.id}`);
    });
  };

  const handleExport = async () => {
    try {
      await exportExcelReport({
        title: "DANH SÁCH HÓA ĐƠN BÁN HÀNG (AR INVOICES)",
        columns: [
          { header: "Số hóa đơn", key: "invoice_no", width: 15 },
          { header: "Ngày hóa đơn", key: "invoice_date", width: 15, formatter: (v) => v ? new Date(String(v)).toLocaleDateString("vi-VN") : "" },
          { header: "Khách hàng", key: "customer", width: 30, formatter: (v: any) => v?.name || "-" },
          { header: "Tổng tiền", key: "total_after_tax", width: 20, format: "currency", align: "right" },
          { header: "Trạng thái", key: "status", width: 15, formatter: (v) => String(v).toUpperCase() },
          { header: "Duyệt", key: "approval_status", width: 15, formatter: (v) => String(v).toUpperCase() },
          { header: "Người tạo", key: "creator", width: 20, formatter: (v: any) => v?.full_name || "-" },
        ],
        data: filtered,
        fileName: `Bao_Cao_Hoa_Don_${Date.now()}.xlsx`,
        footer: { creator: user?.full_name || "Admin" },
      });
    } catch {
      toast.error("Lỗi xuất file Excel");
    }
  };

  return (
    <div className="page-container">
      <div className="erp-card overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200">
          <div className="flex items-center gap-2.5">
            <span className="w-8 h-8 bg-orange-50 rounded-lg flex items-center justify-center">
              <FileText className="w-4 h-4 text-orange-500" />
            </span>
            <div>
              <h1 className="text-base font-semibold text-gray-900">Hóa đơn bán hàng</h1>
              <p className="text-xs text-gray-400 mt-0.5">Quản lý tất cả hóa đơn AR</p>
            </div>
            <span className="ml-1 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-orange-50 text-orange-600">
              {filtered.length}
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
                onClick={handleOpenModal}
                className="inline-flex items-center gap-1.5 h-8 px-3 text-sm font-medium text-white bg-orange-500 rounded-md hover:bg-orange-600 transition-colors shadow-sm"
              >
                <Plus className="w-3.5 h-3.5" />
                Tạo hóa đơn
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
                value={search}
                placeholder="Số hóa đơn, khách hàng..."
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-8 pr-3 h-8 text-sm border border-gray-200 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent"
              />
            </div>

            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="h-8 px-3 text-sm border border-gray-200 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-orange-400 min-w-40"
            >
              <option value="">Tất cả trạng thái</option>
              <option value="draft">Nháp</option>
              <option value="posted">Đã phát hành</option>
              <option value="partially_paid">Thanh toán 1 phần</option>
              <option value="paid">Đã thanh toán</option>
              <option value="cancelled">Đã hủy</option>
            </select>

            <select
              value={approvalStatus}
              onChange={(e) => setApprovalStatus(e.target.value)}
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
            <span className="text-sm">Đang tải hóa đơn...</span>
          </div>
        ) : paginated.length === 0 ? (
          <div className="py-16 text-center text-gray-400">
            <FileText className="w-10 h-10 mx-auto mb-3 text-gray-200" />
            <p className="text-sm font-medium">Không tìm thấy hóa đơn.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/80">
                  <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Số hóa đơn</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Khách hàng</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Ngày HĐ</th>
                  <th className="px-5 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Tổng tiền</th>
                  <th className="px-5 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">Trạng thái</th>
                  <th className="px-5 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">Phê duyệt</th>
                  <th className="px-5 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {paginated.map((inv: ArInvoiceDto) => {
                  const customerName = inv.customer?.name || inv.order?.customer?.name || "—";
                  const sym = inv.currency?.symbol || inv.currency?.code || "VND";
                  const amount = `${Number(inv.total_after_tax || 0).toLocaleString("vi-VN", { maximumFractionDigits: 2 })} ${sym}`;
                  return (
                    <tr key={inv.id} className="hover:bg-orange-50/30 transition-colors">
                      <td className="px-5 py-3.5">
                        <button
                          onClick={() => navigate(`/invoices/${inv.id}`)}
                          className="font-semibold text-orange-600 hover:text-orange-700 hover:underline text-sm"
                        >
                          {inv.invoice_no}
                        </button>
                      </td>
                      <td className="px-5 py-3.5">
                        <p className="text-sm font-medium text-gray-900">{customerName}</p>
                      </td>
                      <td className="px-5 py-3.5 text-sm text-gray-600">
                        {inv.invoice_date ? new Date(inv.invoice_date).toLocaleDateString("vi-VN") : "—"}
                      </td>
                      <td className="px-5 py-3.5 text-right text-sm font-semibold text-gray-900">{amount}</td>
                      <td className="px-5 py-3.5 text-center">
                        <StatusBadge status={inv.status} />
                      </td>
                      <td className="px-5 py-3.5 text-center">
                        <StatusBadge status={inv.approval_status} />
                      </td>
                      <td className="px-5 py-3.5 text-center">
                        <button
                          onClick={() => navigate(`/invoices/${inv.id}`)}
                          title="Xem chi tiết"
                          className="p-1.5 rounded text-gray-400 hover:text-orange-600 hover:bg-orange-50 transition-colors"
                        >
                          <Eye className="w-3.5 h-3.5" />
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
        {!loading && filtered.length > 0 && (
          <div className="flex items-center justify-between px-5 py-3 border-t border-gray-100 bg-gray-50/50">
            <p className="text-xs text-gray-500">
              Hiển thị{" "}
              <span className="font-semibold text-gray-700">
                {(currentPage - 1) * itemsPerPage + 1}–{Math.min(currentPage * itemsPerPage, filtered.length)}
              </span>{" "}
              / <span className="font-semibold text-gray-700">{filtered.length}</span>
            </p>
            <div className="flex items-center gap-1">
              <button
                disabled={currentPage <= 1}
                onClick={() => setCurrentPage((p) => p - 1)}
                className="h-7 px-3 text-xs font-medium border border-gray-300 rounded-md text-gray-600 hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                ← Trước
              </button>
              <span className="h-7 px-3 text-xs font-semibold flex items-center bg-orange-500 text-white rounded-md">
                {currentPage} / {totalPages}
              </span>
              <button
                disabled={currentPage >= totalPages}
                onClick={() => setCurrentPage((p) => p + 1)}
                className="h-7 px-3 text-xs font-medium border border-gray-300 rounded-md text-gray-600 hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                Sau →
              </button>
            </div>
          </div>
        )}
      </div>

      <CreateInvoiceModal
        open={modalOpen}
        orders={availableOrders}
        onClose={() => setModalOpen(false)}
        onSelect={handleSelectOrder}
      />
    </div>
  );
}
