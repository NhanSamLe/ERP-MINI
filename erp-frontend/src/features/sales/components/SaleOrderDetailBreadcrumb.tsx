
import { ChevronRight } from "lucide-react";

interface Props {
  orderNo: string;
}

export default function SaleOrderDetailBreadcrumb({ orderNo }: Props) {
  return (
    <div className="flex items-center gap-2 text-gray-500 mb-6">
      <span>Bán hàng</span>
      <ChevronRight size={16} />
      <span>Đơn hàng</span>
      <ChevronRight size={16} />
      <span className="text-gray-900 font-medium">{orderNo}</span>
    </div>
  );
}
