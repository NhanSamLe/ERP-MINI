import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Warehouse as WarehouseIcon,
  Plus,
  Pencil,
  Eye,
  Trash2,
  Search,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "../../../store/store";
import {
  fetchWarehousesThunk,
  deleteWarehouseThunk,
} from "../store/stock/warehouse/warehouse.thunks";
import { toast } from "react-toastify";
import { getErrorMessage } from "@/utils/ErrorHelper";

export default function WarehousePages() {
  const nav = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  const { user } = useSelector((state: RootState) => state.auth);
  const isAdmin = user?.role.code === "ADMIN";

  const { items, loading } = useSelector((state: RootState) => state.warehouse);

  const [search, setSearch] = useState("");

  // pagination
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    dispatch(fetchWarehousesThunk());
  }, [dispatch]);

  const openDeleteModal = (id: number) => {
    setSelectedId(id);
    setConfirmOpen(true);
  };

  const handleDelete = async () => {
    if (!selectedId) return;

    try {
      setDeleting(true);
      await dispatch(deleteWarehouseThunk(selectedId)).unwrap();
      await dispatch(fetchWarehousesThunk());
      setConfirmOpen(false);
      setSelectedId(null);
      toast.success("Warehouse deleted successfully!");
    } catch (error) {
      toast.error(getErrorMessage(error));
      console.error(error);
    } finally {
      setDeleting(false);
    }
  };

  // search filter
  const filtered = items.filter((w) => {
    const term = search.toLowerCase();
    return (
      w.name?.toLowerCase().includes(term) ||
      w.code?.toLowerCase().includes(term) ||
      w.address?.toLowerCase().includes(term)
    );
  });

  useEffect(() => {
    setPage(1);
  }, [search]);

  // pagination calc
  const totalItems = filtered.length;
  const totalPages = totalItems ? Math.ceil(totalItems / pageSize) : 1;
  const currentPage = Math.min(page, totalPages);
  const startIndex = (currentPage - 1) * pageSize;
  const pageItems = filtered.slice(startIndex, startIndex + pageSize);

  const goToPage = (p: number) => {
    if (p < 1 || p > totalPages) return;
    setPage(p);
  };

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <WarehouseIcon className="w-7 h-7 text-orange-500" />
          <div>
            <h1 className="text-2xl font-bold">Warehouse Management</h1>
            <p className="text-gray-500 text-sm">
              Manage all warehouses in the system
            </p>
          </div>
        </div>

        {isAdmin && (
          <button
            onClick={() => nav("/inventory/warehouses/create")}
            className="inline-flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg"
          >
            <Plus className="w-4 h-4" /> New Warehouse
          </button>
        )}
      </div>

      {/* Search */}
      <div className="mb-5 relative">
        <Search className="absolute left-3 top-2.5 text-gray-400 w-4 h-4" />
        <input
          type="text"
          placeholder="Search..."
          className="w-full border rounded-lg pl-9 pr-4 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-orange-400"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Table */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-600">
            <tr>
              <th className="py-3 px-4 text-left">Code</th>
              <th className="py-3 px-4 text-left">Name</th>
              <th className="py-3 px-4 text-left">Address</th>
              <th className="py-3 px-4 text-center">Actions</th>
            </tr>
          </thead>

          <tbody>
            {loading ? (
              <tr>
                <td colSpan={4} className="py-6 text-center">
                  Loading...
                </td>
              </tr>
            ) : totalItems === 0 ? (
              <tr>
                <td colSpan={4} className="py-6 text-center">
                  No warehouses found
                </td>
              </tr>
            ) : (
              pageItems.map((w) => (
                <tr key={w.id} className="border-t">
                  <td className="py-3 px-4">{w.code}</td>
                  <td className="py-3 px-4">{w.name}</td>
                  <td className="py-3 px-4">{w.address ?? "-"}</td>
                  <td className="py-3 px-4 text-center">
                    <div className="flex justify-center gap-2">
                      <Link
                        to={`/inventory/warehouses/${w.id}/edit`}
                        className="inline-flex items-center gap-1 px-2 py-1 rounded-md border hover:bg-gray-50"
                      >
                        {isAdmin ? (
                          <Pencil className="w-4 h-4" />
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
                      </Link>

                      {isAdmin && (
                        <button
                          onClick={() => openDeleteModal(Number(w.id))}
                          className="inline-flex items-center gap-1 px-2 py-1 rounded-md border text-red-600 hover:bg-red-50"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        {/* Pagination */}
        {totalItems > 0 && (
          <div className="flex items-center justify-between px-4 py-3 border-t bg-gray-50 text-xs text-gray-600">
            <div>
              Showing{" "}
              <span className="font-medium">
                {startIndex + 1} - {Math.min(startIndex + pageSize, totalItems)}
              </span>{" "}
              of <span className="font-medium">{totalItems}</span> warehouses
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={() => goToPage(currentPage - 1)}
                disabled={currentPage === 1}
                className="px-2 py-1 border rounded disabled:opacity-40"
              >
                <ChevronLeft className="w-3 h-3" />
              </button>

              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <button
                  key={p}
                  onClick={() => goToPage(p)}
                  className={`w-7 h-7 border rounded ${
                    p === currentPage
                      ? "bg-orange-500 text-white"
                      : "hover:bg-gray-100"
                  }`}
                >
                  {p}
                </button>
              ))}

              <button
                onClick={() => goToPage(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="px-2 py-1 border rounded disabled:opacity-40"
              >
                <ChevronRight className="w-3 h-3" />
              </button>
            </div>
          </div>
        )}
      </div>
      {confirmOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-lg p-6 w-96 text-center">
            <Trash2 className="w-10 h-10 text-red-500 mx-auto mb-3" />

            <h2 className="text-lg font-semibold mb-2">
              Are you sure you want to delete this warehouse?
            </h2>

            <p className="text-sm text-gray-500 mb-5">
              This action cannot be undone.
            </p>

            <div className="flex justify-center gap-3">
              <button
                onClick={() => setConfirmOpen(false)}
                className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg text-sm"
                disabled={deleting}
              >
                Cancel
              </button>

              <button
                onClick={handleDelete}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm"
                disabled={deleting}
              >
                {deleting ? "Deleting..." : "Yes, Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
