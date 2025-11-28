import React, { useEffect, useState } from "react";
import { useAppDispatch, useAppSelector } from "../../../store/hooks";
import {
  fetchAttendances,
  createAttendance,
  updateAttendance,
  deleteAttendance,
} from "../store/attendance/attendance.thunks";
import { AttendanceDTO } from "../dto/attendance.dto";
import AttendanceFormModal from "../components/AttendanceFormModal";
import {
  Plus,
  Pencil,
  Trash2,
  Search,
  Clock,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Download,
} from "lucide-react";
import * as XLSX from "xlsx";

const AttendancePage: React.FC = () => {
  const dispatch = useAppDispatch();
  const { list, loading } = useAppSelector((state) => state.attendance);

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<AttendanceDTO | null>(null);
  const [search, setSearch] = useState("");
  const [selectedEmployee, setSelectedEmployee] = useState<string>("all");
  const [selectedDate, setSelectedDate] = useState<string>("");

  // Phân trang
  const [page, setPage] = useState(1);
  const pageSize = 10;

  useEffect(() => {
    dispatch(fetchAttendances({}));
  }, [dispatch]);

  // Reset về trang 1 khi search hoặc filter thay đổi
  useEffect(() => {
    setPage(1);
  }, [search, selectedEmployee, selectedDate]);

  const handleAdd = () => {
    setEditing(null);
    setModalOpen(true);
  };

  const handleEdit = (item: AttendanceDTO) => {
    setEditing(item);
    setModalOpen(true);
  };

  const handleDelete = (id?: number) => {
    if (!id) return;
    if (window.confirm("Xóa bản ghi chấm công này?")) {
      dispatch(deleteAttendance(id));
    }
  };

  const handleSubmit = async (values: AttendanceDTO | Partial<AttendanceDTO>) => {
    if (editing?.id) {
      await dispatch(
        updateAttendance({
          id: editing.id,
          data: values,
        })
      );
    } else {
      await dispatch(createAttendance(values as AttendanceDTO));
    }
    setModalOpen(false);
  };

  // Lọc dữ liệu theo search, employee và date
  const filteredList = list.filter((item) => {
    const searchLower = search.toLowerCase();
    const employeeName =
    ((item as any).employee?.full_name || "").toLowerCase();
  const branchName =
    ((item as any).branch?.name || "").toLowerCase();
     const matchSearch =
    employeeName.includes(searchLower) ||          // 👈 search theo tên NV
    branchName.includes(searchLower) ||            // (optional) theo tên chi nhánh
    item.status?.toLowerCase().includes(searchLower) ||
    item.note?.toLowerCase().includes(searchLower);

  const matchEmployee =
    selectedEmployee === "all" ||
    item.employee_id?.toString() === selectedEmployee;

  const matchDate =
    !selectedDate ||
    (item.work_date && item.work_date.toString().slice(0, 10) === selectedDate);

  return matchSearch && matchEmployee && matchDate;
  });

  // Lấy danh sách nhân viên unique để hiển thị trong combobox
  const employeeOptions = Array.from(
    new Map(
      list
        .filter((item) => item.employee_id)
        .map((item) => [
          item.employee_id,
          {
            id: item.employee_id,
            name: (item as any).employee?.full_name || `Nhân viên #${item.employee_id}`,
          },
        ])
    ).values()
  );

  // Tính toán phân trang
  const totalItems = filteredList.length;
  const totalPages = totalItems ? Math.ceil(totalItems / pageSize) : 1;
  const currentPage = Math.min(page, totalPages);
  const startIndex = (currentPage - 1) * pageSize;
  const pageItems = filteredList.slice(startIndex, startIndex + pageSize);

  const goToPage = (p: number) => {
    if (p < 1 || p > totalPages) return;
    setPage(p);
  };

  const getPageNumbers = () => {
    const pages: number[] = [];
    const maxVisible = 7;

    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      pages.push(1);

      let start = Math.max(2, currentPage - 2);
      let end = Math.min(totalPages - 1, currentPage + 2);

      if (currentPage <= 3) {
        end = 5;
      } else if (currentPage >= totalPages - 2) {
        start = totalPages - 4;
      }

      if (start > 2) {
        pages.push(-1);
      }

      for (let i = start; i <= end; i++) {
        pages.push(i);
      }

      if (end < totalPages - 1) {
        pages.push(-2);
      }

      pages.push(totalPages);
    }

    return pages;
  };

  // ================== EXPORT EXCEL ==================
  // "List hiện gì thì export cái đó" -> dùng filteredList (đã filter theo search, employee, date)
  // Nếu muốn chỉ export TRANG HIỆN TẠI thì đổi "filteredList" -> "pageItems"
  const handleExportExcel = () => {
    const exportSource = filteredList; // hoặc pageItems nếu muốn chỉ export trang hiện tại

    if (!exportSource.length) {
      alert("Không có dữ liệu để xuất Excel.");
      return;
    }

    const exportData = exportSource.map((item) => ({
      ID: item.id,
      "Chi nhánh": item.branch_id,
      "Nhân viên": (item as any).employee?.full_name || item.employee_id,
      "Ngày làm": item.work_date ? item.work_date.toString().slice(0, 10) : "",
      "Check In": item.check_in
        ? new Date(item.check_in).toLocaleTimeString("vi-VN", {
            hour: "2-digit",
            minute: "2-digit",
          })
        : "",
      "Check Out": item.check_out
        ? new Date(item.check_out).toLocaleTimeString("vi-VN", {
            hour: "2-digit",
            minute: "2-digit",
          })
        : "",
      "Giờ làm": item.working_hours || 0,
      "Trạng thái": item.status || "",
      "Ghi chú": item.note || "",
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Attendance");

    const fileName = `Attendance_${new Date().toISOString().slice(0, 10)}.xlsx`;
    XLSX.writeFile(workbook, fileName);
  };
  // ==================================================

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      {/* Header Section */}
      <div className="mb-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <div className="bg-gradient-to-br from-orange-500 to-orange-600 p-2.5 rounded-xl shadow-lg">
                <Clock className="w-7 h-7 text-white" />
              </div>
              Quản lý chấm công
            </h1>
            <p className="text-gray-500 mt-2 text-sm">
              Tổng số:{" "}
              <span className="font-semibold text-gray-700">{totalItems}</span> bản ghi
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={handleExportExcel}
              className="bg-green-600 text-white px-5 py-2.5 flex items-center gap-2 rounded-xl shadow hover:bg-green-700 transition-all duration-200 font-medium"
            >
              <Download className="w-5 h-5" />
              Xuất Excel
            </button>

            <button
              onClick={handleAdd}
              className="bg-gradient-to-r from-orange-500 to-orange-600 text-white px-5 py-2.5 flex items-center gap-2 rounded-xl shadow-lg shadow-orange-500/30 hover:shadow-xl hover:shadow-orange-500/40 hover:from-orange-600 hover:to-orange-700 transition-all duration-200 font-medium"
            >
              <Plus className="w-5 h-5" />
              Thêm chấm công
            </button>
          </div>
        </div>
      </div>

      {/* Search Bar and Filters */}
      <div className="mb-6 flex flex-col sm:flex-row gap-4">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            placeholder="Tìm kiếm theo nhân viên, trạng thái, ghi chú..."
            className="w-full border border-gray-200 rounded-xl pl-12 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent shadow-sm hover:border-gray-300 transition-all duration-200"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* Employee Filter */}
        <div className="relative min-w-[200px]">
          <select
            value={selectedEmployee}
            onChange={(e) => setSelectedEmployee(e.target.value)}
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent shadow-sm hover:border-gray-300 transition-all duration-200 bg-white appearance-none cursor-pointer"
          >
            <option value="all">Tất cả nhân viên</option>
            {employeeOptions.map((emp) => (
              <option key={emp.id} value={emp.id as any}>
                {emp.name}
              </option>
            ))}
          </select>
          <ChevronRight className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 rotate-90 pointer-events-none" />
        </div>

        {/* Date Filter */}
        <div className="relative min-w-[180px]">
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent shadow-sm hover:border-gray-300 transition-all duration-200 bg-white cursor-pointer"
          />
          {selectedDate && (
            <button
              onClick={() => setSelectedDate("")}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
              title="Xóa bộ lọc ngày"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Table Card */}
      <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gradient-to-r from-gray-50 to-gray-100/50 border-b border-gray-200">
                <th className="px-4 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  ID
                </th>
                <th className="px-4 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Chi nhánh
                </th>
                <th className="px-4 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Nhân viên
                </th>
                <th className="px-4 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Ngày làm
                </th>
                <th className="px-4 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Check in
                </th>
                <th className="px-4 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Check out
                </th>
                <th className="px-4 py-4 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Giờ làm
                </th>
                <th className="px-4 py-4 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Trạng thái
                </th>
                <th className="px-4 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Ghi chú
                </th>
                <th className="px-4 py-4 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Thao tác
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan={10} className="px-6 py-16">
                    <div className="flex flex-col items-center justify-center">
                      <div className="relative">
                        <div className="w-12 h-12 border-4 border-gray-200 border-t-orange-500 rounded-full animate-spin"></div>
                      </div>
                      <p className="mt-4 text-gray-500 text-sm">Đang tải dữ liệu...</p>
                    </div>
                  </td>
                </tr>
              ) : totalItems === 0 ? (
                <tr>
                  <td colSpan={10} className="px-6 py-16">
                    <div className="flex flex-col items-center justify-center">
                      <div className="bg-gray-100 rounded-full p-4 mb-4">
                        <AlertCircle className="w-8 h-8 text-gray-400" />
                      </div>
                      <p className="text-gray-500 text-sm font-medium">
                        {search ? "Không tìm thấy kết quả phù hợp" : "Chưa có dữ liệu chấm công"}
                      </p>
                      <p className="text-gray-400 text-xs mt-1">
                        {search
                          ? "Thử tìm kiếm với từ khóa khác"
                          : "Nhấn nút 'Thêm chấm công' để tạo mới"}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                pageItems.map((item) => (
                  <tr
                    key={item.id}
                    className="hover:bg-orange-50/50 transition-colors duration-150 group"
                  >
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center px-2 py-1 rounded-lg bg-gray-100 text-gray-700 font-mono text-xs font-semibold">
                        {item.id}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-700">{item.branch_id}</td>
                    <td className="px-4 py-3 font-medium text-gray-900">
                      {(item as any).employee?.full_name || item.employee_id}
                    </td>
                    <td className="px-4 py-3 text-gray-700">
                      {item.work_date ? item.work_date.toString().slice(0, 10) : "-"}
                    </td>
                    <td className="px-4 py-3 text-gray-700">
                      {item.check_in
                        ? new Date(item.check_in).toLocaleTimeString("vi-VN", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })
                        : "-"}
                    </td>
                    <td className="px-4 py-3 text-gray-700">
                      {item.check_out
                        ? new Date(item.check_out).toLocaleTimeString("vi-VN", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })
                        : "-"}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-blue-100 text-blue-700 text-xs font-semibold">
                        {item.working_hours || "0"}h
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span
                        className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold ${
                          item.status === "present"
                            ? "bg-green-100 text-green-700"
                            : item.status === "absent"
                            ? "bg-red-100 text-red-700"
                            : item.status === "late"
                            ? "bg-yellow-100 text-yellow-700"
                            : "bg-gray-100 text-gray-700"
                        }`}
                      >
                        {item.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-600 text-xs max-w-xs truncate">
                      {item.note || "-"}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                        <button
                          className="p-2 border border-gray-200 rounded-lg text-emerald-600 hover:bg-emerald-50 hover:border-emerald-200 transition-all duration-200 shadow-sm hover:shadow"
                          onClick={() => handleEdit(item)}
                          title="Chỉnh sửa"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>

                        <button
                          className="p-2 border border-gray-200 rounded-lg text-red-600 hover:bg-red-50 hover:border-red-200 transition-all duration-200 shadow-sm hover:shadow"
                          onClick={() => handleDelete(item.id)}
                          title="Xóa"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalItems > 0 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-6 py-4 border-t bg-gradient-to-r from-gray-50 to-white">
            <div className="text-sm text-gray-600">
              Hiển thị{" "}
              <span className="font-semibold text-gray-900">
                {startIndex + 1} - {Math.min(startIndex + pageSize, totalItems)}
              </span>{" "}
              trong tổng số{" "}
              <span className="font-semibold text-gray-900">{totalItems}</span> bản ghi
            </div>

            <div className="flex items-center gap-2">
              {/* Previous Button */}
              <button
                onClick={() => goToPage(currentPage - 1)}
                disabled={currentPage === 1}
                className="flex items-center gap-1 px-3 py-2 rounded-lg border border-gray-200 text-sm font-medium disabled:opacity-40 disabled:cursor-not-allowed hover:bg白 hover:shadow-sm transition-all duration-200 bg-gray-50"
              >
                <ChevronLeft className="w-4 h-4" />
                <span className="hidden sm:inline">Trước</span>
              </button>

              {/* Page Numbers */}
              <div className="flex items-center gap-1">
                {getPageNumbers().map((pNum, idx) => {
                  if (pNum < 0) {
                    return (
                      <span key={`ellipsis-${idx}`} className="px-2 text-gray-400">
                        ...
                      </span>
                    );
                  }

                  return (
                    <button
                      key={pNum}
                      onClick={() => goToPage(pNum)}
                      className={`min-w-[36px] h-9 px-3 rounded-lg text-sm font-medium transition-all duration-200 ${
                        pNum === currentPage
                          ? "bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-lg shadow-orange-500/30"
                          : "bg-white text-gray-700 border border-gray-200 hover:border-orange-300 hover:bg-orange-50"
                      }`}
                    >
                      {pNum}
                    </button>
                  );
                })}
              </div>

              {/* Next Button */}
              <button
                onClick={() => goToPage(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="flex items-center gap-1 px-3 py-2 rounded-lg border border-gray-200 text-sm font-medium disabled:opacity-40 disabled:cursor-not-allowed hover:bg-white hover:shadow-sm transition-all duration-200 bg-gray-50"
              >
                <span className="hidden sm:inline">Sau</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      <AttendanceFormModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        initialValue={editing}
        onSubmit={handleSubmit}
      />
    </div>
  );
};

export default AttendancePage;
