import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { PipelineStage } from "../dto/pipeline.dto";
import { ChevronDown } from "lucide-react";

interface OppStageActionsProps {
  currentStageId: number | null | undefined;
  stages: PipelineStage[];
  onChangeStage: (stageId: number) => void;
  onMarkWon: () => void;
  onMarkLost: (reason: string) => void;
  onDelete: () => void;
}

export default function OppStageActions({
  currentStageId,
  stages,
  onChangeStage,
  onMarkWon,
  onMarkLost,
  onDelete,
}: OppStageActionsProps) {
  const [showStageMenu, setShowStageMenu] = useState(false);
  const [showLostModal, setShowLostModal] = useState(false);
  const [lostReason, setLostReason] = useState("");

  const currentStage = stages.find((s) => s.id === currentStageId);
  const otherStages = stages.filter((s) => s.id !== currentStageId);

  const handleStageSelect = (stage: PipelineStage) => {
    setShowStageMenu(false);
    if (stage.is_won) {
      onMarkWon();
    } else if (stage.is_lost) {
      setLostReason("");
      setShowLostModal(true);
    } else {
      onChangeStage(stage.id);
    }
  };

  const handleLostConfirm = () => {
    if (!lostReason.trim()) return;
    onMarkLost(lostReason);
    setShowLostModal(false);
    setLostReason("");
  };

  return (
    <div className="flex items-center gap-2">
      {/* Current stage badge */}
      {currentStage && (
        <span
          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border text-sm font-medium"
          style={{
            borderColor: currentStage.color || "#f97316",
            backgroundColor: (currentStage.color || "#f97316") + "15",
            color: currentStage.color || "#f97316",
          }}
        >
          <span
            className="w-2 h-2 rounded-full"
            style={{ backgroundColor: currentStage.color || "#f97316" }}
          />
          {currentStage.name}
        </span>
      )}

      {/* Stage transition dropdown */}
      {otherStages.length > 0 && (
        <div className="relative">
          <Button
            variant="outline"
            size="sm"
            rightIcon={<ChevronDown className="w-3 h-3" />}
            onClick={() => setShowStageMenu(!showStageMenu)}
          >
            Chuyển giai đoạn
          </Button>

          {showStageMenu && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setShowStageMenu(false)} />
              <div className="absolute right-0 top-full mt-1 w-56 bg-white rounded-lg border border-gray-200 shadow-lg z-20 py-1">
                {otherStages.map((stage) => (
                  <button
                    key={stage.id}
                    className="w-full text-left px-4 py-2.5 text-sm hover:bg-gray-50 flex items-center gap-2"
                    onClick={() => handleStageSelect(stage)}
                  >
                    <span
                      className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                      style={{ backgroundColor: stage.color || "#f97316" }}
                    />
                    <span>{stage.name}</span>
                    {stage.is_won && (
                      <span className="ml-auto text-[10px] font-semibold bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded">WON</span>
                    )}
                    {stage.is_lost && (
                      <span className="ml-auto text-[10px] font-semibold bg-red-100 text-red-600 px-1.5 py-0.5 rounded">LOST</span>
                    )}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {/* Delete button */}
      <Button variant="danger" size="sm" onClick={onDelete}>
        Xóa
      </Button>

      {/* Lost reason modal */}
      {showLostModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-5">
            <h3 className="text-base font-semibold text-gray-900 mb-3">Lý do thua</h3>
            <textarea
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none"
              rows={3}
              placeholder="Nhập lý do thua..."
              value={lostReason}
              onChange={(e) => setLostReason(e.target.value)}
            />
            <div className="flex justify-end gap-2 mt-4">
              <Button variant="outline" size="sm" onClick={() => setShowLostModal(false)}>
                Hủy
              </Button>
              <Button variant="danger" size="sm" onClick={handleLostConfirm} disabled={!lostReason.trim()}>
                Xác nhận thua
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
