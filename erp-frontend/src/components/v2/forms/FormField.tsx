/**
 * FormField Component
 * @description Renders different field types based on configuration
 * @author Senior Frontend Team
 */

import { FormFieldConfig } from './types';
import { FormInput } from '@/components/ui/FormInput';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/Select';
import { formatNumberInput, parseNumberInput } from '@/utils/currency.helper';

interface FormFieldProps {
  field: FormFieldConfig;
  value: any;
  onChange: (value: any) => void;
  onBlur: () => void;
  error?: string;
  disabled?: boolean;
  mode?: 'create' | 'edit' | 'view';
}

export function FormField({
  field,
  value,
  onChange,
  onBlur,
  error,
  disabled,
  mode = 'edit',
}: FormFieldProps) {
  const isReadOnly = mode === 'view' || field.readOnly;
  const isDisabled = disabled || field.disabled;

  /**
   * Render text-based inputs
   */
  const renderTextInput = () => (
    <FormInput
      label={field.label}
      type={field.type}
      value={value || ''}
      onChange={onChange}
      placeholder={field.placeholder}
      required={field.required}
      disabled={isDisabled}
      readOnly={isReadOnly}
      error={error}
      className={field.componentProps?.className}
    />
  );

  /**
   * Render textarea
   */
  const renderTextarea = () => (
    <FormInput
      label={field.label}
      value={value || ''}
      onChange={onChange}
      placeholder={field.placeholder}
      required={field.required}
      disabled={isDisabled}
      readOnly={isReadOnly}
      error={error}
      textarea
      className={field.componentProps?.className}
    />
  );

  /**
   * Render select dropdown
   */
  const renderSelect = () => {
    const selectedOption = field.options?.find(opt => opt.value === value);
    
    return (
      <div>
        {field.label && (
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {field.label} {field.required && <span className="text-red-500">*</span>}
          </label>
        )}
        
        <Select
          value={value?.toString() || ''}
          onValueChange={(val) => {
            // Convert back to number if original value was number
            const option = field.options?.find(opt => opt.value.toString() === val);
            onChange(option?.value);
          }}
          defaultLabel={selectedOption?.label || ''}
        >
          <SelectTrigger className={error ? 'border-red-500' : ''}>
            <SelectValue placeholder={field.placeholder || 'Select...'} />
          </SelectTrigger>
          <SelectContent>
            {field.options?.map((option) => (
              <SelectItem
                key={option.value.toString()}
                value={option.value.toString()}
              >
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {field.helpText && !error && (
          <p className="text-gray-500 text-sm mt-1">{field.helpText}</p>
        )}
        {error && (
          <p className="text-red-600 text-sm mt-1">{error}</p>
        )}
      </div>
    );
  };

  /**
   * Render checkbox
   */
  const renderCheckbox = () => (
    <div className="flex items-center">
      <input
        type="checkbox"
        checked={!!value}
        onChange={(e) => onChange(e.target.checked)}
        onBlur={onBlur}
        disabled={isDisabled}
        className="w-4 h-4 text-brand-500 bg-gray-100 border-gray-300 rounded focus:ring-brand-500 focus:ring-2"
      />
      <label className="ml-2 text-sm font-medium text-gray-700">
        {field.label} {field.required && <span className="text-red-500">*</span>}
      </label>
      {error && (
        <p className="text-red-600 text-sm ml-2">{error}</p>
      )}
    </div>
  );

  /**
   * Render number input
   * - Chặn giá trị theo min/max (vd: chiết khấu / phần trăm 0–100).
   * - Khi field.format === 'thousand': hiển thị phân tách nghìn kiểu VN (1.000)
   *   nhưng vẫn trả về number thuần qua onChange.
   */
  const clampNumber = (num: number): number => {
    let n = num;
    if (field.min !== undefined && n < Number(field.min)) n = Number(field.min);
    if (field.max !== undefined && n > Number(field.max)) n = Number(field.max);
    return n;
  };

  const renderNumberInput = () => {
    // Ô tiền / số lượng: hiển thị có dấu phân tách nghìn
    if (field.format === 'thousand') {
      return (
        <FormInput
          label={field.label}
          type="text"
          value={value == null || value === '' ? '' : formatNumberInput(value)}
          onChange={(val) => {
            const parsed = parseNumberInput(val);
            onChange(parsed == null ? null : clampNumber(parsed));
          }}
          placeholder={field.placeholder}
          required={field.required}
          disabled={isDisabled}
          readOnly={isReadOnly}
          error={error}
          className={field.componentProps?.className}
        />
      );
    }

    return (
      <FormInput
        label={field.label}
        type="number"
        value={value?.toString() || ''}
        onChange={(val) => {
          if (!val) return onChange(null);
          const parsed = parseFloat(val);
          onChange(Number.isNaN(parsed) ? null : clampNumber(parsed));
        }}
        placeholder={field.placeholder}
        required={field.required}
        disabled={isDisabled}
        readOnly={isReadOnly}
        error={error}
        className={field.componentProps?.className}
      />
    );
  };

  /**
   * Render date input
   */
  const renderDateInput = () => (
    <FormInput
      label={field.label}
      type="date"
      value={value || ''}
      onChange={onChange}
      placeholder={field.placeholder}
      required={field.required}
      disabled={isDisabled}
      readOnly={isReadOnly}
      error={error}
      className={field.componentProps?.className}
    />
  );

  /**
   * Render custom component
   */
  const renderCustom = () => {
    if (!field.component) return null;
    
    const CustomComponent = field.component;
    return (
      <CustomComponent
        field={field}
        value={value}
        onChange={onChange}
        onBlur={onBlur}
        error={error}
        disabled={isDisabled}
        readOnly={isReadOnly}
        {...field.componentProps}
      />
    );
  };

  // Render based on field type
  switch (field.type) {
    case 'text':
    case 'email':
    case 'tel':
    case 'password':
      return renderTextInput();
    
    case 'number':
      return renderNumberInput();
    
    case 'textarea':
      return renderTextarea();
    
    case 'select':
      return renderSelect();
    
    case 'checkbox':
      return renderCheckbox();
    
    case 'date':
    case 'datetime':
    case 'time':
      return renderDateInput();
    
    case 'custom':
      return renderCustom();
    
    default:
      return renderTextInput();
  }
}
