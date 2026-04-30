export interface SearchQueryDto {
  po_no?: string;
  supplier_id?: number;
  status?: string[];
  date_from?: string;
  date_to?: string;
  total_from?: number;
  total_to?: number;
  page?: number;
  limit?: number;
  sort_by?: string;
  sort_order?: "ASC" | "DESC";
}
