import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "../../../store/store";
import {
  fetchLotsThunk,
  createLotThunk,
  updateLotThunk,
  deleteLotThunk,
} from "../store/stock/stocklot/stockLot.thunks";
import { StockLot, CreateLotDTO } from "../store/stock/stocklot/stockLot.types";
import { partnerApi } from "../../partner/api/partner.api";
import { productApi } from "../../products/api/product.api";
import { Plus, Pencil, Trash2, Search, AlertTriangle, Layers, ShieldCheck, XCircle, Clock } from "lucide-react";
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

// ─── Helpers ─────────────────────────────────────────────────────────────────
function daysUntil(dateStr: string | null | undefined): number | null {
  if (!dateStr) return null;
  const diff = new Date(dateStr).getTime() - Date.now();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

function ExpiryBadge({ date }: { date: string | null | undefined }) {
  if (!date) return <span className="text-slate-400 text-xs">—</span>;
  const days = daysUntil(date);
  if (days === null) return <span className="text-xs font-semibold font-mono">{date}</span>;
  if (days < 0)
    return (
      <Badge
        className="text-[10px] px-2.5 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-100 font-extrabold uppercase shadow-none hover:bg-rose-50"
      >
        Đã hết hạn
      </Badge>
    );
  if (days <= 30)
    return (
      <Badge
        className="text-[10px] px-2.5 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-100 font-extrabold shadow-none hover:bg-rose-50"
      >
        {date} ({days} ngày)
      </Badge>
    );
  if (days <= 90)
    return (
      <Badge
        className="text-[10px] px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-100 font-extrabold shadow-none hover:bg-amber-50"
      >
        {date} ({days} ngày)
      </Badge>
    );
  return <span className="text-xs text-slate-655 font-semibold font-mono">{date}</span>;
}

// ─── Lot Form Modal ───────────────────────────────────────────────────────────
interface LotFormProps {
  mode: "create" | "edit";
  initial?: StockLot | null;
  onClose: () => void;
  onSave: (data: any) => Promise<void>;
}

function LotFormModal({ mode, initial, onClose, onSave }: LotFormProps) {
  const [form, setForm] = useState({
    product_id: initial?.product_id ? String(initial.product_id) : "",
    lot_no: initial?.lot_no || "",
    serial_no: initial?.serial_no || "",
    manufacture_date: initial?.manufacture_date || "",
    expiry_date: initial?.expiry_date || "",
    supplier_id: initial?.supplier_id ? String(initial.supplier_id) : "",
    notes: initial?.notes || "",
  });
  const [saving, setSaving] = useState(false);
  const [products, setProducts] = useState<
    Array<{ id: number; name: string; sku: string }>
  >([]);
  const [suppliers, setSuppliers] = useState<
    Array<{ id: number; name: string }>
  >([]);

  useEffect(() => {
    productApi
      .getAllProductsOnActive()
      .then((data) =>
        setProducts(data.map((p) => ({ id: p.id, name: p.name, sku: p.sku }))),
      );
    partnerApi
      .getAllPartners({ type: "supplier", status: "active" })
      .then((data) =>
        setSuppliers(data.map((p) => ({ id: p.id, name: p.name }))),
      );
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.product_id || !form.lot_no.trim()) {
      toast.error("Vui lòng chọn sản phẩm và nhập số lô");
      return;
    }
    setSaving(true);
    try {
      await onSave({
        product_id: Number(form.product_id),
        lot_no: form.lot_no.trim(),
        serial_no: form.serial_no || null,
        manufacture_date: form.manufacture_date || null,
        expiry_date: form.expiry_date || null,
        supplier_id: form.supplier_id ? Number(form.supplier_id) : null,
        notes: form.notes || null,
      });
      onClose();
    } catch (err: any) {
      toast.error(
        err?.response?.data?.message || err.message || "Lưu thất bại",
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {mode === "create" ? "Tạo lô hàng mới" : "Chỉnh sửa lô hàng"}
          </DialogTitle>
          <DialogDescription>
            Nhập thông tin chi tiết, số sê-ri và hạn dùng cho lô hàng tồn kho này
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Sản phẩm <span className="text-red-500">*</span>
            </label>
            <select
              value={form.product_id}
              onChange={(e) =>
                setForm({ ...form, product_id: e.target.value })
              }
              disabled={mode === "edit"}
              className="w-full h-10 border border-slate-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-orange-400 transition"
            >
              <option value="">-- Chọn sản phẩm --</option>
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.sku})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Số lô <span className="text-red-500">*</span>
              </label>
              <Input
                value={form.lot_no}
                onChange={(val) => setForm({ ...form, lot_no: val })}
                disabled={mode === "edit"}
                className="border-slate-200 focus:ring-orange-400 focus:border-orange-400 font-mono"
                placeholder="Ví dụ: LOT-2026-001"
              />
              {mode === "edit" && (
                <p className="text-[10px] text-gray-400 mt-0.5">
                  Số lô không thể thay đổi
                </p>
              )}
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Số sê-ri (S/N)
              </label>
              <Input
                value={form.serial_no}
                onChange={(val) => setForm({ ...form, serial_no: val })}
                className="border-slate-200 focus:ring-orange-400 focus:border-orange-400"
                placeholder="Không bắt buộc"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Ngày sản xuất
              </label>
              <input
                type="date"
                value={form.manufacture_date}
                onChange={(e) =>
                  setForm({ ...form, manufacture_date: e.target.value })
                }
                className="w-full h-10 border border-slate-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-orange-400 transition"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Hạn sử dụng
              </label>
              <input
                type="date"
                value={form.expiry_date}
                onChange={(e) =>
                  setForm({ ...form, expiry_date: e.target.value })
                }
                className="w-full h-10 border border-slate-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-orange-400 transition"
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Nhà cung cấp
            </label>
            <select
              value={form.supplier_id}
              onChange={(e) =>
                setForm({ ...form, supplier_id: e.target.value })
              }
              className="w-full h-10 border border-slate-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-orange-400 transition"
            >
              <option value="">-- Chọn nhà cung cấp --</option>
              {suppliers.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Ghi chú
            </label>
            <textarea
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              rows={2}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-orange-400 transition"
              placeholder="Nhập ghi chú..."
            />
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
              {mode === "create" ? "Tạo lô" : "Lưu thay đổi"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function StockLotPage() {
  const dispatch = useDispatch<AppDispatch>();
  const { items: lots, loading } = useSelector(
    (state: RootState) => state.stockLot,
  );

  const [search, setSearch] = useState("");
  const [filterExpiry, setFilterExpiry] = useState<
    "all" | "expiring30" | "expiring90" | "expired"
  >("all");
  const [formMode, setFormMode] = useState<"create" | "edit" | null>(null);
  const [editTarget, setEditTarget] = useState<StockLot | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<StockLot | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    dispatch(fetchLotsThunk());
  }, [dispatch]);

  const filtered = lots.filter((l) => {
    const term = search.toLowerCase();
    const matchSearch =
      !search ||
      l.lot_no.toLowerCase().includes(term) ||
      l.product?.name?.toLowerCase().includes(term) ||
      l.product?.sku?.toLowerCase().includes(term) ||
      l.serial_no?.toLowerCase().includes(term);

    const days = daysUntil(l.expiry_date);
    const matchExpiry =
      filterExpiry === "all"
        ? true
        : filterExpiry === "expired"
          ? days !== null && days < 0
          : filterExpiry === "expiring30"
            ? days !== null && days >= 0 && days <= 30
            : filterExpiry === "expiring90"
              ? days !== null && days >= 0 && days <= 90
              : true;

    return matchSearch && matchExpiry;
  });

  const handleCreate = async (data: CreateLotDTO) => {
    await dispatch(createLotThunk(data)).unwrap();
    toast.success("Tạo lô hàng thành công!");
  };

  const handleUpdate = async (data: any) => {
    if (!editTarget) return;
    await dispatch(
      updateLotThunk({ id: Number(editTarget.id), data }),
    ).unwrap();
    toast.success("Cập nhật lô hàng thành công!");
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await dispatch(deleteLotThunk(Number(deleteTarget.id))).unwrap();
      toast.success("Xóa lô hàng thành công!");
    } catch (err: any) {
      toast.error(
        err?.response?.data?.message || err.message || "Xóa thất bại",
      );
    } finally {
      setDeleting(false);
      setDeleteTarget(null);
    }
  };

  const expiringCount = lots.filter((l) => {
    const d = daysUntil(l.expiry_date);
    return d !== null && d >= 0 && d <= 30;
  }).length;

  return (
    <div className="max-w-6xl mx-auto p-6 md:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-orange-50 border border-orange-100 flex items-center justify-center text-orange-500 shadow-sm">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Quản lý lô hàng</h1>
            <p className="text-gray-500 text-sm mt-0.5">
              Tổng cộng {lots.length} lô hàng
              {expiringCount > 0 && (
                <Badge variant="destructive" className="ml-2.5 text-[10px] font-bold border shadow-none bg-rose-50 text-rose-700 border-rose-100">
                  {expiringCount} lô sắp hết hạn
                </Badge>
              )}
            </p>
          </div>
        </div>
        <Button
          onClick={() => {
            setEditTarget(null);
            setFormMode("create");
          }}
          leftIcon={<Plus className="w-4 h-4" />}
          size="md"
          className="self-end sm:self-auto"
        >
          Tạo lô
        </Button>
      </div>

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 flex items-center gap-3.5 transition duration-300 hover:-translate-y-0.5 hover:shadow-md">
          <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-500 shrink-0">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Tổng số lô</p>
            <p className="text-lg font-extrabold text-slate-850 mt-0.5">{lots.length}</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 flex items-center gap-3.5 transition duration-300 hover:-translate-y-0.5 hover:shadow-md">
          <div className="w-10 h-10 rounded-xl bg-amber-50/50 border border-amber-100 flex items-center justify-center text-amber-500 shrink-0">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Sắp hết hạn (30 ngày)</p>
            <p className="text-lg font-extrabold text-slate-850 mt-0.5">{expiringCount}</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 flex items-center gap-3.5 transition duration-300 hover:-translate-y-0.5 hover:shadow-md">
          <div className="w-10 h-10 rounded-xl bg-rose-50/50 border border-rose-100 flex items-center justify-center text-rose-500 shrink-0">
            <XCircle className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Lô đã hết hạn</p>
            <p className="text-lg font-extrabold text-slate-850 mt-0.5">
              {lots.filter(l => { const d = daysUntil(l.expiry_date); return d !== null && d < 0; }).length}
            </p>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 flex items-center gap-3.5 transition duration-300 hover:-translate-y-0.5 hover:shadow-md">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-500 shrink-0">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Lô còn hạn tốt</p>
            <p className="text-lg font-extrabold text-slate-850 mt-0.5">
              {lots.filter(l => { const d = daysUntil(l.expiry_date); return d === null || d > 30; }).length}
            </p>
          </div>
        </div>
      </div>

      {/* Main Content Card */}
      <Card className="border-slate-100 shadow-sm overflow-hidden bg-white/80 backdrop-blur-md">
        {/* Filters Header */}
        <div className="p-5 border-b border-slate-100 bg-slate-50/10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4 pointer-events-none z-10" />
            <Input
              placeholder="Tìm kiếm lô hàng theo SKU, số lô, tên sản phẩm..."
              value={search}
              onChange={setSearch}
              className="pl-9 bg-white border-slate-200 focus:ring-orange-500 focus:border-orange-500"
            />
          </div>

          <div className="flex items-center gap-3">
            <select
              value={filterExpiry}
              onChange={(e) => setFilterExpiry(e.target.value as any)}
              className="h-10 border border-slate-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-orange-400 transition min-w-[160px]"
            >
              <option value="all">Tất cả hạn dùng</option>
              <option value="expiring30">Hết hạn ≤ 30 ngày</option>
              <option value="expiring90">Hết hạn ≤ 90 ngày</option>
              <option value="expired">Đã hết hạn</option>
            </select>

            {(search || filterExpiry !== "all") && (
              <Button
                onClick={() => {
                  setSearch("");
                  setFilterExpiry("all");
                }}
                variant="ghost"
                size="sm"
                className="text-orange-500 hover:text-orange-600 hover:bg-orange-50/40"
              >
                Xóa bộ lọc
              </Button>
            )}
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50/80 text-[10px] uppercase tracking-wider font-bold text-slate-500 border-b border-slate-100">
              <tr>
                <th className="py-3.5 px-6 text-left">Sản phẩm</th>
                <th className="py-3.5 px-6 text-left">Số lô</th>
                <th className="py-3.5 px-6 text-left">Số sê-ri</th>
                <th className="py-3.5 px-6 text-left">Ngày SX</th>
                <th className="py-3.5 px-6 text-left">Hạn sử dụng</th>
                <th className="py-3.5 px-6 text-left">Nhà cung cấp</th>
                <th className="py-3.5 px-6 text-left">Ghi chú</th>
                <th className="py-3.5 px-6 text-center w-28">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-16 text-center text-slate-400">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-8 h-8 border-3 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
                      <span className="text-xs font-medium">Đang tải dữ liệu lô hàng...</span>
                    </div>
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-16 text-center text-slate-400 italic">
                    Không tìm thấy lô hàng nào
                  </td>
                </tr>
              ) : (
                filtered.map((lot) => {
                  const days = daysUntil(lot.expiry_date);
                  const isExpired = days !== null && days < 0;
                  const isWarning = days !== null && days >= 0 && days <= 30;
                  return (
                    <tr
                      key={lot.id}
                      className={`hover:bg-slate-50/40 transition-colors ${
                        isExpired 
                          ? "bg-rose-50/20 hover:bg-rose-50/30" 
                          : isWarning 
                            ? "bg-amber-50/20 hover:bg-amber-50/30" 
                            : ""
                      }`}
                    >
                      <td className="py-3.5 px-6">
                        <div className="font-bold text-slate-800">
                          {lot.product?.name || `#${lot.product_id}`}
                        </div>
                        <div className="text-[10px] font-mono font-bold text-slate-400 mt-0.5 tracking-wider uppercase">
                          {lot.product?.sku}
                        </div>
                      </td>
                      <td className="py-3.5 px-6 font-semibold font-mono text-slate-700">
                        {lot.lot_no}
                      </td>
                      <td className="py-3.5 px-6 font-mono text-xs text-slate-600">
                        {lot.serial_no || "—"}
                      </td>
                      <td className="py-3.5 px-6 text-slate-500 text-xs font-medium font-mono">
                        {lot.manufacture_date || "—"}
                      </td>
                      <td className="py-3.5 px-6">
                        <div className="flex items-center gap-1.5">
                          {(isExpired || isWarning) && (
                            <AlertTriangle
                              className={`w-3.5 h-3.5 shrink-0 ${isExpired ? "text-rose-500 animate-pulse" : "text-amber-500"}`}
                            />
                          )}
                          <ExpiryBadge date={lot.expiry_date} />
                        </div>
                      </td>
                      <td className="py-3.5 px-6 text-slate-600 text-xs font-semibold">
                        {lot.supplier?.name || "—"}
                      </td>
                      <td className="py-3.5 px-6 text-slate-400 text-xs max-w-[140px] truncate italic" title={lot.notes || ""}>
                        {lot.notes || "—"}
                      </td>
                      <td className="py-3.5 px-6 text-center">
                        <div className="flex justify-center items-center gap-2">
                          <button
                            onClick={() => {
                              setEditTarget(lot);
                              setFormMode("edit");
                            }}
                            className="inline-flex items-center justify-center w-8 h-8 rounded-lg border border-slate-200 text-blue-600 bg-white hover:bg-blue-50 hover:border-blue-100 transition-colors shadow-sm"
                            title="Chỉnh sửa"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setDeleteTarget(lot)}
                            className="inline-flex items-center justify-center w-8 h-8 rounded-lg border border-slate-200 text-rose-600 bg-white hover:bg-rose-50 hover:text-rose-700 hover:border-rose-100 transition-colors shadow-sm"
                            title="Xóa"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Form Modal */}
      {formMode && (
        <LotFormModal
          mode={formMode}
          initial={editTarget}
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
                  Xóa lô hàng
                </DialogTitle>
                <DialogDescription className="text-center text-sm text-gray-500 mt-1">
                  Bạn có chắc chắn muốn xóa lô hàng <span className="font-mono font-bold text-slate-800">{deleteTarget.lot_no}</span>?
                  Hành động này không thể hoàn tác và sẽ xóa tất cả các mục tồn kho liên quan.
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
                  Xác nhận xóa
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
