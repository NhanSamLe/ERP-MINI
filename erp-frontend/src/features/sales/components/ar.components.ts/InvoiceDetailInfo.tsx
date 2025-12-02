import React from "react";
import { ArInvoiceDto } from "../../dto/invoice.dto";

interface Props {
  invoice: ArInvoiceDto;
}

export default function InvoiceDetailInfo({ invoice }: Props) {
  const formatDate = (dateStr?: string) => {
    if (!dateStr) return "—";
    return new Date(dateStr).toLocaleDateString("vi-VN");
  };

  return (
    <div className="grid grid-cols-3 gap-6 mb-6">
      {/* Branch & Order Info */}
      <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <div className="w-1 h-6 bg-blue-600 rounded"></div>
          Branch & Order
        </h3>
        <div className="space-y-3">
          <div>
            <p className="text-xs text-gray-500 uppercase font-semibold">Branch</p>
            <p className="text-sm text-gray-900 font-medium">
              {invoice.branch?.name || "—"}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase font-semibold">Order No</p>
            <p className="text-sm text-gray-900 font-medium">
              {invoice.order?.order_no || "—"}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase font-semibold">
              Order Date
            </p>
            <p className="text-sm text-gray-900 font-medium">
              {formatDate(invoice.order?.order_date)}
            </p>
          </div>
        </div>
      </div>

      {/* Customer Info */}
      <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <div className="w-1 h-6 bg-purple-600 rounded"></div>
          Customer
        </h3>
        <div className="space-y-3">
          <div>
            <p className="text-xs text-gray-500 uppercase font-semibold">Name</p>
            <p className="text-sm text-gray-900 font-medium">
              {invoice.order?.customer?.name || "—"}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase font-semibold">Phone</p>
            <p className="text-sm text-gray-900 font-medium">
              {invoice.order?.customer?.phone || "—"}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase font-semibold">Email</p>
            <p className="text-sm text-gray-900 font-medium text-blue-600">
              {invoice.order?.customer?.email || "—"}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase font-semibold">Tax Code</p>
            <p className="text-sm text-gray-900 font-medium">
              {invoice.order?.customer?.tax_code || "—"}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase font-semibold">Address</p>
            <p className="text-sm text-gray-900 font-medium">
              {invoice.order?.customer?.address || "—"}
            </p>
          </div>
        </div>
      </div>

      {/* Staff Timeline */}
      <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <div className="w-1 h-6 bg-orange-600 rounded"></div>
          Staff
        </h3>
        <div className="space-y-4">
          <div>
            <p className="text-xs text-gray-500 uppercase font-semibold">Created By</p>
            <p className="text-sm text-gray-900 font-medium">
              {invoice.creator?.full_name || invoice.creator?.username || "—"}
            </p>
            <p className="text-xs text-gray-400 mt-1">
              {invoice.creator?.username || ""}
            </p>
          </div>
          {invoice.approver && (
            <div className="pt-3 border-t border-gray-200">
              <p className="text-xs text-gray-500 uppercase font-semibold">
                Approved By
              </p>
              <p className="text-sm text-gray-900 font-medium">
                {invoice.approver.full_name || invoice.approver.username || "—"}
              </p>
              <p className="text-xs text-gray-400 mt-1">
                {invoice.approver.username || ""}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}