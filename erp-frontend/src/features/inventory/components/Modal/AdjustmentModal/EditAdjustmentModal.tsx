import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "../../../../../components/ui/Select";
import { Button } from "../../../../../components/ui/Button";
import { Input } from "../../../../../components/ui/input";
import { Textarea } from "../../../../../components/ui/textarea";
import { useState, useEffect, useRef } from "react";
import { useDispatch } from "react-redux";
import { AppDispatch } from "../../../../../store/store";
import { Product } from "@/features/products/store/product.types";
import { searchProductsThunk } from "@/features/products/store/product.thunks";
import { toast } from "react-toastify";
import {
  AdjustmentForm,
  LineAdjustmentItem,
  StockMove,
} from "@/features/inventory/store/stock/stockmove/stockMove.types";
import { LocationSelect } from "../../LocationSelect";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "../../../../../components/ui/dialog";
import { Card, CardHeader, CardTitle, CardContent } from "../../../../../components/ui/Card";
import { SlidersHorizontal, Calendar, Clipboard, Search, Trash2, ListCollapse } from "lucide-react";

interface AdjustmentModalProps {
  open: boolean;
  warehouses: Array<{ id: number; name: string }>;
  data: StockMove | null;
  onSubmit: (data: {
    form: AdjustmentForm;
    lineItems: LineAdjustmentItem[];
  }) => void;
  onClose: () => void;
}

export default function EditAdjustmentModal({
  open,
  warehouses,
  data,
  onSubmit,
  onClose,
}: AdjustmentModalProps) {
  const dispatch = useDispatch<AppDispatch>();

  const generateMoveNo = (): string => {
    const timestamp = Date.now();
    const randomNum = Math.floor(100 + Math.random() * 900);
    return `AD${timestamp}${randomNum}`;
  };

  const [form, setForm] = useState<AdjustmentForm>({
    warehouse: "",
    move_no: generateMoveNo(),
    move_date: "",
    type: "adjustment",
    notes: "",
    reference_type: "adjustment",
  });

  const [lineItems, setLineItems] = useState<LineAdjustmentItem[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState<Product[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const selectedWarehouse =
    warehouses.find((w) => w.id === data?.warehouse_from_id)?.name || "";

  useEffect(() => {
    if (!open) return;
    setLineItems([]);
    if (!data?.lines || data.lines.length === 0) return;

    const items: LineAdjustmentItem[] = (data.lines as any[]).map((line) => ({
      id: line.id,
      product_id: Number(line.product_id ?? line.product?.id),
      name: line.product?.name ?? "Unknown",
      sku: line.product?.sku ?? "",
      image: line.product?.image_url ?? "",
      uom: line.product?.uom?.name ?? line.product?.uom?.code ?? "",
      uom_id: line.uom_id ?? line.product?.uom_id ?? null,
      uomOptions: [
        ...(line.product?.uom ? [line.product.uom] : []),
        ...(line.product?.purchaseUom &&
        line.product.purchaseUom.id !== line.product?.uom?.id
          ? [line.product.purchaseUom]
          : []),
      ],
      quantity: Number(line.quantity) ?? 0,
      location_from_id: line.location_from_id ?? null,
    }));
    setLineItems(items);
  }, [open, data]);

  useEffect(() => {
    if (!open || !data) return;

    setForm({
      warehouse: data.warehouse_from_id?.toString() ?? "",
      notes: data.note ?? "",
      move_no: data.move_no ?? "",
      move_date: data.move_date ? data.move_date.split("T")[0] : "",
      type: data.type ?? "",
      reference_type: data.reference_type ?? "",
    });

    setSearchTerm("");
  }, [open, data]);

  useEffect(() => {
    const timer = setTimeout(() => {
      const keyword = searchTerm.trim();

      if (!keyword || keyword.length < 2) {
        setSearchResults([]);
        setShowDropdown(false);
        return;
      }

      setSearchLoading(true);

      dispatch(searchProductsThunk(keyword))
        .unwrap()
        .then((res) => {
          setSearchResults(res);
          setShowDropdown(true);
        })
        .catch(() => setSearchResults([]))
        .finally(() => setSearchLoading(false));
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm, dispatch]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelectProduct = (p: Product) => {
    if (lineItems.some((l) => l.product_id === p.id)) {
      toast.warning("Product is already in the list!");
      setSearchTerm("");
      return;
    }
    setLineItems((prev) => [
      ...prev,
      {
        id: undefined,
        product_id: p.id,
        name: p.name,
        sku: p.sku,
        uom:
          (p.uom as any)?.name ?? (p.uom as any)?.code ?? (p.uom as any) ?? "",
        uom_id: (p as any).uom_id ?? null,
        uomOptions: [
          ...(p.uom ? [p.uom as any] : []),
          ...(p.purchaseUom && (p.purchaseUom as any).id !== (p.uom as any)?.id
            ? [p.purchaseUom as any]
            : []),
        ],
        image: p.image_url ?? "",
        quantity: 1,
      },
    ]);
    setSearchTerm("");
    setShowDropdown(false);
  };

  const handleQuantityChange = (id: number, value: number) => {
    setLineItems((prev) =>
      prev.map((item) =>
        item.product_id === id ? { ...item, quantity: value } : item,
      ),
    );
  };

  const handleSubmit = () => {
    if (!form.warehouse) {
      toast.error("Please select a Warehouse");
      return;
    }
    if (!form.move_date) {
      toast.error("Please select a Move Date");
      return;
    }

    if (lineItems.length === 0) {
      toast.error("Please add at least one product");
      return;
    }

    for (const p of lineItems) {
      if (!p.quantity) {
        toast.error(`Invalid quantity for product: ${p.name}`);
        return;
      }
      if (!p.location_from_id) {
        toast.error(`Please select location for product: ${p.name}`);
        return;
      }
    }

    const finalForm = {
      ...form,
    };
    onSubmit({
      form: finalForm,
      lineItems,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="w-full sm:max-w-4xl max-h-[85vh] overflow-y-auto">
        <DialogHeader className="pb-4 border-b border-slate-100 flex flex-row items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-500 shadow-sm shrink-0">
            <SlidersHorizontal className="w-5 h-5" />
          </div>
          <div>
            <DialogTitle className="text-lg font-bold text-slate-900">Edit Stock Adjustment</DialogTitle>
            <DialogDescription className="text-xs text-slate-400 mt-0.5">
              Modify manual variance adjustments, quantities corrections and locations
            </DialogDescription>
          </div>
        </DialogHeader>

        <div className="space-y-6 pt-4">
          {/* Main Info */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* Warehouse Select */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Warehouse *</label>
              <Select
                value={form.warehouse}
                onValueChange={(v) =>
                  setForm((prev) => ({ ...prev, warehouse: v }))
                }
                defaultLabel={selectedWarehouse}
              >
                <SelectTrigger className="w-full h-10 bg-white border-slate-200 focus:ring-amber-500 focus:border-amber-500 rounded-lg">
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

            {/* Move Date */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-slate-400" /> Move Date *
              </label>
              <Input
                type="date"
                value={form.move_date}
                onChange={(value) => setForm({ ...form, move_date: value })}
                className="border-slate-200 focus:ring-amber-455 focus:border-amber-455 h-10"
                max={new Date().toISOString().split("T")[0]}
              />
            </div>

            {/* Move Number */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                <Clipboard className="w-3.5 h-3.5 text-slate-400" /> Move Number
              </label>
              <Input 
                value={form.move_no} 
                disabled 
                className="h-10 border-slate-200 bg-slate-50 text-slate-500 font-mono font-semibold"
              />
            </div>
          </div>

          {/* Product Search Input */}
          <div className="flex flex-col gap-1.5 relative" ref={dropdownRef}>
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
              <Search className="w-3.5 h-3.5 text-slate-400" /> Search & Add Product
            </label>
            <div className="relative">
              <Input
                value={searchTerm}
                onChange={(value) => setSearchTerm(value)}
                placeholder="Type product name or SKU to search and add..."
                className="pl-10 h-10 border-slate-200 focus:ring-amber-400 focus:border-amber-400 rounded-lg placeholder:text-slate-400"
              />
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            </div>

            {/* Search Dropdown */}
            {showDropdown && (
              <div className="absolute w-full mt-1.5 bg-white border border-slate-100 rounded-xl shadow-lg max-h-60 overflow-y-auto z-50 divide-y divide-slate-50">
                {searchLoading ? (
                  <div className="p-4 text-center text-sm text-slate-400 font-medium italic">Loading results...</div>
                ) : searchResults.length > 0 ? (
                  searchResults.map((p) => (
                    <div
                      key={p.id}
                      onClick={() => handleSelectProduct(p)}
                      className="flex items-center gap-3 p-3 hover:bg-slate-50 cursor-pointer transition-colors"
                    >
                      <img
                        src={p.image_url ?? ""}
                        className="w-10 h-10 rounded-lg object-cover bg-slate-50 border border-slate-100 shadow-xxs shrink-0"
                        alt={p.name}
                      />
                      <div className="flex flex-col">
                        <span className="font-semibold text-slate-800 text-sm">{p.name}</span>
                        <span className="text-xs font-mono font-bold text-slate-400 uppercase">SKU: {p.sku}</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-4 text-center text-sm text-slate-400 font-medium italic">No products found</div>
                )}
              </div>
            )}
          </div>

          {/* TABLE SECTION */}
          <Card className="border-slate-100 shadow-sm overflow-hidden bg-white/80 backdrop-blur-md">
            <CardHeader className="px-5 py-3.5 bg-slate-50/15 border-b border-slate-100 flex flex-row items-center gap-2">
              <ListCollapse className="w-4.5 h-4.5 text-slate-700" />
              <CardTitle className="text-sm font-semibold text-slate-800">Adjustment Item Lines</CardTitle>
            </CardHeader>
            <CardContent className="p-0 overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50/80 text-[10px] uppercase tracking-wider font-bold text-slate-500 border-b border-slate-100">
                  <tr>
                    <th className="py-3.5 px-5 text-left">Product</th>
                    <th className="py-3.5 px-5 text-left">SKU</th>
                    <th className="py-3.5 px-5 text-left w-24">UOM</th>
                    <th className="py-3.5 px-5 text-right w-24">Qty Change</th>
                    <th className="py-3.5 px-5 text-left w-48">Location</th>
                    <th className="py-3.5 px-5 text-center w-14"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {lineItems.length > 0 ? (
                    lineItems.map((p) => (
                      <tr key={p.product_id} className="hover:bg-slate-50/30 transition-colors align-middle">
                        <td className="py-3 px-5 flex items-center gap-3">
                          {p.image && (
                            <img
                              src={p.image}
                              className="w-9 h-9 rounded-lg object-cover border border-slate-100 bg-slate-50 shadow-xxs shrink-0"
                            />
                          )}
                          <span className="font-semibold text-slate-800">{p.name}</span>
                        </td>
                        <td className="py-3 px-5 font-mono text-xs font-bold text-slate-450 uppercase">{p.sku}</td>
                        <td className="py-3 px-5 text-slate-500 font-medium">{p.uom || "—"}</td>
                        <td className="py-3 px-5 text-right">
                          <input
                            type="number"
                            value={p.quantity}
                            step="any"
                            className="w-20 h-9 border border-slate-200 rounded-lg px-2 text-right font-mono font-bold focus:outline-none focus:ring-2 focus:ring-amber-450 focus:border-amber-450 transition"
                            onChange={(e) =>
                              handleQuantityChange(p.product_id, Number(e.target.value))
                            }
                          />
                        </td>
                        <td className="py-3 px-5">
                          <LocationSelect
                            warehouseId={
                              form.warehouse ? Number(form.warehouse) : null
                            }
                            value={p.location_from_id}
                            onChange={(locId) =>
                              setLineItems((prev) =>
                                prev.map((x) =>
                                  x.product_id === p.product_id
                                    ? { ...x, location_from_id: locId }
                                    : x,
                                ),
                              )
                            }
                            types={["internal"]}
                            placeholder="— Select —"
                          />
                        </td>
                        <td className="py-3 px-5 text-center">
                          <button
                            className="inline-flex items-center justify-center w-8 h-8 rounded-lg border border-slate-200 text-rose-600 bg-white hover:bg-rose-50 hover:border-rose-100 transition-colors shadow-sm"
                            onClick={() =>
                              setLineItems((prev) =>
                                prev.filter((x) => x.product_id !== p.product_id),
                              )
                            }
                            title="Delete Line"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-slate-400 italic">
                        Use search box above to add adjustment products.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </CardContent>
          </Card>

          {/* Notes */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Internal Notes *</label>
            <Textarea
              value={form.notes}
              onChange={(value) => setForm((prev) => ({ ...prev, notes: value }))}
              placeholder="Provide reason or description for manual adjustment..."
              className="min-h-[80px] border-slate-200 focus:ring-amber-450 focus:border-amber-450 rounded-lg text-sm placeholder:text-slate-400"
            />
          </div>

          {/* FOOTER */}
          <DialogFooter className="pt-4 border-t border-slate-100 flex-row justify-end gap-3">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button
              className="bg-amber-500 hover:bg-amber-600 text-white"
              onClick={handleSubmit}
            >
              Update Adjustment
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}
