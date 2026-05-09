/**
 * useForm Hook
 * @description Custom hook for form state management
 * @author Senior Frontend Team
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { FormState, FormFieldConfig, ValidationFn } from './types';

interface UseFormOptions<T> {
  initialValues: T;
  fields?: FormFieldConfig<T>[];
  validate?: (values: T) => Partial<Record<keyof T, string>>;
  onSubmit: (values: T) => Promise<void>;
  validateOnChange?: boolean;
  validateOnBlur?: boolean;
}

export function useForm<T extends Record<string, any>>({
  initialValues,
  fields = [],
  validate,
  onSubmit,
  validateOnChange = false,
  validateOnBlur = true,
}: UseFormOptions<T>) {
  const [state, setState] = useState<FormState<T>>({
    values: initialValues,
    errors: {},
    touched: {},
    isSubmitting: false,
    isDirty: false,
  });

  const initialValuesRef = useRef(initialValues);

  /**
   * Validate a single field
   */
  const validateField = useCallback(
    (name: keyof T, value: any): string | undefined => {
      const field = fields.find((f) => f.name === name);
      
      // Required validation
      if (field?.required && !value) {
        return `${field.label} is required`;
      }

      // Custom validation
      if (field?.validation) {
        return field.validation(value, state.values);
      }

      return undefined;
    },
    [fields, state.values]
  );

  /**
   * Validate all fields
   */
  const validateForm = useCallback((): Partial<Record<keyof T, string>> => {
    const errors: Partial<Record<keyof T, string>> = {};

    // Field-level validation
    fields.forEach((field) => {
      const error = validateField(field.name as keyof T, state.values[field.name as keyof T]);
      if (error) {
        errors[field.name as keyof T] = error;
      }
    });

    // Form-level validation
    if (validate) {
      const formErrors = validate(state.values);
      Object.assign(errors, formErrors);
    }

    return errors;
  }, [fields, state.values, validate, validateField]);

  /**
   * Set field value
   */
  const setFieldValue = useCallback(
    (name: keyof T, value: any) => {
      setState((prev) => {
        const newValues = { ...prev.values, [name]: value };
        const isDirty = JSON.stringify(newValues) !== JSON.stringify(initialValuesRef.current);

        let newErrors = prev.errors;
        if (validateOnChange) {
          const error = validateField(name, value);
          newErrors = {
            ...prev.errors,
            [name]: error,
          };
          if (!error) {
            delete newErrors[name];
          }
        }

        return {
          ...prev,
          values: newValues,
          errors: newErrors,
          isDirty,
        };
      });
    },
    [validateField, validateOnChange]
  );

  /**
   * Set field touched
   */
  const setFieldTouched = useCallback(
    (name: keyof T, touched = true) => {
      setState((prev) => {
        let newErrors = prev.errors;
        if (validateOnBlur && touched) {
          const error = validateField(name, prev.values[name]);
          newErrors = {
            ...prev.errors,
            [name]: error,
          };
          if (!error) {
            delete newErrors[name];
          }
        }

        return {
          ...prev,
          touched: {
            ...prev.touched,
            [name]: touched,
          },
          errors: newErrors,
        };
      });
    },
    [validateField, validateOnBlur]
  );

  /**
   * Set multiple field values
   */
  const setValues = useCallback((values: Partial<T>) => {
    setState((prev) => ({
      ...prev,
      values: { ...prev.values, ...values },
      isDirty: true,
    }));
  }, []);

  /**
   * Set errors
   */
  const setErrors = useCallback((errors: Partial<Record<keyof T, string>>) => {
    setState((prev) => ({
      ...prev,
      errors,
    }));
  }, []);

  /**
   * Clear errors
   */
  const clearErrors = useCallback(() => {
    setState((prev) => ({
      ...prev,
      errors: {},
    }));
  }, []);

  /**
   * Reset form
   */
  const resetForm = useCallback(() => {
    setState({
      values: initialValuesRef.current,
      errors: {},
      touched: {},
      isSubmitting: false,
      isDirty: false,
    });
  }, []);

  /**
   * Handle submit
   */
  const handleSubmit = useCallback(
    async (e?: React.FormEvent) => {
      if (e) {
        e.preventDefault();
      }

      // Validate all fields
      const errors = validateForm();

      if (Object.keys(errors).length > 0) {
        setState((prev) => ({
          ...prev,
          errors,
          touched: Object.keys(errors).reduce(
            (acc, key) => ({ ...acc, [key]: true }),
            {}
          ),
        }));
        return;
      }

      // Submit
      setState((prev) => ({ ...prev, isSubmitting: true }));
      try {
        await onSubmit(state.values);
        setState((prev) => ({ ...prev, isSubmitting: false, isDirty: false }));
      } catch (error) {
        setState((prev) => ({ ...prev, isSubmitting: false }));
        throw error;
      }
    },
    [validateForm, onSubmit, state.values]
  );

  /**
   * Get field props
   */
  const getFieldProps = useCallback(
    (name: keyof T) => ({
      name: String(name),
      value: state.values[name],
      onChange: (value: any) => setFieldValue(name, value),
      onBlur: () => setFieldTouched(name, true),
      error: state.touched[name] ? state.errors[name] : undefined,
      disabled: state.isSubmitting,
    }),
    [state, setFieldValue, setFieldTouched]
  );

  return {
    values: state.values,
    errors: state.errors,
    touched: state.touched,
    isSubmitting: state.isSubmitting,
    isDirty: state.isDirty,
    setFieldValue,
    setFieldTouched,
    setValues,
    setErrors,
    clearErrors,
    resetForm,
    handleSubmit,
    getFieldProps,
    validateForm,
  };
}
