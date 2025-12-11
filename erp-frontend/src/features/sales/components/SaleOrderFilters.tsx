
import { Search, RotateCcw } from "lucide-react";

interface Props {
  search: string;
  onSearchChange: (v: string) => void;

  status: string;
  onStatusChange: (v: string) => void;

  customer: string;
  onCustomerChange: (v: string) => void;

  customers?: Array<{ id: number; name: string }>;
  onRefresh: () => void;
}

export default function SaleOrderFilters({
  search,
  onSearchChange,
  status,
  onStatusChange,
  customer,
  onCustomerChange,
  customers = [],
  onRefresh,
}: Props) {
  // ✅ Handle reset all filters
  const handleReset = () => {
    onSearchChange("");
    onStatusChange("");
    onCustomerChange("");
    onRefresh();
  };

  return (
    <div className="bg-white rounded-lg border p-4 mb-6">
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        {/* SEARCH */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Search
          </label>
          <div className="relative">
            <Search
              size={18}
              className="absolute left-3 top-2.5 text-gray-400 pointer-events-none"
            />
            <input
              type="text"
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Order # or Customer..."
              className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>
        </div>

        {/* STATUS */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Status
          </label>
          <select
            value={status}
            onChange={(e) => onStatusChange(e.target.value)}
            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
          >
            <option value="">All Status</option>
            <option value="draft">Draft</option>
            <option value="waiting_approval">Waiting Approval</option>
            <option value="approved">Approved</option>
            <option value="confirmed">Confirmed</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>

        {/* CUSTOMER */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Customer
          </label>
          <select
            value={customer}
            onChange={(e) => onCustomerChange(e.target.value)}
            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
          >
            <option value="">All Customers</option>
            {customers.map((c) => (
              <option key={c.id} value={c.id.toString()}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        {/* REFRESH */}
        <div className="flex items-end">
          <button
            onClick={onRefresh}
            className="w-full px-4 py-2 border rounded-lg hover:bg-gray-100 transition flex items-center justify-center gap-2"
            title="Refresh"
          >
            <RotateCcw size={18} />
            Refresh
          </button>
        </div>

        {/* RESET */}
        <div className="flex items-end">
          <button
            onClick={handleReset}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition flex items-center justify-center gap-2 text-gray-600"
            title="Reset Filters"
          >
            <RotateCcw size={18} />
            Reset
          </button>
        </div>
      </div>
    </div>
  );
}