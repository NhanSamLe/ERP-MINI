import React, { useEffect, useState } from "react";
import { Calendar, Clock, User, FileText, Download, Filter } from "lucide-react";
import { AttendanceDTO } from "../dto/attendance.dto";
import { attendanceApi } from "../api/attendance.api";
import apiClient from "../../../api/axiosClient";
import * as XLSX from 'xlsx';

const MyAttendancePage: React.FC = () => {
  const [data, setData] = useState<AttendanceDTO[]>([]);
  const [filteredData, setFilteredData] = useState<AttendanceDTO[]>([]);
  const [loading, setLoading] = useState(false);
  const [employeeId, setEmployeeId] = useState<number | null>(null);
  const [employeeName, setEmployeeName] = useState<string>("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [searchMonth, setSearchMonth] = useState<string>("");

  // 1️⃣ Lấy thông tin user + employee_id từ BE
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await apiClient.get("/auth/me-attendance");
        const profile = res.data;
        // ưu tiên dùng employee_id, nếu không có thì thôi
        if (profile.employee_id) {
          setEmployeeId(profile.employee_id);
        }
        setEmployeeName(profile.employee?.full_name || profile.full_name || "");
      } catch (e) {
        console.error("Lỗi load profile attendance", e);
      }
    };

    fetchProfile();
  }, []);

  // 2️⃣ Khi đã có employeeId thì mới gọi API chấm công
  useEffect(() => {
    if (!employeeId) return;

    const fetchData = async () => {
      try {
        setLoading(true);
        const res = await attendanceApi.getByEmployee(employeeId);
        setData(res.data);
        setFilteredData(res.data); // Khởi tạo filteredData với data gốc
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [employeeId]);

  // Filter logic
  useEffect(() => {
    let filtered = [...data];
    
    if (filterStatus !== "all") {
      filtered = filtered.filter(item => item.status === filterStatus);
    }
    
    if (searchMonth) {
      filtered = filtered.filter(item => 
        item.work_date.startsWith(searchMonth)
      );
    }
    
    setFilteredData(filtered);
  }, [filterStatus, searchMonth, data]);

  const getStatusBadge = (status: string | undefined) => {
    const styles: Record<string, string> = {
      present: "bg-green-100 text-green-800 border-green-200",
      late: "bg-yellow-100 text-yellow-800 border-yellow-200",
      absent: "bg-red-100 text-red-800 border-red-200",
      leave: "bg-blue-100 text-blue-800 border-blue-200"
    };
    
    const labels: Record<string, string> = {
      present: "Đi làm",
      late: "Đi muộn",
      absent: "Vắng",
      leave: "Nghỉ phép"
    };
    
    const statusKey = status || "present"; // Default nếu undefined
    return (
      <span className={`px-3 py-1 rounded-full text-xs font-medium border ${styles[statusKey] || styles.present}`}>
        {labels[statusKey] || statusKey}
      </span>
    );
  };

  const formatTime = (dateString: string | null | undefined) => {
    if (!dateString) return <span className="text-gray-400">--:--</span>;
    return new Date(dateString).toLocaleTimeString("vi-VN", {
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("vi-VN", {
      weekday: "short",
      day: "2-digit",
      month: "2-digit",
      year: "numeric"
    });
  };

  // Hàm helper để lấy label trạng thái cho Excel
  const getStatusLabel = (status: string | undefined) => {
    const labels: Record<string, string> = {
      present: "Đi làm",
      late: "Đi muộn",
      absent: "Vắng",
      leave: "Nghỉ phép"
    };
    return labels[status || "present"] || status || "present";
  };

  // Hàm xuất Excel
  const handleExportExcel = () => {
    // Chuẩn bị dữ liệu để xuất (sử dụng filteredData để xuất dữ liệu đã lọc)
    const exportData = filteredData.map((item) => ({
      "Ngày làm việc": formatDate(item.work_date),
      "Check In": item.check_in ? new Date(item.check_in).toLocaleString("vi-VN") : "--:--",
      "Check Out": item.check_out ? new Date(item.check_out).toLocaleString("vi-VN") : "--:--",
      "Giờ làm": item.working_hours && item.working_hours > 0 ? `${item.working_hours}h` : "--",
      "Trạng thái": getStatusLabel(item.status),
      "Ghi chú": item.note || "Không có ghi chú"
    }));

    // Tạo worksheet từ dữ liệu
    const worksheet = XLSX.utils.json_to_sheet(exportData);

    // Tạo workbook và thêm worksheet
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Bảng Chấm Công");

    // Tạo tên file với timestamp
    const fileName = `BangChamCong_${employeeName || "NhanVien"}_${new Date().toISOString().split('T')[0]}.xlsx`;

    // Tải xuống file
    XLSX.writeFile(workbook, fileName);
  };

  // Calculate statistics
  const stats = {
    total: data.length,
    present: data.filter(d => d.status === "present").length,
    late: data.filter(d => d.status === "late").length,
    absent: data.filter(d => d.status === "absent").length,
    totalHours: data.reduce((sum, d) => {
      const hours = typeof d.working_hours === "string" ? parseFloat(d.working_hours) || 0 : d.working_hours || 0;
      return sum + hours;
    }, 0)
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 mb-1">
                Bảng Chấm Công Cá Nhân
              </h1>
              {employeeId && (
                <div className="flex items-center text-gray-600 mt-2">
                  <User className="w-4 h-4 mr-2" />
                  <span className="font-medium">{employeeName}</span>
                  <span className="mx-2">•</span>
                  <span className="text-sm">ID: {employeeId}</span>
                </div>
              )}
            </div>
            <button 
              onClick={handleExportExcel}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Download className="w-4 h-4" />
              Xuất Excel
            </button>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow-sm p-4 border-l-4 border-blue-500">
            <div className="text-sm text-gray-600 mb-1">Tổng ngày</div>
            <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-4 border-l-4 border-green-500">
            <div className="text-sm text-gray-600 mb-1">Đi làm</div>
            <div className="text-2xl font-bold text-green-600">{stats.present}</div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-4 border-l-4 border-yellow-500">
            <div className="text-sm text-gray-600 mb-1">Đi muộn</div>
            <div className="text-2xl font-bold text-yellow-600">{stats.late}</div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-4 border-l-4 border-red-500">
            <div className="text-sm text-gray-600 mb-1">Vắng mặt</div>
            <div className="text-2xl font-bold text-red-600">{stats.absent}</div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-4 border-l-4 border-purple-500">
            <div className="text-sm text-gray-600 mb-1">Tổng giờ làm</div>
            <div className="text-2xl font-bold text-purple-600">{stats.totalHours.toFixed(1)}h</div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-gray-500" />
              <span className="text-sm font-medium text-gray-700">Lọc:</span>
            </div>
            
            <select 
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">Tất cả trạng thái</option>
              <option value="present">Đi làm</option>
              <option value="late">Đi muộn</option>
              <option value="absent">Vắng mặt</option>
              <option value="leave">Nghỉ phép</option>
            </select>

            <input
              type="month"
              value={searchMonth}
              onChange={(e) => setSearchMonth(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Chọn tháng"
            />

            {(filterStatus !== "all" || searchMonth) && (
              <button
                onClick={() => {
                  setFilterStatus("all");
                  setSearchMonth("");
                }}
                className="text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                Xóa bộ lọc
              </button>
            )}
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-3 text-gray-600">Đang tải dữ liệu...</span>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        Ngày làm việc
                      </div>
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4" />
                        Check In
                      </div>
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4" />
                        Check Out
                      </div>
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Giờ làm
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Trạng thái
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4" />
                        Ghi chú
                      </div>
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredData.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {formatDate(item.work_date)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900 font-mono">
                          {formatTime(item.check_in)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900 font-mono">
                          {formatTime(item.check_out)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <div className="text-sm font-semibold text-gray-900">
                          {item.working_hours && item.working_hours > 0 ? `${item.working_hours}h` : "--"}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        {getStatusBadge(item.status)}
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-600">
                          {item.note || <span className="text-gray-400 italic">Không có ghi chú</span>}
                        </div>
                      </td>
                    </tr>
                  ))}

                  {filteredData.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center">
                        <div className="flex flex-col items-center justify-center text-gray-500">
                          <Calendar className="w-12 h-12 mb-3 text-gray-300" />
                          <p className="text-lg font-medium">Không có dữ liệu chấm công</p>
                          <p className="text-sm mt-1">Vui lòng thử điều chỉnh bộ lọc</p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MyAttendancePage;
