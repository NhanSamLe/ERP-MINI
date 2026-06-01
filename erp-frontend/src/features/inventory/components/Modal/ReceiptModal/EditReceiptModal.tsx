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
import { useState, useEffect } from "react";
import { PurchaseOrder, PurchaseOrderState } from "../../../../purchase/store";
import { useDispatch } from "react-redux";
import { AppDispatch } from "../../../../../store/store";
import { toast } from "react-toastify";
import { fetchProductByIdThunk } from "../../../../products/store/product.thunks";
import { StockMove } from "../../../store/stock/stockmove/stockMove.types";
import { LocationSelect } from "../../LocationSelect";
import { UomSelect } from "../../UomSelect";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "../../../../../components/ui/dialog";
import { Card, CardHeader, CardTitle, CardContent } from "../../../../../components/ui/Card";
import { Package, Trash2, Calendar, Clipboard, ShoppingCart, ListCollapse } from "lucide-react";

export interface LineReceiptItem {
  id: number | undefined;
  product_id: number;
  name: string;
  image: string;
  sku: string;
  uom: string;
  uom_id?: number | null;
  uomOptions?: Array<{ id: number; code: string; name: string }>;
  quantity: number;
  location_to_id?: number | null;
}

export interface EditReceiptForm {
  warehouse: string;
  referenceNo: string;
  move_no: string;
  notes: string;
  move_date: string;
  type: string;
  reference_type: string;
}

interface EditReceiptModalProps {
  open: boolean;
  warehouses: Array<{ id: number; name: string }>;
  purchaseOrder: PurchaseOrderState;
  data: StockMove | null;
  onSubmit: (data: {
    form: EditReceiptForm;
    lineItems: LineReceiptItem[];
  }) => void;
  onClose: () => void;
}

export default function EditReceiptModal({
  open,
  warehouses,
  purchaseOrder,
  data,
  onSubmit,
  onClose,
}: EditReceiptModalProps) {
  const dispatch = useDispatch<AppDispatch>();

  const generateMoveNo = (): string => {
    const timestamp = Date.now();
    const randomNum = Math.floor(100 + Math.random() * 900);
    return `RC${timestamp}${randomNum}`;
  };

  const [form, setForm] = useState<EditReceiptForm>({
    warehouse: "",
    referenceNo: "",
    move_no: generateMoveNo(),
    notes: "",
    move_date: "",
    type: "receipt",
    reference_type: "purchase_order",
  });

  const [lineItems, setLineItems] = useState<LineReceiptItem[]>([]);
  const [selectedPOId, setSelectedPOId] = useState<string>("");
  const [isInitializing, setIsInitializing] = useState(false);

  const selectedWarehouseName =
    warehouses.find((w) => w.id === data?.warehouse_to_id)?.name || "";

  const selectedPurchaseOrder =
    purchaseOrder.items.find((p) => p.id === data?.reference_id)?.po_no || "";

  useEffect(() => {
    if (!open) return;
    setLineItems([]);
    if (!data?.lines || data.lines.length === 0) return;

    const items: LineReceiptItem[] = (data.lines as any[]).map((line) => ({
      id: line.id,
      product_id: Number(line.product_id ?? line.product?.id),
      name: line.product?.name ?? "",
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
      location_to_id: line.location_to_id ?? null,
    }));
    setLineItems(items);
  }, [open, data]);

  useEffect(() => {
    if (!open || !data) return;

    setForm({
      warehouse: data.warehouse_to_id?.toString() ?? "",
      referenceNo: data.reference_id?.toString() ?? "",
      notes: data.note ?? "",
      move_no: data.move_no ?? "",
      move_date: data.move_date ? data.move_date.split("T")[0] : "",
      type: data.type ?? "",
      reference_type: data.reference_type ?? "",
    });

    setSelectedPOId(data.reference_id.toString());
    setIsInitializing(true);
  }, [open, data]);

  useEffect(() => {
    if (selectedPOId) {
      setForm((prev) => ({ ...prev, referenceNo: selectedPOId }));
    }
  }, [selectedPOId]);

  useEffect(() => {
    const loadProducts = async () => {
      if (!selectedPOId) {
        setLineItems([]);
        return;
      }
      if (isInitializing) {
        setIsInitializing(false);
        return;
      }

      const po = purchaseOrder.items.find(
        (x: PurchaseOrder) => x.id.toString() === selectedPOId,
      );

      if (!po || !po.lines) {
        setLineItems([]);
        return;
      }

      try {
        const fetchedProducts = await Promise.all(
          po.lines.map(async (line) => {
            const result = await dispatch(
              fetchProductByIdThunk(line.product_id),
            ).unwrap();

            return {
              id: undefined,
              product_id: result.id,
              name: result.name,
              sku: result.sku,
              uom: result.uom?.name ?? result.uom?.code ?? "",
              uom_id: result.uom_id ?? null,
              uomOptions: [
                ...(result.uom ? [result.uom] : []),
                ...(result.purchaseUom &&
                result.purchaseUom.id !== result.uom?.id
                  ? [result.purchaseUom]
                  : []),
              ],
              image: result.image_url,
              quantity: line.qty_in_stock_uom ?? line.quantity,
            } as LineReceiptItem;
          }),
        );
        setLineItems(fetchedProducts);
      } catch (err) {
        console.error(err);
        toast.error("Failed to load product details");
      }
    };

    loadProducts();
  }, [selectedPOId, purchaseOrder.items, dispatch]);

  const handleQuantityChange = (id: number, value: number) => {
    setLineItems((prev) =>
      prev.map((item) =>
        item.product_id === id ? { ...item, quantity: value } : item,
      ),
    );
  };

  const handleSubmit = () => {
    if (!selectedPOId) {
      toast.error("Please select a Purchase Order");
      return;
    }

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
      if (!p.quantity || p.quantity <= 0) {
        toast.error(`Invalid quantity for product: ${p.name}`);
        return;
      }
    }
    const finalForm = {
      ...form,
      referenceNo: selectedPOId,
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
          <div className="w-10 h-10 rounded-xl bg-orange-50 border border-orange-100 flex items-center justify-center text-orange-500 shadow-sm shrink-0">
            <Package className="w-5 h-5" />
          </div>
          <div>
            <DialogTitle className="text-lg font-bold text-slate-900">Edit Stock Receipt</DialogTitle>
            <DialogDescription className="text-xs text-slate-400 mt-0.5">
              Modify raw materials or products received from incoming purchase orders
            </DialogDescription>
          </div>
        </DialogHeader>

        <div className="space-y-6 pt-4">
          {/* Main info fields */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* Warehouse Select */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Warehouse *</label>
              <Select
                value={form.warehouse}
                onValueChange={(v) =>
                  setForm((prev) => ({ ...prev, warehouse: v }))
                }
                defaultLabel={selectedWarehouseName}
              >
                <SelectTrigger className="w-full h-10 bg-white border-slate-200 focus:ring-orange-500 focus:border-orange-500 rounded-lg">
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
                className="border-slate-200 focus:ring-orange-400 focus:border-orange-400 h-10"
                max={new Date().toISOString().split("T")[0]}
              />
            </div>

            {/* Purchase Order Select */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                <ShoppingCart className="w-3.5 h-3.5 text-slate-400" /> Purchase Order *
              </label>
              <Select
                value={selectedPOId}
                onValueChange={setSelectedPOId}
                defaultLabel={selectedPurchaseOrder}
              >
                <SelectTrigger className="w-full h-10 bg-white border-slate-200 focus:ring-orange-500 focus:border-orange-500 rounded-lg">
                  <SelectValue placeholder="Select PO" />
                </SelectTrigger>
                <SelectContent>
                  {purchaseOrder.items?.map((po: PurchaseOrder) => (
                    <SelectItem key={po.id} value={po.id.toString()}>
                      {po.po_no}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Reference Number */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                <Clipboard className="w-3.5 h-3.5 text-slate-400" /> Reference No
              </label>
              <Input 
                value={form.referenceNo || "Auto-assigned"} 
                disabled 
                className="h-10 border-slate-200 bg-slate-50 text-slate-500 font-mono font-semibold"
              />
            </div>

            {/* Move Number */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Move Number</label>
              <Input 
                value={form.move_no} 
                disabled 
                className="h-10 border-slate-200 bg-slate-50 text-slate-500 font-mono font-semibold"
              />
            </div>
          </div>

          {/* TABLE SECTION */}
          <Card className="border-slate-100 shadow-sm overflow-hidden bg-white/80 backdrop-blur-md">
            <CardHeader className="px-5 py-3.5 bg-slate-50/15 border-b border-slate-100 flex flex-row items-center gap-2">
              <ListCollapse className="w-4.5 h-4.5 text-slate-700" />
              <CardTitle className="text-sm font-semibold text-slate-800">Dispatch Item Lines</CardTitle>
            </CardHeader>
            <CardContent className="p-0 overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50/80 text-[10px] uppercase tracking-wider font-bold text-slate-500 border-b border-slate-100">
                  <tr>
                    <th className="py-3.5 px-5 text-left">Product</th>
                    <th className="py-3.5 px-5 text-left">SKU</th>
                    <th className="py-3.5 px-5 text-left w-28">UOM</th>
                    <th className="py-3.5 px-5 text-right w-24">Qty</th>
                    <th className="py-3.5 px-5 text-left w-40">Location (To)</th>
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
                        <td className="py-3 px-5">
                          <UomSelect
                            value={p.uom_id}
                            onChange={(uomId) =>
                              setLineItems((prev) =>
                                prev.map((x) =>
                                  x.product_id === p.product_id ? { ...x, uom_id: uomId } : x,
                                ),
                              )
                            }
                          />
                        </td>
                        <td className="py-3 px-5 text-right">
                          <input
                            type="number"
                            value={p.quantity}
                            min={1}
                            step="any"
                            className="w-20 h-9 border border-slate-200 rounded-lg px-2.5 text-right font-mono font-bold focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-orange-400 transition"
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
                            value={p.location_to_id}
                            onChange={(locId) =>
                              setLineItems((prev) =>
                                prev.map((x) =>
                                  x.product_id === p.product_id
                                    ? { ...x, location_to_id: locId }
                                    : x,
                                ),
                              )
                            }
                            types={["internal", "input"]}
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
                        No purchase order selected or loaded product lines.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </CardContent>
          </Card>

          {/* Notes */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Internal Notes</label>
            <Textarea
              value={form.notes}
              onChange={(v) => setForm((prev) => ({ ...prev, notes: v }))}
              placeholder="Provide notes or special receipt instructions..."
              className="min-h-[80px] border-slate-200 focus:ring-orange-400 focus:border-orange-400 rounded-lg text-sm placeholder:text-slate-400"
            />
          </div>

          {/* FOOTER */}
          <DialogFooter className="pt-4 border-t border-slate-100 flex-row justify-end gap-3">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button
              className="bg-orange-500 hover:bg-orange-600 text-white"
              onClick={handleSubmit}
            >
              Update Receipt
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}
