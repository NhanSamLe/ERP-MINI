import { useEffect, useMemo, useState } from "react";
import { Product } from "../../../features/products/store/product.types";
import { DataTable } from "../../../components/ui/DataTable";
import { Link } from "react-router-dom";
import { Button } from "../../../components/ui/Button";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { useSelector, useDispatch } from "react-redux";
import { RootState, AppDispatch } from "../../../store/store";
import {
  fetchProductsThunk,
  deleteProductThunk,
  fetchCategoriesThunk,
} from "../store/product.thunks";
import {
  FileText,
  FileSpreadsheet,
  RotateCw,
  Plus,
  Trash2,
  Search,
} from "lucide-react";
import { formatMoney } from "@/utils/currency.helper";

const PRODUCT_TYPE_LABELS: Record<string, string> = {
  storable: "Lưu kho",
  consumable: "Tiêu hao",
  service: "Dịch vụ",
};

const PRODUCT_TYPE_COLORS: Record<string, string> = {
  storable: "bg-blue-100 text-blue-700",
  consumable: "bg-purple-100 text-purple-700",
  service: "bg-teal-100 text-teal-700",
};

export default function ProductsPage() {
  const dispatch = useDispatch<AppDispatch>();
  const role = useSelector((state: RootState) => state.auth.user?.role.code);
  const {
    items: products,
    loading,
    categories,
  } = useSelector((state: RootState) => state.product);

  const [deleting, setDeleting] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  // Filters
  const [searchText, setSearchText] = useState("");
  const [filterCategory, setFilterCategory] = useState("");
  const [filterType, setFilterType] = useState("");
  const [filterStatus, setFilterStatus] = useState("");

  const navigate = useNavigate();

  useEffect(() => {
    dispatch(fetchProductsThunk());
    dispatch(fetchCategoriesThunk());
  }, [dispatch]);

  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchSearch =
        !searchText ||
        p.name.toLowerCase().includes(searchText.toLowerCase()) ||
        p.sku.toLowerCase().includes(searchText.toLowerCase());
      const matchCategory =
        !filterCategory || String(p.category_id) === filterCategory;
      const matchType = !filterType || p.product_type === filterType;
      const matchStatus = !filterStatus || p.status === filterStatus;
      return matchSearch && matchCategory && matchType && matchStatus;
    });
  }, [products, searchText, filterCategory, filterType, filterStatus]);

  const handleDelete = async () => {
    if (!selectedProduct) return;
    setDeleting(true);
    try {
      await dispatch(deleteProductThunk(selectedProduct.id)).unwrap();
      toast.success("Xóa sản phẩm thành công!");
      setConfirmOpen(false);
    } catch {
      toast.error("Xóa sản phẩm thất bại!");
    } finally {
      setDeleting(false);
    }
  };

  const columns = [
    {
      key: "image_url",
      label: "Hình ảnh",
      render: (p: Product) =>
        p.image_url ? (
          <img
            src={p.image_url}
            alt={p.name}
            className="w-10 h-10 rounded object-cover border"
          />
        ) : (
          <div className="w-10 h-10 rounded border bg-gray-100 flex items-center justify-center text-gray-300 text-xs">
            N/A
          </div>
        ),
    },
    { key: "sku", label: "SKU" },
    { key: "name", label: "Tên sản phẩm" },
    {
      key: "category_id",
      label: "Danh mục",
      render: (p: Product) => {
        const cat = categories.find((c) => c.id === p.category_id);
        return cat ? (
          <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs">
            {cat.name}
          </span>
        ) : (
          <span className="text-gray-400 text-xs">—</span>
        );
      },
    },
    {
      key: "product_type",
      label: "Phân loại",
      render: (p: Product) =>
        p.product_type ? (
          <span
            className={`px-2 py-1 rounded text-xs font-medium ${PRODUCT_TYPE_COLORS[p.product_type] || "bg-gray-100 text-gray-600"}`}
          >
            {PRODUCT_TYPE_LABELS[p.product_type] || p.product_type}
          </span>
        ) : (
          <span className="text-gray-400 text-xs">—</span>
        ),
    },
    {
      key: "sale_price",
      label: "Giá bán",
      render: (p: Product) =>
        p.sale_price ? formatMoney(p.sale_price, "VND") : "—",
    },
    {
      key: "uom_id",
      label: "Đơn vị tính",
      render: (p: Product) =>
        p.uom ? (
          <span className="text-gray-700 text-xs">{p.uom.name}</span>
        ) : (
          <span className="text-gray-400 text-xs">—</span>
        ),
    },
    {
      key: "status",
      label: "Trạng thái",
      render: (p: Product) => (
        <span
          className={`px-2 py-1 rounded text-xs font-medium ${p.status === "active" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}
        >
          {p.status === "active" ? "Hoạt động" : "Không hoạt động"}
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between bg-white px-6 py-4 rounded-xl border shadow-sm">
        <div>
          <h1 className="text-xl font-semibold text-gray-800">Danh sách sản phẩm</h1>
          <p className="text-sm text-gray-500">
            {filteredProducts.length} / {products.length} sản phẩm
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button className="flex items-center gap-1 border border-red-300 bg-red-100 text-red-600 px-3 py-1.5 rounded-lg text-sm hover:bg-red-200 transition">
            <FileText className="w-4 h-4" />
          </button>
          <button className="flex items-center gap-1 border border-green-300 bg-green-100 text-green-600 px-3 py-1.5 rounded-lg text-sm hover:bg-green-200 transition">
            <FileSpreadsheet className="w-4 h-4" />
          </button>
          <button
            onClick={() => dispatch(fetchProductsThunk())}
            className="flex items-center gap-1 border border-gray-300 bg-gray-50 text-gray-600 px-3 py-1.5 rounded-lg text-sm hover:bg-gray-100 transition"
          >
            <RotateCw className="w-4 h-4" />
          </button>
          <Link to="/inventory/products/create">
            <Button className="flex items-center gap-1 bg-[#ff8c00] hover:bg-[#ff7700] text-white px-4 py-2 rounded-lg shadow text-sm font-medium transition">
              <Plus className="w-4 h-4" /> Thêm sản phẩm
            </Button>
          </Link>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white px-4 py-3 rounded-xl border shadow-sm flex flex-wrap items-center gap-3">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            placeholder="Tìm kiếm theo tên hoặc SKU..."
            className="w-full pl-9 pr-4 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-orange-400 focus:outline-none"
          />
        </div>

        {/* Category */}
        <select
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
          className="border rounded-lg px-3 py-2 text-sm text-gray-700 focus:ring-2 focus:ring-orange-400 focus:outline-none"
        >
          <option value="">Tất cả danh mục</option>
          {categories.map((c) => (
            <option key={c.id} value={String(c.id)}>
              {c.name}
            </option>
          ))}
        </select>

        {/* Product Type */}
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          className="border rounded-lg px-3 py-2 text-sm text-gray-700 focus:ring-2 focus:ring-orange-400 focus:outline-none"
        >
          <option value="">Tất cả phân loại</option>
          <option value="storable">Lưu kho</option>
          <option value="consumable">Tiêu hao</option>
          <option value="service">Dịch vụ</option>
        </select>

        {/* Status */}
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="border rounded-lg px-3 py-2 text-sm text-gray-700 focus:ring-2 focus:ring-orange-400 focus:outline-none"
        >
          <option value="">Tất cả trạng thái</option>
          <option value="active">Hoạt động</option>
          <option value="inactive">Không hoạt động</option>
        </select>

        {/* Clear */}
        {(searchText || filterCategory || filterType || filterStatus) && (
          <button
            onClick={() => {
              setSearchText("");
              setFilterCategory("");
              setFilterType("");
              setFilterStatus("");
            }}
            className="text-sm text-orange-500 hover:underline whitespace-nowrap"
          >
            Xóa bộ lọc
          </button>
        )}
      </div>

      {/* Table */}
      <DataTable
        data={filteredProducts}
        columns={columns}
        loading={loading}
        onView={(item) =>
          navigate(`/inventory/products/${item.id}`, {
            state: { product: item },
          })
        }
        onEdit={(item) =>
          navigate(`/inventory/products/edit/${item.id}`, {
            state: { product: item },
          })
        }
        onDelete={(item) => {
          setSelectedProduct(item);
          setConfirmOpen(true);
        }}
        canEdit={() => true}
        canDelete={() => role === "ADMIN"}
        searchKeys={["sku", "name"]}
        showSelection={false}
      />

      {/* Confirm Delete */}
      {confirmOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-lg p-6 w-96 text-center">
            <Trash2 className="w-10 h-10 text-red-500 mx-auto mb-3" />
            <h2 className="text-lg font-semibold mb-2">Xóa sản phẩm này?</h2>
            <p className="text-sm text-gray-500 mb-5">
              Hành động này không thể hoàn tác.
            </p>
            <div className="flex justify-center gap-3">
              <Button
                onClick={() => setConfirmOpen(false)}
                className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg text-sm"
                disabled={deleting}
              >
                Hủy
              </Button>
              <Button
                onClick={handleDelete}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm"
                disabled={deleting}
              >
                {deleting ? "Đang xóa..." : "Xác nhận xóa"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
