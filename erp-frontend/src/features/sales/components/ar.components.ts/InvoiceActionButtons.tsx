import { ArInvoiceDto } from "../../dto/invoice.dto";
import { User } from "@/types/User";

interface Props {
  invoice: ArInvoiceDto;
  user: User;
  onSubmit: () => void;
  onApprove: () => void;
  onReject: () => void;
}

export default function InvoiceActionButtons({
  invoice,
  user,
  onSubmit,
  onApprove,
  onReject,
}: Props) {
  const isAccountRole = user?.role?.code === "ACCOUNT";
  const isApprovalRole = user?.role?.code === "CHACC";

  const canSubmit =
    isAccountRole &&
    invoice.approval_status === "draft" &&
    invoice.status === "draft";

  const canApprove =
    isApprovalRole &&
    invoice.approval_status === "waiting_approval" &&
    invoice.status === "draft";

  const canReject =
    isApprovalRole &&
    invoice.approval_status === "waiting_approval" &&
    invoice.status === "draft";

  return (
    <div className="flex gap-3">
      {canSubmit && (
        <button
          onClick={onSubmit}
          className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition font-medium"
        >
          Trình duyệt
        </button>
      )}

      {canApprove && (
        <button
          onClick={onApprove}
          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-medium"
        >
          Phê duyệt
        </button>
      )}

      {canReject && (
        <button
          onClick={onReject}
          className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition font-medium"
        >
          Từ chối
        </button>
      )}
    </div>
  );
}
