import { FC, useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "../../../store/store";
import { loadPartners, deletePartnerThunk } from "../store/partner.thunks";
import { PartnerType, Partner } from "../store/partner.types";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Pencil, Trash2, Plus, ChevronLeft, ChevronRight, Search, Filter, Users, X } from "lucide-react";

const PartnerList: FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();

  const { items, loading } = useSelector((s: RootState) => s.partners);

  const data: Partner[] =
    Array.isArray(items)
      ? (items as Partner[])
      : Array.isArray((items as any)?.data)
      ? ((items as any).data as Partner[])
      : [];

  const [search, setSearch] = useState("");
  const [type, setType] = useState<PartnerType | "">("");
  const [page, setPage] = useState(1);
  const pageSize = 10;
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const t = searchParams.get("type") as PartnerType | null;
    if (t === "customer" || t === "supplier" || t === "internal") {
      setType(t);
    } else {
      setType("");
    }
  }, [searchParams]);

  useEffect(() => {
    dispatch(
      loadPartners({
        search: search || undefined,
        type: (type || undefined) as PartnerType | undefined,
      })
    );
  }, [dispatch, search, type]);

  useEffect(() => {
    setPage(1);
  }, [search, type]);

  const handleDelete = (id: number) => {
    if (window.confirm("Bạn có chắc chắn muốn xóa đối tác này?")) {
      dispatch(deletePartnerThunk(id));
    }
  };

  const totalItems = data.length;
  const totalPages = totalItems ? Math.ceil(totalItems / pageSize) : 1;
  const currentPage = Math.min(page, totalPages);
  const startIndex = (currentPage - 1) * pageSize;
  const pageItems = data.slice(startIndex, startIndex + pageSize);

  const goToPage = (p: number) => {
    if (p < 1 || p > totalPages) return;
    setPage(p);
  };

  const clearFilters = () => {
    setSearch("");
    setType("");
  };

  const activeFiltersCount = [search, type].filter(Boolean).length;

  const getTypeColor = (type: PartnerType) => {
    switch (type) {
      case "customer":
        return "bg-blue-100 text-blue-700 border-blue-200";
      case "supplier":
        return "bg-purple-100 text-purple-700 border-purple-200";
      case "internal":
        return "bg-gray-100 text-gray-700 border-gray-200";
      default:
        return "bg-gray-100 text-gray-700 border-gray-200";
    }
  };

  const getTypeLabel = (type: PartnerType) => {
    switch (type) {
      case "customer":
        return "Khách hàng";
      case "supplier":
        return "Nhà cung cấp";
      case "internal":
        return "Nội bộ";
      default:
        return type;
    }
  };

  return (
    <div className="space-y-6 p-6 bg-gray-50 min-h-screen">
      {/* Header Section */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-orange-100 rounded-lg">
              <Users className="w-6 h-6 text-orange-600" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-800">Quản lý đối tác</h2>
              <p className="text-sm text-gray-500 mt-1">
                Tổng số: <span className="font-semibold text-gray-700">{totalItems}</span> đối tác
              </p>
            </div>
          </div>

          <button
            onClick={() => navigate("/partners/create")}
            className="flex items-center gap-2 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white px-5 py-2.5 rounded-lg shadow-md hover:shadow-lg transition-all duration-200 font-medium"
          >
            <Plus className="w-5 h-5" />
            Thêm đối tác mới
          </button>
        </div>
      </div>

      {/* Filters Section */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-gray-600" />
            <h3 className="font-semibold text-gray-800">Bộ lọc & Tìm kiếm</h3>
            {activeFiltersCount > 0 && (
              <span className="px-2 py-0.5 bg-orange-100 text-orange-700 text-xs font-medium rounded-full">
                {activeFiltersCount}
              </span>
            )}
          </div>
          {activeFiltersCount > 0 && (
            <button
              onClick={clearFilters}
              className="text-sm text-gray-600 hover:text-gray-800 flex items-center gap-1"
            >
              <X className="w-4 h-4" />
              Xóa bộ lọc
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Search Input */}
          <div className="md:col-span-2 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Tìm kiếm theo tên, email, số điện thoại, mã số thuế..."
              className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {/* Type Filter */}
          <select
            className="px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
            value={type}
            onChange={(e) => setType(e.target.value as PartnerType | "")}
          >
            <option value="">Tất cả loại đối tác</option>
            <option value="customer">Khách hàng</option>
            <option value="supplier">Nhà cung cấp</option>
            <option value="internal">Nội bộ</option>
          </select>
        </div>
      </div>

      {/* Table Section */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      ID
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Thông tin đối tác
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Loại
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Liên hệ
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Trạng thái
                    </th>
                    <th className="px-6 py-4 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Thao tác
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-gray-200">
                  {pageItems.map((p: Partner) => (
                    <tr
                      key={p.id}
                      className="hover:bg-gray-50 transition-colors duration-150"
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm font-medium text-gray-900">
                          #{p.id}
                        </span>
                      </td>

                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-1">
                          <span className="font-semibold text-gray-900">
                            {p.name}
                          </span>
                          {p.tax_code && (
                            <span className="text-xs text-gray-500">
                              MST: {p.tax_code}
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${getTypeColor(
                            p.type
                          )}`}
                        >
                          {getTypeLabel(p.type)}
                        </span>
                      </td>

                      <td className="px-6 py-4">
                        <div className="space-y-1 text-sm">
                          {p.contact_person && (
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-gray-700">
                                {p.contact_person}
                              </span>
                            </div>
                          )}
                          {p.phone && (
                            <div className="text-gray-600">{p.phone}</div>
                          )}
                          {p.email && (
                            <div className="text-gray-600">{p.email}</div>
                          )}
                          {p.address && (
                            <div className="text-gray-500 text-xs">
                              {p.address}
                              {p.ward && `, ${p.ward}`}
                              {p.district && `, ${p.district}`}
                              {p.province && `, ${p.province}`}
                            </div>
                          )}
                        </div>
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                            p.status === "active"
                              ? "bg-green-100 text-green-700 border border-green-200"
                              : "bg-gray-100 text-gray-700 border border-gray-200"
                          }`}
                        >
                          {p.status === "active" ? "Hoạt động" : "Không hoạt động"}
                        </span>
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex justify-center gap-2">
                          <button
                            onClick={() => navigate(`/partners/${p.id}`)}
                            className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors duration-150 border border-emerald-200 hover:border-emerald-300"
                            title="Chỉnh sửa"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>

                          <button
                            onClick={() => handleDelete(p.id)}
                            className="p-2 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors duration-150 border border-rose-200 hover:border-rose-300"
                            title="Xóa"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}

                  {totalItems === 0 && (
                    <tr>
                      <td
                        colSpan={6}
                        className="px-6 py-12 text-center text-gray-500"
                      >
                        <div className="flex flex-col items-center gap-2">
                          <Users className="w-12 h-12 text-gray-300" />
                          <p className="text-sm font-medium">
                            Không tìm thấy đối tác nào
                          </p>
                          <p className="text-xs text-gray-400">
                            Thử điều chỉnh bộ lọc hoặc thêm đối tác mới
                          </p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalItems > 0 && (
              <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200 bg-gray-50">
                <div className="text-sm text-gray-600">
                  Hiển thị{" "}
                  <span className="font-semibold text-gray-900">
                    {startIndex + 1}
                  </span>{" "}
                  đến{" "}
                  <span className="font-semibold text-gray-900">
                    {Math.min(startIndex + pageSize, totalItems)}
                  </span>{" "}
                  trong tổng số{" "}
                  <span className="font-semibold text-gray-900">
                    {totalItems}
                  </span>{" "}
                  đối tác
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => goToPage(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="flex items-center gap-1 px-3 py-2 rounded-lg border border-gray-300 text-sm font-medium text-gray-700 hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    Trước
                  </button>

                  <div className="flex gap-1">
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                      (pNum) => (
                        <button
                          key={pNum}
                          onClick={() => goToPage(pNum)}
                          className={`w-10 h-10 rounded-lg text-sm font-medium transition-all ${
                            pNum === currentPage
                              ? "bg-orange-500 text-white shadow-md"
                              : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
                          }`}
                        >
                          {pNum}
                        </button>
                      )
                    )}
                  </div>

                  <button
                    onClick={() => goToPage(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="flex items-center gap-1 px-3 py-2 rounded-lg border border-gray-300 text-sm font-medium text-gray-700 hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                  >
                    Sau
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default PartnerList;