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
import {
  fetchPurchaseOrderByStatus,
  PurchaseOrder,
} from "../../../../purchase/store";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "../../../../../store/store";
import { toast } from "react-toastify";
import { fetchProductByIdThunk } from "@/features/products/store/product.thunks";

export interface ProductItem {
  id: number;
  name: string;
  image: string;
  sku: string;
  uom: string;
  quantity: number;
}

export interface CreateReceiptForm {
  warehouse: string;
  referenceNo: string;
  move_no: string;
  notes: string;
  move_date: string;
  type: string;
  reference_type: string;
}

interface CreateReceiptModalProps {
  open: boolean;
  warehouses: Array<{ id: number; name: string }>;
  onSubmit: (data: {
    form: CreateReceiptForm;
    products: ProductItem[];
  }) => void;
  onClose: () => void;
}

export default function CreateReceiptModal({
  open,
  warehouses,
  onSubmit,
  onClose,
}: CreateReceiptModalProps) {
  const dispatch = useDispatch<AppDispatch>();
  const purchaseOrder = useSelector((state: RootState) => state.purchaseOrder);

  const generateMoveNo = (): string => {
    const timestamp = Date.now();
    const randomNum = Math.floor(100 + Math.random() * 900);
    return `RC${timestamp}${randomNum}`;
  };

  const [form, setForm] = useState<CreateReceiptForm>({
    warehouse: "",
    referenceNo: "",
    move_no: generateMoveNo(),
    notes: "",
    move_date: "",
    type: "receipt",
    reference_type: "purchase_order",
  });

  const [products, setProducts] = useState<ProductItem[]>([]);
  const [selectedPOId, setSelectedPOId] = useState<string>("");

  useEffect(() => {
    dispatch(fetchPurchaseOrderByStatus("confirmed,partially_received"));
  }, [dispatch]);

  useEffect(() => {
    if (!open) return;
    setForm({
      warehouse: "",
      referenceNo: "",
      notes: "",
      move_no: generateMoveNo(),
      move_date: "",
      type: "receipt",
      reference_type: "purchase_order",
    });
    setProducts([]);
    setSelectedPOId("");
  }, [open]);
  useEffect(() => {
    if (selectedPOId) {
      setForm((prev) => ({ ...prev, referenceNo: selectedPOId }));
    }
  }, [selectedPOId]);

  useEffect(() => {
    const loadProducts = async () => {
      if (!selectedPOId) {
        setProducts([]);
        return;
      }

      const po = purchaseOrder.items.find(
        (x: PurchaseOrder) => x.id.toString() === selectedPOId
      );

      if (!po || !po.lines) {
        setProducts([]);
        return;
      }

      try {
        // Gọi API song song cho từng product
        const fetchedProducts = await Promise.all(
          po.lines.map(async (line) => {
            const result = await dispatch(
              fetchProductByIdThunk(line.product_id)
            ).unwrap(); // ép return type là Product

            return {
              id: result.id,
              name: result.name,
              sku: result.sku,
              uom: result.uom,
              image: result.image_url,
              quantity: line.quantity,
            } as ProductItem;
          })
        );

        setProducts(fetchedProducts);
      } catch (err) {
        console.error(err);
        toast.error("Failed to load product details");
      }
    };

    loadProducts();
  }, [selectedPOId, purchaseOrder.items, dispatch]);

  const handleQuantityChange = (id: number, value: number) => {
    setProducts((prev) =>
      prev.map((item) => (item.id === id ? { ...item, quantity: value } : item))
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

    if (products.length === 0) {
      toast.error("Please add at least one product");
      return;
    }

    for (const p of products) {
      if (!p.id) {
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
      referenceNo: selectedPOId,
    };

    console.log("Final Form:", finalForm);
    console.log("Product Lines:", products);
    onSubmit({
      form: finalForm,
      products,
    });
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
      <div className="bg-white w-[700px] rounded-xl shadow-xl p-6 max-h-[90vh] overflow-y-auto">
        {/* HEADER */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Add Receipt</h2>
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
          <label className="font-medium">Purchase Order *</label>

          <Select value={selectedPOId} onValueChange={setSelectedPOId}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select Purchase Order" />
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
              {products.length > 0 ? (
                products.map((p) => (
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
                    <td className="p-2">
                      <input
                        type="number"
                        value={p.quantity}
                        min={1}
                        className="w-20 border rounded px-2 py-1"
                        onChange={(e) =>
                          handleQuantityChange(p.id, Number(e.target.value))
                        }
                      />
                    </td>
                    <td className="p-2 text-right">
                      <button
                        className="text-red-500 hover:underline"
                        onClick={() =>
                          setProducts((prev) =>
                            prev.filter((x) => x.id !== p.id)
                          )
                        }
                      >
                        Delete
                      </button>
                    </td>
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
