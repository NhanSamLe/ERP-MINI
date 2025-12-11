
import { SaleOrderDto } from "../dto/saleOrder.dto";
import { User, Mail, Phone, MapPin } from "lucide-react";

interface Props {
  order: SaleOrderDto;
}

export default function SaleOrderCustomerInfo({ order }: Props) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
      <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
        <div className="w-1 h-6 bg-blue-600 rounded"></div>
        Customer Information
      </h3>
      <div className="grid grid-cols-2 gap-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <User size={16} className="text-gray-400" />
            <p className="text-gray-500 text-sm">Full Name</p>
          </div>
          <p className="text-gray-900 font-semibold">{order.customer?.name}</p>
        </div>
        <div>
          <p className="text-gray-500 text-sm mb-1">Tax Code</p>
          <p className="text-gray-900 font-semibold font-mono">
            {order.customer?.tax_code || "N/A"}
          </p>
        </div>
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Mail size={16} className="text-gray-400" />
            <p className="text-gray-500 text-sm">Email</p>
          </div>
          <p className="text-gray-900 font-semibold">{order.customer?.email}</p>
        </div>
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Phone size={16} className="text-gray-400" />
            <p className="text-gray-500 text-sm">Phone</p>
          </div>
          <p className="text-gray-900 font-semibold">{order.customer?.phone}</p>
        </div>
        <div className="col-span-2">
          <div className="flex items-center gap-2 mb-1">
            <MapPin size={16} className="text-gray-400" />
            <p className="text-gray-500 text-sm">Address</p>
          </div>
          <p className="text-gray-900 font-semibold">{order.customer?.address}</p>
        </div>
      </div>
    </div>
  );
}
