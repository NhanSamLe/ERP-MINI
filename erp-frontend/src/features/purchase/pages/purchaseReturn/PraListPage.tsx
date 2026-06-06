import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { Plus, RotateCw, CornerUpLeft } from "lucide-react";
import { RootState, AppDispatch } from "../../../../store/store";
import { fetchPrasThunk } from "../../store/purchaseReturn";
import { StatusBadge } from "../../../../components/common";
import { Button } from "../../../../components/ui/Button";
import { formatVND } from "@/utils/currency.helper";
import { Roles } from "@/types/enum";

const RETURN_TYPE_LABELS: Record<string, string> = {
  refund: "Hoàn tiền",
  replacement: "Đổi trả hàng",
  debit_note: "Thẻ nợ",
};

export default function PraListPage() {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const { pras, loading } = useSelector((s: RootState) => s.purchaseReturn);
  const user = useSelector((s: RootState) => s.auth.user);
  const role = user?.role.code;

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  useEffect(() => {
    dispatch(fetchPrasThunk(undefined));
  }, [dispatch]);

  const filtered = pras.filter((p) => {
    const matchSearch =
      !search ||
      p.pra_no.toLowerCase().includes(search.toLowerCase()) ||
      p.supplier?.name?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = !statusFilter || p.status === statusFilter;
    return matchSearch && matchStatus;
  });

  return (
    <div className="page-container">
      <div className="erp-card overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 bg-gradient-to-r from-orange-50/50 to-white">
          <div className="flex items-center gap-2.5">
            <span className="w-8 h-8 bg-orange-50 rounded-lg flex items-center justify-center">
              <CornerUpLeft className="w-4 h-4 text-orange-500" />
            </span>
            <div>
              <h1 className="text-base font-semibold text-gray-900">
                Yêu cầu Trả hàng mua (PRA)
              </h1>
              <p className="text-xs text-gray-400 mt-0.5">
                Quản lý các yêu cầu trả hàng cho nhà cung cấp
              </p>
            </div>
            <span className="ml-1 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-orange-50 text-orange-600">
              {filtered.length}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => dispatch(fetchPrasThunk(undefined))}
              className="inline-flex items-center gap-1.5 h-8 px-3 text-sm font-medium text-gray-600 border border-gray-300 bg-white rounded-md hover:bg-gray-50 transition-colors"
            >
              <RotateCw className="w-3.5 h-3.5" />
            </button>
            {(role === Roles.PURCHASE || role === Roles.PURCHASEMANAGER) && (
              <Button
                size="sm"
                leftIcon={<Plus className="w-3.5 h-3.5" />}
                onClick={() =>
                  navigate("/purchase/return-authorizations/create")
                }
              >
                Tạo PRA mới
              </Button>
            )}
          </div>
        </div>

        {/* Filter bar */}
        <div className="px-5 py-3 border-b border-orange-100 bg-orange-50/30">
          <div className="flex items-center gap-3 flex-wrap">
            <input
              placeholder="Tìm mã PRA, nhà cung cấp..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="flex-1 min-w-[200px] max-w-xs h-8 pl-3 pr-3 text-sm border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-orange-500 placeholder:text-gray-400"
            />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="h-8 pl-3 pr-8 text-sm border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-orange-500"
            >
              <option value="">Tất cả trạng thái</option>
              <option value="draft">Nháp</option>
              <option value="submitted">Đã nộp</option>
              <option value="approved">Đã phê duyệt</option>
              <option value="rejected">Đã từ chối</option>
              <option value="processing">Đang xử lý</option>
              <option value="completed">Đã hoàn thành</option>
              <option value="cancelled">Đã hủy</option>
            </select>
          </div>
        </div>

        {/* Table */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3 text-gray-400">
            <div className="w-6 h-6 border-2 border-orange-200 border-t-orange-500 rounded-full animate-spin" />
            <span className="text-sm">Đang tải...</span>
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-16 flex flex-col items-center gap-2 text-gray-400">
            <CornerUpLeft className="w-10 h-10" />
            <p className="text-sm font-medium">
              Không tìm thấy yêu cầu trả hàng nào
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-orange-100 bg-orange-50/60">
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Số PRA
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Nhà cung cấp
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Loại trả hàng
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Giá trị
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Trạng thái
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Ngày tạo
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map((pra) => (
                  <tr
                    key={pra.id}
                    className="hover:bg-orange-50/50 transition-colors cursor-pointer"
                    onClick={() =>
                      navigate(`/purchase/return-authorizations/${pra.id}`)
                    }
                  >
                    <td className="px-4 py-3 font-medium text-gray-900">
                      {pra.pra_no}
                    </td>
                    <td className="px-4 py-3 text-gray-700">
                      {pra.supplier?.name ?? "—"}
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700">
                        {RETURN_TYPE_LABELS[pra.return_type] ?? pra.return_type}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right font-medium text-gray-900">
                      {formatVND(pra.total_return_amount)}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={pra.status} />
                    </td>
                    <td className="px-4 py-3 text-gray-500 text-xs">
                      {new Date(pra.created_at).toLocaleDateString("vi-VN")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="flex items-center px-5 py-3 border-t border-orange-100 bg-orange-50/30">
          <p className="text-xs text-gray-500">
            Hiển thị{" "}
            <span className="font-semibold text-gray-700">
              {filtered.length}
            </span>{" "}
            bản ghi
          </p>
        </div>
      </div>
    </div>
  );
}
