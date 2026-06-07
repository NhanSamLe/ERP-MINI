import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { navigate, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { RotateCw, FileMinusIcon } from "lucide-react";
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

      <ActionConfirmModal
        isOpen={!!actionTarget}
        onClose={() => setActionTarget(null)}
        onConfirm={handleAction}
        title={
          actionTarget?.type === "post"
            ? "Ghi sổ Thẻ nợ"
            : "Hủy Thẻ nợ"
        }
        description={
          actionTarget?.type === "post"
            ? `Ghi sổ thẻ nợ ${actionTarget?.dn.debit_note_no}? Bút toán sổ cái sẽ được tạo và giảm khoản phải trả nhà cung cấp.`
            : `Hủy thẻ nợ ${actionTarget?.dn.debit_note_no}?`
        }
        confirmText={actionTarget?.type === "post" ? "Ghi sổ" : "Hủy bỏ"}
        variant={actionTarget?.type === "post" ? "success" : "danger"}
        loading={actionLoading}
      />
    </div>
  );
}
