import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Save, RotateCcw, Package, FileText, Info, Loader2 } from "lucide-react";
import { toast } from "react-toastify";
import { getSaleOrders, getSaleOrderById } from "../service/saleOrder.service";
import { createRma, submitRma } from "../service/salesReturn.service";
import { SaleOrderDto } from "../dto/saleOrder.dto";
import { ReturnType } from "../dto/salesReturn.dto";
import { StatusBadge } from "@/components/common";
import { formatCurrency } from "@/utils/currency.helper";

const fmtDate = (value?: string | null) =>
  value ? new Date(value).toLocaleDateString("vi-VN") : "-";

const RETURN_TYPE_OPTIONS: { value: ReturnType; label: string; desc: string }[] = [
  {
    value: "credit_note",
    label: "Chứng từ ghi có",
    desc: "Ghi nhận công nợ cho đơn hàng tiếp theo",
  },
  {
    value: "refund",
    label: "Hoàn tiền",
    desc: "Trả tiền mặt hoặc chuyển khoản cho khách",
  },
  {
    value: "replacement",
    label: "Đổi hàng",
    desc: "Giao hàng mới thay thế hàng lỗi hoặc sai",
  },
];

export default function SalesReturnCreatePage() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState<SaleOrderDto[]>([]);
  const [saleOrderId, setSaleOrderId] = useState("");
  const [orderDetail, setOrderDetail] = useState<SaleOrderDto | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [returnType, setReturnType] = useState<ReturnType>("credit_note");
  const [reason, setReason] = useState("");
  const [notes, setNotes] = useState("");
  const [submitNow, setSubmitNow] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getSaleOrders()
      .then((data) => setOrders(data.filter((order) => order.approval_status === "approved")))
      .catch((err) => toast.error(err?.response?.data?.message || "Không tải được đơn hàng"));
  }, []);

  const handleOrderChange = async (id: string) => {
    setSaleOrderId(id);
    setOrderDetail(null);
    if (!id) return;

    setLoadingDetail(true);
    try {
      const detail = await getSaleOrderById(Number(id));
      setOrderDetail(detail);
    } catch {
      toast.error("Không tải được chi tiết đơn hàng");
    } finally {
      setLoadingDetail(false);
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!saleOrderId) {
      toast.error("Vui lòng chọn đơn hàng cần hoàn");
      return;
    }

    if (!reason.trim()) {
      toast.error("Vui lòng nhập lý do hoàn hàng");
      return;
    }

    setSaving(true);
    try {
      const rma = await createRma({
        sale_order_id: Number(saleOrderId),
        return_type: returnType,
        reason: reason.trim(),
        notes: notes.trim() || null,
      });

      if (submitNow) {
        await submitRma(rma.id);
      }

      toast.success(
        submitNow
          ? "Đã tạo và gửi duyệt yêu cầu hoàn hàng"
          : "Đã tạo yêu cầu hoàn hàng",
      );
      navigate("/sales/returns");
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Không tạo được yêu cầu hoàn hàng");
    } finally {
      setSaving(false);
    }
  };

  const lines = orderDetail?.lines ?? [];
  const currencyCode = orderDetail?.currency?.code || "VND";
  const currencyLabel = orderDetail?.currency
    ? `${orderDetail.currency.code}${orderDetail.currency.symbol ? ` (${orderDetail.currency.symbol})` : ""}`
    : "VND";
  const fmtDocMoney = (value?: number | null) =>
    value != null ? formatCurrency(value, currencyCode) : "-";

  return (
    <div className="page-container">
      <form onSubmit={handleSubmit} className="mx-auto max-w-5xl space-y-4">
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => navigate("/sales/returns")}
            className="inline-flex h-8 items-center gap-1.5 rounded-md border border-gray-300 bg-white px-3 text-sm text-gray-600 transition-colors hover:bg-gray-50"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Quay lại
          </button>
          <button
            type="submit"
            disabled={saving}
            className="inline-flex h-8 items-center gap-1.5 rounded-md bg-orange-500 px-4 text-sm font-medium text-white shadow-sm transition-colors hover:bg-orange-600 disabled:opacity-60"
          >
            {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
            {saving ? "Đang lưu..." : "Lưu yêu cầu"}
          </button>
        </div>

        <div className="erp-card overflow-hidden">
          <div className="flex items-center gap-2.5 border-b border-gray-200 px-5 py-4">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-orange-50">
              <RotateCcw className="h-4 w-4 text-orange-500" />
            </span>
            <div>
              <h1 className="text-base font-semibold text-gray-900">Tạo yêu cầu hoàn hàng (RMA)</h1>
              <p className="mt-0.5 text-xs text-gray-400">
                RMA là bước bắt buộc trước khi nhận hàng hoàn, credit note hoặc refund
              </p>
            </div>
          </div>

          <div className="grid gap-6 p-5 md:grid-cols-[1fr_300px]">
            <div className="space-y-5">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">
                  Đơn hàng đã duyệt <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <select
                    value={saleOrderId}
                    onChange={(event) => handleOrderChange(event.target.value)}
                    className="h-9 w-full rounded-md border border-gray-200 bg-white px-3 text-sm focus:border-transparent focus:outline-none focus:ring-2 focus:ring-orange-400"
                  >
                    <option value="">- Chọn đơn hàng -</option>
                    {orders.map((order) => (
                      <option key={order.id} value={order.id}>
                        {order.order_no} - {order.customer?.name || "Khách hàng"}
                      </option>
                    ))}
                  </select>
                  {loadingDetail && (
                    <Loader2 className="absolute right-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 animate-spin text-orange-400" />
                  )}
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">Hướng xử lý</label>
                <div className="grid gap-2 sm:grid-cols-3">
                  {RETURN_TYPE_OPTIONS.map((option) => (
                    <label
                      key={option.value}
                      className={`flex cursor-pointer flex-col gap-0.5 rounded-md border p-3 transition-colors ${
                        returnType === option.value
                          ? "border-orange-400 bg-orange-50 ring-1 ring-orange-400"
                          : "border-gray-200 bg-white hover:border-gray-300"
                      }`}
                    >
                      <input
                        type="radio"
                        name="returnType"
                        value={option.value}
                        checked={returnType === option.value}
                        onChange={() => setReturnType(option.value)}
                        className="sr-only"
                      />
                      <span className={`text-sm font-medium ${returnType === option.value ? "text-orange-700" : "text-gray-800"}`}>
                        {option.label}
                      </span>
                      <span className="text-xs text-gray-400">{option.desc}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">
                  Lý do hoàn hàng <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={reason}
                  onChange={(event) => setReason(event.target.value)}
                  rows={4}
                  placeholder="Ví dụ: hàng lỗi, sai quy cách, khách hủy một phần..."
                  className="w-full resize-none rounded-md border border-gray-200 px-3 py-2 text-sm focus:border-transparent focus:outline-none focus:ring-2 focus:ring-orange-400"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">Ghi chú nội bộ</label>
                <textarea
                  value={notes}
                  onChange={(event) => setNotes(event.target.value)}
                  rows={2}
                  placeholder="Thông tin bổ sung cho bộ phận xử lý..."
                  className="w-full resize-none rounded-md border border-gray-200 px-3 py-2 text-sm focus:border-transparent focus:outline-none focus:ring-2 focus:ring-orange-400"
                />
              </div>

              <label className="flex cursor-pointer items-center gap-2.5 rounded-md border border-gray-200 bg-gray-50/60 px-4 py-3">
                <input
                  type="checkbox"
                  checked={submitNow}
                  onChange={(event) => setSubmitNow(event.target.checked)}
                  className="h-4 w-4 rounded border-gray-300 accent-orange-500"
                />
                <div>
                  <p className="text-sm font-medium text-gray-700">Gửi duyệt ngay sau khi tạo</p>
                  <p className="text-xs text-gray-400">
                    RMA sẽ chuyển sang trạng thái Chờ duyệt ngay lập tức
                  </p>
                </div>
              </label>
            </div>

            <aside className="space-y-3">
              <div className="overflow-hidden rounded-md border border-gray-200 bg-gray-50/60">
                <div className="flex items-center gap-2 border-b border-gray-200 bg-white px-4 py-3">
                  <Package className="h-3.5 w-3.5 text-gray-400" />
                  <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Thông tin đơn hàng
                  </span>
                </div>

                {loadingDetail ? (
                  <div className="flex items-center justify-center gap-2 py-8 text-gray-400">
                    <Loader2 className="h-4 w-4 animate-spin text-orange-400" />
                    <span className="text-xs">Đang tải...</span>
                  </div>
                ) : orderDetail ? (
                  <div className="divide-y divide-gray-100">
                    {[
                      { label: "Số đơn", value: orderDetail.order_no },
                      { label: "Khách hàng", value: orderDetail.customer?.name || "-" },
                      { label: "Ngày đặt", value: fmtDate(orderDetail.order_date) },
                      {
                        label: "Giao hàng",
                        value: <StatusBadge status={orderDetail.delivery_status || "pending"} />,
                      },
                      { label: "Tiền tệ", value: currencyLabel },
                      {
                        label: "Tổng tiền",
                        value: <span className="font-semibold text-orange-600">{fmtDocMoney(orderDetail.total_after_tax)}</span>,
                      },
                    ].map(({ label, value }) => (
                      <div key={label} className="flex items-center justify-between gap-2 px-4 py-2.5">
                        <span className="text-xs text-gray-500">{label}</span>
                        <span className="text-right text-xs">{value}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-2 px-4 py-8 text-gray-400">
                    <FileText className="h-8 w-8 text-gray-200" />
                    <p className="text-center text-xs">Chọn đơn hàng để xem thông tin</p>
                  </div>
                )}
              </div>

              <div className="flex gap-2.5 rounded-md border border-blue-100 bg-blue-50 p-3">
                <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-blue-500" />
                <p className="text-xs leading-relaxed text-blue-700">
                  Sau khi RMA được duyệt, bộ phận kho tạo phiếu nhận hoàn và xử lý theo hướng đã chọn.
                </p>
              </div>
            </aside>
          </div>
        </div>

        {(orderDetail || loadingDetail) && (
          <div className="erp-card overflow-hidden">
            <div className="flex items-center justify-between border-b border-gray-200 px-5 py-3">
              <div className="flex items-center gap-2">
                <Package className="h-3.5 w-3.5 text-orange-500" />
                <span className="text-sm font-semibold text-gray-800">
                  Danh sách hàng hóa trong đơn
                </span>
                {lines.length > 0 && (
                  <span className="inline-flex items-center rounded-full bg-orange-50 px-2 py-0.5 text-xs font-semibold text-orange-600">
                    {lines.length} sản phẩm
                  </span>
                )}
              </div>
              <span className="text-xs text-gray-400">Đơn hàng: {orderDetail?.order_no}</span>
            </div>

            {loadingDetail ? (
              <div className="flex items-center justify-center gap-2 py-10 text-gray-400">
                <Loader2 className="h-5 w-5 animate-spin text-orange-400" />
                <span className="text-sm">Đang tải sản phẩm...</span>
              </div>
            ) : lines.length === 0 ? (
              <div className="flex flex-col items-center gap-2 py-10 text-gray-400">
                <Package className="h-8 w-8 text-gray-200" />
                <p className="text-sm">Không có sản phẩm nào trong đơn hàng này.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100 bg-gray-50/80">
                      <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">#</th>
                      <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Sản phẩm</th>
                      <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">SKU</th>
                      <th className="px-5 py-3 text-center text-xs font-semibold uppercase tracking-wider text-gray-500">SL / UOM</th>
                      <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-500">Đơn giá ({currencyCode})</th>
                      <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-500">Thuế</th>
                      <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-500">Thành tiền ({currencyCode})</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {lines.map((line, index) => {
                      const productUom = (line.product as any)?.uom;
                      const uomCode = line.uom?.code || productUom?.code || "-";
                      const uomName = line.uom?.name || productUom?.name || "Đơn vị tính";

                      return (
                        <tr key={line.id ?? index} className="transition-colors hover:bg-orange-50/20">
                          <td className="px-5 py-3 text-xs text-gray-400">{index + 1}</td>
                          <td className="px-5 py-3">
                            <p className="font-medium text-gray-900">{line.product?.name || "-"}</p>
                          </td>
                          <td className="px-5 py-3 text-xs text-gray-400">
                            {(line.product as any)?.sku || "-"}
                          </td>
                          <td className="px-5 py-3 text-center text-sm font-semibold text-gray-800">
                            {Number(line.quantity ?? 0).toLocaleString("vi-VN")} {uomCode}
                            <p className="mt-0.5 text-[11px] font-normal text-gray-400">{uomName}</p>
                          </td>
                          <td className="px-5 py-3 text-right text-sm text-gray-600">
                            {fmtDocMoney(line.unit_price ?? 0)}
                          </td>
                          <td className="px-5 py-3 text-right text-xs text-gray-400">
                            {line.taxRate ? `${line.taxRate.rate}%` : "-"}
                          </td>
                          <td className="px-5 py-3 text-right text-sm font-semibold text-gray-900">
                            {fmtDocMoney(line.line_total_after_tax ?? 0)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot>
                    <tr className="border-t-2 border-gray-200 bg-orange-50/40">
                      <td colSpan={6} className="px-5 py-3 text-right text-sm font-semibold text-gray-700">
                        Tổng cộng
                      </td>
                      <td className="px-5 py-3 text-right text-sm font-bold text-orange-600">
                        {fmtDocMoney(orderDetail?.total_after_tax)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}
          </div>
        )}
      </form>
    </div>
  );
}
