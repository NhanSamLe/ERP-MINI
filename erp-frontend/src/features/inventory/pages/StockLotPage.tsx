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
import { Plus, Pencil, Trash2, Search, AlertTriangle, X } from "lucide-react";
import { toast } from "react-toastify";
import { formatMoney } from "@/utils/currency.helper";

// ─── Helpers ─────────────────────────────────────────────────────────────────
function daysUntil(dateStr: string | null | undefined): number | null {
  if (!dateStr) return null;
  const diff = new Date(dateStr).getTime() - Date.now();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

function ExpiryBadge({ date }: { date: string | null | undefined }) {
  if (!date) return <span className="text-gray-400 text-xs">—</span>;
  const days = daysUntil(date);
  if (days === null) return <span className="text-xs">{date}</span>;
  if (days < 0)
    return (
      <span className="text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-700 font-medium">
        Expired
      </span>
    );
  if (days <= 30)
    return (
      <span className="text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-700 font-medium">
        {date} ({days}d)
      </span>
    );
  if (days <= 90)
    return (
      <span className="text-xs px-2 py-0.5 rounded-full bg-orange-100 text-orange-700 font-medium">
        {date} ({days}d)
      </span>
    );
  return <span className="text-xs text-gray-600">{date}</span>;
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
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg">
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <h2 className="text-lg font-semibold text-gray-800">
            {mode === "create" ? "Create Lot" : "Edit Lot"}
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
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Product <span className="text-red-500">*</span>
              </label>
              <select
                value={form.product_id}
                onChange={(e) =>
                  setForm({ ...form, product_id: e.target.value })
                }
                disabled={mode === "edit"}
                className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-orange-400 focus:outline-none"
              >
                <option value="">-- Select Product --</option>
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.sku})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Lot No <span className="text-red-500">*</span>
              </label>
              <input
                value={form.lot_no}
                onChange={(e) => setForm({ ...form, lot_no: e.target.value })}
                disabled={mode === "edit"}
                className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-orange-400 focus:outline-none font-mono"
                placeholder="e.g. LOT-2026-001"
              />
              {mode === "edit" && (
                <p className="text-xs text-gray-400 mt-1">
                  Lot No cannot be changed
                </p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Serial No
              </label>
              <input
                value={form.serial_no}
                onChange={(e) =>
                  setForm({ ...form, serial_no: e.target.value })
                }
                className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-orange-400 focus:outline-none"
                placeholder="Optional"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Manufacture Date
              </label>
              <input
                type="date"
                value={form.manufacture_date}
                onChange={(e) =>
                  setForm({ ...form, manufacture_date: e.target.value })
                }
                className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-orange-400 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Expiry Date
              </label>
              <input
                type="date"
                value={form.expiry_date}
                onChange={(e) =>
                  setForm({ ...form, expiry_date: e.target.value })
                }
                className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-orange-400 focus:outline-none"
              />
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Supplier
              </label>
              <select
                value={form.supplier_id}
                onChange={(e) =>
                  setForm({ ...form, supplier_id: e.target.value })
                }
                className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-orange-400 focus:outline-none"
              >
                <option value="">-- Select Supplier --</option>
                {suppliers.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Notes
              </label>
              <textarea
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                rows={2}
                className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-orange-400 focus:outline-none"
                placeholder="Optional notes..."
              />
            </div>
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
                  ? "Create Lot"
                  : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between bg-white px-6 py-4 rounded-xl border shadow-sm">
        <div>
          <h1 className="text-xl font-semibold text-gray-800">Stock Lots</h1>
          <p className="text-sm text-gray-500">
            {lots.length} lots total
            {expiringCount > 0 && (
              <span className="ml-2 text-red-500 font-medium">
                · {expiringCount} expiring soon
              </span>
            )}
          </p>
        </div>
        <button
          onClick={() => {
            setEditTarget(null);
            setFormMode("create");
          }}
          className="flex items-center gap-1.5 bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition"
        >
          <Plus className="w-4 h-4" /> Create Lot
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white px-4 py-3 rounded-xl border shadow-sm flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by lot no, product, serial..."
            className="w-full pl-9 pr-4 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-orange-400 focus:outline-none"
          />
        </div>
        <select
          value={filterExpiry}
          onChange={(e) => setFilterExpiry(e.target.value as any)}
          className="border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-orange-400 focus:outline-none"
        >
          <option value="all">All Expiry</option>
          <option value="expiring30">Expiring ≤ 30 days</option>
          <option value="expiring90">Expiring ≤ 90 days</option>
          <option value="expired">Expired</option>
        </select>
        {(search || filterExpiry !== "all") && (
          <button
            onClick={() => {
              setSearch("");
              setFilterExpiry("all");
            }}
            className="text-sm text-orange-500 hover:underline"
          >
            Clear
          </button>
        )}
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-600 text-left">
            <tr>
              <th className="px-4 py-3 font-medium">Product</th>
              <th className="px-4 py-3 font-medium">Lot No</th>
              <th className="px-4 py-3 font-medium">Serial No</th>
              <th className="px-4 py-3 font-medium">Manufacture</th>
              <th className="px-4 py-3 font-medium">Expiry</th>
              <th className="px-4 py-3 font-medium">Supplier</th>
              <th className="px-4 py-3 font-medium">Notes</th>
              <th className="px-4 py-3 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading ? (
              <tr>
                <td colSpan={8} className="py-12 text-center">
                  <div className="w-6 h-6 border-2 border-orange-400 border-t-transparent rounded-full animate-spin mx-auto" />
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-12 text-center text-gray-400">
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
                    className={`hover:bg-gray-50 ${isExpired ? "bg-red-50" : isWarning ? "bg-orange-50" : ""}`}
                  >
                    <td className="px-4 py-3">
                      <div className="font-medium text-gray-800">
                        {lot.product?.name || `#${lot.product_id}`}
                      </div>
                      <div className="text-xs text-gray-400 font-mono">
                        {lot.product?.sku}
                      </div>
                    </td>
                    <td className="px-4 py-3 font-mono text-gray-700">
                      {lot.lot_no}
                    </td>
                    <td className="px-4 py-3 text-gray-500 text-xs">
                      {lot.serial_no || "—"}
                    </td>
                    <td className="px-4 py-3 text-gray-500 text-xs">
                      {lot.manufacture_date || "—"}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        {(isExpired || isWarning) && (
                          <AlertTriangle
                            className={`w-3.5 h-3.5 ${isExpired ? "text-red-500" : "text-orange-500"}`}
                          />
                        )}
                        <ExpiryBadge date={lot.expiry_date} />
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-500 text-xs">
                      {lot.supplier?.name || "—"}
                    </td>
                    <td className="px-4 py-3 text-gray-400 text-xs max-w-[120px] truncate">
                      {lot.notes || "—"}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => {
                            setEditTarget(lot);
                            setFormMode("edit");
                          }}
                          className="p-1.5 rounded hover:bg-blue-50 text-blue-500 transition"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setDeleteTarget(lot)}
                          className="p-1.5 rounded hover:bg-red-50 text-red-500 transition"
                        >
                          <Trash2 className="w-4 h-4" />
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

      {/* Delete Confirm */}
      {deleteTarget && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-lg p-6 w-96 text-center">
            <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
              <Trash2 className="w-6 h-6 text-red-500" />
            </div>
            <h2 className="text-lg font-semibold text-gray-800 mb-2">
              Delete Lot?
            </h2>
            <p className="text-sm text-gray-500 mb-1">
              You are about to delete lot
            </p>
            <p className="text-sm font-mono font-medium text-gray-800 mb-5">
              {deleteTarget.lot_no}
            </p>
            <div className="flex justify-center gap-3">
              <button
                onClick={() => setDeleteTarget(null)}
                disabled={deleting}
                className="px-5 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="px-5 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg text-sm"
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
