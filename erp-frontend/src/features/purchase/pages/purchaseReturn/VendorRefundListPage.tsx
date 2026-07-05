import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { Plus, RotateCw, Banknote, ChevronLeft, ChevronRight } from "lucide-react";
import { RootState, AppDispatch } from "../../../../store/store";
import {
  fetchVendorRefundsThunk,
  postVendorRefundThunk,
} from "../../store/purchaseReturn";
import { StatusBadge } from "../../../../components/common";
import { ActionConfirmModal } from "../../../../components/common";
import { Button } from "../../../../components/ui/Button";
import { formatVND } from "@/utils/currency.helper";
import { Roles } from "@/types/enum";
import { VendorRefund } from "../../api/purchaseReturn.api";

const METHOD_LABELS: Record<string, string> = {
  cash: "Tiền mặt",
  bank: "Chuyển khoản ngân hàng",
  transfer: "Chuyển khoản",
};

export default function VendorRefundListPage() {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const { vendorRefunds, loading, actionLoading } = useSelector(
    (s: RootState) => s.purchaseReturn,
  );
  const user = useSelector((s: RootState) => s.auth.user);
  const role = user?.role.code;

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [postTarget, setPostTarget] = useState<VendorRefund | null>(null);

  useEffect(() => {
    dispatch(fetchVendorRefundsThunk(undefined));
  }, [dispatch]);

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    setCurrentPage(1);
  }, [search, statusFilter]);

  const filtered = vendorRefunds.filter((r) => {
    const matchSearch =
      !search ||
      r.refund_no.toLowerCase().includes(search.toLowerCase()) ||
      r.supplier?.name?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = !statusFilter || r.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const paginated = filtered.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handlePost = async () => {
    if (!postTarget) return;
    try {
      await dispatch(postVendorRefundThunk(postTarget.id)).unwrap();
      toast.success("Đã ghi sổ phiếu hoàn tiền từ NCC");
      setPostTarget(null);
    } catch (e: any) {
      toast.error(e);
    }
  };

  return (
    <div className="page-container">
      <div className="erp-card overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 bg-gradient-to-r from-orange-50/50 to-white">
          <div className="flex items-center gap-2.5">
            <span className="w-8 h-8 bg-orange-50 rounded-lg flex items-center justify-center">
              <Banknote className="w-4 h-4 text-orange-500" />
            </span>
            <div>
              <h1 className="text-base font-semibold text-gray-900">
                Hoàn tiền từ Nhà cung cấp
              </h1>
              <p className="text-xs text-gray-400 mt-0.5">
                Nhận tiền hoàn trả từ nhà cung cấp
              </p>
            </div>
            <span className="ml-1 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-orange-50 text-orange-600">
              {filtered.length}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => dispatch(fetchVendorRefundsThunk(undefined))}
              className="inline-flex items-center gap-1.5 h-8 px-3 text-sm font-medium text-gray-600 border border-gray-300 bg-white rounded-md hover:bg-gray-50 transition-colors"
            >
              <RotateCw className="w-3.5 h-3.5" />
            </button>
            {(role === Roles.ACCOUNT || role === Roles.CHACC) && (
              <Button
                size="sm"
                leftIcon={<Plus className="w-3.5 h-3.5" />}
                onClick={() => navigate("/purchase/vendor-refunds/create")}
              >
                Tạo Phiếu hoàn tiền mới
              </Button>
            )}
          </div>
        </div>

        <div className="px-5 py-3 border-b border-orange-100 bg-orange-50/30 flex items-center gap-3">
          <input
            placeholder="Tìm số phiếu hoàn, nhà cung cấp..."
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
            <option value="posted">Đã ghi sổ</option>
          </select>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3 text-gray-400">
            <div className="w-6 h-6 border-2 border-orange-200 border-t-orange-500 rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-16 flex flex-col items-center gap-2 text-gray-400">
            <Banknote className="w-10 h-10" />
            <p className="text-sm font-medium">Không tìm thấy phiếu hoàn tiền nào</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-orange-100 bg-orange-50/60">
                  {[
                    "Số phiếu hoàn",
                    "Nhà cung cấp",
                    "Ngày lập",
                    "Phương thức",
                    "Số tiền",
                    "Trạng thái",
                    "Thao tác",
                  ].map((h) => (
                    <th
                      key={h}
                      className={`px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider ${h === "Số tiền" || h === "Thao tác" ? "text-right" : "text-left"}`}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {paginated.map((r) => (
                  <tr
                    key={r.id}
                    className="hover:bg-orange-50/50 transition-colors cursor-pointer"
                    onClick={() => navigate(`/purchase/vendor-refunds/${r.id}`)}
                  >
                    <td className="px-4 py-3 font-medium text-gray-900">
                      {r.refund_no}
                    </td>
                    <td className="px-4 py-3 text-gray-700">
                      {r.supplier?.name ?? "—"}
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {new Date(r.refund_date).toLocaleDateString("vi-VN")}
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {METHOD_LABELS[r.method] ?? r.method}
                    </td>
                    <td className="px-4 py-3 text-right font-semibold text-gray-900">
                      {formatVND(r.amount)}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={r.status} />
                    </td>
                    <td
                      className="px-4 py-3 text-right"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {r.status === "draft" &&
                        (role === Roles.ACCOUNT || role === Roles.CHACC) && (
                          <button
                            onClick={() => setPostTarget(r)}
                            className="h-6 px-2 text-xs font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 rounded hover:bg-emerald-100 transition-colors"
                          >
                            Ghi sổ
                          </button>
                        )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between px-5 py-3 border-t border-orange-100 bg-orange-50/30 gap-3 text-sm text-gray-600">
          <p className="text-xs text-gray-500">
            Hiển thị <strong>{filtered.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0}–{Math.min(currentPage * itemsPerPage, filtered.length)}</strong> trên{" "}
            <strong>{filtered.length}</strong> phiếu (Tổng cộng <strong>{vendorRefunds.length}</strong> bản ghi)
          </p>

          {filtered.length > 0 && (
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

      <ActionConfirmModal
        isOpen={!!postTarget}
        onClose={() => setPostTarget(null)}
        onConfirm={handlePost}
        title="Ghi sổ Phiếu hoàn tiền"
        description={`Ghi sổ phiếu hoàn tiền từ NCC ${postTarget?.refund_no}? Bút toán sổ cái sẽ được tạo và tăng số dư tài khoản ngân hàng.`}
        confirmText="Ghi sổ"
        variant="success"
        loading={actionLoading}
      />
    </div>
  );
}
