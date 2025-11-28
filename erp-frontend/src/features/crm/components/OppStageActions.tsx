import { Button } from "@/components/ui/buttonn";

export default function OppStageActions({
  stage,
  onChangeStage,
  onDelete,
}: {
  stage: string;
  onChangeStage: (s: string) => void;
  onDelete: () => void;
}) {
  return (
    <div className="flex gap-2">
      {stage === "prospecting" && (
        <>
          <Button onClick={() => onChangeStage("negotiation")}>
            Negotiation
          </Button>
          <Button variant="destructive" onClick={() => onChangeStage("lost")}>
            Mark Lost
          </Button>
        </>
      )}

      {stage === "negotiation" && (
        <>
          <Button onClick={() => onChangeStage("won")}>Mark Won</Button>
          <Button variant="destructive" onClick={() => onChangeStage("lost")}>
            Mark Lost
          </Button>
        </>
      )}

      {stage === "lost" && (
        <Button onClick={() => onChangeStage("prospecting")}>Reopen</Button>
      )}

      <Button variant="destructive" onClick={onDelete}>
        Delete
      </Button>
    </div>
  );
}
