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
      Manual
    </span>
  );
}

/* ─── Matching Badge ───────────────────────────────────────────────────────── */
function MatchingBadge({ status }: { status?: string }) {
  if (!status || status === MatchingStatus.PENDING) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-500">
        <Clock className="w-3 h-3" />
        Pending
      </span>
    );
  }
  if (status === MatchingStatus.MATCHED) {
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
      toast.success(`AP Invoice ${invoice.invoice_no} created successfully`);
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
      toast.success(`Invoice ${deleteTarget.invoice_no} deleted`);
      dispatch(getPurchaseOrdersAvailableForInvoiceThunk());
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setDeleting(false);
      setDeleteTarget(null);
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

  const handleExport = async () => {
    try {
      await exportExcelReport({
        title: "PURCHASE INVOICES LIST",
        columns: [
          { header: "Invoice No", key: "invoice_no", width: 15 },
          {
            header: "Source",
            key: "source",
            width: 10,
            formatter: (val) =>
              val === InvoiceSource.AI_OCR ? "OCR" : "Manual",
          },
          {
            header: "Branch",
            key: "branch",
            width: 20,
            formatter: (val: any) => val?.name || "-",
          },
          {
            header: "Created By",
            key: "creator",
            width: 25,
            formatter: (val: any) => val?.full_name || "-",
          },
          {
            header: "Total Amount",
            key: "total_after_tax",
            width: 20,
            format: "currency",
            align: "right",
          },
          {
            header: "Status",
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
            header: "Created Date",
            key: "created_at",
            width: 15,
            formatter: (val) =>
              val ? new Date(String(val)).toLocaleDateString("en-US") : "",
          },
        ],
        data: filteredInvoices,
        fileName: `Purchase_Invoices_${new Date().getTime()}.xlsx`,
        footer: { creator: user?.full_name || "Admin" },
      });
    } catch (err) {
      console.error(err);
      toast.error("Error exporting report");
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
          title="AP Invoices"
          subtitle="Manage all purchase invoices"
          actions={
            <div className="flex gap-2">
              <button
                onClick={handleExport}
                className="flex items-center gap-2 bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 px-4 py-2.5 rounded-lg font-medium transition-colors"
              >
                <Download className="w-5 h-5" />
                Export Excel
              </button>
              <button
                onClick={handleOpenCreateMethod}
                className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-4 py-2.5 rounded-lg font-medium transition-colors"
              >
                <Plus className="w-5 h-5" />
                Create Invoice
              </button>
            </div>
          }
        />

        {/* ─── Quick Stats ─── */}
        <div className="grid grid-cols-3 gap-4">
          <StatsCard
            icon={FileText}
            label="Total Invoices"
            value={list.length}
            color="orange"
          />
          <StatsCard
            icon={ScanLine}
            label="From OCR"
            value={ocrCount}
            color="purple"
          />
          <StatsCard
            icon={AlertTriangle}
            label="Mismatches"
            value={mismatchCount}
            color="red"
          />
        </div>

        {/* ─── Filters ─── */}
        <div className="bg-white rounded-xl shadow-sm border p-5">
          <div className="flex flex-wrap gap-4 items-end">
            <div className="flex-1 min-w-[240px]">
              <label className="block text-sm font-medium mb-2">Search</label>
              <div className="relative">
                <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Invoice no, creator..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-orange-500 outline-none"
                />
              </div>
            </div>

            <div className="w-44">
              <label className="block text-sm font-medium mb-2">Status</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-orange-500 outline-none"
              >
                <option value="All">All</option>
                <option value={ApInvoiceStatus.DRAFT}>Draft</option>
                <option value={ApInvoiceStatus.POSTED}>Posted</option>
                <option value={ApInvoiceStatus.PARTIALLY_PAID}>
                  Partially Paid
                </option>
                <option value={ApInvoiceStatus.PAID}>Paid</option>
                <option value={ApInvoiceStatus.CANCELLED}>Cancelled</option>
              </select>
            </div>

            <div className="w-44">
              <label className="block text-sm font-medium mb-2">Source</label>
              <select
                value={sourceFilter}
                onChange={(e) => setSourceFilter(e.target.value as any)}
                className="w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-orange-500 outline-none"
              >
                <option value="All">All</option>
                <option value={InvoiceSource.MANUAL}>Manual</option>
                <option value={InvoiceSource.AI_OCR}>OCR</option>
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
                  Invoice No
                </th>
                <th className="px-5 py-4 text-left font-semibold">Source</th>
                <th className="px-5 py-4 text-left font-semibold">Branch</th>
                <th className="px-5 py-4 text-left font-semibold">
                  Created By
                </th>
                <th className="px-5 py-4 text-right font-semibold">
                  Total Amount
                </th>
                <th className="px-5 py-4 text-left font-semibold">Status</th>
                <th className="px-5 py-4 text-left font-semibold">Approval</th>
                <th className="px-5 py-4 text-left font-semibold">Matching</th>
                <th className="px-5 py-4 text-center font-semibold">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y">
              {loading && (
                <tr>
                  <td colSpan={9} className="py-16 text-center">
                    <div className="flex flex-col items-center gap-2 text-gray-500">
                      <FileText className="w-8 h-8 animate-pulse" />
                      Loading...
                    </div>
                  </td>
                </tr>
              )}

              {!loading && filteredInvoices.length === 0 && (
                <tr>
                  <td colSpan={9} className="py-16 text-center">
                    <EmptyState
                      icon={FileText}
                      title="No invoices found"
                      description="Create your first invoice by clicking the Create Invoice button"
                      action={{
                        label: "Create Invoice",
                        onClick: handleOpenCreateMethod,
                      }}
                    />
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
                        "en-US",
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
                          title="View"
                          className="text-gray-400 hover:text-gray-700 transition-colors"
                        >
                          <Eye className="w-5 h-5" />
                        </button>
                        <button
                          title="Export"
                          className="text-gray-400 hover:text-gray-700 transition-colors"
                        >
                          <Download className="w-5 h-5" />
                        </button>
                        {/* Delete — only draft + not submitted */}
                        {invoice.status === "draft" &&
                          invoice.approval_status === "draft" && (
                            <button
                              onClick={() => setDeleteTarget(invoice)}
                              title="Delete"
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

          <div className="px-6 py-4 border-t bg-gray-50 text-sm text-gray-600">
            Showing <strong>{filteredInvoices.length}</strong> /{" "}
            <strong>{list.length}</strong> invoices
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
                Delete Invoice?
              </h3>
              <p className="text-sm text-gray-600">
                Invoice{" "}
                <span className="font-semibold text-gray-900">
                  {deleteTarget.invoice_no}
                </span>{" "}
                will be permanently deleted. This cannot be undone.
              </p>
            </div>
            <div className="px-6 py-4 border-t flex justify-end gap-3 bg-gray-50">
              <button
                onClick={() => setDeleteTarget(null)}
                disabled={deleting}
                className="px-5 py-2.5 rounded-xl border border-gray-300 font-semibold text-gray-700 hover:bg-white transition"
              >
                Cancel
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
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
