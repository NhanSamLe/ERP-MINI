
import { SaleOrderDto } from "../dto/saleOrder.dto";
import { User } from "../../../types/User";
import SaleOrderDetailBreadcrumb from "./SaleOrderDetailBreadcrumb";
import SaleOrderStatusCards from "./SaleOrderStatusCards";
import SaleOrderActionButtons from "./SaleOrderActionButtons";

interface Props {
  order: SaleOrderDto;
  user: User;
  onEdit: () => void;
  onSubmit: () => void;
  onApprove: () => void;
  onReject: () => void;
  onCreateInvoice: () => void;
}

export default function SaleOrderDetailHeader({
  order,
  user,
  onEdit,
  onSubmit,
  onApprove,
  onReject,
  onCreateInvoice
}: Props) {
  return (
    <div className="mb-8">
      <SaleOrderDetailBreadcrumb orderNo={order.order_no} />

      <div className="flex justify-between items-start mb-6">
        <div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            {order.order_no}
          </h1>
          <p className="text-gray-500">
            Order ID: <span className="text-gray-700 font-mono">#{order.id}</span>
          </p>
        </div>
        <SaleOrderActionButtons
          order={order}
          user={user}
          onEdit={onEdit}
          onSubmit={onSubmit}
          onApprove={onApprove}
          onReject={onReject}
          onCreateInvoice={onCreateInvoice}
        />
      </div>

      <SaleOrderStatusCards order={order} />  
      
    </div>
  );
}
