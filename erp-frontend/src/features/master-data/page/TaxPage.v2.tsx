import { useEffect, useState } from 'react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import {
  fetchAllTaxRatesThunk,
  createTaxRateThunk,
  updateTaxRateThunk,
  deleteTaxRateThunk,
} from '../store/master-data/tax/tax.thunks';
import { Tax, CreateTaxRateDto, UpdateTaxRateDto } from '../dto/tax.dto';
import { GenericTable } from '@/components/v2/tables';
import { GenericForm } from '@/components/v2/forms';
import { useTable } from '@/components/v2/tables';
import { usePermission } from '@/hooks/usePermission';
import { createTaxTableConfig } from '../configs/tax-table.config';
import { taxFormConfig } from '../configs/tax-form.config';
import { Plus, Receipt, X } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export default function TaxPageV2() {
  const dispatch = useAppDispatch();
  const { Taxes, loading } = useAppSelector((state) => state.tax);
  const { canCreate, canEdit, canDelete } = usePermission('tax_rate');

  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState<Tax | null>(null);

  const {
    data: tableData,
    paginationInfo,
    handleSearch,
    handleSort,
    handlePageChange,
    handlePageSizeChange,
    setData,
  } = useTable({
    data: Taxes,
    searchFields: ['code', 'name'],
  });

  useEffect(() => {
    dispatch(fetchAllTaxRatesThunk());
  }, [dispatch]);

  useEffect(() => {
    setData(Taxes);
  }, [Taxes, setData]);

  const handleCreate = async (dto: CreateTaxRateDto) => {
    await dispatch(createTaxRateThunk(dto));
    setShowModal(false);
    setEditItem(null);
  };

  const handleUpdate = async (dto: UpdateTaxRateDto) => {
    if (!editItem) return;
    await dispatch(updateTaxRateThunk({ id: editItem.id, data: dto }));
    setShowModal(false);
    setEditItem(null);
  };

  const handleDelete = async (tax: Tax) => {
    if (window.confirm(`Delete tax "${tax.name}"?`)) {
      await dispatch(deleteTaxRateThunk(tax.id));
    }
  };

  const handleEditClick = (tax: Tax) => {
    setEditItem(tax);
    setShowModal(true);
  };

  const handleAddClick = () => {
    setEditItem(null);
    setShowModal(true);
  };

  const handleModalClose = () => {
    setShowModal(false);
    setEditItem(null);
  };

  const tableConfig = createTaxTableConfig(
    handleEditClick,
    handleDelete,
    canEdit,
    canDelete
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="max-w-7xl mx-auto p-6 space-y-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-gradient-to-br from-brand-500 to-brand-600 rounded-lg shadow-md">
                <Receipt className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Tax Rates</h1>
                <p className="text-sm text-gray-500 mt-0.5">
                  Manage your tax rates and configurations
                </p>
              </div>
            </div>

            {canCreate() && (
              <Button variant="primary" onClick={handleAddClick} className="inline-flex items-center gap-2">
                <Plus className="w-4 h-4" />
                Add Tax Rate
              </Button>
            )}
          </div>
        </div>

        <GenericTable
          data={tableData}
          config={tableConfig}
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
          <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-900">
                {editItem ? 'Edit Tax Rate' : 'Create New Tax Rate'}
              </h2>
              <button onClick={handleModalClose} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <div className="p-6">
              <GenericForm
                initialValues={
                  editItem
                    ? {
                        code: editItem.code,
                        name: editItem.name,
                        type: editItem.type,
                        rate: editItem.rate,
                        applies_to: editItem.applies_to,
                        is_vat: editItem.is_vat,
                        effective_date: editItem.effective_date,
                        expiry_date: editItem.expiry_date,
                        status: editItem.status,
                      }
                    : {
                        code: '',
                        name: '',
                        type: 'percentage',
                        rate: 0,
                        applies_to: 'both',
                        is_vat: false,
                        effective_date: new Date().toISOString().split('T')[0],
                        expiry_date: null,
                        status: 'active',
                      }
                }
                config={taxFormConfig}
                mode={editItem ? 'edit' : 'create'}
                onSubmit={editItem ? handleUpdate : handleCreate}
                onCancel={handleModalClose}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
