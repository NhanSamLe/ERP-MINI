/**
 * Permission Rules Configuration
 * @description Centralized permission logic for all resources
 * @author Senior Frontend Team
 */

import { User } from '@/types/User';

/**
 * Permission rule function type
 */
type PermissionRule<T = any> = (user: User, item?: T) => boolean;

/**
 * Resource permissions interface
 */
interface ResourcePermissions<T = any> {
  view?: PermissionRule<T>;
  create?: PermissionRule<T>;
  edit?: PermissionRule<T>;
  delete?: PermissionRule<T>;
  approve?: PermissionRule<T>;
  reject?: PermissionRule<T>;
  submit?: PermissionRule<T>;
  cancel?: PermissionRule<T>;
  export?: PermissionRule<T>;
  import?: PermissionRule<T>;
}

/**
 * Helper functions for common permission patterns
 */
const permissionHelpers = {
  /**
   * Check if user has specific role
   */
  hasRole: (user: User, roles: string | string[]): boolean => {
    const roleArray = Array.isArray(roles) ? roles : [roles];
    return roleArray.includes(user.role?.code || '');
  },

  /**
   * Check if user is owner of the item
   */
  isOwner: (user: User, item: any): boolean => {
    return item?.created_by === user.id || item?.user_id === user.id;
  },

  /**
   * Check if item is in specific status
   */
  hasStatus: (item: any, statuses: string | string[]): boolean => {
    const statusArray = Array.isArray(statuses) ? statuses : [statuses];
    return statusArray.includes(item?.status || item?.approval_status || '');
  },

  /**
   * Check if user is in same branch as item
   */
  sameBranch: (user: User, item: any): boolean => {
    return item?.branch_id === user.branch_id;
  },
};

/**
 * Permission Rules by Resource
 */
export const permissionRules: Record<string, ResourcePermissions> = {
  /**
   * Master Data Permissions
   */
  uom: {
    view: (user) => permissionHelpers.hasRole(user, ['ADMIN', 'WHMANAGER', 'WHSTAFF']),
    create: (user) => permissionHelpers.hasRole(user, ['ADMIN', 'WHMANAGER']),
    edit: (user) => permissionHelpers.hasRole(user, ['ADMIN', 'WHMANAGER']),
    delete: (user) => permissionHelpers.hasRole(user, 'ADMIN'),
  },

  currency: {
    view: (user) => permissionHelpers.hasRole(user, ['ADMIN', 'CHACC', 'ACCOUNT']),
    create: (user) => permissionHelpers.hasRole(user, ['ADMIN', 'CHACC']),
    edit: (user) => permissionHelpers.hasRole(user, ['ADMIN', 'CHACC']),
    delete: (user) => permissionHelpers.hasRole(user, 'ADMIN'),
  },

  tax_rate: {
    view: (user) => permissionHelpers.hasRole(user, ['ADMIN', 'CHACC', 'ACCOUNT']),
    create: (user) => permissionHelpers.hasRole(user, ['ADMIN', 'CHACC']),
    edit: (user) => permissionHelpers.hasRole(user, ['ADMIN', 'CHACC']),
    delete: (user) => permissionHelpers.hasRole(user, 'ADMIN'),
  },

  /**
   * CRM Permissions
   */
  lead: {
    view: (user) => permissionHelpers.hasRole(user, ['ADMIN', 'SALESMANAGER', 'SALES']),
    create: (user) => permissionHelpers.hasRole(user, ['ADMIN', 'SALESMANAGER', 'SALES']),
    edit: (user, item) => {
      if (permissionHelpers.hasRole(user, ['ADMIN', 'SALESMANAGER'])) return true;
      if (permissionHelpers.hasRole(user, 'SALES')) {
        return permissionHelpers.isOwner(user, item);
      }
      return false;
    },
    delete: (user, item) => {
      if (permissionHelpers.hasRole(user, 'ADMIN')) return true;
      if (permissionHelpers.hasRole(user, 'SALESMANAGER')) {
        return permissionHelpers.sameBranch(user, item);
      }
      return false;
    },
  },

  opportunity: {
    view: (user) => permissionHelpers.hasRole(user, ['ADMIN', 'SALESMANAGER', 'SALES']),
    create: (user) => permissionHelpers.hasRole(user, ['ADMIN', 'SALESMANAGER', 'SALES']),
    edit: (user, item) => {
      if (permissionHelpers.hasRole(user, ['ADMIN', 'SALESMANAGER'])) return true;
      if (permissionHelpers.hasRole(user, 'SALES')) {
        return permissionHelpers.isOwner(user, item);
      }
      return false;
    },
    delete: (user) => permissionHelpers.hasRole(user, ['ADMIN', 'SALESMANAGER']),
  },

  activity: {
    view: (user) => permissionHelpers.hasRole(user, ['ADMIN', 'SALESMANAGER', 'SALES']),
    create: (user) => permissionHelpers.hasRole(user, ['ADMIN', 'SALESMANAGER', 'SALES']),
    edit: (user, item) => {
      if (permissionHelpers.hasRole(user, 'ADMIN')) return true;
      return permissionHelpers.isOwner(user, item);
    },
    delete: (user, item) => {
      if (permissionHelpers.hasRole(user, 'ADMIN')) return true;
      return permissionHelpers.isOwner(user, item);
    },
  },

  /**
   * Sales Permissions
   */
  sale_order: {
    view: (user) => permissionHelpers.hasRole(user, ['ADMIN', 'SALESMANAGER', 'SALES']),
    create: (user) => permissionHelpers.hasRole(user, ['ADMIN', 'SALESMANAGER', 'SALES']),
    edit: (user, item) => {
      if (permissionHelpers.hasRole(user, 'SALES')) {
        return (
          permissionHelpers.hasStatus(item, 'draft') &&
          permissionHelpers.isOwner(user, item)
        );
      }
      return false;
    },
    delete: (user, item) => {
      if (permissionHelpers.hasRole(user, 'ADMIN')) return true;
      if (permissionHelpers.hasRole(user, 'SALESMANAGER')) {
        return permissionHelpers.hasStatus(item, 'draft');
      }
      return false;
    },
    submit: (user, item) => {
      if (permissionHelpers.hasRole(user, 'SALES')) {
        return (
          permissionHelpers.hasStatus(item, 'draft') &&
          permissionHelpers.isOwner(user, item)
        );
      }
      return false;
    },
    approve: (user, item) => {
      return (
        permissionHelpers.hasRole(user, 'SALESMANAGER') &&
        permissionHelpers.hasStatus(item, 'waiting_approval')
      );
    },
    reject: (user, item) => {
      return (
        permissionHelpers.hasRole(user, 'SALESMANAGER') &&
        permissionHelpers.hasStatus(item, 'waiting_approval')
      );
    },
  },

  ar_invoice: {
    view: (user) => permissionHelpers.hasRole(user, ['ADMIN', 'CHACC', 'ACCOUNT', 'SALESMANAGER']),
    create: (user) => permissionHelpers.hasRole(user, ['ADMIN', 'CHACC', 'ACCOUNT']),
    edit: (user, item) => {
      return (
        permissionHelpers.hasRole(user, ['ADMIN', 'CHACC', 'ACCOUNT']) &&
        permissionHelpers.hasStatus(item, 'draft')
      );
    },
    delete: (user, item) => {
      return (
        permissionHelpers.hasRole(user, ['ADMIN', 'CHACC']) &&
        permissionHelpers.hasStatus(item, 'draft')
      );
    },
  },

  ar_receipt: {
    view: (user) => permissionHelpers.hasRole(user, ['ADMIN', 'CHACC', 'ACCOUNT']),
    create: (user) => permissionHelpers.hasRole(user, ['ADMIN', 'CHACC', 'ACCOUNT']),
    edit: (user, item) => {
      return (
        permissionHelpers.hasRole(user, ['ADMIN', 'CHACC', 'ACCOUNT']) &&
        permissionHelpers.hasStatus(item, 'draft')
      );
    },
    delete: (user, item) => {
      return (
        permissionHelpers.hasRole(user, ['ADMIN', 'CHACC']) &&
        permissionHelpers.hasStatus(item, 'draft')
      );
    },
  },

  /**
   * Purchase Permissions
   */
  purchase_order: {
    view: (user) => permissionHelpers.hasRole(user, ['ADMIN', 'PURCHASEMANAGER', 'PURCHASE']),
    create: (user) => permissionHelpers.hasRole(user, ['ADMIN', 'PURCHASEMANAGER', 'PURCHASE']),
    edit: (user, item) => {
      if (permissionHelpers.hasRole(user, 'PURCHASE')) {
        return (
          permissionHelpers.hasStatus(item, 'draft') &&
          permissionHelpers.isOwner(user, item)
        );
      }
      return false;
    },
    approve: (user, item) => {
      return (
        permissionHelpers.hasRole(user, 'PURCHASEMANAGER') &&
        permissionHelpers.hasStatus(item, 'waiting_approval')
      );
    },
  },

  /**
   * Inventory Permissions
   */
  warehouse: {
    view: (user) => permissionHelpers.hasRole(user, ['ADMIN', 'WHMANAGER', 'WHSTAFF']),
    create: (user) => permissionHelpers.hasRole(user, ['ADMIN', 'WHMANAGER']),
    edit: (user) => permissionHelpers.hasRole(user, ['ADMIN', 'WHMANAGER']),
    delete: (user) => permissionHelpers.hasRole(user, 'ADMIN'),
  },

  stock_move: {
    view: (user) => permissionHelpers.hasRole(user, ['ADMIN', 'WHMANAGER', 'WHSTAFF']),
    create: (user) => permissionHelpers.hasRole(user, ['ADMIN', 'WHMANAGER', 'WHSTAFF']),
    edit: (user, item) => {
      return (
        permissionHelpers.hasRole(user, ['ADMIN', 'WHMANAGER', 'WHSTAFF']) &&
        permissionHelpers.hasStatus(item, 'draft')
      );
    },
    delete: (user, item) => {
      return (
        permissionHelpers.hasRole(user, ['ADMIN', 'WHMANAGER']) &&
        permissionHelpers.hasStatus(item, 'draft')
      );
    },
  },

  /**
   * HRM Permissions
   */
  employee: {
    view: (user) => permissionHelpers.hasRole(user, ['ADMIN', 'HRMANAGER']),
    create: (user) => permissionHelpers.hasRole(user, ['ADMIN', 'HRMANAGER']),
    edit: (user) => permissionHelpers.hasRole(user, ['ADMIN', 'HRMANAGER']),
    delete: (user) => permissionHelpers.hasRole(user, 'ADMIN'),
  },

  /**
   * Finance Permissions
   */
  gl_account: {
    view: (user) => permissionHelpers.hasRole(user, ['ADMIN', 'CHACC', 'ACCOUNT']),
    create: (user) => permissionHelpers.hasRole(user, ['ADMIN', 'CHACC']),
    edit: (user) => permissionHelpers.hasRole(user, ['ADMIN', 'CHACC']),
    delete: (user) => permissionHelpers.hasRole(user, 'ADMIN'),
  },
};

/**
 * Get permissions for a resource
 */
export function getResourcePermissions(resource: string): ResourcePermissions {
  return permissionRules[resource] || {};
}

/**
 * Check if user has permission for a resource action
 */
export function hasPermission(
  user: User | null,
  resource: string,
  action: keyof ResourcePermissions,
  item?: any
): boolean {
  if (!user) return false;

  const roleCode = user.role?.code;
  if (roleCode === "ADMIN" || roleCode === "CEO") {
    return true; // ADMIN and CEO have global permissions for all resource actions
  }

  const permissions = getResourcePermissions(resource);
  const permissionFn = permissions[action];

  if (!permissionFn) return false;

  return permissionFn(user, item);
}
