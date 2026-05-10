import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-toastify";
import {
  CornerUpLeft,
  CheckCircle,
  XCircle,
  Clock,
  ArrowRight,
} from "lucide-react";
import { RootState, AppDispatch } from "../../../../store/store";
import {
  fetchPraByIdThunk,
  submitPraThunk,
  approvePraThunk,
  rejectPraThunk,
} from "../../store/purchaseReturn";
import { StatusBadge } from "../../../../components/common";
import { ActionConfirmModal } from "../../../../components/common";
import { StandardFormLayout } from "../../../../components/layout/StandardFormLayout";
import { FormSection } from "../../../../components/layout/FormSection";
import { formatVND } from "@/utils/currency.helper";
import { Roles } from "@/types/enum";

const RETURN_TYPE_LABELS: Record<string, string> = {
  refund: "Refund (NCC hoàn tiền)",
  replacement: "Replacement (Đổi hàng)",
  debit_note: "Debit Note (Trừ công nợ)",
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
  }, [id, dispatch]);

  const handleAction = async (action: typeof modal, reason?: string) => {
    if (!pra) return;
    try {
      switch (action) {
        case "submit":
          await dispatch(submitPraThunk(pra.id)).unwrap();
          toast.success("PRA submitted for approval");
          break;
        case "approve":
          await dispatch(approvePraThunk(pra.id)).unwrap();
          toast.success("PRA approved");
          break;
        case "reject":
          await dispatch(
            rejectPraThunk({ id: pra.id, reason: reason ?? "" }),
          ).unwrap();
          toast.success("PRA rejected");
          break;
      }
      setModal(null);
    } catch (e: any) {
      toast.error(e);
    }
  };

  const buildActions = () => {
    if (!pra) return [];
    const base = [
      {
        label: "Back",
        variant: "outline" as const,
        onClick: () => navigate("/purchase/return-authorizations"),
      },
    ];
    if (pra.status === "draft" && role === Roles.PURCHASE) {
      base.push({
        label: "Submit",
        variant: "primary" as const,
        onClick: () => setModal("submit"),
      });
    }
    if (
      pra.approval_status === "waiting_approval" &&
      (role === Roles.PURCHASEMANAGER || role === Roles.CHACC)
    ) {
      base.push({
        label: "Approve",
        variant: "success" as const,
        onClick: () => setModal("approve"),
      });
      base.push({
        label: "Reject",
        variant: "danger" as const,
        onClick: () => setModal("reject"),
      });
    }
    if (pra.status === "approved") {
      base.push({
        label: "Create Return",
        variant: "primary" as const,
        onClick: () => navigate(`/purchase/returns/create?pra_id=${pra.id}`),
      });
    }
    return base;
  };

  if (loading || !pra) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-6 h-6 border-2 border-orange-200 border-t-orange-500 rounded-full animate-spin" />
      </div>
    );
  }

  const timelineSteps = [
    { label: "PRA Created", done: true, active: false },
    {
      label: "Submitted",
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
      label: "Approved",
      done: ["approved", "processing", "completed"].includes(pra.status),
      active: pra.status === "approved",
    },
    {
      label: "Processing",
      done: ["completed"].includes(pra.status),
      active: pra.status === "processing",
    },
    { label: "Completed", done: pra.status === "completed", active: false },
  ];

  return (
    <>
      <StandardFormLayout
        title={pra.pra_no}
        statusBadge={<StatusBadge status={pra.status} />}
        actions={buildActions()}
      >
        {/* Timeline */}
        <FormSection title="Progress" icon={<Clock className="w-4 h-4" />}>
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
          title="Return Authorization Details"
          icon={<CornerUpLeft className="w-4 h-4" />}
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <p className="text-xs text-gray-500 mb-1">PRA No</p>
              <p className="text-sm font-semibold text-gray-900">
                {pra.pra_no}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-1">Supplier</p>
              <p className="text-sm text-gray-800">
                {pra.supplier?.name ?? "—"}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-1">Return Type</p>
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700">
                {RETURN_TYPE_LABELS[pra.return_type] ?? pra.return_type}
              </span>
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-1">Total Return Amount</p>
              <p className="text-sm font-bold text-orange-600">
                {formatVND(pra.total_return_amount)}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-1">Created By</p>
              <p className="text-sm text-gray-800">
                {pra.creator?.full_name ?? "—"}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-1">Created At</p>
              <p className="text-sm text-gray-800">
                {new Date(pra.created_at).toLocaleDateString("vi-VN")}
              </p>
            </div>
            {pra.submitted_at && (
              <div>
                <p className="text-xs text-gray-500 mb-1">Submitted At</p>
                <p className="text-sm text-gray-800">
                  {new Date(pra.submitted_at).toLocaleDateString("vi-VN")}
                </p>
              </div>
            )}
            {pra.approved_at && (
              <div>
                <p className="text-xs text-gray-500 mb-1">Approved At</p>
                <p className="text-sm text-gray-800">
                  {new Date(pra.approved_at).toLocaleDateString("vi-VN")}
                </p>
              </div>
            )}
          </div>

          {/* Reason */}
          <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-md">
            <p className="text-xs font-semibold text-amber-700 mb-1">
              Return Reason
            </p>
            <p className="text-sm text-amber-800">{pra.reason}</p>
          </div>

          {pra.reject_reason && (
            <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-xs font-semibold text-red-700 mb-1">
                Reject Reason
              </p>
              <p className="text-sm text-red-800">{pra.reject_reason}</p>
            </div>
          )}

          {pra.notes && (
            <div className="mt-3">
              <p className="text-xs text-gray-500 mb-1">Notes</p>
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
        title="Submit PRA for Approval"
        description={`Submit ${pra.pra_no} for manager approval?`}
        confirmText="Submit"
        variant="primary"
        loading={actionLoading}
      />
      <ActionConfirmModal
        isOpen={modal === "approve"}
        onClose={() => setModal(null)}
        onConfirm={() => handleAction("approve")}
        title="Approve PRA"
        description={`Approve return authorization ${pra.pra_no}?`}
        confirmText="Approve"
        variant="success"
        loading={actionLoading}
      />
      <ActionConfirmModal
        isOpen={modal === "reject"}
        onClose={() => setModal(null)}
        onConfirm={(reason) => handleAction("reject", reason)}
        title="Reject PRA"
        description={`Reject return authorization ${pra.pra_no}?`}
        confirmText="Reject"
        variant="danger"
        requireReason
        reasonLabel="Reject Reason"
        loading={actionLoading}
      />
    </>
  );
}
