import React from "react";
import { ArInvoiceDto } from "../../dto/invoice.dto";
import { User } from "@/types/User";
import InvoiceDetailBreadcrumb from "./InvoiceDetailBreadcrumb";
import InvoiceStatusCards from "./InvoiceStatusCards";
import InvoiceActionButtons from "./InvoiceActionButtons";

interface Props {
  invoice: ArInvoiceDto;
  user: User;
  onSubmit: () => void;
  onApprove: () => void;
  onReject: () => void;
}

export default function InvoiceDetailHeader({
  invoice,
  user,
  onSubmit,
  onApprove,
  onReject,
}: Props) {
  return (
    <div className="mb-8">
      <InvoiceDetailBreadcrumb invoiceNo={invoice.invoice_no} />

      <div className="flex justify-between items-start mb-6">
        <div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            {invoice.invoice_no}
          </h1>
          <p className="text-gray-500">
            Invoice ID: <span className="text-gray-700 font-mono">#{invoice.id}</span>
          </p>
        </div>
        <InvoiceActionButtons
          invoice={invoice}
          user={user}
          onSubmit={onSubmit}
          onApprove={onApprove}
          onReject={onReject}
        />
      </div>

      <InvoiceStatusCards invoice={invoice} />
    </div>
  );
}