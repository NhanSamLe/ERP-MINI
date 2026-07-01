import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-toastify";
import { FileMinusIcon, AlertCircle, X, Loader2 } from "lucide-react";
import { RootState, AppDispatch } from "../../../../store/store";
import {
  fetchDebitNoteByIdThunk,
  postDebitNoteThunk,
  cancelDebitNoteThunk,
  clearSelectedDebitNote,
} from "../../store/purchaseReturn";
import { StatusBadge } from "../../../../components/common";
import { ActionConfirmModal } from "../../../../components/common";
import { StandardFormLayout } from "../../../../components/layout/StandardFormLayout";
import { FormSection } from "../../../../components/layout/FormSection";
import { formatVND } from "@/utils/currency.helper";
import { Roles } from "@/types/enum";

export default function DebitNoteDetailPage() {
  const { id } = useParams<{ id: string }>();
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const {
    selectedDebitNote: dn,
    loading,
    actionLoading,
  } = useSelector((s: RootState) => s.purchaseReturn);
  const user = useSelector((s: RootState) => s.auth.user);
  const role = user?.role.code;
  const [modal, setModal] = useState<"post" | "cancel" | null>(null);

  useEffect(() => {
    const numId = Number(id);
    if (id && !isNaN(numId)) dispatch(fetchDebitNoteByIdThunk(numId));
    return () => {
      dispatch(clearSelectedDebitNote());
    };
  }, [id, dispatch]);

  const handleAction = async () => {
    if (!dn) return;
    try {
      if (modal === "post") {
        await dispatch(postDebitNoteThunk(dn.id)).unwrap();
        toast.success("Đã ghi sổ thẻ nợ");
      } else {
        await dispatch(cancelDebitNoteThunk(dn.id)).unwrap();
        toast.success("Đã hủy thẻ nợ");
      }
      setModal(null);
    } catch (e: any) {
      toast.error(e);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-6 h-6 border-2 border-orange-200 border-t-orange-500 rounded-full animate-spin" />
      </div>
    );
  }

  if (!dn) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3 text-gray-500">
        <FileMinusIcon className="w-10 h-10 text-gray-300" />
        <p className="text-sm font-medium">Không tìm thấy thẻ nợ</p>
        <button
          onClick={() => navigate("/purchase/debit-notes")}
          className="text-sm text-orange-600 hover:underline"
        >
          Quay lại danh sách
        </button>
      </div>
    );
  }

  const isAccountant = role === Roles.ACCOUNT || role === Roles.CHACC;
  const actions = [
    {
      label: "Quay lại",
      variant: "outline" as const,
      onClick: () => navigate("/purchase/debit-notes"),
    },
    ...(dn.status === "draft" && isAccountant
      ? [
          {
            label: "Ghi sổ",
            variant: "success" as const,
            onClick: () => setModal("post"),
          },
        ]
      : []),
    ...(["draft", "posted"].includes(dn.status) && isAccountant
      ? [
          {
            label: "Hủy bỏ",
            variant: "danger" as const,
            onClick: () => setModal("cancel"),
          },
        ]
      : []),
  ];

  return (
    <>
      <StandardFormLayout
        title={dn.debit_note_no}
        statusBadge={<StatusBadge status={dn.status} />}
        actions={actions}
      >
        <FormSection
          title="Chi tiết Thẻ nợ"
          icon={<FileMinusIcon className="w-4 h-4" />}
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <p className="text-xs text-gray-500 mb-1">Số thẻ nợ</p>
              <p className="text-sm font-semibold">{dn.debit_note_no}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-1">Nhà cung cấp</p>
              <p className="text-sm">{dn.supplier?.name ?? "—"}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-1">Ngày lập</p>
              <p className="text-sm">
                {new Date(dn.debit_note_date).toLocaleDateString("vi-VN")}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-1">Tổng trước thuế</p>
              <p className="text-sm">{formatVND(dn.total_before_tax)}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-1">Thuế GTGT</p>
              <p className="text-sm">{formatVND(dn.total_tax)}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-1">Tổng sau thuế</p>
              <p className="text-sm font-bold text-orange-600">
                {formatVND(dn.total_after_tax)}
              </p>
            </div>
            {dn.original_ap_invoice_id && (
              <div>
                <p className="text-xs text-gray-500 mb-1">Hóa đơn mua hàng gốc</p>
                <p className="text-sm">HĐ #{dn.original_ap_invoice_id}</p>
              </div>
            )}
            <div>
              <p className="text-xs text-gray-500 mb-1">Người tạo</p>
              <p className="text-sm">{dn.creator?.full_name ?? "—"}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-1">Thời gian tạo</p>
              <p className="text-sm">
                {new Date(dn.created_at).toLocaleDateString("vi-VN")}
              </p>
            </div>
          </div>
        </FormSection>

        {/* Lines */}
        {dn.lines && dn.lines.length > 0 && (
          <FormSection
            title="Danh sách mặt hàng"
            icon={<FileMinusIcon className="w-4 h-4" />}
            noPadding
          >
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-orange-100 bg-orange-50/60">
                  {["#", "Sản phẩm", "Số lượng", "Đơn giá", "Thành tiền"].map(
                    (h) => (
                      <th
                        key={h}
                        className={`px-4 py-3 text-xs font-semibold text-gray-500 uppercase ${h === "Số lượng" || h === "Đơn giá" || h === "Thành tiền" ? "text-right" : "text-left"}`}
                      >
                        {h}
                      </th>
                    ),
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {dn.lines.map((line, i) => (
                  <tr key={line.id} className="hover:bg-gray-50/60">
                    <td className="px-4 py-3 text-gray-500">{i + 1}</td>
                    <td className="px-4 py-3 font-medium text-gray-900">
                      {line.product?.name ?? `Sản phẩm #${line.product_id}`}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {line.quantity} {(line as any).uom?.name || (line as any).product?.uom?.name || ""}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {formatVND(line.unit_price)}
                    </td>
                    <td className="px-4 py-3 text-right font-semibold text-orange-600">
                      {formatVND(line.line_total_after_tax)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </FormSection>
        )}
      </StandardFormLayout>

      {modal === "post" && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 animate-fade-in"
          onClick={(e) => {
            if (e.target === e.currentTarget) setModal(null);
          }}
        >
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-xl overflow-hidden animate-slide-up flex flex-col max-h-[90vh]">
            {/* Header */}
            <div className="flex items-start justify-between px-6 pt-5 pb-4 border-b border-gray-100 bg-orange-50/20">
              <div className="flex items-center gap-3">
                <span className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0 bg-orange-50">
                  <AlertCircle className="w-5 h-5 text-orange-500" />
                </span>
                <div>
                  <h3 className="text-sm font-semibold text-gray-900">Ghi sổ Thẻ nợ</h3>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Xác nhận hạch toán kế toán cho thẻ nợ {dn.debit_note_no}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setModal(null)}
                className="shrink-0 p-1 rounded text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 overflow-y-auto flex-1 space-y-4">
              <p className="text-sm text-gray-600">
                Khi ghi sổ, hệ thống sẽ tự động tạo bút toán sổ cái (GL Entry) và giảm trừ khoản phải trả nhà cung cấp tương ứng.
              </p>

              <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Xem trước định khoản (GL Entry)</p>
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
                        <td className="py-2.5 px-3">
                          <span className="font-semibold block">331</span>
                          <span className="text-gray-400 text-[10px]">Phải trả nhà cung cấp</span>
                        </td>
                        <td className="py-2.5 px-3 text-right text-emerald-600 font-bold">
                          {formatVND(dn.total_after_tax)}
                        </td>
                        <td className="py-2.5 px-3 text-right text-gray-300">—</td>
                      </tr>
                      {/* 156 Inventory */}
                      {Number(dn.total_before_tax) > 0 && (
                        <tr>
                          <td className="py-2.5 px-3">
                            <span className="font-semibold block">156</span>
                            <span className="text-gray-400 text-[10px]">Hàng hóa</span>
                          </td>
                          <td className="py-2.5 px-3 text-right text-gray-300">—</td>
                          <td className="py-2.5 px-3 text-right text-orange-600 font-bold">
                            {formatVND(dn.total_before_tax)}
                          </td>
                        </tr>
                      )}
                      {/* 1331 VAT */}
                      {Number(dn.total_tax) > 0 && (
                        <tr>
                          <td className="py-2.5 px-3">
                            <span className="font-semibold block">1331</span>
                            <span className="text-gray-400 text-[10px]">Thuế GTGT được khấu trừ</span>
                          </td>
                          <td className="py-2.5 px-3 text-right text-gray-300">—</td>
                          <td className="py-2.5 px-3 text-right text-orange-600 font-bold">
                            {formatVND(dn.total_tax)}
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
                  <span className="font-medium text-gray-800">{formatVND(dn.total_before_tax)}</span>
                </div>
                <div className="flex justify-between text-gray-500">
                  <span>Thuế GTGT:</span>
                  <span className="font-medium text-gray-800">{formatVND(dn.total_tax)}</span>
                </div>
                <div className="flex justify-between border-t border-gray-200 pt-1.5 font-bold text-gray-900">
                  <span>Tổng tiền giảm trừ (Sau thuế):</span>
                  <span className="text-orange-600 text-sm">{formatVND(dn.total_after_tax)}</span>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex items-center justify-end gap-3">
              <button
                onClick={() => setModal(null)}
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
        isOpen={modal === "cancel"}
        onClose={() => setModal(null)}
        onConfirm={handleAction}
        title="Hủy Thẻ nợ"
        description={`Bạn có chắc chắn muốn hủy thẻ nợ ${dn.debit_note_no}?`}
        confirmText="Hủy bỏ"
        variant="danger"
        loading={actionLoading}
      />
    </>
  );
}
