import { useEffect, useState } from "react";
import {
  fetchLeaveRequests,
  fetchLeaveTypes,
  fetchLeaveAllocations,
  createLeaveRequest,
  approveLeaveRequest,
  rejectLeaveRequest,
} from "../service/leave.service";

import LeaveRequestFormModal from "../components/LeaveRequestFormModal";
import LeaveTypeTab from "../components/LeaveTypeTab";
import LeaveAllocationTab from "../components/LeaveAllocationTab";

import {
  LeaveRequestDTO,
  LeaveTypeDTO,
  LeaveAllocationDTO
} from "../dto/leave.dto";
import { Plus } from "lucide-react";

type Tab = "requests" | "types" | "allocations";

export default function LeavePage() {
  const [tab, setTab] = useState<Tab>("requests");

  const [requests, setRequests] = useState<LeaveRequestDTO[]>([]);
  const [types, setTypes] = useState<LeaveTypeDTO[]>([]);
  const [allocations, setAllocations] = useState<LeaveAllocationDTO[]>([]);
  const [open, setOpen] = useState(false);

  const load = async () => {
    const [reqs, leaveTypes, leaveAllocations] = await Promise.all([
      fetchLeaveRequests(),
      fetchLeaveTypes(),
      fetchLeaveAllocations(),
    ]);

    setRequests(reqs);
    setTypes(leaveTypes);
    setAllocations(leaveAllocations);
  };

  useEffect(() => {
    load();
  }, []);

  const handleCreate = async (data: any) => {
    await createLeaveRequest(data);
    setOpen(false);
    load();
  };

  const handleApprove = async (id: number) => {
    await approveLeaveRequest(id);
    load();
  };

  const handleReject = async (id: number) => {
    await rejectLeaveRequest(id);
    load();
  };

  const statusColor: Record<
  LeaveRequestDTO["status"],
  string
> = {
  draft: "bg-blue-100 text-blue-700",
  pending: "bg-yellow-100 text-yellow-700",
  approved: "bg-green-100 text-green-700",
  rejected: "bg-red-100 text-red-700",
  cancelled: "bg-gray-100 text-gray-700",
};

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <div className="flex justify-between mb-6">
        <h1 className="text-3xl font-bold">Quản lý nghỉ phép</h1>

        {tab === "requests" && (
          <button
            className="bg-orange-600 text-white px-4 py-2 rounded-lg flex gap-2"
            onClick={() => setOpen(true)}
          >
            <Plus size={18} />
            Tạo đơn
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-3 mb-6">
        <button onClick={() => setTab("requests")}>Đơn nghỉ</button>
        <button onClick={() => setTab("types")}>Loại phép</button>
        <button onClick={() => setTab("allocations")}>Cấp phép</button>
      </div>

      {tab === "requests" && (
        <table className="w-full bg-white border rounded-xl">
          <thead>
            <tr className="bg-gray-50">
              <th className="p-3">Nhân viên</th>
              <th>Loại phép</th>
              <th>Từ ngày</th>
              <th>Đến ngày</th>
              <th>Số ngày</th>
              <th>Trạng thái</th>
              <th>Thao tác</th>
            </tr>
          </thead>

          <tbody>
            {requests.map((r) => (
              <tr key={r.id} className="border-t">
                <td className="p-3">{r.employee?.full_name}</td>
                <td>{r.leaveType?.name}</td>
                <td>{r.from_date}</td>
                <td>{r.to_date}</td>
                <td>{r.total_days}</td>

                <td>
                  <span
                    className={`px-2 py-1 rounded text-sm ${
                      statusColor[r.status]
                    }`}
                  >
                    {r.status}
                  </span>
                </td>

                <td className="flex gap-2">
                  {r.status === "pending" && (
                    <>
                      <button
                        className="text-green-600"
                        onClick={() => handleApprove(r.id)}
                      >
                        Duyệt
                      </button>

                      <button
                        className="text-red-600"
                        onClick={() => handleReject(r.id)}
                      >
                        Từ chối
                      </button>
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {tab === "types" && <LeaveTypeTab types={types} reload={load} />}

      {tab === "allocations" && (
  <LeaveAllocationTab allocations={allocations} />
)}

      <LeaveRequestFormModal
        open={open}
        leaveTypes={types}
        onClose={() => setOpen(false)}
        onSubmit={handleCreate}
      />
    </div>
  );
}