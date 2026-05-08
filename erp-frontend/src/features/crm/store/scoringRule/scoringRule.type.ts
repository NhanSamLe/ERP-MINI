import { ScoringRule } from "../../dto/scoringRule.dto";

export interface ScoringRuleState {
  scoringRules: ScoringRule[];
  loading: boolean;
  error: string | null;
}
