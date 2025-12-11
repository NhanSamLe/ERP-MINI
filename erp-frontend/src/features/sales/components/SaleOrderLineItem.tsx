
import { SaleOrderLineDto } from "../dto/saleOrder.dto";

interface Props {
  line: SaleOrderLineDto;
}

export default function SaleOrderLineItem({ line }: Props) {
  const formatVND = (value: number | string | undefined | null) => {
    if (!value) return "0 ₫";
    return `${parseFloat(String(value)).toLocaleString("vi-VN")} ₫`;
  };

  return (
    <tr className="border-b border-gray-200 hover:bg-gray-50 transition">
      <td className="px-6 py-4">
        <div className="flex items-center gap-4">
          {line.product?.image_url ? (
            <img
              src={line.product.image_url}
              alt={line.product?.name}
              className="w-12 h-12 rounded-lg object-cover border border-gray-200"
            />
          ) : (
            <div className="w-12 h-12 bg-gray-200 rounded-lg" />
          )}
          <div>
            <p className="text-gray-900 font-semibold">{line.product?.name}</p>
    
          </div>
        </div>
      </td>
      <td className="px-6 py-4 text-center text-gray-900 font-semibold">
        {parseFloat(String(line.quantity)).toFixed(2)}
      </td>
      <td className="px-6 py-4 text-right text-gray-900 font-semibold">
        {formatVND(line.unit_price)}
      </td>
      <td className="px-6 py-4 text-center">
        <span className="inline-block bg-green-100 text-green-800 px-3 py-1 rounded-lg text-xs font-semibold border border-green-200">
          {line.taxRate?.rate ?? 0}%
        </span>
      </td>
      <td className="px-6 py-4 text-right text-gray-900 font-bold text-lg">
        {formatVND(line.line_total_after_tax || line.line_total)}
      </td>
    </tr>
  );
}