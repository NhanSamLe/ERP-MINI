import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-toastify";
import {
  CornerUpLeft,
  CheckCircle,
  Clock,
  ArrowRight,
} from "lucide-react";
import { RootState, AppDispatch } from "../../../../store/store";
import {
  fetchPraByIdThunk,
  submitPraThunk,
  approvePraThunk,
  rejectPraThunk,
  clearSelectedPra,
} from "../../store/purchaseReturn";
import { StatusBadge } from "../../../../components/common";
import { ActionConfirmModal } from "../../../../components/common";
import { StandardFormLayout } from "../../../../components/layout/StandardFormLayout";
import { FormSection } from "../../../../components/layout/FormSection";
import { formatVND } from "@/utils/currency.helper";
import { Roles } from "@/types/enum";

const RETURN_TYPE_LABELS: Record<string, string> = {
  refund: "Hoàn tiền (NCC hoàn tiền)",
  replacement: "Đổi hàng (Đổi trả hàng)",
  debit_note: "Thẻ nợ (Trừ công nợ)",
};

// Timeline step component
function TimelineStep({
  label,
  done,
  active,
}: {
  label: string;
  done: boolean;
  active: boolean;
}) {
  return (
    <div className="flex items-center gap-2">
      <div
        className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${
          done ? "bg-emerald-500" : active ? "bg-orange-500" : "bg-gray-200"
        }`}
      >
        {done ? (
          <CheckCircle className="w-4 h-4 text-white" />
        ) : (
          <Clock
            className={`w-3.5 h-3.5 ${active ? "text-white" : "text-gray-400"}`}
          />
        )}
      </div>
      <span
        className={`text-xs font-medium ${done ? "text-emerald-700" : active ? "text-orange-700" : "text-gray-400"}`}
      >
        {label}
      </span>
    </div>
  );
}

export default function PraDetailPage() {
  const { id } = useParams<{ id: string }>();
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const {
    selectedPra: pra,
    loading,
    actionLoading,
  } = useSelector((s: RootState) => s.purchaseReturn);
  const user = useSelector((s: RootState) => s.auth.user);
  const role = user?.role.code;

  const [modal, setModal] = useState<"submit" | "approve" | "reject" | null>(
    null,
  );

  useEffect(() => {
    const numId = Number(id);
    if (id && !isNaN(numId)) dispatch(fetchPraByIdThunk(numId));
    return () => {
      dispatch(clearSelectedPra());
    };
  }, [id, dispatch]);

  const handleAction = async (action: typeof modal, reason?: string) => {
    if (!pra) return;
    try {
      switch (action) {
        case "submit":
          await dispatch(submitPraThunk(pra.id)).unwrap();
          toast.success("Đã nộp PRA để phê duyệt");
          break;
        case "approve":
          await dispatch(approvePraThunk(pra.id)).unwrap();
          toast.success("Đã phê duyệt PRA");
          break;
        case "reject":
          await dispatch(
            rejectPraThunk({ id: pra.id, reason: reason ?? "" }),
          ).unwrap();
          toast.success("Đã từ chối PRA");
          break;
      }
      setModal(null);
    } catch (e: any) {
      toast.error(e);
    }
  };

  const buildActions = () => {
    if (!pra) return [];
    const base: Array<{
      label: string;
      variant: "primary" | "secondary" | "danger" | "success" | "outline";
      onClick: () => void;
    }> = [
      {
        label: "Quay lại",
        variant: "outline" as const,
        onClick: () => navigate("/purchase/return-authorizations"),
      },
    ];
    if (pra.status === "draft" && role === Roles.PURCHASE) {
      base.push({
        label: "Chỉnh sửa",
        variant: "outline" as const,
        onClick: () =>
          navigate(`/purchase/return-authorizations/${pra.id}/edit`),
      });
    }
    if (pra.status === "draft" && role === Roles.PURCHASE) {
      base.push({
        label: "Nộp duyệt",
        variant: "primary" as const,
        onClick: () => setModal("submit"),
      });
    }
    if (
      pra.approval_status === "waiting_approval" &&
      (role === Roles.PURCHASEMANAGER || role === Roles.CHACC)
    ) {
      base.push({
        label: "Duyệt",
        variant: "success" as const,
        onClick: () => setModal("approve"),
      });
      base.push({
        label: "Từ chối",
        variant: "danger" as const,
        onClick: () => setModal("reject"),
      });
    }
    if (pra.status === "approved") {
      base.push({
        label: "Tạo Phiếu trả hàng",
        variant: "primary" as const,
        onClick: () => navigate(`/purchase/returns/create?pra_id=${pra.id}`),
      });
    }
    return base;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-6 h-6 border-2 border-orange-200 border-t-orange-500 rounded-full animate-spin" />
      </div>
    );
  }

  if (!pra) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3 text-gray-500">
        <CornerUpLeft className="w-10 h-10 text-gray-300" />
        <p className="text-sm font-medium">Không tìm thấy yêu cầu trả hàng mua (PRA)</p>
        <button
          onClick={() => navigate("/purchase/return-authorizations")}
          className="text-sm text-orange-600 hover:underline"
        >
          Quay lại danh sách
        </button>
      </div>
    );
  }

  const timelineSteps = [
    { label: "Đã tạo PRA", done: true, active: false },
    {
      label: "Đã nộp",
      done: [
        "submitted",
        "approved",
        "rejected",
        "processing",
        "completed",
      ].includes(pra.status),
      active: pra.status === "submitted",
    },
    {
      label: "Đã duyệt",
      done: ["approved", "processing", "completed"].includes(pra.status),
      active: pra.status === "approved",
    },
    {
      label: "Đang xử lý",
      done: ["completed"].includes(pra.status),
      active: pra.status === "processing",
    },
    { label: "Hoàn thành", done: pra.status === "completed", active: false },
  ];

  return (
    <>
      <StandardFormLayout
        title={pra.pra_no}
        statusBadge={<StatusBadge status={pra.status} />}
        actions={buildActions()}
      >
        {/* Timeline */}
        <FormSection title="Tiến độ" icon={<Clock className="w-4 h-4" />}>
          <div className="flex items-center gap-3 flex-wrap">
            {timelineSteps.map((step, i) => (
              <div key={i} className="flex items-center gap-2">
                <TimelineStep {...step} />
                {i < timelineSteps.length - 1 && (
                  <ArrowRight className="w-3.5 h-3.5 text-gray-300 shrink-0" />
                )}
              </div>
            ))}
          </div>
        </FormSection>

        {/* General Info */}
        <FormSection
          title="Chi tiết Yêu cầu trả hàng mua"
          icon={<CornerUpLeft className="w-4 h-4" />}
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <p className="text-xs text-gray-500 mb-1">Số PRA</p>
              <p className="text-sm font-semibold text-gray-900">
                {pra.pra_no}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-1">Nhà cung cấp</p>
              <p className="text-sm text-gray-800">
                {pra.supplier?.name ?? "—"}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-1">Loại trả hàng</p>
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700">
                {RETURN_TYPE_LABELS[pra.return_type] ?? pra.return_type}
              </span>
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-1">Tổng giá trị trả hàng</p>
              <p className="text-sm font-bold text-orange-600">
                {formatVND(pra.total_return_amount)}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-1">Người tạo</p>
              <p className="text-sm text-gray-800">
                {pra.creator?.full_name ?? "—"}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-1">Thời gian tạo</p>
              <p className="text-sm text-gray-800">
                {new Date(pra.created_at).toLocaleDateString("vi-VN")}
              </p>
            </div>
            {pra.submitted_at && (
              <div>
                <p className="text-xs text-gray-500 mb-1">Thời gian nộp</p>
                <p className="text-sm text-gray-800">
                  {new Date(pra.submitted_at).toLocaleDateString("vi-VN")}
                </p>
              </div>
            )}
            {pra.approved_at && (
              <div>
                <p className="text-xs text-gray-500 mb-1">Thời gian phê duyệt</p>
                <p className="text-sm text-gray-800">
                  {new Date(pra.approved_at).toLocaleDateString("vi-VN")}
                </p>
              </div>
            )}
          </div>

          {/* Reason */}
          <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-md">
            <p className="text-xs font-semibold text-amber-700 mb-1">
              Lý do trả hàng
            </p>
            <p className="text-sm text-amber-800">{pra.reason}</p>
          </div>

          {pra.reject_reason && (
            <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-xs font-semibold text-red-700 mb-1">
                Lý do từ chối
              </p>
              <p className="text-sm text-red-800">{pra.reject_reason}</p>
            </div>
          )}

          {pra.notes && (
            <div className="mt-3">
              <p className="text-xs text-gray-500 mb-1">Ghi chú</p>
              <p className="text-sm text-gray-700 whitespace-pre-wrap">
                {pra.notes}
              </p>
            </div>
          )}
        </FormSection>
      </StandardFormLayout>

      <ActionConfirmModal
        isOpen={modal === "submit"}
        onClose={() => setModal(null)}
        onConfirm={() => handleAction("submit")}
        title="Nộp PRA phê duyệt"
        description={`Nộp yêu cầu ${pra.pra_no} để quản lý phê duyệt?`}
        confirmText="Nộp duyệt"
        variant="primary"
        loading={actionLoading}
      />
      <ActionConfirmModal
        isOpen={modal === "approve"}
        onClose={() => setModal(null)}
        onConfirm={() => handleAction("approve")}
        title="Phê duyệt PRA"
        description={`Phê duyệt yêu cầu trả hàng ${pra.pra_no}?`}
        confirmText="Phê duyệt"
        variant="success"
        loading={actionLoading}
      />
      <ActionConfirmModal
        isOpen={modal === "reject"}
        onClose={() => setModal(null)}
        onConfirm={(reason) => handleAction("reject", reason)}
        title="Từ chối PRA"
        description={`Từ chối yêu cầu trả hàng ${pra.pra_no}?`}
        confirmText="Từ chối"
        variant="danger"
        requireReason
        reasonLabel="Lý do từ chối"
        loading={actionLoading}
      />
    </>
  );
}
