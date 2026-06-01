import { formatVND } from "@/utils/currency.helper";
import { ArInvoiceDto } from "../../dto/invoice.dto";
import InvoiceExportToolbar from "./InvoiceExportToolbar";

interface Props {
  invoice: ArInvoiceDto;
}

export default function InvoiceDetailLines({ invoice }: Props) {
  const currencySymbol = invoice.currency?.symbol || invoice.currency?.code || "VND";
  const currencyCode   = invoice.currency?.code || "VND";
  const exchangeRate   = Number(invoice.exchange_rate || 1);

  const fmtMoney = (v: number | null | undefined) =>
    `${Number(v || 0).toLocaleString("vi-VN", { maximumFractionDigits: 2 })} ${currencySymbol}`;

  return (
    <div>
      <InvoiceExportToolbar invoice={invoice} />

      <div className="grid grid-cols-3 gap-6">
        {/* Lines table */}
        <div className="col-span-2 bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
          <div className="p-5 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
            <h2 className="text-base font-semibold text-gray-900 flex items-center gap-2">
              <div className="w-1 h-5 bg-green-600 rounded" />
              Dòng hóa đơn
              <span className="ml-1 text-xs font-medium px-2 py-0.5 rounded-full bg-green-50 text-green-700">
                {invoice.lines?.length ?? 0} sản phẩm
              </span>
            </h2>
            {currencyCode !== "VND" && (
              <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                Tiền tệ: <span className="font-semibold text-gray-700">{currencyCode} ({currencySymbol})</span>
              </span>
            )}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Sản phẩm</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">ĐVT</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">SL</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Đơn giá ({currencyCode})</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">Thuế</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Thành tiền ({currencyCode})</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {!invoice.lines?.length ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-sm text-gray-400">Không có dòng sản phẩm.</td>
                  </tr>
                ) : invoice.lines.map((line, idx) => {
                  const uomCode = (line.product as any)?.uom?.code || "—";
                  const qty = Number(line.quantity ?? 0);
                  return (
                    <tr key={line.id || idx} className="hover:bg-orange-50/30 transition-colors">
                      {/* Sản phẩm */}
                      <td className="px-4 py-4">
                        <p className="text-sm font-semibold text-gray-800">{line.product?.name || "—"}</p>
                        {line.product?.sku && (
                          <p className="text-xs text-gray-400 mt-0.5">SKU: {line.product.sku as any}</p>
                        )}
                        {line.description && (
                          <p className="text-xs text-gray-500 mt-0.5 italic">{line.description}</p>
                        )}
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
                          {Number.isInteger(qty) ? qty : qty.toFixed(3)}
                        </span>
                      </td>
                      {/* Đơn giá */}
                      <td className="px-4 py-4 text-right text-sm font-medium text-gray-800">
                        {fmtMoney(line.unit_price)}
                        {currencyCode !== "VND" && (
                          <p className="text-[10px] text-gray-400 mt-0.5">
                            ≈ {formatVND(Number(line.unit_price || 0) * exchangeRate)}
                          </p>
                        )}
                      </td>
                      {/* Thuế */}
                      <td className="px-4 py-4 text-center">
                        {line.taxRate ? (
                          <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-600">
                            {line.taxRate.rate}%
                          </span>
                        ) : (
                          <span className="text-xs text-gray-400">—</span>
                        )}
                      </td>
                      {/* Thành tiền */}
                      <td className="px-4 py-4 text-right">
                        <p className="text-sm font-semibold text-gray-900">{fmtMoney(line.line_total_after_tax)}</p>
                        {Number(line.line_tax) > 0 && (
                          <p className="text-[10px] text-gray-400 mt-0.5">Thuế: {fmtMoney(line.line_tax)}</p>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Tóm tắt */}
        <div className="col-span-1">
          <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm sticky top-6">
            <h3 className="text-base font-semibold text-gray-900 mb-5 flex items-center gap-2">
              <div className="w-1 h-5 bg-indigo-600 rounded" />
              Tóm tắt hóa đơn
            </h3>

            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Tạm tính</span>
                <span className="font-medium text-gray-800">{fmtMoney(invoice.total_before_tax)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Thuế VAT</span>
                <span className="font-medium text-gray-800">{fmtMoney(invoice.total_tax)}</span>
              </div>
              <div className="pt-3 border-t border-gray-200">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-semibold text-gray-900">Tổng cộng</span>
                  <span className="text-lg font-bold text-orange-600">{fmtMoney(invoice.total_after_tax)}</span>
                </div>
                {currencyCode !== "VND" && (
                  <p className="text-xs text-gray-400 text-right mt-1">
                    ≈ {formatVND(Number(invoice.total_after_tax || 0) * exchangeRate)}
                  </p>
                )}
              </div>

              {typeof invoice.paid_amount === "number" && invoice.paid_amount > 0 && (
                <>
                  <div className="flex justify-between text-sm pt-2">
                    <span className="text-gray-500">Đã thanh toán</span>
                    <span className="font-medium text-emerald-600">{fmtMoney(invoice.paid_amount)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Còn lại</span>
                    <span className="font-semibold text-red-500">
                      {fmtMoney(Number(invoice.total_after_tax || 0) - Number(invoice.paid_amount || 0))}
                    </span>
                  </div>
                </>
              )}
            </div>

            <div className="mt-6 pt-4 border-t border-gray-200 space-y-2">
              <div>
                <p className="text-xs text-gray-500 uppercase font-semibold">Số hóa đơn</p>
                <p className="text-sm text-gray-900 font-mono">{invoice.invoice_no}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase font-semibold">Ngày hóa đơn</p>
                <p className="text-sm text-gray-900">
                  {new Date(invoice.invoice_date).toLocaleDateString("vi-VN")}
                </p>
              </div>
              {invoice.due_date && (
                <div>
                  <p className="text-xs text-gray-500 uppercase font-semibold">Ngày đáo hạn</p>
                  <p className="text-sm text-gray-900">{new Date(invoice.due_date).toLocaleDateString("vi-VN")}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
