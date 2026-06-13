import React, { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { Save, RefreshCw, Briefcase, ShieldAlert, BadgePercent, Landmark } from "lucide-react";
import { hrmConfigApi, PayrollConfigDTO } from "../api/hrm.api";

const CONFIG_GROUPS = [
  {
    title: "Cài đặt ngày công & Đi muộn",
    icon: Briefcase,
    color: "from-blue-500 to-blue-600",
    keys: [
      { key: "STANDARD_WORK_DAYS", label: "Số ngày công tiêu chuẩn trong tháng", type: "number" },
      { key: "PAID_LEAVE", label: "Trả lương cho ngày nghỉ phép năm", type: "boolean" },
      { key: "LATE_FINE_PER_DAY", label: "Phạt đi muộn mỗi ngày (VND)", type: "currency" },
      { key: "MEAL_ALLOWANCE_PER_DAY", label: "Phụ cấp ăn trưa mỗi ngày đi làm (VND)", type: "currency" },
    ],
  },
  {
    title: "Trần đóng bảo hiểm bắt buộc",
    icon: ShieldAlert,
    color: "from-red-500 to-red-600",
    keys: [
      { key: "INSURANCE_BASE_MAX", label: "Trần lương đóng BHXH, BHYT (VND)", type: "currency" },
      { key: "INSURANCE_BASE_BHTN_MAX", label: "Trần lương đóng BHTN (VND)", type: "currency" },
    ],
  },
  {
    title: "Tỷ lệ đóng bảo hiểm của Người lao động",
    icon: BadgePercent,
    color: "from-emerald-500 to-emerald-600",
    keys: [
      { key: "INS_EMP_SOCIAL_RATE", label: "Tỷ lệ đóng BHXH (%)", type: "percentage" },
      { key: "INS_EMP_HEALTH_RATE", label: "Tỷ lệ đóng BHYT (%)", type: "percentage" },
      { key: "INS_EMP_UNEMP_RATE", label: "Tỷ lệ đóng BHTN (%)", type: "percentage" },
    ],
  },
  {
    title: "Giảm trừ thuế thu nhập cá nhân (PIT)",
    icon: Landmark,
    color: "from-amber-500 to-amber-600",
    keys: [
      { key: "PERSONAL_DEDUCTION", label: "Giảm trừ bản thân (VND/tháng)", type: "currency" },
      { key: "DEPENDENT_DEDUCTION", label: "Giảm trừ người phụ thuộc (VND/người/tháng)", type: "currency" },
    ],
  },
];

const PayrollConfigPage: React.FC = () => {
  const [configs, setConfigs] = useState<PayrollConfigDTO[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [values, setValues] = useState<Record<string, string>>({});

  const loadData = async () => {
    try {
      setLoading(true);
      const res = await hrmConfigApi.getPayrollConfigs();
      setConfigs(res.data);

      const valMap: Record<string, string> = {};
      res.data.forEach((c) => {
        valMap[c.config_key] = c.config_value;
      });
      setValues(valMap);
    } catch (e: any) {
      console.error(e);
      toast.error("Không thể tải cấu hình tiền lương");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleInputChange = (key: string, val: string) => {
    setValues((prev) => ({
      ...prev,
      [key]: val,
    }));
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      // Validate inputs
      const payload: Record<string, string> = {};
      for (const group of CONFIG_GROUPS) {
        for (const k of group.keys) {
          const val = values[k.key];
          if (val === undefined || val === "") {
            toast.error(`Vui lòng điền giá trị cho: ${k.label}`);
            setSaving(false);
            return;
          }

          if (k.type === "percentage") {
            const num = parseFloat(val);
            if (isNaN(num) || num < 0 || num > 100) {
              toast.error(`${k.label} phải nằm trong khoảng từ 0% đến 100%`);
              setSaving(false);
              return;
            }
            // Chia cho 100 để lưu số thập phân (e.g. 8% -> 0.08)
            payload[k.key] = String(num / 100);
          } else if (k.type === "number" || k.type === "currency") {
            const num = parseFloat(val.replace(/,/g, ""));
            if (isNaN(num) || num < 0) {
              toast.error(`${k.label} phải là số dương`);
              setSaving(false);
              return;
            }
            payload[k.key] = String(num);
          } else {
            payload[k.key] = val;
          }
        }
      }

      await hrmConfigApi.updatePayrollConfigs(payload);
      toast.success("Cập nhật cấu hình tiền lương thành công!");
      await loadData();
    } catch (e: any) {
      console.error(e);
      toast.error(e.message || "Cập nhật cấu hình thất bại");
    } finally {
      setSaving(false);
    }
  };

  // Helper to get raw UI value (handles formatting decimals to percentages)
  const getUiValue = (key: string, type: string) => {
    const raw = values[key] ?? "";
    if (type === "percentage" && raw) {
      // Multiply decimal by 100 (e.g. 0.08 -> 8)
      return String(parseFloat(raw) * 100);
    }
    return raw;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold text-slate-800 flex items-center gap-3">
                Cấu hình thông số tiền lương
              </h1>
              <p className="text-sm text-slate-500 mt-1">
                Quản lý các thông số định mức công, bảo hiểm xã hội bắt buộc và giảm trừ thuế thu nhập.
              </p>
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto">
              <button
                onClick={loadData}
                className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-white border border-slate-300 rounded-xl text-slate-700 text-sm font-medium hover:bg-slate-50 transition-all shadow-sm"
                disabled={loading || saving}
              >
                <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
                Làm mới
              </button>
              <button
                onClick={handleSave}
                className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-medium transition-all shadow-md shadow-indigo-500/20"
                disabled={loading || saving}
              >
                <Save className="w-4 h-4" />
                {saving ? "Đang lưu..." : "Lưu cấu hình"}
              </button>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
            <RefreshCw className="w-10 h-10 text-indigo-500 animate-spin mx-auto mb-4" />
            <p className="text-slate-500 font-medium">Đang tải cấu hình...</p>
          </div>
        ) : (
          <div className="space-y-8">
            {CONFIG_GROUPS.map((group) => {
              const Icon = group.icon;
              return (
                <div key={group.title} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                  <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center gap-3">
                    <div className={`p-2 rounded-lg bg-gradient-to-br ${group.color} text-white`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <h2 className="text-lg font-bold text-slate-800">{group.title}</h2>
                  </div>

                  <div className="p-6 space-y-5">
                    {group.keys.map((k) => {
                      const value = getUiValue(k.key, k.type);
                      const desc = configs.find((c) => c.config_key === k.key)?.description;

                      return (
                        <div key={k.key} className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-4 last:border-0 last:pb-0">
                          <div className="flex-1 space-y-1">
                            <span className="text-sm font-bold text-slate-700">{k.label}</span>
                            {desc && <p className="text-xs text-slate-400 font-normal">{desc}</p>}
                          </div>

                          <div className="w-full md:w-64 flex items-center shrink-0">
                            {k.type === "boolean" ? (
                              <select
                                value={value}
                                onChange={(e) => handleInputChange(k.key, e.target.value)}
                                className="w-full border border-slate-300 rounded-xl px-4 py-2.5 bg-slate-50 text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none font-medium"
                              >
                                <option value="true">Có áp dụng (Có)</option>
                                <option value="false">Không áp dụng (Không)</option>
                              </select>
                            ) : (
                              <div className="relative w-full">
                                <input
                                  type="text"
                                  value={value}
                                  onChange={(e) => handleInputChange(k.key, e.target.value)}
                                  className="w-full border border-slate-300 rounded-xl pl-4 pr-12 py-2.5 bg-slate-50 text-slate-800 text-right font-medium focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                                />
                                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-slate-400 font-medium font-mono">
                                  {k.type === "percentage" ? "%" : k.type === "currency" ? "VND" : ""}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default PayrollConfigPage;
