import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAppDispatch } from "@/store/hooks";
import { createLead } from "../store/lead/lead.thunks";
import { CreateLeadDto } from "../dto/lead.dto";
import { FormInput } from "@/components/ui/FormInput";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import { ActionConfirmModal } from "@/components/common";
import { ArrowLeft, Target } from "lucide-react";
import * as leadApi from "../api/lead.api";

export default function LeadCreatePage() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const [form, setForm] = useState<CreateLeadDto>({
    name: "", email: "", phone: "", source: "", source_id: null,
    industry: "", company_size: "",
  });

  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState<{ type: "success" | "error" | "warning"; message: string } | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showDiscard, setShowDiscard] = useState(false);

  const [sourceOptions, setSourceOptions] = useState<{ value: string; label: string; id: number }[]>([]);

  useEffect(() => {
    leadApi.getAllLeadSources()
      .then((res) => {
        const data = res.data.data;
        if (Array.isArray(data)) {
          setSourceOptions(data.map((item: any) => ({
            value: item.name, label: item.name, id: item.id,
          })));
        }
      })
      .catch(() => {});
  }, []);

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.name.trim()) e.name = "Tên Lead là bắt buộc";
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = "Email không hợp lệ";
    if (form.phone && !/^[0-9+\-\s()]+$/.test(form.phone)) e.phone = "SĐT không hợp lệ";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    try {
      setLoading(true);
      const result = await dispatch(createLead(form)).unwrap();
      setAlert({ type: "success", message: "Tạo Lead thành công!" });
      setTimeout(() => navigate(`/crm/leads/${result.id}`), 800);
    } catch (err: any) {
      setAlert({ type: "error", message: typeof err === "string" ? err : "Tạo Lead thất bại" });
      setLoading(false);
    }
  };

  const hasChanges = form.name || form.email || form.phone || form.source;

  const handleCancel = () => {
    if (hasChanges) {
      setShowDiscard(true);
    } else {
      navigate(-1);
    }
  };

  return (
    <div className="page-container">
      <div className="erp-card max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200">
          <div className="flex items-center gap-2.5">
            <button onClick={handleCancel} className="p-1.5 hover:bg-gray-100 rounded-md text-gray-400 hover:text-gray-600">
              <ArrowLeft className="w-4 h-4" />
            </button>
            <span className="w-8 h-8 bg-orange-50 rounded-lg flex items-center justify-center">
              <Target className="w-4 h-4 text-orange-500" />
            </span>
            <h1 className="text-base font-semibold text-gray-900">Tạo Lead mới</h1>
          </div>
        </div>

        <div className="p-5 space-y-5">
          {alert && <Alert type={alert.type} message={alert.message} onClose={() => setAlert(null)} />}

          {/* Thông tin cơ bản */}
          <div>
            <h2 className="text-sm font-semibold text-gray-900 mb-4 pb-2 border-b">Thông tin cơ bản</h2>
            <div className="space-y-4">
              <FormInput
                label="Tên Lead"
                value={form.name}
                onChange={(v) => setForm({ ...form, name: v })}
                placeholder="Nhập tên Lead"
                required
                error={errors.name}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormInput
                  label="Email"
                  type="email"
                  value={form.email || ""}
                  onChange={(v) => setForm({ ...form, email: v })}
                  placeholder="email@example.com"
                  error={errors.email}
                />
                <FormInput
                  label="SĐT"
                  value={form.phone || ""}
                  onChange={(v) => setForm({ ...form, phone: v })}
                  placeholder="+84 123 456 789"
                  error={errors.phone}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormInput
                  label="Ngành"
                  value={form.industry || ""}
                  onChange={(v) => setForm({ ...form, industry: v })}
                  placeholder="VD: Công nghệ, Y tế..."
                />
                <FormInput
                  label="Quy mô"
                  value={form.company_size || ""}
                  onChange={(v) => setForm({ ...form, company_size: v })}
                  placeholder="VD: 1-10, 50-200, 1000+"
                />
              </div>
            </div>
          </div>

          {/* Nguồn Lead */}
          <div>
            <h2 className="text-sm font-semibold text-gray-900 mb-4 pb-2 border-b">Nguồn Lead</h2>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Nguồn</label>
              <select
                value={form.source_id || ""}
                onChange={(e) => {
                  const valId = parseInt(e.target.value);
                  const src = sourceOptions.find((o) => o.id === valId);
                  setForm({ ...form, source_id: valId, source: src?.value || "" });
                }}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none"
              >
                <option value="">-- Chọn nguồn --</option>
                {sourceOptions.map((o) => (
                  <option key={o.id} value={o.id}>{o.label}</option>
                ))}
              </select>
              <p className="text-xs text-gray-400 mt-1">Lead này đến từ đâu?</p>
            </div>
          </div>

          {/* Info box */}
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
            <div className="flex gap-3">
              <div className="flex-shrink-0">
                <svg className="w-5 h-5 text-orange-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
              </div>
              <div>
                <h3 className="text-sm font-medium text-orange-900 mb-1">Điều gì xảy ra tiếp theo?</h3>
                <p className="text-sm text-orange-700">
                  Sau khi tạo Lead, bạn có thể thêm đánh giá, lên lịch hoạt động, và theo dõi tiến trình. Lead sẽ bắt đầu ở giai đoạn "Mới".
                </p>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button variant="outline" onClick={handleCancel} disabled={loading}>
              Hủy
            </Button>
            <Button variant="primary" onClick={handleSubmit} loading={loading}>
              Tạo Lead
            </Button>
          </div>
        </div>
      </div>

      {/* Discard confirmation */}
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
