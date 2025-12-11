import { useEffect, useState } from "react";
import { getExchangeRates, updateExchangeRates } from "../service/currency.service";
import { DataTable } from "../../../components/ui/DataTable";
import { Column } from "../../../types/common";
import { Button } from "../../../components/ui/Button";
import { RefreshCw, Calendar } from "lucide-react";
import { convertToBase } from "../../../utils/currency.helper"; // ✅ import helper
import { ExchangeRate } from "../dto/currency.dto";

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
      console.error("Failed to fetch exchange rates:", error);
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
    } catch (error) {
      console.error("Failed to update rates:", error);
    } finally {
      setLoading(false);
    }
  };

  const columns: Column<ExchangeRate>[] = [
    {
      key: "baseCurrency" as keyof ExchangeRate,
      label: "Base Currency",
      render: (item) => item.baseCurrency?.code ?? "-",
    },
    {
      key: "quoteCurrency" as keyof ExchangeRate,
      label: "Quote Currency",
      render: (item) => item.quoteCurrency?.code ?? "-",
    },
    {
      key: "rate",
      label: "Exchange Rate",
      render: (item) => {
        const rate = Number(item.rate);
        return isNaN(rate)
          ? "-"
          : rate.toLocaleString("en-US", { minimumFractionDigits: 6 });
      },
    },
    {
      key: "valueInVND",
      label: "Equivalent in VND",
      render: (item) => {
        const rate = Number(item.rate);
        const vnd = convertToBase(rate, "VND");
        return vnd ? `${vnd} ₫` : "-";
      },
    },
    {
      key: "valid_date",
      label: "Date",
      render: (item) =>
        new Date(item.valid_date).toLocaleDateString("en-GB"),
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          {/* HEADER */}
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">
                Exchange Rates
              </h1>
              <p className="text-sm text-gray-600 mt-1">
                View daily exchange rate updates
              </p>
            </div>

            <div className="flex items-center space-x-3">
              {/* Date Picker */}
              <div className="flex items-center space-x-2 border border-gray-300 rounded-lg px-3 py-2">
                <Calendar className="w-4 h-4 text-gray-500" />
                <input
                  type="date"
                  value={selectedDate || new Date().toISOString().split("T")[0]}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="text-sm outline-none border-none focus:ring-0"
                />
              </div>

              {/* Refresh */}
              <button
                onClick={handleRefresh}
                className="p-2 border border-gray-300 rounded-lg text-gray-600 hover:text-gray-900"
              >
                <RefreshCw className="w-5 h-5" />
              </button>

              {/* Force Update */}
              <Button
                onClick={handleUpdateDailyRates}
                loading={loading}
                className="bg-orange-500 hover:bg-orange-600 text-white"
              >
                Update Today Rates
              </Button>
            </div>
          </div>

          {/* TABLE */}
          <DataTable
            data={rates || []}
            columns={columns}
            loading={loading}
            searchable={false}
            // searchKeys={["baseCurrency.code", "quoteCurrency.code"] as unknown as (keyof ExchangeRate)[]}
            showSelection={false}
            showActions={false}
            itemsPerPage={10}
          />
        </div>
      </div>
    </div>
  );
}
