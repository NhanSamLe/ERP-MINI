import { useState, useEffect } from "react";
import { Button } from "../../../components/ui/Button";
import { Textarea } from "../../../components/ui/textarea";
import { useSelector, useDispatch } from "react-redux";
import { RootState, AppDispatch } from "../../../store/store";
import { useParams, useNavigate } from "react-router-dom";
import { fetchProductByIdThunk } from "../../products/store/product.thunks";
import { fetchTaxRatesByIdThunk } from "../../master-data/store/master-data/tax/tax.thunks";
import { fetchAllBranchesThunk } from "../../../features/company/store/branch.thunks";
import {
  approvePurchaseOrderThunk,
  cancelPurchaseOrderThunk,
  fetchPurchaseOrderByIdThunk,
  submitPurchaseOrderThunk,
  fetchPurchaseOrderAuditLogsThunk,
} from "../store/purchaseOrder.thunks";
import { PurchaseOrderLine } from "../store";
import { toast } from "react-toastify";
import { getErrorMessage } from "@/utils/ErrorHelper";
import { loadPartnerDetail } from "@/features/partner/store/partner.thunks";
import { PurchaseOrderStatus } from "../constants";
import { Partner } from "@/features/partner/store";
import { Roles } from "@/types/enum";
import { formatVND } from "@/utils/currency.helper";
import { formatDateTime } from "@/utils/time.helper";
import { AuditLogCard, StatusBadge } from "../components/Common";
import {
  ShoppingCart,
  ArrowLeft,
  Send,
  CheckCircle,
  XCircle,
  Package,
  Building2,
  User,
  Calendar,
  Clock,
  TrendingUp,
  Mail,
  Phone,
  FileText,
  Edit,
  Hash,
  ChevronRight,
  Layers,
} from "lucide-react";

interface LineItem {
  id?: number;
  temp_id?: number;
  product_id: string | number;
  product_name: string;
  product_image: string;
  sale_price?: number;
  sku?: string;
  quantity: number;
  uom_id?: number | null;
  discount?: number | null;
  tax_rate_id?: number;
  tax_type: string;
  tax_rate: number;
  tax_amount: number;
  line_total: number;
  line_total_after_tax?: number;
}

/* ─── Small helpers ─── */
function InfoRow({
  icon,
  label,
  value,
}: {
  icon?: React.ReactNode;
  label: string;
  value?: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between py-2 px-1">
      <div className="flex items-center gap-2 text-gray-400 text-xs uppercase font-semibold tracking-wider min-w-0">
        {icon && <span className="flex-shrink-0">{icon}</span>}
        <span className="truncate">{label}</span>
      </div>
      <span className="text-sm font-medium text-gray-900 ml-4 text-right">
        {value ?? "—"}
      </span>
    </div>
  );
}

function SectionHeader({
  icon,
  title,
  subtitle,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
}) {
  return (
    <div className="flex items-center gap-2.5 px-5 py-3.5 border-b border-gray-100 bg-gray-50/60">
      <span className="text-orange-500">{icon}</span>
      <div>
        <h2 className="text-sm font-semibold text-gray-700">{title}</h2>
        {subtitle && <p className="text-xs text-gray-400">{subtitle}</p>}
      </div>
    </div>
  );
}

export default function ViewPurchaseOrderPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();

  const purchaseOrder = useSelector(
    (state: RootState) => state.purchaseOrder.selectedPO,
  );
  const currentUser = useSelector((state: RootState) => state.auth.user);

  const [confirmSubmit, setConfirmSubmit] = useState(false);
  const [confirmApprove, setConfirmApprove] = useState(false);
  const [confirmReject, setConfirmReject] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [loadingAuditLogs, setLoadingAuditLogs] = useState(false);
  const [date, setDate] = useState("");
  const [reference, setReference] = useState("");
  const [totalOrderTax, setTotalOrderTax] = useState(0);
  const [branches, setBranches] = useState<{ id: number; name: string }[]>([]);
  const [totalBeforeTax, setTotalBeforeTax] = useState(0);
  const [totalAfterTax, setTotalAfterTax] = useState(0);
  const [description, setDescription] = useState("");
  const [supplierInfo, setSupplierInfo] = useState<Partner | null>(null);
  const [lines, setLines] = useState<LineItem[]>([]);

  const refreshAuditLogs = async () => {
    if (!id) return;
    try {
      setLoadingAuditLogs(true);
      const logs = await dispatch(
        fetchPurchaseOrderAuditLogsThunk(Number(id)),
      ).unwrap();
      setAuditLogs(logs);
    } catch {
      /* silent */
    } finally {
      setLoadingAuditLogs(false);
    }
  };

  useEffect(() => {
    dispatch(fetchAllBranchesThunk())
      .unwrap()
      .then((data) => setBranches(data || []))
      .catch(() => setBranches([]));
  }, [dispatch]);

  useEffect(() => {
    if (id) dispatch(fetchPurchaseOrderByIdThunk(Number(id)));
  }, [dispatch, id]);
  useEffect(() => {
    refreshAuditLogs();
  }, [id]);

  const finalPO = purchaseOrder;
  const selectedBranchName =
    branches.find((b) => b.id === finalPO?.branch_id)?.name || "";

  useEffect(() => {
    const linesToLoad = finalPO?.lines ?? [];
    if (linesToLoad.length === 0) return;
    const loadLines = async () => {
      if (finalPO?.supplier_id) {
        try {
          const supplier = await dispatch(
            loadPartnerDetail(finalPO.supplier_id),
          ).unwrap();
          setSupplierInfo(supplier);
        } catch {
          setSupplierInfo(null);
        }
      }
      if (finalPO?.order_date)
        setDate(new Date(finalPO.order_date).toISOString().split("T")[0]);
      setReference(finalPO?.po_no || "");
      setDescription(finalPO?.description || "");
      const enrichedLines = await Promise.all(
        linesToLoad.map(async (l: PurchaseOrderLine) => {
          const product = await dispatch(
            fetchProductByIdThunk(Number(l.product_id)),
          ).unwrap();
          const tax = await dispatch(
            fetchTaxRatesByIdThunk(product.tax_rate_id || 0),
          ).unwrap();
          const taxAmount =
            (Number(l.unit_price || 0) *
              Number(l.quantity || 0) *
              (tax?.rate || 0)) /
            100;
          return {
            id: l.id ?? undefined,
            temp_id: l.id ?? Date.now(),
            product_id: l.product_id,
            product_name: product.name,
            sku: product.sku,
            product_image: product.image_url ?? "",
            sale_price: Number(l.unit_price || 0),
            quantity: Number(l.quantity || 0),
            uom_id: l.uom_id ?? null,
            uom: (l as any).uom,
            discount: Number(l.discount ?? 0),
            tax_rate: tax?.rate || 0,
            tax_rate_id: product.tax_rate_id,
            tax_type: tax?.type || "VAT",
            tax_amount: taxAmount,
            line_total: Number(l.line_total || 0),
            line_total_after_tax: Number(l.line_total_after_tax || 0),
          };
        }),
      );
      setLines(enrichedLines);
      const before = enrichedLines.reduce(
        (s, l) => s + (l.sale_price || 0) * l.quantity,
        0,
      );
      const tax = enrichedLines.reduce((s, l) => s + l.tax_amount, 0);
      setTotalBeforeTax(before);
      setTotalOrderTax(tax);
      setTotalAfterTax(finalPO?.total_after_tax ?? 0);
    };
    loadLines();
  }, [finalPO, dispatch]);

  const handleSubmitApproval = async () => {
    if (!finalPO) return;
    setSubmitting(true);
    try {
      await dispatch(submitPurchaseOrderThunk(finalPO.id)).unwrap();
      toast.success("Purchase order submitted for approval!");
      await dispatch(fetchPurchaseOrderByIdThunk(finalPO.id)).unwrap();
      refreshAuditLogs();
      setConfirmSubmit(false);
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setSubmitting(false);
    }
  };

  const handleApprove = async () => {
    if (!finalPO) return;
    try {
      setSubmitting(true);
      await dispatch(approvePurchaseOrderThunk(finalPO.id)).unwrap();
      toast.success("Purchase Order approved!");
      refreshAuditLogs();
      setConfirmApprove(false);
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setSubmitting(false);
    }
  };

  const handleReject = async () => {
    if (!finalPO) return;
    if (!rejectReason.trim()) {
      toast.error("Reject reason is required");
      return;
    }
    try {
      setSubmitting(true);
      await dispatch(
        cancelPurchaseOrderThunk({ id: finalPO.id, reason: rejectReason }),
      ).unwrap();
      toast.success("Purchase Order cancelled!");
      refreshAuditLogs();
      setConfirmReject(false);
      setRejectReason("");
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setSubmitting(false);
    }
  };

  const canSubmit =
    finalPO &&
    currentUser &&
    currentUser.id === finalPO.creator.id &&
    finalPO.status === PurchaseOrderStatus.DRAFT &&
    finalPO.branch_id === currentUser.branch.id;
  const canApproveReject =
    currentUser?.role.code === Roles.PURCHASEMANAGER &&
    finalPO?.status === PurchaseOrderStatus.WAITING_APPROVAL &&
    finalPO?.branch_id === currentUser?.branch.id;

  /* ─── Modal helper ─── */
  const Modal = ({
    open,
    onClose,
    icon,
    iconBg,
    title,
    desc,
    children,
    footer,
  }: any) => {
    if (!open) return null;
    return (
      <div
        style={{
          minHeight: 400,
          background: "rgba(0,0,0,0.45)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
        className="fixed inset-0 z-50"
        onClick={(e) => e.target === e.currentTarget && onClose()}
      >
        <div className="bg-white w-[420px] rounded-2xl shadow-2xl overflow-hidden">
          <div className="px-6 py-5 flex flex-col items-center text-center gap-3">
            <div
              className={`w-14 h-14 rounded-full flex items-center justify-center ${iconBg}`}
            >
              {icon}
            </div>
            <h3 className="font-bold text-lg text-gray-900">{title}</h3>
            {desc && <p className="text-sm text-gray-500">{desc}</p>}
            {children}
          </div>
          <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-3 bg-gray-50">
            {footer}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50/60">
      {/* ── Sticky top bar ── */}
      <div className="sticky top-0 z-20 bg-white border-b border-gray-200 shadow-sm border-t-2 border-t-orange-500">
        <div className="max-w-screen-2xl mx-auto px-6 h-14 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-sm min-w-0">
            <span className="text-gray-400">Purchase</span>
            <ChevronRight className="w-3.5 h-3.5 text-gray-300" />
            <span className="text-gray-400">Orders</span>
            <ChevronRight className="w-3.5 h-3.5 text-gray-300" />
            <span className="font-semibold text-gray-900 truncate font-mono">
              {finalPO?.po_no ?? `#${id}`}
            </span>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            {finalPO?.status && <StatusBadge status={finalPO.status} />}
            {canSubmit && (
              <>
                <button
                  onClick={() => navigate(`/purchase-orders/edit/${id}`)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-300 bg-white text-gray-700 font-medium text-xs hover:bg-gray-50 transition"
                >
                  <Edit className="w-3.5 h-3.5" />
                  Edit
                </button>
                <button
                  onClick={() => setConfirmSubmit(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-orange-500 text-white font-medium text-xs shadow-sm hover:bg-orange-600 transition"
                >
                  <Send className="w-3.5 h-3.5" />
                  Submit for Approval
                </button>
              </>
            )}
            {canApproveReject && (
              <>
                <button
                  onClick={() => setConfirmApprove(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500 text-white font-medium text-xs shadow-sm hover:bg-emerald-600 transition"
                >
                  <CheckCircle className="w-3.5 h-3.5" />
                  Approve
                </button>
                <button
                  onClick={() => setConfirmReject(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-500 text-white font-medium text-xs shadow-sm hover:bg-red-600 transition"
                >
                  <XCircle className="w-3.5 h-3.5" />
                  Cancel
                </button>
              </>
            )}
            <button
              onClick={() => navigate("/purchase/orders")}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-300 bg-white text-gray-600 font-medium text-xs hover:bg-gray-50 transition"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Back
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-screen-2xl mx-auto px-6 py-5">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-5 items-start">
          {/* ── Main Column ── */}
          <div className="space-y-4 min-w-0">
            {/* Line Items */}
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <SectionHeader
                icon={<Package className="w-4 h-4" />}
                title="Purchase Items"
                subtitle={`${lines.length} item${lines.length !== 1 ? "s" : ""}`}
              />
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-100">
                      <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider w-[40%]">
                        Product
                      </th>
                      <th className="px-4 py-2.5 text-center text-xs font-semibold text-gray-400 uppercase tracking-wider">
                        Qty
                      </th>
                      <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                        UOM
                      </th>
                      <th className="px-4 py-2.5 text-right text-xs font-semibold text-gray-400 uppercase tracking-wider">
                        Unit Price
                      </th>
                      <th className="px-4 py-2.5 text-center text-xs font-semibold text-gray-400 uppercase tracking-wider">
                        Tax
                      </th>
                      <th className="px-4 py-2.5 text-right text-xs font-semibold text-gray-400 uppercase tracking-wider">
                        Tax Amount
                      </th>
                      <th className="px-4 py-2.5 text-right text-xs font-semibold text-gray-400 uppercase tracking-wider">
                        Total (incl. tax)
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {lines.length === 0 ? (
                      <tr>
                        <td
                          colSpan={7}
                          className="py-14 text-center text-gray-400 text-sm"
                        >
                          No items
                        </td>
                      </tr>
                    ) : (
                      lines.map((line) => (
                        <tr
                          key={line.id ?? line.temp_id}
                          className="hover:bg-orange-50/30 transition-colors"
                        >
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-lg overflow-hidden bg-gray-100 border border-gray-100 flex-shrink-0">
                                {line.product_image ? (
                                  <img
                                    src={line.product_image}
                                    alt={line.product_name}
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  <Package className="w-5 h-5 text-gray-400 m-auto mt-2.5" />
                                )}
                              </div>
                              <div className="min-w-0">
                                <p className="font-medium text-gray-900 truncate">
                                  {line.product_name}
                                </p>
                                {line.sku && (
                                  <p className="text-xs text-gray-400 font-mono">
                                    SKU: {line.sku}
                                  </p>
                                )}
                                {line.discount && line.discount > 0 && (
                                  <span className="inline-flex items-center px-1.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100 text-xs font-medium mt-0.5">
                                    -{line.discount}%
                                  </span>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-gray-100 text-sm font-semibold text-gray-700">
                              {line.quantity}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-left text-gray-600">
                            {(line as any).uom?.name ?? "—"}
                          </td>
                          <td className="px-4 py-3 text-right font-medium text-gray-700 tabular-nums">
                            {formatVND(line.sale_price || 0)}
                          </td>
                          <td className="px-4 py-3 text-center">
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-600 border border-blue-100">
                              {line.tax_rate}% {line.tax_type}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right font-medium text-blue-600 tabular-nums">
                            {formatVND(line.tax_amount)}
                          </td>
                          <td className="px-4 py-3 text-right font-bold text-gray-900 tabular-nums">
                            {formatVND(
                              line.line_total_after_tax ||
                                line.line_total + line.tax_amount,
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Supplier Info */}
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <SectionHeader
                icon={<Building2 className="w-4 h-4" />}
                title="Supplier Information"
              />
              <div className="p-5">
                {supplierInfo ? (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <div className="col-span-2 md:col-span-3">
                      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">
                        Company
                      </p>
                      <p className="font-bold text-gray-900 text-base">
                        {supplierInfo.name}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">
                        Contact
                      </p>
                      <p className="text-sm text-gray-900">
                        {supplierInfo.contact_person || "—"}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">
                        Phone
                      </p>
                      <div className="flex items-center gap-1.5 text-sm text-gray-900">
                        <Phone className="w-3.5 h-3.5 text-gray-400" />
                        {supplierInfo.phone || "—"}
                      </div>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">
                        Email
                      </p>
                      <div className="flex items-center gap-1.5 text-sm text-gray-900">
                        <Mail className="w-3.5 h-3.5 text-gray-400" />
                        <span className="truncate">
                          {supplierInfo.email || "—"}
                        </span>
                      </div>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">
                        Bank
                      </p>
                      <p className="text-sm text-gray-900">
                        {supplierInfo.bank_name || "—"}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-gray-400 text-sm">
                    <Clock className="w-4 h-4 animate-spin" />
                    Loading supplier info…
                  </div>
                )}
              </div>
            </div>

            {/* Personnel */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                {
                  title: "Created By",
                  user: finalPO?.creator,
                  color: "orange",
                },
                {
                  title: "Approved By",
                  user: finalPO?.approver,
                  emptyText: "Waiting for approval",
                  color: "green",
                },
              ].map(({ title, user, emptyText, color }) => (
                <div
                  key={title}
                  className="bg-white rounded-xl border border-gray-200 p-5"
                >
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">
                    {title}
                  </p>
                  {user ? (
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-full bg-gray-200 overflow-hidden flex items-center justify-center flex-shrink-0">
                        {(user as any).avatar_url ? (
                          <img
                            src={(user as any).avatar_url}
                            alt={(user as any).full_name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <User className="w-5 h-5 text-gray-500" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-gray-900 text-sm">
                          {(user as any).full_name}
                        </p>
                        {(user as any).email && (
                          <div className="flex items-center gap-1 text-xs text-gray-500 mt-0.5">
                            <Mail className="w-3 h-3 flex-shrink-0" />
                            <span className="truncate">
                              {(user as any).email}
                            </span>
                          </div>
                        )}
                        {(user as any).phone && (
                          <div className="flex items-center gap-1 text-xs text-gray-500 mt-0.5">
                            <Phone className="w-3 h-3 flex-shrink-0" />
                            <span>{(user as any).phone}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-gray-400 text-sm italic">
                      <Clock className="w-4 h-4" />
                      {emptyText ?? "No data"}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Tracking */}
            {finalPO && (
              <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <SectionHeader
                  icon={<TrendingUp className="w-4 h-4" />}
                  title="Tracking"
                />
                <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-5">
                  {[
                    {
                      label: "Receipt Status",
                      status: (finalPO as any).receipt_status ?? "pending",
                      fullColor: "bg-green-500",
                      halfColor: "bg-orange-400",
                    },
                    {
                      label: "Invoice Status",
                      status: (finalPO as any).invoice_status ?? "not_invoiced",
                      fullColor: "bg-green-500",
                      halfColor: "bg-blue-400",
                    },
                  ].map(({ label, status, fullColor, halfColor }) => (
                    <div key={label}>
                      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
                        {label}
                      </p>
                      <div className="flex items-center gap-3">
                        <div className="flex-1 bg-gray-100 rounded-full h-1.5 overflow-hidden">
                          <div
                            className={`h-1.5 rounded-full transition-all ${
                              status === "fully_received" ||
                              status === "invoiced"
                                ? `${fullColor} w-full`
                                : status === "partial"
                                  ? `${halfColor} w-1/2`
                                  : "bg-gray-300 w-0"
                            }`}
                          />
                        </div>
                        <StatusBadge status={status} />
                      </div>
                    </div>
                  ))}
                </div>
                {((finalPO as any).expected_delivery_date ||
                  (finalPO as any).supplier_ref_no ||
                  (finalPO as any).rfq_id) && (
                  <div className="px-5 pb-5 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm border-t border-gray-100 pt-4">
                    {(finalPO as any).expected_delivery_date && (
                      <div>
                        <p className="text-xs text-gray-400 mb-0.5">
                          Expected Delivery
                        </p>
                        <p className="font-medium text-gray-800">
                          {new Date(
                            (finalPO as any).expected_delivery_date,
                          ).toLocaleDateString("vi-VN")}
                        </p>
                      </div>
                    )}
                    {(finalPO as any).supplier_ref_no && (
                      <div>
                        <p className="text-xs text-gray-400 mb-0.5">
                          Supplier Ref No
                        </p>
                        <p className="font-medium text-gray-800">
                          {(finalPO as any).supplier_ref_no}
                        </p>
                      </div>
                    )}
                    {(finalPO as any).rfq_id && (
                      <div>
                        <p className="text-xs text-gray-400 mb-0.5">From RFQ</p>
                        <button
                          onClick={() =>
                            navigate(
                              `/purchase/rfqs/${(finalPO as any).rfq_id}`,
                            )
                          }
                          className="font-medium text-orange-600 hover:underline text-sm"
                        >
                          View RFQ →
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Cancellation reason */}
            {finalPO?.reject_reason && (
              <div className="flex items-start gap-3 px-5 py-4 bg-red-50 border border-red-200 rounded-xl">
                <div className="w-8 h-8 rounded-lg bg-red-500 flex items-center justify-center flex-shrink-0">
                  <XCircle className="w-4 h-4 text-white" />
                </div>
                <div>
                  <p className="text-sm font-bold text-red-700 mb-1">
                    Cancellation Reason
                  </p>
                  <p className="text-sm text-red-800 whitespace-pre-line">
                    {finalPO.reject_reason}
                  </p>
                </div>
              </div>
            )}

            {/* Description */}
            {description && (
              <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <SectionHeader
                  icon={<FileText className="w-4 h-4" />}
                  title="Notes"
                />
                <div className="p-5">
                  <p className="text-sm text-gray-700 whitespace-pre-line leading-relaxed">
                    {description}
                  </p>
                </div>
              </div>
            )}

            {/* Audit Log */}
            <AuditLogCard
              title="Change History"
              logs={auditLogs}
              loading={loadingAuditLogs}
              variant="po"
            />
          </div>

          {/* ── Sidebar ── */}
          <aside className="space-y-3 lg:sticky lg:top-[3.5rem]">
            {/* PO Info */}
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-100 bg-gray-50">
                <div className="flex items-center gap-2">
                  <ShoppingCart className="w-4 h-4 text-orange-500" />
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Order Info
                  </p>
                </div>
              </div>
              <div className="p-4 space-y-0 divide-y divide-gray-50">
                <InfoRow
                  icon={<Hash className="w-3.5 h-3.5" />}
                  label="Reference"
                  value={<span className="font-mono text-xs">{reference}</span>}
                />
                <InfoRow
                  icon={<Calendar className="w-3.5 h-3.5" />}
                  label="Order Date"
                  value={date}
                />
                <InfoRow
                  icon={<Building2 className="w-3.5 h-3.5" />}
                  label="Branch"
                  value={selectedBranchName}
                />
                <InfoRow
                  icon={<User className="w-3.5 h-3.5" />}
                  label="Created By"
                  value={finalPO?.creator?.full_name}
                />
                <InfoRow
                  icon={<Clock className="w-3.5 h-3.5" />}
                  label="Created At"
                  value={formatDateTime(finalPO?.created_at)}
                />
                <InfoRow
                  icon={<Clock className="w-3.5 h-3.5" />}
                  label="Updated At"
                  value={formatDateTime(finalPO?.updated_at)}
                />
              </div>
            </div>

            {/* Payment Summary */}
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-100 bg-gray-50">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-orange-500" />
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Payment Summary
                  </p>
                </div>
              </div>
              <div className="p-4 space-y-2.5">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Subtotal</span>
                  <span className="font-medium text-gray-700 tabular-nums">
                    {formatVND(totalBeforeTax)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Tax</span>
                  <span className="font-medium text-blue-600 tabular-nums">
                    {formatVND(totalOrderTax)}
                  </span>
                </div>
                <div className="pt-2.5 border-t border-dashed border-gray-200 flex justify-between items-center">
                  <span className="text-sm font-semibold text-gray-800">
                    Total
                  </span>
                  <span className="text-base font-bold text-orange-600 tabular-nums">
                    {formatVND(totalAfterTax)}
                  </span>
                </div>
              </div>
            </div>

            {/* Items count */}
            <div className="bg-white rounded-xl border border-gray-200 p-4 flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                <Layers className="w-3.5 h-3.5 text-orange-500" />
                Line Items
              </div>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-orange-100 text-orange-600">
                {lines.length}
              </span>
            </div>
          </aside>
        </div>
      </div>

      {/* ── Modals ── */}
      <Modal
        open={confirmSubmit}
        onClose={() => setConfirmSubmit(false)}
        icon={<Send className="w-7 h-7 text-orange-600" />}
        iconBg="bg-orange-100"
        title="Submit for Approval?"
        desc="After submitting, you will no longer be able to edit this purchase order."
        footer={
          <>
            <Button
              onClick={() => setConfirmSubmit(false)}
              disabled={submitting}
              className="px-5 py-2 rounded-xl border border-gray-300 font-semibold text-gray-700 bg-white hover:bg-gray-50 text-sm"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmitApproval}
              disabled={submitting}
              className="px-5 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-semibold text-sm"
            >
              {submitting ? "Submitting…" : "Yes, Submit"}
            </Button>
          </>
        }
      />

      <Modal
        open={confirmApprove}
        onClose={() => setConfirmApprove(false)}
        icon={<CheckCircle className="w-7 h-7 text-emerald-600" />}
        iconBg="bg-emerald-100"
        title="Approve Purchase Order?"
        desc="Once approved, this purchase order will be confirmed."
        footer={
          <>
            <Button
              onClick={() => setConfirmApprove(false)}
              disabled={submitting}
              className="px-5 py-2 rounded-xl border border-gray-300 font-semibold text-gray-700 bg-white hover:bg-gray-50 text-sm"
            >
              Cancel
            </Button>
            <Button
              onClick={handleApprove}
              disabled={submitting}
              className="px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-semibold text-sm"
            >
              {submitting ? "Approving…" : "Approve"}
            </Button>
          </>
        }
      />

      <Modal
        open={confirmReject}
        onClose={() => {
          setConfirmReject(false);
          setRejectReason("");
        }}
        icon={<XCircle className="w-6 h-6 text-red-600" />}
        iconBg="bg-red-100"
        title="Cancel Purchase Order"
        desc="This action cannot be undone."
        footer={
          <>
            <Button
              onClick={() => {
                setConfirmReject(false);
                setRejectReason("");
              }}
              disabled={submitting}
              className="px-5 py-2 rounded-xl border border-gray-300 font-semibold text-gray-700 bg-white hover:bg-gray-50 text-sm"
            >
              Close
            </Button>
            <Button
              onClick={handleReject}
              disabled={submitting || !rejectReason.trim()}
              className="px-5 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-semibold text-sm disabled:opacity-50"
            >
              {submitting ? "Cancelling…" : "Cancel Order"}
            </Button>
          </>
        }
      >
        <div className="w-full text-left">
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Reason <span className="text-red-500">*</span>
          </label>
          <Textarea
            placeholder="Enter cancellation reason…"
            value={rejectReason}
            onChange={(value) => setRejectReason(value)}
            rows={4}
          />
        </div>
      </Modal>
    </div>
  );
}
