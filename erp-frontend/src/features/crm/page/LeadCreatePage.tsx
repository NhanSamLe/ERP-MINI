import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAppDispatch } from "@/store/hooks";
import { createLead } from "../store/lead/lead.thunks";
import { CreateLeadDto } from "../dto/lead.dto";
import { Button } from "@/components/ui/Button";
import { toast } from "react-toastify";
import { ActionConfirmModal } from "@/components/common";
import {
  ArrowLeft, Target, User, Mail, Phone,
  Building2, Briefcase, BarChart3, TrendingUp, Layers, Zap,
} from "lucide-react";
import * as leadApi from "../api/lead.api";
import { formatNumberInput, parseNumberInput } from "@/utils/currency.helper";

// ─── Reusable field wrapper ───────────────────────────────────────────────────

function Field({
  label, required, error, hint, children,
}: {
  label: string;
  required?: boolean;
  error?: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs font-medium text-gray-600">
        {label}
        {required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      {children}
      {error && <p className="text-xs text-red-500 flex items-center gap-1">{error}</p>}
      {hint && !error && <p className="text-xs text-gray-400">{hint}</p>}
    </div>
  );
}

const inputCls = (hasErr?: boolean) =>
  [
    "w-full h-9 px-3 text-sm rounded-lg border bg-white text-gray-800 placeholder:text-gray-350",
    "focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent transition-shadow",
    hasErr ? "border-red-400 bg-red-50" : "border-gray-300 hover:border-gray-400",
  ].join(" ");

const iconWrapCls = "absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none";

// ─── Component ────────────────────────────────────────────────────────────────

export default function LeadCreatePage() {
  const dispatch  = useAppDispatch();
  const navigate  = useNavigate();

  const [form, setForm] = useState<CreateLeadDto>({
    name: "", email: "", phone: "", source: "", source_id: null,
    company_name: "", job_title: "", industry: "", company_size: "", annual_revenue: null,
  });

  const [loading, setLoading]       = useState(false);

  const [errors, setErrors]         = useState<Record<string, string>>({});
  const [showDiscard, setShowDiscard] = useState(false);
  const [sourceOptions, setSourceOptions] = useState<{ id: number; label: string }[]>([]);
  const [revenueDisplay, setRevenueDisplay] = useState("");

  useEffect(() => {
    leadApi.getAllLeadSources()
      .then((res) => {
        const data = res.data.data;
        if (Array.isArray(data))
          setSourceOptions(data.map((item: any) => ({ id: item.id, label: item.name })));
      })
      .catch(() => {});
  }, []);

  const set = (key: keyof CreateLeadDto) => (v: string) =>
    setForm((prev) => ({ ...prev, [key]: v }));

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.name.trim())
      e.name = "Tên Lead là bắt buộc";
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
      e.email = "Email không hợp lệ";
    if (form.phone && !/^[0-9+\-\s()]+$/.test(form.phone))
      e.phone = "Số điện thoại không hợp lệ";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      const result = await dispatch(createLead(form)).unwrap();
      toast.success("Tạo Lead thành công!");
      setTimeout(() => navigate(`/crm/leads/${result.id}`), 800);
    } catch (err: any) {
      toast.error(typeof err === "string" ? err : "Tạo Lead thất bại");
      setLoading(false);
    }
  };

  const hasChanges = !!(form.name || form.email || form.phone || form.company_name ||
    form.job_title || form.industry || form.company_size || form.annual_revenue);

  const handleCancel = () => (hasChanges ? setShowDiscard(true) : navigate(-1));

  return (
    <div className="page-container">
      <div className="max-w-2xl mx-auto">

        {/* ── Card ── */}
        <div className="erp-card overflow-hidden">

          {/* ── Header ── */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <button
                onClick={handleCancel}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
              <div className="w-8 h-8 bg-orange-50 rounded-lg flex items-center justify-center">
                <Target className="w-4 h-4 text-orange-500" />
              </div>
              <div>
                <h1 className="text-sm font-semibold text-gray-900">Tạo Lead mới</h1>
                <p className="text-xs text-gray-400">Điền thông tin để thêm khách hàng tiềm năng</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={handleCancel} disabled={loading}>
                Hủy
              </Button>
              <Button variant="primary" size="sm" onClick={handleSubmit} loading={loading}>
                Tạo Lead
              </Button>
            </div>
          </div>

          <div className="p-6 space-y-6">
            {/* ── Section: Thông tin liên hệ ── */}
            <section>
              <div className="flex items-center gap-2 mb-4">
                <User className="w-3.5 h-3.5 text-orange-500" />
                <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Thông tin liên hệ
                </h2>
              </div>

              <div className="space-y-4">
                {/* Tên Lead — full width */}
                <Field label="Tên Lead" required error={errors.name}>
                  <div className="relative">
                    <User className={`${iconWrapCls} w-3.5 h-3.5`} />
                    <input
                      type="text"
                      value={form.name}
                      onChange={(e) => set("name")(e.target.value)}
                      placeholder="Nguyễn Văn A"
                      className={inputCls(!!errors.name) + " pl-8"}
                    />
                  </div>
                </Field>

                {/* Email | SĐT */}
                <div className="grid grid-cols-2 gap-4">
                  <Field label="Email" error={errors.email}>
                    <div className="relative">
                      <Mail className={`${iconWrapCls} w-3.5 h-3.5`} />
                      <input
                        type="email"
                        value={form.email || ""}
                        onChange={(e) => set("email")(e.target.value)}
                        placeholder="email@example.com"
                        className={inputCls(!!errors.email) + " pl-8"}
                      />
                    </div>
                  </Field>
                  <Field label="Số điện thoại" error={errors.phone}>
                    <div className="relative">
                      <Phone className={`${iconWrapCls} w-3.5 h-3.5`} />
                      <input
                        type="tel"
                        value={form.phone || ""}
                        onChange={(e) => set("phone")(e.target.value)}
                        placeholder="0901 234 567"
                        className={inputCls(!!errors.phone) + " pl-8"}
                      />
                    </div>
                  </Field>
                </div>
              </div>
            </section>

            {/* ── Divider ── */}
            <div className="border-t border-gray-100" />

            {/* ── Section: Thông tin công ty ── */}
            <section>
              <div className="flex items-center gap-2 mb-4">
                <Building2 className="w-3.5 h-3.5 text-orange-500" />
                <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Thông tin công ty
                </h2>
              </div>

              <div className="space-y-4">
                {/* Tên công ty | Chức vụ */}
                <div className="grid grid-cols-2 gap-4">
                  <Field label="Tên công ty">
                    <div className="relative">
                      <Building2 className={`${iconWrapCls} w-3.5 h-3.5`} />
                      <input
                        type="text"
                        value={form.company_name || ""}
                        onChange={(e) => set("company_name")(e.target.value)}
                        placeholder="Công ty ABC"
                        className={inputCls() + " pl-8"}
                      />
                    </div>
                  </Field>
                  <Field label="Chức vụ">
                    <div className="relative">
                      <Briefcase className={`${iconWrapCls} w-3.5 h-3.5`} />
                      <input
                        type="text"
                        value={form.job_title || ""}
                        onChange={(e) => set("job_title")(e.target.value)}
                        placeholder="Giám đốc, Trưởng phòng..."
                        className={inputCls() + " pl-8"}
                      />
                    </div>
                  </Field>
                </div>

                {/* Ngành | Quy mô */}
                <div className="grid grid-cols-2 gap-4">
                  <Field label="Ngành nghề">
                    <div className="relative">
                      <Layers className={`${iconWrapCls} w-3.5 h-3.5`} />
                      <input
                        type="text"
                        value={form.industry || ""}
                        onChange={(e) => set("industry")(e.target.value)}
                        placeholder="Công nghệ, Y tế, Tài chính..."
                        className={inputCls() + " pl-8"}
                      />
                    </div>
                  </Field>
                  <Field label="Quy mô công ty">
                    <div className="relative">
                      <BarChart3 className={`${iconWrapCls} w-3.5 h-3.5`} />
                      <input
                        type="text"
                        value={form.company_size || ""}
                        onChange={(e) => set("company_size")(e.target.value)}
                        placeholder="1–10, 50–200, 1000+ người"
                        className={inputCls() + " pl-8"}
                      />
                    </div>
                  </Field>
                </div>

                {/* Doanh thu | Nguồn Lead */}
                <div className="grid grid-cols-2 gap-4">
                  <Field label="Doanh thu hàng năm (VNĐ)">
                    <div className="relative">
                      <TrendingUp className={`${iconWrapCls} w-3.5 h-3.5`} />
                      <input
                        type="text"
                        inputMode="numeric"
                        value={revenueDisplay}
                        onChange={(e) => {
                          const formatted = formatNumberInput(e.target.value);
                          setRevenueDisplay(formatted);
                          setForm((p) => ({ ...p, annual_revenue: parseNumberInput(formatted) }));
                        }}
                        onBlur={() => {
                          if (form.annual_revenue != null)
                            setRevenueDisplay(formatNumberInput(form.annual_revenue));
                        }}
                        placeholder="5.000.000.000"
                        className={inputCls() + " pl-8"}
                      />
                    </div>
                  </Field>
                  <Field label="Nguồn Lead" hint="Lead này đến từ đâu?">
                    <div className="relative">
                      <Zap className={`${iconWrapCls} w-3.5 h-3.5`} />
                      <select
                        value={form.source_id ?? ""}
                        onChange={(e) => {
                          const id  = e.target.value ? parseInt(e.target.value) : null;
                          const src = sourceOptions.find((o) => o.id === id);
                          setForm((p) => ({ ...p, source_id: id, source: src?.label || "" }));
                        }}
                        className={inputCls() + " pl-8 cursor-pointer appearance-none"}
                      >
                        <option value="">-- Chọn nguồn --</option>
                        {sourceOptions.map((o) => (
                          <option key={o.id} value={o.id}>{o.label}</option>
                        ))}
                      </select>
                    </div>
                  </Field>
                </div>
              </div>
            </section>
          </div>
        </div>
      </div>

      <ActionConfirmModal
        isOpen={showDiscard}
        onClose={() => setShowDiscard(false)}
        title="Hủy thay đổi"
        description="Bạn có thay đổi chưa lưu. Bạn có chắc chắn muốn hủy?"
        confirmText="Hủy"
        variant="danger"
        onConfirm={() => { setShowDiscard(false); navigate(-1); }}
      />
    </div>
  );
}
