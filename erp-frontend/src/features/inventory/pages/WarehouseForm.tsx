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
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/input";

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

  if (mode === "edit" && loading) {
    return (
      <div className="min-h-[400px] flex items-center justify-center bg-slate-50/50">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-sm font-medium text-slate-500">Loading warehouse details...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto py-4">
      <Card className="border-slate-100 shadow-sm overflow-hidden bg-white/80 backdrop-blur-md">
        <CardHeader className="pb-6 border-b border-slate-50 bg-slate-50/20">
          <div>
            <CardTitle className="text-xl font-bold text-slate-900">
              {mode === "create" ? "Create Warehouse" : "Edit Warehouse"}
            </CardTitle>
            <CardDescription className="text-sm text-gray-500 mt-1">
              Enter the required information to configure the warehouse
            </CardDescription>
          </div>
        </CardHeader>
        
        <CardContent className="p-6 space-y-6">
          {/* Form Fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Branch */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Branch</label>
              <select
                className="w-full h-10 border border-slate-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-orange-400 transition"
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
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Code</label>
              <Input
                className="border-slate-200 focus:ring-orange-400 focus:border-orange-400"
                value={form.code}
                onChange={(val) => setForm({ ...form, code: val })}
                placeholder="e.g. WH-HCM-01"
              />
            </div>

            {/* Name */}
            <div className="md:col-span-2 flex flex-col gap-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Name</label>
              <Input
                className="border-slate-200 focus:ring-orange-400 focus:border-orange-400"
                value={form.name}
                onChange={(val) => setForm({ ...form, name: val })}
                placeholder="e.g. Ho Chi Minh Central Warehouse"
              />
            </div>

            {/* Address */}
            <div className="md:col-span-2 flex flex-col gap-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Address</label>
              <Input
                className="border-slate-200 focus:ring-orange-400 focus:border-orange-400"
                value={form.address ?? ""}
                onChange={(val) => setForm({ ...form, address: val })}
                placeholder="e.g. 123 Nguyen Hue Street, District 1, HCMC"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <Button
              variant="outline"
              onClick={() => nav("/inventory/warehouses")}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={save}
              loading={saving}
            >
              {mode === "create" ? "Create Warehouse" : "Save Changes"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
