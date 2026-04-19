import { useEffect, useState } from "react";
import { FormInput } from "../../../components/ui/FormInput";
import { Button } from "../../../components/ui/Button";
import { useDispatch, useSelector } from "react-redux";
import { RootState, AppDispatch } from "../../../store/store";
import {
  PreviewItem,
  Product,
  ProductSupplierInfo,
  ProductSupplierInfoInput,
  ProductUpdateInput,
} from "../../../features/products/store/product.types";
import {
  fetchCategoriesThunk,
  updateProductThunk,
} from "../../../features/products/store/product.thunks";
import { toast } from "react-toastify";
import { RotateCw, ArrowLeft, Plus, Star, Pencil, Trash2 } from "lucide-react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import { fetchAllTaxRatesThunk } from "@/features/master-data/store/master-data/tax/tax.thunks";
import { getAllUoms } from "@/features/master-data/api/uom.api";
import { productSupplierInfoApi } from "../api/productSupplierInfo.api";
import { partnerApi } from "@/features/partner/api/partner.api";
import { getCurrencies } from "@/features/master-data/api/currency.api";
import { ProductSupplierInfoModal } from "../components/ProductSupplierInfoModal";
import { productApi } from "../api/product.api";
import { useProductValidation } from "../hooks/useProductValidation";
import { PriceInput } from "../components/PriceInput";

export default function EditProductPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const dispatch = useDispatch<AppDispatch>();

  const productFromState: Product | undefined = location.state?.product;

  const { categories } = useSelector((state: RootState) => state.product);
  const taxRates = useSelector((state: RootState) => state.tax.Taxes);

  const [activeTab, setActiveTab] = useState<
    "general" | "attributes" | "suppliers"
  >("general");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { errors, validate, clearError } = useProductValidation();

  const [product, setProduct] = useState<ProductUpdateInput>({
    category_id: 0,
    sku: "",
    name: "",
    barcode: "",
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

  const [previewThumbnail, setPreviewThumbnail] = useState<string | null>(null);
  const [previewGallery, setPreviewGallery] = useState<PreviewItem[]>([]);
  const [deletedImageIds, setDeletedImageIds] = useState<number[]>([]);

  const [uoms, setUoms] = useState<
    Array<{ id: number; code: string; name: string }>
  >([]);
  const [suppliers, setSuppliers] = useState<
    Array<{ id: number; name: string }>
  >([]);
  const [currencies, setCurrencies] = useState<
    Array<{ id: number; code: string; name: string; symbol?: string }>
  >([]);
  const [supplierInfoList, setSupplierInfoList] = useState<
    ProductSupplierInfo[]
  >([]);
  const [supplierModalOpen, setSupplierModalOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] =
    useState<ProductSupplierInfo | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{
    open: boolean;
    supplierId: number | null;
    supplierName: string;
  }>({ open: false, supplierId: null, supplierName: "" });

  const productId = id ? Number(id) : productFromState?.id;

  useEffect(() => {
    dispatch(fetchCategoriesThunk());
    dispatch(fetchAllTaxRatesThunk());

    getAllUoms()
      .then((res) => {
        const data = Array.isArray(res.data) ? res.data : res.data?.data || [];
        setUoms(data);
      })
      .catch(() => setUoms([]));

    partnerApi
      .getAllPartners({ type: "supplier", status: "active" })
      .then((data) => {
        setSuppliers(data.map((p) => ({ id: p.id, name: p.name })));
      })
      .catch(() => setSuppliers([]));

    getCurrencies()
      .then((res) => {
        const data = res.data?.currencies || res.data || [];
        setCurrencies(Array.isArray(data) ? data : []);
      })
      .catch(() => setCurrencies([]));
  }, [dispatch]);

  useEffect(() => {
    const loadProduct = async () => {
      let p: Product | undefined = productFromState;
      if (!p && productId) {
        try {
          p = await productApi.getProductById(productId);
        } catch {
          toast.error("Failed to load product");
          return;
        }
      }
      if (!p) return;

      setProduct({
        category_id: p.category_id || 0,
        sku: p.sku,
        name: p.name,
        barcode: p.barcode || "",
        product_type: p.product_type || "storable",
        source_type: p.source_type || "purchased",
        uom_id: p.uom_id ?? undefined,
        purchase_uom_id: p.purchase_uom_id ?? undefined,
        min_stock_qty: p.min_stock_qty != null ? Number(p.min_stock_qty) : 0,
        internal_ref: p.internal_ref || "",
        weight: p.weight ?? undefined,
        volume: p.volume ?? undefined,
        warranty_months: p.warranty_months ?? undefined,
        notes: p.notes || "",
        origin: p.origin || "",
        cost_price: Number(p.cost_price) || 0,
        sale_price: Number(p.sale_price) || 0,
        tax_rate_id: p.tax_rate_id,
        description: p.description || "",
        status: p.status,
        thumbnail: null,
        gallery: [],
      });

      setPreviewThumbnail(p.image_url || null);
      setPreviewGallery(
        p.images?.map<PreviewItem>((img) => ({
          type: "old",
          id: img.id,
          url: img.image_url,
        })) || [],
      );

      if (p.supplierInfo) {
        setSupplierInfoList(p.supplierInfo);
      } else if (productId) {
        productSupplierInfoApi
          .getByProduct(productId)
          .then(setSupplierInfoList)
          .catch(() => {});
      }
    };

    loadProduct();
  }, [productFromState, productId]);

  const handleChange = (
    field: keyof ProductUpdateInput,
    value: ProductUpdateInput[keyof ProductUpdateInput],
  ) => {
    setProduct((prev) => {
      const next = { ...prev, [field]: value };
      if (field === "product_type" && value === "service") {
        next.source_type = "purchased";
        next.min_stock_qty = 0;
      }
      return next;
    });
    if (field in errors) clearError(field as keyof typeof errors);
  };

  const handleUpdate = async () => {
    if (!productId) return;

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
      if (errors.weight || errors.volume || errors.warranty_months) {
        setActiveTab("attributes");
      } else {
        setActiveTab("general");
      }
      toast.error("Please fix the errors before saving.");
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
      formData.append("origin", product.origin || "");
      formData.append("barcode", product.barcode || "");
      formData.append("cost_price", product.cost_price?.toString() || "0");
      formData.append("sale_price", product.sale_price?.toString() || "0");
      formData.append("status", product.status);

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
      if (product.tax_rate_id)
        formData.append("tax_rate_id", product.tax_rate_id.toString());
      if (product.thumbnail instanceof File)
        formData.append("thumbnail", product.thumbnail);
      if (product.gallery?.length)
        product.gallery.forEach((f) => formData.append("gallery", f));
      if (deletedImageIds.length > 0)
        formData.append("deleteImageIds", JSON.stringify(deletedImageIds));

      const result = await dispatch(
        updateProductThunk({ id: productId, formData }),
      );
      if (updateProductThunk.fulfilled.match(result)) {
        toast.success("Product updated successfully!");
        navigate("/inventory/products");
      } else {
        toast.error("Update failed!");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddSupplier = async (data: ProductSupplierInfoInput) => {
    if (!productId) return;
    try {
      const payload: ProductSupplierInfoInput = {
        supplier_id: Number(data.supplier_id),
        supplier_product_code: data.supplier_product_code || undefined,
        supplier_product_name: data.supplier_product_name || undefined,
        min_order_qty:
          data.min_order_qty != null ? Number(data.min_order_qty) : undefined,
        lead_time_days:
          data.lead_time_days != null ? Number(data.lead_time_days) : undefined,
        price: data.price != null ? Number(data.price) : undefined,
        currency_id:
          data.currency_id != null ? Number(data.currency_id) : undefined,
        is_preferred: Boolean(data.is_preferred),
      };
      const created = await productSupplierInfoApi.create(productId, payload);
      setSupplierInfoList((prev) => [...prev, created]);
      toast.success("Supplier added!");
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to add supplier");
      throw err;
    }
  };

  const handleUpdateSupplier = async (data: ProductSupplierInfoInput) => {
    if (!productId || !editingSupplier) return;
    try {
      // Sanitize: chỉ gửi primitive fields, tránh nested objects gây lỗi MySQL DOUBLE
      const payload: ProductSupplierInfoInput = {
        supplier_id: Number(data.supplier_id),
        supplier_product_code: data.supplier_product_code || undefined,
        supplier_product_name: data.supplier_product_name || undefined,
        min_order_qty:
          data.min_order_qty != null ? Number(data.min_order_qty) : undefined,
        lead_time_days:
          data.lead_time_days != null ? Number(data.lead_time_days) : undefined,
        price: data.price != null ? Number(data.price) : undefined,
        currency_id:
          data.currency_id != null ? Number(data.currency_id) : undefined,
        is_preferred: Boolean(data.is_preferred),
      };
      const updated = await productSupplierInfoApi.update(
        productId,
        editingSupplier.id,
        payload,
      );
      setSupplierInfoList((prev) =>
        prev.map((s) => (Number(s.id) === Number(updated.id) ? updated : s)),
      );
      toast.success("Supplier updated!");
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to update supplier");
      throw err;
    }
  };

  const handleDeleteSupplier = async (supplierId: number) => {
    if (!productId) return;
    try {
      await productSupplierInfoApi.delete(productId, supplierId);
      setSupplierInfoList((prev) =>
        prev.filter((s) => Number(s.id) !== supplierId),
      );
      toast.success("Supplier removed!");
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to remove supplier");
    } finally {
      setDeleteConfirm({ open: false, supplierId: null, supplierName: "" });
    }
  };

  const handleSetPreferred = async (supplierId: number) => {
    if (!productId) return;
    const updated = await productSupplierInfoApi.setPreferred(
      productId,
      supplierId,
    );
    setSupplierInfoList((prev) =>
      prev.map((s) => ({
        ...s,
        is_preferred: Number(s.id) === Number(updated.id),
      })),
    );
    toast.success("Preferred supplier set!");
  };

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
          <h1 className="text-xl font-semibold text-gray-800">Edit Product</h1>
          <p className="text-sm text-gray-500">Update product details</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => dispatch(fetchCategoriesThunk())}
            className="flex items-center justify-center border border-gray-300 bg-gray-50 text-gray-600 p-2 rounded-lg hover:bg-gray-100 transition"
          >
            <RotateCw className="w-4 h-4" />
          </button>
          <Link to="/inventory/products">
            <Button className="flex items-center gap-1 bg-[#1a1d29] hover:bg-[#0f111a] text-white px-4 py-2 rounded-lg shadow text-sm font-medium transition">
              <ArrowLeft className="w-4 h-4" />
              Back
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
            Suppliers{" "}
            {supplierInfoList.length > 0 && (
              <span className="ml-1 bg-orange-100 text-orange-600 text-xs px-1.5 py-0.5 rounded-full">
                {supplierInfoList.length}
              </span>
            )}
          </button>
        </div>

        <div className="p-6">
          {/* ── Tab 1: General ── */}
          {activeTab === "general" && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <FormInput
                    label="Product Name"
                    value={product.name}
                    onChange={(v) => handleChange("name", v)}
                    placeholder="Enter product name"
                    required
                    className={
                      errors.name ? "border-red-400 focus:ring-red-300" : ""
                    }
                  />
                  {errors.name && (
                    <p className="text-xs text-red-500 mt-1">{errors.name}</p>
                  )}
                </div>
                <FormInput
                  label="SKU"
                  value={product.sku}
                  onChange={(v) => handleChange("sku", v)}
                  placeholder="Enter SKU"
                  readOnly
                />

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
                  {errors.category_id && (
                    <p className="text-xs text-red-500 mt-1">
                      {errors.category_id}
                    </p>
                  )}
                </div>

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
                </div>

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

                <FormInput
                  label="Minimum Stock Qty"
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
                />
                <FormInput
                  label="Barcode"
                  value={product.barcode || ""}
                  onChange={(v) => handleChange("barcode", v)}
                  placeholder="Enter barcode"
                />
                <PriceInput
                  label="Cost Price"
                  value={product.cost_price}
                  onChange={(v) => handleChange("cost_price", v)}
                  error={errors.cost_price}
                />
                <PriceInput
                  label="Sale Price"
                  value={product.sale_price}
                  onChange={(v) => handleChange("sale_price", v)}
                  error={errors.sale_price}
                />

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
                    Thumbnail
                  </label>
                  {previewThumbnail ? (
                    <div className="relative w-32 h-32 border rounded-xl overflow-hidden">
                      <img
                        src={previewThumbnail}
                        alt="Thumbnail"
                        className="object-cover w-full h-full"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setPreviewThumbnail(null);
                          setProduct((p) => ({ ...p, thumbnail: null }));
                        }}
                        className="absolute top-1 right-1 bg-white text-red-500 rounded-full p-1 shadow text-xs"
                      >
                        ✕
                      </button>
                    </div>
                  ) : (
                    <label className="w-32 h-32 border-2 border-dashed border-gray-300 rounded-xl flex flex-col items-center justify-center text-gray-400 hover:border-orange-400 hover:text-orange-500 cursor-pointer">
                      <Plus className="w-5 h-5 mb-1" />
                      <span className="text-xs font-medium">Add Thumbnail</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const f = e.target.files?.[0];
                          if (f) {
                            setProduct((p) => ({ ...p, thumbnail: f }));
                            setPreviewThumbnail(URL.createObjectURL(f));
                          }
                        }}
                      />
                    </label>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Gallery
                  </label>
                  <div className="flex flex-wrap gap-4">
                    {previewGallery.map((p, i) => (
                      <div
                        key={i}
                        className="relative w-32 h-32 border rounded-xl overflow-hidden"
                      >
                        <img
                          src={p.url}
                          alt={`Gallery ${i}`}
                          className="object-cover w-full h-full"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            if (p.type === "old" && p.id)
                              setDeletedImageIds((prev) => [...prev, p.id!]);
                            if (p.type === "new" && p.file)
                              setProduct((prev) => ({
                                ...prev,
                                gallery: prev.gallery.filter(
                                  (f) => f !== p.file,
                                ),
                              }));
                            setPreviewGallery((prev) =>
                              prev.filter((_, idx) => idx !== i),
                            );
                          }}
                          className="absolute top-1 right-1 bg-white text-red-500 rounded-full p-1 shadow text-xs"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                    <label className="w-32 h-32 border-2 border-dashed border-gray-300 rounded-xl flex flex-col items-center justify-center text-gray-400 hover:border-orange-400 hover:text-orange-500 cursor-pointer">
                      <Plus className="w-5 h-5 mb-1" />
                      <span className="text-xs font-medium">Add Image</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        multiple
                        onChange={(e) => {
                          const files = e.target.files
                            ? Array.from(e.target.files)
                            : [];
                          setPreviewGallery((prev) => [
                            ...prev,
                            ...files.map((f) => ({
                              type: "new" as const,
                              url: URL.createObjectURL(f),
                              file: f,
                            })),
                          ]);
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

          {/* ── Tab 2: Attributes ── */}
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
                <FormInput
                  label="Weight (kg)"
                  type="number"
                  value={product.weight?.toString() || ""}
                  onChange={(v) =>
                    handleChange("weight", v ? Number(v) : undefined)
                  }
                  placeholder="0.00"
                />
                <FormInput
                  label="Volume (m³)"
                  type="number"
                  value={product.volume?.toString() || ""}
                  onChange={(v) =>
                    handleChange("volume", v ? Number(v) : undefined)
                  }
                  placeholder="0.00"
                />
                <FormInput
                  label="Warranty (months)"
                  type="number"
                  value={product.warranty_months?.toString() || ""}
                  onChange={(v) =>
                    handleChange("warranty_months", v ? Number(v) : undefined)
                  }
                  placeholder="0"
                />
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

          {/* ── Tab 3: Suppliers ── */}
          {activeTab === "suppliers" && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <p className="text-sm text-gray-500">
                  Manage suppliers for this product
                </p>
                <Button
                  onClick={() => {
                    setEditingSupplier(null);
                    setSupplierModalOpen(true);
                  }}
                  className="flex items-center gap-1 bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg text-sm"
                >
                  <Plus className="w-4 h-4" /> Add Supplier
                </Button>
              </div>

              {supplierInfoList.length === 0 ? (
                <div className="text-center py-12 text-gray-400">
                  <p className="text-sm">No suppliers added yet.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm border-collapse">
                    <thead>
                      <tr className="bg-gray-50 text-gray-600 text-left">
                        <th className="px-4 py-3 font-medium">Supplier</th>
                        <th className="px-4 py-3 font-medium">Code</th>
                        <th className="px-4 py-3 font-medium">Price</th>
                        <th className="px-4 py-3 font-medium">MOQ</th>
                        <th className="px-4 py-3 font-medium">Lead Time</th>
                        <th className="px-4 py-3 font-medium">Preferred</th>
                        <th className="px-4 py-3 font-medium text-right">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {supplierInfoList.map((s) => (
                        <tr key={s.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3 font-medium text-gray-800">
                            {s.supplier?.name || `Supplier #${s.supplier_id}`}
                          </td>
                          <td className="px-4 py-3 text-gray-600">
                            {s.supplier_product_code || "—"}
                          </td>
                          <td className="px-4 py-3 text-gray-600">
                            {s.price != null
                              ? `${Number(s.price).toLocaleString("vi-VN")} ${s.currency?.code || ""}`
                              : "—"}
                          </td>
                          <td className="px-4 py-3 text-gray-600">
                            {s.min_order_qty != null
                              ? Number(s.min_order_qty)
                              : "—"}
                          </td>
                          <td className="px-4 py-3 text-gray-600">
                            {s.lead_time_days
                              ? `${Number(s.lead_time_days)}d`
                              : "—"}
                          </td>
                          <td className="px-4 py-3">
                            {s.is_preferred ? (
                              <span className="flex items-center gap-1 text-yellow-500 font-medium">
                                <Star className="w-4 h-4 fill-yellow-400" />{" "}
                                Preferred
                              </span>
                            ) : (
                              <button
                                onClick={() => handleSetPreferred(s.id)}
                                className="text-gray-400 hover:text-yellow-500 transition text-xs underline"
                              >
                                Set preferred
                              </button>
                            )}
                          </td>
                          <td className="px-4 py-3 text-right">
                            <div className="flex justify-end gap-2">
                              <button
                                onClick={() => {
                                  setEditingSupplier(s);
                                  setSupplierModalOpen(true);
                                }}
                                className="p-1.5 rounded hover:bg-blue-50 text-blue-500 transition"
                              >
                                <Pencil className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => {
                                  setDeleteConfirm({
                                    open: true,
                                    supplierId: Number(s.id),
                                    supplierName:
                                      s.supplier?.name ||
                                      `Supplier #${s.supplier_id}`,
                                  });
                                }}
                                className="p-1.5 rounded hover:bg-red-50 text-red-500 transition"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Save */}
      <div className="flex justify-end">
        <Button
          onClick={handleUpdate}
          disabled={isSubmitting}
          className={`bg-[#ff8c00] hover:bg-[#ff7700] text-white px-6 py-3 rounded-lg font-medium shadow-md ${isSubmitting ? "opacity-70 cursor-not-allowed" : ""}`}
        >
          {isSubmitting ? "Saving..." : "Save Changes"}
        </Button>
      </div>

      {/* Supplier Modal */}
      <ProductSupplierInfoModal
        isOpen={supplierModalOpen}
        onClose={() => {
          setSupplierModalOpen(false);
          setEditingSupplier(null);
        }}
        onSubmit={editingSupplier ? handleUpdateSupplier : handleAddSupplier}
        supplierInfo={editingSupplier}
        suppliers={suppliers}
        currencies={currencies}
      />

      {/* Confirm Delete Supplier */}
      {deleteConfirm.open && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-lg p-6 w-96 text-center">
            <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
              <Trash2 className="w-6 h-6 text-red-500" />
            </div>
            <h2 className="text-lg font-semibold text-gray-800 mb-2">
              Remove Supplier?
            </h2>
            <p className="text-sm text-gray-500 mb-1">
              You are about to remove
            </p>
            <p className="text-sm font-medium text-gray-800 mb-5">
              {deleteConfirm.supplierName}
            </p>
            <p className="text-xs text-gray-400 mb-6">
              This action cannot be undone.
            </p>
            <div className="flex justify-center gap-3">
              <button
                onClick={() =>
                  setDeleteConfirm({
                    open: false,
                    supplierId: null,
                    supplierName: "",
                  })
                }
                className="px-5 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-medium transition"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (deleteConfirm.supplierId != null) {
                    handleDeleteSupplier(deleteConfirm.supplierId);
                  }
                }}
                className="px-5 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg text-sm font-medium transition"
              >
                Yes, Remove
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
