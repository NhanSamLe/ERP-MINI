import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "../../../store/store";
import { fetchWarehousesThunk } from "../store/stock/warehouse/warehouse.thunks";
import { fetchProductsThunkAllStatus } from "../../products/store";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "../../../components/ui/Select";
import { Download, ChevronDown, ChevronRight, PackageSearch, TrendingUp, CircleDollarSign, Layers } from "lucide-react";
import { exportExcelReport } from "@/utils/excel/exportExcelReport";
import { toast } from "react-toastify";
import { stockBalanceApi } from "../api/stockBalance.api";
import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

interface GroupedBalance {
  warehouse_id: number;
  product_id: number;
  warehouse: { id: number; name: string };
  product: { id: number; name: string; sku: string; image_url?: string };
  total_quantity: number;
  total_value: number;
  unit_cost: number;
  lots: Array<{
    lot_id: number | null;
    lot_no?: string;
    expiry_date?: string;
    manufacture_date?: string;
    serial_no?: string;
    quantity: number;
    unit_cost: number;
    location_id?: number | null;
  }>;
  created_at: string;
  updated_at: string;
}

export default function StockBalancePages() {
  const dispatch = useDispatch<AppDispatch>();

  const warehouses = useSelector((state: RootState) => state.warehouse.items);
  const products = useSelector((state: RootState) => state.product.items);
  const user = useSelector((state: RootState) => state.auth.user);

  const [warehouseId, setWarehouseId] = useState<string>("");
  const [productId, setProductId] = useState<string>("");
  const [data, setData] = useState<GroupedBalance[]>([]);
  const [loading, setLoading] = useState(false);
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  useEffect(() => {
    dispatch(fetchWarehousesThunk());
    dispatch(fetchProductsThunkAllStatus());
  }, [dispatch]);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const params: any = {};
        if (warehouseId) params.warehouse_id = Number(warehouseId);
        if (productId) params.product_id = Number(productId);
        const result = await stockBalanceApi.getGrouped(params);
        setData(result ?? []);
      } catch (err) {
        console.error(err);
        toast.error("Lỗi tải dữ liệu tồn kho");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [warehouseId, productId]);

  const toggleExpand = (key: string) => {
    setExpandedRows((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const handleExport = async () => {
    try {
      await exportExcelReport({
        title: "BÁO CÁO TỒN KHO (STOCK ON HAND)",
        columns: [
          {
            header: "Kho",
            key: "warehouse",
            width: 20,
            formatter: (val: any) => val?.name || "-",
          },
          {
            header: "Sản phẩm",
            key: "product",
            width: 30,
            formatter: (val: any) => val?.name || "-",
          },
          {
            header: "Số lượng tồn",
            key: "total_quantity",
            width: 15,
            align: "right",
          },
          {
            header: "Cập nhật lần cuối",
            key: "updated_at",
            width: 20,
            formatter: (val: any) =>
              val ? new Date(String(val)).toLocaleDateString("vi-VN") : "",
          },
        ],
        data,
        fileName: `Bao_Cao_Ton_Kho_${new Date().getTime()}.xlsx`,
        footer: { creator: user?.full_name || "Admin" },
      });
    } catch (err) {
      console.error(err);
      toast.error("Lỗi xuất báo cáo Excel");
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-orange-50 border border-orange-100 flex items-center justify-center text-orange-500 shadow-sm">
            <PackageSearch className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Stock Balances</h1>
            <p className="text-gray-500 text-sm mt-0.5">
              Monitor and analyze stock on hand, valuation, and lot-level breakdowns
            </p>
          </div>
        </div>

        <Button
          onClick={handleExport}
          variant="outline"
          leftIcon={<Download className="w-4 h-4" />}
          size="md"
          className="self-end sm:self-auto"
        >
          Export Excel
        </Button>
      </div>

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 flex items-center gap-3.5 transition duration-300 hover:-translate-y-0.5 hover:shadow-md">
          <div className="w-10 h-10 rounded-xl bg-orange-50 border border-orange-100 flex items-center justify-center text-orange-500 shrink-0">
            <PackageSearch className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Stock Products</p>
            <p className="text-lg font-extrabold text-slate-850 mt-0.5">{data.length}</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 flex items-center gap-3.5 transition duration-300 hover:-translate-y-0.5 hover:shadow-md">
          <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-500 shrink-0">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Quantity</p>
            <p className="text-lg font-extrabold text-slate-850 mt-0.5">
              {data.reduce((s, x) => s + Number(x.total_quantity), 0).toLocaleString("vi-VN", { maximumFractionDigits: 2 })}
            </p>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 flex items-center gap-3.5 transition duration-300 hover:-translate-y-0.5 hover:shadow-md">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-500 shrink-0">
            <CircleDollarSign className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Valuation</p>
            <p className="text-lg font-extrabold text-indigo-600 mt-0.5">
              {data.reduce((s, x) => s + Number(x.total_value), 0).toLocaleString("vi-VN")} ₫
            </p>
          </div>
        </div>
      </div>

      {/* Main Content Card */}
      <Card className="border-slate-100 shadow-sm overflow-hidden bg-white/80 backdrop-blur-md">
        {/* Filter header */}
        <div className="p-5 border-b border-slate-100 bg-slate-50/10 flex flex-col sm:flex-row items-center gap-4">
          <div className="flex flex-wrap items-center gap-3 w-full">
            <Select value={warehouseId} onValueChange={setWarehouseId}>
              <SelectTrigger className="w-full sm:w-[220px] h-10 bg-white border-slate-200 focus:ring-orange-500 focus:border-orange-500 rounded-lg">
                <SelectValue placeholder="All Warehouses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Warehouses</SelectItem>
                {warehouses.map((w) => (
                  <SelectItem key={w.id} value={String(w.id)}>
                    {w.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={productId} onValueChange={setProductId}>
              <SelectTrigger className="w-full sm:w-[260px] h-10 bg-white border-slate-200 focus:ring-orange-500 focus:border-orange-500 rounded-lg">
                <SelectValue placeholder="All Products" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Products</SelectItem>
                {products.map((p) => (
                  <SelectItem key={p.id} value={String(p.id)}>
                    {p.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50/80 text-[10px] uppercase tracking-wider font-bold text-slate-500 border-b border-slate-100">
              <tr>
                <th className="px-6 py-3 text-left w-10"></th>
                <th className="px-6 py-3 text-left">Warehouse</th>
                <th className="px-6 py-3 text-left">Product</th>
                <th className="px-6 py-3 text-right">Total Qty</th>
                <th className="px-6 py-3 text-right">Unit Cost</th>
                <th className="px-6 py-3 text-right">Total Value</th>
                <th className="px-6 py-3 text-left">Updated At</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="text-center py-16 text-slate-400">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-8 h-8 border-3 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
                      <span className="text-xs font-medium">Loading stock balances...</span>
                    </div>
                  </td>
                </tr>
              ) : data.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-16 text-slate-400 italic">
                    No stock data available
                  </td>
                </tr>
              ) : (
                data.map((row) => {
                  const key = `${row.warehouse_id}_${row.product_id}`;
                  const isExpanded = expandedRows.has(key);
                  const hasLots = row.lots.length > 0;

                  return (
                    <span key={key} className="contents">
                      {/* Main row */}
                      <tr
                        className={`hover:bg-slate-50/40 transition-colors ${hasLots ? "cursor-pointer" : ""}`}
                        onClick={() => hasLots && toggleExpand(key)}
                      >
                        <td className="px-6 py-3.5 text-slate-400 text-center">
                          {hasLots ? (
                            isExpanded ? (
                              <ChevronDown className="w-4 h-4 text-orange-500" />
                            ) : (
                              <ChevronRight className="w-4 h-4" />
                            )
                          ) : null}
                        </td>
                        <td className="px-6 py-3.5 font-semibold text-slate-700">
                          {row.warehouse?.name ?? "N/A"}
                        </td>
                        <td className="px-6 py-3.5">
                          <div className="flex items-center gap-3">
                            {row.product?.image_url && (
                              <img
                                src={row.product.image_url}
                                className="w-10 h-10 rounded-lg border border-slate-100 object-cover shadow-sm bg-slate-50"
                              />
                            )}
                            <div>
                              <div className="font-semibold text-slate-800">
                                {row.product?.name ?? "N/A"}
                              </div>
                              <div className="text-[10px] font-bold font-mono tracking-wide text-slate-400 uppercase mt-0.5">
                                {row.product?.sku}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-3.5 text-right font-bold text-slate-800">
                          {Number(row.total_quantity).toLocaleString("vi-VN", {
                            maximumFractionDigits: 3,
                          })}
                        </td>
                        <td className="px-6 py-3.5 text-right font-mono text-slate-600">
                          {Number(row.unit_cost).toLocaleString("vi-VN")}
                        </td>
                        <td className="px-6 py-3.5 text-right font-bold text-indigo-600 bg-indigo-50/10">
                          {Number(row.total_value).toLocaleString("vi-VN")}
                        </td>
                        <td className="px-6 py-3.5 text-slate-500 text-xs font-medium">
                          {row.updated_at
                            ? new Date(row.updated_at).toLocaleString("vi-VN")
                            : "N/A"}
                        </td>
                      </tr>

                      {/* Lot detail rows */}
                      {isExpanded &&
                        row.lots.map((lot, idx) => (
                          <tr
                            key={`${key}_lot_${idx}`}
                            className="bg-indigo-50/30 border-t border-indigo-100/40"
                          >
                            <td className="px-6 py-2.5"></td>
                            <td className="px-6 py-2.5 text-xs text-indigo-500 font-bold uppercase tracking-wider pl-8">
                              ↳ Lot Breakdown
                            </td>
                            <td className="px-6 py-2.5 text-xs text-slate-700 font-medium">
                              <div className="flex flex-wrap items-center gap-3">
                                <span className="font-mono bg-indigo-100/60 text-indigo-800 px-2 py-0.5 rounded font-bold">
                                  {lot.lot_no ?? "No Lot"}
                                </span>
                                {lot.expiry_date && (
                                  <span className="text-rose-600 font-bold text-[10px] bg-rose-50 border border-rose-100 px-1.5 py-0.5 rounded uppercase tracking-wide">
                                    Exp: {lot.expiry_date}
                                  </span>
                                )}
                                {lot.serial_no && (
                                  <span className="text-slate-500 text-[10px] bg-slate-100 px-1.5 py-0.5 rounded">
                                    S/N: {lot.serial_no}
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="px-6 py-2.5 text-right text-xs text-indigo-700 font-bold font-mono">
                              {Number(lot.quantity).toLocaleString("vi-VN", {
                                maximumFractionDigits: 3,
                              })}
                            </td>
                            <td className="px-6 py-2.5 text-right text-xs font-mono text-slate-500">
                              {Number(lot.unit_cost).toLocaleString("vi-VN")}
                            </td>
                            <td className="px-6 py-2.5 text-right text-xs font-bold font-mono text-indigo-600">
                              {Number(
                                lot.quantity * lot.unit_cost,
                              ).toLocaleString("vi-VN")}
                            </td>
                            <td className="px-6 py-2.5"></td>
                          </tr>
                        ))}
                    </span>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
