import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-toastify";
import { FileMinusIcon } from "lucide-react";
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

      <ActionConfirmModal
        isOpen={modal === "post"}
        onClose={() => setModal(null)}
        onConfirm={handleAction}
        title="Ghi sổ Thẻ nợ"
        description={`Ghi sổ thẻ nợ ${dn.debit_note_no}? Bút toán sổ cái sẽ được tạo và giảm khoản phải trả nhà cung cấp.`}
        confirmText="Ghi sổ"
        variant="success"
        loading={actionLoading}
      />
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
