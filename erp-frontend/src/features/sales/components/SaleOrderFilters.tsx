import { Search, SlidersHorizontal } from "lucide-react";

interface Props {
  search: string;
  status: string;
  onSearchChange: (v: string) => void;
  onStatusChange: (v: string) => void;
}

const statusOptions = [
  { value: "",                 label: "All Status" },
  { value: "draft",            label: "Draft" },
  { value: "waiting_approval", label: "Waiting Approval" },
  { value: "approved",         label: "Approved" },
  { value: "confirmed",        label: "Confirmed" },
  { value: "rejected",         label: "Rejected" },
];

export default function SaleOrderFilters({ search, status, onSearchChange, onStatusChange }: Props) {
  return (
    <div className="flex items-center gap-3 flex-wrap">
      {/* Search */}
      <div className="relative flex-1 min-w-[200px] max-w-xs">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
        <input
          value={search}
          placeholder="Search order # or customer..."
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full h-8 pl-8 pr-3 text-sm border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 placeholder:text-gray-400"
        />
      </div>

      {/* Status filter */}
      <div className="relative">
        <SlidersHorizontal className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
        <select
          value={status}
          onChange={(e) => onStatusChange(e.target.value)}
          className="h-8 pl-8 pr-8 text-sm border border-gray-300 rounded-md bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 appearance-none cursor-pointer"
        >
          {statusOptions.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      </div>
    </div>
  );
}
