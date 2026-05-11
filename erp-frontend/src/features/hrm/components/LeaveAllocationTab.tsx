import { LeaveAllocationDTO } from "../dto/leave.dto";

interface Props {
  allocations: LeaveAllocationDTO[];
}

export default function LeaveAllocationTab({
  allocations,
}: Props) {
  return (
    <table className="w-full border rounded-xl overflow-hidden bg-white">
      <thead className="bg-gray-50">
        <tr>
          <th className="p-3 text-left">Nhân viên</th>
          <th className="p-3 text-left">Loại phép</th>
          <th className="p-3 text-center">Tổng ngày</th>
          <th className="p-3 text-center">Đã dùng</th>
          <th className="p-3 text-center">Còn lại</th>
        </tr>
      </thead>

      <tbody>
        {allocations.length === 0 ? (
          <tr>
            <td colSpan={5} className="text-center py-6 text-gray-500">
              Không có dữ liệu
            </td>
          </tr>
        ) : (
          allocations.map((a) => (
            <tr key={a.id} className="border-t hover:bg-gray-50">
              <td className="p-3">{a.employee?.full_name || "-"}</td>
              <td className="p-3">{a.leaveType?.name || "-"}</td>
              <td className="p-3 text-center">{a.total_days}</td>
              <td className="p-3 text-center">{a.used_days}</td>
              <td className="p-3 text-center font-semibold text-green-600">
                {a.total_days - a.used_days}
              </td>
            </tr>
          ))
        )}
      </tbody>
    </table>
  );
}