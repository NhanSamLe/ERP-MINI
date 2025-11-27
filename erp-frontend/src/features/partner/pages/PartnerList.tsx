import { FC, useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "../../../store/store";
import { loadPartners, deletePartnerThunk } from "../store/partner.thunks";
import { PartnerType, Partner } from "../store/partner.types";
import { useNavigate, useSearchParams  } from "react-router-dom";
import { Pencil, Trash2, Plus, ChevronLeft, ChevronRight } from "lucide-react";

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


  // load dữ liệu
  useEffect(() => {
    dispatch(
      loadPartners({
        search: search || undefined,
        type: (type || undefined) as PartnerType | undefined,
      })
    );
  }, [dispatch, search, type]);

  // mỗi lần đổi filter → reset về trang 1
  useEffect(() => {
    setPage(1);
  }, [search, type]);

  const handleDelete = (id: number) => {
    if (window.confirm("Xóa đối tác này?")) {
      dispatch(deletePartnerThunk(id));
    }
  };

  // ====== tính toán phân trang ======
  const totalItems = data.length;
  const totalPages = totalItems ? Math.ceil(totalItems / pageSize) : 1;
  const currentPage = Math.min(page, totalPages);
  const startIndex = (currentPage - 1) * pageSize;
  const pageItems = data.slice(startIndex, startIndex + pageSize);

  const goToPage = (p: number) => {
    if (p < 1 || p > totalPages) return;
    setPage(p);
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Danh sách đối tác</h2>

        <button
          onClick={() => navigate("/partners/create")}
          className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg shadow-sm transition"
        >
          <Plus className="w-4 h-4" />
          Add New Partner
        </button>
      </div>

      {/* Search bar */}
      <div className="bg-white p-4 rounded-lg shadow-sm border flex gap-4">
        <input
          type="text"
          placeholder="Tìm theo tên / email / SĐT / MST..."
          className="flex-1 border px-3 py-2 rounded-md text-sm focus:ring-2 focus:ring-orange-400"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <select
          className="border px-3 py-2 rounded-md text-sm focus:ring-2 focus:ring-orange-400"
          value={type}
          onChange={(e) => setType(e.target.value as PartnerType | "")}
        >
          <option value="">All Partners</option>
          <option value="customer">Customer</option>
          <option value="supplier">Supplier</option>
          
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-100 text-gray-700">
            <tr>
              <th className="border px-3 py-2 text-left">ID</th>
              <th className="border px-3 py-2 text-left">Tên</th>
              <th className="border px-3 py-2 text-left">Loại</th>
              <th className="border px-3 py-2 text-left">Liên hệ</th>
              <th className="border px-3 py-2 text-left">Trạng thái</th>
              <th className="border px-3 py-2 text-center w-[120px]">
                Action
              </th>
            </tr>
          </thead>

          <tbody>
            {pageItems.map((p: Partner) => (
              <tr key={p.id} className="hover:bg-gray-50">
                <td className="border px-3 py-2">{p.id}</td>
                <td className="border px-3 py-2 font-medium">{p.name}</td>
                <td className="border px-3 py-2 capitalize">{p.type}</td>

                {/* Liên hệ + địa chỉ + CCCD + tỉnh */}
                <td className="border px-3 py-2">
                  {p.contact_person && (
                    <div className="font-medium">{p.contact_person}</div>
                  )}
                  {p.phone && (
                    <div className="text-xs text-gray-500">{p.phone}</div>
                  )}
                  {p.email && (
                    <div className="text-xs text-gray-500">{p.email}</div>
                  )}
                  {p.address && (
                    <div className="text-xs text-gray-500">
                      Địa chỉ: {p.address}
                    </div>
                  )}
                  {p.cccd && (
                    <div className="text-xs text-gray-500">CCCD: {p.cccd}</div>
                  )}
                  {p.province && (
                    <div className="text-xs text-gray-500">
                      Tỉnh/TP: {p.province}
                    </div>
                  )}
                </td>

                <td className="border px-3 py-2">
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-medium ${
                      p.status === "active"
                        ? "bg-green-100 text-green-700"
                        : "bg-gray-200 text-gray-700"
                    }`}
                  >
                    {p.status === "active" ? "Active" : "Inactive"}
                  </span>
                </td>

                <td className="border px-3 py-2 text-center">
                  <div className="flex justify-center gap-2">
                    {/* Edit */}
                    <button
                      onClick={() => navigate(`/partners/${p.id}`)}
                      className="p-1.5 border border-emerald-500 text-emerald-600 rounded hover:bg-emerald-50 transition"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>

                    {/* Delete */}
                    <button
                      onClick={() => handleDelete(p.id)}
                      className="p-1.5 border border-rose-500 text-rose-600 rounded hover:bg-rose-50 transition"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}

            {totalItems === 0 && (
              <tr>
                <td colSpan={6} className="text-center py-5 text-gray-500">
                  Không có đối tác nào.
                </td>
              </tr>
            )}
          </tbody>
        </table>

        {/* Pagination */}
        {totalItems > 0 && (
          <div className="flex items-center justify-between px-4 py-3 border-t bg-gray-50 text-xs text-gray-600">
            <div>
              Showing{" "}
              <span className="font-medium">
                {startIndex + 1} -{" "}
                {Math.min(startIndex + pageSize, totalItems)}
              </span>{" "}
              of <span className="font-medium">{totalItems}</span> partners
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

              {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                (pNum) => (
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
                )
              )}

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
};

export default PartnerList;
