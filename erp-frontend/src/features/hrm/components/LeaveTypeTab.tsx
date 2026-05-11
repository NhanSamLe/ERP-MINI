import { useState } from "react";
import { createLeaveType } from "../service/leave.service";
import { LeaveTypeDTO } from "../dto/leave.dto";

interface Props {
  types: LeaveTypeDTO[];
  reload: () => void;
}

export default function LeaveTypeTab({
  types,
  reload,
}: Props) {
  const [name, setName] = useState("");

  const submit = async () => {
    if (!name.trim()) {
      alert("Nhập tên loại phép");
      return;
    }

    try {
      await createLeaveType({
        name,
        is_paid: true,
        carry_forward: false,
      });

      setName("");
      reload();
    } catch (err) {
      console.error(err);
      alert("Không thể tạo loại phép");
    }
  };

  return (
    <div>
      <div className="flex gap-2 mb-4">
        <input
          className="border p-2 rounded flex-1"
          placeholder="Tên loại phép"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />

        <button
          className="bg-orange-600 text-white px-4 rounded hover:bg-orange-700"
          onClick={submit}
        >
          Thêm
        </button>
      </div>

      <table className="w-full border rounded-xl overflow-hidden bg-white">
        <thead className="bg-gray-50">
          <tr>
            <th className="p-3 text-left">Tên loại phép</th>
            <th className="p-3 text-center">Có lương</th>
            <th className="p-3 text-center">Chuyển năm</th>
            <th className="p-3 text-center">Max ngày</th>
          </tr>
        </thead>

        <tbody>
          {types.length === 0 ? (
            <tr>
              <td colSpan={4} className="text-center py-6 text-gray-500">
                Chưa có loại phép
              </td>
            </tr>
          ) : (
            types.map((t) => (
              <tr key={t.id} className="border-t hover:bg-gray-50">
                <td className="p-3">{t.name}</td>
                <td className="p-3 text-center">
                  {t.is_paid ? "Có" : "Không"}
                </td>
                <td className="p-3 text-center">
                  {t.carry_forward ? "Có" : "Không"}
                </td>
                <td className="p-3 text-center">
                  {t.max_days || "-"}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}