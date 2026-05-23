import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "../../../store/store";
import {
  fetchLotsThunk,
  createLotThunk,
  updateLotThunk,
  deleteLotThunk,
} from "../store/stock/stocklot/stockLot.thunks";
import { StockLot, CreateLotDTO } from "../api/stockLot.api";
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
        Expired
      </Badge>
    );
  if (days <= 30)
    return (
      <Badge
        className="text-[10px] px-2.5 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-100 font-extrabold shadow-none hover:bg-rose-50"
      >
        {date} ({days}d)
      </Badge>
    );
  if (days <= 90)
    return (
      <Badge
        className="text-[10px] px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-100 font-extrabold shadow-none hover:bg-amber-50"
      >
        {date} ({days}d)
      </Badge>
    );
  return <span className="text-xs text-slate-650 font-semibold font-mono">{date}</span>;
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
      toast.error("Product and Lot No are required");
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
        err?.response?.data?.message || err.message || "Failed to save",
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
            {mode === "create" ? "Create Stock Lot" : "Edit Stock Lot"}
          </DialogTitle>
          <DialogDescription>
            Input metadata, serial numbers, and expiry thresholds for this inventory batch
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Product <span className="text-red-500">*</span>
            </label>
            <select
              value={form.product_id}
              onChange={(e) =>
                setForm({ ...form, product_id: e.target.value })
              }
              disabled={mode === "edit"}
              className="w-full h-10 border border-slate-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-orange-400 transition"
            >
              <option value="">-- Select Product --</option>
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
                Lot No <span className="text-red-500">*</span>
              </label>
              <Input
                value={form.lot_no}
                onChange={(val) => setForm({ ...form, lot_no: val })}
                disabled={mode === "edit"}
                className="border-slate-200 focus:ring-orange-400 focus:border-orange-400 font-mono"
                placeholder="e.g. LOT-2026-001"
              />
              {mode === "edit" && (
                <p className="text-[10px] text-gray-400 mt-0.5">
                  Lot No cannot be changed
                </p>
              )}
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Serial No
              </label>
              <Input
                value={form.serial_no}
                onChange={(val) => setForm({ ...form, serial_no: val })}
                className="border-slate-200 focus:ring-orange-400 focus:border-orange-400"
                placeholder="Optional serial ID"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Manufacture Date
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
                Expiry Date
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
              Supplier
            </label>
            <select
              value={form.supplier_id}
              onChange={(e) =>
                setForm({ ...form, supplier_id: e.target.value })
              }
              className="w-full h-10 border border-slate-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-orange-400 transition"
            >
              <option value="">-- Select Supplier --</option>
              {suppliers.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Notes
            </label>
            <textarea
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              rows={2}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-orange-400 transition"
              placeholder="Optional notes..."
            />
          </div>

          <DialogFooter className="pt-4 border-t border-slate-100 flex-row justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              loading={saving}
            >
              {mode === "create" ? "Create Lot" : "Save Changes"}
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
    toast.success("Lot created!");
  };

  const handleUpdate = async (data: any) => {
    if (!editTarget) return;
    await dispatch(
      updateLotThunk({ id: Number(editTarget.id), data }),
    ).unwrap();
    toast.success("Lot updated!");
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await dispatch(deleteLotThunk(Number(deleteTarget.id))).unwrap();
      toast.success("Lot deleted!");
    } catch (err: any) {
      toast.error(
        err?.response?.data?.message || err.message || "Failed to delete",
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
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-orange-50 border border-orange-100 flex items-center justify-center text-orange-500 shadow-sm">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Stock Lots</h1>
            <p className="text-gray-500 text-sm mt-0.5">
              {lots.length} lots total
              {expiringCount > 0 && (
                <Badge variant="destructive" className="ml-2.5 text-[10px] font-bold border shadow-none bg-rose-50 text-rose-700 border-rose-100">
                  {expiringCount} expiring soon
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
          Create Lot
        </Button>
      </div>

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 flex items-center gap-3.5 transition duration-300 hover:-translate-y-0.5 hover:shadow-md">
          <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-500 shrink-0">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Batches</p>
            <p className="text-lg font-extrabold text-slate-850 mt-0.5">{lots.length}</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 flex items-center gap-3.5 transition duration-300 hover:-translate-y-0.5 hover:shadow-md">
          <div className="w-10 h-10 rounded-xl bg-amber-50/50 border border-amber-100 flex items-center justify-center text-amber-500 shrink-0">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Expiring 30d</p>
            <p className="text-lg font-extrabold text-slate-850 mt-0.5">{expiringCount}</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 flex items-center gap-3.5 transition duration-300 hover:-translate-y-0.5 hover:shadow-md">
          <div className="w-10 h-10 rounded-xl bg-rose-50/50 border border-rose-100 flex items-center justify-center text-rose-500 shrink-0">
            <XCircle className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Expired Lots</p>
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
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Healthy Batches</p>
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
              placeholder="Search lots by SKU, lot no, product name..."
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
              <option value="all">All Expiry</option>
              <option value="expiring30">Expiring ≤ 30 days</option>
              <option value="expiring90">Expiring ≤ 90 days</option>
              <option value="expired">Expired</option>
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
                Clear Filters
              </Button>
            )}
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50/80 text-[10px] uppercase tracking-wider font-bold text-slate-500 border-b border-slate-100">
              <tr>
                <th className="py-3.5 px-6 text-left">Product</th>
                <th className="py-3.5 px-6 text-left">Lot No</th>
                <th className="py-3.5 px-6 text-left">Serial No</th>
                <th className="py-3.5 px-6 text-left">Manufacture</th>
                <th className="py-3.5 px-6 text-left">Expiry</th>
                <th className="py-3.5 px-6 text-left">Supplier</th>
                <th className="py-3.5 px-6 text-left">Notes</th>
                <th className="py-3.5 px-6 text-center w-28">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-16 text-center text-slate-400">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-8 h-8 border-3 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
                      <span className="text-xs font-medium">Loading lots data...</span>
                    </div>
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-16 text-center text-slate-400 italic">
                    No lots found
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
                            title="Edit"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setDeleteTarget(lot)}
                            className="inline-flex items-center justify-center w-8 h-8 rounded-lg border border-slate-200 text-rose-600 bg-white hover:bg-rose-50 hover:text-rose-700 hover:border-rose-100 transition-colors shadow-sm"
                            title="Delete"
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
                  Delete Stock Lot
                </DialogTitle>
                <DialogDescription className="text-center text-sm text-gray-500 mt-1">
                  Are you sure you want to delete lot <span className="font-mono font-bold text-slate-800">{deleteTarget.lot_no}</span>?
                  This action cannot be undone and will remove all corresponding batch entries.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter className="flex-row justify-center gap-3 mt-4">
                <Button
                  variant="outline"
                  onClick={() => setDeleteTarget(null)}
                  disabled={deleting}
                  className="w-full sm:w-auto"
                >
                  Cancel
                </Button>
                <Button
                  variant="danger"
                  onClick={handleDelete}
                  loading={deleting}
                  className="w-full sm:w-auto"
                >
                  Yes, Delete
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
