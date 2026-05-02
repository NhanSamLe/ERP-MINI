/**
 * Table Types and Interfaces
 * @description Type definitions for generic table components
 * @author Senior Frontend Team
 */

import { ReactNode } from 'react';

/**
 * Column definition
 */
export interface ColumnDef<T = any> {
  /** Column key (field name in data) */
  key: keyof T | string;
  
  /** Column header label */
  label: string;
  
  /** Column width */
  width?: string;
  
  /** Is column sortable */
  sortable?: boolean;
  
  /** Custom render function */
  render?: (value: any, row: T, index: number) => ReactNode;
  
  /** Cell alignment */
  align?: 'left' | 'center' | 'right';
  
  /** Hide column on mobile */
  hideOnMobile?: boolean;
  
  /** Column CSS class */
  className?: string;
}

/**
 * Table action definition
 */
export interface TableAction<T = any> {
  /** Action label */
  label: string;
  
  /** Action icon */
  icon?: ReactNode;
  
  /** Action handler */
  onClick: (row: T) => void;
  
  /** Show action conditionally */
  show?: (row: T) => boolean;
  
  /** Action variant */
  variant?: 'primary' | 'secondary' | 'danger' | 'success';
  
  /** Is action disabled */
  disabled?: (row: T) => boolean;
}

/**
 * Pagination info
 */
export interface PaginationInfo {
  currentPage: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
}

/**
 * Sort info
 */
export interface SortInfo {
  key: string;
  order: 'asc' | 'desc';
}

/**
 * Table configuration
 */
export interface TableConfig<T = any> {
  /** Table columns */
  columns: ColumnDef<T>[];
  
  /** Row actions */
  actions?: TableAction<T>[];
  
  /** Show selection checkboxes */
  selectable?: boolean;
  
  /** Enable pagination */
  pagination?: boolean;
  
  /** Enable sorting */
  sortable?: boolean;
  
  /** Enable search */
  searchable?: boolean;
  
  /** Search placeholder */
  searchPlaceholder?: string;
  
  /** Empty state message */
  emptyMessage?: string;
  
  /** Loading state message */
  loadingMessage?: string;
  
  /** Row key field */
  rowKey?: keyof T | string;
  
  /** Row click handler */
  onRowClick?: (row: T) => void;
  
  /** Row CSS class */
  rowClassName?: (row: T) => string;
}

/**
 * Generic table props
 */
export interface GenericTableProps<T = any> {
  /** Table data */
  data: T[];
  
  /** Table configuration */
  config: TableConfig<T>;
  
  /** Loading state */
  loading?: boolean;
  
  /** Pagination info */
  pagination?: PaginationInfo;
  
  /** Page change handler */
  onPageChange?: (page: number) => void;
  
  /** Page size change handler */
  onPageSizeChange?: (pageSize: number) => void;
  
  /** Sort change handler */
  onSortChange?: (sort: SortInfo) => void;
  
  /** Search change handler */
  onSearchChange?: (search: string) => void;
  
  /** Selected rows */
  selectedRows?: T[];
  
  /** Selection change handler */
  onSelectionChange?: (rows: T[]) => void;
  
  /** Additional CSS classes */
  className?: string;
  
  /** Table title */
  title?: string;
  
  /** Table description */
  description?: string;
  
  /** Custom toolbar actions */
  toolbarActions?: ReactNode;
}

/**
 * Table state
 */
export interface TableState<T = any> {
  data: T[];
  filteredData: T[];
  selectedRows: T[];
  currentPage: number;
  pageSize: number;
  sortKey: string | null;
  sortOrder: 'asc' | 'desc';
  searchQuery: string;
}
