import { useState, useMemo } from "react";
import { SaleOrderDto } from "../../dto/saleOrder.dto";
import { X, Search, FileText } from "lucide-react";
import { formatVND } from "@/utils/currency.helper";
import { formatDateTime } from "@/utils/time.helper";

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
  const [search, setSearch] = useState("");

  const filteredOrders = useMemo(() => {
    return orders.filter((o) =>
      o.order_no.toLowerCase().includes(search.toLowerCase()) ||
      o.customer?.name?.toLowerCase().includes(search.toLowerCase())
    );
  }, [orders, search]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
        {/* HEADER */}
        <div className="flex items-center justify-between p-4 border-b bg-gray-50">
          <div>
            <h2 className="text-lg font-bold text-gray-800">Create Invoice</h2>
            <p className="text-sm text-gray-500">Select a sale order to invoice</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-200 rounded-full transition"
          >
            <X size={20} />
          </button>
        </div>

        {/* SEARCH */}
        <div className="p-4 border-b">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Search order # or customer..."
              className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              autoFocus
            />
          </div>
        </div>

        {/* LIST */}
        <div className="flex-1 overflow-y-auto p-2 space-y-2 bg-gray-50">
          {filteredOrders.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-gray-500">
              <FileText size={48} className="opacity-20 mb-2" />
              <p>No available orders found</p>
            </div>
          ) : (
            filteredOrders.map((o) => (
              <div
                key={o.id}
                onClick={() => onSelect(o.id)}
                className="bg-white p-4 rounded-lg border border-gray-100 shadow-sm hover:border-orange-300 hover:shadow-md cursor-pointer transition group"
              >
                <div className="flex justify-between items-start mb-1">
                  <h3 className="font-bold text-gray-800 group-hover:text-orange-600 transition">
                    {o.order_no}
                  </h3>
                  <span className="font-semibold text-gray-900">
                    {formatVND(o.total_after_tax)}
                  </span>
                </div>

                <div className="flex justify-between items-end text-sm text-gray-500">
                  <div>
                    <p className="font-medium text-gray-700">{o.customer?.name}</p>
                    <p className="text-xs mt-0.5">{formatDateTime(o.order_date)}</p>
                  </div>
                  <span className="text-xs bg-green-50 text-green-700 px-2 py-0.5 rounded border border-green-100">
                    Ready to Invoice
                  </span>
                </div>
              </div>
            ))
          )}
        </div>

        {/* FOOTER */}
        <div className="p-4 border-t bg-white text-right">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg font-medium transition"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
