/**
 * Application Configuration
 * @description Central configuration for application-wide settings
 * @author Senior Frontend Team
 */

export const appConfig = {
  /**
   * Pagination Settings
   */
  pagination: {
    defaultPageSize: 10,
    pageSizeOptions: [10, 20, 50, 100],
    maxPageSize: 100,
  },

  /**
   * Table Settings
   */
  table: {
    defaultSortOrder: 'desc' as const,
    showActionsColumn: true,
    showSelectionColumn: false,
    stickyHeader: true,
    rowHeight: 'comfortable' as 'compact' | 'comfortable' | 'spacious',
  },

  /**
   * Form Settings
   */
  form: {
    autoSaveDelay: 2000, // ms
    showRequiredIndicator: true,
    validateOnBlur: true,
    validateOnChange: false,
    submitOnEnter: false,
  },

  /**
   * API Settings
   */
  api: {
    timeout: 30000, // 30 seconds
    retryAttempts: 3,
    retryDelay: 1000, // ms
    baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8888/api',
  },

  /**
   * File Upload Settings
   */
  upload: {
    maxFileSize: 5 * 1024 * 1024, // 5MB
    allowedImageTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
    allowedDocumentTypes: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
    maxFiles: 10,
  },

  /**
   * Notification Settings
   */
  notification: {
    position: 'top-right' as const,
    autoClose: 3000, // ms
    pauseOnHover: true,
    closeOnClick: true,
  },

  /**
   * Date/Time Settings
   */
  dateTime: {
    dateFormat: 'DD/MM/YYYY',
    timeFormat: 'HH:mm',
    dateTimeFormat: 'DD/MM/YYYY HH:mm',
    locale: 'vi-VN',
  },

  /**
   * Currency Settings
   */
  currency: {
    defaultCurrency: 'VND',
    locale: 'vi-VN',
    decimalPlaces: 0,
  },

  /**
   * Feature Flags
   */
  features: {
    darkMode: true,
    multiLanguage: false,
    advancedSearch: true,
    bulkActions: true,
    exportExcel: true,
    exportPDF: true,
    realTimeNotifications: true,
    // V2 Components (Refactored with generic components)
    useV2Components: {
      uom: true,
      currency: true,
      taxRate: true,
    },
  },

  /**
   * Performance Settings
   */
  performance: {
    enableVirtualization: true, // For large lists
    debounceDelay: 300, // ms for search inputs
    throttleDelay: 100, // ms for scroll events
    lazyLoadImages: true,
  },

  /**
   * Validation Settings
   */
  validation: {
    minPasswordLength: 8,
    maxPasswordLength: 128,
    minUsernameLength: 3,
    maxUsernameLength: 50,
    phoneRegex: /^[0-9]{10,11}$/,
    emailRegex: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  },
} as const;

/**
 * Type exports
 */
export type AppConfig = typeof appConfig;
export type PaginationConfig = typeof appConfig.pagination;
export type TableConfig = typeof appConfig.table;
export type FormConfig = typeof appConfig.form;
