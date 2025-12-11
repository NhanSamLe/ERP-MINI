
import { SaleOrderDto } from "../dto/saleOrder.dto";

interface Props {
  order: SaleOrderDto;
}

export default function SaleOrderSummary({ order }: Props) {
  const formatVND = (value: number | string | undefined | null) => {
    if (!value) return "0 ₫";
    return `${parseFloat(String(value)).toLocaleString("vi-VN")} ₫`;
  };

  return (
    <div className="bg-gradient-to-br from-orange-50 to-orange-100 border border-orange-200 rounded-xl p-6">
      <h3 className="text-lg font-bold text-gray-900 mb-4">Order Summary</h3>
      <div className="space-y-3">
        <div className="flex justify-between">
          <span className="text-gray-700">Subtotal</span>
          <span className="font-semibold text-gray-900">
            {formatVND(order.total_before_tax)}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-700">Tax (VAT)</span>
          <span className="font-semibold text-green-700">
            {formatVND(order.total_tax)}
          </span>
        </div>
        <div className="pt-4 border-t border-orange-200 mt-4">
          <div className="flex justify-between items-center">
            <span className="font-bold text-gray-900 text-lg">Total</span>
            <span className="text-3xl font-black text-orange-600">
              {formatVND(order.total_after_tax)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}