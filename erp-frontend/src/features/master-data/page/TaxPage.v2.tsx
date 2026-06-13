import { useEffect, useState } from 'react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import {
  fetchAllTaxRatesThunk,
  createTaxRateThunk,
  updateTaxRateThunk,
  deleteTaxRateThunk,
} from '../store/master-data/tax/tax.thunks';
import { Tax, CreateTaxRateDto, UpdateTaxRateDto } from '../dto/tax.dto';
import { GenericTable, useTable } from '@/components/v2/tables';
import { GenericForm } from '@/components/v2/forms';
import { usePermission } from '@/hooks/usePermission';
import { createTaxTableConfig } from '../configs/tax-table.config';
import { taxFormConfig } from '../configs/tax-form.config';
import { Plus, Receipt, X } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { toast } from 'react-toastify';
import { ActionConfirmModal } from '@/components/common/ActionConfirmModal';

export default function TaxPageV2() {
  const dispatch = useAppDispatch();
  const { Taxes, loading, error } = useAppSelector((state) => state.tax);
  const { canCreate, canEdit, canDelete } = usePermission('tax_rate');

  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState<Tax | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Tax | null>(null);
  const [deleting, setDeleting] = useState(false);

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
    const result = await dispatch(createTaxRateThunk(dto));
    if (createTaxRateThunk.fulfilled.match(result)) {
      toast.success(`Tạo thuế "${dto.name}" thành công.`);
      setShowModal(false);
      setEditItem(null);
    } else {
      toast.error((result.payload as string) ?? 'Tạo thuế thất bại. Vui lòng thử lại.');
    }
  };

  const handleUpdate = async (dto: UpdateTaxRateDto) => {
    if (!editItem) return;
    const result = await dispatch(updateTaxRateThunk({ id: editItem.id, data: dto }));
    if (updateTaxRateThunk.fulfilled.match(result)) {
      toast.success('Cập nhật thuế thành công.');
      setShowModal(false);
      setEditItem(null);
    } else {
      toast.error((result.payload as string) ?? 'Cập nhật thuế thất bại. Vui lòng thử lại.');
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const result = await dispatch(deleteTaxRateThunk(deleteTarget.id));
      if (deleteTaxRateThunk.fulfilled.match(result)) {
        toast.success(`Đã xóa thuế "${deleteTarget.name}".`);
        setDeleteTarget(null);
      } else {
        toast.error((result.payload as string) ?? 'Xóa thuế thất bại.');
      }
    } finally {
      setDeleting(false);
    }
  };

  const handleModalClose = () => {
    setShowModal(false);
    setEditItem(null);
  };

  const tableConfig = createTaxTableConfig(
    (tax) => {
      setEditItem(tax);
      setShowModal(true);
    },
    setDeleteTarget,
    canEdit,
    canDelete
  );

  return (
    <div className="page-container">
      <div className="erp-card overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200">
          <div className="flex items-center gap-2.5">
            <span className="w-8 h-8 bg-orange-50 rounded-lg flex items-center justify-center">
              <Receipt className="w-4 h-4 text-orange-500" />
            </span>
            <div>
              <h1 className="text-base font-semibold text-gray-900">Thuế</h1>
              <p className="text-xs text-gray-400 mt-0.5">Quản lý thuế suất, phạm vi áp dụng và thời hạn hiệu lực</p>
            </div>
            <span className="ml-1 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-orange-50 text-orange-600">
              {Taxes.length}
            </span>
          </div>

          {canCreate() && (
            <Button variant="primary" onClick={() => setShowModal(true)} className="inline-flex items-center gap-1.5 h-8 px-3">
              <Plus className="w-3.5 h-3.5" />
              Thêm thuế
            </Button>
          )}
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
          className="rounded-none border-0 shadow-none"
        />
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">
                {editItem ? 'Cập nhật thuế' : 'Thêm thuế'}
              </h2>
              <button onClick={handleModalClose} className="p-2 hover:bg-gray-100 rounded-lg transition-colors" aria-label="Đóng">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <div className="p-6">
              {error && (
                <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                  {error}
                </div>
              )}
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
                        type: 'VAT',
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

      <ActionConfirmModal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
        title="Xóa thuế"
        description={
          <span>
            Bạn có chắc muốn xóa thuế <strong>{deleteTarget?.name}</strong>?
          </span>
        }
        confirmText="Xóa"
        cancelText="Hủy"
        variant="danger"
        loading={deleting}
      />
    </div>
  );
}
