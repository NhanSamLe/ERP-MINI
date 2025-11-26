import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "../../../store/store";

import {
  loadPositions,
  addPosition,
  editPosition,
  removePosition,
} from "../store/position/position.thunks";


import PositionFormModal from "../components/PositionFormModal";
import { Position } from "../store/position/position.type";
import type { PositionDTO } from "../dto/position.dto";

import {
  Plus,
  Pencil,
  Trash2,
  Search,
  Building2,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

export default function PositionPage() {
  const dispatch = useDispatch<AppDispatch>();
  // 👇 nhớ key slice là hrmPosition (đăng ký trong root reducer)
  const { items, loading } = useSelector((s: RootState) => s.position);

  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Position | null>(null);

  // ====== Phân trang ======
  const [page, setPage] = useState(1);
  const pageSize = 10; // 10 chức danh mỗi trang

  useEffect(() => {
    dispatch(loadPositions({ search }));
  }, [dispatch, search]);

  // Reset về trang 1 khi search thay đổi
  useEffect(() => {
    setPage(1);
  }, [search]);

  const submitForm = async (data: PositionDTO) => {
  try {
    if (typeof data.id === "number") {
      await dispatch(editPosition({ id: data.id, data })).unwrap();
    } else {
      await dispatch(addPosition(data)).unwrap();
    }

    setModalOpen(false);
    setEditing(null);
  } catch (error: any) {
    // error bây giờ là string do rejectWithValue trả về
    const msg = typeof error === "string"
      ? error
      : error?.message || "Có lỗi xảy ra khi lưu chức danh";
    alert(msg); // 👈 sẽ hiện "Chức danh này đã tồn tại trong chi nhánh này"
  }
};

const doDelete = async (id: number) => {
  if (!confirm("Bạn có chắc chắn muốn xóa chức danh này?")) {
    return;
  }

  try {
    await dispatch(removePosition(id)).unwrap();
    alert("Đã xóa chức danh thành công!");
  } catch (error: any) {
    // error giờ là string do rejectWithValue trả về
    const msg =
      typeof error === "string"
        ? error
        : error?.message || "Có lỗi xảy ra khi xóa chức danh";
    alert(msg);
  }
};



  // ====== Tính toán phân trang ======
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
    const pages: number[] = [];
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
        pages.push(-1); // ...
      }

      for (let i = start; i <= end; i++) {
        pages.push(i);
      }

      if (end < totalPages - 1) {
        pages.push(-2); // ...
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
              Quản lý chức danh
            </h1>
            <p className="text-gray-500 mt-2 text-sm">
              Tổng số:{" "}
              <span className="font-semibold text-gray-700">
                {totalItems}
              </span>{" "}
              chức danh
            </p>
          </div>

          <button
            className="bg-gradient-to-r from-orange-500 to-orange-600 text-white px-5 py-2.5 flex items-center gap-2 rounded-xl shadow-lg shadow-orange-500/30 hover:shadow-xl hover:shadow-orange-500/40 hover:from-orange-600 hover:to-orange-700 transition-all duration-200 font-medium"
            onClick={() => {
              setEditing(null);
              setModalOpen(true);
            }}
          >
            <Plus className="w-5 h-5" />
            Thêm chức danh
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="mb-6">
        <div className="relative max-w-md">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            placeholder="Tìm kiếm theo tên chức danh..."
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
                  ID
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Tên chức danh
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Chi nhánh
                </th>
                <th className="px-6 py-4 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Thao tác
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan={4} className="px-6 py-16">
                    <div className="flex flex-col items-center justify-center">
                      <div className="relative">
                        <div className="w-12 h-12 border-4 border-gray-200 border-t-orange-500 rounded-full animate-spin"></div>
                      </div>
                      <p className="mt-4 text-gray-500 text-sm">
                        Đang tải dữ liệu...
                      </p>
                    </div>
                  </td>
                </tr>
              ) : totalItems === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-16">
                    <div className="flex flex-col items-center justify-center">
                      <div className="bg-gray-100 rounded-full p-4 mb-4">
                        <AlertCircle className="w-8 h-8 text-gray-400" />
                      </div>
                      <p className="text-gray-500 text-sm font-medium">
                        {search
                          ? "Không tìm thấy kết quả phù hợp"
                          : "Chưa có chức danh nào"}
                      </p>
                      <p className="text-gray-400 text-xs mt-1">
                        {search
                          ? "Thử tìm kiếm với từ khóa khác"
                          : "Nhấn nút 'Thêm chức danh' để tạo mới"}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                pageItems.map((p: Position) => (
                  <tr
                    key={p.id}
                    className="hover:bg-orange-50/50 transition-colors duration-150 group"
                  >
                    <td className="px-6 py-4">
                      <span className="font-mono text-sm text-gray-800">
                        {p.id}
                      </span>
                    </td>

                    <td className="px-6 py-4">
                      <span className="font-medium text-gray-900">
                        {p.name}
                      </span>
                    </td>

                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-gray-600">
                        <Building2 className="w-4 h-4 text-gray-400" />
                        {/* hiện branch_id giống DepartmentPage hiện tại */}
                        <span className="text-sm">{p.branch_id}</span>
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      <div className="flex justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                        <button
                          className="p-2 border border-gray-200 rounded-lg text-emerald-600 hover:bg-emerald-50 hover:border-emerald-200 transition-all duration-200 shadow-sm hover:shadow"
                          onClick={() => {
                            setEditing(p);
                            setModalOpen(true);
                          }}
                          title="Chỉnh sửa"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>

                        <button
                          className="p-2 border border-gray-200 rounded-lg text-red-600 hover:bg-red-50 hover:border-red-200 transition-all duration-200 shadow-sm hover:shadow"
                          onClick={() => p.id && doDelete(p.id)}
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
                {startIndex + 1} -{" "}
                {Math.min(startIndex + pageSize, totalItems)}
              </span>{" "}
              trong tổng số{" "}
              <span className="font-semibold text-gray-900">
                {totalItems}
              </span>{" "}
              chức danh
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
                      <span
                        key={`ellipsis-${idx}`}
                        className="px-2 text-gray-400"
                      >
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

      <PositionFormModal
        open={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setEditing(null);
        }}
        onSubmit={submitForm}
        defaultValue={editing}
      />
    </div>
  );
}
