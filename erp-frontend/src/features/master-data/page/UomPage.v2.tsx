/**
 * UOM Page V2
 * @description Refactored UOM page using generic components
 * @author Senior Frontend Team
 */

import { useEffect, useState } from 'react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import {
  fetchAllUomsThunk,
  createUomThunk,
  updateUomThunk,
  deleteUomThunk,
} from '../store/master-data/uom/uom.thunks';
import { Uom, CreateUomDto, UpdateUomDto } from '../dto/uom.dto';
import { GenericTable } from '@/components/v2/tables';
import { GenericForm } from '@/components/v2/forms';
import { useTable } from '@/components/v2/tables';
import { usePermission } from '@/hooks/usePermission';
import { createUomTableConfig } from '../configs/uom-table.config';
import { uomFormConfig } from '../configs/uom-form.config';
import { Plus, Package, X } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { toast } from 'react-toastify';

export default function UomPageV2() {
  const dispatch = useAppDispatch();
  const { Uoms, loading } = useAppSelector((state) => state.uom);
  const { canCreate, canEdit, canDelete } = usePermission('uom');

  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState<Uom | null>(null);

  // Initialize table with search
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
      toast.success(`Tạo đơn vị "${dto.name}" thành công!`);
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
      toast.success('Cập nhật đơn vị thành công!');
      setShowModal(false);
      setEditItem(null);
    } else {
      toast.error((result.payload as string) ?? 'Cập nhật đơn vị thất bại. Vui lòng thử lại.');
    }
  };

  const handleDelete = async (uom: Uom) => {
    if (window.confirm(`Xóa đơn vị "${uom.name}"?`)) {
      const result = await dispatch(deleteUomThunk(uom.id));
      if (deleteUomThunk.fulfilled.match(result)) {
        toast.success(`Đã xóa đơn vị "${uom.name}".`);
      } else {
        toast.error((result.payload as string) ?? 'Xóa đơn vị thất bại.');
      }
    }
  };

  /**
   * Handle edit click
   */
  const handleEditClick = (uom: Uom) => {
    setEditItem(uom);
    setShowModal(true);
  };

  /**
   * Handle add click
   */
  const handleAddClick = () => {
    setEditItem(null);
    setShowModal(true);
  };

  /**
   * Handle modal close
   */
  const handleModalClose = () => {
    setShowModal(false);
    setEditItem(null);
  };

  /**
   * Table configuration
   */
  const tableConfig = createUomTableConfig(
    handleEditClick,
    handleDelete,
    canEdit,
    canDelete
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="max-w-7xl mx-auto p-6 space-y-6">
        {/* Header Section */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            {/* Title */}
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-gradient-to-br from-brand-500 to-brand-600 rounded-lg shadow-md">
                <Package className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  Unit of Measurement
                </h1>
                <p className="text-sm text-gray-500 mt-0.5">
                  Manage your UOM master data
                </p>
              </div>
            </div>

            {/* Add Button */}
            {canCreate() && (
              <Button
                variant="primary"
                onClick={handleAddClick}
                className="inline-flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Add UOM
              </Button>
            )}
          </div>
        </div>

        {/* Table Section */}
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

      {/* Form Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-900">
                {editItem ? 'Edit UOM' : 'Create New UOM'}
              </h2>
              <button
                onClick={handleModalClose}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            {/* Modal Content */}
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
    </div>
  );
}
