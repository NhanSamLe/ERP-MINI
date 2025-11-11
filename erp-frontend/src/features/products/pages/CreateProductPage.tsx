import { useEffect, useState } from "react";
import { FormInput } from "../../../components/ui/FormInput";
import { Button } from "../../../components/ui/Button";
import { productApi } from "../../../api/product.api";
import {
  ProductCategory,
  type ProductCreateInput,
} from "../../../types/product";
import { toast } from "react-toastify";
import axios from "axios";
import {
  RotateCw,
  ChevronUp,
  ChevronDown,
  ArrowLeft,
  Plus,
} from "lucide-react";
import { Link } from "react-router-dom";
import { ImageUpload } from "../../../components/ui/ImageUpload";

export default function CreateProductPage() {
  const [product, setProduct] = useState<ProductCreateInput>({
    category_id: 0,
    sku: "",
    name: "",
    barcode: "",
    uom: "",
    origin: "",
    cost_price: 0,
    sale_price: 0,
    tax_rate_id: undefined,
    description: "",
    status: "active",
    thumbnail: null,
    gallery: [],
  });

  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [uploadingThumbnail] = useState(false);
  const [uploadingGallery] = useState(false);
  const [expanded, setExpanded] = useState({ info: true, images: true });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await productApi.getProductCategories();
        console.log("Fetched categories:", res);
        setCategories(res);
      } catch (error) {
        console.error("Error fetching categories:", error);
      }
    };
    fetchCategories();
  }, []);

  const handleChange = (
    field: keyof ProductCreateInput,
    value: ProductCreateInput[keyof ProductCreateInput]
  ) => {
    setProduct((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    try {
      setIsSubmitting(true);

      const formData = new FormData();
      formData.append("sku", product.sku);
      formData.append("name", product.name);
      formData.append("description", product.description || "");
      formData.append("category_id", product.category_id?.toString() || "");
      formData.append("uom", product.uom || "");
      formData.append("origin", product.origin || "");
      formData.append("barcode", product.barcode || "");
      formData.append("cost_price", product.cost_price?.toString() || "0");
      formData.append("sale_price", product.sale_price?.toString() || "0");
      formData.append("status", product.status);

      if (product.tax_rate_id) {
        formData.append("tax_rate_id", product.tax_rate_id.toString());
      }

      if (product.thumbnail) {
        formData.append("thumbnail", product.thumbnail);
      }

      if (product.gallery && product.gallery.length > 0) {
        product.gallery.forEach((file) => {
          formData.append("gallery", file);
        });
      }

      console.log(
        "Submitting product:",
        Object.fromEntries(formData.entries())
      );

      const res = await productApi.createProduct(formData);
      console.log("✅ Product created:", res);
      toast.success("Product created successfully! 🎉");

      setProduct({
        category_id: 0,
        sku: "",
        name: "",
        barcode: "",
        uom: "",
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
        console.error("Upload error:", error.response?.data || error.message);
      } else {
        console.error("Unexpected error:", error);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // -------------------- UI --------------------
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
          <button className="flex items-center justify-center border border-gray-300 bg-gray-50 text-gray-600 p-2 rounded-lg hover:bg-gray-100 transition">
            <RotateCw className="w-4 h-4" />
          </button>

          <button
            onClick={() =>
              setExpanded((prev) => ({
                info: !prev.info,
                images: !prev.images,
              }))
            }
            className="flex items-center justify-center border border-gray-300 bg-gray-50 text-gray-600 p-2 rounded-lg hover:bg-gray-100 transition"
          >
            {expanded.info ? (
              <ChevronUp className="w-4 h-4" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
          </button>

          <Link to="/inventory/products">
            <Button className="flex items-center gap-1 bg-[#1a1d29] hover:bg-[#0f111a] text-white px-4 py-2 rounded-lg shadow text-sm font-medium transition">
              <ArrowLeft className="w-4 h-4" />
              Back to Product
            </Button>
          </Link>
        </div>
      </div>

      {/* Product Info */}
      {expanded.info && (
        <div className="bg-white p-6 rounded-xl border shadow-sm space-y-6">
          <h3 className="flex items-center gap-2 font-semibold text-gray-700">
            <span className="text-orange-500">ℹ️</span> Product Information
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormInput
              label="Product Name"
              value={product.name}
              onChange={(v) => handleChange("name", v)}
              placeholder="Enter product name"
              required
            />
            <FormInput
              label="SKU"
              value={product.sku}
              onChange={(v) => handleChange("sku", v)}
              placeholder="Enter SKU"
            />
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Category
              </label>
              <select
                value={product.category_id}
                onChange={(e) =>
                  handleChange("category_id", Number(e.target.value))
                }
                className="w-full border rounded-lg px-4 py-3 text-sm focus:ring-2 focus:ring-orange-400"
              >
                <option value="">-- Select Category --</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <FormInput
              label="Unit of Measure"
              value={product.uom?.toString() || ""}
              onChange={(v) => handleChange("uom", v)}
              placeholder="pcs, box, etc."
            />
            <FormInput
              label="Origin"
              value={product.origin?.toString() || ""}
              onChange={(v) => handleChange("origin", v)}
              placeholder="Enter origin"
            />
            <FormInput
              label="Barcode"
              value={product.barcode?.toString() || ""}
              onChange={(v) => handleChange("barcode", v)}
              placeholder="Enter barcode"
            />
            <FormInput
              label="Tax Rate ID"
              type="number"
              value={product.tax_rate_id?.toString() || ""}
              onChange={(v) => handleChange("tax_rate_id", Number(v))}
              placeholder="Enter tax rate ID"
            />
            <FormInput
              label="Cost Price"
              type="number"
              value={product.cost_price?.toString() || ""}
              onChange={(v) => handleChange("cost_price", Number(v))}
              placeholder="0.00"
            />
            <FormInput
              label="Sale Price"
              type="number"
              value={product.sale_price?.toString() || ""}
              onChange={(v) => handleChange("sale_price", Number(v))}
              placeholder="0.00"
            />
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Status
              </label>
              <select
                value={product.status}
                onChange={(e) =>
                  handleChange(
                    "status",
                    e.target.value as "active" | "inactive"
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
        </div>
      )}

      {/* Images */}
      {expanded.images && (
        <div className="bg-white p-6 rounded-xl border shadow-sm space-y-8">
          <h3 className="flex items-center gap-2 font-semibold text-gray-700">
            <span className="text-orange-500">🖼️</span> Images
          </h3>

          {/* Thumbnail */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Thumbnail Image
            </label>
            {product.thumbnail ? (
              <ImageUpload
                preview={URL.createObjectURL(product.thumbnail)}
                onImageChange={(file: File | File[]) => {
                  const thumbnailFile = Array.isArray(file) ? file[0] : file;
                  setProduct((prev) => ({ ...prev, thumbnail: thumbnailFile }));
                }}
                onRemove={() =>
                  setProduct((prev) => ({
                    ...prev,
                    thumbnail: null,
                  }))
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
                    const file = e.target.files?.[0];
                    if (file)
                      setProduct((prev) => ({
                        ...prev,
                        thumbnail: file,
                      }));
                  }}
                />
              </label>
            )}
          </div>

          {/* Gallery */}
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
                      const updatedGallery = [...prev.gallery];
                      updatedGallery[i] = newFile;
                      return { ...prev, gallery: updatedGallery };
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

              {/* Add new image */}
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
      )}

      {/* Submit */}
      <div className="flex justify-end">
        <Button
          onClick={handleSubmit}
          disabled={isSubmitting}
          className={`bg-[#ff8c00] hover:bg-[#ff7700] text-white px-6 py-3 rounded-lg font-medium shadow-md ${
            isSubmitting ? "opacity-70 cursor-not-allowed" : ""
          }`}
        >
          {isSubmitting ? "Đang tạo..." : "Create Product"}
        </Button>
      </div>
    </div>
  );
}
