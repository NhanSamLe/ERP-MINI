import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import SaleOrderDetailHeader from "../components/SaleOrderDetailHeader";
import SaleOrderDetailInfo from "../components/SaleOrderDetailInfo";
import SaleOrderDetailLines from "../components/SaleOrderDetailLines";
import { createInvoice } from "@/features/sales/store/invoice.slice";
import {
  fetchSaleOrderDetail,
  submitSaleOrder,
  approveSaleOrder,
  rejectSaleOrder,
} from "@/features/sales/store/saleOrder.slice";
import RejectReasonModal from "../components/RejectReasonModal";
import SubmitConfirmModal from "../components/SubmitConfirmModal";
import ApproveConfirmModal from "../components/ApproveConfirmModal";

export default function SaleOrderDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [submitModalOpen, setSubmitModalOpen] = useState(false);
  const [approveModalOpen, setApproveModalOpen] = useState(false);

  const { selected: order, loading } = useAppSelector(
    (state) => state.saleOrder
  );
  const { user } = useAppSelector((state) => state.auth);
  const handleCreateInvoice = async () => {
  if (!order || !order.id) {
    alert("Order không hợp lệ.");
    return;
  }

  try {
    const result = await dispatch(
      createInvoice({ order_id: order.id })
    ).unwrap();

    navigate(`/invoices/${result.id}`);
  } catch (err: unknown) {
  if (err instanceof Error) {
    alert(err.message);
  } else {
    alert("Hóa đơn đã tồn tại rồi, không cần tạo");
  }
}
 };
  useEffect(() => {
    if (id) dispatch(fetchSaleOrderDetail(Number(id)));
  }, [dispatch, id]);

  if (loading || !order) {
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
        <SaleOrderDetailHeader
          order={order}
          user={user}
          onEdit={() => navigate(`/sales/orders/${order.id}/edit`)}
          onSubmit={() => setSubmitModalOpen(true)}
          onApprove={() => setApproveModalOpen(true)}
          onReject={() => setRejectModalOpen(true)}
           onCreateInvoice={handleCreateInvoice}
        />

        {/* Info Section */}
        <SaleOrderDetailInfo order={order} />

        {/* Lines Section */}
        <SaleOrderDetailLines order={order} />

        {/* Modals */}
        <RejectReasonModal
          open={rejectModalOpen}
          onClose={() => setRejectModalOpen(false)}
          onConfirm={(reason) => {
            dispatch(rejectSaleOrder({ id: order.id, reason }));
            setRejectModalOpen(false);
          }}
        />

        <SubmitConfirmModal
          open={submitModalOpen}
          onClose={() => setSubmitModalOpen(false)}
          onConfirm={() => {
            dispatch(submitSaleOrder(order.id));
            setSubmitModalOpen(false);
          }}
        />

        <ApproveConfirmModal
          open={approveModalOpen}
          onClose={() => setApproveModalOpen(false)}
          onConfirm={() => {
            dispatch(approveSaleOrder(order.id));
            setApproveModalOpen(false);
          }}
        />
      </div>
    </div>
  );
}