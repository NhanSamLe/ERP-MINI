/**
 * Permission Hook
 * @description Centralized hook for checking permissions
 * @author Senior Frontend Team
 */

import { useCallback } from 'react';
import { useAppSelector } from '@/store/hooks';
import { hasPermission, getResourcePermissions } from '@/config/permissions';

/**
 * Hook to check permissions for a resource
 * @param resource - Resource name (e.g., 'sale_order', 'lead', 'uom')
 * @returns Object with permission check functions
 * 
 * @example
 * ```tsx
 * const { canEdit, canDelete, canApprove } = usePermission('sale_order');
 * 
 * if (canEdit(order)) {
 *   // Show edit button
 * }
 * ```
 */
export function usePermission(resource: string) {
  const { user } = useAppSelector((state) => state.auth);

  /**
   * Generic permission check function
   */
  const can = useCallback(
    (action: string, item?: any): boolean => {
      return hasPermission(user, resource, action as any, item);
    },
    [user, resource]
  );

  /**
   * Specific permission check functions
   */
  const canView = useCallback((item?: any) => can('view', item), [can]);
  const canCreate = useCallback((item?: any) => can('create', item), [can]);
  const canEdit = useCallback((item?: any) => can('edit', item), [can]);
  const canDelete = useCallback((item?: any) => can('delete', item), [can]);
  const canApprove = useCallback((item?: any) => can('approve', item), [can]);
  const canReject = useCallback((item?: any) => can('reject', item), [can]);
  const canSubmit = useCallback((item?: any) => can('submit', item), [can]);
  const canCancel = useCallback((item?: any) => can('cancel', item), [can]);
  const canExport = useCallback((item?: any) => can('export', item), [can]);
  const canImport = useCallback((item?: any) => can('import', item), [can]);

  return {
    can,
    canView,
    canCreate,
    canEdit,
    canDelete,
    canApprove,
    canReject,
    canSubmit,
    canCancel,
    canExport,
    canImport,
  };
}

/**
 * Hook to get all permissions for a resource
 * @param resource - Resource name
 * @returns All permission rules for the resource
 */
export function useResourcePermissions(resource: string) {
  return getResourcePermissions(resource);
}
