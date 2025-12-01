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
  StockMove,
} from "@/features/inventory/store/stock/stockmove/stockMove.types";
import { SaleOrderDto } from "@/features/sales/dto/saleOrder.dto";
import { SaleOrderState } from "@/features/sales/store/saleOrder.slice";

interface CreateIssueModalProps {
  open: boolean;
  warehouses: Array<{ id: number; name: string }>;
  saleOrder: SaleOrderState;
  data: StockMove | null;
  onSubmit: (data: { form: IssueForm; lineItems: LineIssueItem[] }) => void;
  onClose: () => void;
}

export default function CreateReceiptModal({
  open,
  warehouses,
  data,
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

  const selectedWarehouse =
    warehouses.find((w) => w.id === data?.warehouse_from_id)?.name || "";

  const selectedSaleOrder =
    saleOrder.items.find((p) => p.id === data?.reference_id)?.order_no || "";

  useEffect(() => {
    if (!open) return;
    console.log("Modal open, data:", data);
    setLineItems([]);
    if (!data?.lines || data.lines.length === 0) return;
    const ids = data.lines.map((line) => line.product_id);
    Promise.all(ids.map((id) => dispatch(fetchProductByIdThunk(id)).unwrap()))
      .then((fetchedProducts) => {
        const items: LineIssueItem[] = (data.lines ?? []).map((line) => {
          const product = fetchedProducts.find((p) => p.id === line.product_id);
          return {
            id: line.id,
            product_id: product?.id ?? line.product_id,
            name: product?.name ?? "Unknown",
            sku: product?.sku ?? "",
            image: product?.image_url ?? "",
            uom: line.uom ?? "",
            quantity: line.quantity ?? 0,
          };
        });
        setLineItems(items);
        console.log("LineItems after fetch:", items);
      })
      .catch(() => {
        setLineItems([]);
      });
  }, [open, data, dispatch]);

  useEffect(() => {
    if (!open || !data) return;

    setForm({
      warehouse: data.warehouse_from_id?.toString() ?? "",
      referenceNo: data.reference_id?.toString() ?? "",
      notes: data.note ?? "",
      move_no: data.move_no ?? "",
      move_date: data.move_date ? data.move_date.split("T")[0] : "",
      type: data.type ?? "",
      reference_type: data.reference_type ?? "",
    });
    setSelectedSOId(data.reference_id.toString());
  }, [open, data]);

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
        (x: SaleOrderDto) => x.id.toString() === selectedSOId
      );
      if (!so || !so.lines) {
        setLineItems([]);
        return;
      }
      try {
        const fetchedProducts = await Promise.all(
          so.lines.map(async (line) => {
            const result = await dispatch(
              fetchProductByIdThunk(line.product_id!)
            ).unwrap();
            return {
              id: undefined,
              product_id: result.id,
              name: result.name,
              sku: result.sku,
              uom: result.uom,
              image: result.image_url,
              quantity: line.quantity,
            } as LineIssueItem;
          })
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
    }

    const finalForm = {
      ...form,
      referenceNo: selectedSOId,
    };

    console.log("Final Form:", finalForm);
    console.log("Product Lines:", lineItems);
    onSubmit({
      form: finalForm,
      lineItems,
    });
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
      <div className="bg-white w-[700px] rounded-xl shadow-xl p-6 max-h-[90vh] overflow-y-auto">
        {/* HEADER */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Add Issue</h2>
          <button onClick={onClose} className="!text-black text-xl font-bold">
            ✖
          </button>
        </div>

        {/* Warehouse */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="font-medium">Warehouse *</label>
            <Select
              value={form.warehouse}
              onValueChange={(v) =>
                setForm((prev) => ({ ...prev, warehouse: v }))
              }
              defaultLabel={selectedWarehouse}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select" />
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
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Move Date</label>
          <Input
            type="date"
            value={form.move_date}
            onChange={(value) => setForm({ ...form, move_date: value })}
            max={new Date().toISOString().split("T")[0]}
          />
        </div>

        {/* PO SELECT */}
        <div className="mt-4">
          <label className="font-medium">Sale Order *</label>

          <Select
            value={selectedSOId}
            onValueChange={setSelectedSOId}
            defaultLabel={selectedSaleOrder}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select Purchase Order" />
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
        <div className="mt-4">
          <label className="font-medium">Reference Number</label>
          <Input value={form.referenceNo} disabled />
        </div>

        <div className="mt-4">
          <label className="font-medium">Move Number</label>
          <Input value={form.move_no} disabled />
        </div>

        {/* TABLE */}
        <div className="mt-3 border rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-100 text-left">
              <tr>
                <th className="p-2">Product</th>
                <th className="p-2">SKU</th>
                <th className="p-2">Uom</th>
                <th className="p-2">Quantity</th>
                <th className="p-2 w-[60px]"></th>
              </tr>
            </thead>
            <tbody>
              {lineItems.length > 0 ? (
                lineItems.map((p) => (
                  <tr key={p.id} className="border-t">
                    <td className="p-2 flex items-center gap-3">
                      <img
                        src={p.image}
                        className="w-10 h-10 rounded object-cover"
                      />
                      {p.name}
                    </td>
                    <td className="p-2">{p.sku}</td>
                    <td className="p-2">{p.uom}</td>
                    <td className="p-2">{p.quantity}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="p-4 text-center text-gray-500">
                    No products selected
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Notes */}
        <div className="mt-4">
          <label className="font-medium">Notes</label>
          <Textarea
            value={form.notes}
            onChange={(v) => setForm((prev) => ({ ...prev, notes: v }))}
            placeholder="Notes"
            className="min-h-[80px]"
          />
        </div>

        {/* FOOTER */}
        <div className="flex justify-end gap-3 mt-6">
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button
            className="bg-orange-500 hover:bg-orange-600 text-white"
            onClick={handleSubmit}
          >
            Create
          </Button>
        </div>
      </div>
    </div>
  );
}
