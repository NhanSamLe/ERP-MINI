export interface ScoringRule {
  id: number;
  name: string;
  field: string;
  operator: string;
  value: string | null;
  score: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateScoringRuleDto {
  name: string;
  field: string;
  operator: string;
  value?: string;
  score: number;
  is_active?: boolean;
}

export interface UpdateScoringRuleDto {
  name?: string;
  field?: string;
  operator?: string;
  value?: string;
  score?: number;
  is_active?: boolean;
}

export type ScoringSignalType = "text" | "number" | "boolean" | "select" | "multi_select";
export type ScoringCategory = "fit" | "intent" | "engagement" | "risk" | "data_quality";

export interface ScoringSignal {
  key: string;
  label: string;
  category: ScoringCategory;
  type: ScoringSignalType;
  operators: string[];
  valueRequired: boolean;
  helpText?: string;
  options?: Array<{ value: string; label: string }>;
}

export interface ScoringOperator {
  value: string;
  label: string;
}

export interface ScoringSignalsResponse {
  signals: ScoringSignal[];
  operators: ScoringOperator[];
  grades: Array<{
    grade: "cold" | "warm" | "hot";
    min: number;
    max: number;
    label: string;
    recommendation: string;
  }>;
}

export interface ScoringRulePreviewDto {
  lead_id: number;
  rule: CreateScoringRuleDto | UpdateScoringRuleDto;
}

export interface ScoringRulePreview {
  matched: boolean;
  signal: {
    key: string;
    label: string;
    category: ScoringCategory;
    type: ScoringSignalType;
  };
  operator: string;
  operator_label: string;
  expected_value: string | null;
  actual_value: unknown;
  score_delta: number;
  message: string;
}
