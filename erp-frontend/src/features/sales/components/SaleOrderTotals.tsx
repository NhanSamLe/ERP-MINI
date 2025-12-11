

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
          Subtotal: <b>{subtotal.toLocaleString()} ₫</b>
        </p>
        <p>
          Tax: <b>{tax.toLocaleString()} ₫</b>
        </p>
        <p className="text-lg">
          Total:{" "}
          <b className="text-orange-600">{total.toLocaleString()} ₫</b>
        </p>
      </div>
    </div>
  );
}
