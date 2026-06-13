import React, { useEffect, useState } from "react";
import { GlAccountDTO, GlAccountType } from "../dto/glAccount.dto";

interface Props {
  open: boolean;
  initialValue?: GlAccountDTO | null;
  accounts: GlAccountDTO[];
  loading?: boolean;
  onCancel: () => void;
  onSubmit: (data: GlAccountDTO) => void;
}

const ACCOUNT_TYPES: { value: GlAccountType; label: string }[] = [
  { value: "asset", label: "Tài sản" },
  { value: "liability", label: "Nợ phải trả" },
  { value: "equity", label: "Vốn chủ sở hữu" },
  { value: "revenue", label: "Doanh thu" },
  { value: "expense", label: "Chi phí" },
];

const GlAccountFormModal: React.FC<Props> = ({
  open,
  initialValue,
  accounts,
  loading,
  onCancel,
  onSubmit,
}) => {
  const [formData, setFormData] = useState<GlAccountDTO>({
    code: "",
    name: "",
    type: "asset",
    normal_side: "debit",
    parent_id: null,
  });

  useEffect(() => {
    if (initialValue) {
      setFormData({
        ...initialValue,
        parent_id: initialValue.parent_id ?? null,
      });
    } else {
      setFormData({
        code: "",
        name: "",
        type: "asset",
        normal_side: "debit",
        parent_id: null,
      });
    }
  }, [initialValue, open]);

  if (!open) return null;

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === "parent_id" ? (value ? Number(value) : null) : value,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-xl shadow-lg w-full max-w-lg p-6">
        <h2 className="text-xl font-semibold mb-4">
          {initialValue ? "Sửa tài khoản" : "Thêm tài khoản mới"}
        </h2>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div>
            <label className="block text-sm font-medium mb-1">Mã tài khoản</label>
            <input
              name="code"
              value={formData.code}
              onChange={handleChange}
              className="w-full border rounded-md px-3 py-2"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Tên tài khoản
            </label>
            <input
              name="name"
              value={formData.name}
              onChange={handleChange}
              className="w-full border rounded-md px-3 py-2"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Tài khoản cha</label>
            <select
              name="parent_id"
              value={formData.parent_id ?? ""}
              onChange={handleChange}
              className="w-full border rounded-md px-3 py-2"
            >
              <option value="">-- Không có tài khoản cha --</option>
              {accounts
                .filter((acc) => acc.id !== initialValue?.id)
                .map((acc) => (
                  <option key={acc.id} value={acc.id}>
                    {acc.code} - {acc.name}
                  </option>
                ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Loại tài khoản</label>
              <select
                name="type"
                value={formData.type}
                onChange={handleChange}
                className="w-full border rounded-md px-3 py-2"
              >
                {ACCOUNT_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Bên phát sinh mặc định
              </label>
              <select
                name="normal_side"
                value={formData.normal_side}
                onChange={handleChange}
                className="w-full border rounded-md px-3 py-2"
              >
                <option value="debit">Nợ</option>
                <option value="credit">Có</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 rounded-md border"
              disabled={loading}
            >
              Hủy
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-md bg-orange-600 text-white font-medium hover:bg-orange-700 transition"
              disabled={loading}
            >
              {loading ? "Đang lưu..." : "Lưu"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default GlAccountFormModal;
