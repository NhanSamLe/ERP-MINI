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
  Building,
  MapPin,
} from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "../../../store/store";
import {
  fetchWarehousesThunk,
  deleteWarehouseThunk,
} from "../store/stock/warehouse/warehouse.thunks";
import { toast } from "react-toastify";
import { getErrorMessage } from "@/utils/ErrorHelper";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

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
    <div className="max-w-6xl mx-auto p-6 md:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-orange-50 border border-orange-100 flex items-center justify-center text-orange-500 shadow-sm">
            <WarehouseIcon className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Warehouse Management</h1>
            <p className="text-gray-500 text-sm mt-0.5">
              Manage and monitor all warehouse installations in the system
            </p>
          </div>
        </div>

        {isAdmin && (
          <Button
            onClick={() => nav("/inventory/warehouses/create")}
            leftIcon={<Plus className="w-4 h-4" />}
            size="md"
          >
            New Warehouse
          </Button>
        )}
      </div>

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 flex items-center gap-3.5 transition duration-300 hover:-translate-y-0.5 hover:shadow-md">
          <div className="w-10 h-10 rounded-xl bg-orange-50 border border-orange-100 flex items-center justify-center text-orange-500 shrink-0">
            <WarehouseIcon className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Warehouses</p>
            <p className="text-lg font-extrabold text-slate-850 mt-0.5">{items.length}</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 flex items-center gap-3.5 transition duration-300 hover:-translate-y-0.5 hover:shadow-md">
          <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-500 shrink-0">
            <Building className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Branches Covered</p>
            <p className="text-lg font-extrabold text-slate-850 mt-0.5">
              {Array.from(new Set(items.map(x => x.branch_id))).length}
            </p>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 flex items-center gap-3.5 transition duration-300 hover:-translate-y-0.5 hover:shadow-md">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-500 shrink-0">
            <MapPin className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Located Regions</p>
            <p className="text-lg font-extrabold text-slate-850 mt-0.5">
              {items.filter(x => x.address).length}
            </p>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <Card className="border-slate-100 shadow-sm overflow-hidden bg-white/80 backdrop-blur-md">
        {/* Search Header */}
        <div className="p-5 border-b border-slate-100 bg-slate-50/10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4 pointer-events-none z-10" />
            <Input
              placeholder="Search warehouses by name, code, or address..."
              value={search}
              onChange={setSearch}
              className="pl-9 bg-white border-slate-200 focus:ring-orange-500 focus:border-orange-500"
            />
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50/80 text-[10px] uppercase tracking-wider font-bold text-slate-500 border-b border-slate-100">
              <tr>
                <th className="py-3.5 px-6 text-left">Code</th>
                <th className="py-3.5 px-6 text-left">Name</th>
                <th className="py-3.5 px-6 text-left">Address</th>
                <th className="py-3.5 px-6 text-center w-28">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={4} className="py-16 text-center text-slate-400">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-8 h-8 border-3 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
                      <span className="text-xs font-medium">Loading warehouses...</span>
                    </div>
                  </td>
                </tr>
              ) : totalItems === 0 ? (
                <tr>
                  <td colSpan={4} className="py-16 text-center text-slate-400 italic">
                    No warehouses found
                  </td>
                </tr>
              ) : (
                pageItems.map((w) => (
                  <tr key={w.id} className="hover:bg-slate-50/40 transition-colors">
                    <td className="py-3.5 px-6 font-semibold text-slate-700">{w.code}</td>
                    <td className="py-3.5 px-6 font-medium text-slate-800">{w.name}</td>
                    <td className="py-3.5 px-6 text-slate-600">{w.address ?? "-"}</td>
                    <td className="py-3.5 px-6 text-center">
                      <div className="flex justify-center items-center gap-2">
                        <Link
                          to={`/inventory/warehouses/${w.id}/edit`}
                          className="inline-flex items-center justify-center w-8 h-8 rounded-lg border border-slate-200 text-slate-600 bg-white hover:bg-slate-50 hover:text-slate-900 transition-colors shadow-sm"
                          title={isAdmin ? "Edit" : "View"}
                        >
                          {isAdmin ? (
                            <Pencil className="w-3.5 h-3.5" />
                          ) : (
                            <Eye className="w-3.5 h-3.5" />
                          )}
                        </Link>

                        {isAdmin && (
                          <button
                            onClick={() => openDeleteModal(Number(w.id))}
                            className="inline-flex items-center justify-center w-8 h-8 rounded-lg border border-slate-200 text-rose-600 bg-white hover:bg-rose-50 hover:text-rose-700 hover:border-rose-100 transition-colors shadow-sm"
                            title="Delete"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalItems > 0 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100 bg-slate-50/30 text-xs text-slate-500">
            <div>
              Showing{" "}
              <span className="font-semibold text-slate-800">
                {startIndex + 1} - {Math.min(startIndex + pageSize, totalItems)}
              </span>{" "}
              of <span className="font-semibold text-slate-800">{totalItems}</span> warehouses
            </div>

            <div className="flex items-center gap-1.5">
              <button
                onClick={() => goToPage(currentPage - 1)}
                disabled={currentPage === 1}
                className="p-1.5 border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
              >
                <ChevronLeft className="w-3.5 h-3.5 text-slate-600" />
              </button>

              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <button
                  key={p}
                  onClick={() => goToPage(p)}
                  className={`w-8 h-8 rounded-lg border text-sm font-semibold transition ${
                    p === currentPage
                      ? "bg-orange-500 border-orange-500 text-white shadow-sm"
                      : "border-slate-200 text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  {p}
                </button>
              ))}

              <button
                onClick={() => goToPage(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="p-1.5 border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
              >
                <ChevronRight className="w-3.5 h-3.5 text-slate-600" />
              </button>
            </div>
          </div>
        )}
      </Card>

      {/* Delete Confirmation Modal */}
      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-100 mb-4 animate-pulse">
              <Trash2 className="h-6 w-6 text-red-600" />
            </div>
            <DialogTitle className="text-center text-lg font-bold text-gray-900">
              Delete Warehouse
            </DialogTitle>
            <DialogDescription className="text-center text-sm text-gray-500">
              Are you sure you want to delete this warehouse? This action cannot be undone and will permanently remove this record from the system.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex-row justify-center gap-3 mt-4">
            <Button
              variant="outline"
              onClick={() => setConfirmOpen(false)}
              disabled={deleting}
              className="w-full sm:w-auto"
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={handleDelete}
              loading={deleting}
              className="w-full sm:w-auto"
            >
              Yes, Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
