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
import { StockLocation, StockLocationType } from "../store/stock/stocklocation/stockLocation.types";
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
  Warehouse,
} from "lucide-react";
import { toast } from "react-toastify";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

// ─── Type badge ───────────────────────────────────────────────────────────────
const TYPE_LABELS: Record<StockLocationType, string> = {
  view: "Chỉ xem (View)",
  internal: "Nội bộ",
  input: "Đầu vào (Input)",
  output: "Đầu ra (Output)",
  customer: "Khách hàng",
  supplier: "Nhà cung cấp",
  transit: "Trung chuyển (Transit)",
};
const TYPE_COLORS: Record<StockLocationType, string> = {
  view: "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-50",
  internal: "bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-50",
  input: "bg-green-50 text-green-700 border-green-200 hover:bg-green-50",
  output: "bg-orange-50 text-orange-700 border-orange-200 hover:bg-orange-50",
  customer: "bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-50",
  supplier: "bg-yellow-50 text-yellow-700 border-yellow-200 hover:bg-yellow-50",
  transit: "bg-teal-50 text-teal-700 border-teal-200 hover:bg-teal-50",
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

  const isSelected = selectedId === Number(node.id);

  return (
    <div className="space-y-0.5">
      <div
        className={`flex items-center gap-2 px-3 py-2 rounded-xl cursor-pointer group transition duration-200 border ${
          isSelected
            ? "bg-orange-50 border-orange-200 shadow-sm"
            : "hover:bg-slate-50/60 border-transparent hover:border-slate-100/80"
        }`}
        style={{ marginLeft: `${depth * 16}px` }}
        onClick={() => onSelect(node)}
      >
        {/* Expand toggle */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            setExpanded((v) => !v);
          }}
          className="w-5 h-5 rounded hover:bg-slate-200/50 flex items-center justify-center text-slate-400 shrink-0 transition"
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
          className={`w-4 h-4 shrink-0 transition-colors ${
            node.is_active 
              ? isSelected ? "text-orange-500" : "text-orange-400"
              : "text-slate-300"
          }`}
        />

        <span
          className={`text-sm font-semibold flex-1 truncate ${
            node.is_active ? "text-slate-750" : "text-slate-400 line-through font-normal"
          }`}
        >
          {node.name}
        </span>

        <span className="text-[10px] px-1.5 py-0.5 rounded font-mono font-bold text-slate-400 bg-slate-100 uppercase tracking-wider shrink-0">
          {node.code}
        </span>

        <Badge
          className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold border shadow-none ${
            TYPE_COLORS[node.type] || "bg-slate-100 text-slate-600 border-slate-200"
          }`}
        >
          {TYPE_LABELS[node.type]}
        </Badge>

        {/* Actions — show on hover */}
        <div className="hidden group-hover:flex items-center gap-1 ml-2 shrink-0">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggleActive(node);
            }}
            className="p-1 rounded-md hover:bg-slate-200/60 text-slate-500 transition-colors"
            title={node.is_active ? "Vô hiệu hóa" : "Kích hoạt"}
          >
            {node.is_active ? (
              <ToggleRight className="w-4 h-4 text-emerald-500" />
            ) : (
              <ToggleLeft className="w-4 h-4 text-slate-300" />
            )}
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onEdit(node);
            }}
            className="p-1 rounded-md hover:bg-blue-50 border border-transparent hover:border-blue-100 text-blue-500 transition-colors"
            title="Sửa"
          >
            <Pencil className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete(node);
            }}
            className="p-1 rounded-md hover:bg-rose-50 border border-transparent hover:border-rose-100 text-rose-500 transition-colors"
            title="Xóa"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {hasChildren && expanded && (
        <div className="mt-1 space-y-1 border-l border-slate-100 ml-[9px] pl-[7px]">
          {node.children!.map((child) => (
            <TreeNode
              key={child.id}
              node={child}
              depth={depth}
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
      toast.error("Vui lòng nhập tên và mã vị trí");
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
        err?.response?.data?.message || err.message || "Lưu vị trí thất bại",
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
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {mode === "create" ? "Thêm vị trí" : "Sửa vị trí"}
          </DialogTitle>
          <DialogDescription>
            Cấu hình thuộc tính và mối quan hệ cho vị trí lưu trữ này
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Tên vị trí <span className="text-red-500">*</span>
              </label>
              <Input
                value={form.name}
                onChange={(val) => setForm({ ...form, name: val })}
                className="border-slate-200 focus:ring-orange-400 focus:border-orange-400"
                placeholder="Ví dụ: Kệ A1"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Mã vị trí <span className="text-red-500">*</span>
              </label>
              <Input
                value={form.code}
                onChange={(val) => setForm({ ...form, code: val.toUpperCase() })}
                className="border-slate-200 focus:ring-orange-400 focus:border-orange-400 font-mono"
                placeholder="Ví dụ: KE-A1"
                disabled={mode === "edit"}
              />
              {mode === "edit" && (
                <p className="text-[10px] text-gray-400">
                  Không thể thay đổi mã vị trí
                </p>
              )}
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Loại vị trí
            </label>
            <select
              value={form.type}
              onChange={(e) =>
                setForm({ ...form, type: e.target.value as StockLocationType })
              }
              className="w-full h-10 border border-slate-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-orange-400 transition"
            >
              {Object.entries(TYPE_LABELS).map(([val, label]) => (
                <option key={val} value={val}>
                  {label}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Vị trí cha
            </label>
            <select
              value={form.parent_id}
              onChange={(e) => setForm({ ...form, parent_id: e.target.value })}
              className="w-full h-10 border border-slate-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-orange-400 transition"
            >
              <option value="">— Vị trí gốc (Không có vị trí cha) —</option>
              {parentOptions.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.path} — {l.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2.5 pt-2">
            <input
              type="checkbox"
              id="is_active"
              checked={form.is_active}
              onChange={(e) =>
                setForm({ ...form, is_active: e.target.checked })
              }
              className="w-4.5 h-4.5 text-orange-500 rounded border-slate-200 focus:ring-orange-500 focus:ring-offset-0"
            />
            <label htmlFor="is_active" className="text-sm font-semibold text-slate-700">
              Hoạt động / Hiển thị
            </label>
          </div>

          <DialogFooter className="pt-4 border-t border-slate-100 flex-row justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={saving}
            >
              Hủy
            </Button>
            <Button
              type="submit"
              variant="primary"
              loading={saving}
            >
              {mode === "create" ? "Thêm vị trí" : "Lưu thay đổi"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
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
    toast.success("Đã tạo vị trí mới!");
  };

  const handleUpdate = async (data: any) => {
    if (!editTarget) return;
    await dispatch(
      updateLocationThunk({ id: Number(editTarget.id), data }),
    ).unwrap();
    dispatch(fetchLocationTreeThunk(selectedWarehouseId!));
    dispatch(fetchLocationsThunk(selectedWarehouseId!));
    toast.success("Đã cập nhật vị trí!");
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
      toast.success(`Đã ${loc.is_active ? "vô hiệu hóa" : "kích hoạt"} vị trí`);
    } catch (err: any) {
      toast.error(err?.message || "Cập nhật thất bại");
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await dispatch(deleteLocationThunk(Number(deleteTarget.id))).unwrap();
      dispatch(fetchLocationTreeThunk(selectedWarehouseId!));
      dispatch(fetchLocationsThunk(selectedWarehouseId!));
      toast.success("Đã xóa vị trí!");
      if (
        selectedLocation &&
        Number(selectedLocation.id) === Number(deleteTarget.id)
      ) {
        setSelectedLocation(null);
      }
    } catch (err: any) {
      toast.error(
        err?.response?.data?.message || err.message || "Xóa thất bại",
      );
    } finally {
      setDeleting(false);
      setDeleteTarget(null);
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6 md:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-orange-50 border border-orange-100 flex items-center justify-center text-orange-500 shadow-sm">
            <MapPin className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Vị trí kho</h1>
            <p className="text-gray-500 text-sm mt-0.5">
              Tổ chức và cấu trúc sơ đồ, kệ hàng, lối đi trong kho của bạn
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 self-end md:self-auto">
          {/* Warehouse selector */}
          <div className="flex items-center gap-2">
            <Warehouse className="w-4 h-4 text-slate-400" />
            <select
              value={selectedWarehouseId || ""}
              onChange={(e) => setSelectedWarehouseId(Number(e.target.value))}
              className="h-10 border border-slate-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-orange-400 transition"
            >
              <option value="">Chọn kho hàng</option>
              {warehouses.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.name} ({w.code})
                </option>
              ))}
            </select>
          </div>
          
          <Button
            onClick={() => {
              setEditTarget(null);
              setFormMode("create");
            }}
            disabled={!selectedWarehouseId}
            leftIcon={<Plus className="w-4 h-4" />}
            size="md"
          >
            Thêm vị trí
          </Button>
        </div>
      </div>

      {!selectedWarehouseId ? (
        <Card className="border-slate-100 shadow-sm p-16 text-center bg-white/80 backdrop-blur-md">
          <Warehouse className="w-14 h-14 mx-auto mb-4 text-slate-300 opacity-60 animate-pulse" />
          <h3 className="text-base font-bold text-slate-700">Chưa chọn kho hàng</h3>
          <p className="text-sm text-slate-400 mt-1 max-w-xs mx-auto">
            Chọn một kho hàng từ danh sách thả xuống để xem và quản lý cấu trúc sơ đồ thực tế.
          </p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Tree panel */}
          <Card className="lg:col-span-2 border-slate-100 shadow-sm overflow-hidden bg-white/80 backdrop-blur-md flex flex-col">
            <CardHeader className="pb-4 border-b border-slate-50 bg-slate-50/20 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base font-semibold text-slate-800">
                  Sơ đồ cơ cấu vị trí
                </CardTitle>
                <CardDescription className="text-xs text-slate-400">
                  Biểu diễn cấu trúc phân cấp thực tế
                </CardDescription>
              </div>
              <Badge variant="outline" className="bg-slate-50 text-slate-600 font-bold border-slate-200 px-2.5 py-1 text-xs">
                {flatList.length} vị trí
              </Badge>
            </CardHeader>
            <CardContent className="p-4 flex-1 min-h-[400px] max-h-[550px] overflow-y-auto">
              {loading ? (
                <div className="flex flex-col items-center justify-center py-20 text-slate-450 gap-2">
                  <div className="w-8 h-8 border-3 border-orange-500 border-t-transparent rounded-full animate-spin" />
                  <span className="text-xs font-semibold">Đang xây dựng cấu trúc sơ đồ...</span>
                </div>
              ) : tree.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-gray-400">
                  <MapPin className="w-12 h-12 mb-3 opacity-30 text-orange-500 animate-bounce" />
                  <h3 className="font-bold text-slate-700">Sơ đồ trống</h3>
                  <p className="text-sm text-slate-400 mt-1">Kho hàng này hiện tại chưa có vị trí lưu trữ nào được thiết lập.</p>
                  <Button
                    onClick={() => {
                      setEditTarget(null);
                      setFormMode("create");
                    }}
                    variant="ghost"
                    className="mt-4 hover:bg-orange-50/50"
                  >
                    Thêm vị trí đầu tiên
                  </Button>
                </div>
              ) : (
                <div className="space-y-1">
                  {tree.map((node) => (
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
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Detail panel */}
          <Card className="border-slate-100 shadow-sm overflow-hidden bg-white/80 backdrop-blur-md flex flex-col h-fit">
            <CardHeader className="pb-4 border-b border-slate-50 bg-slate-50/20">
              <CardTitle className="text-base font-semibold text-slate-800">
                Chi tiết vị trí
              </CardTitle>
            </CardHeader>
            <CardContent className="p-5">
              {selectedLocation ? (
                <div className="space-y-5">
                  <div className="flex items-start justify-between gap-4">
                     <div>
                      <h3 className="font-bold text-slate-800 text-base">
                        {selectedLocation.name}
                      </h3>
                      <p className="text-[10px] tracking-widest font-mono font-bold text-slate-400 mt-1 bg-slate-50 px-2 py-0.5 rounded border border-slate-100 w-fit">
                        {selectedLocation.code}
                      </p>
                    </div>
                    <Badge
                      className={`px-2.5 py-0.5 rounded-full text-xs font-bold border shadow-none ${
                        TYPE_COLORS[selectedLocation.type] || "bg-slate-100 text-slate-600 border-slate-200"
                      }`}
                    >
                      {TYPE_LABELS[selectedLocation.type]}
                    </Badge>
                  </div>

                  <div className="space-y-3.5 border-t border-b border-slate-50 py-4">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-semibold text-slate-450 uppercase tracking-wide">Đường dẫn</span>
                      <span className="text-slate-800 font-mono font-bold bg-slate-50 px-2 py-0.5 rounded">
                        {selectedLocation.path}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-semibold text-slate-450 uppercase tracking-wide">Trạng thái</span>
                      <Badge
                        className={`shadow-none font-bold border text-[10px] ${
                          selectedLocation.is_active 
                            ? "bg-emerald-50 text-emerald-700 border-emerald-100" 
                            : "bg-slate-50 text-slate-400 border-slate-100"
                        }`}
                      >
                        {selectedLocation.is_active ? "Hoạt động" : "Không hoạt động"}
                      </Badge>
                    </div>
                    {selectedLocation.parent && (
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-semibold text-slate-450 uppercase tracking-wide">Vị trí cha</span>
                        <span className="text-slate-700 font-semibold bg-slate-50 px-2 py-0.5 rounded">
                          {selectedLocation.parent.name}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-3 pt-2">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setEditTarget(selectedLocation);
                        setFormMode("edit");
                      }}
                      leftIcon={<Pencil className="w-3.5 h-3.5" />}
                      className="flex-1"
                    >
                      Sửa
                    </Button>
                    <Button
                      variant="danger"
                      onClick={() => setDeleteTarget(selectedLocation)}
                      leftIcon={<Trash2 className="w-3.5 h-3.5" />}
                      className="flex-1"
                    >
                      Xóa
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-16 text-slate-350">
                  <MapPin className="w-12 h-12 mb-3 text-slate-300 animate-pulse" />
                  <p className="text-xs font-semibold text-slate-450 text-center">Chọn một vị trí trên sơ đồ cây để xem thuộc tính chi tiết</p>
                </div>
              )}
            </CardContent>
          </Card>
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

      {/* Delete Confirmation Modal */}
      <Dialog open={deleteTarget !== null} onOpenChange={() => setDeleteTarget(null)}>
        <DialogContent className="sm:max-w-md">
          {deleteTarget && (
            <>
              <DialogHeader>
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-100 mb-4 animate-pulse">
                  <Trash2 className="h-6 w-6 text-red-600" />
                </div>
                <DialogTitle className="text-center text-lg font-bold text-gray-900">
                  Xóa vị trí lưu trữ
                </DialogTitle>
                <DialogDescription className="text-center text-sm text-gray-500 space-y-1 mt-1">
                  <p>Bạn có chắc chắn muốn xóa vị trí <span className="font-semibold text-slate-800">{deleteTarget.name}</span> không?</p>
                  <p className="text-xs font-mono text-slate-450 mt-1">({deleteTarget.path})</p>
                  <p className="text-xs text-rose-500 font-semibold mt-2">Hành động này không thể hoàn tác và có thể làm ảnh hưởng các vị trí con!</p>
                </DialogDescription>
              </DialogHeader>
              <DialogFooter className="flex-row justify-center gap-3 mt-4">
                <Button
                  variant="outline"
                  onClick={() => setDeleteTarget(null)}
                  disabled={deleting}
                  className="w-full sm:w-auto"
                >
                  Hủy
                </Button>
                <Button
                  variant="danger"
                  onClick={handleDelete}
                  loading={deleting}
                  className="w-full sm:w-auto"
                >
                  Có, Xóa
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
