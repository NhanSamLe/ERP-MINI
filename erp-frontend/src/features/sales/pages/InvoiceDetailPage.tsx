import  { useEffect, useState } from "react";
import { useParams} from "react-router-dom";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import InvoiceDetailHeader from "../components/ar.components.ts/InvoiceDetailHeader";
import InvoiceDetailInfo from "../components/ar.components.ts/InvoiceDetailInfo";
import InvoiceDetailLines from "../components/ar.components.ts/InvoiceDetailLines";
import {
  fetchInvoiceDetail,
  submitInvoice,
  approveInvoice,
  rejectInvoice,
} from "@/features/sales/store/invoice.slice";
import RejectReasonModal from "../components/RejectReasonModal";
import SubmitConfirmModal from "../components/SubmitConfirmModal";
import ApproveConfirmModal from "../components/ApproveConfirmModal";

export default function InvoiceDetailPage() {
  const { id } = useParams();
//   const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [submitModalOpen, setSubmitModalOpen] = useState(false);
  const [approveModalOpen, setApproveModalOpen] = useState(false);

  const { selected: invoice, loading } = useAppSelector(
    (state) => state.invoice
  );
  const { user } = useAppSelector((state) => state.auth);

  useEffect(() => {
    if (id) dispatch(fetchInvoiceDetail(Number(id)));
  }, [dispatch, id]);

  if (loading || !invoice) {
    return (
      <div className="min-h-screen bg-gray-50 p-6 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 text-lg">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 p-6 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 text-lg">No Permission</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <InvoiceDetailHeader
          invoice={invoice}
          user={user}
          onSubmit={() => setSubmitModalOpen(true)}
          onApprove={() => setApproveModalOpen(true)}
          onReject={() => setRejectModalOpen(true)}
        />

        {/* Info Section */}
        <InvoiceDetailInfo invoice={invoice} />

        {/* Lines Section */}
        <InvoiceDetailLines invoice={invoice} />

        {/* Modals */}
        <RejectReasonModal
          open={rejectModalOpen}
          onClose={() => setRejectModalOpen(false)}
          onConfirm={(reason) => {
            dispatch(rejectInvoice({ id: invoice.id, reason }));
            setRejectModalOpen(false);
          }}
        />

        <SubmitConfirmModal
          open={submitModalOpen}
          onClose={() => setSubmitModalOpen(false)}
          onConfirm={() => {
            dispatch(submitInvoice(invoice.id));
            setSubmitModalOpen(false);
          }}
        />

        <ApproveConfirmModal
          open={approveModalOpen}
          onClose={() => setApproveModalOpen(false)}
          onConfirm={async () => {
            await dispatch(approveInvoice(invoice.id));
            dispatch(fetchInvoiceDetail(invoice.id));
            setApproveModalOpen(false);
          }}
        />
      </div>
    </div>
  );
}
