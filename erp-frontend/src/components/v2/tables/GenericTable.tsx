/**
 * GenericTable Component
 * @description Reusable table component with sorting, pagination, and search
 * @author Senior Frontend Team
 */

import { useState } from 'react';
import { GenericTableProps, ColumnDef, SortInfo } from './types';
import { Button } from '@/components/ui/Button';
import { Search, ChevronUp, ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react';
import { usePaginationConfig } from '@/hooks/useAppConfig';

export function GenericTable<T extends Record<string, any>>({
  data,
  config,
  loading = false,
  pagination,
  onPageChange,
  onPageSizeChange,
  onSortChange,
  onSearchChange,
  selectedRows = [],
  onSelectionChange,
  className = '',
  title,
  description,
  toolbarActions,
}: GenericTableProps<T>) {
  const paginationConfig = usePaginationConfig();
  const [sortState, setSortState] = useState<SortInfo | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const rowKey = config.rowKey || 'id';

  /**
   * Handle sort
   */
  const handleSort = (column: ColumnDef<T>) => {
    if (!column.sortable) return;

    const newSort: SortInfo = {
      key: String(column.key),
      order: sortState?.key === column.key && sortState.order === 'asc' ? 'desc' : 'asc',
    };

    setSortState(newSort);
    onSortChange?.(newSort);
  };

  /**
   * Handle search
   */
  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    onSearchChange?.(value);
  };

  /**
   * Handle select all
   */
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      onSelectionChange?.(data);
    } else {
      onSelectionChange?.([]);
    }
  };

  /**
   * Handle select row
   */
  const handleSelectRow = (row: T) => {
    const isSelected = selectedRows.some(r => r[rowKey] === row[rowKey]);
    
    if (isSelected) {
      onSelectionChange?.(selectedRows.filter(r => r[rowKey] !== row[rowKey]));
    } else {
      onSelectionChange?.([...selectedRows, row]);
    }
  };

  /**
   * Render sort icon
   */
  const renderSortIcon = (column: ColumnDef<T>) => {
    if (!column.sortable) return null;

    const isSorted = sortState?.key === column.key;
    
    return (
      <span className="ml-1 inline-flex flex-col">
        {isSorted && sortState.order === 'asc' ? (
          <ChevronUp className="w-4 h-4 text-brand-500" />
        ) : isSorted && sortState.order === 'desc' ? (
          <ChevronDown className="w-4 h-4 text-brand-500" />
        ) : (
          <ChevronDown className="w-4 h-4 text-gray-400" />
        )}
      </span>
    );
  };

  /**
   * Render cell value
   */
  const renderCell = (column: ColumnDef<T>, row: T, index: number) => {
    const value = row[column.key as keyof T];
    
    if (column.render) {
      return column.render(value, row, index);
    }
    
    return value?.toString() || '-';
  };

  /**
   * Render actions
   */
  const renderActions = (row: T, mobile = false) => {
    if (!config.actions || config.actions.length === 0) return null;

    const visibleActions = config.actions.filter(action => 
      !action.show || action.show(row)
    );

    if (visibleActions.length === 0) return null;

    return (
      <div className={mobile ? "flex flex-wrap items-center justify-end gap-2" : "flex flex-wrap items-center justify-end gap-2"}>
        {visibleActions.map((action, index) => {
          const isDisabled = action.disabled?.(row);
          
          return (
            <button
              key={index}
              onClick={() => !isDisabled && action.onClick(row)}
              disabled={isDisabled}
              className={`${mobile ? "min-h-9 px-3 py-1.5" : "min-h-8 px-3 py-1"} text-sm rounded-md transition-colors whitespace-normal text-center ${
                action.variant === 'danger'
                  ? 'text-red-600 hover:bg-red-50'
                  : action.variant === 'success'
                  ? 'text-green-600 hover:bg-green-50'
                  : 'text-brand-600 hover:bg-brand-50'
              } ${isDisabled ? 'opacity-50 cursor-not-allowed' : ''}`}
              title={action.label}
            >
              {action.icon || action.label}
            </button>
          );
        })}
      </div>
    );
  };

  /**
   * Render pagination
   */
  const renderPagination = () => {
    if (!config.pagination || !pagination) return null;

    const { currentPage, totalPages, pageSize, totalItems } = pagination;
    const start = (currentPage - 1) * pageSize + 1;
    const end = Math.min(currentPage * pageSize, totalItems);

    return (
      <div className="flex flex-col gap-3 px-4 sm:px-6 py-4 border-t border-gray-200 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-4">
          <span className="text-sm text-gray-700">
            Showing {start} to {end} of {totalItems} results
          </span>
          
          <select
            value={pageSize}
            onChange={(e) => onPageSizeChange?.(Number(e.target.value))}
            className="w-full sm:w-auto px-3 py-1 border border-gray-300 rounded-md text-sm"
          >
            {paginationConfig.pageSizeOptions.map(size => (
              <option key={size} value={size}>{size} per page</option>
            ))}
          </select>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange?.(currentPage - 1)}
            disabled={currentPage === 1}
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          
          <span className="text-sm text-gray-700">
            Page {currentPage} of {totalPages}
          </span>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange?.(currentPage + 1)}
            disabled={currentPage === totalPages}
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>
    );
  };

  return (
    <div className={`bg-white rounded-lg shadow-sm border border-gray-200 min-w-0 ${className}`}>
      {/* Header */}
      {(title || description || config.searchable || toolbarActions) && (
        <div className="px-4 sm:px-6 py-4 border-b border-gray-200">
          <div className="flex flex-col gap-3 mb-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              {title && <h2 className="text-xl font-bold text-gray-900 break-words">{title}</h2>}
              {description && <p className="text-sm text-gray-600 mt-1 break-words">{description}</p>}
            </div>
            {toolbarActions && <div className="flex flex-wrap items-center gap-2">{toolbarActions}</div>}
          </div>

          {config.searchable && (
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => handleSearchChange(e.target.value)}
                placeholder={config.searchPlaceholder || 'Search...'}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none"
              />
            </div>
          )}
        </div>
      )}

      {/* Mobile cards */}
      <div className="space-y-3 p-3 md:hidden">
        {loading ? (
          <div className="rounded-lg border border-gray-200 bg-white px-4 py-10 text-center text-sm text-gray-500">
            {config.loadingMessage || 'Loading...'}
          </div>
        ) : data.length === 0 ? (
          <div className="rounded-lg border border-gray-200 bg-white px-4 py-10 text-center text-sm text-gray-500">
            {config.emptyMessage || 'No data available'}
          </div>
        ) : (
          data.map((row, rowIndex) => {
            const isSelected = selectedRows.some(r => r[rowKey] === row[rowKey]);
            const visibleColumns = config.columns.filter(column => !column.hideOnMobile);
            const [primaryColumn, ...detailColumns] = visibleColumns.length > 0 ? visibleColumns : config.columns;

            return (
              <article
                key={row[rowKey] || rowIndex}
                className={`rounded-lg border border-gray-200 bg-white p-4 shadow-sm ${
                  config.onRowClick ? 'cursor-pointer active:bg-gray-50' : ''
                } ${isSelected ? 'border-orange-200 bg-orange-50/30' : ''}`}
                onClick={() => config.onRowClick?.(row)}
              >
                <div className="flex items-start gap-3">
                  {config.selectable && (
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => handleSelectRow(row)}
                      onClick={(e) => e.stopPropagation()}
                      className="mt-1 w-4 h-4 text-brand-500 bg-gray-100 border-gray-300 rounded focus:ring-brand-500"
                    />
                  )}

                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                      {primaryColumn?.label || 'Record'}
                    </p>
                    <div className="mt-1 text-sm font-semibold text-gray-900 break-words">
                      {primaryColumn ? renderCell(primaryColumn, row, rowIndex) : row[rowKey]}
                    </div>
                  </div>
                </div>

                {detailColumns.length > 0 && (
                  <dl className="mt-4 space-y-3">
                    {detailColumns.slice(0, 6).map((column, index) => (
                      <div key={index} className="flex items-start justify-between gap-3 border-t border-gray-100 pt-3">
                        <dt className="min-w-[6rem] text-xs font-medium text-gray-500">
                          {column.label}
                        </dt>
                        <dd className="min-w-0 flex-1 text-right text-sm text-gray-800 break-words">
                          {renderCell(column, row, rowIndex)}
                        </dd>
                      </div>
                    ))}
                  </dl>
                )}

                {config.actions && config.actions.length > 0 && (
                  <div className="mt-4 flex flex-wrap items-center justify-end gap-2 border-t border-gray-100 pt-3" onClick={(e) => e.stopPropagation()}>
                    {renderActions(row, true)}
                  </div>
                )}
              </article>
            );
          })
        )}
      </div>

      {/* Desktop table */}
      <div className="hidden overflow-x-auto md:block">
        <table className="w-full min-w-[44rem]">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              {config.selectable && (
                <th className="px-6 py-3 text-left w-12">
                  <input
                    type="checkbox"
                    checked={selectedRows.length === data.length && data.length > 0}
                    onChange={(e) => handleSelectAll(e.target.checked)}
                    className="w-4 h-4 text-brand-500 bg-gray-100 border-gray-300 rounded focus:ring-brand-500"
                  />
                </th>
              )}
              
              {config.columns.map((column, index) => (
                <th
                  key={index}
                  className={`px-3 sm:px-6 py-3 text-${column.align || 'left'} text-xs font-medium text-gray-700 uppercase tracking-wider whitespace-nowrap ${
                    column.sortable ? 'cursor-pointer hover:bg-gray-100' : ''
                  } ${column.hideOnMobile ? 'hidden md:table-cell' : ''}`}
                  style={{ width: column.width }}
                  onClick={() => handleSort(column)}
                >
                  <div className="flex items-center">
                    {column.label}
                    {renderSortIcon(column)}
                  </div>
                </th>
              ))}
              
              {config.actions && config.actions.length > 0 && (
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-700 uppercase tracking-wider">
                  Actions
                </th>
              )}
            </tr>
          </thead>
          
          <tbody className="bg-white divide-y divide-gray-200">
            {loading ? (
              <tr>
                <td
                  colSpan={config.columns.length + (config.selectable ? 1 : 0) + (config.actions ? 1 : 0)}
                  className="px-6 py-12 text-center text-gray-500"
                >
                  {config.loadingMessage || 'Loading...'}
                </td>
              </tr>
            ) : data.length === 0 ? (
              <tr>
                <td
                  colSpan={config.columns.length + (config.selectable ? 1 : 0) + (config.actions ? 1 : 0)}
                  className="px-6 py-12 text-center text-gray-500"
                >
                  {config.emptyMessage || 'No data available'}
                </td>
              </tr>
            ) : (
              data.map((row, rowIndex) => {
                const isSelected = selectedRows.some(r => r[rowKey] === row[rowKey]);
                const rowClass = config.rowClassName?.(row) || '';
                
                return (
                  <tr
                    key={row[rowKey] || rowIndex}
                    className={`hover:bg-gray-50 transition-colors ${
                      config.onRowClick ? 'cursor-pointer' : ''
                    } ${isSelected ? 'bg-brand-50' : ''} ${rowClass}`}
                    onClick={() => config.onRowClick?.(row)}
                  >
                    {config.selectable && (
                      <td className="px-6 py-4">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleSelectRow(row)}
                          onClick={(e) => e.stopPropagation()}
                          className="w-4 h-4 text-brand-500 bg-gray-100 border-gray-300 rounded focus:ring-brand-500"
                        />
                      </td>
                    )}
                    
                    {config.columns.map((column, colIndex) => (
                      <td
                        key={colIndex}
                        className={`px-3 sm:px-6 py-4 text-sm text-gray-900 align-top ${column.hideOnMobile ? 'hidden md:table-cell' : ''} ${column.className || ''}`}
                        style={{ textAlign: column.align || 'left' }}
                      >
                        <div className="max-w-[18rem] break-words">
                          {renderCell(column, row, rowIndex)}
                        </div>
                      </td>
                    ))}
                    
                    {config.actions && config.actions.length > 0 && (
                      <td className="px-3 sm:px-6 py-4 text-right align-top" onClick={(e) => e.stopPropagation()}>
                        {renderActions(row)}
                      </td>
                    )}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {renderPagination()}
    </div>
  );
}
