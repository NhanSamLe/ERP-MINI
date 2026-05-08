export interface LeadSource {
  id: number;
  name: string;
  description: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateLeadSourceDto {
  name: string;
  description?: string;
}

export interface UpdateLeadSourceDto {
  name?: string;
  description?: string;
  is_active?: boolean;
}
