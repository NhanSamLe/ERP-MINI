import { useEffect, useState } from "react";
import { getExchangeRates, updateExchangeRates } from "../service/currency.service";
import { DataTable } from "../../../components/ui/DataTable";
import { Column } from "../../../types/common";
import { Button } from "../../../components/ui/Button";
import { RefreshCw, Calendar, TrendingUp } from "lucide-react";
import { convertToBase } from "../../../utils/currency.helper";
import { ExchangeRate } from "../dto/currency.dto";
import { toast } from "react-toastify";

export default function ExchangeRatePage() {
  const [rates, setRates] = useState<ExchangeRate[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string>("");

  const fetchRates = async (date?: string) => {
    try {
      setLoading(true);
      const data = await getExchangeRates(date);
      setRates(data.rates);
    } catch (error) {
      console.error("Không thể tải tỷ giá:", error);
      toast.error("Không thể tải danh sách tỷ giá.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRates();
  }, []);

  const handleRefresh = () => {
    fetchRates(selectedDate || undefined);
  };

  const handleUpdateDailyRates = async () => {
    setLoading(true);
    try {
      await updateExchangeRates();
      await fetchRates();
      toast.success("Cập nhật tỷ giá hôm nay thành công.");
    } catch (error) {
      console.error("Không thể cập nhật tỷ giá:", error);
      toast.error("Cập nhật tỷ giá thất bại.");
    } finally {
      setLoading(false);
    }
  };

  const columns: Column<ExchangeRate>[] = [
    {
      key: "baseCurrency" as keyof ExchangeRate,
      label: "Tiền tệ gốc",
      render: (item) => item.baseCurrency?.code ?? "-",
    },
    {
      key: "quoteCurrency" as keyof ExchangeRate,
      label: "Tiền tệ quy đổi",
      render: (item) => item.quoteCurrency?.code ?? "-",
    },
    {
      key: "rate",
      label: "Tỷ giá",
      render: (item) => {
        const rate = Number(item.rate);
        return Number.isNaN(rate)
          ? "-"
          : rate.toLocaleString("vi-VN", { minimumFractionDigits: 6 });
      },
    },
    {
      key: "valueInVND",
      label: "Quy đổi VND",
      render: (item) => {
        const rate = Number(item.rate);
        const vnd = convertToBase(rate, "VND");
        return vnd ? `${vnd} VND` : "-";
      },
    },
    {
      key: "valid_date",
      label: "Ngày áp dụng",
      render: (item) => new Date(item.valid_date).toLocaleDateString("vi-VN"),
    },
  ];

  return (
    <div className="page-container">
      <div className="erp-card overflow-hidden">
        <div className="flex flex-col gap-3 px-5 py-4 border-b border-gray-200 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-2.5">
            <span className="w-8 h-8 bg-orange-50 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-4 h-4 text-orange-500" />
            </span>
            <div>
              <h1 className="text-base font-semibold text-gray-900">Tỷ giá</h1>
              <p className="text-xs text-gray-400 mt-0.5">Theo dõi và cập nhật tỷ giá quy đổi theo ngày</p>
            </div>
            <span className="ml-1 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-orange-50 text-orange-600">
              {rates.length}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="flex h-8 items-center gap-2 rounded-md border border-gray-300 bg-white px-3">
              <Calendar className="w-3.5 h-3.5 text-gray-500" />
              <input
                type="date"
                value={selectedDate || new Date().toISOString().split("T")[0]}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="text-sm outline-none border-none focus:ring-0"
                aria-label="Ngày tỷ giá"
              />
            </div>

            <button
              onClick={handleRefresh}
              className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-gray-300 text-gray-600 hover:bg-gray-50"
              title="Tải lại"
            >
              <RefreshCw className="w-4 h-4" />
            </button>

            <Button onClick={handleUpdateDailyRates} loading={loading} className="h-8 bg-orange-500 hover:bg-orange-600 text-white">
              Cập nhật hôm nay
            </Button>
          </div>
        </div>

        <div className="px-5 py-4">
          <DataTable
            data={rates || []}
            columns={columns}
            loading={loading}
            searchable={false}
            showSelection={false}
            showActions={false}
            itemsPerPage={10}
          />
        </div>
      </div>
    </div>
  );
}
