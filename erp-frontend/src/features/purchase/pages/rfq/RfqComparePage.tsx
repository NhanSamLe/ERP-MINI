import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { ArrowLeft, Package, TrendingDown } from "lucide-react";
import { rfqApi, RfqCompareResult } from "../../api/rfq.api";
import { formatVND, formatQuantity } from "@/utils/currency.helper";

export default function RfqComparePage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [compareData, setCompareData] = useState<RfqCompareResult | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const idsParam = searchParams.get("ids");
    if (!idsParam) {
      toast.error("No RFQs selected for comparison");
      navigate("/purchase/rfqs");
      return;
    }

    const ids = idsParam.split(",").map(Number);
    if (ids.length < 2) {
      toast.error("Select at least 2 RFQs to compare");
      navigate("/purchase/rfqs");
      return;
    }

    loadCompareData(ids);
  }, [searchParams, navigate]);

  const loadCompareData = async (ids: number[]) => {
    try {
      setLoading(true);
      const data = await rfqApi.compare(ids);
      setCompareData(data);
    } catch (e: any) {
      toast.error(e?.message ?? "Failed to load comparison data");
      navigate("/purchase/rfqs");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-6 h-6 border-2 border-orange-200 border-t-orange-500 rounded-full animate-spin" />
      </div>
    );
  }

  if (!compareData || compareData.rfqs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3 text-gray-500">
        <Package className="w-10 h-10 text-gray-300" />
        <p className="text-sm font-medium">No comparison data available</p>
        <button
          onClick={() => navigate("/purchase/rfqs")}
          className="text-sm text-orange-600 hover:underline"
        >
          Back to RFQs
        </button>
      </div>
    );
  }

  const rfqs = compareData.rfqs;
  const products = compareData.products;

  // Find best price per unit (normalized by stock UOM)
  const getBestPrice = (productId: number) => {
    const product = products.find((p) => p.product_id === productId);
    if (!product) return null;

    let bestPrice = Infinity;
    let bestRfqId = null;

    Object.entries(product.by_rfq).forEach(([rfqId, data]: [string, any]) => {
      // Calculate unit price normalized by qty_in_stock_uom
      const qtyInStockUom = data.qty_in_stock_uom || data.quantity;
      const normalizedUnitPrice =
        qtyInStockUom > 0
          ? data.line_total_after_tax / qtyInStockUom
          : Infinity;

      if (normalizedUnitPrice < bestPrice) {
        bestPrice = normalizedUnitPrice;
        bestRfqId = Number(rfqId);
      }
    });

    return { price: bestPrice, rfqId: bestRfqId };
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate("/purchase/rfqs")}
                className="p-1.5 hover:bg-gray-100 rounded-md transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-gray-600" />
              </button>
              <div>
                <h1 className="text-xl font-bold text-gray-900">
                  Compare RFQ Quotations
                </h1>
                <p className="text-sm text-gray-500 mt-0.5">
                  {rfqs.length} quotations • {products.length} products
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-6 py-6">
        {/* RFQ Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {rfqs.map((rfq) => (
            <div
              key={rfq.id}
              className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => navigate(`/purchase/rfqs/${rfq.id}`)}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <p className="text-xs text-gray-500 mb-1">RFQ No</p>
                  <p className="font-semibold text-gray-900">{rfq.rfq_no}</p>
                </div>
                <span className="px-2 py-1 text-xs font-medium bg-orange-100 text-orange-700 rounded">
                  {rfq.status}
                </span>
              </div>

              <div className="space-y-2 text-sm">
                <div>
                  <p className="text-xs text-gray-500">Supplier</p>
                  <p className="text-gray-900 font-medium">
                    {rfq.supplier?.name ?? "—"}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-gray-500">Total</p>
                  <p className="text-lg font-bold text-orange-600">
                    {formatVND(rfq.total_after_tax)}
                  </p>
                </div>

                {rfq.valid_until && (
                  <div>
                    <p className="text-xs text-gray-500">Valid Until</p>
                    <p className="text-gray-900">
                      {new Date(rfq.valid_until).toLocaleDateString("vi-VN")}
                    </p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Info Box */}
        <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-900">
            <strong>📌 Note:</strong> Prices are normalized by stock unit of
            measure (UOM) for accurate comparison. If RFQs have different
            quantities, "Cost/unit" shows the price per standard unit for fair
            comparison.
          </p>
        </div>

        {/* Comparison Table */}
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  <th className="px-6 py-3 text-left font-semibold text-gray-900 sticky left-0 bg-gray-50 z-10">
                    Product
                  </th>
                  <th className="px-6 py-3 text-left font-semibold text-gray-900">
                    Qty Requested
                  </th>
                  <th className="px-6 py-3 text-left font-semibold text-gray-900">
                    UOM
                  </th>
                  {rfqs.map((rfq) => (
                    <th
                      key={rfq.id}
                      className="px-6 py-3 text-center font-semibold text-gray-900 min-w-[200px]"
                    >
                      <div className="text-xs text-gray-500 mb-1">
                        {rfq.supplier?.name}
                      </div>
                      <div className="text-sm font-bold text-gray-900">
                        {rfq.rfq_no}
                      </div>
                    </th>
                  ))}
                  <th className="px-6 py-3 text-center font-semibold text-gray-900 bg-green-50">
                    <div className="flex items-center justify-center gap-1">
                      <TrendingDown className="w-4 h-4 text-green-600" />
                      <span>Best Price</span>
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {products.map((product) => {
                  const bestPrice = getBestPrice(product.product_id);
                  return (
                    <tr key={product.product_id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 font-medium text-gray-900 sticky left-0 bg-white hover:bg-gray-50 z-10">
                        {product.product_name}
                      </td>
                      <td className="px-6 py-4 text-gray-600">
                        {formatQuantity(product.by_rfq[rfqs[0].id]?.quantity)}
                      </td>
                      <td className="px-6 py-4 text-gray-600">
                        {/* Assuming RFQ API returns uom in the by_rfq data */}
                        {(product.by_rfq[rfqs[0].id] as any)?.uom?.name ?? "—"}
                      </td>

                      {rfqs.map((rfq) => {
                        const lineData = product.by_rfq[rfq.id];
                        const isBest = bestPrice && bestPrice.rfqId === rfq.id;
                        const qtyInStockUom =
                          lineData?.qty_in_stock_uom || lineData?.quantity;
                        const costPerUnit =
                          qtyInStockUom > 0
                            ? lineData?.line_total_after_tax / qtyInStockUom
                            : 0;

                        return (
                          <td
                            key={rfq.id}
                            className={`px-6 py-4 text-center ${
                              isBest ? "bg-green-50" : ""
                            }`}
                          >
                            {lineData ? (
                              <div className="space-y-1">
                                <div className="font-semibold text-gray-900">
                                  {formatVND(lineData.unit_price)}
                                </div>
                                {lineData.discount_percent > 0 && (
                                  <div className="text-xs text-red-600">
                                    -{lineData.discount_percent}%
                                  </div>
                                )}
                                <div className="text-xs text-gray-500">
                                  Cost/unit: {formatVND(costPerUnit)}
                                </div>
                                <div className="text-xs text-gray-500">
                                  Total:{" "}
                                  {formatVND(lineData.line_total_after_tax)}
                                </div>
                                {lineData.lead_time_days && (
                                  <div className="text-xs text-gray-500">
                                    Lead: {lineData.lead_time_days}d
                                  </div>
                                )}
                              </div>
                            ) : (
                              <span className="text-gray-400">—</span>
                            )}
                          </td>
                        );
                      })}

                      <td className="px-6 py-4 text-center bg-green-50 font-bold text-green-700">
                        {bestPrice ? `${formatVND(bestPrice.price)}/unit` : "—"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>

              {/* Summary Row */}
              <tfoot className="border-t-2 border-gray-300 bg-gray-50">
                <tr>
                  <td colSpan={2} className="px-6 py-4 font-bold text-gray-900">
                    Total Amount
                  </td>
                  <td className="px-6 py-4 text-xs text-gray-500 italic">
                    (as quoted, not normalized)
                  </td>
                  {rfqs.map((rfq) => (
                    <td
                      key={rfq.id}
                      className="px-6 py-4 text-center font-bold text-lg text-orange-600"
                    >
                      {formatVND(rfq.total_after_tax)}
                    </td>
                  ))}
                  <td className="px-6 py-4 text-center font-bold text-lg text-green-700 bg-green-50">
                    {formatVND(Math.min(...rfqs.map((r) => r.total_after_tax)))}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <p className="text-xs text-gray-500 mb-2">Cheapest Supplier</p>
            <p className="text-lg font-bold text-gray-900">
              {rfqs.reduce((prev, current) =>
                prev.total_after_tax < current.total_after_tax ? prev : current,
              ).supplier?.name ?? "—"}
            </p>
            <p className="text-sm text-orange-600 font-semibold mt-1">
              {formatVND(Math.min(...rfqs.map((r) => r.total_after_tax)))}
            </p>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <p className="text-xs text-gray-500 mb-2">Most Expensive</p>
            <p className="text-lg font-bold text-gray-900">
              {rfqs.reduce((prev, current) =>
                prev.total_after_tax > current.total_after_tax ? prev : current,
              ).supplier?.name ?? "—"}
            </p>
            <p className="text-sm text-red-600 font-semibold mt-1">
              {formatVND(Math.max(...rfqs.map((r) => r.total_after_tax)))}
            </p>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <p className="text-xs text-gray-500 mb-2">Potential Savings</p>
            <p className="text-lg font-bold text-green-600">
              {formatVND(
                Math.max(...rfqs.map((r) => r.total_after_tax)) -
                  Math.min(...rfqs.map((r) => r.total_after_tax)),
              )}
            </p>
            <p className="text-sm text-gray-600 mt-1">
              {(
                ((Math.max(...rfqs.map((r) => r.total_after_tax)) -
                  Math.min(...rfqs.map((r) => r.total_after_tax))) /
                  Math.max(...rfqs.map((r) => r.total_after_tax))) *
                100
              ).toFixed(1)}
              % savings
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
