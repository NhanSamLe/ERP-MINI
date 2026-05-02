import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  fetchQuotationById, submitQuotation, approveQuotation,
  rejectQuotation, markAcceptedQuotation, convertQuotationToOrder,
} from "../store/quotation.slice";
import { ActionConfirmModal, StatusBadge } from "@/components/common";
import { StandardFormLayout, FormSection } from "@/components/layout";
import { formatVND } from "@/utils/currency.helper";
import {
  Package, User, CreditCard, Phone, Mail, MapPin,
  FileText, Clock, CheckCircle2, AlertTriangle,
  ShoppingCart, MessageSquare, ExternalLink, Loader2,
  ArrowRightCircle, UserCheck,
} from "lucide-react";

const fmtDate = (d?: string | null) =>
  d ? new Date(d).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" }) : "—";
const fmtTime = (d?: string | null) =>
  d ? new Date(d).toLocaleString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "—";

export default function QuotationDetailPage() {
  const { id }   = useParams();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  const [modal, setModal] = useState<"submit" | "approve" | "reject" | "accept" | "convert" | null>(null);
  const [convertError, setConvertError] = useState<string | null>(null);

  const { selected: q, loading, error } = useAppSelector((s) => s.quotation);
  const { user } = useAppSelector((s) => s.auth);

  useEffect(() => {
    if (id) dispatch(fetchQuotationById(Number(id)));
  }, [dispatch, id]);

  // Chỉ show loading screen khi chưa có data lần đầu
  if (loading && !q) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-gray-400">
          <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
          <p className="text-sm font-medium">Loading quotation...</p>
        </div>
      </div>
    );
  }

  // Lỗi API và chưa có data
  if (!loading && !q) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-gray-400">
          <AlertTriangle className="w-8 h-8 text-red-400" />
          <p className="text-sm font-medium">{error ?? "Quotation not found."}</p>
          <button
            onClick={() => navigate("/sales/quotations")}
            className="mt-2 text-sm text-orange-600 hover:underline"
          >
            Back to Quotations
          </button>
        </div>
      </div>
    );
  }

  if (!q || !user) return null;

  /* ── derived ── */
  const isExpired    = q.status !== "accepted" && q.valid_until && new Date(q.valid_until) < new Date();
  const isRejected   = q.approval_status === "rejected";
  const canEdit      = q.approval_status === "draft";
  const canSubmit    = q.approval_status === "draft";
  const canApprove   = q.approval_status === "waiting_approval" &&
    (user.role?.code === "SALESMANAGER" || user.role?.code === "ADMIN");
  const canReject    = canApprove;
  const canAccept    = q.approval_status === "approved" && q.status !== "accepted";
  const canConvert   = q.status === "accepted";

  const discountAmt  = q.discount_amount ?? (q.total_before_tax * ((q.discount_percent ?? 0) / 100));

  /* ── convert to order ── */
  const handleConvert = async () => {
    setConvertError(null);
    try {
      const result = await dispatch(convertQuotationToOrder(q.id)).unwrap();
      navigate(`/sales/orders/${result.id}`);
    } catch (err: any) {
      setConvertError(err?.message ?? "Failed to convert quotation to order.");
    }
  };

  return (
    <StandardFormLayout
      title={q.quotation_no}
      description={`v${q.version} · Created ${fmtDate(q.created_at)}`}
      breadcrumb={[
        { label: "Quotations", onClick: () => navigate("/sales/quotations") },
        { label: q.quotation_no },
      ]}
      statusBadge={
        <div className="flex items-center gap-2">
          <StatusBadge status={q.approval_status} />
          {q.status !== q.approval_status && <StatusBadge status={q.status} />}
          {isExpired && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-red-50 text-red-500">
              <AlertTriangle className="w-3 h-3" /> Expired
            </span>
          )}
        </div>
      }
      actions={[
        { label: "Back",                variant: "outline",  onClick: () => navigate("/sales/quotations") },
        ...(canEdit    ? [{ label: "Edit",               variant: "outline"  as const, onClick: () => navigate(`/sales/quotations/${q.id}/edit`) }] : []),
        ...(canSubmit  ? [{ label: "Submit for Approval", variant: "primary"  as const, onClick: () => setModal("submit") }] : []),
        ...(canApprove ? [{ label: "Approve",             variant: "success"  as const, onClick: () => setModal("approve") }] : []),
        ...(canReject  ? [{ label: "Reject",              variant: "danger"   as const, onClick: () => setModal("reject") }] : []),
        ...(canAccept  ? [{ label: "Mark as Accepted",    variant: "success"  as const, onClick: () => setModal("accept") }] : []),
        ...(canConvert ? [{ label: "Convert to Order",    variant: "primary"  as const, onClick: () => setModal("convert") }] : []),
      ]}
      sidebarContent={
        <div className="space-y-4">
          {/* Financial Summary */}
          <FormSection title="Financial Summary" icon={<CreditCard className="w-4 h-4" />}>
            <div className="space-y-2.5">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Subtotal</span>
                <span className="font-medium text-gray-800">{formatVND(q.total_before_tax)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">VAT / Tax</span>
                <span className="font-medium text-gray-800">{formatVND(q.total_tax)}</span>
              </div>
              {discountAmt > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">
                    Discount{q.discount_percent ? ` (${q.discount_percent}%)` : ""}
                  </span>
                  <span className="font-medium text-emerald-600">-{formatVND(discountAmt)}</span>
                </div>
              )}
              <div className="pt-2.5 mt-1 border-t border-gray-200">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-semibold text-gray-900">Grand Total</span>
                  <span className="text-lg font-bold text-orange-600">{formatVND(q.total_after_tax)}</span>
                </div>
                <p className="text-xs text-gray-400 mt-1 text-right">Incl. tax · VND</p>
              </div>
            </div>
          </FormSection>

          {/* Linked Opportunity */}
          {q.opportunity && (
            <FormSection title="Linked Opportunity" icon={<ArrowRightCircle className="w-4 h-4" />}>
              <div className="space-y-2">
                <p className="text-sm font-medium text-gray-800">{q.opportunity.name}</p>
                <Link
                  to={`/crm/opportunities/${q.opportunity_id}`}
                  className="inline-flex items-center gap-1 text-xs text-orange-600 hover:text-orange-700"
                >
                  <ExternalLink className="w-3 h-3" /> View Opportunity
                </Link>
              </div>
            </FormSection>
          )}

          {/* Workflow */}
          <FormSection title="Workflow" icon={<Clock className="w-4 h-4" />}>
            <div className="space-y-3">
              <TimelineStep icon={<FileText className="w-3 h-3 text-gray-500" />} bg="bg-gray-100"
                label="Created" name={q.creator?.full_name} time={fmtTime(q.created_at)} />
              {q.submitted_at && (
                <TimelineStep icon={<Clock className="w-3 h-3 text-amber-500" />} bg="bg-amber-50"
                  label="Submitted" time={fmtTime(q.submitted_at)} />
              )}
              {q.approved_at && q.approver && (
                <TimelineStep icon={<CheckCircle2 className="w-3 h-3 text-emerald-500" />} bg="bg-emerald-50"
                  label="Approved" name={q.approver.full_name} time={fmtTime(q.approved_at)} />
              )}
              {q.sent_at && (
                <TimelineStep icon={<CheckCircle2 className="w-3 h-3 text-blue-500" />} bg="bg-blue-50"
                  label="Sent / Accepted" time={fmtTime(q.sent_at)} />
              )}
              {isRejected && (
                <TimelineStep icon={<AlertTriangle className="w-3 h-3 text-red-500" />} bg="bg-red-50"
                  label="Rejected" />
              )}
            </div>
          </FormSection>

          {/* Assignment */}
          <FormSection title="Assignment" icon={<UserCheck className="w-4 h-4" />}>
            <div className="space-y-2.5">
              <div>
                <p className="text-xs text-gray-500 mb-0.5">Created By</p>
                <p className="text-sm font-medium text-gray-800">{q.creator?.full_name ?? "—"}</p>
              </div>
              {q.approver && (
                <div>
                  <p className="text-xs text-gray-500 mb-0.5">Approved By</p>
                  <p className="text-sm font-medium text-gray-800">{q.approver.full_name}</p>
                </div>
              )}
              {q.branch && (
                <div>
                  <p className="text-xs text-gray-500 mb-0.5">Branch</p>
                  <p className="text-sm font-medium text-gray-800">{q.branch.name}</p>
                </div>
              )}
            </div>
          </FormSection>
        </div>
      }
    >
      {/* Convert error */}
      {convertError && (
        <div className="flex items-center gap-2 px-4 py-3 bg-amber-50 border border-amber-100 rounded-lg text-sm text-amber-700">
          <AlertTriangle className="w-4 h-4 shrink-0" />{convertError}
        </div>
      )}

      {/* Rejection banner */}
      {isRejected && q.reject_reason && (
        <div className="flex items-start gap-3 px-4 py-3 bg-red-50 border border-red-100 rounded-lg">
          <AlertTriangle className="w-4 h-4 text-red-500 mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-semibold text-red-700">Quotation Rejected</p>
            <p className="text-sm text-red-600 mt-0.5">{q.reject_reason}</p>
          </div>
        </div>
      )}

      {/* Convert to Order CTA banner */}
      {canConvert && (
        <div className="flex items-center justify-between px-5 py-4 bg-orange-50 border border-orange-200 rounded-lg">
          <div>
            <p className="text-sm font-semibold text-orange-800">Customer has accepted this quotation</p>
            <p className="text-xs text-orange-600 mt-0.5">Convert it to a Sale Order to proceed with fulfillment.</p>
          </div>
          <button
            onClick={() => setModal("convert")}
            className="inline-flex items-center gap-2 h-9 px-4 text-sm font-medium text-white bg-orange-500 rounded-md hover:bg-orange-600 transition-colors shadow-sm shrink-0"
          >
            <ArrowRightCircle className="w-4 h-4" />
            Convert to Order
          </button>
        </div>
      )}

      {/* ── 1. Quotation Details ── */}
      <FormSection title="Quotation Details" icon={<FileText className="w-4 h-4" />}>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Field label="Quote Number"     value={q.quotation_no} />
          <Field label="Version"          value={`v${q.version}`} />
          <Field label="Quotation Date"   value={fmtDate(q.quotation_date)} />
          <Field label="Valid Until"      value={fmtDate(q.valid_until)} highlight={isExpired ?? false} />
          <Field label="Approval Status"  value={q.approval_status?.replace(/_/g, " ")} />
          <Field label="Document Status"  value={q.status} />
          {q.discount_percent ? <Field label="Global Discount" value={`${q.discount_percent}%`} /> : null}
        </div>
      </FormSection>

      {/* ── 2. Customer Information ── */}
      <FormSection title="Customer Information" icon={<User className="w-4 h-4" />}>
        {q.customer ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
            <div className="space-y-4">
              <div>
                <p className="text-xs text-gray-500 mb-0.5">Customer Name</p>
                <p className="text-base font-semibold text-gray-900">{q.customer.name}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-500 mb-0.5 flex items-center gap-1"><Phone className="w-3 h-3" /> Phone</p>
                  <p className="text-sm text-gray-800">{q.customer.phone || "—"}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-0.5 flex items-center gap-1"><Mail className="w-3 h-3" /> Email</p>
                  <p className="text-sm text-gray-800 break-all">{q.customer.email || "—"}</p>
                </div>
              </div>
            </div>
            <div className="space-y-4">
              <div>
                <p className="text-xs text-gray-500 mb-0.5 flex items-center gap-1"><CreditCard className="w-3 h-3" /> Tax Code (MST)</p>
                <p className="text-sm font-medium text-gray-800">{q.customer.tax_code || "—"}</p>
              </div>
              {q.customer.address && (
                <div>
                  <p className="text-xs text-gray-500 mb-0.5 flex items-center gap-1"><MapPin className="w-3 h-3" /> Address</p>
                  <p className="text-sm text-gray-700 leading-relaxed">{q.customer.address}</p>
                </div>
              )}
            </div>
          </div>
        ) : (
          <p className="text-sm text-gray-400 italic">Customer information not available.</p>
        )}
      </FormSection>

      {/* ── 3. Line Items ── */}
      <FormSection
        title="Quotation Lines"
        icon={<ShoppingCart className="w-4 h-4" />}
        description={`${q.lines?.length ?? 0} product(s)`}
        noPadding
      >
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50/80">
                {["#", "Product", "UoM", "Qty", "Unit Price", "Disc. %", "Tax (%)", "Subtotal", "Tax Amt", "Total"].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {!q.lines || q.lines.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-sm text-gray-400">No line items.</td>
                </tr>
              ) : (
                q.lines.map((line, idx) => {
                  const lineSubtotal   = line.line_total          ?? ((line.unit_price ?? 0) * (line.quantity ?? 0));
                  const lineTax        = line.line_tax             ?? 0;
                  const lineTotal      = line.line_total_after_tax ?? (lineSubtotal + lineTax);
                  const discPct        = line.discount_percent     ?? 0;
                  const taxRate        = line.taxRate?.rate        ?? 0;

                  return (
                    <tr key={idx} className="hover:bg-orange-50/30 transition-colors">
                      <td className="px-4 py-3 text-xs text-gray-400">{idx + 1}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded bg-gray-100 border border-gray-200 overflow-hidden shrink-0 flex items-center justify-center">
                            {line.product?.image_url
                              ? <img src={line.product.image_url} alt="" className="w-full h-full object-cover" />
                              : <Package className="w-4 h-4 text-gray-300" />}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-800">{line.product?.name ?? "—"}</p>
                            {line.product?.sku && <p className="text-xs text-gray-400">SKU: {line.product.sku}</p>}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-flex px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-600">
                          {line.product?.uom?.code || "—"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className="inline-flex items-center justify-center min-w-[2rem] h-6 px-2 bg-gray-100 rounded text-sm font-semibold text-gray-800">
                          {line.quantity ?? 0}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-800">{formatVND(line.unit_price ?? 0)}</td>
                      <td className="px-4 py-3 text-center">
                        {discPct > 0
                          ? <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-600">{discPct}%</span>
                          : <span className="text-xs text-gray-400">—</span>}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {taxRate > 0
                          ? <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-600">{taxRate}%</span>
                          : <span className="text-xs text-gray-400">0%</span>}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700">{formatVND(lineSubtotal)}</td>
                      <td className="px-4 py-3 text-sm text-gray-500">{lineTax > 0 ? formatVND(lineTax) : "—"}</td>
                      <td className="px-4 py-3 text-sm font-semibold text-gray-900">{formatVND(lineTotal)}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
            {q.lines && q.lines.length > 0 && (
              <tfoot className="border-t-2 border-gray-200">
                <tr className="bg-gray-50/60">
                  <td colSpan={7} className="px-4 py-3 text-right text-sm text-gray-600 font-medium">Subtotal (before tax)</td>
                  <td className="px-4 py-3 text-sm font-semibold text-gray-800">{formatVND(q.total_before_tax)}</td>
                  <td colSpan={2}></td>
                </tr>
                <tr className="bg-gray-50/60">
                  <td colSpan={7} className="px-4 py-2 text-right text-sm text-gray-500">VAT / Tax</td>
                  <td className="px-4 py-2 text-sm font-medium text-gray-600">{formatVND(q.total_tax)}</td>
                  <td colSpan={2}></td>
                </tr>
                {discountAmt > 0 && (
                  <tr className="bg-gray-50/60">
                    <td colSpan={7} className="px-4 py-2 text-right text-sm text-emerald-600">
                      Discount{q.discount_percent ? ` (${q.discount_percent}%)` : ""}
                    </td>
                    <td className="px-4 py-2 text-sm font-medium text-emerald-600">-{formatVND(discountAmt)}</td>
                    <td colSpan={2}></td>
                  </tr>
                )}
                <tr className="bg-orange-50/40">
                  <td colSpan={7} className="px-4 py-3 text-right text-sm font-bold text-gray-900">GRAND TOTAL (incl. tax)</td>
                  <td colSpan={3} className="px-4 py-3 text-base font-bold text-orange-600">{formatVND(q.total_after_tax)}</td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </FormSection>

      {/* ── 4. Notes ── */}
      {(q.customer_notes || q.internal_notes) && (
        <FormSection title="Notes" icon={<MessageSquare className="w-4 h-4" />}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {q.customer_notes && (
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Customer Notes</p>
                <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">{q.customer_notes}</p>
              </div>
            )}
            {q.internal_notes && (
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Internal Notes</p>
                <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">{q.internal_notes}</p>
              </div>
            )}
          </div>
        </FormSection>
      )}

      {/* ── Modals ── */}
      <ActionConfirmModal isOpen={modal === "submit"} onClose={() => setModal(null)}
        title="Submit for Approval"
        description={`Submit quotation "${q.quotation_no}" for manager approval? It will be locked from editing.`}
        confirmText="Submit" variant="primary"
        onConfirm={async () => { await dispatch(submitQuotation(q.id)).unwrap(); setModal(null); }}
      />
      <ActionConfirmModal isOpen={modal === "approve"} onClose={() => setModal(null)}
        title="Approve Quotation"
        description={`Approve "${q.quotation_no}"? The quotation will be ready to send to the customer.`}
        confirmText="Approve" variant="success"
        onConfirm={async () => { await dispatch(approveQuotation(q.id)).unwrap(); setModal(null); }}
      />
      <ActionConfirmModal isOpen={modal === "reject"} onClose={() => setModal(null)}
        title="Reject Quotation"
        description={`Reject "${q.quotation_no}"? Please provide a reason.`}
        confirmText="Reject" variant="danger" requireReason
        reasonLabel="Rejection Reason"
        reasonPlaceholder="e.g. Price is too high, terms not met..."
        onConfirm={async (reason) => { await dispatch(rejectQuotation({ id: q.id, reason: reason ?? "" })).unwrap(); setModal(null); }}
      />
      <ActionConfirmModal isOpen={modal === "accept"} onClose={() => setModal(null)}
        title="Mark as Accepted"
        description={`Confirm that the customer has accepted quotation "${q.quotation_no}"?`}
        confirmText="Mark Accepted" variant="success"
        onConfirm={async () => { await dispatch(markAcceptedQuotation(q.id)).unwrap(); setModal(null); }}
      />
      <ActionConfirmModal isOpen={modal === "convert"} onClose={() => setModal(null)}
        title="Convert to Sale Order"
        description={`Convert quotation "${q.quotation_no}" to a Sale Order? A new sale order will be created from this quotation's lines.`}
        confirmText="Convert to Order" variant="primary"
        onConfirm={async () => { setModal(null); await handleConvert(); }}
      />
    </StandardFormLayout>
  );
}

/* ── helper components ── */
interface FieldProps { label: string; value?: string | null; highlight?: boolean; }
function Field({ label, value, highlight }: FieldProps) {
  return (
    <div>
      <p className="text-xs text-gray-500 mb-0.5">{label}</p>
      <p className={`text-sm font-medium ${highlight ? "text-red-500" : "text-gray-800"}`}>{value || "—"}</p>
    </div>
  );
}

interface TimelineStepProps {
  icon: React.ReactNode; bg: string;
  label: string; name?: string | null; time?: string;
}
function TimelineStep({ icon, bg, label, name, time }: TimelineStepProps) {
  return (
    <div className="flex items-start gap-2.5">
      <div className={`w-5 h-5 rounded-full ${bg} flex items-center justify-center shrink-0 mt-0.5`}>
        {icon}
      </div>
      <div>
        <p className="text-xs font-medium text-gray-700">{label}</p>
        {name && <p className="text-xs text-gray-500">{name}</p>}
        {time && <p className="text-[10px] text-gray-400">{time}</p>}
      </div>
    </div>
  );
}
