import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { createInvoice } from "@/features/sales/store/invoice.slice";
import {
  fetchSaleOrderDetail,
  submitSaleOrder,
  approveSaleOrder,
  rejectSaleOrder,
} from "@/features/sales/store/saleOrder.slice";
import { ActionConfirmModal, StatusBadge } from "@/components/common";
import { StandardFormLayout, FormSection } from "@/components/layout";
import { formatVND } from "@/utils/currency.helper";
import {
  ShoppingCart, User, Building2, CreditCard,
  Phone, Mail, MapPin, Package, FileText, AlertTriangle,
  CheckCircle2, Clock, UserCheck, Loader2,
} from "lucide-react";

/* ── helpers ───────────────────────────────────────── */
const fmtDate  = (d?: string | null) => d ? new Date(d).toLocaleDateString("vi-VN", { day:"2-digit", month:"2-digit", year:"numeric" }) : "—";
const fmtTime  = (d?: string | null) => d ? new Date(d).toLocaleString("vi-VN",   { day:"2-digit", month:"2-digit", year:"numeric", hour:"2-digit", minute:"2-digit" }) : "—";

interface FieldProps { label: string; value?: string | null; }
const Field = ({ label, value }: FieldProps) => (
  <div>
    <p className="text-xs text-gray-500 mb-0.5">{label}</p>
    <p className="text-sm font-medium text-gray-800">{value || "—"}</p>
  </div>
);

/* ── main component ───────────────────────────────── */
export default function SaleOrderDetailPage() {
  const { id }    = useParams();
  const navigate  = useNavigate();
  const dispatch  = useAppDispatch();

  const [activeModal, setActiveModal] = useState<"submit" | "approve" | "reject" | null>(null);
  const [invoiceError, setInvoiceError] = useState<string | null>(null);

  const { selected: order, loading } = useAppSelector((s) => s.saleOrder);
  const { user } = useAppSelector((s) => s.auth);

  useEffect(() => { if (id) dispatch(fetchSaleOrderDetail(Number(id))); }, [dispatch, id]);

  /* ── loading ── */
  if (loading || !order) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-gray-400">
          <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
          <p className="text-sm font-medium">Loading order details...</p>
        </div>
      </div>
    );
  }

  if (!user) return <div className="p-10 text-center text-gray-500">Access Denied</div>;

  /* ── derived ── */
  const subtotal     = order.total_before_tax  ?? 0;
  const taxAmount    = order.total_tax         ?? 0;
  const grandTotal   = order.total_after_tax   ?? 0;
  const isRejected   = order.approval_status   === "rejected";
  const canEdit      = order.approval_status   === "draft";
  const canSubmit    = order.approval_status   === "draft";
  const canApprove   = order.approval_status   === "waiting_approval" && (user.role?.code === "SALESMANAGER" || user.role?.code === "ADMIN");
  const canReject    = canApprove;
  const canInvoice   = order.approval_status   === "approved";

  const handleCreateInvoice = async () => {
    setInvoiceError(null);
    try {
      const result = await dispatch(createInvoice({ order_id: order.id })).unwrap();
      navigate(`/invoices/${result.id}`);
    } catch (err: unknown) {
      setInvoiceError(err instanceof Error ? err.message : "Invoice may already exist.");
    }
  };

  return (
    <StandardFormLayout
      title={order.order_no}
      description={`Created on ${fmtDate(order.created_at)}`}
      breadcrumb={[
        { label: "Sale Orders", onClick: () => navigate("/sales/orders") },
        { label: order.order_no },
      ]}
      statusBadge={
        <div className="flex items-center gap-2">
          <StatusBadge status={order.approval_status} />
          {order.status !== order.approval_status && (
            <StatusBadge status={order.status} />
          )}
        </div>
      }
      actions={[
        { label: "Back",       variant: "outline",   onClick: () => navigate("/sales/orders") },
        ...(canEdit    ? [{ label: "Edit Order",           variant: "outline"   as const, onClick: () => navigate(`/sales/orders/${order.id}/edit`) }] : []),
        ...(canSubmit  ? [{ label: "Submit for Approval",  variant: "primary"   as const, onClick: () => setActiveModal("submit") }] : []),
        ...(canApprove ? [{ label: "Approve",              variant: "success"   as const, onClick: () => setActiveModal("approve") }] : []),
        ...(canReject  ? [{ label: "Reject",               variant: "danger"    as const, onClick: () => setActiveModal("reject") }] : []),
        ...(canInvoice ? [{ label: "Generate Invoice",     variant: "success"   as const, onClick: handleCreateInvoice }] : []),
      ]}
      sidebarContent={
        <div className="space-y-4">
          {/* Financial summary */}
          <FormSection title="Financial Summary" icon={<CreditCard className="w-4 h-4" />}>
            <div className="space-y-2.5">
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-500">Subtotal</span>
                <span className="font-medium text-gray-800">{formatVND(subtotal)}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-500">VAT / Tax</span>
                <span className="font-medium text-gray-800">{formatVND(taxAmount)}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-500">Discount</span>
                <span className="font-medium text-gray-800">—</span>
              </div>
              <div className="pt-2.5 mt-1 border-t border-gray-200">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-semibold text-gray-900">Grand Total</span>
                  <span className="text-lg font-bold text-orange-600">{formatVND(grandTotal)}</span>
                </div>
                <p className="text-xs text-gray-400 mt-1 text-right">Incl. tax · VND</p>
              </div>
            </div>
          </FormSection>

          {/* Workflow info */}
          <FormSection title="Workflow" icon={<Clock className="w-4 h-4" />}>
            <div className="space-y-3">
              {/* Created */}
              <div className="flex items-start gap-2.5">
                <div className="w-5 h-5 rounded-full bg-gray-100 flex items-center justify-center shrink-0 mt-0.5">
                  <FileText className="w-3 h-3 text-gray-500" />
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-700">Created</p>
                  <p className="text-xs text-gray-500">{order.creator?.full_name || "—"}</p>
                  <p className="text-[10px] text-gray-400">{fmtTime(order.created_at)}</p>
                </div>
              </div>

              {/* Submitted */}
              {order.submitted_at && (
                <div className="flex items-start gap-2.5">
                  <div className="w-5 h-5 rounded-full bg-amber-50 flex items-center justify-center shrink-0 mt-0.5">
                    <Clock className="w-3 h-3 text-amber-500" />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-gray-700">Submitted</p>
                    <p className="text-[10px] text-gray-400">{fmtTime(order.submitted_at)}</p>
                  </div>
                </div>
              )}

              {/* Approved */}
              {order.approved_at && order.approver && (
                <div className="flex items-start gap-2.5">
                  <div className="w-5 h-5 rounded-full bg-emerald-50 flex items-center justify-center shrink-0 mt-0.5">
                    <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-gray-700">Approved</p>
                    <p className="text-xs text-gray-500">{order.approver.full_name}</p>
                    <p className="text-[10px] text-gray-400">{fmtTime(order.approved_at)}</p>
                  </div>
                </div>
              )}

              {/* Rejected */}
              {isRejected && (
                <div className="flex items-start gap-2.5">
                  <div className="w-5 h-5 rounded-full bg-red-50 flex items-center justify-center shrink-0 mt-0.5">
                    <AlertTriangle className="w-3 h-3 text-red-500" />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-red-600">Rejected</p>
                    {order.reject_reason && (
                      <p className="text-xs text-gray-500 mt-0.5 italic">"{order.reject_reason}"</p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </FormSection>

          {/* Assignment */}
          <FormSection title="Assignment" icon={<UserCheck className="w-4 h-4" />}>
            <div className="space-y-2.5">
              <div>
                <p className="text-xs text-gray-500 mb-0.5">Created By</p>
                <p className="text-sm font-medium text-gray-800">{order.creator?.full_name || "—"}</p>
              </div>
              {order.approver && (
                <div>
                  <p className="text-xs text-gray-500 mb-0.5">Approved By</p>
                  <p className="text-sm font-medium text-gray-800">{order.approver.full_name}</p>
                </div>
              )}
              {order.branch && (
                <div>
                  <p className="text-xs text-gray-500 mb-0.5">Branch</p>
                  <p className="text-sm font-medium text-gray-800">{order.branch.name}</p>
                </div>
              )}
            </div>
          </FormSection>
        </div>
      }
    >
      {/* Invoice error */}
      {invoiceError && (
        <div className="flex items-center gap-2 px-4 py-3 bg-amber-50 border border-amber-100 rounded-lg text-sm text-amber-700">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          {invoiceError}
        </div>
      )}

      {/* Rejection banner */}
      {isRejected && order.reject_reason && (
        <div className="flex items-start gap-3 px-4 py-3 bg-red-50 border border-red-100 rounded-lg">
          <AlertTriangle className="w-4 h-4 text-red-500 mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-semibold text-red-700">Order Rejected</p>
            <p className="text-sm text-red-600 mt-0.5">{order.reject_reason}</p>
          </div>
        </div>
      )}

      {/* ─── 1. ORDER DETAILS ─── */}
      <FormSection title="Order Details" icon={<Building2 className="w-4 h-4" />}>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Field label="Order Number"     value={order.order_no} />
          <Field label="Order Date"       value={fmtDate(order.order_date)} />
          <Field label="Approval Status"  value={order.approval_status?.replace(/_/g, " ")} />
          <Field label="Delivery Status"  value={order.status} />
        </div>
        {/* Source Quotation link */}
        {(order as any).quotation_id && (
          <div className="mt-4 pt-4 border-t border-gray-100">
            <p className="text-xs text-gray-500 mb-1">Source Quotation</p>
            <a
              href={`/sales/quotations/${(order as any).quotation_id}`}
              className="inline-flex items-center gap-1.5 text-sm font-medium text-orange-600 hover:text-orange-700"
            >
              <FileText className="w-3.5 h-3.5" />
              {(order as any).quotation?.quotation_no ?? `QT #${(order as any).quotation_id}`}
            </a>
          </div>
        )}
      </FormSection>

      {/* ─── 2. CUSTOMER INFORMATION ─── */}
      <FormSection title="Customer Information" icon={<User className="w-4 h-4" />}>
        {order.customer ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
            {/* Left column */}
            <div className="space-y-4">
              <div>
                <p className="text-xs text-gray-500 mb-0.5">Customer Name</p>
                <p className="text-base font-semibold text-gray-900">{order.customer.name}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-500 mb-0.5 flex items-center gap-1">
                    <Phone className="w-3 h-3" /> Phone
                  </p>
                  <p className="text-sm text-gray-800">{order.customer.phone || "—"}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-0.5 flex items-center gap-1">
                    <Mail className="w-3 h-3" /> Email
                  </p>
                  <p className="text-sm text-gray-800 break-all">{order.customer.email || "—"}</p>
                </div>
              </div>
            </div>

            {/* Right column */}
            <div className="space-y-4">
              <div>
                <p className="text-xs text-gray-500 mb-0.5 flex items-center gap-1">
                  <CreditCard className="w-3 h-3" /> Tax Code (MST)
                </p>
                <p className="text-sm font-medium text-gray-800">{order.customer.tax_code || "—"}</p>
              </div>
              {order.customer.address && (
                <div>
                  <p className="text-xs text-gray-500 mb-0.5 flex items-center gap-1">
                    <MapPin className="w-3 h-3" /> Address
                  </p>
                  <p className="text-sm text-gray-700 leading-relaxed">{order.customer.address}</p>
                </div>
              )}
            </div>
          </div>
        ) : (
          <p className="text-sm text-gray-400 italic">Customer information not available.</p>
        )}
      </FormSection>

      {/* ─── 3. ORDER LINES ─── */}
      <FormSection
        title="Order Lines"
        icon={<ShoppingCart className="w-4 h-4" />}
        description={`${order.lines?.length ?? 0} product(s)`}
        noPadding
      >
        {/* Table — 6 cols: # | Product (name+SKU+UoM) | Qty | Unit Price | Tax | Amount */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm table-fixed">
            <colgroup>
              <col style={{ width: "40px" }} />    {/* # */}
              <col />                               {/* Product — flex */}
              <col style={{ width: "80px" }} />    {/* Qty */}
              <col style={{ width: "160px" }} />   {/* Unit Price */}
              <col style={{ width: "96px" }} />    {/* Tax % */}
              <col style={{ width: "164px" }} />   {/* Amount */}
            </colgroup>
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50/80">
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">#</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Product</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">Qty</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Unit Price</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">Tax</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {!order.lines || order.lines.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-sm text-gray-400">No line items.</td>
                </tr>
              ) : (
                order.lines.map((line, idx) => {
                  const lineSubtotal   = line.line_total           ?? ((line.unit_price ?? 0) * (line.quantity ?? 0));
                  const lineTaxAmt     = line.line_tax             ?? 0;
                  const lineTotalAfter = line.line_total_after_tax ?? (lineSubtotal + lineTaxAmt);
                  const taxRate        = line.taxRate?.rate        ?? 0;
                  const qty            = Number(line.quantity ?? 0);
                  const displayQty     = Number.isInteger(qty) ? qty : parseFloat(qty.toFixed(3));

                  return (
                    <tr key={idx} className="hover:bg-orange-50/30 transition-colors">
                      {/* # */}
                      <td className="px-4 py-4 text-xs text-gray-400">{idx + 1}</td>

                      {/* Product — name + SKU + UoM badge inline */}
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded bg-gray-100 border border-gray-200 overflow-hidden shrink-0 flex items-center justify-center">
                            {line.product?.image_url
                              ? <img src={line.product.image_url} alt="" className="w-full h-full object-cover" />
                              : <Package className="w-4 h-4 text-gray-300" />}
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-gray-800">{line.product?.name ?? "—"}</p>
                            <div className="flex items-center gap-2 mt-0.5">
                              {line.product?.sku && (
                                <span className="text-xs text-gray-400">SKU: {line.product.sku}</span>
                              )}
                              {line.product?.uom?.code && (
                                <span className="inline-flex px-1.5 py-0.5 rounded text-[10px] font-semibold bg-gray-100 text-gray-500">
                                  {line.product.uom.code}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Qty */}
                      <td className="px-4 py-4 text-center">
                        <span className="inline-flex items-center justify-center h-7 px-3 bg-gray-100 rounded-md text-sm font-semibold text-gray-800 min-w-[2.5rem]">
                          {displayQty}
                        </span>
                      </td>

                      {/* Unit Price */}
                      <td className="px-4 py-4 text-right">
                        <span className="text-sm font-medium text-gray-800">{formatVND(line.unit_price ?? 0)}</span>
                      </td>

                      {/* Tax % */}
                      <td className="px-4 py-4 text-center">
                        {taxRate > 0 ? (
                          <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-600">
                            {taxRate}%
                          </span>
                        ) : (
                          <span className="text-xs text-gray-400">—</span>
                        )}
                      </td>

                      {/* Amount (after tax) */}
                      <td className="px-4 py-4 text-right">
                        <p className="text-sm font-semibold text-gray-900">{formatVND(lineTotalAfter)}</p>
                        {lineTaxAmt > 0 && (
                          <p className="text-[10px] text-gray-400 mt-0.5">Tax: {formatVND(lineTaxAmt)}</p>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

      </FormSection>

      {/* ─── Confirm Modals ─── */}
      <ActionConfirmModal
        isOpen={activeModal === "submit"}
        onClose={() => setActiveModal(null)}
        title="Submit for Approval"
        description={`Submit order "${order.order_no}" for manager approval? The order will be locked from editing after submission.`}
        confirmText="Submit Order"
        variant="primary"
        onConfirm={async () => {
          await dispatch(submitSaleOrder(order.id)).unwrap();
          setActiveModal(null);
        }}
      />

      <ActionConfirmModal
        isOpen={activeModal === "approve"}
        onClose={() => setActiveModal(null)}
        title="Approve Sale Order"
        description={`Approve order "${order.order_no}"? This confirms the sales terms and commits inventory reservation.`}
        confirmText="Approve"
        variant="success"
        onConfirm={async () => {
          await dispatch(approveSaleOrder(order.id)).unwrap();
          setActiveModal(null);
        }}
      />

      <ActionConfirmModal
        isOpen={activeModal === "reject"}
        onClose={() => setActiveModal(null)}
        title="Reject Sale Order"
        description={`Reject order "${order.order_no}"? Please provide a reason that will be shown to the sales team.`}
        confirmText="Reject Order"
        variant="danger"
        requireReason
        reasonLabel="Rejection Reason"
        reasonPlaceholder="e.g. Price does not match agreed terms, insufficient stock..."
        onConfirm={async (reason) => {
          await dispatch(rejectSaleOrder({ id: order.id, reason: reason ?? "" })).unwrap();
          setActiveModal(null);
        }}
      />
    </StandardFormLayout>
  );
}
