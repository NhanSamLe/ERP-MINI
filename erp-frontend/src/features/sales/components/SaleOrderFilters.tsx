import React from "react";

interface Props {
  search: string;
  onSearchChange: (v: string) => void;

  status: string;
  onStatusChange: (v: string) => void;

  customer: string;
  onCustomerChange: (v: string) => void;

  onRefresh: () => void;
}

export default function SaleOrderFilters({
  search,
  onSearchChange,
  status,
  onStatusChange,
  customer,
  onCustomerChange,
  onRefresh,
}: Props) {
  return (
    <div className="flex items-center gap-3 mb-5">

      {/* Search */}
      <input
        type="text"
        value={search}
        onChange={(e) => onSearchChange(e.target.value)}
        placeholder="Search sale orders..."
        className="px-3 py-2 border rounded-lg w-64"
      />

      {/* Status */}
      <select
        value={status}
        onChange={(e) => onStatusChange(e.target.value)}
        className="px-3 py-2 border rounded-lg"
      >
        <option value="">All Status</option>
        <option value="draft">Draft</option>
        <option value="waiting_approval">Waiting Approval</option>
        <option value="approved">Approved</option>
        <option value="confirmed">Confirmed</option>
        <option value="rejected">Rejected</option>
      </select>

      {/* Customer */}
      <select
        value={customer}
        onChange={(e) => onCustomerChange(e.target.value)}
        className="px-3 py-2 border rounded-lg"
      >
        <option value="">All Customers</option>
        {/* TODO: Map customer list */}
      </select>

      {/* Refresh */}
      <button
        className="px-3 py-2 border rounded-lg hover:bg-gray-100"
        onClick={onRefresh}
      >
        ↻
      </button>
    </div>
  );
}
