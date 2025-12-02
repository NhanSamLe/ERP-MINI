import { SaleOrderDto } from "../../dto/saleOrder.dto";

interface Props {
  open: boolean;
  orders: SaleOrderDto[];
  onClose: () => void;
  onSelect: (orderId: number) => void;
}

export default function CreateInvoiceModal({
  open,
  orders,
  onClose,
  onSelect,
}: Props) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center">
      <div className="bg-white p-6 rounded shadow-xl w-[450px]">
        <h2 className="text-lg font-semibold mb-4">
          Create Invoice from Sale Order
        </h2>

        <ul className="max-h-72 overflow-auto border rounded">
          {orders.map((o) => (
            <li
              key={o.id}
              className="p-3 border-b hover:bg-orange-50 cursor-pointer"
              onClick={() => onSelect(o.id)}
            >
              <p className="font-semibold">{o.order_no}</p>
              <p className="text-sm text-gray-500">
                Customer: {o.customer?.name}
              </p>
            </li>
          ))}
        </ul>

        <button
          onClick={onClose}
          className="mt-4 w-full px-4 py-2 bg-gray-100 rounded"
        >
          Close
        </button>
      </div>
    </div>
  );
}
