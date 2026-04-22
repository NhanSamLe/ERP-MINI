import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { AppDispatch, RootState } from "../../../store/store";
import {
  fetchPhysicalInventoriesThunk,
  createPhysicalInventoryThunk,
} from "../store";
import { fetchWarehousesThunk } from "../store/stock/warehouse/warehouse.thunks";
import { Button } from "../../../components/ui/Button";
import { Input } from "../../../components/ui/input";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "../../../components/ui/Select";
import { PhysicalInventory } from "../api/physicalInventory.api";
import { toast } from "react-toastify";
import { formatDateTime } from "@/utils/time.helper";
import { Plus, Eye } from "lucide-react";

const statusColors: Record<string, string> = {
  draft: "bg-gray-100 text-gray-700",
  in_progress: "bg-blue-100 text-blue-700",
  validated: "bg-green-100 text-green-700",
  cancelled: "bg-red-100 text-red-700",
};

export default function PhysicalInventoryListPage() {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();

  const { items, loading } = useSelector(
    (state: RootState) => state.physicalInventory,
  );
  const warehouses = useSelector((state: RootState) => state.warehouse.items);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [createForm, setCreateForm] = useState({
    warehouse_id: "",
    inv_date: "",
  });
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    dispatch(fetchPhysicalInventoriesThunk());
    dispatch(fetchWarehousesThunk());
  }, [dispatch]);

  const filtered = items.filter((inv) => {
    const matchSearch =
      !search ||
      inv.inv_no.toLowerCase().includes(search.toLowerCase()) ||
      inv.warehouse?.name?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = !statusFilter || inv.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const handleCreate = async () => {
    if (!createForm.warehouse_id || !createForm.inv_date) {
      toast.error("Please fill in all required fields");
      return;
    }
    setCreating(true);
    try {
      const result = await dispatch(
        createPhysicalInventoryThunk({
          warehouse_id: Number(createForm.warehouse_id),
          inv_date: createForm.inv_date,
        }),
      ).unwrap();
      toast.success("Physical inventory created");
      setShowCreate(false);
      setCreateForm({ warehouse_id: "", inv_date: "" });
      navigate(`/inventory/physical-inventories/${result.id}`);
    } catch (err: any) {
      toast.error(err);
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="p-6 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">
            Physical Inventory
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage periodic stock count sessions
          </p>
        </div>
        <Button
          className="bg-orange-500 hover:bg-orange-600 text-white flex items-center gap-2"
          onClick={() => setShowCreate(true)}
        >
          <Plus className="w-4 h-4" />
          New Inventory
        </Button>
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <Input
          value={search}
          onChange={setSearch}
          placeholder="Search by inv no or warehouse..."
          className="w-64"
        />
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-44">
            <SelectValue placeholder="All statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
            <SelectItem value="in_progress">In Progress</SelectItem>
            <SelectItem value="validated">Validated</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left text-xs uppercase tracking-wide text-gray-600">
            <tr>
              <th className="p-3">Inv No</th>
              <th className="p-3">Warehouse</th>
              <th className="p-3">Date</th>
              <th className="p-3">Status</th>
              <th className="p-3">Created By</th>
              <th className="p-3">Created At</th>
              <th className="p-3 w-20"></th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={7} className="p-6 text-center text-gray-400">
                  Loading...
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td
                  colSpan={7}
                  className="p-6 text-center text-gray-400 italic"
                >
                  No records found
                </td>
              </tr>
            ) : (
              filtered.map((inv: PhysicalInventory, idx) => (
                <tr
                  key={inv.id}
                  className={`border-t hover:bg-blue-50 transition-colors cursor-pointer ${idx % 2 === 0 ? "bg-white" : "bg-gray-50"}`}
                  onClick={() =>
                    navigate(`/inventory/physical-inventories/${inv.id}`)
                  }
                >
                  <td className="p-3 font-mono font-medium text-gray-800">
                    {inv.inv_no}
                  </td>
                  <td className="p-3">{inv.warehouse?.name ?? "—"}</td>
                  <td className="p-3">{inv.inv_date}</td>
                  <td className="p-3">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium capitalize ${statusColors[inv.status]}`}
                    >
                      {inv.status.replace("_", " ")}
                    </span>
                  </td>
                  <td className="p-3">{inv.creator?.full_name ?? "—"}</td>
                  <td className="p-3 text-gray-500">
                    {formatDateTime(inv.created_at ?? "")}
                  </td>
                  <td className="p-3">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/inventory/physical-inventories/${inv.id}`);
                      }}
                      className="text-blue-600 hover:text-blue-800"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Create Modal */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-md">
            <h2 className="text-lg font-semibold mb-4">
              New Physical Inventory
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">
                  Warehouse <span className="text-red-500">*</span>
                </label>
                <Select
                  value={createForm.warehouse_id}
                  onValueChange={(v) =>
                    setCreateForm((p) => ({ ...p, warehouse_id: v }))
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select warehouse" />
                  </SelectTrigger>
                  <SelectContent>
                    {warehouses.map((w) => (
                      <SelectItem key={w.id} value={String(w.id)}>
                        {w.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Inventory Date <span className="text-red-500">*</span>
                </label>
                <Input
                  type="date"
                  value={createForm.inv_date}
                  onChange={(v) =>
                    setCreateForm((p) => ({ ...p, inv_date: v }))
                  }
                  max={new Date().toISOString().split("T")[0]}
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <Button
                variant="secondary"
                onClick={() => setShowCreate(false)}
                disabled={creating}
              >
                Cancel
              </Button>
              <Button
                className="bg-orange-500 hover:bg-orange-600 text-white"
                onClick={handleCreate}
                disabled={creating}
              >
                {creating ? "Creating..." : "Create"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
