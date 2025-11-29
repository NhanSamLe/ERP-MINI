import React, { useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";

import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { fetchSaleOrderDetail, updateSaleOrder } from "../store/saleOrder.slice";
import { UpdateSaleOrderDto } from "../dto/saleOrder.dto";
import SaleOrderForm from "../components/SaleOrderForm";

export default function SaleOrderEditPage() {
  const { id } = useParams();
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const { selected: order, loading } = useAppSelector(
    (s) => s.saleOrder
  );
  const { user } = useAppSelector((s) => s.auth);

  // load order
  useEffect(() => {
    if (id) dispatch(fetchSaleOrderDetail(Number(id)));
  }, [dispatch, id]);

  if (loading || !order) return <p className="p-6">Loading…</p>;

  // =============================
  // PERMISSION CHECK
  // =============================

  const isOwner = order.created_by === user?.id;
  const isSales = user?.role.code === "SALES";
  const isDraft = order.approval_status === "draft";

  const allowEdit = isSales && isOwner && isDraft;

  if (!allowEdit) {
    return (
      <p className="p-6 text-red-600">
        You do not have permission to edit this order.
      </p>
    );
  }

  // =============================
  // HANDLE SUBMIT
  // =============================

  const handleUpdate = async (data: UpdateSaleOrderDto) => {
  const actionResult = await dispatch(
    updateSaleOrder({ id: order.id, data })
  );

  if (updateSaleOrder.fulfilled.match(actionResult)) {
    navigate(`/sales/orders/${order.id}`);
  }
};

  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold mb-6">
        Edit Sale Order #{order.order_no}
      </h1>

      <SaleOrderForm
        mode="edit"
        defaultValue={order}
        onSubmit={handleUpdate}
      />
    </div>
  );
}
