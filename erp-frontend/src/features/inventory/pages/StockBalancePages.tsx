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
import { Download, ChevronDown, ChevronRight } from "lucide-react";
import { exportExcelReport } from "@/utils/excel/exportExcelReport";
import { toast } from "react-toastify";
import { stockBalanceApi } from "../api/stockBalance.api";

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
    <div className="p-8">
      <div className="mb-6">
        <h2 className="text-2xl font-bold tracking-tight">Manage Stock</h2>
        <p className="text-gray-500">View and manage stock across warehouses</p>
      </div>

      <div className="flex items-center justify-between w-full gap-4 mb-4">
        <div className="flex items-center gap-3">
          <Select value={warehouseId} onValueChange={setWarehouseId}>
            <SelectTrigger className="min-w-[200px]">
              <SelectValue placeholder="Warehouse" />
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
            <SelectTrigger className="min-w-[200px]">
              <SelectValue placeholder="Product" />
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

        <button
          onClick={handleExport}
          className="flex items-center gap-2 bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 px-4 py-2 rounded-lg transition-colors text-sm font-medium"
        >
          <Download className="w-5 h-5" />
          Export Excel
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-4 py-3 text-left w-8"></th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">
                Warehouse
              </th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">
                Product
              </th>
              <th className="px-4 py-3 text-right font-medium text-gray-600">
                Total Qty
              </th>
              <th className="px-4 py-3 text-right font-medium text-gray-600">
                Unit Cost
              </th>
              <th className="px-4 py-3 text-right font-medium text-gray-600">
                Total Value
              </th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">
                Updated At
              </th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={7} className="text-center py-12 text-gray-400">
                  Loading...
                </td>
              </tr>
            ) : data.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center py-12 text-gray-400">
                  No stock data
                </td>
              </tr>
            ) : (
              data.map((row) => {
                const key = `${row.warehouse_id}_${row.product_id}`;
                const isExpanded = expandedRows.has(key);
                const hasLots = row.lots.length > 0;

                return (
                  <>
                    {/* Main row */}
                    <tr
                      key={key}
                      className={`border-t hover:bg-gray-50 ${hasLots ? "cursor-pointer" : ""}`}
                      onClick={() => hasLots && toggleExpand(key)}
                    >
                      <td className="px-4 py-3 text-gray-400">
                        {hasLots ? (
                          isExpanded ? (
                            <ChevronDown className="w-4 h-4" />
                          ) : (
                            <ChevronRight className="w-4 h-4" />
                          )
                        ) : null}
                      </td>
                      <td className="px-4 py-3 text-gray-700">
                        {row.warehouse?.name ?? "N/A"}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          {row.product?.image_url && (
                            <img
                              src={row.product.image_url}
                              className="w-9 h-9 rounded-md border object-cover"
                            />
                          )}
                          <div>
                            <div className="font-medium text-gray-800">
                              {row.product?.name ?? "N/A"}
                            </div>
                            <div className="text-xs text-gray-400">
                              {row.product?.sku}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right font-semibold text-gray-800">
                        {Number(row.total_quantity).toLocaleString("vi-VN", {
                          maximumFractionDigits: 3,
                        })}
                      </td>
                      <td className="px-4 py-3 text-right text-gray-600">
                        {Number(row.unit_cost).toLocaleString("vi-VN")}
                      </td>
                      <td className="px-4 py-3 text-right text-gray-600">
                        {Number(row.total_value).toLocaleString("vi-VN")}
                      </td>
                      <td className="px-4 py-3 text-gray-500 text-xs">
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
                          className="bg-blue-50 border-t border-blue-100"
                        >
                          <td className="px-4 py-2"></td>
                          <td className="px-4 py-2 text-xs text-gray-400 pl-8">
                            ↳ Lot
                          </td>
                          <td className="px-4 py-2 text-xs text-blue-700 font-mono">
                            {lot.lot_no ?? "No Lot"}
                            {lot.expiry_date && (
                              <span className="ml-2 text-gray-400">
                                exp: {lot.expiry_date}
                              </span>
                            )}
                            {lot.serial_no && (
                              <span className="ml-2 text-gray-400">
                                S/N: {lot.serial_no}
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-2 text-right text-xs text-blue-700 font-medium">
                            {Number(lot.quantity).toLocaleString("vi-VN", {
                              maximumFractionDigits: 3,
                            })}
                          </td>
                          <td className="px-4 py-2 text-right text-xs text-gray-500">
                            {Number(lot.unit_cost).toLocaleString("vi-VN")}
                          </td>
                          <td className="px-4 py-2 text-right text-xs text-gray-500">
                            {Number(
                              lot.quantity * lot.unit_cost,
                            ).toLocaleString("vi-VN")}
                          </td>
                          <td className="px-4 py-2"></td>
                        </tr>
                      ))}
                  </>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
