import { useEffect, useState } from "react";
import { EmployeeDTO, EmployeeFormPayload } from "../dto/employee.dto";

import {
  fetchEmployees,
  createEmployee,
  updateEmployee,
  deleteEmployee,
} from "../service/employee.service";

import EmployeeFormModal from "../components/EmployeeFormModal";
import { useSelector } from "react-redux";
import { RootState } from "../../../store/store";

import {
  Plus,
  Pencil,
  Trash2,
  Search,
  Users,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

export default function EmployeePage() {
  const auth = useSelector((state: RootState) => state.auth.user);
  const roleCode = auth?.role?.code;
  const isHR = roleCode === "HR_STAFF";

  const [employees, setEmployees] = useState<EmployeeDTO[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);

  const [openForm, setOpenForm] = useState(false);
  const [editing, setEditing] = useState<EmployeeDTO | null>(null);

  // Phân trang
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const load = async () => {
    try {
      setLoading(true);
      const data = await fetchEmployees({ search });
      setEmployees(data);
    } catch (err) {
      console.error("Failed to load employees", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    setPage(1);
  }, [search]);

  const handleSubmit = async (data: EmployeeFormPayload) => {
    try {
      if (editing?.id) {
        await updateEmployee(editing.id, data);
      } else {
        await createEmployee(data);
      }

      setOpenForm(false);
      setEditing(null);
      await load();
    } catch (err: any) {
      alert(err?.response?.data?.message || "Có lỗi xảy ra");
    }
  };

  const handleDelete = async (emp: EmployeeDTO) => {
    if (!emp.id) return;
    if (!window.confirm(`Xóa nhân viên ${emp.full_name}?`)) return;

    try {
      await deleteEmployee(emp.id);
      await load();
    } catch (err: any) {
      alert(err?.response?.data?.message || "Không thể xóa");
    }
  };

  // Tính trang
  const totalItems = employees.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const currentPage = Math.min(page, totalPages);
  const startIndex = (currentPage - 1) * pageSize;
  const pageItems = employees.slice(startIndex, startIndex + pageSize);

  const goToPage = (p: number) => {
    if (p >= 1 && p <= totalPages) setPage(p);
  };

  const getPageNumbers = () => {
    const pages = [];
    const maxVisible = 7;

    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      let start = Math.max(2, currentPage - 2);
      let end = Math.min(totalPages - 1, currentPage + 2);

      if (start > 2) pages.push(-1);
      for (let i = start; i <= end; i++) pages.push(i);
      if (end < totalPages - 1) pages.push(-2);

      pages.push(totalPages);
    }

    return pages;
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">

      {/* Header */}
      <div className="mb-8 flex justify-between items-center">
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <Users className="w-8 h-8 text-blue-600" />
          Hồ sơ nhân viên
        </h1>

        <button
          className="bg-orange-600 text-white px-4 py-2 rounded-lg flex items-center gap-2"
          onClick={() => {
            setEditing(null);
            setOpenForm(true);
          }}
        >
          <Plus className="w-5 h-5" /> Thêm nhân viên
        </button>
      </div>

      {/* Search */}
      <div className="mb-6 max-w-md relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          placeholder="Tìm theo tên, mã nhân viên..."
          className="w-full border pl-10 pr-4 py-2 rounded-lg"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && load()}
        />
      </div>

      {/* Table */}
      <div className="bg-white border rounded-xl shadow-sm overflow-hidden">

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b">
                <th className="px-4 py-3 text-left">Mã NV</th>
                <th className="px-4 py-3 text-left">Họ tên</th>
                <th className="px-4 py-3">Giới tính</th>
                <th className="px-4 py-3">Phòng ban</th>
                <th className="px-4 py-3">Chức danh</th>
                <th className="px-4 py-3">Chi nhánh</th>
                <th className="px-4 py-3">Loại HĐ</th>
                <th className="px-4 py-3">STK</th>
                <th className="px-4 py-3">Ngân hàng</th>
                <th className="px-4 py-3">Lương</th>
                <th className="px-4 py-3">Trạng thái</th>
                <th className="px-4 py-3 text-center">Thao tác</th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={12} className="text-center py-10 text-gray-500">
                    Đang tải...
                  </td>
                </tr>
              ) : totalItems === 0 ? (
                <tr>
                  <td colSpan={12} className="text-center py-10 text-gray-500">
                    Không có dữ liệu
                  </td>
                </tr>
              ) : (
                pageItems.map((e) => (
                  <tr key={e.id} className="border-b hover:bg-gray-50">
                    <td className="px-4 py-3">{e.emp_code}</td>
                    <td className="px-4 py-3">{e.full_name}</td>
                    <td className="px-4 py-3 text-center">{e.gender}</td>
                    <td className="px-4 py-3">{(e as any).department?.name || "-"}</td>
                    <td className="px-4 py-3">{(e as any).position?.name || "-"}</td>
                    <td className="px-4 py-3">{(e as any).branch?.name || "-"}</td>
                    <td className="px-4 py-3">{e.contract_type}</td>
                    <td className="px-4 py-3">{e.bank_account || "-"}</td>
                    <td className="px-4 py-3">{e.bank_name || "-"}</td>
                    <td className="px-4 py-3">{e.base_salary.toLocaleString()} ₫</td>
                    <td className="px-4 py-3">
                      {e.status === "active" ? "Đang làm" : "Ngưng"}
                    </td>

                    <td className="px-4 py-3 flex gap-2 justify-center">
                      <button
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded"
                        onClick={() => {
                          setEditing(e);
                          setOpenForm(true);
                        }}
                      >
                        <Pencil className="w-4 h-4" />
                      </button>

                      <button
                        className="p-2 text-red-600 hover:bg-red-50 rounded"
                        onClick={() => handleDelete(e)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>

                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex justify-between items-center p-4 border-t">
          <span>
            Trang {currentPage} / {totalPages}
          </span>

          <div className="flex gap-2">
            <button
              disabled={currentPage === 1}
              onClick={() => goToPage(currentPage - 1)}
              className="px-3 py-1 border rounded disabled:opacity-40"
            >
              <ChevronLeft />
            </button>

            {getPageNumbers().map((p, i) =>
              p < 0 ? (
                <span key={i} className="px-2">
                  ...
                </span>
              ) : (
                <button
                  key={i}
                  onClick={() => goToPage(p)}
                  className={`px-3 py-1 rounded ${
                    p === currentPage ? "bg-blue-600 text-white" : "border"
                  }`}
                >
                  {p}
                </button>
              )
            )}

            <button
              disabled={currentPage === totalPages}
              onClick={() => goToPage(currentPage + 1)}
              className="px-3 py-1 border rounded disabled:opacity-40"
            >
              <ChevronRight />
            </button>
          </div>
        </div>
      </div>

      {/* Modal */}
      <EmployeeFormModal
        open={openForm}
        onClose={() => {
          setOpenForm(false);
          setEditing(null);
        }}
        initialData={editing}
        onSubmit={handleSubmit}
      />
    </div>
  );
}
