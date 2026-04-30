export interface BulkApproveRequestDto {
  po_ids: number[];
}

export interface BulkCancelRequestDto {
  po_ids: number[];
  reason: string;
}

export interface AuditLogFilterDto {
  action?: string;
  date_from?: string;
  date_to?: string;
  page?: number;
  limit?: number;
}
