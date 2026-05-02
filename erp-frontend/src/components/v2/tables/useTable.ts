/**
 * useTable Hook
 * @description Custom hook for table state management
 * @author Senior Frontend Team
 */

import { useState, useMemo, useCallback } from 'react';
import { TableState, SortInfo } from './types';
import { usePaginationConfig } from '@/hooks/useAppConfig';

interface UseTableOptions<T> {
  data: T[];
  initialPageSize?: number;
  initialSortKey?: string;
  initialSortOrder?: 'asc' | 'desc';
  searchFields?: (keyof T)[];
}

export function useTable<T extends Record<string, any>>({
  data,
  initialPageSize,
  initialSortKey = null,
  initialSortOrder = 'desc',
  searchFields = [],
}: UseTableOptions<T>) {
  const paginationConfig = usePaginationConfig();
  
  const [state, setState] = useState<TableState<T>>({
    data,
    filteredData: data,
    selectedRows: [],
    currentPage: 1,
    pageSize: initialPageSize || paginationConfig.defaultPageSize,
    sortKey: initialSortKey,
    sortOrder: initialSortOrder,
    searchQuery: '',
  });

  /**
   * Update data
   */
  const setData = useCallback((newData: T[]) => {
    setState(prev => ({
      ...prev,
      data: newData,
      filteredData: newData,
      currentPage: 1,
    }));
  }, []);

  /**
   * Search data
   */
  const handleSearch = useCallback((query: string) => {
    setState(prev => {
      const lowerQuery = query.toLowerCase();
      
      const filtered = query
        ? prev.data.filter(item =>
            searchFields.some(field => {
              const value = item[field];
              return value?.toString().toLowerCase().includes(lowerQuery);
            })
          )
        : prev.data;

      return {
        ...prev,
        searchQuery: query,
        filteredData: filtered,
        currentPage: 1,
      };
    });
  }, [searchFields]);

  /**
   * Sort data
   */
  const handleSort = useCallback((sortInfo: SortInfo) => {
    setState(prev => {
      const sorted = [...prev.filteredData].sort((a, b) => {
        const aVal = a[sortInfo.key as keyof T];
        const bVal = b[sortInfo.key as keyof T];

        if (aVal === bVal) return 0;
        
        const comparison = aVal > bVal ? 1 : -1;
        return sortInfo.order === 'asc' ? comparison : -comparison;
      });

      return {
        ...prev,
        filteredData: sorted,
        sortKey: sortInfo.key,
        sortOrder: sortInfo.order,
      };
    });
  }, []);

  /**
   * Change page
   */
  const handlePageChange = useCallback((page: number) => {
    setState(prev => ({
      ...prev,
      currentPage: page,
    }));
  }, []);

  /**
   * Change page size
   */
  const handlePageSizeChange = useCallback((pageSize: number) => {
    setState(prev => ({
      ...prev,
      pageSize,
      currentPage: 1,
    }));
  }, []);

  /**
   * Select row
   */
  const handleSelectRow = useCallback((row: T) => {
    setState(prev => {
      const isSelected = prev.selectedRows.includes(row);
      const newSelected = isSelected
        ? prev.selectedRows.filter(r => r !== row)
        : [...prev.selectedRows, row];

      return {
        ...prev,
        selectedRows: newSelected,
      };
    });
  }, []);

  /**
   * Select all rows
   */
  const handleSelectAll = useCallback((selected: boolean) => {
    setState(prev => ({
      ...prev,
      selectedRows: selected ? [...prev.filteredData] : [],
    }));
  }, []);

  /**
   * Clear selection
   */
  const clearSelection = useCallback(() => {
    setState(prev => ({
      ...prev,
      selectedRows: [],
    }));
  }, []);

  /**
   * Get paginated data
   */
  const paginatedData = useMemo(() => {
    const start = (state.currentPage - 1) * state.pageSize;
    const end = start + state.pageSize;
    return state.filteredData.slice(start, end);
  }, [state.filteredData, state.currentPage, state.pageSize]);

  /**
   * Get pagination info
   */
  const paginationInfo = useMemo(() => ({
    currentPage: state.currentPage,
    pageSize: state.pageSize,
    totalItems: state.filteredData.length,
    totalPages: Math.ceil(state.filteredData.length / state.pageSize),
  }), [state.filteredData.length, state.currentPage, state.pageSize]);

  /**
   * Get sort info
   */
  const sortInfo = useMemo(() => 
    state.sortKey ? {
      key: state.sortKey,
      order: state.sortOrder,
    } : null,
  [state.sortKey, state.sortOrder]);

  return {
    // State
    data: paginatedData,
    allData: state.filteredData,
    selectedRows: state.selectedRows,
    searchQuery: state.searchQuery,
    paginationInfo,
    sortInfo,
    
    // Actions
    setData,
    handleSearch,
    handleSort,
    handlePageChange,
    handlePageSizeChange,
    handleSelectRow,
    handleSelectAll,
    clearSelection,
  };
}
