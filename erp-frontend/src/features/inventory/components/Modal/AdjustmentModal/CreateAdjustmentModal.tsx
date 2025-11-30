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
  LineAdjustmentItem,
  AdjustmentForm,
} from "@/features/inventory/store/stock/stockmove/stockMove.types";

interface AdjustmentModalProps {
  open: boolean;
  warehouses: Array<{ id: number; name: string }>;
  onSubmit: (data: {
    form: AdjustmentForm;
    lineItems: LineAdjustmentItem[];
  }) => void;
  onClose: () => void;
}

export default function CreateTransferModal({
  open,
  warehouses,
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

  useEffect(() => {
    if (!open) return;
    setForm({
      warehouse: "",
      move_no: generateMoveNo(),
      move_date: "",
      type: "adjustment",
      notes: "",
      reference_type: "adjustment",
    });
    setLineItems([]);
    setSearchTerm("");
  }, [open]);

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
  if (!open) return null;

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

    const finalForm = {
      ...form,
    };
    console.log("Final Form:", finalForm);
    console.log("Items Lines:", lineItems);
    onSubmit({
      form: finalForm,
      lineItems,
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
      <div className="bg-white w-[700px] rounded-xl shadow-xl p-6 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Add Adjustment</h2>
          <button onClick={onClose} className="!text-black text-xl font-bold">
            ✖
          </button>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="font-medium">
              Warehouse <span className="text-red-500">*</span>
            </label>
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
          <div>
            <label className="block text-sm font-medium mb-1">Move Date</label>
            <Input
              type="date"
              value={form.move_date}
              onChange={(value) => setForm({ ...form, move_date: value })}
              max={new Date().toISOString().split("T")[0]}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Move Number
            </label>
            <Input value={form.move_no} disabled />
          </div>
        </div>
        {/* Product search */}
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
        {/* Product table */}
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
                        alt=""
                        className="w-10 h-10 rounded object-cover"
                      />
                      {p.name}
                    </td>
                    <td className="p-2">{p.sku}</td>
                    <td className="p-2">{p.uom}</td>
                    <td className="p-2">{p.quantity}</td>
                    <td className="p-2">
                      <input
                        type="number"
                        value={p.quantity}
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
                            prev.filter((x) => x.product_id !== p.product_id)
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
                  <td
                    colSpan={5}
                    className="p-4 text-center text-gray-500 italic"
                  >
                    No products selected
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="mt-4">
          <label className="font-medium">Notes</label>
          <Textarea
            value={form.notes}
            onChange={(value) => setForm((prev) => ({ ...prev, notes: value }))}
            placeholder="Notes"
            className="min-h-[80px]"
          />
        </div>

        {/* Footer */}
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
