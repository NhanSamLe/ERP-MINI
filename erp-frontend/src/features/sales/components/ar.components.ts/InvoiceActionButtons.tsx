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
  // Check if user has ACCOUNT role
const isAccountRole = user?.role?.code === "ACCOUNT";
const isApprovalRole = user?.role?.code === "CHACC";


  // ACCOUNT role: Only SUBMIT (khi invoice ở trạng thái draft)
  const canSubmit =
    isAccountRole &&
    invoice.approval_status === "draft" &&
    invoice.status === "draft";

  // CHACC role: APPROVE và REJECT (khi invoice ở trạng thái waiting_approval)
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
          Submit
        </button>
      )}

      {canApprove && (
        <button
          onClick={onApprove}
          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-medium"
        >
          Approve
        </button>
      )}

      {canReject && (
        <button
          onClick={onReject}
          className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition font-medium"
        >
          Reject
        </button>
      )}
    </div>
  );
}