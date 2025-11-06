import { useState } from "react";
import { FormInput } from "../components/ui/FormInput";
import { Button } from "../components/ui/Button";
import {
  RotateCw,
  ChevronUp,
  ChevronDown,
  ArrowLeft,
  Plus,
} from "lucide-react";
import { Link } from "react-router-dom";

export default function CreateProductPage() {
  const [product, setProduct] = useState({
    name: "",
    sku: "",
    brand: "",
    category: "",
    unit: "",
    quantity: "",
    barcode: "",
    description: "",
    cost_price: "",
    sale_price: "",
    status: "active",
    image_urls: [] as string[],
  });

  const [uploading, setUploading] = useState(false);
  const [expanded, setExpanded] = useState({
    info: true,
    images: true,
  });

  const handleChange = (field: string, value: string) => {
    setProduct({ ...product, [field]: value });
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || !files.length) return;
    const newUrls: string[] = [];
    setUploading(true);

    for (const file of files) {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("upload_preset", "your_preset_here");

      const res = await fetch(
        "https://api.cloudinary.com/v1_1/your_cloud_name/image/upload",
        {
          method: "POST",
          body: formData,
        }
      );
      const data = await res.json();
      newUrls.push(data.secure_url);
    }

    setUploading(false);
    setProduct({ ...product, image_urls: [...product.image_urls, ...newUrls] });
  };

  const handleImageRemove = (url: string) => {
    setProduct({
      ...product,
      image_urls: product.image_urls.filter((img) => img !== url),
    });
  };

  const handleSubmit = () => {
    console.log("Product created:", product);
    // gọi API tạo sản phẩm ở đây
  };

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
              setExpanded({
                info: !expanded.info,
                images: !expanded.images,
              })
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

      {/* Product Information */}
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
            <FormInput
              label="Brand"
              value={product.brand}
              onChange={(v) => handleChange("brand", v)}
              placeholder="Enter brand"
            />
            <FormInput
              label="Category"
              value={product.category}
              onChange={(v) => handleChange("category", v)}
              placeholder="Enter category"
            />
            <FormInput
              label="Unit"
              value={product.unit}
              onChange={(v) => handleChange("unit", v)}
              placeholder="pcs, box, etc."
            />
            <FormInput
              label="Quantity"
              type="number"
              value={product.quantity}
              onChange={(v) => handleChange("quantity", v)}
              placeholder="0"
            />
            <FormInput
              label="Barcode"
              value={product.barcode}
              onChange={(v) => handleChange("barcode", v)}
              placeholder="Enter barcode"
            />
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Status
              </label>
              <select
                value={product.status}
                onChange={(e) => handleChange("status", e.target.value)}
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
            ></textarea>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormInput
              label="Cost Price"
              type="number"
              value={product.cost_price}
              onChange={(v) => handleChange("cost_price", v)}
              placeholder="0.00"
            />
            <FormInput
              label="Sale Price"
              type="number"
              value={product.sale_price}
              onChange={(v) => handleChange("sale_price", v)}
              placeholder="0.00"
            />
          </div>
        </div>
      )}

      {/* Images */}
      {expanded.images && (
        <div className="bg-white p-6 rounded-xl border shadow-sm space-y-6">
          <h3 className="flex items-center gap-2 font-semibold text-gray-700">
            <span className="text-orange-500">🖼️</span> Images
          </h3>

          <div className="flex flex-wrap gap-4">
            {/* Add Images Box */}
            <label className="w-32 h-32 border-2 border-dashed border-gray-300 rounded-xl flex flex-col items-center justify-center text-gray-400 hover:border-orange-400 hover:text-orange-500 cursor-pointer">
              <Plus className="w-5 h-5 mb-1" />
              <span className="text-xs font-medium">
                {uploading ? "Uploading..." : "Add Images"}
              </span>
              <input
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={handleImageUpload}
              />
            </label>

            {/* Uploaded Images */}
            {product.image_urls.map((url) => (
              <div
                key={url}
                className="relative w-32 h-32 border rounded-xl overflow-hidden"
              >
                <img
                  src={url}
                  alt="Uploaded"
                  className="w-full h-full object-cover"
                />
                <button
                  onClick={() => handleImageRemove(url)}
                  className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Create Button */}
      <div className="flex justify-end">
        <Button
          onClick={handleSubmit}
          className="bg-[#ff8c00] hover:bg-[#ff7700] text-white px-6 py-3 rounded-lg font-medium shadow-md"
        >
          Create Product
        </Button>
      </div>
    </div>
  );
}
