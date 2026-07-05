import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
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
  Loader2,
  Inbox,
} from "lucide-react";
import {
  fetchBranches,
  deactivateBranch,
  activateBranch,
  deleteBranch,
  Branch,
} from "../branch.service";
import { ActionConfirmModal } from "@/components/common/ActionConfirmModal";
import { useAppSelector } from "@/store/hooks";

const PAGE_SIZE = 10;

export default function BranchList() {
  const nav = useNavigate();
  const { user } = useAppSelector((state) => state.auth);
  const isAdmin = user?.role?.code === "ADMIN" || user?.role?.code === "CEO";

  const [items, setItems] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [deleteTarget, setDeleteTarget] = useState<Branch | null>(null);
  const [deleting, setDeleting] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const data = await fetchBranches();
      setItems(data);
    } catch {
      toast.error("Không thể tải danh sách chi nhánh.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    setPage(1);
  }, [search]);

  const toggleStatus = async (branch: Branch) => {
    if (!branch.id) return;
    try {
      if (branch.status === "inactive") {
        await activateBranch(branch.id);
        toast.success(`Đã kích hoạt chi nhánh "${branch.name}".`);
      } else {
        await deactivateBranch(branch.id);
        toast.success(`Đã vô hiệu hóa chi nhánh "${branch.name}".`);
      }
      await load();
    } catch {
      toast.error("Cập nhật trạng thái chi nhánh thất bại.");
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget?.id) return;
    setDeleting(true);
    try {
      await deleteBranch(deleteTarget.id);
      toast.success(`Đã xóa chi nhánh "${deleteTarget.name}".`);
      setDeleteTarget(null);
      await load();
    } catch {
      toast.error("Xóa chi nhánh thất bại.");
    } finally {
      setDeleting(false);
    }
  };

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return items;
    return items.filter((branch) =>
      [
        branch.name,
        branch.code,
        branch.address,
        branch.province,
        branch.district,
        branch.ward,
        branch.tax_code,
        branch.bank_account,
        branch.bank_name,
      ].some((value) => value?.toLowerCase().includes(term))
    );
  }, [items, search]);

  const totalItems = filtered.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const startIndex = (currentPage - 1) * PAGE_SIZE;
  const pageItems = filtered.slice(startIndex, startIndex + PAGE_SIZE);

  const goToPage = (nextPage: number) => {
    if (nextPage < 1 || nextPage > totalPages) return;
    setPage(nextPage);
  };

  const statusLabel = (status?: string) => (status === "inactive" ? "Ngừng hoạt động" : "Hoạt động");

  return (
    <div className="page-container">
      <div className="erp-card overflow-hidden">
        <div className="flex flex-col gap-3 px-5 py-4 border-b border-gray-200 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-2.5">
            <span className="w-8 h-8 bg-orange-50 rounded-lg flex items-center justify-center">
              <Building2 className="w-4 h-4 text-orange-500" />
            </span>
            <div>
              <h1 className="text-base font-semibold text-gray-900">Chi nhánh</h1>
              <p className="text-xs text-gray-400 mt-0.5">Quản lý chi nhánh, địa chỉ, mã số thuế và thông tin ngân hàng</p>
            </div>
            <span className="ml-1 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-orange-50 text-orange-600">
              {filtered.length}
            </span>
          </div>

          {isAdmin && (
            <button
              onClick={() => nav("/company/branches/create")}
              className="inline-flex items-center gap-1.5 h-8 px-3 text-sm font-medium text-white bg-orange-500 rounded-md hover:bg-orange-600 transition-colors shadow-sm"
            >
              <Plus className="w-3.5 h-3.5" />
              Thêm chi nhánh
            </button>
          )}
        </div>

        <div className="px-5 py-3 border-b border-gray-100 bg-gray-50/50">
          <div className="relative max-w-sm">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Tìm mã, tên, địa chỉ, ngân hàng..."
              className="w-full h-8 pl-8 pr-3 text-sm border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 placeholder:text-gray-400"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[76rem] text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50/80">
                {["Mã", "Tên chi nhánh", "Địa chỉ", "Tỉnh/TP", "Quận/Huyện", "Phường/Xã", "Mã số thuế", "Tài khoản", "Ngân hàng", "Trạng thái", ""].map((header) => (
                  <th key={header} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider first:pl-5 last:pr-5">
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td className="py-14 text-center" colSpan={11}>
                    <div className="flex items-center justify-center gap-3 text-gray-400">
                      <Loader2 className="w-5 h-5 animate-spin text-orange-500" />
                      <span>Đang tải danh sách chi nhánh...</span>
                    </div>
                  </td>
                </tr>
              ) : totalItems === 0 ? (
                <tr>
                  <td className="py-14 text-center" colSpan={11}>
                    <div className="flex flex-col items-center gap-2 text-gray-400">
                      <Inbox className="w-8 h-8" />
                      <p>Không tìm thấy chi nhánh.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                pageItems.map((branch) => (
                  <tr key={branch.id} className="hover:bg-orange-50/30 transition-colors">
                    <td className="px-5 py-3 font-semibold text-orange-600">{branch.code}</td>
                    <td className="px-4 py-3 font-medium text-gray-900">{branch.name}</td>
                    <td className="px-4 py-3 text-gray-600">{branch.address || "-"}</td>
                    <td className="px-4 py-3 text-gray-600">{branch.province || "-"}</td>
                    <td className="px-4 py-3 text-gray-600">{branch.district || "-"}</td>
                    <td className="px-4 py-3 text-gray-600">{branch.ward || "-"}</td>
                    <td className="px-4 py-3 text-gray-600">{branch.tax_code || "-"}</td>
                    <td className="px-4 py-3 text-gray-600">{branch.bank_account || "-"}</td>
                    <td className="px-4 py-3 text-gray-600">{branch.bank_name || "-"}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                          branch.status === "inactive"
                            ? "bg-gray-100 text-gray-700"
                            : "bg-emerald-50 text-emerald-700"
                        }`}
                      >
                        {statusLabel(branch.status)}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <Link
                          to={`/company/branches/${branch.id}`}
                          className="inline-flex h-8 w-8 items-center justify-center rounded-md text-gray-500 hover:bg-orange-50 hover:text-orange-600 transition-colors"
                          title={isAdmin ? "Sửa chi nhánh" : "Xem chi nhánh"}
                        >
                          {isAdmin ? <Pencil className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </Link>

                        {isAdmin && (
                          <button
                            onClick={() => toggleStatus(branch)}
                            className={`inline-flex h-8 w-8 items-center justify-center rounded-md transition-colors ${
                              branch.status === "inactive"
                                ? "text-emerald-600 hover:bg-emerald-50"
                                : "text-gray-500 hover:bg-gray-100"
                            }`}
                            title={branch.status === "inactive" ? "Kích hoạt" : "Vô hiệu hóa"}
                          >
                            {branch.status === "inactive" ? <CheckCircle className="w-4 h-4" /> : <Power className="w-4 h-4" />}
                          </button>
                        )}

                        {isAdmin && (
                          <button
                            onClick={() => setDeleteTarget(branch)}
                            className="inline-flex h-8 w-8 items-center justify-center rounded-md text-red-600 hover:bg-red-50 transition-colors"
                            title="Xóa chi nhánh"
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
        </div>

        {!loading && totalItems > 0 && (
          <div className="flex items-center justify-between px-5 py-3 border-t border-gray-100 bg-gray-50/50">
            <p className="text-xs text-gray-500">
              Hiển thị{" "}
              <span className="font-semibold text-gray-700">
                {startIndex + 1}-{Math.min(startIndex + PAGE_SIZE, totalItems)}
              </span>{" "}
              / <span className="font-semibold text-gray-700">{totalItems}</span>
            </p>

            <div className="flex items-center gap-1">
              <button
                onClick={() => goToPage(currentPage - 1)}
                disabled={currentPage === 1}
                className="h-7 px-3 text-xs font-medium border border-gray-300 rounded-md text-gray-600 hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft className="inline w-3 h-3 mr-1" />
                Trước
              </button>
              <span className="h-7 px-3 text-xs font-semibold flex items-center bg-orange-500 text-white rounded-md">
                {currentPage} / {totalPages}
              </span>
              <button
                onClick={() => goToPage(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="h-7 px-3 text-xs font-medium border border-gray-300 rounded-md text-gray-600 hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                Sau
                <ChevronRight className="inline w-3 h-3 ml-1" />
              </button>
            </div>
          </div>
        )}
      </div>

      <ActionConfirmModal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
        title="Xóa chi nhánh"
        description={
          <span>
            Bạn có chắc muốn xóa chi nhánh <strong>{deleteTarget?.name}</strong>? Hành động này không thể hoàn tác.
          </span>
        }
        confirmText="Xóa"
        cancelText="Hủy"
        variant="danger"
        loading={deleting}
      />
    </div>
  );
}
