import { useEffect, useState } from "react";
import axiosClient from "../../../api/axiosClient";
import { EmployeeDTO } from "../dto/employee.dto";

interface Props {
  employeeId?: number | null;
}

export default function MyEmployeeProfilePage({ employeeId }: Props) {
  const [employee, setEmployee] = useState<EmployeeDTO | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!employeeId) return;

    const load = async () => {
      try {
        setLoading(true);
        const res = await axiosClient.get<EmployeeDTO>(`/hrm/employees/${employeeId}`);
        setEmployee(res.data);
      } catch (err) {
        console.error("Failed to load my employee profile", err);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [employeeId]);

  if (!employeeId) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-6">
        <p className="text-red-600">
          Tài khoản của bạn chưa được gắn với hồ sơ nhân viên (employee_id).
        </p>
      </div>
    );
  }

  if (loading || !employee) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-6">
        <p className="text-gray-500">Đang tải hồ sơ nhân viên...</p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold mb-4">Hồ sơ nhân viên của tôi</h1>

      <div className="bg-white border rounded-xl shadow-sm p-6 space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <div className="text-xs text-gray-500">Mã nhân viên</div>
            <div className="font-semibold">{employee.emp_code}</div>
          </div>

          <div>
            <div className="text-xs text-gray-500">Họ tên</div>
            <div className="font-semibold">{employee.full_name}</div>
          </div>

          <div>
            <div className="text-xs text-gray-500">Giới tính</div>
            <div>{employee.gender}</div>
          </div>

          <div>
            <div className="text-xs text-gray-500">Chi nhánh</div>
            <div>{(employee as any).branch?.name || "-"}</div>
          </div>

          <div>
            <div className="text-xs text-gray-500">Phòng ban</div>
            <div>{(employee as any).department?.name || "-"}</div>
          </div>

          <div>
            <div className="text-xs text-gray-500">Chức danh</div>
            <div>{(employee as any).position?.name || "-"}</div>
          </div>

          <div>
            <div className="text-xs text-gray-500">Loại HĐ</div>
            <div>{employee.contract_type}</div>
          </div>

          <div>
            <div className="text-xs text-gray-500">Trạng thái</div>
            <div>{employee.status === "active" ? "Đang làm" : "Ngưng"}</div>
          </div>

          <div>
            <div className="text-xs text-gray-500">STK ngân hàng</div>
            <div>{employee.bank_account || "-"}</div>
          </div>

          <div>
            <div className="text-xs text-gray-500">Ngân hàng</div>
            <div>{employee.bank_name || "-"}</div>
          </div>
        </div>

        {/* nếu muốn hiển thị thêm birth_date, hire_date, cccd... thì thêm block ở đây */}
      </div>
    </div>
  );
}
