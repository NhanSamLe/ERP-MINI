import { formatVND } from "@/utils/currency.helper";

interface Props {
  subtotal: number;
  tax: number;
  total: number;
}

export default function SaleOrderTotals({ subtotal, tax, total }: Props) {
  return (
    <div className="flex justify-end mb-10">
      <div className="text-right space-y-1 bg-white p-5 border rounded-lg shadow-sm">
        <p>
          Subtotal: <b>{formatVND(subtotal)}</b>
        </p>
        <p>
          Tax: <b>{formatVND(tax)}</b>
        </p>
        <p className="text-lg">
          Total:{" "}
          <b className="text-orange-600">{formatVND(total)}</b>
        </p>
      </div>
    </div>
  );
}
