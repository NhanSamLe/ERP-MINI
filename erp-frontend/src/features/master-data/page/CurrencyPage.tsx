import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "../../../store/store";
import {
  fetchCurrencies,
  fetchRealCurrencies,
  addCurrencyThunk,
} from "../store";
import { Currency } from "../dto/currency.dto";
import { Column } from "../../../types/common";
import { DataTable } from "../../../components/ui/DataTable";
import { CurrencyFormModal } from "../components/CurrencyFormModal";
import { RefreshCw, Plus } from "lucide-react";

export default function CurrencyPage() {
  const dispatch = useDispatch<AppDispatch>();
  const { currencies, currenciesReal, loading } = useSelector(
    (state: RootState) => state.currency
  );

  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    dispatch(fetchCurrencies());
    dispatch(fetchRealCurrencies());
  }, [dispatch]);

  const handleAddCurrency = async (code: string) => {
    await dispatch(addCurrencyThunk(code));
    setIsModalOpen(false);
  };

  const columns: Column<Currency>[] = [
    { key: "name", label: "Currency Name", sortable: true },
    { key: "code", label: "Code", sortable: true },
    { key: "symbol", label: "Symbol" },
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          {/* HEADER */}
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">
                Currencies
              </h1>
              <p className="text-sm text-gray-600 mt-1">
                Manage currency list in the system
              </p>
            </div>

            <div className="flex items-center space-x-3">
              <button
                onClick={() => dispatch(fetchCurrencies())}
                className="p-2 text-gray-600 hover:text-gray-900 border border-gray-300 rounded-lg"
              >
                <RefreshCw className="w-5 h-5" />
              </button>
              <button
                onClick={() => setIsModalOpen(true)}
                className="flex items-center space-x-2 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600"
              >
                <Plus className="w-5 h-5" />
                <span>Add Currency</span>
              </button>
            </div>
          </div>

          {/* TABLE */}
          <DataTable
            data={currencies || []}
            columns={columns}
            loading={loading}
            searchable={false}
            // searchKeys={["name", "code"]}
            itemsPerPage={10}
            showSelection={false}
            showActions={false}
          />
        </div>
      </div>

      {/* MODAL */}
      <CurrencyFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onAdd={handleAddCurrency}
        realCurrencies={currenciesReal}
      />
    </div>
  );
}
