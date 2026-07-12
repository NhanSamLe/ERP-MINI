import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "../../../store/store";
import { fetchWarehousesThunk } from "../../inventory/store/stock/warehouse/warehouse.thunks";
import {
  inventoryReportApi,
  StockSummaryItem,
  StockValuation,
} from "../api/inventoryReport.api";
import axiosClient from "../../../api/axiosClient";
import { toast } from "react-toastify";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "../../../components/ui/Select";
import { Input } from "../../../components/ui/input";
import { Button } from "../../../components/ui/Button";
import { formatMoney } from "@/utils/currency.helper";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { Search } from "lucide-react";

const COLORS = [
  "#6366f1",
  "#8b5cf6",
  "#f59e0b",
  "#10b981",
  "#ef4444",
  "#3b82f6",
  "#ec4899",
  "#14b8a6",
  "#f97316",
  "#84cc16",
];

type TabType = "summary" | "valuation" | "movement";

export default function StockReportPage() {
  const dispatch = useDispatch<AppDispatch>();
  const warehouses = useSelector((state: RootState) => state.warehouse.items);

  const [tab, setTab] = useState<TabType>("summary");
  const [warehouseId, setWarehouseId] = useState("");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [recalculating, setRecalculating] = useState(false);

  const [summary, setSummary] = useState<StockSummaryItem[]>([]);
  const [valuation, setValuation] = useState<StockValuation | null>(null);
  const [movement, setMovement] = useState<any[]>([]);

  // Movement filters
  const [mvFrom, setMvFrom] = useState("");
  const [mvTo, setMvTo] = useState("");

  useEffect(() => {
    dispatch(fetchWarehousesThunk());
  }, [dispatch]);

  useEffect(() => {
    if (tab === "summary") loadSummary();
    if (tab === "valuation") loadValuation();
  }, [tab, warehouseId]);

  const loadSummary = async () => {
    setLoading(true);
    try {
      const data = await inventoryReportApi.getStockSummary({
        warehouseId: warehouseId ? Number(warehouseId) : undefined,
      });
      setSummary(data);
    } finally {
      setLoading(false);
    }
  };

  const loadValuation = async () => {
    setLoading(true);
    try {
      const data = await inventoryReportApi.getStockValuation({
        warehouseId: warehouseId ? Number(warehouseId) : undefined,
      });
      setValuation(data);
    } finally {
      setLoading(false);
    }
  };

  const loadMovement = async () => {
    setLoading(true);
    try {
      const data = await inventoryReportApi.getStockMovement({
        warehouseId: warehouseId ? Number(warehouseId) : undefined,
        from: mvFrom || undefined,
        to: mvTo || undefined,
      });
      setMovement(data);
    } finally {
      setLoading(false);
    }
  };

  const filteredSummary = summary.filter((s) => {
    if (!search) return true;
    const name = s.product?.name?.toLowerCase() ?? "";
    const sku = s.product?.sku?.toLowerCase() ?? "";
    return (
      name.includes(search.toLowerCase()) || sku.includes(search.toLowerCase())
    );
  });

  const tabs: { key: TabType; label: string }[] = [
    { key: "summary", label: "Tổng quan kho" },
    { key: "valuation", label: "Định giá tồn kho" },
    { key: "movement", label: "Biến động kho" },
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-6 md:p-8 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">
            Báo cáo kho
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Phân tích và báo cáo tồn kho
          </p>
        </div>
        <Button
          className="bg-gray-700 hover:bg-gray-800 text-white text-xs"
          onClick={async () => {
            setRecalculating(true);
            try {
              const res = await axiosClient.post(
                "/stock-balance/recalculate-costs",
              );
              toast.success(res.data.message);
              if (tab === "summary") loadSummary();
              if (tab === "valuation") loadValuation();
            } catch (e: any) {
              toast.error(e?.response?.data?.message ?? "Failed");
            } finally {
              setRecalculating(false);
            }
          }}
          disabled={recalculating}
        >
          {recalculating ? "Đang tính toán..." : "Tính lại giá vốn"}
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-white border border-gray-200 rounded-xl p-1 w-fit shadow-sm">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${tab === t.key
              ? "bg-indigo-600 text-white shadow"
              : "text-gray-600 hover:bg-gray-100"
              }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap items-end">
        <div>
          <label className="block text-xs text-gray-500 mb-1">Kho hàng</label>
          <Select value={warehouseId} onValueChange={setWarehouseId}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Tất cả kho hàng" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Tất cả</SelectItem>
              {warehouses.map((w) => (
                <SelectItem key={w.id} value={String(w.id)}>
                  {w.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {tab === "summary" && (
          <div className="relative">
            <label className="block text-xs text-gray-500 mb-1">Tìm kiếm</label>
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 w-4 h-4 text-gray-400" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Tên sản phẩm hoặc SKU..."
                className="pl-8 pr-3 py-2 border border-gray-200 rounded-lg text-sm w-56 focus:outline-none focus:ring-2 focus:ring-indigo-300"
              />
            </div>
          </div>
        )}

        {tab === "movement" && (
          <>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Từ ngày</label>
              <Input
                type="date"
                value={mvFrom}
                onChange={setMvFrom}
                className="w-40"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Đến ngày</label>
              <Input
                type="date"
                value={mvTo}
                onChange={setMvTo}
                className="w-40"
              />
            </div>
            <Button
              className="bg-indigo-600 hover:bg-indigo-700 text-white mt-4"
              onClick={loadMovement}
            >
              Tìm kiếm
            </Button>
          </>
        )}
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center h-48 text-gray-400">
          Đang tải...
        </div>
      ) : (
        <>
          {/* SUMMARY TAB */}
          {tab === "summary" && (
            <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-600">
                  <tr>
                    <th className="p-3 text-left">Sản phẩm</th>
                    <th className="p-3 text-left">SKU</th>
                    <th className="p-3 text-left">Danh mục</th>
                    <th className="p-3 text-left">Kho hàng</th>
                    <th className="p-3 text-left">Vị trí</th>
                    <th className="p-3 text-left">Lô hàng</th>
                    <th className="p-3 text-right">Số lượng</th>
                    <th className="p-3 text-right">Đơn giá vốn</th>
                    <th className="p-3 text-right">Tổng giá trị</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredSummary.length === 0 ? (
                    <tr>
                      <td
                        colSpan={9}
                        className="p-6 text-center text-gray-400 italic"
                      >
                        Không có dữ liệu
                      </td>
                    </tr>
                  ) : (
                    filteredSummary.map((item, idx) => (
                      <tr
                        key={item.id}
                        className={`border-t ${idx % 2 === 0 ? "bg-white" : "bg-gray-50"}`}
                      >
                        <td className="p-3 font-medium text-gray-800">
                          {item.product?.name}
                        </td>
                        <td className="p-3 font-mono text-xs text-gray-500">
                          {item.product?.sku}
                        </td>
                        <td className="p-3 text-xs text-gray-500">
                          {item.product?.category?.name ?? "—"}
                        </td>
                        <td className="p-3 text-gray-600">
                          {item.warehouse?.name}
                        </td>
                        <td className="p-3 text-xs">
                          {item.location ? (
                            <span className="px-2 py-0.5 rounded bg-gray-100 text-gray-700">
                              {item.location.code}
                            </span>
                          ) : (
                            "—"
                          )}
                        </td>
                        <td className="p-3 text-xs">
                          {item.lot ? (
                            <span className="text-indigo-700 font-medium">
                              {item.lot.lot_no}
                            </span>
                          ) : (
                            "—"
                          )}
                        </td>
                        <td className="p-3 text-right font-mono">
                          {Number(item.quantity)}
                        </td>
                        <td className="p-3 text-right font-mono text-gray-500 text-xs">
                          {item.unit_cost != null
                            ? formatMoney(Number(item.unit_cost))
                            : "—"}
                        </td>
                        <td className="p-3 text-right font-mono font-semibold text-indigo-700">
                          {item.total_value != null
                            ? formatMoney(Number(item.total_value))
                            : "—"}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* VALUATION TAB */}
          {tab === "valuation" && valuation && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
                <h3 className="text-base font-semibold text-gray-800 mb-1">
                  Tổng giá trị tồn kho
                </h3>
                <p className="text-3xl font-bold text-indigo-700 mt-2">
                  {formatMoney(valuation.grand_total_value)}
                </p>
                <div className="mt-6 space-y-2">
                  {valuation.by_category.map((c) => (
                    <div
                      key={c.category}
                      className="flex justify-between text-sm"
                    >
                      <span className="text-gray-600">{c.category}</span>
                      <span className="font-semibold text-gray-800">
                        {formatMoney(c.total_value)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
                <h3 className="text-base font-semibold text-gray-800 mb-4">
                  Theo danh mục
                </h3>
                {valuation.by_category.length === 0 ? (
                  <p className="text-gray-400 italic text-sm">Không có dữ liệu</p>
                ) : (
                  <ResponsiveContainer width="100%" height={260}>
                    <PieChart>
                      <Pie
                        data={valuation.by_category}
                        dataKey="total_value"
                        nameKey="category"
                        cx="50%"
                        cy="50%"
                        outerRadius={90}
                        label={({ name, payload, percent }) =>
                          `${name ?? payload?.category ?? ""} ${(((percent ?? 0) * 100)).toFixed(0)}%`
                        }
                        labelLine={false}
                      >
                        {valuation.by_category.map((_, i) => (
                          <Cell key={i} fill={COLORS[i % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(v: any) => formatMoney(v)} />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>
          )}

          {/* MOVEMENT TAB */}
          {tab === "movement" && (
            <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
              {movement.length === 0 ? (
                <div className="p-8 text-center text-gray-400 italic">
                  Chọn khoảng ngày rồi nhấn Tìm kiếm
                </div>
              ) : (
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-600">
                    <tr>
                      <th className="p-3 text-left">Số phiếu</th>
                      <th className="p-3 text-left">Ngày</th>
                      <th className="p-3 text-left">Loại</th>
                      <th className="p-3 text-left">Sản phẩm</th>
                      <th className="p-3 text-left">Lô hàng</th>
                      <th className="p-3 text-right">Số lượng</th>
                    </tr>
                  </thead>
                  <tbody>
                    {movement.map((line, idx) => (
                      <tr
                        key={line.id}
                        className={`border-t ${idx % 2 === 0 ? "bg-white" : "bg-gray-50"}`}
                      >
                        <td className="p-3 font-mono text-xs">
                          {line.move?.move_no}
                        </td>
                        <td className="p-3 text-gray-500 text-xs">
                          {line.move?.move_date?.split("T")[0]}
                        </td>
                        <td className="p-3">
                          <span
                            className={`px-2 py-0.5 rounded-full text-xs font-medium ${line.move?.type === "receipt"
                              ? "bg-green-100 text-green-700"
                              : line.move?.type === "issue"
                                ? "bg-red-100 text-red-700"
                                : line.move?.type === "transfer"
                                  ? "bg-blue-100 text-blue-700"
                                  : "bg-orange-100 text-orange-700"
                              }`}
                          >
                            {line.move?.type === "receipt"
                              ? "Nhập kho"
                              : line.move?.type === "issue"
                                ? "Xuất kho"
                                : line.move?.type === "transfer"
                                  ? "Điều chuyển"
                                  : "Kiểm kê"}
                          </span>
                        </td>
                        <td className="p-3 font-medium text-gray-800">
                          {line.product?.name}
                        </td>
                        <td className="p-3 text-xs text-indigo-700">
                          {line.lot?.lot_no ?? "—"}
                        </td>
                        <td className="p-3 text-right font-mono">
                          {Number(line.quantity)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
