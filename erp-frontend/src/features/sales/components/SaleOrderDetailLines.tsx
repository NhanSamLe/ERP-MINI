
import { SaleOrderDto } from "../dto/saleOrder.dto";
import SaleOrderLineItem from "./SaleOrderLineItem";
import SaleOrderSummary from "./SaleOrderSummary";

interface Props {
  order: SaleOrderDto;
}

export default function SaleOrderDetailLines({ order }: Props) {
  return (
    <div className="grid grid-cols-3 gap-6">
      <div className="col-span-2 bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
        <div className="p-6 border-b border-gray-200 bg-gray-50">
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <div className="w-1 h-6 bg-green-600 rounded"></div>
            Order Items
          </h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="px-6 py-4 text-left text-gray-700 font-semibold">
                  Product
                </th>
                <th className="px-6 py-4 text-center text-gray-700 font-semibold">
                  Quantity
                </th>
                <th className="px-6 py-4 text-right text-gray-700 font-semibold">
                  Unit Price
                </th>
                <th className="px-6 py-4 text-center text-gray-700 font-semibold">
                  Tax
                </th>
                <th className="px-6 py-4 text-right text-gray-700 font-semibold">
                  Total
                </th>
              </tr>
            </thead>
            <tbody>
              {order.lines?.map((line) => (
                <SaleOrderLineItem key={line.id} line={line} />
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="col-span-1">
        <SaleOrderSummary order={order} />
      </div>
    </div>
  );
}