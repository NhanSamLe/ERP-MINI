import { useState, useEffect } from "react";
import { toast } from "react-toastify";
import { X } from "lucide-react";
import { Button } from "../../../components/ui/Button";
import { FormInput } from "../../../components/ui/FormInput";
import {
  ProductSupplierInfo,
  ProductSupplierInfoInput,
} from "../store/product.types";
import { PriceInput } from "./PriceInput";

interface ProductSupplierInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: ProductSupplierInfoInput) => Promise<void>;
  supplierInfo?: ProductSupplierInfo | null;
  suppliers: Array<{ id: number; name: string }>;
  currencies: Array<{ id: number; code: string; name: string; symbol?: string }>;
}

function parseIntInput(v: string): number | undefined {
  const cleaned = v.replace(/[^\d]/g, "");
  return cleaned === "" ? undefined : parseInt(cleaned, 10);
}

export function ProductSupplierInfoModal({
  isOpen,
  onClose,
  onSubmit,
  supplierInfo,
  suppliers,
  currencies,
}: ProductSupplierInfoModalProps) {
  const [formData, setFormData] = useState<ProductSupplierInfoInput>({
    supplier_id: 0,
    supplier_product_code: "",
    supplier_product_name: "",
    min_order_qty: undefined,
    lead_time_days: undefined,
    price: undefined,
    currency_id: undefined,
    is_preferred: false,
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (supplierInfo) {
      setFormData({
        supplier_id: supplierInfo.supplier_id,
        supplier_product_code: supplierInfo.supplier_product_code || "",
        supplier_product_name: supplierInfo.supplier_product_name || "",
        min_order_qty: supplierInfo.min_order_qty != null ? Number(supplierInfo.min_order_qty) : undefined,
        lead_time_days: supplierInfo.lead_time_days != null ? Number(supplierInfo.lead_time_days) : undefined,
        price: supplierInfo.price != null ? Number(supplierInfo.price) : undefined,
        currency_id: supplierInfo.currency_id || undefined,
        is_preferred: supplierInfo.is_preferred,
      });
    } else {
      setFormData({
        supplier_id: 0,
        supplier_product_code: "",
        supplier_product_name: "",
        min_order_qty: undefined,
        lead_time_days: undefined,
        price: undefined,
        currency_id: undefined,
        is_preferred: false,
      });
    }
  }, [supplierInfo]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.supplier_id === 0) {
      toast.error("Vui lòng chọn nhà cung cấp");
      return;
    }
    setIsSubmitting(true);
    try {
      await onSubmit(formData);
      onClose();
    } catch (error) {
      console.error("Error submitting supplier info:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  const selectedCurrency = currencies.find((c) => c.id === formData.currency_id);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-800">
            {supplierInfo ? "Edit Supplier Info" : "Add Supplier"}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Supplier */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Supplier <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.supplier_id}
              onChange={(e) => setFormData({ ...formData, supplier_id: Number(e.target.value) })}
              className="w-full border rounded-lg px-4 py-3 text-sm focus:ring-2 focus:ring-orange-400"
              required
              disabled={!!supplierInfo}
            >
              <option value={0}>-- Select Supplier --</option>
              {suppliers.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>

          <FormInput
            label="Supplier Product Code"
            value={formData.supplier_product_code || ""}
            onChange={(v) => setFormData({ ...formData, supplier_product_code: v })}
            placeholder="Enter supplier product code"
          />

          <FormInput
            label="Supplier Product Name"
            value={formData.supplier_product_name || ""}
            onChange={(v) => setFormData({ ...formData, supplier_product_name: v })}
            placeholder="Enter supplier product name"
          />

          {/* Price & Currency */}
          <div className="grid grid-cols-2 gap-4">
            <PriceInput
              label="Price"
              value={formData.price}
              onChange={(v) => setFormData({ ...formData, price: v || undefined })}
              currency={selectedCurrency?.code || "VND"}
            />
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Currency</label>
              <select
                value={formData.currency_id || ""}
                onChange={(e) => setFormData({ ...formData, currency_id: e.target.value ? Number(e.target.value) : undefined })}
                className="w-full border rounded-lg px-4 py-3 text-sm focus:ring-2 focus:ring-orange-400"
              >
                <option value="">-- Select Currency --</option>
                {currencies.map((c) => (
                  <option key={c.id} value={c.id}>{c.code} - {c.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* MOQ & Lead Time */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Minimum Order Quantity</label>
              <input
                type="text"
                value={formData.min_order_qty != null ? String(formData.min_order_qty) : ""}
                onChange={(e) => setFormData({ ...formData, min_order_qty: parseIntInput(e.target.value) })}
                placeholder="0"
                className="w-full border rounded-lg px-4 py-3 text-sm focus:ring-2 focus:ring-orange-400 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Lead Time (days)</label>
              <input
                type="text"
                value={formData.lead_time_days != null ? String(formData.lead_time_days) : ""}
                onChange={(e) => setFormData({ ...formData, lead_time_days: parseIntInput(e.target.value) })}
                placeholder="0"
                className="w-full border rounded-lg px-4 py-3 text-sm focus:ring-2 focus:ring-orange-400 focus:outline-none"
              />
            </div>
          </div>

          {/* Is Preferred */}
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="is_preferred"
              checked={formData.is_preferred}
              onChange={(e) => setFormData({ ...formData, is_preferred: e.target.checked })}
              className="w-4 h-4 text-orange-500 border-gray-300 rounded focus:ring-orange-400"
            />
            <label htmlFor="is_preferred" className="text-sm text-gray-700">
              Set as preferred supplier
            </label>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" onClick={onClose} className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-6 py-2 rounded-lg">
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting} className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-2 rounded-lg">
              {isSubmitting ? "Saving..." : supplierInfo ? "Update" : "Add"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

