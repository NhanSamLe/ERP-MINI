import React from "react";
import { Partner } from "@/features/partner/store/partner.types";

interface Props {
  customers: Partner[];
  customerId: number | "";
  orderDate: string;

  onCustomerChange: (v: number) => void;
  onDateChange: (v: string) => void;
}

export default function SaleOrderGeneralForm({
  customers,
  customerId,
  orderDate,
  onCustomerChange,
  onDateChange,
}: Props) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-6 bg-white p-5 border rounded-lg">
      {/* CUSTOMER */}
      <div>
        <label className="text-sm font-medium block mb-1">Customer</label>
        <select
          value={customerId}
          onChange={(e) => onCustomerChange(Number(e.target.value))}
          className="w-full border rounded-lg px-3 py-2"
        >
          <option value="">Select customer…</option>
          {customers.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      {/* ORDER DATE */}
      <div>
        <label className="text-sm font-medium block mb-1">Order Date</label>
        <input
          type="date"
           value={orderDate?.split("T")[0] ?? ""}
          onChange={(e) => onDateChange(e.target.value)}
          className="w-full border rounded-lg px-3 py-2"
        />
      </div>
    </div>
  );
}
