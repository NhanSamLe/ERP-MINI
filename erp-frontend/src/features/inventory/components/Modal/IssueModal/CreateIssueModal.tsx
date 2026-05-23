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
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "../../../../../store/store";
import { toast } from "react-toastify";
import { fetchProductByIdThunk } from "@/features/products/store/product.thunks";
import {
  IssueForm,
  LineIssueItem,
} from "@/features/inventory/store/stock/stockmove/stockMove.types";
import { SaleOrderDto } from "@/features/sales/dto/saleOrder.dto";
import { fetchSaleOrdersByStatus } from "@/features/sales/store/saleOrder.slice";
import { LocationSelect } from "../../LocationSelect";
import { LotSelect } from "../../LotSelect";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "../../../../../components/ui/dialog";
import { Card, CardHeader, CardTitle, CardContent } from "../../../../../components/ui/Card";
import { Truck, Calendar, Clipboard, ShoppingBag, ListCollapse, Trash2 } from "lucide-react";

interface CreateIssueModalProps {
  open: boolean;
  warehouses: Array<{ id: number; name: string }>;
  onSubmit: (data: { form: IssueForm; lineItems: LineIssueItem[] }) => void;
  onClose: () => void;
}

export default function CreateIssueModal({
  open,
  warehouses,
  onSubmit,
  onClose,
}: CreateIssueModalProps) {
  const dispatch = useDispatch<AppDispatch>();
  const saleOrder = useSelector((state: RootState) => state.saleOrder);

  const generateMoveNo = (): string => {
    const timestamp = Date.now();
    const randomNum = Math.floor(100 + Math.random() * 900);
    return `IS${timestamp}${randomNum}`;
  };

  const [form, setForm] = useState<IssueForm>({
    warehouse: "",
    referenceNo: "",
    move_no: generateMoveNo(),
    notes: "",
    move_date: "",
    type: "issue",
    reference_type: "sale_order",
  });

  const [lineItems, setLineItems] = useState<LineIssueItem[]>([]);
  const [selectedSOId, setSelectedSOId] = useState<string>("");

  useEffect(() => {
    dispatch(fetchSaleOrdersByStatus("confirmed"));
  }, [dispatch]);

  useEffect(() => {
    if (!open) return;
    setForm({
      warehouse: "",
      referenceNo: "",
      notes: "",
      move_no: generateMoveNo(),
      move_date: "",
      type: "issue",
      reference_type: "sale_order",
    });
    setLineItems([]);
    setSelectedSOId("");
  }, [open]);

  useEffect(() => {
    if (selectedSOId) {
      setForm((prev) => ({ ...prev, referenceNo: selectedSOId }));
    }
  }, [selectedSOId]);

  useEffect(() => {
    const loadProducts = async () => {
      if (!selectedSOId) {
        setLineItems([]);
        return;
      }
      const so = saleOrder.items.find(
        (x: SaleOrderDto) => x.id.toString() === selectedSOId,
      );
      if (!so || !so.lines) {
        setLineItems([]);
        return;
      }
      try {
        const fetchedProducts = await Promise.all(
          so.lines.map(async (line) => {
            const result = await dispatch(
              fetchProductByIdThunk(line.product_id!),
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
              quantity: line.quantity,
            } as LineIssueItem;
          }),
        );

        setLineItems(fetchedProducts);
      } catch (err) {
        console.error(err);
        toast.error("Failed to load product details");
      }
    };

    loadProducts();
  }, [selectedSOId, saleOrder.items, dispatch]);

  const handleSubmit = () => {
    if (!selectedSOId) {
      toast.error("Please select a Sale order");
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
      if (!p.product_id) {
        toast.error("Some product items are missing ID");
        return;
      }
      if (!p.quantity || p.quantity <= 0) {
        toast.error(`Invalid quantity for product: ${p.name}`);
        return;
      }
      if (!p.location_from_id) {
        toast.error(`Please select a location for product: ${p.name}`);
        return;
      }
      if (!(p as any).lot_id) {
        toast.error(`Please select lot for product: ${p.name}`);
        return;
      }
    }

    const finalForm = {
      ...form,
      referenceNo: selectedSOId,
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
          <div className="w-10 h-10 rounded-xl bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-500 shadow-sm shrink-0">
            <Truck className="w-5 h-5" />
          </div>
          <div>
            <DialogTitle className="text-lg font-bold text-slate-900">Create Stock Issue</DialogTitle>
            <DialogDescription className="text-xs text-slate-400 mt-0.5">
              Release finished goods or products to fulfill confirmed sale orders
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
              >
                <SelectTrigger className="w-full h-10 bg-white border-slate-200 focus:ring-rose-500 focus:border-rose-500 rounded-lg">
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
                className="border-slate-200 focus:ring-rose-400 focus:border-rose-400 h-10"
                max={new Date().toISOString().split("T")[0]}
              />
            </div>

            {/* Sale Order Select */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                <ShoppingBag className="w-3.5 h-3.5 text-slate-400" /> Sale Order *
              </label>
              <Select value={selectedSOId} onValueChange={setSelectedSOId}>
                <SelectTrigger className="w-full h-10 bg-white border-slate-200 focus:ring-rose-500 focus:border-rose-500 rounded-lg">
                  <SelectValue placeholder="Select SO" />
                </SelectTrigger>
                <SelectContent>
                  {saleOrder.items?.map((so: SaleOrderDto) => (
                    <SelectItem key={so.id} value={so.id.toString()}>
                      {so.order_no}
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
                    <th className="py-3.5 px-5 text-left w-24">UOM</th>
                    <th className="py-3.5 px-5 text-right w-24">Qty</th>
                    <th className="py-3.5 px-5 text-left w-44">Location (From)</th>
                    <th className="py-3.5 px-5 text-left w-44">Lot</th>
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
                        <td className="py-3 px-5 text-right font-mono font-bold text-slate-800 pr-8">{p.quantity}</td>
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
                            types={["internal", "output"]}
                            placeholder="— Select —"
                          />
                        </td>
                        <td className="py-3 px-5">
                          <LotSelect
                            productId={p.product_id}
                            value={(p as any).lot_id}
                            onChange={(lotId) =>
                              setLineItems((prev) =>
                                prev.map((x) =>
                                  x.product_id === p.product_id
                                    ? { ...x, lot_id: lotId }
                                    : x,
                                ),
                              )
                            }
                          />
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-slate-400 italic">
                        No sale order selected or loaded product lines.
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
              placeholder="Provide notes or special outbound instructions..."
              className="min-h-[80px] border-slate-200 focus:ring-rose-450 focus:border-rose-450 rounded-lg text-sm placeholder:text-slate-400"
            />
          </div>

          {/* FOOTER */}
          <DialogFooter className="pt-4 border-t border-slate-100 flex-row justify-end gap-3">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button
              className="bg-rose-500 hover:bg-rose-600 text-white"
              onClick={handleSubmit}
            >
              Create Issue
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}
