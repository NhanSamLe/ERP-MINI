import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-toastify";
import { CornerUpLeft, FileText } from "lucide-react";
import { AppDispatch, RootState } from "../../../../store/store";
import { createPraThunk } from "../../store/purchaseReturn";
import { loadPartners } from "@/features/partner/store/partner.thunks";
import { fetchPurchaseOrdersThunk } from "../../store/purchaseOrder.thunks";
import { getAllApInvoicesThunk } from "../../store/apInvoice/apInvoice.thunks";
import { StandardFormLayout } from "../../../../components/layout/StandardFormLayout";
import { FormSection } from "../../../../components/layout/FormSection";
import { getErrorMessage } from "@/utils/ErrorHelper";

const RETURN_TYPE_OPTIONS = [
  { value: "debit_note", label: "Thẻ nợ (Trừ công nợ)" },
  { value: "refund", label: "Hoàn tiền (NCC hoàn tiền)" },
  { value: "replacement", label: "Đổi hàng (Đổi trả hàng)" },
];

const PO_STATUS_MAP: Record<string, string> = {
  draft: "Nháp",
  waiting_approval: "Chờ duyệt",
  confirmed: "Đã xác nhận",
  sent: "Đã gửi",
  supplier_accepted: "NCC chấp nhận",
  partially_received: "Đã nhận hàng một phần",
  received: "Đã nhận hàng",
  completed: "Hoàn thành",
  cancelled: "Đã hủy",
};

export default function PraCreatePage() {
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  const [searchParams] = useSearchParams();

  const partners = useSelector((s: RootState) => s.partners);
  const { items: purchaseOrders } = useSelector(
    (s: RootState) => s.purchaseOrder,
  );
  const { list: apInvoices } = useSelector((s: RootState) => s.apInvoice);
  const user = useSelector((s: RootState) => s.auth.user);

  // Form fields
  const [supplierId, setSupplierId] = useState<number | "">("");
  const [purchaseOrderId, setPurchaseOrderId] = useState<number | "">(
    searchParams.get("po_id") ? Number(searchParams.get("po_id")) : "",
  );
  const [apInvoiceId, setApInvoiceId] = useState<number | "">("");
  const [returnType, setReturnType] = useState<
    "debit_note" | "refund" | "replacement"
  >("debit_note");
  const [reason, setReason] = useState("");
  const [totalReturnAmount, setTotalReturnAmount] = useState<number | "">("");
  const [notes, setNotes] = useState("");

  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    dispatch(loadPartners({ type: "supplier" }));
    dispatch(fetchPurchaseOrdersThunk());
    dispatch(getAllApInvoicesThunk());
  }, [dispatch]);

  // Auto-fill supplier when PO is selected
  useEffect(() => {
    if (!purchaseOrderId) return;
    const po = purchaseOrders.find((p) => p.id === purchaseOrderId);
    if (po?.supplier_id) setSupplierId(po.supplier_id);
  }, [purchaseOrderId, purchaseOrders]);

  const eligiblePOs = purchaseOrders.filter((po) =>
    ["confirmed", "received", "partially_received", "completed"].includes(po.status),
  );

  const selectedPoObj = eligiblePOs.find((p) => p.id === purchaseOrderId);
  const selectedInvObj = apInvoices.find((i) => i.id === apInvoiceId);
  const maxReturnAmount = selectedInvObj
    ? Number(selectedInvObj.total_after_tax ?? 0)
    : selectedPoObj
      ? Number(selectedPoObj.total_after_tax ?? 0)
      : 0;

  const handleSubmit = async () => {
    if (!supplierId) {
      toast.error("Vui lòng chọn nhà cung cấp");
      return;
    }
    if (!purchaseOrderId) {
      toast.error("Vui lòng chọn đơn mua hàng");
      return;
    }
    if (!reason.trim()) {
      toast.error("Vui lòng nhập lý do trả hàng");
      return;
    }
    if (!totalReturnAmount || Number(totalReturnAmount) <= 0) {
      toast.error("Tổng giá trị trả hàng phải lớn hơn 0");
      return;
    }
    if (Number(totalReturnAmount) > maxReturnAmount) {
      toast.error(
        `Số tiền trả hàng không được vượt quá giá trị tối đa cho phép là ${maxReturnAmount.toLocaleString("vi-VN")} đ`
      );
      return;
    }

    setSubmitting(true);
    try {
      const pra = await dispatch(
        createPraThunk({
          supplier_id: supplierId as number,
          purchase_order_id: purchaseOrderId as number,
          ap_invoice_id: apInvoiceId || null,
          return_type: returnType,
          reason: reason.trim(),
          total_return_amount: Number(totalReturnAmount),
          notes: notes.trim() || null,
        } as any),
      ).unwrap();
      toast.success(`Đã tạo PRA ${pra.pra_no}`);
      navigate(`/purchase/return-authorizations/${pra.id}`);
    } catch (e: any) {
      toast.error(getErrorMessage(e));
    } finally {
      setSubmitting(false);
    }
  };



  return (
    <StandardFormLayout
      title="Tạo Yêu cầu Trả hàng mua mới (PRA)"
      actions={[
        {
          label: "Hủy bỏ",
          variant: "outline",
          onClick: () => navigate("/purchase/return-authorizations"),
        },
        {
          label: "Tạo PRA",
          variant: "primary",
          onClick: handleSubmit,
          isLoading: submitting,
        },
      ]}
    >
      <FormSection
        title="Chi tiết Yêu cầu trả hàng mua"
        icon={<CornerUpLeft className="w-4 h-4" />}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Purchase Order */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Đơn mua hàng (PO) <span className="text-red-500">*</span>
            </label>
            <select
              value={purchaseOrderId}
              onChange={(e) =>
                setPurchaseOrderId(e.target.value ? Number(e.target.value) : "")
              }
              className="w-full h-9 px-3 text-sm border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-orange-500"
            >
              <option value="">— Chọn Đơn mua hàng —</option>
              {eligiblePOs.map((po) => (
                <option key={po.id} value={po.id}>
                  {po.po_no} — {PO_STATUS_MAP[po.status] || po.status}
                </option>
              ))}
            </select>
            {selectedPoObj && (
              <p className="text-xs text-blue-600 mt-1">
                Giá trị PO: {Number(selectedPoObj.total_after_tax).toLocaleString("vi-VN")} đ
              </p>
            )}
            {purchaseOrders.length > 0 && eligiblePOs.length === 0 && (
              <p className="text-xs text-amber-600 mt-1">
                Không có đơn mua hàng nào đủ điều kiện. Đơn mua hàng phải ở trạng thái Đã xác nhận / Đã nhận hàng / Đã nhận hàng một phần / Đã hoàn thành.
              </p>
            )}
          </div>

          {/* AP Invoice */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Hóa đơn mua hàng (AP) <span className="text-gray-400">(tùy chọn)</span>
            </label>
            <select
              value={apInvoiceId}
              onChange={(e) =>
                setApInvoiceId(e.target.value ? Number(e.target.value) : "")
              }
              disabled={!purchaseOrderId}
              className="w-full h-9 px-3 text-sm border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-orange-500 disabled:bg-gray-100 disabled:text-gray-400"
            >
              <option value="">— Chọn hóa đơn mua hàng —</option>
              {apInvoices
                .filter(
                  (inv) =>
                    inv.po_id === purchaseOrderId &&
                    inv.status !== "draft" &&
                    inv.status !== "cancelled"
                )
                .map((inv) => (
                  <option key={inv.id} value={inv.id}>
                    {inv.invoice_no} — {Number(inv.total_after_tax).toLocaleString("vi-VN")}
                  </option>
                ))}
            </select>
            {selectedInvObj && (
              <p className="text-xs text-blue-600 mt-1">
                Giá trị hóa đơn: {Number(selectedInvObj.total_after_tax).toLocaleString("vi-VN")} đ
              </p>
            )}
            {!purchaseOrderId && (
              <p className="text-[10px] text-gray-500 mt-1">
                Vui lòng chọn PO trước để xem các hóa đơn tương ứng
              </p>
            )}
          </div>

          {/* Supplier */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Nhà cung cấp <span className="text-red-500">*</span>
            </label>
            <select
              value={supplierId}
              onChange={(e) =>
                setSupplierId(e.target.value ? Number(e.target.value) : "")
              }
              className="w-full h-9 px-3 text-sm border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-orange-500"
            >
              <option value="">— Chọn nhà cung cấp —</option>
              {partners.items.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          {/* Return Type */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Loại trả hàng <span className="text-red-500">*</span>
            </label>
            <select
              value={returnType}
              onChange={(e) => setReturnType(e.target.value as any)}
              className="w-full h-9 px-3 text-sm border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-orange-500"
            >
              {RETURN_TYPE_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>

          {/* Total Return Amount */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Tổng giá trị trả hàng <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              min={0}
              value={totalReturnAmount}
              onChange={(e) =>
                setTotalReturnAmount(
                  e.target.value ? Number(e.target.value) : "",
                )
              }
              placeholder="0"
              className="w-full h-9 px-3 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
            {maxReturnAmount > 0 && (
              <p className="text-[11px] text-orange-600 mt-1 font-medium">
                Tối đa: {maxReturnAmount.toLocaleString("vi-VN")} đ
              </p>
            )}
          </div>

          {/* Branch (read-only) */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Chi nhánh
            </label>
            <div className="h-9 px-3 flex items-center text-sm bg-gray-50 border border-gray-200 rounded-md text-gray-600">
              {user?.branch?.name ?? "—"}
            </div>
          </div>
        </div>

        {/* Reason */}
        <div className="mt-4">
          <label className="block text-xs font-medium text-gray-600 mb-1">
            Lý do trả hàng <span className="text-red-500">*</span>
          </label>
          <textarea
            rows={3}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Mô tả chi tiết lý do trả hàng..."
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-orange-500"
          />
        </div>

        {/* Notes */}
        <div className="mt-3">
          <label className="block text-xs font-medium text-gray-600 mb-1">
            Ghi chú <span className="text-gray-400">(tùy chọn)</span>
          </label>
          <textarea
            rows={2}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Ghi chú thêm..."
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-orange-500"
          />
        </div>
      </FormSection>

      {/* Info box */}
      <FormSection
        title="Quy trình tiếp theo là gì?"
        icon={<FileText className="w-4 h-4" />}
      >
        <ol className="space-y-2 text-sm text-gray-600">
          <li className="flex items-start gap-2">
            <span className="w-5 h-5 rounded-full bg-orange-100 text-orange-600 text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
              1
            </span>
            <span>
              PRA được tạo dưới dạng <strong>Nháp</strong> — bạn có thể xem lại trước khi gửi phê duyệt
            </span>
          </li>
          <li className="flex items-start gap-2">
            <span className="w-5 h-5 rounded-full bg-orange-100 text-orange-600 text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
              2
            </span>
            <span>Gửi phê duyệt → Trưởng phòng mua hàng sẽ duyệt yêu cầu</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="w-5 h-5 rounded-full bg-orange-100 text-orange-600 text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
              3
            </span>
            <span>
              Sau khi được duyệt → Tạo Phiếu trả hàng mua để xuất kho trả hàng thực tế
            </span>
          </li>
          <li className="flex items-start gap-2">
            <span className="w-5 h-5 rounded-full bg-orange-100 text-orange-600 text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
              4
            </span>
            <span>Kế toán tạo Thẻ nợ (Debit Note) để giảm trừ khoản phải trả cho nhà cung cấp</span>
          </li>
        </ol>
      </FormSection>
    </StandardFormLayout>
  );
}
