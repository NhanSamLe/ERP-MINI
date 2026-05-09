import { useEffect, useState } from "react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { RootState } from "@/store/store";
import {
  fetchPipelines,
  createPipeline,
  updatePipeline,
  addPipelineStage,
  updatePipelineStage,
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
import { Plus, GitBranch, X, Edit3 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { ActionConfirmModal } from "@/components/common";

function StageBadge({ stage }: { stage: PipelineStage }) {
  return (
    <div className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md border border-gray-200 bg-white text-sm">
      <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: stage.color || "#f97316" }} />
      <span className="font-medium text-gray-800">{stage.name}</span>
      <span className="text-xs text-gray-400">({Math.round(stage.probability || 0)}%)</span>
      {stage.is_won && <span className="text-[10px] font-semibold bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded">WON</span>}
      {stage.is_lost && <span className="text-[10px] font-semibold bg-red-100 text-red-600 px-1.5 py-0.5 rounded">LOST</span>}
    </div>
  );
}

export default function PipelinePage() {
  const dispatch = useAppDispatch();
  const { pipelines, loading } = useAppSelector((s: RootState) => s.pipeline);

  const [showPipelineModal, setShowPipelineModal] = useState(false);
  const [editPipeline, setEditPipeline] = useState<Pipeline | null>(null);
  const [showStageModal, setShowStageModal] = useState(false);
  const [editStage, setEditStage] = useState<PipelineStage | null>(null);
  const [activePipelineId, setActivePipelineId] = useState<number | null>(null);

  useEffect(() => { dispatch(fetchPipelines()); }, [dispatch]);

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

  // ---- Stage CRUD ----
  const handleAddStage = async (dto: CreatePipelineStageDto) => {
    if (activePipelineId === null) return;
    await dispatch(addPipelineStage({ pipelineId: activePipelineId, data: dto }));
    setShowStageModal(false);
    setActivePipelineId(null);
  };

  const handleUpdateStage = async (dto: UpdatePipelineStageDto) => {
    if (!editStage) return;
    await dispatch(updatePipelineStage({ stageId: editStage.id, data: dto }));
    setShowStageModal(false);
    setEditStage(null);
    setActivePipelineId(null);
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

  const stageFormConfig = editStage
    ? editPipelineStageFormConfig
    : createPipelineStageFormConfig(
        (pipelines.find((p) => p.id === activePipelineId)?.stages || []).length
      );

  return (
    <div className="page-container">
      {/* Header */}
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
              {pipelines.length}
            </span>
          </div>
          <Button variant="primary" size="md" leftIcon={<Plus className="w-3.5 h-3.5" />} onClick={() => { setEditPipeline(null); setShowPipelineModal(true); }}>
            Tạo Pipeline mới
          </Button>
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex flex-col items-center justify-center py-16 gap-3 text-gray-400">
          <div className="w-6 h-6 border-2 border-orange-200 border-t-orange-500 rounded-full animate-spin" />
          <span className="text-sm">Đang tải...</span>
        </div>
      )}

      {/* Empty State */}
      {!loading && pipelines.length === 0 && (
        <div className="py-16 flex flex-col items-center gap-2 text-gray-400">
          <GitBranch className="w-10 h-10" />
          <p className="text-sm font-medium">Chưa có Phễu bán hàng nào</p>
          <p className="text-xs text-gray-400">Tạo Pipeline đầu tiên để bắt đầu quản lý quy trình bán hàng</p>
        </div>
      )}

      {/* Pipeline Cards */}
      {pipelines.map((pipeline) => {
        const stages = pipeline.stages || [];
        return (
          <div key={pipeline.id} className="erp-card overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-gray-800">{pipeline.name}</h3>
                {pipeline.description && <p className="text-xs text-gray-500 mt-0.5">{pipeline.description}</p>}
              </div>
              <div className="flex items-center gap-2">
                {pipeline.is_default && (
                  <span className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full font-medium">Mặc định</span>
                )}
                <button
                  className="p-1.5 rounded-md text-gray-400 hover:text-orange-600 hover:bg-orange-50 transition-colors"
                  onClick={() => { setEditPipeline(pipeline); setShowPipelineModal(true); }}
                  title="Sửa Pipeline"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                </button>
                <Button size="xs" variant="outline" leftIcon={<Plus className="w-3 h-3" />} onClick={() => openAddStage(pipeline.id)}>
                  Thêm Stage
                </Button>
              </div>
            </div>

            <div className="px-5 py-4">
              {stages.length === 0 ? (
                <p className="text-xs text-gray-400 text-center py-4">Chưa có giai đoạn nào. Nhấn "Thêm Stage" để tạo.</p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {[...stages]
                    .sort((a, b) => a.sequence - b.sequence)
                    .map((stage) => (
                      <button
                        key={stage.id}
                        className="cursor-pointer transition-opacity hover:opacity-80"
                        onClick={() => openEditStage(pipeline.id, stage)}
                        title="Click để sửa"
                      >
                        <StageBadge stage={stage} />
                      </button>
                    ))}
                </div>
              )}
            </div>
          </div>
        );
      })}

      {/* Pipeline Modal */}
      {showPipelineModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200">
              <h2 className="text-base font-semibold text-gray-900">
                {editPipeline ? "Sửa Pipeline" : "Tạo Pipeline mới"}
              </h2>
              <button onClick={() => { setShowPipelineModal(false); setEditPipeline(null); }} className="p-1.5 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-5">
              <GenericForm
                initialValues={editPipeline ? { name: editPipeline.name, description: editPipeline.description || "" } : { name: "", description: "" }}
                config={pipelineFormConfig}
                mode={editPipeline ? "edit" : "create"}
                onSubmit={editPipeline ? handleUpdatePipeline : handleCreatePipeline}
                onCancel={() => { setShowPipelineModal(false); setEditPipeline(null); }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Stage Modal */}
      {showStageModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200">
              <h2 className="text-base font-semibold text-gray-900">
                {editStage ? "Sửa giai đoạn" : "Thêm giai đoạn mới"}
              </h2>
              <button onClick={() => { setShowStageModal(false); setEditStage(null); setActivePipelineId(null); }} className="p-1.5 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100">
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
                        is_won: editStage.is_won,
                        is_lost: editStage.is_lost,
                      }
                    : {
                        name: "",
                        sequence: ((pipelines.find((p) => p.id === activePipelineId)?.stages || []).length || 0) + 1,
                        probability: 0,
                        color: "#f97316",
                        is_won: false,
                        is_lost: false,
                      }
                }
                config={stageFormConfig}
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
