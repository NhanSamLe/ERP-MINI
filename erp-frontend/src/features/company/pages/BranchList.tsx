import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Building2,
  Plus,
  Pencil,
  Power,
  Eye,
  CheckCircle,
  Trash2,
  Search,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import {
  fetchBranches,
  deactivateBranch,
  activateBranch,
  deleteBranch,
  Branch,
} from "../branch.service";

// mock role (tùy bạn tích hợp)
const useAuth = () => ({ user: { role: "ADMIN" as "ADMIN" | "BRANCH_MANAGER" } });

export default function BranchList() {
  const nav = useNavigate();
  const { user } = useAuth();
  const isAdmin = user.role === "ADMIN";

  const [items, setItems] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  // ====== phân trang ======
  const [page, setPage] = useState(1);
  const pageSize = 10; // 👉 1 page = 10 branches, muốn đổi thì chỉnh số này

  const load = async () => {
    setLoading(true);
    try {
      const data = await fetchBranches();
      setItems(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const toggleStatus = async (b: Branch) => {
    if (!b.id) return;
    if (b.status === "inactive") await activateBranch(b.id);
    else await deactivateBranch(b.id);
    await load();
  };

  const onDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this branch?")) return;
    await deleteBranch(id);
    await load();
  };

  // Lọc danh sách theo ô search
  const filtered = items.filter((b) => {
    const term = search.toLowerCase();
    return (
      b.name?.toLowerCase().includes(term) ||
      b.code?.toLowerCase().includes(term) ||
      b.address?.toLowerCase().includes(term)
    );
  });

  // reset về page 1 khi filter thay đổi
  useEffect(() => {
    setPage(1);
  }, [search]);

  // ====== tính toán phân trang ======
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
          <Building2 className="w-7 h-7 text-orange-500" />
          <div>
            <h1 className="text-2xl font-bold">Branch Management</h1>
            <p className="text-gray-500 text-sm">Quản lý công ty & chi nhánh</p>
          </div>
        </div>
        {isAdmin && (
          <button
            onClick={() => nav("/company/branches/create")}
            className="inline-flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg"
          >
            <Plus className="w-4 h-4" /> New Branch
          </button>
        )}
      </div>

      {/* Search Bar */}
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
              <th className="py-3 px-4 text-left">Province</th>
              <th className="py-3 px-4 text-left">District</th>
              <th className="py-3 px-4 text-left">Ward</th>
              <th className="py-3 px-4 text-left">Tax Code</th>
              <th className="py-3 px-4 text-left">Bank Acc.</th>
              <th className="py-3 px-4 text-left">Bank Name</th>
              <th className="py-3 px-4 text-left">Status</th>
              <th className="py-3 px-4 text-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td className="py-6 px-4 text-center" colSpan={11}>
                  Loading...
                </td>
              </tr>
            ) : totalItems === 0 ? (
              <tr>
                <td className="py-6 px-4 text-center" colSpan={11}>
                  No branches found
                </td>
              </tr>
            ) : (
              pageItems.map((b) => (
                <tr key={b.id} className="border-t">
                  <td className="py-3 px-4">{b.code}</td>
                  <td className="py-3 px-4">{b.name}</td>
                  <td className="py-3 px-4">{b.address ?? "-"}</td>
                  <td className="py-3 px-4">{b.province ?? "-"}</td>
                  <td className="py-3 px-4">{b.district ?? "-"}</td>
                  <td className="py-3 px-4">{b.ward ?? "-"}</td>
                  <td className="py-3 px-4">{b.tax_code ?? "-"}</td>
                  <td className="py-3 px-4">{b.bank_account ?? "-"}</td>
                  <td className="py-3 px-4">{b.bank_name ?? "-"}</td>
                  <td className="py-3 px-4">
                    <span
                      className={`px-2 py-1 rounded-full text-xs ${
                        b.status === "inactive"
                          ? "bg-gray-100 text-gray-600"
                          : "bg-green-100 text-green-700"
                      }`}
                    >
                      {b.status ?? "active"}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-center">
                    <div className="flex justify-center items-center gap-2">
                      <Link
                        to={`/company/branches/${b.id}`}
                        className="inline-flex items-center gap-1 px-2 py-1 rounded-md border hover:bg-gray-50"
                        title="View / Edit"
                      >
                        {isAdmin ? (
                          <Pencil className="w-4 h-4" />
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
                        {isAdmin ? "" : "View"}
                      </Link>

                      {isAdmin && (
                        <button
                          onClick={() => toggleStatus(b)}
                          className="inline-flex items-center gap-1 px-2 py-1 rounded-md border hover:bg-gray-50"
                          title={
                            b.status === "inactive" ? "Activate" : "Deactivate"
                          }
                        >
                          {b.status === "inactive" ? (
                            <>
                              <CheckCircle className="w-4 h-4 text-green-600" />
                              Activate
                            </>
                          ) : (
                            <>
                              <Power className="w-4 h-4 text-gray-600" />
                              Deactivate
                            </>
                          )}
                        </button>
                      )}

                      {isAdmin && (
                        <button
                          onClick={() => onDelete(Number(b.id))}
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
              of <span className="font-medium">{totalItems}</span> branches
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={() => goToPage(currentPage - 1)}
                disabled={currentPage === 1}
                className="flex items-center gap-1 px-2 py-1 rounded border text-xs disabled:opacity-40 hover:bg-white"
              >
                <ChevronLeft className="w-3 h-3" />
                Prev
              </button>

              {Array.from({ length: totalPages }, (_, i) => i + 1).map((pNum) => (
                <button
                  key={pNum}
                  onClick={() => goToPage(pNum)}
                  className={`w-7 h-7 rounded text-xs border ${
                    pNum === currentPage
                      ? "bg-orange-500 text-white border-orange-500"
                      : "bg-white text-gray-700 hover:bg-gray-100"
                  }`}
                >
                  {pNum}
                </button>
              ))}

              <button
                onClick={() => goToPage(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="flex items-center gap-1 px-2 py-1 rounded border text-xs disabled:opacity-40 hover:bg-white"
              >
                Next
                <ChevronRight className="w-3 h-3" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
