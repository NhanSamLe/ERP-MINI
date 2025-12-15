export interface Column<T> {
  key: keyof T | string;
  label: string;
  render?: (item: T) => React.ReactNode;
  sortable?: boolean;
}
export interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  onView?: (item: T) => void;
  onEdit?: (item: T) => void;
  onDelete?: (item: T) => void;
  canEdit?: (item: T) => boolean;
  canDelete?: (item: T) => boolean;
  loading?: boolean;
  searchable?: boolean;
  searchKeys?: (keyof T)[];
  itemsPerPage?: number;
  showSelection?: boolean;
  showActions?: boolean;
  onRowClick?: (row: T) => void;
  extraActions?: (item: T) => React.ReactNode;
}
