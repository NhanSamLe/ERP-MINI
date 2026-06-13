/**
 * GenericForm Component
 * @description Reusable form component with configuration-based rendering
 * @author Senior Frontend Team
 */

import { GenericFormProps, FormFieldConfig, FormSection } from './types';
import { useForm } from './useForm';
import { FormField } from './FormField';
import { Button } from '@/components/ui/Button';
import { useFormConfig } from '@/hooks/useAppConfig';

export function GenericForm<T extends Record<string, any>>({
  initialValues,
  config,
  fields: flatFields,
  mode = 'edit',
  onSubmit,
  onCancel,
  customComponents,
  loading = false,
  title,
  description,
  className = '',
}: GenericFormProps<T>) {
  const formConfig = useFormConfig();
  
  // Determine fields from config or flat fields
  const fields: FormFieldConfig<T>[] = flatFields || 
    config?.fields || 
    config?.sections?.flatMap(s => s.fields || []) || 
    [];

  const {
    values,
    errors,
    touched,
    isSubmitting,
    isDirty,
    setFieldValue,
    setFieldTouched,
    handleSubmit,
    resetForm,
  } = useForm({
    initialValues,
    fields,
    validate: config?.validate,
    onSubmit,
    validateOnChange: formConfig.validateOnChange,
    validateOnBlur: formConfig.validateOnBlur,
  });

  /**
   * Render a single field
   */
  const renderField = (field: FormFieldConfig<T>) => {
    // Check if field should be shown
    if (field.show && !field.show(values)) {
      return null;
    }

    const fieldName = field.name as keyof T;
    const fieldValue = values[fieldName];
    const fieldError = touched[fieldName] ? errors[fieldName] : undefined;

    return (
      <div
        key={String(field.name)}
        style={{ gridColumn: field.gridColumn }}
        className="w-full"
      >
        <FormField
          field={field}
          value={fieldValue}
          onChange={(value) => setFieldValue(fieldName, value)}
          onBlur={() => setFieldTouched(fieldName, true)}
          error={fieldError}
          disabled={isSubmitting || loading}
          mode={mode}
        />
      </div>
    );
  };

  /**
   * Render a section
   */
  const renderSection = (section: FormSection<T>, index: number) => {
    // Check if section should be shown
    if (section.show && !section.show(values)) {
      return null;
    }

    // Custom section component
    if (section.component) {
      const SectionComponent = typeof section.component === 'string'
        ? customComponents?.[section.component]
        : section.component;

      if (SectionComponent) {
        return (
          <SectionComponent
            key={index}
            values={values}
            errors={errors}
            touched={touched}
            setFieldValue={setFieldValue}
            setFieldTouched={setFieldTouched}
            {...section.componentProps}
          />
        );
      }
    }

    const columns = section.columns || 1;
    const gridClass = columns === 1 ? 'grid-cols-1' : 
                      columns === 2 ? 'grid-cols-1 md:grid-cols-2' :
                      columns === 3 ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' :
                      `grid-cols-${columns}`;

    return (
      <div key={index} className="space-y-4">
        {section.title && (
          <div className="border-b border-gray-200 pb-2">
            <h3 className="text-lg font-semibold text-gray-900">{section.title}</h3>
            {section.description && (
              <p className="text-sm text-gray-600 mt-1">{section.description}</p>
            )}
          </div>
        )}
        
        <div className={`grid ${gridClass} gap-4`}>
          {section.fields?.map(renderField)}
        </div>
      </div>
    );
  };

  /**
   * Render form content
   */
  const renderContent = () => {
    if (config?.sections) {
      return (
        <div className="space-y-6">
          {config.sections.map(renderSection)}
        </div>
      );
    }

    // Flat fields layout
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {fields.map(renderField)}
      </div>
    );
  };

  /**
   * Render action buttons
   */
  const renderActions = () => {
    if (mode === 'view') {
      return (
        <div className="flex justify-end gap-3">
          {onCancel && (
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
            >
              {config?.cancelLabel || 'Close'}
            </Button>
          )}
        </div>
      );
    }

    return (
      <div className="flex justify-end gap-3">
        {(config?.showCancel !== false && onCancel) && (
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              resetForm();
              onCancel();
            }}
            disabled={isSubmitting || loading}
          >
            {config?.cancelLabel || 'Cancel'}
          </Button>
        )}
        
        <Button
          type="submit"
          variant="primary"
          loading={isSubmitting || loading}
          disabled={isSubmitting || loading || (mode === 'edit' && !isDirty)}
        >
          {config?.submitLabel || (mode === 'create' ? 'Create' : 'Save')}
        </Button>
      </div>
    );
  };

  return (
    <form
      onSubmit={handleSubmit}
      className={`bg-white rounded-lg shadow-sm border border-gray-200 ${className}`}
    >
      {/* Form Header */}
      {(title || description) && (
        <div className="px-6 py-4 border-b border-gray-200">
          {title && (
            <h2 className="text-xl font-bold text-gray-900">{title}</h2>
          )}
          {description && (
            <p className="text-sm text-gray-600 mt-1">{description}</p>
          )}
        </div>
      )}

      {/* Form Content */}
      <div className="px-6 py-6">
        {renderContent()}
      </div>

      {/* Form Actions */}
      <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 rounded-b-lg">
        {renderActions()}
      </div>
    </form>
  );
}
