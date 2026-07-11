import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  fetchInvoiceDetail,
  submitInvoice,
  approveInvoice,
  rejectInvoice,
} from "@/features/sales/store/invoice.slice";
import { ActionConfirmModal, StatusBadge } from "@/components/common";
import { StandardFormLayout, FormSection } from "@/components/layout";
import { formatVND } from "@/utils/currency.helper";
import InvoiceExportToolbar from "../components/ar.components.ts/InvoiceExportToolbar";
import {
  FileText, User, CreditCard, Phone, Mail, MapPin,
  Package, AlertTriangle, CheckCircle2, Clock, UserCheck, Loader2,
} from "lucide-react";

const fmtDate = (d?: string | null) =>
  d ? new Date(d).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" }) : "—";
const fmtTime = (d?: string | null) =>
  d ? new Date(d).toLocaleString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "—";

const Field = ({ label, value }: { label: string; value?: string | null }) => (
  <div>
    <p className="text-xs text-gray-500 mb-0.5">{label}</p>
    <p className="text-sm font-medium text-gray-800">{value || "—"}</p>
  </div>
);

export default function InvoiceDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  const [activeModal, setActiveModal] = useState<"submit" | "approve" | "reject" | null>(null);

  const { selected: invoice, loading } = useAppSelector((s) => s.invoice);
  const { user } = useAppSelector((s) => s.auth);

  useEffect(() => {
    if (id) dispatch(fetchInvoiceDetail(Number(id)));
  }, [dispatch, id]);

  if (loading || !invoice) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-gray-400">
          <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
          <p className="text-sm font-medium">Đang tải hóa đơn...</p>
        </div>
      </div>
    );
  }

  if (!user) return <div className="p-10 text-center text-gray-500">Không có quyền truy cập</div>;

  /* ─── derived ─── */
  const currencyCode = invoice.currency?.code || "VND";
  const currencySymbol = invoice.currency?.symbol || currencyCode;
  const exchangeRate = Number(invoice.exchange_rate || 1);
  const fmtMoney = (v: number | null | undefined) =>
    `${Number(v || 0).toLocaleString("vi-VN", { maximumFractionDigits: 2 })} ${currencySymbol}`;

  const roleCode = user.role?.code;
  const isAccountant = ["ACCOUNT", "BRANCH_MANAGER", "CEO", "ADMIN"].includes(roleCode ?? "");
  const isChiefAcc = ["CHACC", "BRANCH_MANAGER", "CEO", "ADMIN"].includes(roleCode ?? "");
  const isAccounting = isAccountant || isChiefAcc;
  const isOwner = invoice.created_by === user.id;
  const isRejected = invoice.approval_status === "rejected";

  const canSubmit = invoice.approval_status === "draft" && isAccounting && (isOwner || isChiefAcc);
  const canApprove = invoice.approval_status === "waiting_approval" && isChiefAcc;
  const canReject = canApprove;

  const subtotal = invoice.total_before_tax ?? 0;
  const taxAmount = invoice.total_tax ?? 0;
  const grandTotal = invoice.total_after_tax ?? 0;
  const paidAmount = invoice.paid_amount ?? 0;
  const remaining = grandTotal - paidAmount;

  return (
    <StandardFormLayout
      title={invoice.invoice_no}
      statusBadge={
        <div className="flex items-center gap-2">
          <StatusBadge status={invoice.approval_status} />
          {invoice.status !== invoice.approval_status && (
            <StatusBadge status={invoice.status} />
          )}
        </div>
      }
      actions={[
        { label: "Quay lại", variant: "outline", onClick: () => navigate("/invoices") },
        ...(canSubmit ? [{ label: "Gửi duyệt", variant: "primary" as const, onClick: () => setActiveModal("submit") }] : []),
        ...(canApprove ? [{ label: "Duyệt", variant: "success" as const, onClick: () => setActiveModal("approve") }] : []),
        ...(canReject ? [{ label: "Từ chối", variant: "danger" as const, onClick: () => setActiveModal("reject") }] : []),
      ]}
      sidebarContent={
        <div className="space-y-4">
          {/* Financial summary */}
          <FormSection title="Tóm tắt tài chính" icon={<CreditCard className="w-4 h-4" />}>
            <div className="space-y-2.5">
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-500">Tạm tính</span>
                <span className="font-medium text-gray-800">{fmtMoney(subtotal)}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-500">Thuế VAT</span>
                <span className="font-medium text-gray-800">{fmtMoney(taxAmount)}</span>
              </div>
              <div className="pt-2.5 mt-1 border-t border-gray-200">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-semibold text-gray-900">Tổng cộng</span>
                  <span className="text-lg font-bold text-orange-600">{fmtMoney(grandTotal)}</span>
                </div>
                <p className="text-xs text-gray-400 mt-1 text-right">
                  Đã bao gồm thuế · {currencyCode}
                  {currencyCode !== "VND" ? ` · ≈ ${formatVND(grandTotal * exchangeRate)}` : ""}
                </p>
              </div>
              {paidAmount > 0 && (
                <div className="pt-2 border-t border-gray-100 space-y-1.5">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-500">Đã thanh toán</span>
                    <span className="font-medium text-green-600">{fmtMoney(paidAmount)}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-500">Còn lại</span>
                    <span className={`font-semibold ${remaining > 0 ? "text-orange-600" : "text-gray-400"}`}>
                      {fmtMoney(remaining)}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </FormSection>

          {/* Workflow */}
          <FormSection title="Luồng duyệt" icon={<Clock className="w-4 h-4" />}>
            <div className="space-y-3">
              <div className="flex items-start gap-2.5">
                <div className="w-5 h-5 rounded-full bg-gray-100 flex items-center justify-center shrink-0 mt-0.5">
                  <FileText className="w-3 h-3 text-gray-500" />
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-700">Tạo</p>
                  <p className="text-xs text-gray-500">{invoice.creator?.full_name || "—"}</p>
                  <p className="text-[10px] text-gray-400">{fmtTime(invoice.invoice_date)}</p>
                </div>
              </div>

              {invoice.submitted_at && (
                <div className="flex items-start gap-2.5">
                  <div className="w-5 h-5 rounded-full bg-amber-50 flex items-center justify-center shrink-0 mt-0.5">
                    <Clock className="w-3 h-3 text-amber-500" />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-gray-700">Gửi duyệt</p>
                    <p className="text-[10px] text-gray-400">{fmtTime(invoice.submitted_at)}</p>
                  </div>
                </div>
              )}

              {invoice.approved_at && invoice.approver && (
                <div className="flex items-start gap-2.5">
                  <div className="w-5 h-5 rounded-full bg-emerald-50 flex items-center justify-center shrink-0 mt-0.5">
                    <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-gray-700">Đã duyệt</p>
                    <p className="text-xs text-gray-500">{invoice.approver.full_name}</p>
                    <p className="text-[10px] text-gray-400">{fmtTime(invoice.approved_at)}</p>
                  </div>
                </div>
              )}

              {isRejected && (
                <div className="flex items-start gap-2.5">
                  <div className="w-5 h-5 rounded-full bg-red-50 flex items-center justify-center shrink-0 mt-0.5">
                    <AlertTriangle className="w-3 h-3 text-red-500" />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-red-600">Từ chối</p>
                    {invoice.reject_reason && (
                      <p className="text-xs text-gray-500 mt-0.5 italic">"{invoice.reject_reason}"</p>
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
                <p className="text-sm font-medium text-gray-800">{invoice.creator?.full_name || "—"}</p>
              </div>
              {invoice.approver && (
                <div>
                  <p className="text-xs text-gray-500 mb-0.5">Người duyệt</p>
                  <p className="text-sm font-medium text-gray-800">{invoice.approver.full_name}</p>
                </div>
              )}
              {invoice.branch && (
                <div>
                  <p className="text-xs text-gray-500 mb-0.5">Chi nhánh</p>
                  <p className="text-sm font-medium text-gray-800">{invoice.branch.name}</p>
                </div>
              )}
            </div>
          </FormSection>
        </div>
      }
    >
      {/* Rejection banner */}
      {isRejected && invoice.reject_reason && (
        <div className="flex items-start gap-3 px-4 py-3 bg-red-50 border border-red-100 rounded-lg">
          <AlertTriangle className="w-4 h-4 text-red-500 mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-semibold text-red-700">Hóa đơn bị từ chối</p>
            <p className="text-sm text-red-600 mt-0.5">{invoice.reject_reason}</p>
          </div>
        </div>
      )}

      {/* ─── 1. INVOICE INFO ─── */}
      <FormSection title="Thông tin hóa đơn" icon={<FileText className="w-4 h-4" />}>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Field label="Số hóa đơn" value={invoice.invoice_no} />
          <Field label="Ngày hóa đơn" value={fmtDate(invoice.invoice_date)} />
          <Field label="Ngày đến hạn" value={fmtDate(invoice.due_date)} />
          <Field label="Loại tiền" value={currencyCode !== "VND" ? `${currencyCode} (tỷ giá: ${exchangeRate})` : currencyCode} />
        </div>
        {invoice.order && (
          <div className="mt-4 pt-4 border-t border-gray-100">
            <p className="text-xs text-gray-500 mb-1">Từ đơn hàng</p>
            <a
              href={`/sales/orders/${invoice.order.id}`}
              className="inline-flex items-center gap-1.5 text-sm font-medium text-orange-600 hover:text-orange-700"
            >
              <Package className="w-3.5 h-3.5" />
              {invoice.order.order_no}
            </a>
          </div>
        )}
      </FormSection>

      {/* ─── 2. CUSTOMER ─── */}
      <FormSection title="Thông tin khách hàng" icon={<User className="w-4 h-4" />}>
        {invoice.customer ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
            <div className="space-y-4">
              <div>
                <p className="text-xs text-gray-500 mb-0.5">Tên khách hàng</p>
                <p className="text-base font-semibold text-gray-900">{invoice.customer.name}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-500 mb-0.5 flex items-center gap-1">
                    <Phone className="w-3 h-3" /> Điện thoại
                  </p>
                  <p className="text-sm text-gray-800">{invoice.customer.phone || "—"}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-0.5 flex items-center gap-1">
                    <Mail className="w-3 h-3" /> Email
                  </p>
                  <p className="text-sm text-gray-800 break-all">{invoice.customer.email || "—"}</p>
                </div>
              </div>
            </div>
            <div className="space-y-4">
              <div>
                <p className="text-xs text-gray-500 mb-0.5 flex items-center gap-1">
                  <CreditCard className="w-3 h-3" /> Mã số thuế
                </p>
                <p className="text-sm font-medium text-gray-800">{invoice.customer.tax_code || "—"}</p>
              </div>
              {invoice.customer.address && (
                <div>
                  <p className="text-xs text-gray-500 mb-0.5 flex items-center gap-1">
                    <MapPin className="w-3 h-3" /> Địa chỉ
                  </p>
                  <p className="text-sm text-gray-700 leading-relaxed">{invoice.customer.address}</p>
                </div>
              )}
            </div>
          </div>
        ) : invoice.order?.customer ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="md:col-span-2">
              <p className="text-xs text-gray-500 mb-0.5">Tên khách hàng</p>
              <p className="text-base font-semibold text-gray-900">{invoice.order.customer.name}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-0.5 flex items-center gap-1">
                <Phone className="w-3 h-3" /> Điện thoại
              </p>
              <p className="text-sm text-gray-800">{invoice.order.customer.phone || "—"}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-0.5 flex items-center gap-1">
                <Mail className="w-3 h-3" /> Email
              </p>
              <p className="text-sm text-gray-800 break-all">{invoice.order.customer.email || "—"}</p>
            </div>
          </div>
        ) : (
          <p className="text-sm text-gray-400 italic">Không có thông tin khách hàng.</p>
        )}
      </FormSection>

      {/* ─── Export / Print toolbar ─── */}
      <InvoiceExportToolbar invoice={invoice} />

      {/* ─── 3. INVOICE LINES ─── */}
      <FormSection
        title="Dòng hóa đơn"
        icon={<Package className="w-4 h-4" />}
        description={`${invoice.lines?.length ?? 0} sản phẩm`}
        noPadding
      >
        <div className="overflow-x-auto">
          <table className="w-full text-sm table-fixed">
            <colgroup><col style={{ width: "40px" }} /><col /><col style={{ width: "72px" }} /><col style={{ width: "72px" }} /><col style={{ width: "150px" }} /><col style={{ width: "80px" }} /><col style={{ width: "150px" }} /></colgroup>
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
              {!invoice.lines || invoice.lines.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-sm text-gray-400">Không có dòng sản phẩm.</td>
                </tr>
              ) : (
                invoice.lines.map((line, idx) => {
                  const lineSubtotal = line.line_total ?? (line.unit_price ?? 0) * (line.quantity ?? 0);
                  const lineTaxAmt = line.line_tax ?? 0;
                  const lineTotalAfter = line.line_total_after_tax ?? (lineSubtotal + lineTaxAmt);
                  const taxRate = line.taxRate?.rate ?? 0;
                  const qty = Number(line.quantity ?? 0);
                  const displayQty = Number.isInteger(qty) ? qty : parseFloat(qty.toFixed(3));
                  const uomCode = (line.product as any)?.uom?.code || "—";

                  return (
                    <tr key={idx} className="hover:bg-orange-50/30 transition-colors">
                      <td className="px-4 py-4 text-xs text-gray-400">{idx + 1}</td>
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
                      <td className="px-4 py-4 text-center">
                        <span className="inline-flex px-1.5 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-600">
                          {uomCode}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-center">
                        <span className="inline-flex items-center justify-center h-7 px-3 bg-gray-100 rounded-md text-sm font-semibold text-gray-800 min-w-[2.5rem]">
                          {displayQty}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-right">
                        <span className="text-sm font-medium text-gray-800">{fmtMoney(line.unit_price ?? 0)}</span>
                      </td>
                      <td className="px-4 py-4 text-center">
                        {taxRate > 0 ? (
                          <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-600">
                            {taxRate}%
                          </span>
                        ) : (
                          <span className="text-xs text-gray-400">—</span>
                        )}
                      </td>
                      <td className="px-4 py-4 text-right">
                        <p className="text-sm font-semibold text-gray-900">{fmtMoney(lineTotalAfter)}</p>
                        {lineTaxAmt > 0 && (
                          <p className="text-[10px] text-gray-400 mt-0.5">Thuế: {fmtMoney(lineTaxAmt)}</p>
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

      {/* Modals */}
      <ActionConfirmModal
        isOpen={activeModal === "submit"}
        onClose={() => setActiveModal(null)}
        title="Gửi duyệt hóa đơn"
        description={`Gửi hóa đơn "${invoice.invoice_no}" để kế toán trưởng phê duyệt? Hóa đơn sẽ bị khóa chỉnh sửa sau khi gửi.`}
        confirmText="Gửi duyệt"
        variant="primary"
        onConfirm={async () => {
          await dispatch(submitInvoice(invoice.id)).unwrap();
          dispatch(fetchInvoiceDetail(invoice.id));
          setActiveModal(null);
        }}
      />

      <ActionConfirmModal
        isOpen={activeModal === "approve"}
        onClose={() => setActiveModal(null)}
        title="Duyệt hóa đơn"
        description={`Duyệt hóa đơn "${invoice.invoice_no}"? Hóa đơn sẽ được phát hành và cập nhật sổ kế toán.`}
        confirmText="Duyệt"
        variant="success"
        onConfirm={async () => {
          await dispatch(approveInvoice(invoice.id)).unwrap();
          dispatch(fetchInvoiceDetail(invoice.id));
          setActiveModal(null);
        }}
      />

      <ActionConfirmModal
        isOpen={activeModal === "reject"}
        onClose={() => setActiveModal(null)}
        title="Từ chối hóa đơn"
        description={`Từ chối hóa đơn "${invoice.invoice_no}"? Vui lòng nhập lý do để thông báo cho kế toán.`}
        confirmText="Từ chối"
        variant="danger"
        requireReason
        reasonLabel="Lý do từ chối"
        reasonPlaceholder="VD: Sai thông tin khách hàng, sai giá..."
        onConfirm={async (reason) => {
          await dispatch(rejectInvoice({ id: invoice.id, reason: reason ?? "" })).unwrap();
          dispatch(fetchInvoiceDetail(invoice.id));
          setActiveModal(null);
        }}
      />
    </StandardFormLayout>
  );
}
