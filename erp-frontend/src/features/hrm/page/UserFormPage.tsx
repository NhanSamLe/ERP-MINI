import { useLocation, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { createUser, fetchRoles } from "../service/user.service";
import { toast } from "react-toastify";
import { User, Lock, Mail, Phone, Shield, Building, IdCard, ArrowLeft } from "lucide-react";

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
  const [loading, setLoading] = useState(false);
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

  useEffect(() => {
    (async () => {
      try {
        const rs = await fetchRoles();
        setRoles(rs);
      } catch (err) {
        console.error(err);
        toast.error("Không thể tải danh sách vai trò");
      }
    })();
  }, []);

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
    setLoading(true);

    try {
      await createUser(form);
      toast.success("Tạo tài khoản người dùng thành công! 🎉");
      nav(-1);
    } catch (err: any) {
      console.error(err);
      toast.error(err?.response?.data?.message || "Tạo tài khoản thất bại");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => nav(-1)}
            className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 mb-4 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm font-medium">Quay lại</span>
          </button>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 rounded-xl bg-orange-100 flex items-center justify-center">
                <User className="w-6 h-6 text-orange-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  Tạo tài khoản người dùng
                </h1>
                <p className="text-sm text-gray-500 mt-1">
                  Tài khoản sẽ được gắn với nhân viên và chi nhánh đã chọn
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Employee & Branch Info */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Building className="w-5 h-5 mr-2 text-gray-400" />
              Thông tin liên kết
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <IdCard className="w-4 h-4 inline mr-1 text-gray-400" />
                  Mã nhân viên
                </label>
                <input
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg bg-gray-50 text-gray-600 cursor-not-allowed focus:outline-none"
                  value={form.employee_id}
                  readOnly
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Building className="w-4 h-4 inline mr-1 text-gray-400" />
                  Mã chi nhánh
                </label>
                <input
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg bg-gray-50 text-gray-600 cursor-not-allowed focus:outline-none"
                  value={form.branch_id}
                  readOnly
                />
              </div>
            </div>
          </div>

          {/* Personal Info */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <User className="w-5 h-5 mr-2 text-gray-400" />
              Thông tin cá nhân
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Họ và tên <span className="text-red-500">*</span>
                </label>
                <input
                  name="full_name"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
                  value={form.full_name}
                  onChange={handleChange}
                  placeholder="Nhập họ và tên"
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Mail className="w-4 h-4 inline mr-1 text-gray-400" />
                    Email <span className="text-red-500">*</span>
                  </label>
                  <input
                    name="email"
                    type="email"
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
                    value={form.email}
                    onChange={handleChange}
                    placeholder="example@company.com"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Phone className="w-4 h-4 inline mr-1 text-gray-400" />
                    Số điện thoại <span className="text-red-500">*</span>
                  </label>
                  <input
                    name="phone"
                    type="tel"
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
                    value={form.phone}
                    onChange={handleChange}
                    placeholder="0123456789"
                    required
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Account Info */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Lock className="w-5 h-5 mr-2 text-gray-400" />
              Thông tin đăng nhập
            </h2>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <User className="w-4 h-4 inline mr-1 text-gray-400" />
                    Tên đăng nhập <span className="text-red-500">*</span>
                  </label>
                  <input
                    name="username"
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
                    value={form.username}
                    onChange={handleChange}
                    placeholder="username"
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Tên đăng nhập không chứa khoảng trắng
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Lock className="w-4 h-4 inline mr-1 text-gray-400" />
                    Mật khẩu <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="password"
                    name="password"
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
                    value={form.password}
                    onChange={handleChange}
                    placeholder="••••••••"
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Tối thiểu 6 ký tự
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Shield className="w-4 h-4 inline mr-1 text-gray-400" />
                  Vai trò <span className="text-red-500">*</span>
                </label>
                <select
                  name="role_id"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all bg-white"
                  value={form.role_id || ""}
                  onChange={handleChange}
                  required
                >
                  <option value="">-- Chọn vai trò --</option>
                  {roles.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.code} - {r.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => nav(-1)}
                className="px-6 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                disabled={loading}
              >
                Hủy bỏ
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2.5 text-sm font-medium text-white bg-orange-600 rounded-lg hover:bg-orange-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
              >
                {loading ? (
                  <>
                    <svg
                      className="animate-spin h-4 w-4"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    <span>Đang tạo...</span>
                  </>
                ) : (
                  <>
                    <User className="w-4 h-4" />
                    <span>Tạo tài khoản</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}