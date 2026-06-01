import { Package } from "lucide-react";
import { Product } from "@/features/products/store/product.types";
import { formatVND } from "@/utils/currency.helper";

/**
 * Shared renderItem component cho SearchSelectionModal khi chọn sản phẩm.
 * Dùng chung cho cả QuotationForm và SaleOrderForm.
 */
export default function ProductPickerItem({ p }: { p: Product }) {
  return (
    <div className="flex items-center gap-3">
      <div className="w-10 h-10 rounded-lg bg-gray-100 border border-gray-200 overflow-hidden shrink-0 flex items-center justify-center">
        {p.image_url
          ? <img src={p.image_url} alt="" className="w-full h-full object-cover" />
          : <Package className="w-5 h-5 text-gray-300" />}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="text-sm font-semibold text-gray-800 truncate">{p.name}</p>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-xs text-gray-500">SKU: {p.sku}</span>
              {p.uom?.code && (
                <span className="inline-flex px-1.5 py-0.5 rounded text-[10px] font-semibold bg-gray-100 text-gray-500">
                  {p.uom.code}
                </span>
              )}
              {p.taxRate && (
                <span className="inline-flex px-1.5 py-0.5 rounded text-[10px] font-semibold bg-blue-50 text-blue-600">
                  Tax {p.taxRate.rate}%
                </span>
              )}
            </div>
          </div>
          <div className="text-right shrink-0">
            <p className="text-sm font-bold text-orange-600">{formatVND(p.sale_price ?? 0)}</p>
            {p.min_stock_qty != null && (
              <p className="text-[10px] text-gray-400">Stock: {p.min_stock_qty}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
