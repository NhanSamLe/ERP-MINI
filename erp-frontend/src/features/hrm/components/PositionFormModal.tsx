import { useEffect, useState } from "react";
import type { PositionDTO } from "../dto/position.dto";
import { Branch, fetchBranches } from "../../company/branch.service";

interface Props {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: PositionDTO) => void;
  defaultValue?: PositionDTO | null;
}

type PositionFormState = {
  id?: number;
  branch_id?: number;
  name: string;
};

export default function PositionFormModal({
  open,
  onClose,
  onSubmit,
  defaultValue,
}: Props) {
  const [form, setForm] = useState<PositionFormState>({
    id: undefined,
    branch_id: undefined,
    name: "",
  });

  const [branches, setBranches] = useState<Branch[]>([]);
  const [loadingBranches, setLoadingBranches] = useState(false);

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
  // Chỉ xử lý khi modal đang mở
  if (!open) return;

  if (defaultValue) {
    // Edit mode
    setForm({
      id: defaultValue.id,
      branch_id: defaultValue.branch_id,
      name: defaultValue.name,
    });
  } else {
    // Create mode: reset form
    setForm({
      id: undefined,
      branch_id: branches[0]?.id,
      name: "",
    });
  }
}, [open, defaultValue, branches]);


  if (!open) return null;

  const handleSubmit = () => {
  if (!form.branch_id) {
    alert("Vui lòng chọn chi nhánh");
    return;
  }
  if (!form.name.trim()) {
    alert("Tên chức danh là bắt buộc");
    return;
  }

  // ✅ Tạo payload DTO, KHÔNG set id cho create
  const payload: PositionDTO = {
    branch_id: form.branch_id!,
    name: form.name.trim(),
  };

  // Nếu đang edit (có id) thì mới gán id vào
  if (form.id !== undefined) {
    payload.id = form.id;
  }

  onSubmit(payload);
};



  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg">
        {/* Header */}
        <div className="px-6 py-4 border-b flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold">
              {form.id ? "Edit Position" : "Create Position"}
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">
              Quản lý chức danh theo từng chi nhánh
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-xl leading-none"
          >
            ×
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-4 space-y-4">
          {/* Branch */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Branch
            </label>
            <select
              className="w-full border px-3 py-2 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-orange-400"
              value={form.branch_id ?? ""}
              onChange={(e) =>
                setForm({
                  ...form,
                  branch_id: e.target.value ? Number(e.target.value) : undefined,
                })
              }
            >
              <option value="">
                {loadingBranches ? "Loading branches..." : "Select a branch"}
              </option>
              {branches.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.code} — {b.name}
                </option>
              ))}
            </select>
          </div>

          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Position Name
            </label>
            <input
              className="w-full border px-3 py-2 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-orange-400"
              placeholder="VD: Nhân viên kinh doanh, Kế toán trưởng..."
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t flex justify-end gap-2 bg-gray-50 rounded-b-2xl">
          <button
            className="px-4 py-2 text-sm border rounded-lg hover:bg-white"
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            className="px-4 py-2 text-sm rounded-lg bg-orange-500 text-white hover:bg-orange-600 shadow-sm"
            onClick={handleSubmit}
          >
            {form.id ? "Save changes" : "Create"}
          </button>
        </div>
      </div>
    </div>
  );
}
