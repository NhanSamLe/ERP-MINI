import { useEffect, useState } from "react";
import { productApi } from "../api/product.api";
import { Product } from "../types/product";
import { DataTable } from "../components/ui/DataTable";
import { Button } from "../components/ui/Button";

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
          className={`px-2 py-1 rounded text-xs ${
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
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-gray-800">
          Danh sách sản phẩm
        </h1>
        <Button>Thêm sản phẩm</Button>
      </div>

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
