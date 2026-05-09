import { useEffect, useState } from "react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { RootState } from "@/store/store";
import {
  fetchScoringRules,
  createScoringRule,
  updateScoringRule,
  deleteScoringRule,
} from "../store/scoringRule/scoringRule.thunks";
import { ScoringRule, CreateScoringRuleDto, UpdateScoringRuleDto } from "../dto/scoringRule.dto";
import { GenericTable } from "@/components/v2/tables";
import { GenericForm } from "@/components/v2/forms";
import { useTable } from "@/components/v2/tables";
import { scoringRuleTableConfig } from "../configs/scoringRule-table.config";
import { scoringRuleFormConfig } from "../configs/scoringRule-form.config";
import { Plus, Target } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { ActionConfirmModal } from "@/components/common";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export default function ScoringRulePage() {
  const dispatch = useAppDispatch();
  const { scoringRules, loading } = useAppSelector((s: RootState) => s.scoringRule);

  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState<ScoringRule | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ScoringRule | null>(null);

  const { data: tableData, paginationInfo, handleSearch, handleSort, handlePageChange, handlePageSizeChange, setData } = useTable({
    data: scoringRules,
    searchFields: ["name", "field"],
  });

  useEffect(() => { dispatch(fetchScoringRules()); }, [dispatch]);
  useEffect(() => { setData(scoringRules); }, [scoringRules, setData]);

  const handleCreate = async (dto: CreateScoringRuleDto) => {
    await dispatch(createScoringRule(dto));
    setShowModal(false);
  };

  const handleUpdate = async (dto: UpdateScoringRuleDto) => {
    if (!editItem) return;
    await dispatch(updateScoringRule({ id: editItem.id, data: dto }));
    setShowModal(false);
    setEditItem(null);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    await dispatch(deleteScoringRule(deleteTarget.id));
    setDeleteTarget(null);
  };

  const handleEditClick = (item: ScoringRule) => {
    setEditItem(item);
    setShowModal(true);
  };

  const handleAddClick = () => {
    setEditItem(null);
    setShowModal(true);
  };

  const tableConfig = scoringRuleTableConfig(handleEditClick, (item) => setDeleteTarget(item));

  return (
    <div className="page-container">
      {/* Header */}
      <div className="erp-card overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200">
          <div className="flex items-center gap-2.5">
            <span className="w-8 h-8 bg-orange-50 rounded-lg flex items-center justify-center">
              <Target className="w-4 h-4 text-orange-500" />
            </span>
            <div>
              <h1 className="text-base font-semibold text-gray-900">Scoring Rules</h1>
              <p className="text-xs text-gray-400 mt-0.5">Cấu hình luật tự động tính điểm chất lượng Lead</p>
            </div>
            <span className="ml-1 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-orange-50 text-orange-600">
              {scoringRules.length}
            </span>
          </div>
          <Button variant="primary" size="md" leftIcon={<Plus className="w-3.5 h-3.5" />} onClick={handleAddClick}>
            Thêm luật mới
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
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>
              {editItem ? "Sửa luật chấm điểm" : "Thêm luật chấm điểm mới"}
            </DialogTitle>
          </DialogHeader>
          <div className="mt-4">
            <GenericForm
              initialValues={
                editItem
                  ? { name: editItem.name, field: editItem.field, operator: editItem.operator, value: editItem.value || "", score: editItem.score }
                  : { name: "", field: "industry", operator: "equals", value: "", score: 10 }
              }
              config={scoringRuleFormConfig}
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
        title="Xóa luật chấm điểm"
        description={`Bạn có chắc chắn muốn xóa luật "${deleteTarget?.name}"?`}
        confirmText="Xóa"
        variant="danger"
        onConfirm={handleDelete}
      />
    </div>
  );
}
