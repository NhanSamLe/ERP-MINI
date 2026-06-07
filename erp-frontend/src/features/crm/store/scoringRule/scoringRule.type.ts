import {
  ScoringRule,
  ScoringRulePreview,
  ScoringSignalsResponse,
} from "../../dto/scoringRule.dto";

export interface ScoringRuleState {
  scoringRules: ScoringRule[];
  metadata: ScoringSignalsResponse | null;
  preview: ScoringRulePreview | null;
  loading: boolean;
  previewLoading: boolean;
  error: string | null;
}
