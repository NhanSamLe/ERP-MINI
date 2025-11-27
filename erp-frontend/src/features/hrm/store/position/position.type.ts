export interface Position {
  id: number;
  branch_id: number;
  name: string;
  created_at?: string;
  updated_at?: string;
}

export interface PositionFilter {
  search?: string;
  branch_id?: number;
}
