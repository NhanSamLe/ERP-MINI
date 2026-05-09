import { useEffect, useState } from "react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { RootState } from "@/store/store";
import {
  fetchLeadSources,
  createLeadSource,
  updateLeadSource,
  deleteLeadSource,
} from "../store/leadSource/leadSource.thunks";
import { LeadSource, CreateLeadSourceDto, UpdateLeadSourceDto } from "../dto/leadSource.dto";
import { GenericTable } from "@/components/v2/tables";
import { GenericForm } from "@/components/v2/forms";
import { useTable } from "@/components/v2/tables";
import { leadSourceTableConfig } from "../configs/leadSource-table.config";
import { leadSourceFormConfig } from "../configs/leadSource-form.config";
import { Plus, Globe } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { ActionConfirmModal } from "@/components/common";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export default function LeadSourcePage() {
  const dispatch = useAppDispatch();
  const { leadSources, loading } = useAppSelector((s: RootState) => s.leadSource);

  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState<LeadSource | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<LeadSource | null>(null);

  const { data: tableData, paginationInfo, handleSearch, handleSort, handlePageChange, handlePageSizeChange, setData } = useTable({
    data: leadSources,
    searchFields: ["name"],
  });

  useEffect(() => { dispatch(fetchLeadSources()); }, [dispatch]);
  useEffect(() => { setData(leadSources); }, [leadSources, setData]);

  const handleCreate = async (dto: CreateLeadSourceDto) => {
    await dispatch(createLeadSource(dto));
    setShowModal(false);
  };

  const handleUpdate = async (dto: UpdateLeadSourceDto) => {
    if (!editItem) return;
    await dispatch(updateLeadSource({ id: editItem.id, data: dto }));
    setShowModal(false);
    setEditItem(null);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    await dispatch(deleteLeadSource(deleteTarget.id));
    setDeleteTarget(null);
  };

  const handleEditClick = (item: LeadSource) => {
    setEditItem(item);
    setShowModal(true);
  };

  const handleAddClick = () => {
    setEditItem(null);
    setShowModal(true);
  };

  const tableConfig = leadSourceTableConfig(handleEditClick, (item) => setDeleteTarget(item));

  return (
    <div className="page-container">
      {/* Header */}
      <div className="erp-card overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200">
          <div className="flex items-center gap-2.5">
            <span className="w-8 h-8 bg-orange-50 rounded-lg flex items-center justify-center">
              <Globe className="w-4 h-4 text-orange-500" />
            </span>
            <div>
              <h1 className="text-base font-semibold text-gray-900">Lead Sources</h1>
              <p className="text-xs text-gray-400 mt-0.5">Quản lý danh mục nguồn khách hàng tiềm năng</p>
            </div>
            <span className="ml-1 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-orange-50 text-orange-600">
              {leadSources.length}
            </span>
          </div>
          <Button variant="primary" size="md" leftIcon={<Plus className="w-3.5 h-3.5" />} onClick={handleAddClick}>
            Thêm nguồn mới
          </Button>
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

      {/* Create/Edit Modal */}
      <Dialog open={showModal} onOpenChange={(open) => { if (!open) { setShowModal(false); setEditItem(null); } }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editItem ? "Sửa nguồn Lead" : "Thêm nguồn Lead mới"}
            </DialogTitle>
          </DialogHeader>
          <div className="mt-4">
            <GenericForm
              initialValues={editItem ? { name: editItem.name, description: editItem.description || "" } : { name: "", description: "" }}
              config={leadSourceFormConfig}
              mode={editItem ? "edit" : "create"}
              onSubmit={editItem ? handleUpdate : handleCreate}
              onCancel={() => { setShowModal(false); setEditItem(null); }}
            />
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <ActionConfirmModal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="Xóa nguồn Lead"
        description={`Bạn có chắc chắn muốn xóa nguồn "${deleteTarget?.name}"? Hành động này không thể hoàn tác.`}
        confirmText="Xóa"
        variant="danger"
        onConfirm={handleDelete}
      />
    </div>
  );
}
