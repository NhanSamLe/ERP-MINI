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
import { PurchaseOrder, PurchaseOrderState } from "../../../../purchase/store";
import { useDispatch } from "react-redux";
import { AppDispatch } from "../../../../../store/store";
import { toast } from "react-toastify";
import {
  fetchProductByIdThunk,
  searchProductsThunk,
} from "../../../../products/store/product.thunks";
import { Product } from "../../../../products/store/product.types";
import { StockMove } from "../../../store/stock/stockmove/stockMove.types";

export interface LineReceiptItem {
  id: number | undefined;
  product_id: number;
  name: string;
  image: string;
  sku: string;
  uom: string;
  quantity: number;
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

  //
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState<Product[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const selectedWarehouseName =
    warehouses.find((w) => w.id === data?.warehouse_to_id)?.name || "";

  const selectedPurchaseOrder =
    purchaseOrder.items.find((p) => p.id === data?.reference_id)?.po_no || "";

  useEffect(() => {
    if (!open) return;
    console.log("Modal open, data:", data);
    if (!data?.lines || data.lines.length === 0) return;
    const ids = data.lines.map((line) => line.product_id);
    Promise.all(ids.map((id) => dispatch(fetchProductByIdThunk(id)).unwrap()))
      .then((fetchedProducts) => {
        const items: LineReceiptItem[] = (data.lines ?? []).map((line) => {
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
      warehouse: data.warehouse_to_id?.toString() ?? "",
      referenceNo: data.reference_id?.toString() ?? "",
      notes: data.note ?? "",
      move_no: data.move_no ?? "",
      move_date: data.move_date ? data.move_date.split("T")[0] : "",
      type: data.type ?? "",
      reference_type: data.reference_type ?? "",
    });

    setSelectedPOId(data.reference_id.toString());
    setSearchTerm("");
  }, [open, data]);

  useEffect(() => {
    if (selectedPOId) {
      setForm((prev) => ({ ...prev, referenceNo: selectedPOId }));
    }
  }, [selectedPOId]);

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
      alert("Sản phẩm đã có trong danh sách!");
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
        uom: p.uom ?? "",
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
        item.product_id === id ? { ...item, quantity: value } : item
      )
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

    console.log("Final Form:", finalForm);
    console.log("Items Lines:", lineItems);
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
          <h2 className="text-xl font-semibold">Edit Receipt</h2>
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
              defaultLabel={selectedWarehouseName}
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
          <Select
            value={selectedPOId}
            onValueChange={setSelectedPOId}
            defaultLabel={selectedPurchaseOrder}
          >
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

        {/* PRODUCT SEARCH */}
        <div className="mt-4 relative" ref={dropdownRef}>
          <label className="font-medium">Product *</label>

          <Input
            value={searchTerm}
            onChange={(value) => setSearchTerm(value)}
            placeholder="Search product..."
          />

          {showDropdown && searchResults.length > 0 && (
            <div className="absolute w-full mt-1 bg-white border rounded shadow-lg max-h-60 overflow-auto z-50">
              {searchLoading ? (
                <div className="p-2 text-gray-500">Loading...</div>
              ) : searchResults.length > 0 ? (
                searchResults.map((p) => (
                  <div
                    key={p.id}
                    onClick={() => handleSelectProduct(p)}
                    className="flex items-center gap-3 p-2 hover:bg-gray-100 cursor-pointer transition rounded"
                  >
                    <img
                      src={p.image_url ?? ""}
                      className="w-10 h-10 rounded object-cover bg-gray-200"
                      alt={p.name}
                    />

                    <div className="flex flex-col">
                      <span className="font-medium text-gray-800">
                        {p.name}
                      </span>
                      <span className="text-sm text-gray-500">
                        SKU: {p.sku}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-2 text-gray-500">No results</div>
              )}
            </div>
          )}
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
                    <td className="p-2">
                      <input
                        type="number"
                        value={p.quantity}
                        min={1}
                        className="w-20 border rounded px-2 py-1"
                        onChange={(e) =>
                          handleQuantityChange(
                            p.product_id,
                            Number(e.target.value)
                          )
                        }
                      />
                    </td>
                    <td className="p-2 text-right">
                      <button
                        className="text-red-500 hover:underline"
                        onClick={() =>
                          setLineItems((prev) =>
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
            Update
          </Button>
        </div>
      </div>
    </div>
  );
}
