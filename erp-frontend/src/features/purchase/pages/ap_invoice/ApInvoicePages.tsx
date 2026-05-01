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
} from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  createApInvoiceFromPoThunk,
  getAllApInvoicesThunk,
} from "../../store/apInvoice/apInvoice.thunks";
import {
  ApInvoice,
  ApInvoiceSource,
} from "../../store/apInvoice/apInvoice.types";
import SelectPoModal from "../../components/SelectPoModal";
import { getPurchaseOrdersAvailableForInvoiceThunk } from "../../store/purchaseOrder.thunks";
import { loadPartnerDetail } from "@/features/partner/store/partner.thunks";
import { PurchaseOrder } from "../../store/purchaseOrder.types";
import ConfirmCreateInvoiceModal from "../../components/ConfirmCreateInvoiceModal";
import { toast } from "react-toastify";
import { getErrorMessage } from "@/utils/ErrorHelper";
import { useNavigate } from "react-router-dom";
import { exportExcelReport } from "@/utils/excel/exportExcelReport";

/* ─── Source Badge ─────────────────────────────────────────────────────────── */
function SourceBadge({ source }: { source: ApInvoiceSource }) {
  if (source === "ai_ocr") {
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
      Manual
    </span>
  );
}

/* ─── Matching Badge ───────────────────────────────────────────────────────── */
function MatchingBadge({ status }: { status?: string }) {
  if (!status || status === "pending") {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-500">
        <Clock className="w-3 h-3" />
        Pending
      </span>
    );
  }
  if (status === "matched") {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">
        <CheckCircle2 className="w-3 h-3" />
        Matched
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700">
      <AlertTriangle className="w-3 h-3" />
      Mismatch
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
  const [selectedPo, setSelectedPo] = useState<PurchaseOrder | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    dispatch(getAllApInvoicesThunk());
  }, [dispatch]);

  const handleOpenSelectPo = () => {
    setOpenSelectPo(true);
    dispatch(getPurchaseOrdersAvailableForInvoiceThunk());
  };

  const handleConfirmCreateInvoice = async () => {
    if (!selectedPo) return;
    try {
      const invoice = await dispatch(
        createApInvoiceFromPoThunk(selectedPo.id),
      ).unwrap();
      toast.success(`AP Invoice ${invoice.invoice_no} created successfully`);
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setOpenConfirm(false);
      setSelectedPo(null);
    }
  };

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

  /* ─── Badges ─── */
  const statusBadge: Record<string, string> = {
    draft: "bg-gray-100 text-gray-700",
    posted: "bg-orange-100 text-orange-700",
    paid: "bg-green-100 text-green-700",
    cancelled: "bg-red-100 text-red-700",
  };

  const approvalBadge: Record<string, string> = {
    draft: "bg-gray-100 text-gray-700",
    waiting_approval: "bg-yellow-100 text-yellow-700",
    approved: "bg-green-100 text-green-700",
    rejected: "bg-red-100 text-red-700",
  };

  const handleExport = async () => {
    try {
      await exportExcelReport({
        title: "DANH SÁCH HÓA ĐƠN MUA HÀNG (AP INVOICES)",
        columns: [
          { header: "Số hóa đơn", key: "invoice_no", width: 15 },
          {
            header: "Nguồn",
            key: "source",
            width: 10,
            formatter: (val) => (val === "ai_ocr" ? "OCR" : "Manual"),
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
            header: "Matching",
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
        fileName: `Bao_Cao_Hoa_Don_Mua_Hang_${new Date().getTime()}.xlsx`,
        footer: { creator: user?.full_name || "Admin" },
      });
    } catch (err) {
      console.error(err);
      toast.error("Lỗi xuất báo cáo Excel");
    }
  };

  /* ─── Stats ─── */
  const ocrCount = list.filter((i) => i.source === "ai_ocr").length;
  const mismatchCount = list.filter(
    (i) => i.matching_status === "mismatch",
  ).length;

  return (
    <div className="min-h-screen bg-gray-50 px-8 py-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* ─── Header ─── */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              AP Invoice List
            </h1>
            <p className="text-gray-600 mt-1">Manage all purchase invoices</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleExport}
              className="flex items-center gap-2 bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 px-4 py-2.5 rounded-lg font-medium transition-colors"
            >
              <Download className="w-5 h-5" />
              Export Excel
            </button>
            <button
              onClick={() => navigate("/purchase/document-intelligence/upload")}
              className="flex items-center gap-2 bg-purple-500 hover:bg-purple-600 text-white px-4 py-2.5 rounded-lg font-medium transition-colors"
            >
              <ScanLine className="w-5 h-5" />
              OCR Invoice
            </button>
            <button
              onClick={handleOpenSelectPo}
              className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-4 py-2.5 rounded-lg font-medium transition-colors"
            >
              <Plus className="w-5 h-5" />
              New Invoice
            </button>
          </div>
        </div>

        {/* ─── Quick Stats ─── */}
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-white rounded-xl border p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-orange-100 flex items-center justify-center">
              <FileText className="w-5 h-5 text-orange-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{list.length}</p>
              <p className="text-sm text-gray-500">Tổng hóa đơn</p>
            </div>
          </div>
          <div className="bg-white rounded-xl border p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
              <ScanLine className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{ocrCount}</p>
              <p className="text-sm text-gray-500">Từ OCR</p>
            </div>
          </div>
          <div className="bg-white rounded-xl border p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-red-100 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">
                {mismatchCount}
              </p>
              <p className="text-sm text-gray-500">Sai lệch matching</p>
            </div>
          </div>
        </div>

        {/* ─── Filters ─── */}
        <div className="bg-white rounded-xl shadow-sm border p-5">
          <div className="flex flex-wrap gap-4 items-end">
            <div className="flex-1 min-w-[240px]">
              <label className="block text-sm font-medium mb-2">Tìm kiếm</label>
              <div className="relative">
                <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Số hóa đơn, người tạo..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-orange-500 outline-none"
                />
              </div>
            </div>

            <div className="w-44">
              <label className="block text-sm font-medium mb-2">
                Trạng thái
              </label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-orange-500 outline-none"
              >
                <option value="All">Tất cả</option>
                <option value="draft">Draft</option>
                <option value="posted">Posted</option>
                <option value="paid">Paid</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>

            <div className="w-44">
              <label className="block text-sm font-medium mb-2">
                Nguồn tạo
              </label>
              <select
                value={sourceFilter}
                onChange={(e) => setSourceFilter(e.target.value as any)}
                className="w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-orange-500 outline-none"
              >
                <option value="All">Tất cả</option>
                <option value="manual">Manual</option>
                <option value="ai_ocr">OCR</option>
              </select>
            </div>
          </div>
        </div>

        {/* ─── Table ─── */}
        <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-5 py-4 text-left font-semibold">
                  Số hóa đơn
                </th>
                <th className="px-5 py-4 text-left font-semibold">Nguồn</th>
                <th className="px-5 py-4 text-left font-semibold">Chi nhánh</th>
                <th className="px-5 py-4 text-left font-semibold">Người tạo</th>
                <th className="px-5 py-4 text-right font-semibold">
                  Tổng tiền
                </th>
                <th className="px-5 py-4 text-left font-semibold">
                  Trạng thái
                </th>
                <th className="px-5 py-4 text-left font-semibold">Phê duyệt</th>
                <th className="px-5 py-4 text-left font-semibold">Matching</th>
                <th className="px-5 py-4 text-center font-semibold">
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
                  <td colSpan={9} className="py-16 text-center text-gray-500">
                    Không tìm thấy hóa đơn
                  </td>
                </tr>
              )}

              {!loading &&
                filteredInvoices.map((invoice) => (
                  <tr key={invoice.id} className="hover:bg-gray-50">
                    <td className="px-5 py-4">
                      <div className="font-semibold text-orange-600">
                        {invoice.invoice_no}
                      </div>
                      {invoice.source === "ai_ocr" &&
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
                      <span
                        className={`px-2.5 py-1 rounded-md text-xs font-medium ${statusBadge[invoice.status]}`}
                      >
                        {invoice.status.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <span
                        className={`px-2.5 py-1 rounded-md text-xs font-medium ${approvalBadge[invoice.approval_status]}`}
                      >
                        {invoice.approval_status
                          .replace("_", " ")
                          .toUpperCase()}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <MatchingBadge status={invoice.matching_status} />
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex justify-center gap-3">
                        <Eye
                          onClick={() =>
                            navigate(`/purchase/invoices/${invoice.id}`)
                          }
                          className="w-5 h-5 cursor-pointer text-gray-500 hover:text-gray-900"
                        />
                        <Download className="w-5 h-5 cursor-pointer text-gray-500 hover:text-gray-900" />
                      </div>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>

          <div className="px-6 py-4 border-t bg-gray-50 text-sm text-gray-600">
            Hiển thị <strong>{filteredInvoices.length}</strong> /{" "}
            <strong>{list.length}</strong> hóa đơn
          </div>
        </div>
      </div>

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
        onCancel={() => {
          setOpenConfirm(false);
          setSelectedPo(null);
        }}
        onConfirm={handleConfirmCreateInvoice}
      />
    </div>
  );
}
