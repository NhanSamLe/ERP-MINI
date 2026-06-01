interface Props {
  search: string;
  status: string;
  onSearchChange: (v: string) => void;
  onStatusChange: (v: string) => void;
}

export default function FilterPanel({
  search,
  status,
  onSearchChange,
  onStatusChange
}: Props) {
  return (
    <div className="p-6 border-b bg-gray-50 space-y-4">
      <div className="flex gap-4 flex-wrap items-end">
        <div className="flex-1 min-w-64">
          <label className="block text-sm font-medium">Tìm kiếm</label>
          <input
            value={search}
            placeholder="Số hóa đơn, khách hàng..."
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full px-4 py-2 border rounded-lg"
          />
        </div>

        <div className="min-w-48">
          <label className="block text-sm font-medium">Trạng thái</label>
          <select
            value={status}
            onChange={(e) => onStatusChange(e.target.value)}
            className="w-full px-4 py-2 border rounded-lg"
          >
            <option value="all">Tất cả</option>
            <option value="draft">Nháp</option>
            <option value="posted">Đã phát hành</option>
            <option value="paid">Đã thanh toán</option>
            <option value="cancelled">Đã huỷ</option>
          </select>
        </div>
      </div>
    </div>
  );
}
