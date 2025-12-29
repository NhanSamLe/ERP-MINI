
interface Props {
  search: string;
  status: string;
  onSearchChange: (v: string) => void;
  onStatusChange: (v: string) => void;
}

export default function SaleOrderFilters({
  search,
  status,
  onSearchChange,
  onStatusChange
}: Props) {
  return (
    <div className="p-6 border-b bg-gray-50 space-y-4">
      <div className="flex gap-4 flex-wrap items-end">
        <div className="flex-1 min-w-64">
          <label className="block text-sm font-medium">Search</label>
          <input
            value={search}
            placeholder="Search by Order # or Customer..."
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full px-4 py-2 border rounded-lg"
          />
        </div>

        <div className="min-w-48">
          <label className="block text-sm font-medium">Status</label>
          <select
            value={status}
            onChange={(e) => onStatusChange(e.target.value)}
            className="w-full px-4 py-2 border rounded-lg"
          >
            <option value="">All Status</option>
            <option value="draft">Draft</option>
            <option value="waiting_approval">Waiting Approval</option>
            <option value="approved">Approved</option>
            <option value="confirmed">Confirmed</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
      </div>
    </div>
  );
}