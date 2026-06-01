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
const fmtDate = (d?: string | null) => d ? new Date(d).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" }) : "—";
const fmtTime = (d?: string | null) => d ? new Date(d).toLocaleString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "—";

interface FieldProps { label: string; value?: string | null; }
const Field = ({ label, value }: FieldProps) => (
  <div>
    <p className="text-xs text-gray-500 mb-0.5">{label}</p>
    <p className="text-sm font-medium text-gray-800">{value || "—"}</p>
  </div>
);

/* ── main component ───────────────────────────────── */
export default function SaleOrderDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();

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
          <p className="text-sm font-medium">Đang tải chi tiết đơn hàng...</p>
        </div>
      </div>
    );
  }

  if (!user) return <div className="p-10 text-center text-gray-500">Không có quyền truy cập</div>;

  /* ── derived ── */
  const subtotal = order.total_before_tax ?? 0;
  const taxAmount = order.total_tax ?? 0;
  const grandTotal = order.total_after_tax ?? 0;
  const currencyCode = order.currency?.code || "VND";
  const currencySymbol = order.currency?.symbol || currencyCode;
  const exchangeRate = Number(order.exchange_rate || 1);
  const formatOrderMoney = (value: number | null | undefined) =>
    `${Number(value || 0).toLocaleString("vi-VN", { maximumFractionDigits: 2 })} ${currencySymbol}`;
  const isRejected = order.approval_status === "rejected";
  const roleCode = user.role?.code;
  const isSalesOwner = roleCode === "SALES" && order.created_by === user.id;
  const isSalesManager = roleCode === "SALESMANAGER" || roleCode === "ADMIN";
  const isAccounting = roleCode === "ACCOUNT" || roleCode === "CHACC";
  const canEdit = order.approval_status === "draft" && isSalesOwner;
  const canSubmit = order.approval_status === "draft" && isSalesOwner;
  const canApprove = order.approval_status === "waiting_approval" && isSalesManager;
  const canReject = canApprove;
  const canInvoice = order.approval_status === "approved" && isAccounting;

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
      statusBadge={
        <div className="flex items-center gap-2">
          <StatusBadge status={order.approval_status} />
          {order.status !== order.approval_status && (
            <StatusBadge status={order.status} />
          )}
        </div>
      }
      actions={[
        { label: "Quay lại", variant: "outline", onClick: () => navigate("/sales/orders") },
        ...(canEdit ? [{ label: "Chỉnh sửa", variant: "outline" as const, onClick: () => navigate(`/sales/orders/${order.id}/edit`) }] : []),
        ...(canSubmit ? [{ label: "Gửi duyệt", variant: "primary" as const, onClick: () => setActiveModal("submit") }] : []),
        ...(canApprove ? [{ label: "Duyệt", variant: "success" as const, onClick: () => setActiveModal("approve") }] : []),
        ...(canReject ? [{ label: "Từ chối", variant: "danger" as const, onClick: () => setActiveModal("reject") }] : []),
        ...(canInvoice ? [{ label: "Tạo hóa đơn", variant: "success" as const, onClick: handleCreateInvoice }] : []),
      ]}
      sidebarContent={
        <div className="space-y-4">
          {/* Financial summary */}
          <FormSection title="Tóm tắt tài chính" icon={<CreditCard className="w-4 h-4" />}>
            <div className="space-y-2.5">
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-500">Tạm tính</span>
                <span className="font-medium text-gray-800">{formatOrderMoney(subtotal)}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-500">Thuế VAT</span>
                <span className="font-medium text-gray-800">{formatOrderMoney(taxAmount)}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-500">Chiết khấu</span>
                <span className="font-medium text-gray-800">—</span>
              </div>
              <div className="pt-2.5 mt-1 border-t border-gray-200">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-semibold text-gray-900">Tổng cộng</span>
                  <span className="text-lg font-bold text-orange-600">{formatOrderMoney(grandTotal)}</span>
                </div>
                <p className="text-xs text-gray-400 mt-1 text-right">
                  Đã bao gồm thuế · {currencyCode}
                  {currencyCode !== "VND" ? ` · ≈ ${formatVND(grandTotal * exchangeRate)}` : ""}
                </p>
              </div>
            </div>
          </FormSection>

          {/* Workflow info */}
          <FormSection title="Luồng duyệt" icon={<Clock className="w-4 h-4" />}>
            <div className="space-y-3">
              {/* Created */}
              <div className="flex items-start gap-2.5">
                <div className="w-5 h-5 rounded-full bg-gray-100 flex items-center justify-center shrink-0 mt-0.5">
                  <FileText className="w-3 h-3 text-gray-500" />
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-700">Tạo</p>
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
                    <p className="text-xs font-medium text-gray-700">Gửi duyệt</p>
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
                    <p className="text-xs font-medium text-gray-700">Đã duyệt</p>
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
                    <p className="text-xs font-medium text-red-600">Từ chối</p>
                    {order.reject_reason && (
                      <p className="text-xs text-gray-500 mt-0.5 italic">"{order.reject_reason}"</p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </FormSection>

          {/* Assignment */}
          <FormSection title="Phân công" icon={<UserCheck className="w-4 h-4" />}>
            <div className="space-y-2.5">
              <div>
                <p className="text-xs text-gray-500 mb-0.5">Người tạo</p>
                <p className="text-sm font-medium text-gray-800">{order.creator?.full_name || "—"}</p>
              </div>
              {order.approver && (
                <div>
                  <p className="text-xs text-gray-500 mb-0.5">Người duyệt</p>
                  <p className="text-sm font-medium text-gray-800">{order.approver.full_name}</p>
                </div>
              )}
              {order.branch && (
                <div>
                  <p className="text-xs text-gray-500 mb-0.5">Chi nhánh</p>
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
            <p className="text-sm font-semibold text-red-700">Đơn hàng bị từ chối</p>
            <p className="text-sm text-red-600 mt-0.5">{order.reject_reason}</p>
          </div>
        </div>
      )}

      {/* ─── 1. ORDER DETAILS ─── */}
      <FormSection title="Thông tin đơn hàng" icon={<Building2 className="w-4 h-4" />}>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Field label="Số đơn hàng" value={order.order_no} />
          <Field label="Ngày đặt hàng" value={fmtDate(order.order_date)} />
          <Field label="Trạng thái duyệt" value={order.approval_status?.replace(/_/g, " ")} />
          <Field label="Trạng thái giao" value={order.status} />
        </div>
        {/* Source Quotation link */}
        {(order as any).quotation_id && (
          <div className="mt-4 pt-4 border-t border-gray-100">
            <p className="text-xs text-gray-500 mb-1">Báo giá gốc</p>
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
      <FormSection title="Thông tin khách hàng" icon={<User className="w-4 h-4" />}>
        {order.customer ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
            {/* Left column */}
            <div className="space-y-4">
              <div>
                <p className="text-xs text-gray-500 mb-0.5">Tên khách hàng</p>
                <p className="text-base font-semibold text-gray-900">{order.customer.name}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-500 mb-0.5 flex items-center gap-1">
                    <Phone className="w-3 h-3" /> Điện thoại
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
                  <CreditCard className="w-3 h-3" /> Mã số thuế
                </p>
                <p className="text-sm font-medium text-gray-800">{order.customer.tax_code || "—"}</p>
              </div>
              {order.customer.address && (
                <div>
                  <p className="text-xs text-gray-500 mb-0.5 flex items-center gap-1">
                    <MapPin className="w-3 h-3" /> Địa chỉ
                  </p>
                  <p className="text-sm text-gray-700 leading-relaxed">{order.customer.address}</p>
                </div>
              )}
            </div>
          </div>
        ) : (
          <p className="text-sm text-gray-400 italic">Không có thông tin khách hàng.</p>
        )}
      </FormSection>

      {/* ─── 3. ORDER LINES ─── */}
      <FormSection
        title="Dòng đơn hàng"
        icon={<ShoppingCart className="w-4 h-4" />}
        description={`${order.lines?.length ?? 0} sản phẩm`}
        noPadding
      >
        {/* Table — 7 cols: # | Sản phẩm | ĐVT | SL | Đơn giá | Thuế | Thành tiền */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm table-fixed">
            <colgroup>
              <col style={{ width: "40px" }} />    {/* # */}
              <col />                               {/* Sản phẩm — flex */}
              <col style={{ width: "72px" }} />    {/* ĐVT */}
              <col style={{ width: "72px" }} />    {/* SL */}
              <col style={{ width: "150px" }} />   {/* Đơn giá */}
              <col style={{ width: "80px" }} />    {/* Thuế */}
              <col style={{ width: "150px" }} />   {/* Thành tiền */}
            </colgroup>
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50/80">
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">#</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Sản phẩm</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">ĐVT</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">SL</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Đơn giá</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">Thuế</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Thành tiền</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {!order.lines || order.lines.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-sm text-gray-400">Không có dòng sản phẩm.</td>
                </tr>
              ) : (
                order.lines.map((line, idx) => {
                  const lineSubtotal = line.line_total ?? ((line.unit_price ?? 0) * (line.quantity ?? 0));
                  const lineTaxAmt = line.line_tax ?? 0;
                  const lineTotalAfter = line.line_total_after_tax ?? (lineSubtotal + lineTaxAmt);
                  const taxRate = line.taxRate?.rate ?? 0;
                  const qty = Number(line.quantity ?? 0);
                  const displayQty = Number.isInteger(qty) ? qty : parseFloat(qty.toFixed(3));
                  const uomCode = (line.product as any)?.uom?.code || "—";

                  return (
                    <tr key={idx} className="hover:bg-orange-50/30 transition-colors">
                      {/* # */}
                      <td className="px-4 py-4 text-xs text-gray-400">{idx + 1}</td>

                      {/* Sản phẩm */}
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded bg-gray-100 border border-gray-200 overflow-hidden shrink-0 flex items-center justify-center">
                            {line.product?.image_url
                              ? <img src={line.product.image_url} alt="" className="w-full h-full object-cover" />
                              : <Package className="w-4 h-4 text-gray-300" />}
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-gray-800">{line.product?.name ?? "—"}</p>
                            {line.product?.sku && (
                              <span className="text-xs text-gray-400">SKU: {line.product.sku}</span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* ĐVT */}
                      <td className="px-4 py-4 text-center">
                        <span className="inline-flex px-1.5 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-600">
                          {uomCode}
                        </span>
                      </td>

                      {/* SL */}
                      <td className="px-4 py-4 text-center">
                        <span className="inline-flex items-center justify-center h-7 px-3 bg-gray-100 rounded-md text-sm font-semibold text-gray-800 min-w-[2.5rem]">
                          {displayQty}
                        </span>
                      </td>

                      {/* Đơn giá */}
                      <td className="px-4 py-4 text-right">
                        <span className="text-sm font-medium text-gray-800">{formatOrderMoney(line.unit_price ?? 0)}</span>
                      </td>

                      {/* Thuế */}
                      <td className="px-4 py-4 text-center">
                        {taxRate > 0 ? (
                          <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-600">
                            {taxRate}%
                          </span>
                        ) : (
                          <span className="text-xs text-gray-400">—</span>
                        )}
                      </td>

                      {/* Thành tiền */}
                      <td className="px-4 py-4 text-right">
                        <p className="text-sm font-semibold text-gray-900">{formatOrderMoney(lineTotalAfter)}</p>
                        {lineTaxAmt > 0 && (
                          <p className="text-[10px] text-gray-400 mt-0.5">Thuế: {formatOrderMoney(lineTaxAmt)}</p>
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
        title="Gửi duyệt đơn hàng"
        description={`Gửi đơn hàng "${order.order_no}" để quản lý phê duyệt? Đơn hàng sẽ bị khóa chỉnh sửa sau khi gửi.`}
        confirmText="Gửi duyệt"
        variant="primary"
        onConfirm={async () => {
          await dispatch(submitSaleOrder(order.id)).unwrap();
          setActiveModal(null);
        }}
      />

      <ActionConfirmModal
        isOpen={activeModal === "approve"}
        onClose={() => setActiveModal(null)}
        title="Duyệt đơn hàng"
        description={`Duyệt đơn hàng "${order.order_no}"? Thao tác này xác nhận điều khoản bán hàng và đặt lịch xuất kho.`}
        confirmText="Duyệt"
        variant="success"
        onConfirm={async () => {
          await dispatch(approveSaleOrder(order.id)).unwrap();
          setActiveModal(null);
        }}
      />

      <ActionConfirmModal
        isOpen={activeModal === "reject"}
        onClose={() => setActiveModal(null)}
        title="Từ chối đơn hàng"
        description={`Từ chối đơn hàng "${order.order_no}"? Vui lòng nhập lý do để thông báo cho nhân viên bán hàng.`}
        confirmText="Từ chối"
        variant="danger"
        requireReason
        reasonLabel="Lý do từ chối"
        reasonPlaceholder="VD: Giá không khớp thỏa thuận, không đủ hàng..."
        onConfirm={async (reason) => {
          await dispatch(rejectSaleOrder({ id: order.id, reason: reason ?? "" })).unwrap();
          setActiveModal(null);
        }}
      />
    </StandardFormLayout>
  );
}
