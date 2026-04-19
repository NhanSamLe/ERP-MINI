import { useEffect, useState } from "react";
import { FormInput } from "../../../components/ui/FormInput";
import { Button } from "../../../components/ui/Button";
import { useSelector, useDispatch } from "react-redux";
import { RootState, AppDispatch } from "../../../store/store";
import {
  fetchCategoriesThunk,
  createProductThunk,
} from "../store/product.thunks";
import { type ProductCreateInput } from "../../../features/products/store/product.types";
import { toast } from "react-toastify";
import axios from "axios";
import { RotateCw, ArrowLeft, Plus } from "lucide-react";
import { Link } from "react-router-dom";
import { ImageUpload } from "../../../components/ui/ImageUpload";
import { fetchAllTaxRatesThunk } from "@/features/master-data/store/master-data/tax/tax.thunks";
import { getAllUoms } from "@/features/master-data/api/uom.api";
import { useProductValidation } from "../hooks/useProductValidation";
import { PriceInput } from "../components/PriceInput";

export default function CreateProductPage() {
  const generateSKU = () => {
    const date = new Date();
    const ymd = date.toISOString().slice(0, 10).replace(/-/g, "");
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `PRD-${ymd}-${random}`;
  };

  const [activeTab, setActiveTab] = useState<
    "general" | "attributes" | "suppliers"
  >("general");

  const [product, setProduct] = useState<ProductCreateInput>({
    category_id: 0,
    sku: generateSKU(),
    name: "",
    barcode:
      Date.now().toString().slice(-5) +
      Math.floor(10000 + Math.random() * 90000),
    product_type: "storable",
    source_type: "purchased",
    uom_id: undefined,
    purchase_uom_id: undefined,
    min_stock_qty: 0,
    internal_ref: "",
    weight: undefined,
    volume: undefined,
    warranty_months: undefined,
    notes: "",
    origin: "",
    cost_price: 0,
    sale_price: 0,
    tax_rate_id: undefined,
    description: "",
    status: "active",
    thumbnail: null,
    gallery: [],
  });

  const { categories } = useSelector((state: RootState) => state.product);
  const taxRates = useSelector((state: RootState) => state.tax.Taxes);
  const [uoms, setUoms] = useState<
    Array<{ id: number; code: string; name: string }>
  >([]);
  const dispatch = useDispatch<AppDispatch>();
  const [uploadingThumbnail] = useState(false);
  const [uploadingGallery] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { errors, validate, clearError } = useProductValidation();

  useEffect(() => {
    dispatch(fetchCategoriesThunk());
    dispatch(fetchAllTaxRatesThunk());
    getAllUoms()
      .then((res) => {
        const uomData = Array.isArray(res.data)
          ? res.data
          : res.data?.data || [];
        setUoms(uomData);
      })
      .catch(() => setUoms([]));
  }, [dispatch]);

  const handleChange = (
    field: keyof ProductCreateInput,
    value: ProductCreateInput[keyof ProductCreateInput],
  ) => {
    setProduct((prev) => {
      const next = { ...prev, [field]: value };
      // Auto-reset source_type khi chuyển sang service
      if (field === "product_type" && value === "service") {
        next.source_type = "purchased";
        next.min_stock_qty = 0;
      }
      return next;
    });
    // Clear lỗi field tương ứng khi user sửa
    if (field in errors) clearError(field as keyof typeof errors);
  };

  const handleSubmit = async () => {
    const isValid = validate({
      name: product.name,
      category_id: product.category_id,
      sku: product.sku,
      product_type: product.product_type,
      source_type: product.source_type,
      cost_price: Number(product.cost_price) || 0,
      sale_price: Number(product.sale_price) || 0,
      min_stock_qty: Number(product.min_stock_qty) || 0,
      weight: product.weight != null ? Number(product.weight) : undefined,
      volume: product.volume != null ? Number(product.volume) : undefined,
      warranty_months:
        product.warranty_months != null
          ? Number(product.warranty_months)
          : undefined,
    });

    if (!isValid) {
      // Nếu lỗi ở tab attributes thì chuyển sang đó
      if (errors.weight || errors.volume || errors.warranty_months) {
        setActiveTab("attributes");
      } else {
        setActiveTab("general");
      }
      toast.error("Please fix the errors before submitting.");
      return;
    }

    try {
      setIsSubmitting(true);
      const formData = new FormData();
      formData.append("sku", product.sku);
      formData.append("name", product.name);
      formData.append("description", product.description || "");
      formData.append("category_id", product.category_id?.toString() || "");
      formData.append("product_type", product.product_type || "storable");
      formData.append("source_type", product.source_type || "purchased");
      if (product.uom_id) formData.append("uom_id", product.uom_id.toString());
      if (product.purchase_uom_id)
        formData.append("purchase_uom_id", product.purchase_uom_id.toString());
      if (product.min_stock_qty !== undefined)
        formData.append("min_stock_qty", product.min_stock_qty.toString());
      if (product.internal_ref)
        formData.append("internal_ref", product.internal_ref);
      if (product.weight) formData.append("weight", product.weight.toString());
      if (product.volume) formData.append("volume", product.volume.toString());
      if (product.warranty_months)
        formData.append("warranty_months", product.warranty_months.toString());
      if (product.notes) formData.append("notes", product.notes);
      formData.append("origin", product.origin || "");
      formData.append("barcode", product.barcode || "");
      formData.append("cost_price", product.cost_price?.toString() || "0");
      formData.append("sale_price", product.sale_price?.toString() || "0");
      formData.append("status", "active");
      if (product.tax_rate_id)
        formData.append("tax_rate_id", product.tax_rate_id.toString());
      if (product.thumbnail) formData.append("thumbnail", product.thumbnail);
      if (product.gallery?.length)
        product.gallery.forEach((f) => formData.append("gallery", f));

      await dispatch(createProductThunk(formData)).unwrap();
      toast.success("Product created successfully!");
      setProduct({
        category_id: 0,
        sku: generateSKU(),
        name: "",
        barcode:
          Date.now().toString().slice(-5) +
          Math.floor(10000 + Math.random() * 90000),
        product_type: "storable",
        source_type: "purchased",
        uom_id: undefined,
        purchase_uom_id: undefined,
        min_stock_qty: 0,
        internal_ref: "",
        weight: undefined,
        volume: undefined,
        warranty_months: undefined,
        notes: "",
        origin: "",
        cost_price: 0,
        sale_price: 0,
        tax_rate_id: undefined,
        description: "",
        status: "active",
        thumbnail: null,
        gallery: [],
      });
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        toast.error(
          error.response?.data?.message || "Failed to create product",
        );
      } else {
        toast.error("Failed to create product");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const inputClass = (field?: string) =>
    field && errors[field as keyof typeof errors]
      ? "border-red-400 focus:ring-red-300"
      : "";

  const ErrorMsg = ({ field }: { field: keyof typeof errors }) =>
    errors[field] ? (
      <p className="text-xs text-red-500 mt-1">{errors[field]}</p>
    ) : null;

  const tabClass = (tab: string) =>
    `px-6 py-3 font-medium text-sm transition border-b-2 ${
      activeTab === tab
        ? "border-orange-500 text-orange-500"
        : "border-transparent text-gray-600 hover:text-gray-800"
    }`;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between bg-white px-6 py-4 rounded-xl border shadow-sm">
        <div>
          <h1 className="text-xl font-semibold text-gray-800">
            Create Product
          </h1>
          <p className="text-sm text-gray-500">
            Fill out product details to create a new one
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() =>
              setProduct((prev) => ({ ...prev, sku: generateSKU() }))
            }
            className="flex items-center justify-center border border-gray-300 bg-gray-50 text-gray-600 p-2 rounded-lg hover:bg-gray-100 transition"
          >
            <RotateCw className="w-4 h-4" />
          </button>
          <Link to="/inventory/products">
            <Button className="flex items-center gap-1 bg-[#1a1d29] hover:bg-[#0f111a] text-white px-4 py-2 rounded-lg shadow text-sm font-medium transition">
              <ArrowLeft className="w-4 h-4" /> Back to Product
            </Button>
          </Link>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-xl border shadow-sm">
        <div className="flex border-b">
          <button
            onClick={() => setActiveTab("general")}
            className={tabClass("general")}
          >
            General Information
            {(errors.name ||
              errors.category_id ||
              errors.cost_price ||
              errors.sale_price ||
              errors.min_stock_qty) && (
              <span className="ml-1.5 w-2 h-2 rounded-full bg-red-500 inline-block" />
            )}
          </button>
          <button
            onClick={() => setActiveTab("attributes")}
            className={tabClass("attributes")}
          >
            Attributes
            {(errors.weight || errors.volume || errors.warranty_months) && (
              <span className="ml-1.5 w-2 h-2 rounded-full bg-red-500 inline-block" />
            )}
          </button>
          <button
            onClick={() => setActiveTab("suppliers")}
            className={`${tabClass("suppliers")} ${product.source_type !== "purchased" ? "opacity-40 cursor-not-allowed" : ""}`}
            disabled={product.source_type !== "purchased"}
          >
            Suppliers
          </button>
        </div>

        <div className="p-6">
          {/* Tab 1: General */}
          {activeTab === "general" && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Name */}
                <div>
                  <FormInput
                    label="Product Name"
                    value={product.name}
                    onChange={(v) => handleChange("name", v)}
                    placeholder="Enter product name"
                    required
                    className={inputClass("name")}
                  />
                  <ErrorMsg field="name" />
                </div>

                <FormInput
                  label="SKU"
                  value={product.sku}
                  onChange={(v) => handleChange("sku", v)}
                  readOnly
                  placeholder="Auto-generated"
                />

                {/* Category */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Category <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={product.category_id}
                    onChange={(e) =>
                      handleChange("category_id", Number(e.target.value))
                    }
                    className={`w-full border rounded-lg px-4 py-3 text-sm focus:ring-2 focus:ring-orange-400 ${errors.category_id ? "border-red-400" : ""}`}
                  >
                    <option value={0}>-- Select Category --</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                  <ErrorMsg field="category_id" />
                </div>

                {/* Product Type */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Product Type
                  </label>
                  <select
                    value={product.product_type}
                    onChange={(e) =>
                      handleChange(
                        "product_type",
                        e.target.value as "storable" | "consumable" | "service",
                      )
                    }
                    className="w-full border rounded-lg px-4 py-3 text-sm focus:ring-2 focus:ring-orange-400"
                  >
                    <option value="storable">Storable</option>
                    <option value="consumable">Consumable</option>
                    <option value="service">Service</option>
                  </select>
                </div>

                {/* Source Type */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Source Type
                  </label>
                  <select
                    value={product.source_type}
                    onChange={(e) =>
                      handleChange(
                        "source_type",
                        e.target.value as "purchased" | "manufactured",
                      )
                    }
                    className="w-full border rounded-lg px-4 py-3 text-sm focus:ring-2 focus:ring-orange-400"
                    disabled={product.product_type === "service"}
                  >
                    <option value="purchased">Purchased</option>
                    <option value="manufactured">Manufactured</option>
                  </select>
                  {product.product_type === "service" && (
                    <p className="text-xs text-gray-400 mt-1">
                      Service products are always purchased.
                    </p>
                  )}
                </div>

                {/* UOM */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Unit of Measure (UOM)
                  </label>
                  <select
                    value={product.uom_id || ""}
                    onChange={(e) =>
                      handleChange(
                        "uom_id",
                        e.target.value ? Number(e.target.value) : undefined,
                      )
                    }
                    className="w-full border rounded-lg px-4 py-3 text-sm focus:ring-2 focus:ring-orange-400"
                  >
                    <option value="">-- Select UOM --</option>
                    {uoms.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.name} ({u.code})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Purchase UOM */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Purchase UOM
                  </label>
                  <select
                    value={product.purchase_uom_id || ""}
                    onChange={(e) =>
                      handleChange(
                        "purchase_uom_id",
                        e.target.value ? Number(e.target.value) : undefined,
                      )
                    }
                    className="w-full border rounded-lg px-4 py-3 text-sm focus:ring-2 focus:ring-orange-400"
                  >
                    <option value="">-- Select Purchase UOM --</option>
                    {uoms.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.name} ({u.code})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Min Stock */}
                <div>
                  <FormInput
                    label="Minimum Stock Quantity"
                    type="text"
                    value={
                      product.min_stock_qty != null && product.min_stock_qty > 0
                        ? String(product.min_stock_qty)
                        : ""
                    }
                    onChange={(v) => {
                      const cleaned = v.replace(/[^\d.]/g, "");
                      handleChange(
                        "min_stock_qty",
                        cleaned ? Number(cleaned) : 0,
                      );
                    }}
                    placeholder="0"
                    disabled={product.product_type === "service"}
                    className={inputClass("min_stock_qty")}
                  />
                  <ErrorMsg field="min_stock_qty" />
                  {product.product_type === "service" && (
                    <p className="text-xs text-gray-400 mt-1">
                      Not applicable for service products.
                    </p>
                  )}
                </div>

                <FormInput
                  label="Barcode"
                  value={product.barcode?.toString() || ""}
                  onChange={(v) => handleChange("barcode", v)}
                  placeholder="Auto-generated"
                  disabled
                />

                {/* Cost Price */}
                <div>
                  <PriceInput
                    label="Cost Price"
                    value={product.cost_price}
                    onChange={(v) => handleChange("cost_price", v)}
                    error={errors.cost_price}
                  />
                </div>

                {/* Sale Price */}
                <div>
                  <PriceInput
                    label="Sale Price"
                    value={product.sale_price}
                    onChange={(v) => handleChange("sale_price", v)}
                    error={errors.sale_price}
                  />
                </div>

                {/* Tax Rate */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tax Rate
                  </label>
                  <select
                    value={product.tax_rate_id || ""}
                    onChange={(e) =>
                      handleChange(
                        "tax_rate_id",
                        e.target.value ? Number(e.target.value) : undefined,
                      )
                    }
                    className="w-full border rounded-lg px-4 py-3 text-sm focus:ring-2 focus:ring-orange-400"
                  >
                    <option value="">-- Select Tax Rate --</option>
                    {taxRates.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.name} ({r.rate}%)
                      </option>
                    ))}
                  </select>
                </div>

                {/* Status */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Status
                  </label>
                  <select
                    value={product.status}
                    onChange={(e) =>
                      handleChange(
                        "status",
                        e.target.value as "active" | "inactive",
                      )
                    }
                    className="w-full border rounded-lg px-4 py-3 text-sm focus:ring-2 focus:ring-orange-400"
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  value={product.description}
                  onChange={(e) => handleChange("description", e.target.value)}
                  placeholder="Enter product description..."
                  className="w-full border rounded-lg px-4 py-3 text-sm focus:ring-2 focus:ring-orange-400"
                  rows={3}
                />
              </div>

              {/* Images */}
              <div className="space-y-4">
                <h4 className="font-medium text-gray-700">Product Images</h4>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Thumbnail Image
                  </label>
                  {product.thumbnail ? (
                    <ImageUpload
                      preview={URL.createObjectURL(product.thumbnail)}
                      onImageChange={(file: File | File[]) => {
                        const f = Array.isArray(file) ? file[0] : file;
                        setProduct((prev) => ({ ...prev, thumbnail: f }));
                      }}
                      onRemove={() =>
                        setProduct((prev) => ({ ...prev, thumbnail: null }))
                      }
                      multiple={false}
                    />
                  ) : (
                    <label className="w-32 h-32 border-2 border-dashed border-gray-300 rounded-xl flex flex-col items-center justify-center text-gray-400 hover:border-orange-400 hover:text-orange-500 cursor-pointer">
                      <Plus className="w-5 h-5 mb-1" />
                      <span className="text-xs font-medium">
                        {uploadingThumbnail ? "Uploading..." : "Add Thumbnail"}
                      </span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const f = e.target.files?.[0];
                          if (f)
                            setProduct((prev) => ({ ...prev, thumbnail: f }));
                        }}
                      />
                    </label>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Gallery Images
                  </label>
                  <div className="flex flex-wrap gap-4">
                    {product.gallery.map((file, i) => (
                      <ImageUpload
                        key={`${file.name}-${i}`}
                        preview={URL.createObjectURL(file)}
                        onImageChange={(updated: File | File[]) => {
                          const newFile = Array.isArray(updated)
                            ? updated[0]
                            : updated;
                          setProduct((prev) => {
                            const g = [...prev.gallery];
                            g[i] = newFile;
                            return { ...prev, gallery: g };
                          });
                        }}
                        onRemove={() =>
                          setProduct((prev) => ({
                            ...prev,
                            gallery: prev.gallery.filter((_, idx) => idx !== i),
                          }))
                        }
                        multiple={false}
                      />
                    ))}
                    <label className="w-32 h-32 border-2 border-dashed border-gray-300 rounded-xl flex flex-col items-center justify-center text-gray-400 hover:border-orange-400 hover:text-orange-500 cursor-pointer">
                      <Plus className="w-5 h-5 mb-1" />
                      <span className="text-xs font-medium">
                        {uploadingGallery ? "Uploading..." : "Add Image"}
                      </span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        multiple
                        onChange={(e) => {
                          const files = e.target.files
                            ? Array.from(e.target.files)
                            : [];
                          if (files.length > 0)
                            setProduct((prev) => ({
                              ...prev,
                              gallery: [...prev.gallery, ...files],
                            }));
                        }}
                      />
                    </label>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Tab 2: Attributes */}
          {activeTab === "attributes" && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormInput
                  label="Internal Reference"
                  value={product.internal_ref || ""}
                  onChange={(v) => handleChange("internal_ref", v)}
                  placeholder="Enter internal reference"
                />
                <FormInput
                  label="Origin"
                  value={product.origin || ""}
                  onChange={(v) => handleChange("origin", v)}
                  placeholder="Enter origin"
                />
                <div>
                  <FormInput
                    label="Weight (kg)"
                    type="number"
                    value={product.weight?.toString() || ""}
                    onChange={(v) =>
                      handleChange("weight", v ? Number(v) : undefined)
                    }
                    placeholder="0.00"
                    className={inputClass("weight")}
                  />
                  <ErrorMsg field="weight" />
                </div>
                <div>
                  <FormInput
                    label="Volume (m³)"
                    type="number"
                    value={product.volume?.toString() || ""}
                    onChange={(v) =>
                      handleChange("volume", v ? Number(v) : undefined)
                    }
                    placeholder="0.00"
                    className={inputClass("volume")}
                  />
                  <ErrorMsg field="volume" />
                </div>
                <div>
                  <FormInput
                    label="Warranty (months)"
                    type="number"
                    value={product.warranty_months?.toString() || ""}
                    onChange={(v) =>
                      handleChange("warranty_months", v ? Number(v) : undefined)
                    }
                    placeholder="0"
                    className={inputClass("warranty_months")}
                  />
                  <ErrorMsg field="warranty_months" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Notes
                </label>
                <textarea
                  value={product.notes || ""}
                  onChange={(e) => handleChange("notes", e.target.value)}
                  placeholder="Enter additional notes..."
                  className="w-full border rounded-lg px-4 py-3 text-sm focus:ring-2 focus:ring-orange-400"
                  rows={4}
                />
              </div>
            </div>
          )}

          {/* Tab 3: Suppliers */}
          {activeTab === "suppliers" && (
            <div className="space-y-4">
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <p className="text-sm text-yellow-800">
                  ℹ️ Supplier information can be added after creating the
                  product.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Submit */}
      <div className="flex justify-end">
        <Button
          onClick={handleSubmit}
          disabled={isSubmitting}
          className={`bg-[#ff8c00] hover:bg-[#ff7700] text-white px-6 py-3 rounded-lg font-medium shadow-md ${isSubmitting ? "opacity-70 cursor-not-allowed" : ""}`}
        >
          {isSubmitting ? "Creating..." : "Create Product"}
        </Button>
      </div>
    </div>
  );
}
