import React, { useEffect, useState } from "react";
import { Plus, Edit2, Trash2, Search, Clock, AlertCircle, ChevronLeft, ChevronRight } from "lucide-react";
import {
  GlAccountDTO,
  GlAccountFilter,
} from "../dto/glAccount.dto";
import {
  fetchGlAccounts,
  createGlAccount,
  updateGlAccount,
  deleteGlAccount,
} from "../service/glAccount.service";
import GlAccountFormModal from "../components/GlAccountFormModal";

const GlAccountPage: React.FC = () => {
  const [data, setData] = useState<GlAccountDTO[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<GlAccountDTO | null>(null);
  const [saving, setSaving] = useState(false);

  // Pagination
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const loadData = async (filter?: GlAccountFilter) => {
    try {
      setLoading(true);
      const rows = await fetchGlAccounts(filter);
      setData(rows);
    } catch (e: any) {
      console.error(e);
      alert(e.message || "Lỗi tải danh sách tài khoản");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Reset về trang 1 khi search hoặc filter thay đổi
  useEffect(() => {
    setPage(1);
  }, [search, typeFilter]);

  const handleCreate = () => {
    setEditing(null);
    setModalOpen(true);
  };

  const handleEdit = (row: GlAccountDTO) => {
    setEditing(row);
    setModalOpen(true);
  };

  const handleDelete = async (row: GlAccountDTO) => {
    if (!row.id) return;
    if (!window.confirm(`Bạn có chắc chắn muốn xóa tài khoản "${row.code} - ${row.name}"?`)) return;
    try {
      setLoading(true);
      await deleteGlAccount(row.id);
      await loadData({ search });
    } catch (e: any) {
      console.error(e);
      alert(e.message || "Không thể xóa tài khoản");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitForm = async (formData: GlAccountDTO) => {
    try {
      setSaving(true);
      if (editing && editing.id) {
        await updateGlAccount(editing.id, formData);
      } else {
        await createGlAccount(formData);
      }
      setModalOpen(false);
      await loadData({ search });
    } catch (e: any) {
      console.error(e);
      alert(e.message || "Lưu tài khoản thất bại");
    } finally {
      setSaving(false);
    }
  };

  // Lọc dữ liệu theo search và type
  const filteredList = data.filter((item) => {
    const searchLower = search.toLowerCase();
    const matchSearch =
      item.code?.toLowerCase().includes(searchLower) ||
      item.name?.toLowerCase().includes(searchLower);

    const matchType = !typeFilter || item.type === typeFilter;

    return matchSearch && matchType;
  });

  // Lấy danh sách type unique từ data
  const typeOptions = Array.from(
    new Set(data.map((item) => item.type).filter(Boolean))
  );

  // Tính toán phân trang
  const totalItems = filteredList.length;
  const totalPages = totalItems ? Math.ceil(totalItems / pageSize) : 1;
  const currentPage = Math.min(page, totalPages);
  const startIndex = (currentPage - 1) * pageSize;
  const pageItems = filteredList.slice(startIndex, startIndex + pageSize);

  const goToPage = (p: number) => {
    if (p < 1 || p > totalPages) return;
    setPage(p);
  };

  const getPageNumbers = () => {
    const pages = [];
    const maxVisible = 7;

    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      pages.push(1);

      let start = Math.max(2, currentPage - 2);
      let end = Math.min(totalPages - 1, currentPage + 2);

      if (currentPage <= 3) {
        end = 5;
      } else if (currentPage >= totalPages - 2) {
        start = totalPages - 4;
      }

      if (start > 2) {
        pages.push(-1);
      }

      for (let i = start; i <= end; i++) {
        pages.push(i);
      }

      if (end < totalPages - 1) {
        pages.push(-2);
      }

      pages.push(totalPages);
    }

    return pages;
  };

  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      asset: "Tài sản",
      liability: "Nợ phải trả",
      equity: "Vốn chủ sở hữu",
      revenue: "Doanh thu",
      expense: "Chi phí",
    };
    return labels[type] || type;
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      {/* Header Section */}
      <div className="mb-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <div className="bg-gradient-to-br from-orange-500 to-orange-600 p-2.5 rounded-xl shadow-lg">
                <Clock className="w-7 h-7 text-white" />
              </div>
              Hệ thống tài khoản
            </h1>
            <p className="text-gray-500 mt-2 text-sm">
              Tổng số: <span className="font-semibold text-gray-700">{totalItems}</span> tài khoản
            </p>
          </div>

          <button
            onClick={handleCreate}
            className="bg-gradient-to-r from-orange-500 to-orange-600 text-white px-5 py-2.5 flex items-center gap-2 rounded-xl shadow-lg shadow-orange-500/30 hover:shadow-xl hover:shadow-orange-500/40 hover:from-orange-600 hover:to-orange-700 transition-all duration-200 font-medium"
          >
            <Plus className="w-5 h-5" />
            Thêm tài khoản
          </button>
        </div>
      </div>

      {/* Search Bar and Filters */}
      <div className="mb-6 flex flex-col sm:flex-row gap-4">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            placeholder="Tìm kiếm theo mã hoặc tên tài khoản..."
            className="w-full border border-gray-200 rounded-xl pl-12 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent shadow-sm hover:border-gray-300 transition-all duration-200"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* Type Filter */}
        <div className="relative min-w-[200px]">
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent shadow-sm hover:border-gray-300 transition-all duration-200 bg-white appearance-none cursor-pointer"
          >
            <option value="">Tất cả loại tài khoản</option>
            {typeOptions.map((type) => (
              <option key={type} value={type}>
                {getTypeLabel(type)}
              </option>
            ))}
          </select>
          <ChevronRight className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 rotate-90 pointer-events-none" />
        </div>
      </div>

      {/* Table Card */}
      <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gradient-to-r from-gray-50 to-gray-100/50 border-b border-gray-200">
                <th className="px-4 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Mã TK
                </th>
                <th className="px-4 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Tên tài khoản
                </th>
                <th className="px-4 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Loại
                </th>
                <th className="px-4 py-4 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Bên bình thường
                </th>
                <th className="px-4 py-4 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Thao tác
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-16">
                    <div className="flex flex-col items-center justify-center">
                      <div className="relative">
                        <div className="w-12 h-12 border-4 border-gray-200 border-t-orange-500 rounded-full animate-spin"></div>
                      </div>
                      <p className="mt-4 text-gray-500 text-sm">Đang tải dữ liệu...</p>
                    </div>
                  </td>
                </tr>
              ) : totalItems === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-16">
                    <div className="flex flex-col items-center justify-center">
                      <div className="bg-gray-100 rounded-full p-4 mb-4">
                        <AlertCircle className="w-8 h-8 text-gray-400" />
                      </div>
                      <p className="text-gray-500 text-sm font-medium">
                        {search || typeFilter ? "Không tìm thấy kết quả phù hợp" : "Chưa có tài khoản"}
                      </p>
                      <p className="text-gray-400 text-xs mt-1">
                        {search || typeFilter
                          ? "Thử tìm kiếm với từ khóa khác"
                          : "Nhấn nút 'Thêm tài khoản' để tạo mới"}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                pageItems.map((row) => (
                  <tr
                    key={row.id}
                    className="hover:bg-orange-50/50 transition-colors duration-150 group"
                  >
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center px-2 py-1 rounded-lg bg-gray-100 text-gray-700 font-mono text-xs font-semibold">
                        {row.code}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-medium text-gray-900">{row.name}</td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-blue-100 text-blue-700 text-xs font-semibold">
                        {getTypeLabel(row.type)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span
                        className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold ${
                          row.normal_side === "debit"
                            ? "bg-green-100 text-green-700"
                            : "bg-purple-100 text-purple-700"
                        }`}
                      >
                        {row.normal_side === "debit" ? "Nợ" : "Có"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                        <button
                          className="p-2 border border-gray-200 rounded-lg text-emerald-600 hover:bg-emerald-50 hover:border-emerald-200 transition-all duration-200 shadow-sm hover:shadow"
                          onClick={() => handleEdit(row)}
                          title="Chỉnh sửa"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>

                        <button
                          className="p-2 border border-gray-200 rounded-lg text-red-600 hover:bg-red-50 hover:border-red-200 transition-all duration-200 shadow-sm hover:shadow"
                          onClick={() => handleDelete(row)}
                          title="Xóa"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
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
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-6 py-4 border-t bg-gradient-to-r from-gray-50 to-white">
            <div className="text-sm text-gray-600">
              Hiển thị{" "}
              <span className="font-semibold text-gray-900">
                {startIndex + 1} - {Math.min(startIndex + pageSize, totalItems)}
              </span>{" "}
              trong tổng số{" "}
              <span className="font-semibold text-gray-900">{totalItems}</span> tài khoản
            </div>

            <div className="flex items-center gap-2">
              {/* Previous Button */}
              <button
                onClick={() => goToPage(currentPage - 1)}
                disabled={currentPage === 1}
                className="flex items-center gap-1 px-3 py-2 rounded-lg border border-gray-200 text-sm font-medium disabled:opacity-40 disabled:cursor-not-allowed hover:bg-white hover:shadow-sm transition-all duration-200 bg-gray-50"
              >
                <ChevronLeft className="w-4 h-4" />
                <span className="hidden sm:inline">Trước</span>
              </button>

              {/* Page Numbers */}
              <div className="flex items-center gap-1">
                {getPageNumbers().map((pNum, idx) => {
                  if (pNum < 0) {
                    return (
                      <span key={`ellipsis-${idx}`} className="px-2 text-gray-400">
                        ...
                      </span>
                    );
                  }

                  return (
                    <button
                      key={pNum}
                      onClick={() => goToPage(pNum)}
                      className={`min-w-[36px] h-9 px-3 rounded-lg text-sm font-medium transition-all duration-200 ${
                        pNum === currentPage
                          ? "bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-lg shadow-orange-500/30"
                          : "bg-white text-gray-700 border border-gray-200 hover:border-orange-300 hover:bg-orange-50"
                      }`}
                    >
                      {pNum}
                    </button>
                  );
                })}
              </div>

              {/* Next Button */}
              <button
                onClick={() => goToPage(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="flex items-center gap-1 px-3 py-2 rounded-lg border border-gray-200 text-sm font-medium disabled:opacity-40 disabled:cursor-not-allowed hover:bg-white hover:shadow-sm transition-all duration-200 bg-gray-50"
              >
                <span className="hidden sm:inline">Sau</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      <GlAccountFormModal
        open={modalOpen}
        initialValue={editing}
        loading={saving}
        onCancel={() => setModalOpen(false)}
        onSubmit={handleSubmitForm}
      />
    </div>
  );
};

export default GlAccountPage;