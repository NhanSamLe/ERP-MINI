import { useEffect, useState } from "react";
import { ProductCategory } from "../../../features/categories/store/category.types";
import { DataTable } from "../../../components/ui/DataTable";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "../../../components/ui/Button";
import { toast } from "react-toastify";
import { useSelector, useDispatch } from "react-redux";
import { RootState, AppDispatch } from "../../../store/store";

import {
  fetchCategoriesThunk,
  deleteCategoryThunk,
} from "../store/category.thunks";

import {
  FileText,
  FileSpreadsheet,
  RotateCw,
  ChevronUp,
  Upload,
  Plus,
  Trash2,
} from "lucide-react";

export default function CategoriesPage() {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();

  const { items: categories, loading } = useSelector(
    (state: RootState) => state.category
  );

  const [deleting, setDeleting] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [selectedCat, setSelectedCat] = useState<ProductCategory | null>(null);

  useEffect(() => {
    dispatch(fetchCategoriesThunk());
  }, [dispatch]);

  const handleDelete = async () => {
    if (!selectedCat) return;
    setDeleting(true);
    try {
      await dispatch(deleteCategoryThunk(selectedCat.id)).unwrap();
      toast.success("Category deleted successfully!");
      setConfirmOpen(false);
    } catch (error) {
      console.error("Failed to delete category:", error);
      toast.error("Failed to delete category!");
    } finally {
      setDeleting(false);
    }
  };

  const columns = [
    { key: "name", label: "Category Name" },

    {
      key: "parent_id",
      label: "Parent",
      render: (c: ProductCategory) =>
        c.parent_id ? `#${c.parent_id}` : "Root",
    },

    {
      key: "created_at",
      label: "Created At",
      render: (c: ProductCategory) =>
        c.created_at
          ? new Date(c.created_at).toLocaleDateString("vi-VN", {
              day: "2-digit",
              month: "2-digit",
              year: "numeric",
            })
          : "—",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between bg-white px-6 py-4 rounded-xl border shadow-sm">
        <div>
          <h1 className="text-xl font-semibold text-gray-800">Categories</h1>
          <p className="text-sm text-gray-500">Manage product categories</p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button className="flex items-center gap-1 border border-red-300 bg-red-100 text-red-600 px-3 py-1.5 rounded-lg text-sm hover:bg-red-200 transition">
            <FileText className="w-4 h-4" />
          </button>

          <button className="flex items-center gap-1 border border-green-300 bg-green-100 text-green-600 px-3 py-1.5 rounded-lg text-sm hover:bg-green-200 transition">
            <FileSpreadsheet className="w-4 h-4" />
          </button>

          <button
            onClick={() => dispatch(fetchCategoriesThunk())}
            className="flex items-center gap-1 border border-gray-300 bg-gray-50 text-gray-600 px-3 py-1.5 rounded-lg text-sm hover:bg-gray-100 transition"
          >
            <RotateCw className="w-4 h-4" />
          </button>

          <button className="flex items-center gap-1 border border-gray-300 bg-gray-50 text-gray-600 px-3 py-1.5 rounded-lg text-sm hover:bg-gray-100 transition">
            <ChevronUp className="w-4 h-4" />
          </button>

          <Link to="/inventory/categories/create">
            <Button className="flex items-center gap-1 bg-[#ff8c00] hover:bg-[#ff7700] text-white px-4 py-2 rounded-lg shadow text-sm font-medium transition">
              <Plus className="w-4 h-4" />
              Add Category
            </Button>
          </Link>

          <Button className="flex items-center gap-1 bg-[#1a1d29] hover:bg-[#0f111a] text-white px-4 py-2 rounded-lg shadow text-sm font-medium transition">
            <Upload className="w-4 h-4" />
            Import
          </Button>
        </div>
      </div>

      {/* Table */}
      <DataTable
        data={categories}
        columns={columns}
        loading={loading}
        onView={(item) => console.log("View:", item)}
        onEdit={(item) =>
          navigate("/inventory/categories/edit", { state: { category: item } })
        }
        onDelete={(item) => {
          setSelectedCat(item);
          setConfirmOpen(true);
        }}
        searchKeys={["name"]}
      />

      {confirmOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-lg p-6 w-96 text-center">
            <Trash2 className="w-10 h-10 text-red-500 mx-auto mb-3" />
            <h2 className="text-lg font-semibold mb-2">
              Are you sure you want to delete this category?
            </h2>
            <p className="text-sm text-gray-500 mb-5">
              This action cannot be undone.
            </p>
            <div className="flex justify-center gap-3">
              <Button
                onClick={() => setConfirmOpen(false)}
                className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg text-sm"
                disabled={deleting}
              >
                Cancel
              </Button>

              <Button
                onClick={handleDelete}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm"
                disabled={deleting}
              >
                {deleting ? "Deleting..." : "Yes, Delete"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
