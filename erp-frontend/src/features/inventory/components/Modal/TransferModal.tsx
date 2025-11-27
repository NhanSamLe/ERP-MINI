import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "../../../../components/ui/Select";
import { Button } from "../../../../components/ui/Button";
import { Input } from "../../../../components/ui/Input";
import { Textarea } from "../../../../components/ui/Textarea";
import { useState, useEffect } from "react";

interface ProductItem {
  id: number;
  name: string;
  image: string;
  sku: string;
  category: string;
  quantity: number;
}

interface TransferForm {
  warehouseFrom: string;
  warehouseTo: string;
  referenceNo: string;
  notes: string;
}

interface TransferModalProps {
  open: boolean;
  mode: "create" | "edit";
  initialData?: {
    form: TransferForm;
    products: ProductItem[];
  };
  warehouses: Array<{ id: number; name: string }>;
  onSubmit: (data: { form: TransferForm; products: ProductItem[] }) => void;
  onClose: () => void;
}

export default function TransferModal({
  open,
  mode,
  initialData,
  warehouses,
  onSubmit,
  onClose,
}: TransferModalProps) {
  const [form, setForm] = useState<TransferForm>({
    warehouseFrom: "",
    warehouseTo: "",
    referenceNo: "",
    notes: "",
  });

  const [products, setProducts] = useState<ProductItem[]>([]);

  useEffect(() => {
    if (mode === "edit" && initialData) {
      setForm(initialData.form);
      setProducts(initialData.products);
    } else if (mode === "create") {
      setForm({
        warehouseFrom: "",
        warehouseTo: "",
        referenceNo: "",
        notes: "",
      });
      setProducts([]);
    }
  }, [mode, initialData, open]);

  if (!open) return null;

  const handleSubmit = () => {
    onSubmit({ form, products });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
      <div className="bg-white w-[700px] rounded-xl shadow-xl p-6 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">
            {mode === "create" ? "Add Transfer" : "Edit Transfer"}
          </h2>
          <button onClick={onClose} className="!text-black text-xl font-bold">
            ✖
          </button>
        </div>

        {/* Warehouse selects */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="font-medium">
              Warehouse From <span className="text-red-500">*</span>
            </label>
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

          <div>
            <label className="font-medium">
              Warehouse To <span className="text-red-500">*</span>
            </label>
            <Select
              value={form.warehouseTo}
              onValueChange={(v) =>
                setForm((prev) => ({ ...prev, warehouseTo: v }))
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

        {/* Reference number */}
        <div className="mt-4">
          <label className="font-medium">Reference Number</label>
          <Input
            value={form.referenceNo}
            onChange={(value) =>
              setForm((prev) => ({ ...prev, referenceNo: value }))
            }
            placeholder="Reference Number"
          />
        </div>

        {/* Product search */}
        <div className="mt-4">
          <label className="font-medium">
            Product <span className="text-red-500">*</span>
          </label>
          <Input placeholder="Search Product" />
        </div>

        {/* Product table */}
        <div className="mt-3 border rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-100 text-left">
              <tr>
                <th className="p-2">Product</th>
                <th className="p-2">SKU</th>
                <th className="p-2">Category</th>
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
                        alt=""
                        className="w-10 h-10 rounded object-cover"
                      />
                      {p.name}
                    </td>
                    <td className="p-2">{p.sku}</td>
                    <td className="p-2">{p.category}</td>
                    <td className="p-2">{p.quantity}</td>
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
            {mode === "create" ? "Create" : "Update"}
          </Button>
        </div>
      </div>
    </div>
  );
}
