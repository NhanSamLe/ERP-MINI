import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "../../../store/store";
import {
  fetchLocationTreeThunk,
  fetchLocationsThunk,
  createLocationThunk,
  updateLocationThunk,
  deleteLocationThunk,
} from "../store/stock/stocklocation/stockLocation.thunks";
import { StockLocation, StockLocationType } from "../api/stockLocation.api";
import { fetchWarehousesThunk } from "../store/stock/warehouse/warehouse.thunks";
import {
  MapPin,
  Plus,
  ChevronRight,
  ChevronDown,
  Pencil,
  Trash2,
  ToggleLeft,
  ToggleRight,
  X,
  Warehouse,
} from "lucide-react";
import { toast } from "react-toastify";

// ─── Type badge ───────────────────────────────────────────────────────────────
const TYPE_LABELS: Record<StockLocationType, string> = {
  view: "View",
  internal: "Internal",
  input: "Input",
  output: "Output",
  customer: "Customer",
  supplier: "Supplier",
  transit: "Transit",
};
const TYPE_COLORS: Record<StockLocationType, string> = {
  view: "bg-gray-100 text-gray-600",
  internal: "bg-blue-100 text-blue-700",
  input: "bg-green-100 text-green-700",
  output: "bg-orange-100 text-orange-700",
  customer: "bg-purple-100 text-purple-700",
  supplier: "bg-yellow-100 text-yellow-700",
  transit: "bg-teal-100 text-teal-700",
};

// ─── Tree node component ──────────────────────────────────────────────────────
function TreeNode({
  node,
  depth,
  selectedId,
  onSelect,
  onEdit,
  onDelete,
  onToggleActive,
}: {
  node: StockLocation;
  depth: number;
  selectedId: number | null;
  onSelect: (loc: StockLocation) => void;
  onEdit: (loc: StockLocation) => void;
  onDelete: (loc: StockLocation) => void;
  onToggleActive: (loc: StockLocation) => void;
}) {
  const [expanded, setExpanded] = useState(true);
  const hasChildren = node.children && node.children.length > 0;

  return (
    <div>
      <div
        className={`flex items-center gap-1 px-2 py-1.5 rounded-lg cursor-pointer group transition ${
          selectedId === Number(node.id)
            ? "bg-orange-50 border border-orange-200"
            : "hover:bg-gray-50"
        }`}
        style={{ paddingLeft: `${depth * 16 + 8}px` }}
        onClick={() => onSelect(node)}
      >
        {/* Expand toggle */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            setExpanded((v) => !v);
          }}
          className="w-4 h-4 flex items-center justify-center text-gray-400 shrink-0"
        >
          {hasChildren ? (
            expanded ? (
              <ChevronDown className="w-3.5 h-3.5" />
            ) : (
              <ChevronRight className="w-3.5 h-3.5" />
            )
          ) : (
            <span className="w-3.5 h-3.5" />
          )}
        </button>

        <MapPin
          className={`w-3.5 h-3.5 shrink-0 ${node.is_active ? "text-orange-400" : "text-gray-300"}`}
        />

        <span
          className={`text-sm flex-1 truncate ${node.is_active ? "text-gray-800" : "text-gray-400 line-through"}`}
        >
          {node.name}
        </span>

        <span className="text-xs text-gray-400 font-mono shrink-0">
          {node.code}
        </span>

        <span
          className={`text-xs px-1.5 py-0.5 rounded font-medium shrink-0 ${TYPE_COLORS[node.type]}`}
        >
          {TYPE_LABELS[node.type]}
        </span>

        {/* Actions — show on hover */}
        <div className="hidden group-hover:flex items-center gap-1 ml-1 shrink-0">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggleActive(node);
            }}
            className="p-1 rounded hover:bg-gray-200 text-gray-500 transition"
            title={node.is_active ? "Deactivate" : "Activate"}
          >
            {node.is_active ? (
              <ToggleRight className="w-3.5 h-3.5 text-green-500" />
            ) : (
              <ToggleLeft className="w-3.5 h-3.5 text-gray-400" />
            )}
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onEdit(node);
            }}
            className="p-1 rounded hover:bg-blue-50 text-blue-500 transition"
          >
            <Pencil className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete(node);
            }}
            className="p-1 rounded hover:bg-red-50 text-red-500 transition"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {hasChildren && expanded && (
        <div>
          {node.children!.map((child) => (
            <TreeNode
              key={child.id}
              node={child}
              depth={depth + 1}
              selectedId={selectedId}
              onSelect={onSelect}
              onEdit={onEdit}
              onDelete={onDelete}
              onToggleActive={onToggleActive}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Location Form Modal ──────────────────────────────────────────────────────
interface LocationFormProps {
  mode: "create" | "edit";
  initial?: StockLocation | null;
  warehouseId: number;
  locations: StockLocation[]; // flat list for parent select
  onClose: () => void;
  onSave: (data: any) => Promise<void>;
}

function LocationFormModal({
  mode,
  initial,
  warehouseId,
  locations,
  onClose,
  onSave,
}: LocationFormProps) {
  const [form, setForm] = useState({
    name: initial?.name || "",
    code: initial?.code || "",
    type: (initial?.type || "internal") as StockLocationType,
    parent_id: initial?.parent_id ? String(initial.parent_id) : "",
    is_active: initial?.is_active !== false,
  });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.code.trim()) {
      toast.error("Name and code are required");
      return;
    }
    setSaving(true);
    try {
      await onSave({
        warehouse_id: warehouseId,
        name: form.name.trim(),
        code: form.code.trim().toUpperCase(),
        type: form.type,
        parent_id: form.parent_id ? Number(form.parent_id) : null,
        is_active: form.is_active,
      });
      onClose();
    } catch (err: any) {
      toast.error(
        err?.response?.data?.message || err.message || "Failed to save",
      );
    } finally {
      setSaving(false);
    }
  };

  // Filter out self and descendants from parent options
  const parentOptions = locations.filter((l) => {
    if (!initial) return true;
    return Number(l.id) !== Number(initial.id);
  });

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg">
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <h2 className="text-lg font-semibold text-gray-800">
            {mode === "create" ? "Add Location" : "Edit Location"}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Name <span className="text-red-500">*</span>
              </label>
              <input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-orange-400 focus:outline-none"
                placeholder="e.g. Shelf A1"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Code <span className="text-red-500">*</span>
              </label>
              <input
                value={form.code}
                onChange={(e) =>
                  setForm({ ...form, code: e.target.value.toUpperCase() })
                }
                className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-orange-400 focus:outline-none font-mono"
                placeholder="e.g. SHELF-A1"
                disabled={mode === "edit"}
              />
              {mode === "edit" && (
                <p className="text-xs text-gray-400 mt-1">
                  Code cannot be changed
                </p>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Type
            </label>
            <select
              value={form.type}
              onChange={(e) =>
                setForm({ ...form, type: e.target.value as StockLocationType })
              }
              className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-orange-400 focus:outline-none"
            >
              {Object.entries(TYPE_LABELS).map(([val, label]) => (
                <option key={val} value={val}>
                  {label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Parent Location
            </label>
            <select
              value={form.parent_id}
              onChange={(e) => setForm({ ...form, parent_id: e.target.value })}
              className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-orange-400 focus:outline-none"
            >
              <option value="">— Root (no parent) —</option>
              {parentOptions.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.path} — {l.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="is_active"
              checked={form.is_active}
              onChange={(e) =>
                setForm({ ...form, is_active: e.target.checked })
              }
              className="w-4 h-4 text-orange-500 rounded"
            />
            <label htmlFor="is_active" className="text-sm text-gray-700">
              Active
            </label>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg text-sm disabled:opacity-60"
            >
              {saving
                ? "Saving..."
                : mode === "create"
                  ? "Add Location"
                  : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function StockLocationPage() {
  const dispatch = useDispatch<AppDispatch>();
  const { items: warehouses } = useSelector(
    (state: RootState) => state.warehouse,
  );
  const {
    tree,
    items: flatList,
    loading,
  } = useSelector((state: RootState) => state.stockLocation);

  const [selectedWarehouseId, setSelectedWarehouseId] = useState<number | null>(
    null,
  );
  const [selectedLocation, setSelectedLocation] =
    useState<StockLocation | null>(null);
  const [formMode, setFormMode] = useState<"create" | "edit" | null>(null);
  const [editTarget, setEditTarget] = useState<StockLocation | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<StockLocation | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    dispatch(fetchWarehousesThunk());
  }, [dispatch]);

  useEffect(() => {
    if (selectedWarehouseId) {
      dispatch(fetchLocationTreeThunk(selectedWarehouseId));
      dispatch(fetchLocationsThunk(selectedWarehouseId));
    }
  }, [selectedWarehouseId, dispatch]);

  // Auto-select first warehouse
  useEffect(() => {
    if (warehouses.length > 0 && !selectedWarehouseId) {
      setSelectedWarehouseId(Number(warehouses[0].id));
    }
  }, [warehouses]);

  const handleCreate = async (data: any) => {
    await dispatch(createLocationThunk(data)).unwrap();
    dispatch(fetchLocationTreeThunk(selectedWarehouseId!));
    dispatch(fetchLocationsThunk(selectedWarehouseId!));
    toast.success("Location created!");
  };

  const handleUpdate = async (data: any) => {
    if (!editTarget) return;
    await dispatch(
      updateLocationThunk({ id: Number(editTarget.id), data }),
    ).unwrap();
    dispatch(fetchLocationTreeThunk(selectedWarehouseId!));
    dispatch(fetchLocationsThunk(selectedWarehouseId!));
    toast.success("Location updated!");
    if (
      selectedLocation &&
      Number(selectedLocation.id) === Number(editTarget.id)
    ) {
      setSelectedLocation(null);
    }
  };

  const handleToggleActive = async (loc: StockLocation) => {
    try {
      await dispatch(
        updateLocationThunk({
          id: Number(loc.id),
          data: { is_active: !loc.is_active },
        }),
      ).unwrap();
      dispatch(fetchLocationTreeThunk(selectedWarehouseId!));
      dispatch(fetchLocationsThunk(selectedWarehouseId!));
      toast.success(`Location ${loc.is_active ? "deactivated" : "activated"}`);
    } catch (err: any) {
      toast.error(err?.message || "Failed to update");
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await dispatch(deleteLocationThunk(Number(deleteTarget.id))).unwrap();
      dispatch(fetchLocationTreeThunk(selectedWarehouseId!));
      dispatch(fetchLocationsThunk(selectedWarehouseId!));
      toast.success("Location deleted!");
      if (
        selectedLocation &&
        Number(selectedLocation.id) === Number(deleteTarget.id)
      ) {
        setSelectedLocation(null);
      }
    } catch (err: any) {
      toast.error(
        err?.response?.data?.message || err.message || "Failed to delete",
      );
    } finally {
      setDeleting(false);
      setDeleteTarget(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between bg-white px-6 py-4 rounded-xl border shadow-sm">
        <div className="flex items-center gap-3">
          <MapPin className="w-6 h-6 text-orange-500" />
          <div>
            <h1 className="text-xl font-semibold text-gray-800">
              Stock Locations
            </h1>
            <p className="text-sm text-gray-500">
              Manage warehouse location structure
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {/* Warehouse selector */}
          <div className="flex items-center gap-2">
            <Warehouse className="w-4 h-4 text-gray-400" />
            <select
              value={selectedWarehouseId || ""}
              onChange={(e) => setSelectedWarehouseId(Number(e.target.value))}
              className="border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-orange-400 focus:outline-none"
            >
              <option value="">Select warehouse</option>
              {warehouses.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.name} ({w.code})
                </option>
              ))}
            </select>
          </div>
          <button
            onClick={() => {
              setEditTarget(null);
              setFormMode("create");
            }}
            disabled={!selectedWarehouseId}
            className="flex items-center gap-1.5 bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition disabled:opacity-40"
          >
            <Plus className="w-4 h-4" /> Add Location
          </button>
        </div>
      </div>

      {!selectedWarehouseId ? (
        <div className="bg-white rounded-xl border shadow-sm p-12 text-center text-gray-400">
          <Warehouse className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>Select a warehouse to view its locations</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Tree panel */}
          <div className="lg:col-span-2 bg-white rounded-xl border shadow-sm overflow-hidden">
            <div className="px-4 py-3 border-b bg-gray-50 flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">
                Location Tree
              </span>
              <span className="text-xs text-gray-400">
                {flatList.length} locations
              </span>
            </div>
            <div className="p-3 min-h-[400px]">
              {loading ? (
                <div className="flex items-center justify-center h-40">
                  <div className="w-6 h-6 border-2 border-orange-400 border-t-transparent rounded-full animate-spin" />
                </div>
              ) : tree.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-40 text-gray-400">
                  <MapPin className="w-8 h-8 mb-2 opacity-30" />
                  <p className="text-sm">No locations yet</p>
                  <button
                    onClick={() => {
                      setEditTarget(null);
                      setFormMode("create");
                    }}
                    className="mt-3 text-sm text-orange-500 hover:underline"
                  >
                    Add first location
                  </button>
                </div>
              ) : (
                tree.map((node) => (
                  <TreeNode
                    key={node.id}
                    node={node}
                    depth={0}
                    selectedId={
                      selectedLocation ? Number(selectedLocation.id) : null
                    }
                    onSelect={setSelectedLocation}
                    onEdit={(loc) => {
                      setEditTarget(loc);
                      setFormMode("edit");
                    }}
                    onDelete={setDeleteTarget}
                    onToggleActive={handleToggleActive}
                  />
                ))
              )}
            </div>
          </div>

          {/* Detail panel */}
          <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
            <div className="px-4 py-3 border-b bg-gray-50">
              <span className="text-sm font-medium text-gray-700">
                {selectedLocation ? "Location Details" : "Select a location"}
              </span>
            </div>
            {selectedLocation ? (
              <div className="p-5 space-y-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold text-gray-800">
                      {selectedLocation.name}
                    </h3>
                    <p className="text-xs text-gray-400 font-mono mt-0.5">
                      {selectedLocation.code}
                    </p>
                  </div>
                  <span
                    className={`text-xs px-2 py-1 rounded-full font-medium ${TYPE_COLORS[selectedLocation.type]}`}
                  >
                    {TYPE_LABELS[selectedLocation.type]}
                  </span>
                </div>

                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Path</span>
                    <span className="text-gray-700 font-mono text-xs">
                      {selectedLocation.path}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Status</span>
                    <span
                      className={`font-medium ${selectedLocation.is_active ? "text-green-600" : "text-gray-400"}`}
                    >
                      {selectedLocation.is_active ? "Active" : "Inactive"}
                    </span>
                  </div>
                  {selectedLocation.parent && (
                    <div className="flex justify-between">
                      <span className="text-gray-400">Parent</span>
                      <span className="text-gray-700">
                        {selectedLocation.parent.name}
                      </span>
                    </div>
                  )}
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    onClick={() => {
                      setEditTarget(selectedLocation);
                      setFormMode("edit");
                    }}
                    className="flex-1 flex items-center justify-center gap-1.5 border border-blue-200 text-blue-600 hover:bg-blue-50 px-3 py-2 rounded-lg text-sm transition"
                  >
                    <Pencil className="w-3.5 h-3.5" /> Edit
                  </button>
                  <button
                    onClick={() => setDeleteTarget(selectedLocation)}
                    className="flex-1 flex items-center justify-center gap-1.5 border border-red-200 text-red-500 hover:bg-red-50 px-3 py-2 rounded-lg text-sm transition"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Delete
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-48 text-gray-300">
                <MapPin className="w-10 h-10 mb-2" />
                <p className="text-sm">Click a location to view details</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Form Modal */}
      {formMode && selectedWarehouseId && (
        <LocationFormModal
          mode={formMode}
          initial={editTarget}
          warehouseId={selectedWarehouseId}
          locations={flatList}
          onClose={() => {
            setFormMode(null);
            setEditTarget(null);
          }}
          onSave={formMode === "create" ? handleCreate : handleUpdate}
        />
      )}

      {/* Delete Confirm */}
      {deleteTarget && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-lg p-6 w-96 text-center">
            <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
              <Trash2 className="w-6 h-6 text-red-500" />
            </div>
            <h2 className="text-lg font-semibold text-gray-800 mb-2">
              Delete Location?
            </h2>
            <p className="text-sm text-gray-500 mb-1">
              You are about to delete
            </p>
            <p className="text-sm font-medium text-gray-800 mb-1">
              {deleteTarget.name}
            </p>
            <p className="text-xs font-mono text-gray-400 mb-5">
              {deleteTarget.path}
            </p>
            <p className="text-xs text-gray-400 mb-6">
              This action cannot be undone.
            </p>
            <div className="flex justify-center gap-3">
              <button
                onClick={() => setDeleteTarget(null)}
                className="px-5 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm"
                disabled={deleting}
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="px-5 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg text-sm"
                disabled={deleting}
              >
                {deleting ? "Deleting..." : "Yes, Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
