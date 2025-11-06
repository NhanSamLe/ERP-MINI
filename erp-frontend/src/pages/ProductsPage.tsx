import { useEffect, useState } from "react";
import { productApi } from "../api/product.api";
import { Product } from "../types/product";
import { DataTable } from "../components/ui/DataTable";
import { Link } from "react-router-dom";
import { Button } from "../components/ui/Button";
import {
  Search,
  FileText,
  FileSpreadsheet,
  RotateCw,
  ChevronUp,
  Upload,
  Plus,
} from "lucide-react";

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const data = await productApi.getAllProducts();
      setProducts(data);
    } catch (error) {
      console.error("Failed to fetch products:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const columns = [
    {
      key: "image_url",
      label: "Ảnh",
      render: (p: Product) =>
        p.image_url ? (
          <img
            src={p.image_url}
            alt={p.name}
            className="w-10 h-10 rounded object-cover border"
          />
        ) : (
          <span className="text-gray-400 text-xs italic">Không có ảnh</span>
        ),
    },
    { key: "sku", label: "Mã sản phẩm" },
    { key: "name", label: "Tên sản phẩm" },
    {
      key: "created_at",
      label: "Ngày tạo",
      render: (p: Product) =>
        new Date(p.created_at).toLocaleDateString("vi-VN", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
        }),
    },
    {
      key: "sale_price",
      label: "Giá bán",
      render: (p: Product) => (p.sale_price ? `$${p.sale_price}` : "—"),
    },
    {
      key: "status",
      label: "Trạng thái",
      render: (p: Product) => (
        <span
          className={`px-2 py-1 rounded text-xs font-medium ${
            p.status === "active"
              ? "bg-green-100 text-green-700"
              : "bg-gray-100 text-gray-500"
          }`}
        >
          {p.status === "active" ? "Hoạt động" : "Ngưng bán"}
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between bg-white px-6 py-4 rounded-xl border shadow-sm">
        <div>
          <h1 className="text-xl font-semibold text-gray-800">Product List</h1>
          <p className="text-sm text-gray-500">Manage your products</p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* PDF */}
          <button className="flex items-center gap-1 border border-red-300 bg-red-100 text-red-600 px-3 py-1.5 rounded-lg text-sm hover:bg-red-200 transition">
            <FileText className="w-4 h-4" />
          </button>

          {/* Excel */}
          <button className="flex items-center gap-1 border border-green-300 bg-green-100 text-green-600 px-3 py-1.5 rounded-lg text-sm hover:bg-green-200 transition">
            <FileSpreadsheet className="w-4 h-4" />
          </button>

          {/* Refresh */}
          <button
            onClick={fetchProducts}
            className="flex items-center gap-1 border border-gray-300 bg-gray-50 text-gray-600 px-3 py-1.5 rounded-lg text-sm hover:bg-gray-100 transition"
          >
            <RotateCw className="w-4 h-4" />
          </button>

          {/* Toggle */}
          <button className="flex items-center gap-1 border border-gray-300 bg-gray-50 text-gray-600 px-3 py-1.5 rounded-lg text-sm hover:bg-gray-100 transition">
            <ChevronUp className="w-4 h-4" />
          </button>

          {/* Add Product */}
          <Link to="/inventory/products/create">
            <Button className="flex items-center gap-1 bg-[#ff8c00] hover:bg-[#ff7700] text-white px-4 py-2 rounded-lg shadow text-sm font-medium transition">
              <Plus className="w-4 h-4" />
              Add Product
            </Button>
          </Link>
          {/* Import Products */}
          <Button className="flex items-center gap-1 bg-[#1a1d29] hover:bg-[#0f111a] text-white px-4 py-2 rounded-lg shadow text-sm font-medium transition">
            <Upload className="w-4 h-4" />
            Import Products
          </Button>
        </div>
      </div>

      {/* Search & Filter */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative w-72">
          <Search className="absolute left-3 top-2.5 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Search"
            className="w-full border rounded-lg pl-9 pr-3 py-2 text-sm focus:ring-1 focus:ring-orange-400"
          />
        </div>

        <select className="border rounded-lg px-3 py-2 text-sm text-gray-700">
          <option>Category</option>
        </select>
        <select className="border rounded-lg px-3 py-2 text-sm text-gray-700">
          <option>Brand</option>
        </select>
      </div>

      {/* Table */}
      <DataTable
        data={products}
        columns={columns}
        loading={loading}
        onView={(item) => console.log("Xem:", item)}
        onEdit={(item) => console.log("Sửa:", item)}
        onDelete={(item) => console.log("Xóa:", item)}
        searchKeys={["sku", "name"]}
      />
    </div>
  );
}
