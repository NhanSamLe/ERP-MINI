import React, { useEffect, useState } from "react";
import { toast } from "react-toastify";
import apiClient from "../../../api/axiosClient";
import {
  FileText,
  Calendar,
  DollarSign,
  ClipboardList,
  ChevronRight,
  Download,
  Info,
  X,
  Clock,
  AlertCircle
} from "lucide-react";

interface PayslipSummary {
  id: number;
  run_id: number;
  employee_id: number;
  base_salary: string | number;
  daily_rate: string | number;
  present_days: number;
  absent_days: number;
  leave_days: number;
  late_days: number;
  gross_amount: string | number;
  total_deduction: string | number;
  pit_amount: string | number;
  net_amount: string | number;
  amount: string | number;
  created_at: string;
  run?: {
    id: number;
    run_no: string;
    status: string;
    period?: {
      id: number;
      period_code: string;
      start_date: string;
      end_date: string;
    };
  };
}

const money = (n: any) =>
  Number(n || 0).toLocaleString("vi-VN", { maximumFractionDigits: 0 });

const d10 = (s?: string | null) => (s ? String(s).slice(0, 10) : "—");

const statusLabel: Record<string, string> = {
  present: "Có mặt",
  absent: "Vắng mặt",
  leave: "Nghỉ phép",
  late: "Muộn",
  holiday: "Nghỉ lễ",
};

const statusPillClass = (s: string) => {
  if (s === "present")
    return "bg-emerald-100 text-emerald-700 border border-emerald-200";
  if (s === "absent")
    return "bg-red-100 text-red-700 border border-red-200";
  if (s === "leave")
    return "bg-blue-100 text-blue-700 border border-blue-200";
  if (s === "late")
    return "bg-amber-100 text-amber-700 border border-amber-200";
  if (s === "holiday")
    return "bg-purple-100 text-purple-700 border border-purple-200";
  return "bg-gray-100 text-gray-700 border border-gray-200";
};

const MyPayrollPage: React.FC = () => {
  const [payslips, setPayslips] = useState<PayslipSummary[]>([]);
  const [loading, setLoading] = useState(false);
  
  // Detailed payslip modal
  const [selectedLineId, setSelectedLineId] = useState<number | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailEvidence, setDetailEvidence] = useState<any | null>(null);

  const fetchMyPayrolls = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get("/hrm/payroll-runs/me/payslips");
      setPayslips(res.data || []);
    } catch (err: any) {
      console.error(err);
      toast.error(err.response?.data?.message || "Không thể tải danh sách phiếu lương");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMyPayrolls();
  }, []);

  const openDetail = async (payslip: PayslipSummary) => {
    setSelectedLineId(payslip.id);
    setShowDetailModal(true);
    setDetailEvidence(null);
    setDetailLoading(true);

    try {
      // Gọi API lấy chứng từ chi tiết
      const res = await apiClient.get(
        `/hrm/payroll-runs/${payslip.run_id}/evidence/${payslip.employee_id}`
      );
      // Tích hợp lineId vào evidence để tải PDF
      setDetailEvidence({ ...res.data, lineId: payslip.id });
    } catch (err: any) {
      console.error(err);
      toast.error("Không thể tải chi tiết giải trình phiếu lương");
    } finally {
      setDetailLoading(false);
    }
  };

  const handleDownloadPdf = async () => {
    if (!selectedLineId) return;
    try {
      const res = await apiClient.get(`/hrm/payroll-runs/lines/${selectedLineId}/pdf`, {
        responseType: "blob",
      });
      const blob = new Blob([res.data], { type: "application/pdf" });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `phieu-luong-${detailEvidence?.employee?.full_name || "nhan-vien"}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success("Tải PDF phiếu lương thành công!");
    } catch (err: any) {
      console.error(err);
      toast.error("Tải PDF phiếu lương thất bại");
    }
  };

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-800 flex items-center gap-3">
          <div className="bg-gradient-to-br from-orange-500 to-orange-600 p-2.5 rounded-xl shadow-lg shadow-orange-500/20">
            <DollarSign className="w-7 h-7 text-white" />
          </div>
          Phiếu lương của tôi
        </h1>
        <p className="text-slate-500 mt-2 text-sm">
          Tra cứu và tải phiếu lương chi tiết hàng tháng của bạn.
        </p>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-10 h-10 border-4 border-slate-200 border-t-orange-500 rounded-full animate-spin" />
        </div>
      ) : payslips.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center shadow-sm">
          <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-slate-100">
            <FileText className="w-8 h-8 text-slate-400" />
          </div>
          <p className="text-slate-600 font-semibold text-base">Không tìm thấy phiếu lương nào</p>
          <p className="text-slate-400 text-sm mt-1">Thông tin phiếu lương sẽ hiển thị sau khi Ban nhân sự phê duyệt bảng lương.</p>
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  <th className="px-6 py-4">Kỳ lương</th>
                  <th className="px-6 py-4">Thời gian</th>
                  <th className="px-6 py-4 text-right">Tổng thu nhập (Gross)</th>
                  <th className="px-6 py-4 text-right">Khấu trừ</th>
                  <th className="px-6 py-4 text-right text-orange-600 font-bold">Thực nhận (Net)</th>
                  <th className="px-6 py-4 text-center">Hành động</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {payslips.map((p) => {
                  const period = p.run?.period;
                  const net = p.net_amount || p.amount || 0;
                  const deductions = p.total_deduction || 0;
                  return (
                    <tr key={p.id} className="hover:bg-slate-50/50 transition-colors group">
                      <td className="px-6 py-4 font-semibold text-slate-800">
                        {period?.period_code || `Lượt chạy ${p.run?.run_no}`}
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-500">
                        {period ? `${d10(period.start_date)} → ${d10(period.end_date)}` : "—"}
                      </td>
                      <td className="px-6 py-4 text-right text-sm font-medium text-slate-700">
                        {money(p.gross_amount)} VND
                      </td>
                      <td className="px-6 py-4 text-right text-sm font-medium text-red-600">
                        -{money(deductions)} VND
                      </td>
                      <td className="px-6 py-4 text-right font-bold text-slate-900">
                        {money(net)} VND
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex justify-center gap-2">
                          <button
                            onClick={() => openDetail(p)}
                            className="px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-1 transition-all"
                          >
                            Chi tiết
                            <ChevronRight className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ===== DETAIL MODAL ===== */}
      {showDetailModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-slate-900 to-slate-800 px-6 py-5 flex justify-between items-center text-white">
              <div>
                <h3 className="text-xl font-bold flex items-center gap-3">
                  <ClipboardList className="w-5 h-5 text-orange-400" />
                  Chi tiết phiếu thanh toán lương
                </h3>
                <p className="text-xs text-slate-300 mt-1">
                  {detailEvidence?.period
                    ? `Kỳ lương: ${detailEvidence.period.period_code} (${d10(detailEvidence.period.start_date)} → ${d10(detailEvidence.period.end_date)})`
                    : "Đang tải..."}
                </p>
              </div>
              <button
                onClick={() => setShowDetailModal(false)}
                className="text-white/80 hover:text-white bg-white/10 p-2 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {detailLoading && (
                <div className="flex justify-center py-12">
                  <div className="w-10 h-10 border-4 border-slate-200 border-t-orange-500 rounded-full animate-spin" />
                </div>
              )}

              {detailEvidence && !detailLoading && (
                <>
                  {/* Summary */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[
                      {
                        label: "Có mặt",
                        value: detailEvidence.summary.presentDays,
                        cls: "bg-emerald-50 border-emerald-200 text-emerald-700",
                      },
                      {
                        label: "Nghỉ phép hưởng lương",
                        value: detailEvidence.summary.leaveDays,
                        cls: "bg-blue-50 border-blue-200 text-blue-700",
                      },
                      {
                        label: "Vắng mặt",
                        value: detailEvidence.summary.absentDays,
                        cls: "bg-red-50 border-red-200 text-red-700",
                      },
                      {
                        label: "Đi muộn",
                        value: detailEvidence.summary.lateDays,
                        cls: "bg-amber-50 border-amber-200 text-amber-700",
                      },
                    ].map((c) => (
                      <div key={c.label} className={`rounded-xl p-4 border ${c.cls} text-center`}>
                        <p className="text-xs font-semibold opacity-85 mb-1">{c.label}</p>
                        <p className="text-2xl font-bold">{c.value} ngày</p>
                      </div>
                    ))}
                  </div>

                  {/* Calculations */}
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 space-y-4">
                    <h4 className="text-sm font-bold text-slate-800 flex items-center gap-2 border-b border-slate-200 pb-2">
                      <Info className="w-4 h-4 text-orange-500" />
                      Giải trình thu nhập & Khấu trừ
                    </h4>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-3 text-sm">
                      <div className="flex justify-between py-1 border-b border-slate-100">
                        <span className="text-slate-500">Mức lương cơ bản</span>
                        <span className="font-semibold">{money(detailEvidence.employee.base_salary)} VND</span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-slate-100">
                        <span className="text-slate-500">Đơn giá ngày công</span>
                        <span className="font-semibold">{money(detailEvidence.breakdown.dailyRate)} VND</span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-slate-100">
                        <span className="text-slate-500">Lương công thực tế</span>
                        <span className="font-semibold">{money(detailEvidence.breakdown.basePay)} VND</span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-slate-100">
                        <span className="text-slate-500">Phụ cấp ăn trưa</span>
                        <span className="font-semibold">{money(detailEvidence.breakdown.allowance)} VND</span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-slate-100 md:col-span-2">
                        <span className="font-bold text-slate-800">TỔNG THU NHẬP (GROSS)</span>
                        <span className="font-bold text-emerald-600">{money(detailEvidence.breakdown.gross)} VND</span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-slate-100">
                        <span className="text-slate-500">Khấu trừ đi muộn</span>
                        <span className="font-semibold text-red-600">-{money(detailEvidence.breakdown.lateDeduction)} VND</span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-slate-100">
                        <span className="text-slate-500">Bảo hiểm trích đóng (10.5%)</span>
                        <span className="font-semibold text-red-600">-{money(detailEvidence.breakdown.insuranceEmp)} VND</span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-slate-100">
                        <span className="text-slate-500">Thuế thu nhập cá nhân (PIT)</span>
                        <span className="font-semibold text-red-600">-{money(detailEvidence.breakdown.pit)} VND</span>
                      </div>
                      <div className="flex justify-between py-2 border-t-2 border-slate-300 md:col-span-2 mt-2">
                        <span className="font-bold text-slate-800 text-base">THỰC NHẬN (NET SALARY)</span>
                        <span className="font-bold text-orange-600 text-lg">{money(detailEvidence.breakdown.net)} VND</span>
                      </div>
                    </div>
                  </div>

                  {/* Attendance detail table */}
                  <div className="border border-slate-200 rounded-xl overflow-hidden">
                    <div className="px-5 py-3 bg-slate-50 border-b border-slate-200">
                      <h4 className="text-sm font-semibold text-slate-700">Nhật ký chấm công chi tiết trong kỳ</h4>
                    </div>
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="bg-slate-100/50 border-b border-slate-200 font-semibold text-slate-600">
                          <th className="px-4 py-2.5">Ngày</th>
                          <th className="px-4 py-2.5">Trạng thái</th>
                          <th className="px-4 py-2.5">Check-in</th>
                          <th className="px-4 py-2.5">Check-out</th>
                          <th className="px-4 py-2.5">Ghi chú</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {detailEvidence.attendance.map((a: any) => (
                          <tr key={a.id} className="hover:bg-slate-50/50 transition-colors">
                            <td className="px-4 py-2.5 font-medium text-slate-700">{d10(a.work_date)}</td>
                            <td className="px-4 py-2.5">
                              <span className={`inline-flex items-center px-2 py-0.5 rounded-full font-semibold ${statusPillClass(a.status)}`}>
                                {statusLabel[a.status] ?? a.status}
                              </span>
                            </td>
                            <td className="px-4 py-2.5 text-slate-500">{a.check_in || "—"}</td>
                            <td className="px-4 py-2.5 text-slate-500">{a.check_out || "—"}</td>
                            <td className="px-4 py-2.5 text-slate-400">{a.note || "—"}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </div>

            {/* Footer */}
            <div className="border-t border-slate-200 bg-slate-50 px-6 py-4 flex justify-end gap-3">
              {detailEvidence && (
                <button
                  onClick={handleDownloadPdf}
                  className="px-5 py-2.5 bg-orange-500 hover:bg-orange-600 text-white font-semibold rounded-xl text-sm transition-all flex items-center gap-2 shadow-md shadow-orange-500/20"
                >
                  <Download className="w-4 h-4" />
                  Tải PDF phiếu lương
                </button>
              )}
              <button
                onClick={() => setShowDetailModal(false)}
                className="px-6 py-2.5 border border-slate-300 rounded-xl text-slate-700 text-sm font-semibold hover:bg-slate-100 transition-all bg-white"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyPayrollPage;
