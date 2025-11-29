import React from "react";
import { SaleOrderDto } from "../dto/saleOrder.dto";
import SaleOrderCustomerInfo from "./SaleOrderCustomerInfo";
import SaleOrderStaffTimeline from "./SaleOrderStaffTimeline";

interface Props {
  order: SaleOrderDto;
}

export default function SaleOrderDetailInfo({ order }: Props) {
  return (
    <div className="grid grid-cols-3 gap-6 mb-6">
      <div className="col-span-2">
        <SaleOrderCustomerInfo order={order} />
      </div>
      <div className="col-span-1">
        <SaleOrderStaffTimeline order={order} />
      </div>
    </div>
  );
}