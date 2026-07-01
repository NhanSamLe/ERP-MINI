import { useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-toastify";
import { Banknote } from "lucide-react";
import { RootState, AppDispatch } from "../../../../store/store";
import {
  fetchVendorRefundByIdThunk,
  postVendorRefundThunk,
  clearSelectedVendorRefund,
} from "../../store/purchaseReturn";
import { StatusBadge } from "../../../../components/common";
import { ActionConfirmModal } from "../../../../components/common";
import { StandardFormLayout } from "../../../../components/layout/StandardFormLayout";
import { FormSection } from "../../../../components/layout/FormSection";
import { formatVND } from "@/utils/currency.helper";
import { Roles } from "@/types/enum";
import { useState } from "react";

const METHOD_LABELS: Record<string, string> = {
  cash: "Tiền mặt",
  bank: "Chuyển khoản ngân hàng",
  transfer: "Chuyển khoản",
};

export default function VendorRefundDetailPage() {
  const { id } = useParams<{ id: string }>();
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const {
    selectedVendorRefund: refund,
    loading,
    actionLoading,
  } = useSelector((s: RootState) => s.purchaseReturn);
  const user = useSelector((s: RootState) => s.auth.user);
  const role = user?.role.code;
  const [postModal, setPostModal] = useState(false);

  useEffect(() => {
    const numId = Number(id);
    if (id && !isNaN(numId)) dispatch(fetchVendorRefundByIdThunk(numId));
    return () => {
      dispatch(clearSelectedVendorRefund());
    };
  }, [id, dispatch]);

  const handlePost = async () => {
    if (!refund) return;
    try {
      await dispatch(postVendorRefundThunk(refund.id)).unwrap();
      toast.success("Đã ghi sổ phiếu hoàn tiền từ NCC");
      setPostModal(false);
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

  if (!refund) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3 text-gray-500">
        <Banknote className="w-10 h-10 text-gray-300" />
        <p className="text-sm font-medium">Không tìm thấy phiếu hoàn tiền từ NCC</p>
        <button
          onClick={() => navigate("/purchase/vendor-refunds")}
          className="text-sm text-orange-600 hover:underline"
        >
          Quay lại danh sách
        </button>
      </div>
    );
  }

  const actions = [
    {
      label: "Quay lại",
      variant: "outline" as const,
      onClick: () => navigate("/purchase/vendor-refunds"),
    },
    ...(refund.status === "draft" &&
    (role === Roles.ACCOUNT || role === Roles.CHACC)
      ? [
          {
            label: "Ghi sổ",
            variant: "success" as const,
            onClick: () => setPostModal(true),
          },
        ]
      : []),
  ];

  return (
    <>
      <StandardFormLayout
        title={refund.refund_no}
        statusBadge={<StatusBadge status={refund.status} />}
        actions={actions}
      >
        <FormSection
          title="Chi tiết Hoàn tiền"
          icon={<Banknote className="w-4 h-4" />}
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <p className="text-xs text-gray-500 mb-1">Số phiếu hoàn</p>
              <p className="text-sm font-semibold">{refund.refund_no}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-1">Nhà cung cấp</p>
              <p className="text-sm">{refund.supplier?.name ?? "—"}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-1">Ngày hoàn tiền</p>
              <p className="text-sm">
                {new Date(refund.refund_date).toLocaleDateString("vi-VN")}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-1">Số tiền</p>
              <p className="text-sm font-bold text-orange-600">
                {formatVND(refund.amount)}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-1">Phương thức</p>
              <p className="text-sm">
                {METHOD_LABELS[refund.method] ?? refund.method}
              </p>
            </div>
            {refund.transaction_reference && (
              <div>
                <p className="text-xs text-gray-500 mb-1">Mã giao dịch</p>
                <p className="text-sm">{refund.transaction_reference}</p>
              </div>
            )}
            {refund.debitNote && (
              <div>
                <p className="text-xs text-gray-500 mb-1">Thẻ nợ liên kết</p>
                <p className="text-sm text-orange-600">
                  {refund.debitNote.debit_note_no}
                </p>
              </div>
            )}
            <div>
              <p className="text-xs text-gray-500 mb-1">Người tạo</p>
              <p className="text-sm">{refund.creator?.full_name ?? "—"}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-1">Thời gian tạo</p>
              <p className="text-sm">
                {new Date(refund.created_at).toLocaleDateString("vi-VN")}
              </p>
            </div>
          </div>
          {refund.notes && (
            <div className="mt-4">
              <p className="text-xs text-gray-500 mb-1">Ghi chú</p>
              <p className="text-sm text-gray-700 whitespace-pre-wrap">
                {refund.notes}
              </p>
            </div>
          )}
        </FormSection>
      </StandardFormLayout>

      <ActionConfirmModal
        isOpen={postModal}
        onClose={() => setPostModal(false)}
        onConfirm={handlePost}
        title="Ghi sổ Phiếu hoàn tiền"
        description={`Ghi sổ phiếu hoàn tiền từ NCC ${refund.refund_no}? Bút toán sổ cái sẽ được tạo và tăng số dư tài khoản ngân hàng.`}
        confirmText="Ghi sổ"
        variant="success"
        loading={actionLoading}
      />
    </>
  );
}
