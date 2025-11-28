import { useLocation, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { createUser, fetchRoles } from "../service/user.service";

interface RoleDTO {
  id: number;
  code: string;
  name: string;
}


interface UserFormPayload {
  username: string;
  password: string;
  full_name: string;
  email: string;
  phone: string;
  branch_id: number;
  employee_id: number;
  role_id: number;
}


export default function UserFormPage() {
  const nav = useNavigate();
  const location = useLocation() as {
    state?: { employeeId?: number; branchId?: number; fullName?: string };
  };

  const [roles, setRoles] = useState<RoleDTO[]>([]);
  const [form, setForm] = useState<UserFormPayload>({
  username: "",
  password: "",
  full_name: "",
  email: "",
  phone: "",
  branch_id: 0,
  employee_id: 0,
  role_id: 0,
});



  // load roles cho combobox
  useEffect(() => {
    (async () => {
      try {
        const rs = await fetchRoles();
        setRoles(rs);
      } catch (err) {
        console.error(err);
      }
    })();
  }, []);

  // nhận dữ liệu từ EmployeePage
  useEffect(() => {
    setForm((prev) => ({
      ...prev,
      employee_id: location.state?.employeeId ?? prev.employee_id,
      branch_id: location.state?.branchId ?? prev.branch_id,
      full_name: location.state?.fullName ?? prev.full_name,
      username: location.state?.fullName
        ? location.state.fullName.replace(/\s+/g, "").toLowerCase()
        : prev.username,
    }));
  }, [location.state]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]:
        name === "branch_id" || name === "employee_id" || name === "role_id"
          ? Number(value)
          : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();

  try {
    await createUser(form);
    alert("✅ Tạo tài khoản người dùng thành công!");
    nav(-1); // quay lại EmployeePage
  } catch (err: any) {
    console.error(err);
    alert(err?.response?.data?.message || "❌ Tạo tài khoản thất bại");
  }
};


  return (
    <div className="max-w-xl mx-auto bg-white border rounded-xl p-6 space-y-4">
      <h1 className="text-xl font-bold mb-2">Tạo tài khoản người dùng</h1>
      <p className="text-sm text-gray-500 mb-4">
        Tài khoản sẽ gắn với nhân viên và chi nhánh vừa tạo.
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Employee & Branch (readonly) */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium">Employee ID</label>
            <input
              className="mt-1 w-full border rounded px-3 py-2 text-sm bg-gray-100 cursor-not-allowed"
              value={form.employee_id}
              readOnly
            />
          </div>
          <div>
            <label className="text-sm font-medium">Branch ID</label>
            <input
              className="mt-1 w-full border rounded px-3 py-2 text-sm bg-gray-100 cursor-not-allowed"
              value={form.branch_id}
              readOnly
            />
          </div>
        </div>

        <div>
          <label className="text-sm font-medium">Họ tên</label>
          <input
            name="full_name"
            className="mt-1 w-full border rounded px-3 py-2 text-sm"
            value={form.full_name}
            onChange={handleChange}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium">Username</label>
            <input
              name="username"
              className="mt-1 w-full border rounded px-3 py-2 text-sm"
              value={form.username}
              onChange={handleChange}
              required
            />
          </div>

          <div>
            <label className="text-sm font-medium">Password</label>
            <input
              type="password"
              name="password"
              className="mt-1 w-full border rounded px-3 py-2 text-sm"
              value={form.password}
              onChange={handleChange}
              required
            />
          </div>
        </div>

        <div>
          <label className="text-sm font-medium">Role</label>
          <select
            name="role_id"
            className="mt-1 w-full border rounded px-3 py-2 text-sm"
            value={form.role_id || ""}
            onChange={handleChange}
            required
          >
            <option value="">-- Chọn role --</option>
            {roles.map((r) => (
              <option key={r.id} value={r.id}>
                {r.code} - {r.name}
              </option>
            ))}
          </select>
        </div>
        <div className="grid grid-cols-2 gap-4">
  <div>
    <label className="text-sm font-medium">Email</label>
    <input
      name="email"
      type="email"
      className="mt-1 w-full border rounded px-3 py-2 text-sm"
      value={form.email}
      onChange={handleChange}
      required
    />
  </div>

  <div>
    <label className="text-sm font-medium">SĐT</label>
    <input
      name="phone"
      className="mt-1 w-full border rounded px-3 py-2 text-sm"
      value={form.phone}
      onChange={handleChange}
      required
    />
  </div>
</div>


        <div className="flex justify-end gap-2 pt-4 border-t">
          <button
            type="button"
            onClick={() => nav(-1)}
            className="px-4 py-2 text-sm border rounded"
          >
            Hủy
          </button>
          <button
            type="submit"
            className="px-4 py-2 text-sm bg-orange-600 text-white rounded"
          >
            Tạo user
          </button>
        </div>
      </form>
    </div>
  );
}
