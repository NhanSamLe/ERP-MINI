/**
 * App Configuration Hook
 * @description Hook to access application configuration
 * @author Senior Frontend Team
 */

import { appConfig } from '@/config/app-config';

/**
 * Hook to access app configuration
 * @returns Application configuration object
 * 
 * @example
 * ```tsx
 * const { pagination, table, form } = useAppConfig();
 * 
 * const itemsPerPage = pagination.defaultPageSize; // 10
 * ```
 */
export function useAppConfig() {
  return appConfig;
}

/**
 * Hook to access pagination configuration
 */
export function usePaginationConfig() {
  return appConfig.pagination;
}

/**
 * Hook to access table configuration
 */
export function useTableConfig() {
  return appConfig.table;
}

/**
 * Hook to access form configuration
 */
export function useFormConfig() {
  return appConfig.form;
}

/**
 * Hook to access API configuration
 */
export function useApiConfig() {
  return appConfig.api;
}

/**
 * Hook to access feature flags
 */
export function useFeatureFlags() {
  return appConfig.features;
}
