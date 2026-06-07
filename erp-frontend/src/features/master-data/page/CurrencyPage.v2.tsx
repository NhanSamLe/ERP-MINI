import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '@/store/store';
import { fetchCurrencies, addCurrencyThunk } from '../store';
import { Currency } from '../dto/currency.dto';
import { GenericTable } from '@/components/v2/tables';
import { useTable } from '@/components/v2/tables';
import { usePermission } from '@/hooks/usePermission';
import { currencyTableConfig } from '../configs/currency-table.config';
import { Plus, DollarSign, X } from 'lucide-react';
import { toast } from 'react-toastify';
import { Button } from '@/components/ui/Button';
import { FormInput } from '@/components/ui/FormInput';

export default function CurrencyPageV2() {
  const dispatch = useDispatch<AppDispatch>();
  const { currencies, loading } = useSelector((state: RootState) => state.currency);
  const { canCreate } = usePermission('currency');

  const [showModal, setShowModal] = useState(false);
  const [currencyCode, setCurrencyCode] = useState('');

  const {
    data: tableData,
    paginationInfo,
    handleSearch,
    handleSort,
    handlePageChange,
    handlePageSizeChange,
    setData,
  } = useTable({
    data: currencies || [],
    searchFields: ['code', 'name'],
  });

  useEffect(() => {
    dispatch(fetchCurrencies());
  }, [dispatch]);

  useEffect(() => {
    setData(currencies || []);
  }, [currencies, setData]);

  const handleAddCurrency = async () => {
    if (!currencyCode || currencyCode.length !== 3) {
      toast.error("Mã tiền tệ phải có đúng 3 ký tự");
      return;
    }
    const code = currencyCode.toUpperCase();
    const result = await dispatch(addCurrencyThunk(code));
    if (addCurrencyThunk.fulfilled.match(result)) {
      toast.success(`Thêm tiền tệ ${code} thành công!`);
      setShowModal(false);
      setCurrencyCode('');
    } else {
      toast.error((result.payload as string) ?? "Thêm tiền tệ thất bại. Vui lòng thử lại.");
    }
  };

  const handleModalClose = () => {
    setShowModal(false);
    setCurrencyCode('');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="max-w-7xl mx-auto p-6 space-y-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-gradient-to-br from-brand-500 to-brand-600 rounded-lg shadow-md">
                <DollarSign className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Currencies</h1>
                <p className="text-sm text-gray-500 mt-0.5">
                  Manage currency list in the system
                </p>
              </div>
            </div>

            {canCreate() && (
              <Button variant="primary" onClick={() => setShowModal(true)} className="inline-flex items-center gap-2">
                <Plus className="w-4 h-4" />
                Add Currency
              </Button>
            )}
          </div>
        </div>

        <GenericTable
          data={tableData}
          config={currencyTableConfig}
          loading={loading}
          pagination={paginationInfo}
          onPageChange={handlePageChange}
          onPageSizeChange={handlePageSizeChange}
          onSortChange={handleSort}
          onSearchChange={handleSearch}
        />
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-900">Add Currency</h2>
              <button onClick={handleModalClose} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <FormInput
                label="Currency Code"
                type="text"
                value={currencyCode}
                onChange={setCurrencyCode}
                placeholder="e.g., USD, EUR, VND"
                required
              />
              <p className="text-sm text-gray-600">
                Enter a 3-letter ISO 4217 currency code (e.g., USD, EUR, VND)
              </p>
            </div>

            <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 rounded-b-lg flex justify-end gap-3">
              <Button variant="outline" onClick={handleModalClose}>
                Cancel
              </Button>
              <Button variant="primary" onClick={handleAddCurrency} disabled={!currencyCode || currencyCode.length !== 3}>
                Add Currency
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
