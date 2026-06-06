import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { 
  Plus, 
  Pencil, 
  Search, 
  Building2, 
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Trash2,
  CheckCircle,
  XCircle,
  X
} from "lucide-react";
import { costCenterApi, CostCenterDTO } from "../api/costCenter.api";
import { Branch, fetchBranches } from "../../company/branch.service";

export default function CostCenterPage() {
  const [items, setItems] = useState<CostCenterDTO[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [branches, setBranches] = useState<Branch[]>([]);
  
  // Modal states
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<CostCenterDTO | null>(null);
  const [form, setForm] = useState<{
    id?: number;
    branch_id?: number;
    code: string;
    name: string;
    status: "active" | "inactive";
  }>({
    code: "",
    name: "",
    status: "active"
  });

  // Pagination states
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const loadData = async () => {
    try {
      setLoading(true);
      const data = await costCenterApi.getAll({ search });
      setItems(data);
    } catch (error: any) {
      toast.error("Không thể tải danh sách trung tâm chi phí");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [search]);

  useEffect(() => {
    (async () => {
      try {
        const data = await fetchBranches();
        setBranches(data);
      } catch (err) {
        console.error("Lỗi tải chi nhánh:", err);
      }
    })();
  }, []);

  useEffect(() => {
    setPage(1);
  }, [search]);

  const handleOpenCreate = () => {
    setEditingItem(null);
    setForm({
      id: undefined,
      branch_id: branches[0]?.id,
      code: "",
      name: "",
      status: "active"
    });
    setModalOpen(true);
  };

  const handleOpenEdit = (item: CostCenterDTO) => {
    setEditingItem(item);
    setForm({
      id: item.id,
      branch_id: item.branch_id,
      code: item.code,
      name: item.name,
      status: item.status
    });
    setModalOpen(true);
  };

  const handleSave = async () => {
    if (!form.branch_id) {
      toast.error("Vui lòng chọn chi nhánh");
      return;
    }
    if (!form.code.trim()) {
      toast.error("Vui lòng nhập mã trung tâm chi phí");
      return;
    }
    if (!form.name.trim()) {
      toast.error("Vui lòng nhập tên trung tâm chi phí");
      return;
    }

    try {
      if (form.id) {
        await costCenterApi.update(form.id, {
          branch_id: form.branch_id,
          code: form.code.trim().toUpperCase(),
          name: form.name.trim(),
          status: form.status
        });
        toast.success("Cập nhật trung tâm chi phí thành công");
      } else {
        await costCenterApi.create({
          branch_id: form.branch_id,
          code: form.code.trim().toUpperCase(),
          name: form.name.trim(),
          status: form.status
        });
        toast.success("Tạo trung tâm chi phí thành công");
      }
      setModalOpen(false);
      loadData();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Đã xảy ra lỗi khi lưu trung tâm chi phí");
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa trung tâm chi phí này?")) return;
    try {
      await costCenterApi.remove(id);
      toast.success("Xóa trung tâm chi phí thành công");
      loadData();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Không thể xóa trung tâm chi phí này vì có dữ liệu liên kết");
    }
  };

  // ====== Pagination calculations ======
  const totalItems = items.length;
  const totalPages = totalItems ? Math.ceil(totalItems / pageSize) : 1;
  const currentPage = Math.min(page, totalPages);
  const startIndex = (currentPage - 1) * pageSize;
  const pageItems = items.slice(startIndex, startIndex + pageSize);

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

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      {/* Header Section */}
      <div className="mb-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <div className="bg-gradient-to-br from-orange-500 to-orange-600 p-2.5 rounded-xl shadow-lg">
                <Building2 className="w-7 h-7 text-white" />
              </div>
              Trung tâm chi phí
            </h1>
            <p className="text-gray-500 mt-2 text-sm">
              Tổng cộng: <span className="font-semibold text-gray-700">{totalItems}</span> trung tâm chi phí
            </p>
          </div>

          <button
            className="bg-gradient-to-r from-orange-500 to-orange-600 text-white px-5 py-2.5 flex items-center gap-2 rounded-xl shadow-lg shadow-orange-500/30 hover:shadow-xl hover:shadow-orange-500/40 hover:from-orange-600 hover:to-orange-700 transition-all duration-200 font-medium"
            onClick={handleOpenCreate}
          >
            <Plus className="w-5 h-5" />
            Thêm trung tâm chi phí
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="mb-6">
        <div className="relative max-w-md">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            placeholder="Tìm theo mã hoặc tên trung tâm..."
            className="w-full border border-gray-200 rounded-xl pl-12 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent shadow-sm hover:border-gray-300 transition-all duration-200"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Table Card */}
      <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gradient-to-r from-gray-50 to-gray-100/50 border-b border-gray-200">
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Mã trung tâm
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Tên trung tâm
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Chi nhánh
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Trạng thái
                </th>
                <th className="px-6 py-4 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">
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
                        {search ? "Không tìm thấy kết quả phù hợp" : "Không có trung tâm chi phí nào"}
                      </p>
                      <p className="text-gray-400 text-xs mt-1">
                        {search
                          ? "Hãy thử tìm kiếm với từ khóa khác"
                          : "Bấm 'Thêm trung tâm chi phí' để tạo mới"}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                pageItems.map((cc: CostCenterDTO) => {
                  const brName = branches.find(b => b.id === cc.branch_id)?.name || `Chi nhánh #${cc.branch_id}`;
                  return (
                    <tr
                      key={cc.id}
                      className="hover:bg-orange-50/50 transition-colors duration-150 group"
                    >
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-orange-100 text-orange-700 font-mono text-xs font-semibold">
                          {cc.code}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-medium text-gray-900">{cc.name}</span>
                      </td>
                      <td className="px-6 py-4 text-gray-600">
                        {brName}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${
                            cc.status === "active"
                              ? "bg-green-50 text-green-700 border border-green-200"
                              : "bg-red-50 text-red-700 border border-red-200"
                          }`}
                        >
                          {cc.status === "active" ? (
                            <>
                              <CheckCircle className="w-3.5 h-3.5 text-green-600" /> Hoạt động
                            </>
                          ) : (
                            <>
                              <XCircle className="w-3.5 h-3.5 text-red-600" /> Tạm dừng
                            </>
                          )}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex justify-center gap-2">
                          <button
                            className="p-2 border border-gray-200 rounded-lg text-emerald-600 hover:bg-emerald-50 hover:border-emerald-200 transition-all duration-200 shadow-sm"
                            onClick={() => handleOpenEdit(cc)}
                            title="Sửa"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            className="p-2 border border-gray-200 rounded-lg text-red-600 hover:bg-red-50 hover:border-red-200 transition-all duration-200 shadow-sm"
                            onClick={() => cc.id && handleDelete(cc.id)}
                            title="Xóa"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
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
              trên{" "}
              <span className="font-semibold text-gray-900">{totalItems}</span> trung tâm
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => goToPage(currentPage - 1)}
                disabled={currentPage === 1}
                className="flex items-center gap-1 px-3 py-2 rounded-lg border border-gray-200 text-sm font-medium disabled:opacity-40 disabled:cursor-not-allowed hover:bg-white hover:shadow-sm transition-all duration-200 bg-gray-50"
              >
                <ChevronLeft className="w-4 h-4" />
                <span className="hidden sm:inline">Trước</span>
              </button>

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

      {/* Form Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg transform animate-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-orange-50 to-white rounded-t-2xl">
              <div>
                <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-orange-500" />
                  {editingItem ? "Chỉnh sửa trung tâm chi phí" : "Tạo trung tâm chi phí mới"}
                </h2>
                <p className="text-sm text-gray-500 mt-1">
                  Quản lý mã hạch toán và phân bổ chi phí lương
                </p>
              </div>
              <button
                onClick={() => setModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg p-2 transition-all duration-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body */}
            <div className="px-6 py-6 space-y-5">
              {/* Branch */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Chi nhánh <span className="text-red-500">*</span>
                </label>
                <select
                  className="w-full border border-gray-200 px-4 py-2.5 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 bg-white"
                  value={form.branch_id ?? ""}
                  onChange={(e) => setForm({ ...form, branch_id: Number(e.target.value) })}
                >
                  <option value="">-- Chọn chi nhánh --</option>
                  {branches.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.code} — {b.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Code */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Mã trung tâm chi phí <span className="text-red-500">*</span>
                </label>
                <input
                  className="w-full border border-gray-200 px-4 py-2.5 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                  placeholder="Ví dụ: CC_HR, CC_IT, CC_SALES..."
                  value={form.code}
                  onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
                  maxLength={50}
                />
              </div>

              {/* Name */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Tên trung tâm chi phí <span className="text-red-500">*</span>
                </label>
                <input
                  className="w-full border border-gray-200 px-4 py-2.5 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                  placeholder="Ví dụ: Phòng Nhân Sự, Trung Tâm IT, Phòng Kinh Doanh..."
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  maxLength={100}
                />
              </div>

              {/* Status */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Trạng thái
                </label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer text-sm">
                    <input
                      type="radio"
                      name="status"
                      value="active"
                      checked={form.status === "active"}
                      onChange={() => setForm({ ...form, status: "active" })}
                      className="text-orange-500 focus:ring-orange-400"
                    />
                    Hoạt động
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer text-sm">
                    <input
                      type="radio"
                      name="status"
                      value="inactive"
                      checked={form.status === "inactive"}
                      onChange={() => setForm({ ...form, status: "inactive" })}
                      className="text-orange-500 focus:ring-orange-400"
                    />
                    Tạm dừng
                  </label>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-3 bg-gray-50 rounded-b-2xl">
              <button
                className="px-5 py-2.5 text-sm font-medium border border-gray-300 rounded-xl hover:bg-white text-gray-700"
                onClick={() => setModalOpen(false)}
              >
                Hủy
              </button>
              <button
                className="px-5 py-2.5 text-sm font-medium rounded-xl bg-gradient-to-r from-orange-500 to-orange-600 text-white hover:from-orange-600 hover:to-orange-700 shadow-lg shadow-orange-500/30 transition-all duration-200"
                onClick={handleSave}
              >
                Lưu lại
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
