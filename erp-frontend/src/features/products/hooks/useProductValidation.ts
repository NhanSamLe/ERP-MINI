import { useState } from "react";

export interface ProductFormData {
  name: string;
  category_id: number;
  sku: string;
  product_type?: string;
  source_type?: string;
  cost_price?: number;
  sale_price?: number;
  min_stock_qty?: number;
  weight?: number;
  volume?: number;
  warranty_months?: number;
}

export interface ValidationErrors {
  name?: string;
  category_id?: string;
  cost_price?: string;
  sale_price?: string;
  min_stock_qty?: string;
  weight?: string;
  volume?: string;
  warranty_months?: string;
}

export function validateProduct(data: ProductFormData): ValidationErrors {
  const errors: ValidationErrors = {};

  if (!data.name?.trim()) {
    errors.name = "Product name is required.";
  } else if (data.name.trim().length < 2) {
    errors.name = "Product name must be at least 2 characters.";
  } else if (data.name.trim().length > 255) {
    errors.name = "Product name must not exceed 255 characters.";
  }

  if (!data.category_id || data.category_id === 0) {
    errors.category_id = "Please select a category.";
  }

  if (data.cost_price !== undefined && data.cost_price < 0) {
    errors.cost_price = "Cost price cannot be negative.";
  }
  if (data.sale_price !== undefined && data.sale_price < 0) {
    errors.sale_price = "Sale price cannot be negative.";
  }
  if (
    data.cost_price !== undefined &&
    data.sale_price !== undefined &&
    data.sale_price > 0 &&
    data.cost_price > 0 &&
    data.sale_price < data.cost_price
  ) {
    errors.sale_price = "Sale price should not be lower than cost price.";
  }

  if (data.product_type !== "service") {
    if (data.min_stock_qty !== undefined && data.min_stock_qty < 0) {
      errors.min_stock_qty = "Minimum stock quantity cannot be negative.";
    }
  }

  if (data.weight !== undefined && data.weight < 0) {
    errors.weight = "Weight cannot be negative.";
  }
  if (data.volume !== undefined && data.volume < 0) {
    errors.volume = "Volume cannot be negative.";
  }
  if (data.warranty_months !== undefined && data.warranty_months < 0) {
    errors.warranty_months = "Warranty months cannot be negative.";
  }
  if (
    data.warranty_months !== undefined &&
    data.warranty_months > 0 &&
    !Number.isInteger(data.warranty_months)
  ) {
    errors.warranty_months = "Warranty months must be a whole number.";
  }

  return errors;
}

export function useProductValidation() {
  const [errors, setErrors] = useState<ValidationErrors>({});

  const validate = (data: ProductFormData): boolean => {
    const result = validateProduct(data);
    setErrors(result);
    return Object.keys(result).length === 0;
  };

  const clearError = (field: keyof ValidationErrors) => {
    setErrors((prev) => {
      const next = { ...prev };
      delete next[field];
      return next;
    });
  };

  const clearAll = () => setErrors({});

  return { errors, validate, clearError, clearAll };
}
