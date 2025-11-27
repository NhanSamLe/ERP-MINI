import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "../../../../../components/ui/Select";
import { Button } from "../../../../../components/ui/Button";
import { Input } from "../../../../../components/ui/Input";
import { Textarea } from "../../../../../components/ui/Textarea";
import { useState, useEffect, useRef } from "react";
import {
  fetchPurchaseOrderByStatus,
  PurchaseOrder,
} from "../../../../purchase/store";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "../../../../../store/store";
import { toast } from "react-toastify";
import { searchProductsThunk } from "../../../../products/store/product.thunks";
import { Product } from "../../../../products/store/product.types";

export interface ProductItem {
  id: number;
  name: string;
  image: string;
  sku: string;
  uom: string;
  quantity: number;
}

export interface TransferForm {
  warehouseFrom: string;
  referenceNo: string;
  move_no: string;
  notes: string;
  move_date: string;
  type: string;
  reference_type: string;
}

interface TransferModalProps {
  open: boolean;
  warehouses: Array<{ id: number; name: string }>;
  onSubmit: (data: { form: TransferForm; products: ProductItem[] }) => void;
  onClose: () => void;
}

export default function CreateReceiptModal({
  open,
  warehouses,
  onSubmit,
  onClose,
}: TransferModalProps) {
  const dispatch = useDispatch<AppDispatch>();
  const purchaseOrder = useSelector((state: RootState) => state.purchaseOrder);

  const generateMoveNo = (): string => {
    const timestamp = Date.now();
    const randomNum = Math.floor(100 + Math.random() * 900);
    return `RC${timestamp}${randomNum}`;
  };

  const [form, setForm] = useState<TransferForm>({
    warehouseFrom: "",
    referenceNo: "",
    move_no: generateMoveNo(),
    notes: "",
    move_date: "",
    type: "receipt",
    reference_type: "purchase_order",
  });

  const [products, setProducts] = useState<ProductItem[]>([]);
  const [selectedPOId, setSelectedPOId] = useState<string>("");

  // search
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState<Product[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    dispatch(fetchPurchaseOrderByStatus("confirmed"));
  }, [dispatch]);

  useEffect(() => {
    if (!open) return;
    setForm({
      warehouseFrom: "",
      referenceNo: "",
      notes: "",
      move_no: generateMoveNo(),
      move_date: "",
      type: "receipt",
      reference_type: "purchase_order",
    });
    setProducts([]);
    setSelectedPOId("");
    setSearchTerm("");
  }, [open]);
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
    if (products.some((l) => l.id === p.id)) {
      alert("Sản phẩm đã có trong danh sách!");
      setSearchTerm("");
      return;
    }
    setProducts((prev) => [
      ...prev,
      {
        id: p.id,
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
    setProducts((prev) =>
      prev.map((item) => (item.id === id ? { ...item, quantity: value } : item))
    );
  };

  const handleSubmit = () => {
    if (!selectedPOId) {
      toast.error("Please select a Purchase Order");
      return;
    }

    if (!form.warehouseFrom) {
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
            <label className="font-medium">Warehouse From *</label>
            <Select
              value={form.warehouseFrom}
              onValueChange={(v) =>
                setForm((prev) => ({ ...prev, warehouseFrom: v }))
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
