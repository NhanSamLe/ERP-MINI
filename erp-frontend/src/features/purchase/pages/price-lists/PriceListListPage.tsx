import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-toastify";
import { Plus, RotateCw, FileSpreadsheet, Calendar, User, Eye, Trash2, ChevronLeft, ChevronRight } from "lucide-react";
import { RootState, AppDispatch } from "../../../../store/store";
import { purchasePriceListApi, PurchasePriceList } from "../../api/purchasePriceList.api";
import { loadPartners } from "@/features/partner/store/partner.thunks";
import { StatusBadge } from "../../../../components/common";
import { Roles } from "@/types/enum";

export default function PriceListListPage() {
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();

  const [priceLists, setPriceLists] = useState<PurchasePriceList[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [supplierFilter, setSupplierFilter] = useState("");

  const user = useSelector((s: RootState) => s.auth.user);
  const role = user?.role.code;
  const partners = useSelector((s: RootState) => s.partners);

  const fetchPriceLists = async () => {
    setLoading(true);
    try {
      const params: Record<string, any> = {};
      if (statusFilter) params.is_active = statusFilter === "active";
      if (supplierFilter) params.supplier_id = Number(supplierFilter);
      
      const data = await purchasePriceListApi.getAll(params);
      setPriceLists(data || []);
    } catch (e: any) {
      toast.error(e?.message ?? "Tải danh sách bảng giá thất bại");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    dispatch(loadPartners({ type: "supplier" }));
    fetchPriceLists();
  }, [dispatch, statusFilter, supplierFilter]);

  const handleDelete = async (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm("Bạn có chắc chắn muốn xóa bảng giá này không?")) return;
    try {
      await purchasePriceListApi.delete(id);
      toast.success("Xóa bảng giá thành công");
      fetchPriceLists();
    } catch (e: any) {
      toast.error(e?.message ?? "Xóa bảng giá thất bại");
    }
  };

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    setCurrentPage(1);
  }, [search, statusFilter, supplierFilter]);

  const filteredLists = priceLists.filter((pl) => {
    const plName = pl.name.toLowerCase();
    const plCode = pl.code?.toLowerCase() ?? "";
    const supplierName = pl.supplier?.name?.toLowerCase() ?? "";
    const term = search.toLowerCase();
    
    return plName.includes(term) || plCode.includes(term) || supplierName.includes(term);
  });

  const totalPages = Math.ceil(filteredLists.length / itemsPerPage);
  const paginated = filteredLists.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <div className="page-container p-6 bg-gray-50/50 min-h-screen">
      <div className="erp-card bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-orange-50/40 to-white">
          <div className="flex items-center gap-3">
            <span className="w-9 h-9 bg-orange-50 rounded-xl flex items-center justify-center">
              <FileSpreadsheet className="w-5 h-5 text-orange-500" />
            </span>
            <div>
              <h1 className="text-lg font-semibold text-gray-900">Bảng Giá Mua Hàng</h1>
              <p className="text-xs text-gray-400">Quản lý giá mua hàng từ nhà cung cấp và các chính sách chiết khấu theo số lượng</p>
            </div>
            <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-orange-50 text-orange-600">
              {filteredLists.length} bảng giá
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={fetchPriceLists}
              className="inline-flex items-center justify-center w-8 h-8 text-gray-500 border border-gray-200 bg-white rounded-lg hover:bg-gray-50 hover:text-gray-900 transition"
              title="Tải lại"
            >
              <RotateCw className="w-4 h-4" />
            </button>
            {role === Roles.PURCHASEMANAGER && (
              <button
                onClick={() => navigate("/purchase/price-lists/create")}
                className="inline-flex items-center gap-1.5 h-8 px-4 text-sm font-semibold bg-orange-500 text-white hover:bg-orange-600 rounded-lg shadow-sm transition"
              >
                <Plus className="w-4 h-4" />
                Thêm Bảng Giá Mới
              </button>
            )}
          </div>
        </div>

        {/* Filter bar */}
        <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/20">
          <div className="flex items-center gap-4 flex-wrap">
            <div className="relative flex-1 min-w-[240px] max-w-sm">
              <input
                placeholder="Tìm kiếm theo tên, mã bảng giá, nhà cung cấp..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full h-9 pl-3 pr-3 text-sm border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition placeholder:text-gray-400"
              />
            </div>
            <select
              value={supplierFilter}
              onChange={(e) => setSupplierFilter(e.target.value)}
              className="h-9 px-3 text-sm border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition w-48"
            >
              <option value="">Tất cả nhà cung cấp</option>
              {(partners as any)?.items?.map((p: any) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="h-9 px-3 text-sm border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition w-44"
            >
              <option value="">Tất cả trạng thái</option>
              <option value="active">Hoạt động</option>
              <option value="inactive">Không hoạt động</option>
            </select>
          </div>
        </div>

        {/* Table */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3 text-gray-400">
            <div className="w-8 h-8 border-2 border-orange-200 border-t-orange-500 rounded-full animate-spin" />
            <span className="text-sm">Đang tải dữ liệu...</span>
          </div>
        ) : filteredLists.length === 0 ? (
          <div className="py-20 flex flex-col items-center gap-3 text-gray-400 text-center">
            <FileSpreadsheet className="w-12 h-12 text-gray-300" />
            <div>
              <p className="text-sm font-medium text-gray-600">Không tìm thấy bảng giá nào</p>
              <p className="text-xs text-gray-400 mt-1">Vui lòng điều chỉnh bộ lọc hoặc tạo một bảng giá mới</p>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/50 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  <th className="px-6 py-3.5">Mã</th>
                  <th className="px-6 py-3.5">Tên</th>
                  <th className="px-6 py-3.5">Nhà cung cấp</th>
                  <th className="px-6 py-3.5">Ngày bắt đầu</th>
                  <th className="px-6 py-3.5">Ngày kết thúc</th>
                  <th className="px-6 py-3.5">Trạng thái</th>
                  <th className="px-6 py-3.5 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {paginated.map((pl) => (
                  <tr
                    key={pl.id}
                    className="hover:bg-orange-50/20 transition-colors duration-100 cursor-pointer"
                    onClick={() => navigate(`/purchase/price-lists/${pl.id}`)}
                  >
                    <td className="px-6 py-4 font-mono text-xs text-gray-500 font-semibold">
                      {pl.code || `PL-${pl.id}`}
                    </td>
                    <td className="px-6 py-4 font-medium text-gray-900">
                      {pl.name}
                    </td>
                    <td className="px-6 py-4 text-gray-600">
                      {pl.supplier ? (
                        <div className="flex items-center gap-2">
                          <User className="w-3.5 h-3.5 text-gray-400" />
                          <span>{pl.supplier.name}</span>
                        </div>
                      ) : (
                        <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-500 rounded font-medium">Chung</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-gray-600 font-mono text-xs">
                      {pl.start_date ? new Date(pl.start_date).toLocaleDateString("vi-VN") : "—"}
                    </td>
                    <td className="px-6 py-4 text-gray-600 font-mono text-xs">
                      {pl.end_date ? (
                        <span className={new Date(pl.end_date) < new Date() ? "text-red-500" : "text-gray-600"}>
                          {new Date(pl.end_date).toLocaleDateString("vi-VN")}
                        </span>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge status={pl.is_active ? "active" : "inactive"} />
                    </td>
                    <td className="px-6 py-4 text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => navigate(`/purchase/price-lists/${pl.id}`)}
                          className="p-1.5 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition"
                          title="Xem chi tiết"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        {role === Roles.PURCHASEMANAGER && (
                          <button
                            onClick={(e) => handleDelete(pl.id, e)}
                            className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition"
                            title="Xóa"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between px-6 py-3 border-t border-gray-100 bg-gray-50/40 gap-3 text-sm text-gray-600">
          <p className="text-xs text-gray-500">
            Hiển thị <strong>{filteredLists.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0}–{Math.min(currentPage * itemsPerPage, filteredLists.length)}</strong> trên{" "}
            <strong>{filteredLists.length}</strong> bảng giá (Tổng cộng <strong>{priceLists.length}</strong> bản ghi)
          </p>

          {filteredLists.length > 0 && (
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="h-8 w-8 flex items-center justify-center rounded border border-gray-300 bg-white text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`h-8 min-w-[2rem] px-2 rounded border text-xs font-semibold transition-colors ${
                    currentPage === page
                      ? "bg-orange-500 border-orange-500 text-white"
                      : "border-gray-300 bg-white text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  {page}
                </button>
              ))}

              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="h-8 w-8 flex items-center justify-center rounded border border-gray-300 bg-white text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
