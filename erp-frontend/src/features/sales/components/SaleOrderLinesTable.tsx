
import { SaleOrderLineDto } from "../dto/saleOrder.dto";
import { Product } from "@/features/products/store/product.types";

type LineFieldValue = string | number;

interface Props {
  lines: SaleOrderLineDto[];
  products: Product[];

  onAddLine: () => void;
  onRemoveLine: (index: number) => void;
  onUpdateLine: (
    index: number,
    field: keyof SaleOrderLineDto,
    value: LineFieldValue
  ) => void;

  calcLine: (
    line: SaleOrderLineDto
  ) => { lineTotal: number; taxAmount: number; final: number };
}

export default function SaleOrderLinesTable({
  lines,
  products,
  onAddLine,
  onRemoveLine,
  onUpdateLine,
  calcLine,
}: Props) {
    function formatVND(value: number | undefined | null) {
  if (value == null) return "0 đ";

  // bỏ phần .00 nhưng giữ số lẻ nếu có
  const intValue = Number(value);
  const hasDecimal = intValue % 1 !== 0;

  if (!hasDecimal) {
    return intValue.toLocaleString("vi-VN") + " đ";
  }

  // giữ thập phân khi thực sự có
  return intValue.toLocaleString("vi-VN", { minimumFractionDigits: 0 }) + " đ";
}


  return (
    <div className="rounded-lg border shadow-sm bg-white overflow-hidden mb-6">

      <table className="w-full text-sm">
        <thead className="bg-gray-50 text-gray-700">
          <tr>
            <th className="p-3">Image</th>
            <th className="p-3 text-left">Product</th>
            <th className="p-3 text-left">Qty</th>
            <th className="p-3 text-left">Unit Price</th>
            <th className="p-3 text-left">Total</th>
            <th className="p-3 text-right">Actions</th>
          </tr>
        </thead>

        <tbody>
          {lines.map((line, index) => {
            const product = products.find((p) => p.id === line.product_id);
            const c = calcLine(line);

            return (
              <tr key={index} className="border-t hover:bg-gray-50">

                {/* IMAGE */}
                <td className="p-3 w-16">
                  {product?.image_url ? (
                    <img
                      src={product.image_url}
                      alt={product.name}
                      className="w-12 h-12 rounded object-cover border"
                    />
                  ) : (
                    <div className="w-12 h-12 bg-gray-200 rounded" />
                  )}
                </td>

                {/* PRODUCT */}
                <td className="p-3">
                  <select
                    value={line.product_id}
                    onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                      onUpdateLine(index, "product_id", Number(e.target.value))
                    }
                    className="border rounded px-2 py-1 w-full"
                  >
                    <option value={0}>Select product…</option>
                    {products.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </td>

                {/* QTY */}
                <td className="p-3">
                  <input
                    type="number"
                    min={1}
                    value={line.quantity}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      onUpdateLine(index, "quantity", Number(e.target.value))
                    }
                    className="border rounded px-2 py-1 w-20"
                  />
                </td>

                {/* UNIT PRICE */}
                <td className="p-3">
                  <span className="px-2 py-1 w-28 inline-block">
                    {formatVND(line.unit_price)}
                  </span>
                </td>
              
                {/* TOTAL */}
                <td className="p-3 font-medium">{c.final.toLocaleString()} ₫</td>

                {/* DELETE */}
                <td className="p-3 text-right">
                  <button
                    onClick={() => onRemoveLine(index)}
                    className="px-2 py-1 border rounded text-red-600 hover:bg-red-50"
                  >
                    Delete
                  </button>
                </td>

              </tr>
            );
          })}
        </tbody>
      </table>

      {/* ADD LINE */}
      <div className="p-3 border-t">
        <button
          onClick={onAddLine}
          className="px-3 py-2 border rounded hover:bg-gray-100"
        >
          + Add Line
        </button>
      </div>
    </div>
  );
}
