import React from "react";
import { ArInvoiceDto } from "../../dto/invoice.dto";
import InvoiceExportToolbar from "./InvoiceExportToolbar";

interface Props {
  invoice: ArInvoiceDto;
}

export default function InvoiceDetailLines({ invoice }: Props) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div>
      {/* Export Toolbar */}
      <InvoiceExportToolbar invoice={invoice} />

      {/* Main Content */}
      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2 bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
          <div className="p-6 border-b border-gray-200 bg-gray-50">
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <div className="w-1 h-6 bg-green-600 rounded"></div>
              Invoice Items
            </h2>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="px-6 py-4 text-left text-gray-700 font-semibold">
                    Product
                  </th>
                  <th className="px-6 py-4 text-center text-gray-700 font-semibold">
                    Qty
                  </th>
                  <th className="px-6 py-4 text-right text-gray-700 font-semibold">
                    Unit Price
                  </th>
                  <th className="px-6 py-4 text-center text-gray-700 font-semibold">
                    Tax
                  </th>
                  <th className="px-6 py-4 text-right text-gray-700 font-semibold">
                    Total
                  </th>
                </tr>
              </thead>
              <tbody>
                {invoice.lines?.map((line, idx) => (
                  <tr key={line.id || idx} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div>
                        <p className="text-gray-900 font-medium">
                          {line.product?.name || "—"}
                        </p>
                        {line.description && (
                          <p className="text-xs text-gray-500 mt-1">
                            {line.description}
                          </p>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center text-gray-900">
                      {Number(line.quantity)}{line.product?.uom}
                    </td>
                    <td className="px-6 py-4 text-right text-gray-900">
                      {formatCurrency(line.unit_price)}
                    </td>
                    <td className="px-6 py-4 text-center">
                      {line.taxRate ? (
                        <span className="text-gray-900">
                          {line.taxRate.rate}% ({line.taxRate.name})
                        </span>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="text-gray-900 font-semibold">
                        {formatCurrency(line.line_total_after_tax || 0)}
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        Before tax: {formatCurrency(line.line_total || 0)}
                      </p>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Summary */}
        <div className="col-span-1">
          <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm sticky top-6">
            <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
              <div className="w-1 h-6 bg-indigo-600 rounded"></div>
              Invoice Summary
            </h3>

            <div className="space-y-4">
              {/* Total Before Tax */}
              <div className="flex justify-between items-center pb-4 border-b border-gray-200">
                <span className="text-sm text-gray-600">Total Before Tax</span>
                <span className="text-sm font-semibold text-gray-900">
                  {formatCurrency(invoice.total_before_tax)}
                </span>
              </div>

              {/* Total Tax */}
              <div className="flex justify-between items-center pb-4 border-b border-gray-200">
                <span className="text-sm text-gray-600">Total Tax</span>
                <span className="text-sm font-semibold text-gray-900">
                  {formatCurrency(invoice.total_tax)}
                </span>
              </div>

              {/* Total After Tax */}
              <div className="flex justify-between items-center pt-2 pb-4">
                <span className="text-base font-bold text-gray-900">Total After Tax</span>
                <span className="text-xl font-bold text-indigo-600">
                  {formatCurrency(invoice.total_after_tax)}
                </span>
              </div>
            </div>

            {/* Invoice Details */}
            <div className="mt-8 pt-6 border-t border-gray-200 space-y-3">
              <div>
                <p className="text-xs text-gray-500 uppercase font-semibold">
                  Invoice Number
                </p>
                <p className="text-sm text-gray-900 font-mono">
                  {invoice.invoice_no}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase font-semibold">
                  Invoice Date
                </p>
                <p className="text-sm text-gray-900">
                  {new Date(invoice.invoice_date).toLocaleDateString("vi-VN")}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}