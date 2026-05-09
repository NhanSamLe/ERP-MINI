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
}

export interface UpdateScoringRuleDto {
  name?: string;
  field?: string;
  operator?: string;
  value?: string;
  score?: number;
  is_active?: boolean;
}
