import { useEffect, useMemo, useState } from "react";
import {
  Eye,
  Download,
  Plus,
  Search,
  FileText,
  ScanLine,
  PenLine,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Trash2,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  createPartialApInvoiceFromPoThunk,
  getAllApInvoicesThunk,
  deleteApInvoiceThunk,
} from "../../store/apInvoice/apInvoice.thunks";
import {
  ApInvoice,
  ApInvoiceSource,
} from "../../store/apInvoice/apInvoice.types";
import SelectPoModal from "../../components/SelectPoModal";
import CreateInvoiceMethodModal from "../../components/CreateInvoiceMethodModal";
import { getPurchaseOrdersAvailableForInvoiceThunk } from "../../store/purchaseOrder.thunks";
import { loadPartnerDetail } from "@/features/partner/store/partner.thunks";
import { PurchaseOrder } from "../../store/purchaseOrder.types";
import ConfirmCreateInvoiceModal, {
  InvoiceMetadata,
} from "../../components/ConfirmCreateInvoiceModal";
import { toast } from "react-toastify";
import { getErrorMessage } from "@/utils/ErrorHelper";
import { useNavigate } from "react-router-dom";
import { exportExcelReport } from "@/utils/excel/exportExcelReport";
import {
  PageHeader,
  StatsCard,
  StatusBadge,
  EmptyState,
} from "../../components/Common";
import {
  ApInvoiceStatus,
  InvoiceSource,
  MatchingStatus,
} from "../../constants";

/* ─── Source Badge ─────────────────────────────────────────────────────────── */
function SourceBadge({ source }: { source: ApInvoiceSource }) {
  if (source === InvoiceSource.AI_OCR) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-700">
        <ScanLine className="w-3 h-3" />
        OCR
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
      <PenLine className="w-3 h-3" />
      Thủ công
    </span>
  );
}

/* ─── Matching Badge ───────────────────────────────────────────────────────── */
function MatchingBadge({ status }: { status?: string }) {
  if (!status || status === MatchingStatus.PENDING) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-500">
        <Clock className="w-3 h-3" />
        Đang chờ
      </span>
    );
  }
  if (status === MatchingStatus.MATCHED) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">
        <CheckCircle2 className="w-3 h-3" />
        Khớp
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700">
      <AlertTriangle className="w-3 h-3" />
      Lệch
    </span>
  );
}

/* ─── OCR Confidence Badge ─────────────────────────────────────────────────── */
function ConfidenceBadge({ value }: { value?: number | null }) {
  if (value == null) return null;
  const pct = Math.round(value * 100);
  const color =
    pct >= 85
      ? "bg-green-100 text-green-700"
      : pct >= 60
        ? "bg-yellow-100 text-yellow-700"
        : "bg-red-100 text-red-700";
  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${color}`}>
      {pct}%
    </span>
  );
}

/* ─── Main Page ────────────────────────────────────────────────────────────── */
export default function ApInvoicePages() {
  const dispatch = useAppDispatch();
  const { list, loading } = useAppSelector((state) => state.apInvoice);
  const { user } = useAppSelector((state) => state.auth);
  const { availableForInvoice } = useAppSelector(
    (state) => state.purchaseOrder,
  );

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [sourceFilter, setSourceFilter] = useState<"All" | ApInvoiceSource>(
    "All",
  );

  const [openSelectPo, setOpenSelectPo] = useState(false);
  const [openConfirm, setOpenConfirm] = useState(false);
  const [openCreateMethod, setOpenCreateMethod] = useState(false);
  const [selectedPo, setSelectedPo] = useState<PurchaseOrder | null>(null);
  const [creatingInvoice, setCreatingInvoice] = useState(false);

  // Delete state
  const [deleteTarget, setDeleteTarget] = useState<ApInvoice | null>(null);
  const [deleting, setDeleting] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    dispatch(getAllApInvoicesThunk());
  }, [dispatch]);

  const handleOpenSelectPo = () => {
    setOpenSelectPo(true);
    dispatch(getPurchaseOrdersAvailableForInvoiceThunk());
  };

  const handleOpenCreateMethod = () => {
    setOpenCreateMethod(true);
  };

  const handleSelectFromPo = () => {
    setOpenCreateMethod(false);
    handleOpenSelectPo();
  };

  const handleSelectFromOcr = () => {
    setOpenCreateMethod(false);
    navigate("/purchase/document-intelligence/upload");
  };

  const handleConfirmCreateInvoice = async (
    lines: Array<{ po_line_id: number; quantity: number }>,
    metadata: InvoiceMetadata,
  ) => {
    if (!selectedPo) return;
    setCreatingInvoice(true);
    try {
      const invoice = await dispatch(
        createPartialApInvoiceFromPoThunk({
          poId: selectedPo.id,
          lines,
          metadata,
        }),
      ).unwrap();
      toast.success(`Đã tạo hóa đơn AP ${invoice.invoice_no} thành công`);
      dispatch(getPurchaseOrdersAvailableForInvoiceThunk());
      dispatch(getAllApInvoicesThunk());
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setCreatingInvoice(false);
      setOpenConfirm(false);
      setSelectedPo(null);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await dispatch(deleteApInvoiceThunk(deleteTarget.id)).unwrap();
      toast.success(`Đã xóa hóa đơn ${deleteTarget.invoice_no}`);
      dispatch(getPurchaseOrdersAvailableForInvoiceThunk());
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setDeleting(false);
      setDeleteTarget(null);
    }
  };

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter, sourceFilter]);

  const filteredInvoices = useMemo(() => {
    return list.filter((invoice: ApInvoice) => {
      const matchesSearch =
        invoice.invoice_no.toLowerCase().includes(searchTerm.toLowerCase()) ||
        invoice.creator?.full_name
          ?.toLowerCase()
          .includes(searchTerm.toLowerCase());
      const matchesStatus =
        statusFilter === "All" || invoice.status === statusFilter;
      const matchesSource =
        sourceFilter === "All" || invoice.source === sourceFilter;
      return matchesSearch && matchesStatus && matchesSource;
    });
  }, [list, searchTerm, statusFilter, sourceFilter]);

  const totalPages = Math.ceil(filteredInvoices.length / itemsPerPage);
  const paginatedInvoices = useMemo(() => {
    return filteredInvoices.slice(
      (currentPage - 1) * itemsPerPage,
      currentPage * itemsPerPage
    );
  }, [filteredInvoices, currentPage]);

  const handleExport = async () => {
    try {
      await exportExcelReport({
        title: "DANH SÁCH HÓA ĐƠN MUA HÀNG",
        columns: [
          { header: "Mã hóa đơn", key: "invoice_no", width: 15 },
          {
            header: "Nguồn",
            key: "source",
            width: 10,
            formatter: (val) =>
              val === InvoiceSource.AI_OCR ? "OCR" : "Thủ công",
          },
          {
            header: "Chi nhánh",
            key: "branch",
            width: 20,
            formatter: (val: any) => val?.name || "-",
          },
          {
            header: "Người tạo",
            key: "creator",
            width: 25,
            formatter: (val: any) => val?.full_name || "-",
          },
          {
            header: "Tổng tiền",
            key: "total_after_tax",
            width: 20,
            format: "currency",
            align: "right",
          },
          {
            header: "Trạng thái",
            key: "status",
            width: 15,
            formatter: (val) => String(val).toUpperCase(),
          },
          {
            header: "Đối chiếu",
            key: "matching_status",
            width: 12,
            formatter: (val) => String(val || "pending").toUpperCase(),
          },
          {
            header: "Ngày tạo",
            key: "created_at",
            width: 15,
            formatter: (val) =>
              val ? new Date(String(val)).toLocaleDateString("vi-VN") : "",
          },
        ],
        data: filteredInvoices,
        fileName: `Hoa_Don_Mua_Hang_${new Date().getTime()}.xlsx`,
        footer: { creator: user?.full_name || "Admin" },
      });
    } catch (err) {
      console.error(err);
      toast.error("Lỗi khi xuất báo cáo");
    }
  };

  /* ─── Stats ─── */
  const ocrCount = list.filter((i) => i.source === InvoiceSource.AI_OCR).length;
  const mismatchCount = list.filter(
    (i) => i.matching_status === MatchingStatus.MISMATCH,
  ).length;

  return (
    <div className="min-h-screen bg-gray-50 px-8 py-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* ─── Header ─── */}
        <PageHeader
          title="Hóa đơn AP"
          subtitle="Quản lý tất cả hóa đơn mua hàng"
          icon={<FileText className="w-5 h-5" />}
          actions={
            <div className="flex gap-2">
              <button
                onClick={handleExport}
                className="flex items-center gap-2 bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 px-4 py-2.5 rounded-lg font-medium transition-colors"
              >
                <Download className="w-5 h-5" />
                Xuất Excel
              </button>
              <button
                onClick={handleOpenCreateMethod}
                className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-4 py-2.5 rounded-lg font-medium transition-colors"
              >
                <Plus className="w-5 h-5" />
                Tạo hóa đơn
              </button>
            </div>
          }
        />

        {/* ─── Quick Stats ─── */}
        <div className="grid grid-cols-3 gap-4">
          <StatsCard
            icon={FileText}
            label="Tổng số hóa đơn"
            value={list.length}
            color="orange"
          />
          <StatsCard
            icon={ScanLine}
            label="Từ OCR"
            value={ocrCount}
            color="purple"
          />
          <StatsCard
            icon={AlertTriangle}
            label="Hóa đơn lệch"
            value={mismatchCount}
            color="red"
          />
        </div>

        {/* ─── Filters ─── */}
        <div className="bg-white rounded-xl shadow-sm border-l-4 border-l-orange-400 border p-5">
          <div className="flex flex-wrap gap-4 items-end">
            <div className="flex-1 min-w-[240px]">
              <label className="block text-sm font-medium mb-2">Tìm kiếm</label>
              <div className="relative">
                <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Mã hóa đơn, người tạo..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-orange-500 outline-none"
                />
              </div>
            </div>

            <div className="w-44">
              <label className="block text-sm font-medium mb-2">Trạng thái</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-orange-500 outline-none"
              >
                <option value="All">Tất cả</option>
                <option value={ApInvoiceStatus.DRAFT}>Nháp</option>
                <option value={ApInvoiceStatus.POSTED}>Đã ghi sổ</option>
                <option value={ApInvoiceStatus.PARTIALLY_PAID}>
                  Thanh toán một phần
                </option>
                <option value={ApInvoiceStatus.PAID}>Đã thanh toán</option>
                <option value={ApInvoiceStatus.CANCELLED}>Đã hủy</option>
              </select>
            </div>

            <div className="w-44">
              <label className="block text-sm font-medium mb-2">Nguồn</label>
              <select
                value={sourceFilter}
                onChange={(e) => setSourceFilter(e.target.value as any)}
                className="w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-orange-500 outline-none"
              >
                <option value="All">Tất cả</option>
                <option value={InvoiceSource.MANUAL}>Thủ công</option>
                <option value={InvoiceSource.AI_OCR}>OCR</option>
              </select>
            </div>
          </div>
        </div>

        {/* ─── Table ─── */}
        <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-orange-50/60 border-b border-orange-100">
              <tr>
                <th className="px-5 py-4 text-left font-semibold text-gray-700">
                  Mã hóa đơn
                </th>
                <th className="px-5 py-4 text-left font-semibold text-gray-700">
                  Nguồn
                </th>
                <th className="px-5 py-4 text-left font-semibold text-gray-700">
                  Chi nhánh
                </th>
                <th className="px-5 py-4 text-left font-semibold text-gray-700">
                  Người tạo
                </th>
                <th className="px-5 py-4 text-right font-semibold text-gray-700">
                  Tổng tiền
                </th>
                <th className="px-5 py-4 text-left font-semibold text-gray-700">
                  Trạng thái
                </th>
                <th className="px-5 py-4 text-left font-semibold text-gray-700">
                  Phê duyệt
                </th>
                <th className="px-5 py-4 text-left font-semibold text-gray-700">
                  Đối chiếu
                </th>
                <th className="px-5 py-4 text-center font-semibold text-gray-700">
                  Thao tác
                </th>
              </tr>
            </thead>

            <tbody className="divide-y">
              {loading && (
                <tr>
                  <td colSpan={9} className="py-16 text-center">
                    <div className="flex flex-col items-center gap-2 text-gray-500">
                      <FileText className="w-8 h-8 animate-pulse" />
                      Đang tải...
                    </div>
                  </td>
                </tr>
              )}

              {!loading && filteredInvoices.length === 0 && (
                <tr>
                  <td colSpan={9} className="py-16 text-center">
                    <EmptyState
                      icon={FileText}
                      title="Không tìm thấy hóa đơn nào"
                      description="Tạo hóa đơn đầu tiên của bạn bằng cách nhấp vào nút Tạo hóa đơn"
                      action={{
                        label: "Tạo hóa đơn",
                        onClick: handleOpenCreateMethod,
                      }}
                    />
                  </td>
                </tr>
              )}

              {!loading &&
                paginatedInvoices.map((invoice) => (
                  <tr
                    key={invoice.id}
                    className="hover:bg-orange-50/40 transition-colors"
                  >
                    <td className="px-5 py-4">
                      <div className="font-semibold text-orange-600">
                        {invoice.invoice_no}
                      </div>
                      {invoice.source === InvoiceSource.AI_OCR &&
                        invoice.ocr_confidence != null && (
                          <div className="mt-1">
                            <ConfidenceBadge value={invoice.ocr_confidence} />
                          </div>
                        )}
                    </td>
                    <td className="px-5 py-4">
                      <SourceBadge source={invoice.source ?? "manual"} />
                    </td>
                    <td className="px-5 py-4 text-gray-700">
                      {invoice.branch?.name}
                    </td>
                    <td className="px-5 py-4 text-gray-700">
                      {invoice.creator?.full_name}
                    </td>
                    <td className="px-5 py-4 text-right font-medium">
                      {Number(invoice.total_after_tax || 0).toLocaleString(
                        "vi-VN",
                        {
                          minimumFractionDigits: 0,
                        },
                      )}
                    </td>
                    <td className="px-5 py-4">
                      <StatusBadge status={invoice.status} />
                    </td>
                    <td className="px-5 py-4">
                      <StatusBadge
                        status={invoice.approval_status}
                        variant="approval"
                      />
                    </td>
                    <td className="px-5 py-4">
                      <MatchingBadge status={invoice.matching_status} />
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex justify-center gap-3">
                        <button
                          onClick={() =>
                            navigate(`/purchase/invoices/${invoice.id}`)
                          }
                          title="Xem"
                          className="text-gray-400 hover:text-gray-700 transition-colors"
                        >
                          <Eye className="w-5 h-5" />
                        </button>
                        <button
                          title="Xuất"
                          className="text-gray-400 hover:text-gray-700 transition-colors"
                        >
                          <Download className="w-5 h-5" />
                        </button>
                        {/* Delete — only draft + not submitted */}
                        {invoice.status === "draft" &&
                          invoice.approval_status === "draft" && (
                            <button
                              onClick={() => setDeleteTarget(invoice)}
                              title="Xóa"
                              className="text-gray-400 hover:text-red-600 transition-colors"
                            >
                              <Trash2 className="w-5 h-5" />
                            </button>
                          )}
                      </div>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between px-6 py-4 border-t bg-orange-50/40 gap-3 text-sm text-gray-600">
            <p>
              Hiển thị <strong>{filteredInvoices.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0}–{Math.min(currentPage * itemsPerPage, filteredInvoices.length)}</strong> trên{" "}
              <strong>{filteredInvoices.length}</strong> hóa đơn (Tổng cộng <strong>{list.length}</strong> bản ghi)
            </p>

            {filteredInvoices.length > 0 && (
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="h-8 w-8 flex items-center justify-center rounded border border-gray-300 bg-white text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>

                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`h-8 min-w-[2rem] px-2 rounded border text-xs font-semibold transition-colors ${
                      currentPage === page
                        ? "bg-orange-500 border-orange-500 text-white"
                        : "border-gray-300 bg-white text-gray-600 hover:bg-gray-50"
                    }`}
                  >
                    {page}
                  </button>
                ))}

                <button
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="h-8 w-8 flex items-center justify-center rounded border border-gray-300 bg-white text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <CreateInvoiceMethodModal
        open={openCreateMethod}
        onClose={() => setOpenCreateMethod(false)}
        onSelectFromPo={handleSelectFromPo}
        onSelectFromOcr={handleSelectFromOcr}
      />

      <SelectPoModal
        open={openSelectPo}
        poList={availableForInvoice}
        onClose={() => setOpenSelectPo(false)}
        onSelect={(po) => {
          if (po.supplier_id) dispatch(loadPartnerDetail(po.supplier_id));
          setSelectedPo(po);
          setOpenSelectPo(false);
          setOpenConfirm(true);
        }}
      />

      <ConfirmCreateInvoiceModal
        open={openConfirm}
        po={selectedPo}
        loading={creatingInvoice}
        onCancel={() => {
          setOpenConfirm(false);
          setSelectedPo(null);
        }}
        onConfirmPartial={handleConfirmCreateInvoice}
      />

      {/* ── Delete Confirm Modal ── */}
      {deleteTarget && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white w-[400px] rounded-2xl shadow-2xl overflow-hidden">
            <div className="px-6 py-5 flex flex-col items-center text-center gap-3">
              <div className="w-14 h-14 rounded-full bg-red-100 flex items-center justify-center">
                <Trash2 className="w-7 h-7 text-red-600" />
              </div>
              <h3 className="font-bold text-lg text-gray-900">
                Xóa hóa đơn?
              </h3>
              <p className="text-sm text-gray-600">
                Hóa đơn{" "}
                <span className="font-semibold text-gray-900">
                  {deleteTarget.invoice_no}
                </span>{" "}
                sẽ bị xóa vĩnh viễn. Không thể hoàn tác hành động này.
              </p>
            </div>
            <div className="px-6 py-4 border-t flex justify-end gap-3 bg-gray-50">
              <button
                onClick={() => setDeleteTarget(null)}
                disabled={deleting}
                className="px-5 py-2.5 rounded-xl border border-gray-300 font-semibold text-gray-700 hover:bg-white transition"
              >
                Hủy
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-semibold transition disabled:opacity-50 flex items-center gap-2"
              >
                {deleting && (
                  <svg
                     className="w-4 h-4 animate-spin"
                     viewBox="0 0 24 24"
                     fill="none"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8v8H4z"
                    />
                  </svg>
                )}
                Có, xóa
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
