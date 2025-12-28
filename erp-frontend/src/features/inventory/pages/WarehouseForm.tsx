import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "../../../store/store";
import { fetchAllBranchesThunk } from "../../company/store/branch.thunks";
import {
  fetchWarehouseByIdThunk,
  createWarehouseThunk,
  updateWarehouseThunk,
} from "../store/stock/warehouse/warehouse.thunks";
import { WarehouseDTO } from "../store/stock/warehouse/warehouse.types";
import { toast } from "react-toastify";
import { getErrorMessage } from "@/utils/ErrorHelper";

export default function WarehouseForm({ mode }: { mode: "create" | "edit" }) {
  const nav = useNavigate();
  const { id } = useParams();
  const dispatch = useDispatch<AppDispatch>();
  const [saving, setSaving] = useState(false);

  const { selectedItem, loading } = useSelector(
    (state: RootState) => state.warehouse
  );

  const branches = useSelector((state: RootState) => state.branch.branches);

  const [form, setForm] = useState<WarehouseDTO>({
    branch_id: 0,
    code: "",
    name: "",
    address: "",
  });

  useEffect(() => {
    dispatch(fetchAllBranchesThunk());
  }, [dispatch]);

  // load warehouse khi edit
  useEffect(() => {
    if (mode === "edit" && id) {
      dispatch(fetchWarehouseByIdThunk(Number(id)));
    }
  }, [mode, id, dispatch]);

  // đổ data vào form
  useEffect(() => {
    if (mode === "edit" && selectedItem) {
      setForm({
        branch_id: selectedItem.branch_id,
        code: selectedItem.code,
        name: selectedItem.name,
        address: selectedItem.address ?? "",
      });
    }
  }, [mode, selectedItem]);

  const save = async () => {
    if (!form.code?.trim() || !form.name?.trim()) {
      toast.error("Code & Name are required");
      return;
    }
    setSaving(true);
    try {
      if (mode === "create") {
        await dispatch(createWarehouseThunk(form)).unwrap();
        toast.success("Warehouse created successfully!");
      } else if (id) {
        await dispatch(
          updateWarehouseThunk({ id: Number(id), data: form })
        ).unwrap();
        toast.success("Warehouse updated successfully!");
      }
      nav("/inventory/warehouses");
    } catch (error) {
      console.log(">>> Error caught:", error);
      toast.error(getErrorMessage(error));
    } finally {
      setSaving(false);
    }
  };

  if (mode === "edit" && loading) return <div>Loading...</div>;

  return (
    <div className="max-w-3xl mx-auto bg-white border border-gray-200 rounded-xl p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold">
          {mode === "create" ? "Create Warehouse" : "Edit Warehouse"}
        </h1>
        <p className="text-sm text-gray-500">Warehouse Information</p>
      </div>

      {/* Form */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Branch ID */}
        <div>
          <label className="block text-sm text-gray-600 mb-1">Branch</label>
          <select
            className="w-full border rounded-lg px-3 py-2 text-sm"
            value={form.branch_id ?? ""}
            onChange={(e) =>
              setForm({ ...form, branch_id: Number(e.target.value) })
            }
          >
            <option value="">Select branch</option>
            {branches.map((b) => (
              <option key={b.id} value={b.id}>
                {b.code} - {b.name}
              </option>
            ))}
          </select>
        </div>

        {/* Code */}
        <div>
          <label className="block text-sm text-gray-600 mb-1">Code</label>
          <input
            className="w-full border rounded-lg px-3 py-2 text-sm"
            value={form.code}
            onChange={(e) => setForm({ ...form, code: e.target.value })}
            placeholder="VD: WH-HCM-01"
          />
        </div>

        {/* Name */}
        <div className="md:col-span-2">
          <label className="block text-sm text-gray-600 mb-1">Name</label>
          <input
            className="w-full border rounded-lg px-3 py-2 text-sm"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="VD: Kho HCM Trung Tâm"
          />
        </div>

        {/* Address */}
        <div className="md:col-span-2">
          <label className="block text-sm text-gray-600 mb-1">Address</label>
          <input
            className="w-full border rounded-lg px-3 py-2 text-sm"
            value={form.address ?? ""}
            onChange={(e) => setForm({ ...form, address: e.target.value })}
            placeholder="Địa chỉ kho"
          />
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3">
        <button
          onClick={save}
          disabled={saving}
          className={`px-4 py-2 rounded-lg text-sm font-medium text-white
    ${
      saving
        ? "bg-orange-300 cursor-not-allowed"
        : "bg-orange-500 hover:bg-orange-600"
    }`}
        >
          {saving ? "Saving..." : mode === "create" ? "Create" : "Save changes"}
        </button>

        <button
          onClick={() => nav("/inventory/warehouses")}
          disabled={saving}
          className="border px-4 py-2 rounded-lg text-sm disabled:opacity-50"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
