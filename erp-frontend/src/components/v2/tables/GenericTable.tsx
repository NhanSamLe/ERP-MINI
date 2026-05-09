/**
 * GenericTable Component
 * @description Reusable table component with sorting, pagination, and search
 * @author Senior Frontend Team
 */

import React, { useState } from 'react';
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
  const renderActions = (row: T) => {
    if (!config.actions || config.actions.length === 0) return null;

    const visibleActions = config.actions.filter(action => 
      !action.show || action.show(row)
    );

    if (visibleActions.length === 0) return null;

    return (
      <div className="flex items-center gap-2">
        {visibleActions.map((action, index) => {
          const isDisabled = action.disabled?.(row);
          
          return (
            <button
              key={index}
              onClick={() => !isDisabled && action.onClick(row)}
              disabled={isDisabled}
              className={`px-3 py-1 text-sm rounded-md transition-colors ${
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
      <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200">
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-700">
            Showing {start} to {end} of {totalItems} results
          </span>
          
          <select
            value={pageSize}
            onChange={(e) => onPageSizeChange?.(Number(e.target.value))}
            className="px-3 py-1 border border-gray-300 rounded-md text-sm"
          >
            {paginationConfig.pageSizeOptions.map(size => (
              <option key={size} value={size}>{size} per page</option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2">
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
    <div className={`bg-white rounded-lg shadow-sm border border-gray-200 ${className}`}>
      {/* Header */}
      {(title || description || config.searchable || toolbarActions) && (
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <div>
              {title && <h2 className="text-xl font-bold text-gray-900">{title}</h2>}
              {description && <p className="text-sm text-gray-600 mt-1">{description}</p>}
            </div>
            {toolbarActions && <div>{toolbarActions}</div>}
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

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
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
                  className={`px-6 py-3 text-${column.align || 'left'} text-xs font-medium text-gray-700 uppercase tracking-wider ${
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
                        className={`px-6 py-4 text-sm text-gray-900 ${column.hideOnMobile ? 'hidden md:table-cell' : ''} ${column.className || ''}`}
                        style={{ textAlign: column.align || 'left' }}
                      >
                        {renderCell(column, row, rowIndex)}
                      </td>
                    ))}
                    
                    {config.actions && config.actions.length > 0 && (
                      <td className="px-6 py-4 text-right" onClick={(e) => e.stopPropagation()}>
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
