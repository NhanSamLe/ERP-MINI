import { ArInvoiceDto } from "../../dto/invoice.dto";

interface Props {
  invoice: ArInvoiceDto;
}

const fmtDate = (d?: string | Date | null) =>
  d ? new Date(d as string).toLocaleDateString("vi-VN") : "—";

const Field = ({ label, value }: { label: string; value?: string | null }) => (
  <div>
    <p className="text-xs text-gray-500 uppercase font-semibold mb-0.5">{label}</p>
    <p className="text-sm text-gray-900 font-medium">{value || "—"}</p>
  </div>
);

export default function InvoiceDetailInfo({ invoice }: Props) {
  const customer = invoice.customer || invoice.order?.customer;
  const currencySymbol = invoice.currency?.symbol || invoice.currency?.code || "VND";
  const currencyCode   = invoice.currency?.code || "VND";
  const exchangeRate   = Number(invoice.exchange_rate || 1);

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
      {/* Chi nhánh & Đơn hàng */}
      <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
        <h3 className="text-base font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <div className="w-1 h-5 bg-blue-600 rounded" />
          Chi nhánh & Đơn hàng
        </h3>
        <div className="space-y-3">
          <Field label="Chi nhánh" value={invoice.branch?.name} />
          <Field label="Số đơn hàng" value={invoice.order?.order_no} />
          <Field label="Ngày đặt hàng" value={fmtDate(invoice.order?.order_date)} />
          <Field label="Ngày hóa đơn" value={fmtDate(invoice.invoice_date)} />
          {invoice.due_date && <Field label="Ngày đáo hạn" value={fmtDate(invoice.due_date)} />}
        </div>

        {/* Tiền tệ */}
        <div className="mt-4 pt-4 border-t border-gray-100 space-y-3">
          <h4 className="text-xs font-semibold text-gray-500 uppercase">Tiền tệ</h4>
          <Field label="Loại tiền" value={`${currencyCode} (${currencySymbol})`} />
          {currencyCode !== "VND" && (
            <Field label="Tỉ giá" value={`1 ${currencyCode} = ${exchangeRate.toLocaleString("vi-VN")} VND`} />
          )}
        </div>
      </div>

      {/* Khách hàng */}
      <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
        <h3 className="text-base font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <div className="w-1 h-5 bg-purple-600 rounded" />
          Khách hàng
        </h3>
        <div className="space-y-3">
          <Field label="Tên" value={customer?.name} />
          <Field label="Điện thoại" value={customer?.phone} />
          <Field label="Email" value={customer?.email} />
          <Field label="Mã số thuế" value={customer?.tax_code} />
          <Field label="Địa chỉ" value={customer?.address} />
        </div>
      </div>

      {/* Nhân viên */}
      <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
        <h3 className="text-base font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <div className="w-1 h-5 bg-orange-600 rounded" />
          Nhân viên
        </h3>
        <div className="space-y-4">
          <Field label="Người tạo" value={invoice.creator?.full_name || invoice.creator?.username} />
          {invoice.approver && (
            <div className="pt-3 border-t border-gray-200">
              <Field label="Người duyệt" value={invoice.approver.full_name || invoice.approver.username} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
