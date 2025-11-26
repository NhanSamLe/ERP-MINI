// src/features/hrm/components/DepartmentFormModal.tsx
import { useState, useEffect } from "react";
import { DepartmentDTO } from "../dto/department.dto";
import { Branch, fetchBranches } from "../../company/branch.service";
import { X, Building2, Code2, Type, Trash2 } from "lucide-react";

type DepartmentFormState = {
  id?: number;
  branch_id?: number;
  code: string;
  name: string;
};

interface Props {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: DepartmentDTO) => void;
  onDelete?: () => void;
  employeeCount?: number;
  defaultValue?: DepartmentDTO | null;
}

export default function DepartmentFormModal({
  open,
  onClose,
  onSubmit,
  onDelete,
  employeeCount = 0,
  defaultValue,
}: Props) {
  const [form, setForm] = useState<DepartmentFormState>({
    id: undefined,
    branch_id: undefined,
    code: "",
    name: "",
  });

  const [branches, setBranches] = useState<Branch[]>([]);
  const [loadingBranches, setLoadingBranches] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [deleteError, setDeleteError] = useState<string>("");

  useEffect(() => {
    (async () => {
      try {
        setLoadingBranches(true);
        const data = await fetchBranches();
        setBranches(data);
      } finally {
        setLoadingBranches(false);
      }
    })();
  }, []);

  useEffect(() => {
    if (defaultValue) {
      setForm({
        id: defaultValue.id,
        branch_id: defaultValue.branch_id,
        code: defaultValue.code,
        name: defaultValue.name,
      });
    } else {
      setForm({
        id: undefined,
        branch_id: branches[0]?.id,
        code: "",
        name: "",
      });
    }
    setErrors({});
    setDeleteError("");
  }, [defaultValue, branches, open]);

  if (!open) return null;

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!form.branch_id) {
      newErrors.branch_id = "Vui lòng chọn chi nhánh";
    }
    if (!form.code?.trim()) {
      newErrors.code = "Mã phòng ban là bắt buộc";
    }
    if (!form.name?.trim()) {
      newErrors.name = "Tên phòng ban là bắt buộc";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (!validateForm()) return;

    const payload: DepartmentDTO = {
      id: form.id,
      branch_id: form.branch_id!,
      code: form.code.trim(),
      name: form.name.trim(),
    };

    onSubmit(payload);
  };

  const handleDelete = () => {
    if (employeeCount > 0) {
      setDeleteError("Có lỗi xảy ra khi xóa phòng ban");
      return;
    }
    if (onDelete) {
      onDelete();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg transform animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-orange-50 to-white rounded-t-2xl">
          <div>
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <Building2 className="w-5 h-5 text-orange-500" />
              {form.id ? "Chỉnh sửa phòng ban" : "Tạo phòng ban mới"}
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              Quản lý phòng ban trong từng chi nhánh
            </p>
          </div>
          <div className="flex items-center gap-2">
            {form.id && onDelete && (
              <button
                onClick={handleDelete}
                className="text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg p-2 transition-all duration-200"
                title="Xóa phòng ban"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            )}
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg p-2 transition-all duration-200"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Error Message */}
        {deleteError && (
          <div className="px-6 py-3 bg-red-50 border-l-4 border-red-500">
            <p className="text-sm text-red-700">{deleteError}</p>
          </div>
        )}

        {/* Body */}
        <div className="px-6 py-6 space-y-5">
          {/* Branch */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
              <Building2 className="w-4 h-4 text-gray-400" />
              Chi nhánh
              <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <select
                className={`w-full border ${
                  errors.branch_id ? "border-red-300" : "border-gray-200"
                } px-4 py-2.5 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent bg-white hover:border-gray-300 transition-all duration-200 appearance-none cursor-pointer`}
                value={form.branch_id ?? ""}
                onChange={(e) => {
                  setForm({
                    ...form,
                    branch_id: e.target.value ? Number(e.target.value) : undefined,
                  });
                  setErrors({ ...errors, branch_id: "" });
                }}
              >
                <option value="">
                  {loadingBranches ? "Đang tải..." : "Chọn chi nhánh"}
                </option>
                {branches.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.code} — {b.name}
                  </option>
                ))}
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
            {errors.branch_id && (
              <p className="mt-1.5 text-xs text-red-500 flex items-center gap-1">
                <span className="w-1 h-1 bg-red-500 rounded-full"></span>
                {errors.branch_id}
              </p>
            )}
          </div>

          {/* Code */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
              <Code2 className="w-4 h-4 text-gray-400" />
              Mã phòng ban
              <span className="text-red-500">*</span>
            </label>
            <input
              className={`w-full border ${
                errors.code ? "border-red-300" : "border-gray-200"
              } px-4 py-2.5 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent hover:border-gray-300 transition-all duration-200`}
              placeholder="VD: HR, IT, SALE..."
              value={form.code}
              onChange={(e) => {
                setForm({ ...form, code: e.target.value.toUpperCase() });
                setErrors({ ...errors, code: "" });
              }}
              maxLength={20}
            />
            {errors.code && (
              <p className="mt-1.5 text-xs text-red-500 flex items-center gap-1">
                <span className="w-1 h-1 bg-red-500 rounded-full"></span>
                {errors.code}
              </p>
            )}
          </div>

          {/* Name */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
              <Type className="w-4 h-4 text-gray-400" />
              Tên phòng ban
              <span className="text-red-500">*</span>
            </label>
            <input
              className={`w-full border ${
                errors.name ? "border-red-300" : "border-gray-200"
              } px-4 py-2.5 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent hover:border-gray-300 transition-all duration-200`}
              placeholder="Human Resource, Sales Department..."
              value={form.name}
              onChange={(e) => {
                setForm({ ...form, name: e.target.value });
                setErrors({ ...errors, name: "" });
              }}
              maxLength={100}
            />
            {errors.name && (
              <p className="mt-1.5 text-xs text-red-500 flex items-center gap-1">
                <span className="w-1 h-1 bg-red-500 rounded-full"></span>
                {errors.name}
              </p>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-3 bg-gray-50 rounded-b-2xl">
          <button
            className="px-5 py-2.5 text-sm font-medium border border-gray-300 rounded-xl hover:bg-white hover:shadow-sm transition-all duration-200 text-gray-700"
            onClick={onClose}
          >
            Hủy bỏ
          </button>
          <button
            className="px-5 py-2.5 text-sm font-medium rounded-xl bg-gradient-to-r from-orange-500 to-orange-600 text-white hover:from-orange-600 hover:to-orange-700 shadow-lg shadow-orange-500/30 hover:shadow-xl hover:shadow-orange-500/40 transition-all duration-200"
            onClick={handleSubmit}
          >
            {form.id ? "Lưu thay đổi" : "Tạo mới"}
          </button>
        </div>
      </div>
    </div>
  );
}
