import { useEffect, useMemo, useState } from "react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { RootState } from "@/store/store";
import {
  fetchScoringRules,
  fetchScoringSignals,
  createScoringRule,
  updateScoringRule,
  deleteScoringRule,
  previewScoringRule,
} from "../store/scoringRule/scoringRule.thunks";
import { fetchAllLeads } from "../store/lead/lead.thunks";
import { ScoringRule, CreateScoringRuleDto, UpdateScoringRuleDto } from "../dto/scoringRule.dto";
import { GenericTable, useTable } from "@/components/v2/tables";
import { scoringRuleTableConfig } from "../configs/scoringRule-table.config";
import { Plus, Target, FlaskConical } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { ActionConfirmModal } from "@/components/common";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

const VALUELESS_OPERATORS = new Set(["is_true", "is_false", "not_empty", "empty"]);

const emptyForm: CreateScoringRuleDto = {
  name: "",
  field: "",
  operator: "",
  value: "",
  score: 10,
  is_active: true,
};

export default function ScoringRulePage() {
  const dispatch = useAppDispatch();
  const { scoringRules, metadata, preview, previewLoading, loading, error } = useAppSelector((s: RootState) => s.scoringRule);
  const { allLeads } = useAppSelector((s: RootState) => s.lead);

  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState<ScoringRule | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ScoringRule | null>(null);
  const [previewLeadId, setPreviewLeadId] = useState<number | "">("");
  const [form, setForm] = useState<CreateScoringRuleDto>({ ...emptyForm });

  const signals = metadata?.signals ?? [];
  const currentSignal = useMemo(
    () => signals.find((signal) => signal.key === form.field),
    [signals, form.field]
  );
  const allowedOperators = useMemo(
    () => (metadata?.operators ?? []).filter((operator) => currentSignal?.operators.includes(operator.value)),
    [metadata?.operators, currentSignal]
  );
  const valueHidden = VALUELESS_OPERATORS.has(form.operator);

  const { data: tableData, paginationInfo, handleSearch, handleSort, handlePageChange, handlePageSizeChange, setData } = useTable({
    data: scoringRules,
    searchFields: ["name", "field"],
  });

  useEffect(() => {
    dispatch(fetchScoringRules());
    dispatch(fetchScoringSignals());
    dispatch(fetchAllLeads());
  }, [dispatch]);

  useEffect(() => { setData(scoringRules); }, [scoringRules, setData]);

  useEffect(() => {
    if (!currentSignal) return;
    if (!currentSignal.operators.includes(form.operator)) {
      setForm((prev) => ({ ...prev, operator: currentSignal.operators[0] ?? "", value: "" }));
    }
  }, [currentSignal, form.operator]);

  const openCreate = () => {
    const firstSignal = signals[0];
    setEditItem(null);
    setPreviewLeadId("");
    setForm({
      ...emptyForm,
      field: firstSignal?.key ?? "",
      operator: firstSignal?.operators[0] ?? "",
    });
    setShowModal(true);
  };

  const openEdit = (item: ScoringRule) => {
    setEditItem(item);
    setPreviewLeadId("");
    setForm({
      name: item.name,
      field: item.field,
      operator: item.operator,
      value: item.value || "",
      score: item.score,
      is_active: item.is_active,
    });
    setShowModal(true);
  };

  const updateForm = (key: keyof CreateScoringRuleDto, value: string | number | boolean) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const buildPayload = (): CreateScoringRuleDto | UpdateScoringRuleDto => ({
    ...form,
    value: valueHidden ? "" : form.value,
    score: Number(form.score),
  });

  const handleSubmit = async () => {
    const payload = buildPayload();
    if (editItem) {
      await dispatch(updateScoringRule({ id: editItem.id, data: payload }));
    } else {
      await dispatch(createScoringRule(payload as CreateScoringRuleDto));
    }
    setShowModal(false);
    setEditItem(null);
  };

  const handlePreview = async () => {
    if (!previewLeadId) return;
    await dispatch(previewScoringRule({ lead_id: Number(previewLeadId), rule: buildPayload() }));
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    await dispatch(deleteScoringRule(deleteTarget.id));
    setDeleteTarget(null);
  };

  const tableConfig = scoringRuleTableConfig(openEdit, (item) => setDeleteTarget(item), signals);

  return (
    <div className="page-container">
      <div className="erp-card overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200">
          <div className="flex items-center gap-2.5">
            <span className="w-8 h-8 bg-orange-50 rounded-lg flex items-center justify-center">
              <Target className="w-4 h-4 text-orange-500" />
            </span>
            <div>
              <h1 className="text-base font-semibold text-gray-900">Quy tắc chấm điểm Lead</h1>
              <p className="text-xs text-gray-400 mt-0.5">
                Cấu hình tín hiệu, điều kiện và điểm số với kiểm tra dữ liệu trước khi lưu.
              </p>
            </div>
            <span className="ml-1 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-orange-50 text-orange-600">
              {scoringRules.length}
            </span>
          </div>
          <Button variant="primary" size="md" leftIcon={<Plus className="w-3.5 h-3.5" />} onClick={openCreate}>
            Thêm quy tắc
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

      <Dialog open={showModal} onOpenChange={(open) => { if (!open) { setShowModal(false); setEditItem(null); } }}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>{editItem ? "Cập nhật quy tắc chấm điểm" : "Thêm quy tắc chấm điểm mới"}</DialogTitle>
          </DialogHeader>

          <div className="mt-4 space-y-4">
            {error && <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">{error}</div>}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <label className="md:col-span-2 space-y-1">
                <span className="text-xs font-medium text-gray-600">Tên quy tắc</span>
                <input
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-orange-500 focus:outline-none"
                  value={form.name}
                  onChange={(e) => updateForm("name", e.target.value)}
                  placeholder="VD: Khách hàng có ngân sách được cộng 20 điểm"
                />
              </label>

              <label className="space-y-1">
                <span className="text-xs font-medium text-gray-600">Tín hiệu chấm điểm</span>
                <select
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-orange-500 focus:outline-none"
                  value={form.field}
                  onChange={(e) => {
                    const nextSignal = signals.find((signal) => signal.key === e.target.value);
                    setForm((prev) => ({
                      ...prev,
                      field: e.target.value,
                      operator: nextSignal?.operators[0] ?? "",
                      value: "",
                    }));
                  }}
                >
                  <option value="">Chọn tín hiệu</option>
                  {signals.map((signal) => (
                    <option key={signal.key} value={signal.key}>
                      {signal.label}
                    </option>
                  ))}
                </select>
                {currentSignal?.helpText && <span className="text-xs text-gray-400">{currentSignal.helpText}</span>}
              </label>

              <label className="space-y-1">
                <span className="text-xs font-medium text-gray-600">Điều kiện áp dụng</span>
                <select
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-orange-500 focus:outline-none"
                  value={form.operator}
                  onChange={(e) => updateForm("operator", e.target.value)}
                >
                  <option value="">Chọn điều kiện</option>
                  {allowedOperators.map((operator) => (
                    <option key={operator.value} value={operator.value}>
                      {operator.label}
                    </option>
                  ))}
                </select>
              </label>

              {!valueHidden && (
                <label className="space-y-1">
                  <span className="text-xs font-medium text-gray-600">Giá trị so sánh</span>
                  {currentSignal?.options?.length ? (
                    <select
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-orange-500 focus:outline-none"
                      value={form.value || ""}
                      onChange={(e) => updateForm("value", e.target.value)}
                    >
                      <option value="">Chọn giá trị</option>
                      {currentSignal.options.map((option) => (
                        <option key={option.value} value={option.value}>{option.label}</option>
                      ))}
                    </select>
                  ) : (
                    <input
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-orange-500 focus:outline-none"
                      type={currentSignal?.type === "number" ? "number" : "text"}
                      value={form.value || ""}
                      onChange={(e) => updateForm("value", e.target.value)}
                      placeholder={currentSignal?.type === "multi_select" ? "VD: 1,2,3" : "Nhập giá trị"}
                    />
                  )}
                </label>
              )}

              <label className="space-y-1">
                <span className="text-xs font-medium text-gray-600">Điểm cộng/trừ</span>
                <input
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-orange-500 focus:outline-none"
                  type="number"
                  value={form.score}
                  onChange={(e) => updateForm("score", Number(e.target.value))}
                />
              </label>

              <label className="flex items-center gap-2 text-sm text-gray-700">
                <input
                  type="checkbox"
                  checked={form.is_active !== false}
                  onChange={(e) => updateForm("is_active", e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300 text-orange-500 focus:ring-orange-500"
                />
                Kích hoạt quy tắc
              </label>
            </div>

            <div className="rounded-lg border border-gray-200 bg-gray-50 p-3">
              <div className="flex flex-col md:flex-row md:items-end gap-3">
                <label className="flex-1 space-y-1">
                  <span className="text-xs font-medium text-gray-600">Kiểm thử trên Lead mẫu</span>
                  <select
                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-orange-500 focus:outline-none"
                    value={previewLeadId}
                    onChange={(e) => setPreviewLeadId(e.target.value ? Number(e.target.value) : "")}
                  >
                    <option value="">Chọn Lead</option>
                    {allLeads.map((lead) => (
                      <option key={lead.id} value={lead.id}>
                        #{lead.id} - {lead.company_name || lead.name}
                      </option>
                    ))}
                  </select>
                </label>
                <Button
                  type="button"
                  variant="outline"
                  size="md"
                  leftIcon={<FlaskConical className="w-3.5 h-3.5" />}
                  loading={previewLoading}
                  disabled={!previewLeadId || !form.field || !form.operator}
                  onClick={handlePreview}
                >
                  Kiểm thử quy tắc
                </Button>
              </div>

              {preview && (
                <div className={`mt-3 rounded-lg border px-3 py-2 text-sm ${preview.matched ? "border-green-200 bg-green-50 text-green-700" : "border-gray-200 bg-white text-gray-600"}`}>
                  <div className="font-medium">{preview.message}</div>
                  <div className="mt-1 text-xs">
                    Giá trị thực tế: {String(preview.actual_value ?? "-")} | Tác động điểm: {preview.score_delta}
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => { setShowModal(false); setEditItem(null); }}>
                Hủy
              </Button>
              <Button variant="primary" onClick={handleSubmit} disabled={!form.name || !form.field || !form.operator}>
                Lưu quy tắc
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <ActionConfirmModal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="Xóa quy tắc chấm điểm"
        description={`Bạn có chắc chắn muốn xóa quy tắc "${deleteTarget?.name}"?`}
        confirmText="Xóa"
        variant="danger"
        onConfirm={handleDelete}
      />
    </div>
  );
}
