import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import { attendanceApi } from "../api/attendance.api";
import apiClient from "../../../api/axiosClient";

interface HolidayModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const HolidayModal: React.FC<HolidayModalProps> = ({ open, onClose, onSuccess }) => {
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [holidayName, setHolidayName] = useState("");
  const [branchId, setBranchId] = useState<string>("");
  const [branches, setBranches] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      setStartDate("");
      setEndDate("");
      setHolidayName("");
      setBranchId("");
      // Fetch branches list
      apiClient.get("/company/branches")
        .then(res => setBranches(res.data || []))
        .catch(err => console.error("Error fetching branches:", err));
    }
  }, [open]);

  if (!open) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!startDate || !endDate || !holidayName) {
      toast.error("Vui lòng nhập đầy đủ thông tin");
      return;
    }

    if (new Date(endDate) < new Date(startDate)) {
      toast.error("Ngày kết thúc phải lớn hơn hoặc bằng ngày bắt đầu");
      return;
    }

    try {
      setLoading(true);
      const payload = {
        startDate,
        endDate,
        holidayName,
        branch_id: branchId ? Number(branchId) : undefined
      };
      
      const res = await attendanceApi.createHolidayBulk(payload);
      toast.success(`Đã tự động tạo ${(res.data as any).count || 0} lượt ngày công nghỉ lễ cho nhân viên!`);
      onSuccess();
      onClose();
    } catch (err: any) {
      console.error(err);
      toast.error(err.response?.data?.error || "Tạo ngày nghỉ lễ thất bại");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md border border-slate-100 overflow-hidden transform transition-all duration-300">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
          <h2 className="text-lg font-bold text-slate-800">Tạo ngày nghỉ lễ hàng loạt</h2>
          <button 
            type="button"
            onClick={onClose} 
            className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-all"
          >
            ✕
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wide">
                Từ ngày <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full border border-slate-300 rounded-xl px-4 py-2.5 bg-slate-50 text-slate-800 focus:ring-2 focus:ring-orange-400 focus:border-transparent outline-none font-medium text-sm transition-all"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wide">
                Đến ngày <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full border border-slate-300 rounded-xl px-4 py-2.5 bg-slate-50 text-slate-800 focus:ring-2 focus:ring-orange-400 focus:border-transparent outline-none font-medium text-sm transition-all"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">
              Tên ngày lễ <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              placeholder="Ví dụ: Tết Dương Lịch, Quốc Khánh 2/9..."
              value={holidayName}
              onChange={(e) => setHolidayName(e.target.value)}
              className="w-full border border-slate-300 rounded-xl px-4 py-2.5 bg-slate-50 text-slate-800 focus:ring-2 focus:ring-orange-400 focus:border-transparent outline-none font-medium text-sm transition-all"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">
              Chi nhánh áp dụng
            </label>
            <select
              value={branchId}
              onChange={(e) => setBranchId(e.target.value)}
              className="w-full border border-slate-300 rounded-xl px-4 py-2.5 bg-slate-50 text-slate-800 focus:ring-2 focus:ring-orange-400 focus:border-transparent outline-none font-medium text-sm transition-all cursor-pointer bg-white"
            >
              <option value="">Tất cả chi nhánh</option>
              {branches.map((b: any) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
            <p className="text-xs text-slate-400 mt-1">
              Bỏ trống để tự động áp dụng cho tất cả nhân viên đang hoạt động của mọi chi nhánh.
            </p>
          </div>

          {/* Footer Buttons */}
          <div className="flex gap-3 pt-4 border-t border-slate-100 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 border border-slate-300 rounded-xl text-slate-700 text-sm font-medium hover:bg-slate-50 transition-all"
              disabled={loading}
            >
              Hủy bỏ
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2.5 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-sm font-semibold transition-all shadow-md shadow-orange-500/20"
              disabled={loading}
            >
              {loading ? "Đang xử lý..." : "Xác nhận tạo"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default HolidayModal;
