import { useEffect, useState } from "react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { RootState } from "@/store/store";
import {
  fetchPipelines,
  createPipeline,
  updatePipeline,
  addPipelineStage,
  updatePipelineStage,
  deletePipelineStage,
} from "../store/pipeline/pipeline.thunks";
import {
  Pipeline,
  PipelineStage,
  CreatePipelineDto,
  UpdatePipelineDto,
  CreatePipelineStageDto,
  UpdatePipelineStageDto,
} from "../dto/pipeline.dto";
import { GenericForm } from "@/components/v2/forms";
import { pipelineFormConfig } from "../configs/pipeline-form.config";
import { createPipelineStageFormConfig, editPipelineStageFormConfig } from "../configs/pipelineStage-form.config";
import { Plus, GitBranch, X, Edit3, Power, ChevronRight, Trophy, XCircle, Trash2 } from "lucide-react";
import { formatStageProbability } from "../helpers/pipeline.helpers";
import { Button } from "@/components/ui/Button";
import { ActionConfirmModal } from "@/components/common";

type StatusFilter = "all" | "active" | "inactive";

const FILTER_TABS: { label: string; value: StatusFilter }[] = [
  { label: "Tất cả", value: "all" },
  { label: "Hoạt động", value: "active" },
  { label: "Ngừng hoạt động", value: "inactive" },
];

function StageFlow({ stages, onStageClick, onStageDelete }: {
  stages: PipelineStage[];
  onStageClick: (s: PipelineStage) => void;
  onStageDelete: (s: PipelineStage) => void;
}) {
  const sorted = [...stages].sort((a, b) => a.sequence - b.sequence);
  if (sorted.length === 0) {
    return (
      <p className="text-xs text-gray-400 text-center py-6 italic">
        Chưa có giai đoạn nào — nhấn "Thêm Stage" để tạo
      </p>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {sorted.map((stage, idx) => {
        const isWon = stage.is_won;
        const isLost = stage.is_lost;
        const color = stage.color || "#f97316";

        return (
          <div key={stage.id} className="flex items-center gap-1.5">
            <div
              className="group flex items-center gap-2 px-3 py-1.5 rounded-md border bg-white hover:shadow-sm transition-all duration-150 hover:border-orange-300"
              style={{ borderColor: `${color}40` }}
            >
              {/* Sequence badge */}
              <span
                className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold text-white flex-shrink-0"
                style={{ backgroundColor: color }}
              >
                {stage.sequence}
              </span>

              <button
                onClick={() => onStageClick(stage)}
                title="Click để sửa"
                className="flex items-center gap-2"
              >
                <span className="text-sm font-medium text-gray-800 group-hover:text-gray-900">
                  {stage.name}
                </span>

                {formatStageProbability(stage.probability) && (
                  <span className="text-xs text-gray-400">
                    {formatStageProbability(stage.probability)}
                  </span>
                )}

                {isWon && (
                  <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded">
                    <Trophy className="w-2.5 h-2.5" /> WON
                  </span>
                )}
                {isLost && (
                  <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold bg-red-100 text-red-600 px-1.5 py-0.5 rounded">
                    <XCircle className="w-2.5 h-2.5" /> LOST
                  </span>
                )}
              </button>

              {/* Delete button — visible on hover */}
              <button
                onClick={(e) => { e.stopPropagation(); onStageDelete(stage); }}
                title="Xóa giai đoạn"
                className="opacity-0 group-hover:opacity-100 p-0.5 rounded text-gray-300 hover:text-red-500 hover:bg-red-50 transition-all"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            </div>

            {idx < sorted.length - 1 && (
              <ChevronRight className="w-3.5 h-3.5 text-gray-300 flex-shrink-0" />
            )}
          </div>
        );
      })}
    </div>
  );
}

export default function PipelinePage() {
  const dispatch = useAppDispatch();
  const { pipelines, loading } = useAppSelector((s: RootState) => s.pipeline);

  const [statusFilter, setStatusFilter] = useState<StatusFilter>("active");
  const [showPipelineModal, setShowPipelineModal] = useState(false);
  const [editPipeline, setEditPipeline] = useState<Pipeline | null>(null);
  const [showStageModal, setShowStageModal] = useState(false);
  const [editStage, setEditStage] = useState<PipelineStage | null>(null);
  const [activePipelineId, setActivePipelineId] = useState<number | null>(null);
  const [togglingId, setTogglingId] = useState<number | null>(null);
  const [deleteStageTarget, setDeleteStageTarget] = useState<PipelineStage | null>(null);

  useEffect(() => { dispatch(fetchPipelines()); }, [dispatch]);

  const filtered = pipelines.filter((p) => {
    if (statusFilter === "active") return p.is_active;
    if (statusFilter === "inactive") return !p.is_active;
    return true;
  });

  const counts = {
    all: pipelines.length,
    active: pipelines.filter((p) => p.is_active).length,
    inactive: pipelines.filter((p) => !p.is_active).length,
  };

  // ---- Pipeline CRUD ----
  const handleCreatePipeline = async (dto: CreatePipelineDto) => {
    await dispatch(createPipeline(dto));
    setShowPipelineModal(false);
  };

  const handleUpdatePipeline = async (dto: UpdatePipelineDto) => {
    if (!editPipeline) return;
    await dispatch(updatePipeline({ id: editPipeline.id, data: dto }));
    setShowPipelineModal(false);
    setEditPipeline(null);
  };

  const handleToggleActive = async (pipeline: Pipeline) => {
    setTogglingId(pipeline.id);
    await dispatch(updatePipeline({ id: pipeline.id, data: { is_active: !pipeline.is_active } }));
    setTogglingId(null);
  };

  const stageTypeToFlags = (stage_type: string) => ({
    is_won: stage_type === "won",
    is_lost: stage_type === "lost",
  });

  // ---- Stage CRUD ----
  const handleAddStage = async (raw: any) => {
    if (activePipelineId === null) return;
    const { stage_type, ...rest } = raw;
    const dto: CreatePipelineStageDto = { ...rest, ...stageTypeToFlags(stage_type || "normal") };
    await dispatch(addPipelineStage({ pipelineId: activePipelineId, data: dto }));
    setShowStageModal(false);
    setActivePipelineId(null);
  };

  const handleUpdateStage = async (raw: any) => {
    if (!editStage) return;
    const { stage_type, ...rest } = raw;
    const dto: UpdatePipelineStageDto = { ...rest, ...stageTypeToFlags(stage_type || "normal") };
    await dispatch(updatePipelineStage({ stageId: editStage.id, data: dto }));
    setShowStageModal(false);
    setEditStage(null);
    setActivePipelineId(null);
  };

  const handleDeleteStage = async () => {
    if (!deleteStageTarget) return;
    await dispatch(deletePipelineStage(deleteStageTarget.id));
    setDeleteStageTarget(null);
  };

  const openAddStage = (pipelineId: number) => {
    setActivePipelineId(pipelineId);
    setEditStage(null);
    setShowStageModal(true);
  };

  const openEditStage = (pipelineId: number, stage: PipelineStage) => {
    setActivePipelineId(pipelineId);
    setEditStage(stage);
    setShowStageModal(true);
  };

  return (
    <div className="page-container">
      {/* Header card */}
      <div className="erp-card overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200">
          <div className="flex items-center gap-2.5">
            <span className="w-8 h-8 bg-orange-50 rounded-lg flex items-center justify-center">
              <GitBranch className="w-4 h-4 text-orange-500" />
            </span>
            <div>
              <h1 className="text-base font-semibold text-gray-900">Pipelines</h1>
              <p className="text-xs text-gray-400 mt-0.5">Quản lý phễu bán hàng và các giai đoạn</p>
            </div>
            <span className="ml-1 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-orange-50 text-orange-600">
              {counts[statusFilter]}
            </span>
          </div>
          <Button
            variant="primary"
            size="md"
            leftIcon={<Plus className="w-3.5 h-3.5" />}
            onClick={() => { setEditPipeline(null); setShowPipelineModal(true); }}
          >
            Tạo Pipeline mới
          </Button>
        </div>

        {/* Filter tabs */}
        <div className="px-5 border-b border-gray-100 flex items-center gap-0.5">
          {FILTER_TABS.map((tab) => (
            <button
              key={tab.value}
              onClick={() => setStatusFilter(tab.value)}
              className={[
                "px-3 py-2.5 text-xs font-medium border-b-2 transition-colors",
                statusFilter === tab.value
                  ? "border-orange-500 text-orange-600"
                  : "border-transparent text-gray-500 hover:text-gray-700",
              ].join(" ")}
            >
              {tab.label}
              <span className={[
                "ml-1.5 px-1.5 py-0.5 rounded-full text-[10px] font-semibold",
                statusFilter === tab.value ? "bg-orange-100 text-orange-700" : "bg-gray-100 text-gray-500",
              ].join(" ")}>
                {counts[tab.value]}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-16 gap-3 text-gray-400">
          <div className="w-5 h-5 border-2 border-orange-200 border-t-orange-500 rounded-full animate-spin" />
          <span className="text-sm">Đang tải...</span>
        </div>
      )}

      {/* Empty state */}
      {!loading && filtered.length === 0 && (
        <div className="py-16 flex flex-col items-center gap-2 text-gray-400">
          <GitBranch className="w-10 h-10" />
          <p className="text-sm font-medium">
            {statusFilter === "inactive" ? "Không có Pipeline nào đang ngừng" : "Chưa có Pipeline nào"}
          </p>
          {statusFilter === "active" && (
            <p className="text-xs text-gray-400">Nhấn "Tạo Pipeline mới" để bắt đầu</p>
          )}
        </div>
      )}

      {/* Pipeline cards */}
      {filtered.map((pipeline) => {
        const stages = pipeline.stages || [];
        const isToggling = togglingId === pipeline.id;

        return (
          <div
            key={pipeline.id}
            className={[
              "erp-card overflow-hidden transition-opacity",
              !pipeline.is_active ? "opacity-60" : "",
            ].join(" ")}
          >
            {/* Card header */}
            <div className="px-5 py-3.5 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-semibold text-gray-800">{pipeline.name}</h3>
                    {pipeline.is_default && (
                      <span className="text-[10px] bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full font-medium border border-blue-100">
                        Mặc định
                      </span>
                    )}
                    <span className={[
                      "text-[10px] px-2 py-0.5 rounded-full font-medium border",
                      pipeline.is_active
                        ? "bg-emerald-50 text-emerald-700 border-emerald-100"
                        : "bg-gray-100 text-gray-500 border-gray-200",
                    ].join(" ")}>
                      {pipeline.is_active ? "Hoạt động" : "Ngừng"}
                    </span>
                  </div>
                  {pipeline.description && (
                    <p className="text-xs text-gray-400 mt-0.5 truncate">{pipeline.description}</p>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-1.5 flex-shrink-0">
                {/* Toggle active */}
                <button
                  onClick={() => handleToggleActive(pipeline)}
                  disabled={isToggling}
                  title={pipeline.is_active ? "Ngừng hoạt động" : "Kích hoạt"}
                  className={[
                    "p-1.5 rounded-md transition-colors",
                    pipeline.is_active
                      ? "text-gray-400 hover:text-amber-600 hover:bg-amber-50"
                      : "text-gray-400 hover:text-emerald-600 hover:bg-emerald-50",
                    isToggling ? "opacity-50 cursor-not-allowed" : "",
                  ].join(" ")}
                >
                  <Power className="w-3.5 h-3.5" />
                </button>

                {/* Edit */}
                <button
                  onClick={() => { setEditPipeline(pipeline); setShowPipelineModal(true); }}
                  title="Sửa Pipeline"
                  className="p-1.5 rounded-md text-gray-400 hover:text-orange-600 hover:bg-orange-50 transition-colors"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                </button>

                {/* Add stage */}
                <Button
                  size="xs"
                  variant="outline"
                  leftIcon={<Plus className="w-3 h-3" />}
                  onClick={() => openAddStage(pipeline.id)}
                >
                  Thêm Stage
                </Button>
              </div>
            </div>

            {/* Stage flow */}
            <div className="px-5 py-4">
              <StageFlow
                stages={stages}
                onStageClick={(stage) => openEditStage(pipeline.id, stage)}
                onStageDelete={(stage) => setDeleteStageTarget(stage)}
              />
            </div>
          </div>
        );
      })}

      {/* Pipeline Modal */}
      {showPipelineModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200">
              <h2 className="text-base font-semibold text-gray-900">
                {editPipeline ? "Sửa Pipeline" : "Tạo Pipeline mới"}
              </h2>
              <button
                onClick={() => { setShowPipelineModal(false); setEditPipeline(null); }}
                className="p-1.5 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-5">
              <GenericForm
                initialValues={
                  editPipeline
                    ? { name: editPipeline.name, description: editPipeline.description || "" }
                    : { name: "", description: "" }
                }
                config={pipelineFormConfig}
                mode={editPipeline ? "edit" : "create"}
                onSubmit={(values) =>
                  editPipeline
                    ? handleUpdatePipeline(values as UpdatePipelineDto)
                    : handleCreatePipeline(values as CreatePipelineDto)
                }
                onCancel={() => { setShowPipelineModal(false); setEditPipeline(null); }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Delete Stage Confirm */}
      <ActionConfirmModal
        isOpen={!!deleteStageTarget}
        onClose={() => setDeleteStageTarget(null)}
        title="Xóa giai đoạn"
        description={`Xóa giai đoạn "${deleteStageTarget?.name}"? Các Opportunity đang ở giai đoạn này sẽ mất liên kết. Hành động không thể hoàn tác.`}
        confirmText="Xóa"
        variant="danger"
        onConfirm={handleDeleteStage}
      />

      {/* Stage Modal */}
      {showStageModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200">
              <h2 className="text-base font-semibold text-gray-900">
                {editStage ? "Sửa giai đoạn" : "Thêm giai đoạn mới"}
              </h2>
              <button
                onClick={() => { setShowStageModal(false); setEditStage(null); setActivePipelineId(null); }}
                className="p-1.5 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-5">
              <GenericForm
                initialValues={
                  editStage
                    ? {
                        name: editStage.name,
                        sequence: editStage.sequence,
                        probability: editStage.probability,
                        color: editStage.color || "#f97316",
                        stage_type: editStage.is_won ? "won" : editStage.is_lost ? "lost" : "normal",
                      }
                    : {
                        name: "",
                        probability: 0,
                        color: "#f97316",
                        stage_type: "normal",
                      }
                }
                config={editStage ? editPipelineStageFormConfig : createPipelineStageFormConfig()}
                mode={editStage ? "edit" : "create"}
                onSubmit={editStage ? handleUpdateStage : handleAddStage}
                onCancel={() => { setShowStageModal(false); setEditStage(null); setActivePipelineId(null); }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
