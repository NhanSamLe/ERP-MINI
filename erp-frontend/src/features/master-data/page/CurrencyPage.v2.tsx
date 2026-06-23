import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '@/store/store';
import { fetchCurrencies, addCurrencyThunk } from '../store';
import { GenericTable, useTable } from '@/components/v2/tables';
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
    const code = currencyCode.trim().toUpperCase();
    if (code.length !== 3) {
      toast.error('Mã tiền tệ phải có đúng 3 ký tự.');
      return;
    }

    const result = await dispatch(addCurrencyThunk(code));
    if (addCurrencyThunk.fulfilled.match(result)) {
      toast.success(`Thêm tiền tệ ${code} thành công.`);
      setShowModal(false);
      setCurrencyCode('');
    } else {
      toast.error((result.payload as string) ?? 'Thêm tiền tệ thất bại. Vui lòng thử lại.');
    }
  };

  const handleModalClose = () => {
    setShowModal(false);
    setCurrencyCode('');
  };

  return (
    <div className="page-container">
      <div className="erp-card overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200">
          <div className="flex items-center gap-2.5">
            <span className="w-8 h-8 bg-orange-50 rounded-lg flex items-center justify-center">
              <DollarSign className="w-4 h-4 text-orange-500" />
            </span>
            <div>
              <h1 className="text-base font-semibold text-gray-900">Tiền tệ</h1>
              <p className="text-xs text-gray-400 mt-0.5">Quản lý danh sách tiền tệ dùng trong giao dịch và báo cáo</p>
            </div>
            <span className="ml-1 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-orange-50 text-orange-600">
              {currencies?.length || 0}
            </span>
          </div>

          {canCreate() && (
            <Button variant="primary" onClick={() => setShowModal(true)} className="inline-flex items-center gap-1.5 h-8 px-3">
              <Plus className="w-3.5 h-3.5" />
              Thêm tiền tệ
            </Button>
          )}
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
          className="rounded-none border-0 shadow-none"
        />
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Thêm tiền tệ</h2>
              <button onClick={handleModalClose} className="p-2 hover:bg-gray-100 rounded-lg transition-colors" aria-label="Đóng">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <FormInput
                label="Mã tiền tệ"
                type="text"
                value={currencyCode}
                onChange={(value) => setCurrencyCode(value.toUpperCase())}
                placeholder="VD: USD, EUR, VND"
                required
              />
              <p className="text-sm text-gray-600">
                Nhập mã tiền tệ ISO 4217 gồm 3 ký tự, ví dụ USD, EUR hoặc VND.
              </p>
            </div>

            <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 rounded-b-lg flex justify-end gap-3">
              <Button variant="outline" onClick={handleModalClose}>Hủy</Button>
              <Button variant="primary" onClick={handleAddCurrency} disabled={currencyCode.trim().length !== 3}>
                Thêm tiền tệ
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
