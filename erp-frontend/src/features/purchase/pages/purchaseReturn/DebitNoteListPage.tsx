import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { RotateCw, FileMinusIcon, AlertCircle, X, Loader2 } from "lucide-react";
import { RootState, AppDispatch } from "../../../../store/store";
import {
  fetchDebitNotesThunk,
  postDebitNoteThunk,
  cancelDebitNoteThunk,
} from "../../store/purchaseReturn";
import { StatusBadge } from "../../../../components/common";
import { ActionConfirmModal } from "../../../../components/common";
import { formatVND } from "@/utils/currency.helper";
import { Roles } from "@/types/enum";
import { ApDebitNote } from "../../api/purchaseReturn.api";

export default function DebitNoteListPage() {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const { debitNotes, loading, actionLoading } = useSelector(
    (s: RootState) => s.purchaseReturn,
  );
  const user = useSelector((s: RootState) => s.auth.user);
  const role = user?.role.code;

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [actionTarget, setActionTarget] = useState<{
    dn: ApDebitNote;
    type: "post" | "cancel";
  } | null>(null);

  useEffect(() => {
    dispatch(fetchDebitNotesThunk(undefined));
  }, [dispatch]);

  const filtered = debitNotes.filter((d) => {
    const matchSearch =
      !search ||
      d.debit_note_no.toLowerCase().includes(search.toLowerCase()) ||
      d.supplier?.name?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = !statusFilter || d.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const handleAction = async () => {
    if (!actionTarget) return;
    try {
      if (actionTarget.type === "post") {
        await dispatch(postDebitNoteThunk(actionTarget.dn.id)).unwrap();
        toast.success("Đã ghi sổ thẻ nợ");
      } else {
        await dispatch(cancelDebitNoteThunk(actionTarget.dn.id)).unwrap();
        toast.success("Đã hủy thẻ nợ");
      }
      setActionTarget(null);
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
              <FileMinusIcon className="w-4 h-4 text-orange-500" />
            </span>
            <div>
              <h1 className="text-base font-semibold text-gray-900">
                Thẻ nợ phải trả
              </h1>
              <p className="text-xs text-gray-400 mt-0.5">
                Giảm khoản phải trả nhà cung cấp
              </p>
            </div>
            <span className="ml-1 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-orange-50 text-orange-600">
              {filtered.length}
            </span>
          </div>
          <button
            onClick={() => dispatch(fetchDebitNotesThunk(undefined))}
            className="inline-flex items-center gap-1.5 h-8 px-3 text-sm font-medium text-gray-600 border border-gray-300 bg-white rounded-md hover:bg-gray-50 transition-colors"
          >
            <RotateCw className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="px-5 py-3 border-b border-orange-100 bg-orange-50/30 flex items-center gap-3">
          <input
            placeholder="Tìm mã thẻ nợ, nhà cung cấp..."
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
            <option value="applied">Đã áp dụng</option>
            <option value="cancelled">Đã hủy</option>
          </select>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3 text-gray-400">
            <div className="w-6 h-6 border-2 border-orange-200 border-t-orange-500 rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-16 flex flex-col items-center gap-2 text-gray-400">
            <FileMinusIcon className="w-10 h-10" />
            <p className="text-sm font-medium">Không tìm thấy thẻ nợ nào</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-orange-100 bg-orange-50/60">
                  {[
                    "Số thẻ nợ",
                    "Nhà cung cấp",
                    "Hóa đơn gốc",
                    "Ngày lập",
                    "Tổng cộng",
                    "Trạng thái",
                    "Thao tác",
                  ].map((h) => (
                    <th
                      key={h}
                      className={`px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider ${h === "Tổng cộng" || h === "Thao tác" ? "text-right" : "text-left"}`}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map((dn) => (
                  <tr
                    key={dn.id}
                    className="hover:bg-orange-50/50 transition-colors cursor-pointer"
                    onClick={() => navigate(`/purchase/debit-notes/${dn.id}`)}
                  >
                    <td className="px-4 py-3 font-medium text-gray-900">
                      {dn.debit_note_no}
                    </td>
                    <td className="px-4 py-3 text-gray-700">
                      {dn.supplier?.name ?? "—"}
                    </td>
                    <td className="px-4 py-3 text-gray-600 text-xs">
                      {dn.original_ap_invoice_id
                        ? `HĐ #${dn.original_ap_invoice_id}`
                        : "—"}
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {new Date(dn.debit_note_date).toLocaleDateString("vi-VN")}
                    </td>
                    <td className="px-4 py-3 text-right font-semibold text-gray-900">
                      {formatVND(dn.total_after_tax)}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={dn.status} />
                    </td>
                    <td
                      className="px-4 py-3 text-right"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="flex items-center justify-end gap-1">
                        {dn.status === "draft" &&
                          (role === Roles.ACCOUNT || role === Roles.CHACC) && (
                            <button
                              onClick={() =>
                                setActionTarget({ dn, type: "post" })
                              }
                              className="h-6 px-2 text-xs font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 rounded hover:bg-emerald-100 transition-colors"
                            >
                              Ghi sổ
                            </button>
                          )}
                        {["draft", "posted"].includes(dn.status) &&
                          (role === Roles.ACCOUNT || role === Roles.CHACC) && (
                            <button
                              onClick={() =>
                                setActionTarget({ dn, type: "cancel" })
                              }
                              className="h-6 px-2 text-xs font-medium text-red-600 bg-red-50 border border-red-200 rounded hover:bg-red-100 transition-colors"
                            >
                              Hủy bỏ
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

        <div className="px-5 py-3 border-t border-orange-100 bg-orange-50/30">
          <p className="text-xs text-gray-500">
            Hiển thị{" "}
            <span className="font-semibold text-gray-700">
              {filtered.length}
            </span>{" "}
            bản ghi
          </p>
        </div>
      </div>

      {actionTarget?.type === "post" && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 animate-fade-in"
          onClick={(e) => {
            if (e.target === e.currentTarget) setActionTarget(null);
          }}
        >
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-xl overflow-hidden animate-slide-up flex flex-col max-h-[90vh]" onClick={(e) => e.stopPropagation()}>
            {/* Header */}
            <div className="flex items-start justify-between px-6 pt-5 pb-4 border-b border-gray-100 bg-orange-50/20">
              <div className="flex items-center gap-3">
                <span className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0 bg-orange-50">
                  <AlertCircle className="w-5 h-5 text-orange-500" />
                </span>
                <div>
                  <h3 className="text-sm font-semibold text-gray-900">Ghi sổ Thẻ nợ</h3>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Xác nhận hạch toán kế toán cho thẻ nợ {actionTarget.dn.debit_note_no}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setActionTarget(null)}
                className="shrink-0 p-1 rounded text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 overflow-y-auto flex-1 space-y-4">
              <p className="text-sm text-gray-600 text-left">
                Khi ghi sổ, hệ thống sẽ tự động tạo bút toán sổ cái (GL Entry) và giảm trừ khoản phải trả nhà cung cấp tương ứng.
              </p>

              <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 text-left">Xem trước định khoản (GL Entry)</p>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left border-collapse">
                    <thead>
                      <tr className="border-b border-gray-200 text-gray-600 bg-gray-100/50">
                        <th className="py-2 px-3 font-semibold">Tài khoản</th>
                        <th className="py-2 px-3 font-semibold text-right">Nợ (Debit)</th>
                        <th className="py-2 px-3 font-semibold text-right">Có (Credit)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {/* 331 AP */}
                      <tr>
                        <td className="py-2.5 px-3 text-left">
                          <span className="font-semibold block">331</span>
                          <span className="text-gray-400 text-[10px]">Phải trả nhà cung cấp</span>
                        </td>
                        <td className="py-2.5 px-3 text-right text-emerald-600 font-bold">
                          {formatVND(actionTarget.dn.total_after_tax)}
                        </td>
                        <td className="py-2.5 px-3 text-right text-gray-300">—</td>
                      </tr>
                      {/* 156 Inventory */}
                      {Number(actionTarget.dn.total_before_tax) > 0 && (
                        <tr>
                          <td className="py-2.5 px-3 text-left">
                            <span className="font-semibold block">156</span>
                            <span className="text-gray-400 text-[10px]">Hàng hóa</span>
                          </td>
                          <td className="py-2.5 px-3 text-right text-gray-300">—</td>
                          <td className="py-2.5 px-3 text-right text-orange-600 font-bold">
                            {formatVND(actionTarget.dn.total_before_tax)}
                          </td>
                        </tr>
                      )}
                      {/* 1331 VAT */}
                      {Number(actionTarget.dn.total_tax) > 0 && (
                        <tr>
                          <td className="py-2.5 px-3 text-left">
                            <span className="font-semibold block">1331</span>
                            <span className="text-gray-400 text-[10px]">Thuế GTGT được khấu trừ</span>
                          </td>
                          <td className="py-2.5 px-3 text-right text-gray-300">—</td>
                          <td className="py-2.5 px-3 text-right text-orange-600 font-bold">
                            {formatVND(actionTarget.dn.total_tax)}
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Summary */}
              <div className="space-y-1.5 border border-gray-150 rounded-lg p-3 text-xs bg-gray-50/50">
                <div className="flex justify-between text-gray-500">
                  <span>Trước thuế:</span>
                  <span className="font-medium text-gray-800">{formatVND(actionTarget.dn.total_before_tax)}</span>
                </div>
                <div className="flex justify-between text-gray-500">
                  <span>Thuế GTGT:</span>
                  <span className="font-medium text-gray-800">{formatVND(actionTarget.dn.total_tax)}</span>
                </div>
                <div className="flex justify-between border-t border-gray-200 pt-1.5 font-bold text-gray-900">
                  <span>Tổng tiền giảm trừ (Sau thuế):</span>
                  <span className="text-orange-600 text-sm">{formatVND(actionTarget.dn.total_after_tax)}</span>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex items-center justify-end gap-3">
              <button
                onClick={() => setActionTarget(null)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition"
              >
                Hủy
              </button>
              <button
                onClick={handleAction}
                disabled={actionLoading}
                className="px-4 py-2 text-sm font-semibold text-white bg-orange-500 rounded-lg hover:bg-orange-600 shadow-md transition disabled:opacity-50 flex items-center gap-2"
              >
                {actionLoading && <Loader2 className="w-4 h-4 animate-spin shrink-0" />}
                Xác nhận Ghi sổ
              </button>
            </div>
          </div>
        </div>
      )}

      <ActionConfirmModal
        isOpen={actionTarget?.type === "cancel"}
        onClose={() => setActionTarget(null)}
        onConfirm={handleAction}
        title="Hủy Thẻ nợ"
        description={`Bạn có chắc chắn muốn hủy thẻ nợ ${actionTarget?.dn.debit_note_no}?`}
        confirmText="Hủy bỏ"
        variant="danger"
        loading={actionLoading}
      />
    </div>
  );
}
