/**
 * Form Types and Interfaces
 * @description Type definitions for generic form components
 * @author Senior Frontend Team
 */

import { ReactNode } from 'react';

/**
 * Form field types
 */
export type FormFieldType =
  | 'text'
  | 'email'
  | 'tel'
  | 'number'
  | 'password'
  | 'textarea'
  | 'select'
  | 'multi-select'
  | 'checkbox'
  | 'radio'
  | 'date'
  | 'datetime'
  | 'time'
  | 'file'
  | 'image'
  | 'search-select'
  | 'custom';

/**
 * Select option interface
 */
export interface SelectOption {
  value: string | number;
  label: string;
  disabled?: boolean;
  icon?: ReactNode;
  description?: string;
}

/**
 * Validation function type
 */
export type ValidationFn<T = any> = (
  value: T,
  allValues?: Record<string, any>
) => string | undefined;

/**
 * Form field configuration
 */
export interface FormFieldConfig<T = any> {
  /** Field name (key in form values) */
  name: keyof T | string;
  
  /** Field label */
  label: string;
  
  /** Field type */
  type: FormFieldType;
  
  /** Placeholder text */
  placeholder?: string;
  
  /** Is field required */
  required?: boolean;
  
  /** Is field disabled */
  disabled?: boolean;
  
  /** Is field read-only */
  readOnly?: boolean;
  
  /** Default value */
  defaultValue?: any;
  
  /** Validation function */
  validation?: ValidationFn;
  
  /** Help text */
  helpText?: string;
  
  /** Grid column span (for responsive layouts) */
  gridColumn?: string;
  
  /** Show field conditionally */
  show?: (values: Record<string, any>) => boolean;
  
  /** Options for select/radio fields */
  options?: SelectOption[];
  
  /** Fetch options dynamically (for search-select) */
  fetchOptions?: (search?: string) => Promise<SelectOption[]>;
  
  /** Render custom option (for search-select) */
  renderOption?: (option: SelectOption) => ReactNode;
  
  /** Number of rows (for textarea) */
  rows?: number;
  
  /** Min value (for number/date) */
  min?: number | string;
  
  /** Max value (for number/date) */
  max?: number | string;
  
  /** Step value (for number) */
  step?: number;

  /**
   * Định dạng hiển thị cho ô number:
   * - 'thousand': phân tách nghìn kiểu VN (1.000.000) — dùng cho tiền/số lượng.
   * Khi bật, giá trị onChange vẫn trả về number thuần. Không dùng cho số điện thoại.
   */
  format?: 'thousand';
  
  /** Accept file types (for file/image) */
  accept?: string;
  
  /** Multiple files (for file/image) */
  multiple?: boolean;
  
  /** Custom component */
  component?: React.ComponentType<any>;
  
  /** Additional props to pass to field component */
  componentProps?: Record<string, any>;
}

/**
 * Form section configuration
 */
export interface FormSection<T = any> {
  /** Section title */
  title?: string;
  
  /** Section description */
  description?: string;
  
  /** Fields in this section */
  fields?: FormFieldConfig<T>[];
  
  /** Custom component for this section */
  component?: string | React.ComponentType<any>;
  
  /** Props to pass to custom component */
  componentProps?: Record<string, any>;
  
  /** Show section conditionally */
  show?: (values: Record<string, any>) => boolean;
  
  /** Grid columns for this section */
  columns?: number;
}

/**
 * Form configuration
 */
export interface FormConfig<T = any> {
  /** Form sections */
  sections?: FormSection<T>[];
  
  /** Flat list of fields (alternative to sections) */
  fields?: FormFieldConfig<T>[];
  
  /** Form-level validation */
  validate?: (values: T) => Partial<Record<keyof T | string, string>>;
  
  /** Submit button label */
  submitLabel?: string;
  
  /** Cancel button label */
  cancelLabel?: string;
  
  /** Show cancel button */
  showCancel?: boolean;
  
  /** Custom submit button */
  customSubmitButton?: ReactNode;
  
  /** Custom cancel button */
  customCancelButton?: ReactNode;
}

/**
 * Form props
 */
export interface GenericFormProps<T = any> {
  /** Initial form values */
  initialValues: T;
  
  /** Form configuration */
  config?: FormConfig<T>;
  
  /** Flat list of fields (alternative to config) */
  fields?: FormFieldConfig<T>[];
  
  /** Form mode */
  mode?: 'create' | 'edit' | 'view';
  
  /** Submit handler */
  onSubmit: (values: T) => Promise<void>;
  
  /** Cancel handler */
  onCancel?: () => void;
  
  /** Custom components registry */
  customComponents?: Record<string, React.ComponentType<any>>;
  
  /** Loading state */
  loading?: boolean;
  
  /** Form title */
  title?: string;
  
  /** Form description */
  description?: string;
  
  /** Additional CSS classes */
  className?: string;
}

/**
 * Form state
 */
export interface FormState<T = any> {
  values: T;
  errors: Partial<Record<keyof T, string>>;
  touched: Partial<Record<keyof T, boolean>>;
  isSubmitting: boolean;
  isDirty: boolean;
}
