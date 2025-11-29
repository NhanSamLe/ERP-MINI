import React from "react";
import { useAppDispatch } from "@/store/hooks";
import { createSaleOrder } from "@/features/sales/store/saleOrder.slice";
import SaleOrderForm from "../components/SaleOrderForm";
import { useNavigate } from "react-router-dom";
import { CreateSaleOrderDto } from "../dto/saleOrder.dto";
import { SaleOrderDto } from "../dto/saleOrder.dto";
import { unwrapResult } from "@reduxjs/toolkit";

export default function SaleOrderCreatePage() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const handleSubmit = async (data: CreateSaleOrderDto) => {
    try {
      // Dispatch typed thunk
      const actionResult = await dispatch(createSaleOrder(data));

      // Lấy kết quả type-safe (KHÔNG any)
      const createdOrder: SaleOrderDto = unwrapResult(actionResult);

      navigate(`/sales/orders/${createdOrder.id}`);
    } catch (err) {
      console.error("Failed to create order:", err);
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold mb-6">Create Sale Order</h1>
      <SaleOrderForm  mode="edit" onSubmit={handleSubmit} />
    </div>
  );
}
