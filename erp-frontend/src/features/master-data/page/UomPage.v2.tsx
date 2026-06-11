import { useEffect, useState } from 'react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import {
  fetchAllUomsThunk,
  createUomThunk,
  updateUomThunk,
  deleteUomThunk,
} from '../store/master-data/uom/uom.thunks';
import { Uom, CreateUomDto, UpdateUomDto } from '../dto/uom.dto';
import { GenericTable, useTable } from '@/components/v2/tables';
import { GenericForm } from '@/components/v2/forms';
import { usePermission } from '@/hooks/usePermission';
import { createUomTableConfig } from '../configs/uom-table.config';
import { uomFormConfig } from '../configs/uom-form.config';
import { Plus, Package, X } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { toast } from 'react-toastify';
import { ActionConfirmModal } from '@/components/common/ActionConfirmModal';

export default function UomPageV2() {
  const dispatch = useAppDispatch();
  const { Uoms, loading } = useAppSelector((state) => state.uom);
  const { canCreate, canEdit, canDelete } = usePermission('uom');

  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState<Uom | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Uom | null>(null);
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
    data: Uoms,
    searchFields: ['code', 'name'],
  });

  useEffect(() => {
    dispatch(fetchAllUomsThunk());
  }, [dispatch]);

  useEffect(() => {
    setData(Uoms);
  }, [Uoms, setData]);

  const handleCreate = async (dto: CreateUomDto) => {
    const result = await dispatch(createUomThunk(dto));
    if (createUomThunk.fulfilled.match(result)) {
      toast.success(`Tạo đơn vị "${dto.name}" thành công.`);
      setShowModal(false);
      setEditItem(null);
    } else {
      toast.error((result.payload as string) ?? 'Tạo đơn vị thất bại. Vui lòng thử lại.');
    }
  };

  const handleUpdate = async (dto: UpdateUomDto) => {
    if (!editItem) return;
    const result = await dispatch(updateUomThunk({ id: editItem.id, data: dto }));
    if (updateUomThunk.fulfilled.match(result)) {
      toast.success('Cập nhật đơn vị thành công.');
      setShowModal(false);
      setEditItem(null);
    } else {
      toast.error((result.payload as string) ?? 'Cập nhật đơn vị thất bại. Vui lòng thử lại.');
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const result = await dispatch(deleteUomThunk(deleteTarget.id));
      if (deleteUomThunk.fulfilled.match(result)) {
        toast.success(`Đã xóa đơn vị "${deleteTarget.name}".`);
        setDeleteTarget(null);
      } else {
        toast.error((result.payload as string) ?? 'Xóa đơn vị thất bại.');
      }
    } finally {
      setDeleting(false);
    }
  };

  const handleModalClose = () => {
    setShowModal(false);
    setEditItem(null);
  };

  const tableConfig = createUomTableConfig(
    (uom) => {
      setEditItem(uom);
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
              <Package className="w-4 h-4 text-orange-500" />
            </span>
            <div>
              <h1 className="text-base font-semibold text-gray-900">Đơn vị tính</h1>
              <p className="text-xs text-gray-400 mt-0.5">Quản lý đơn vị dùng cho sản phẩm, mua hàng và tồn kho</p>
            </div>
            <span className="ml-1 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-orange-50 text-orange-600">
              {Uoms.length}
            </span>
          </div>

          {canCreate() && (
            <Button
              variant="primary"
              onClick={() => {
                setEditItem(null);
                setShowModal(true);
              }}
              className="inline-flex items-center gap-1.5 h-8 px-3"
            >
              <Plus className="w-3.5 h-3.5" />
              Thêm đơn vị
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
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">
                {editItem ? 'Cập nhật đơn vị' : 'Thêm đơn vị'}
              </h2>
              <button onClick={handleModalClose} className="p-2 hover:bg-gray-100 rounded-lg transition-colors" aria-label="Đóng">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <div className="p-6">
              <GenericForm
                initialValues={
                  editItem
                    ? { code: editItem.code, name: editItem.name }
                    : { code: '', name: '' }
                }
                config={uomFormConfig}
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
        title="Xóa đơn vị tính"
        description={
          <span>
            Bạn có chắc muốn xóa đơn vị <strong>{deleteTarget?.name}</strong>?
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
