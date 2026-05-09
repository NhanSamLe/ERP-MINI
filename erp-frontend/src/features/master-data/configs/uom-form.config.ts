/**
 * UOM Form Configuration
 * @description Configuration for UOM create/edit form
 * @author Senior Frontend Team
 */

import { FormConfig } from '@/components/v2/forms';
import { CreateUomDto, UpdateUomDto } from '../dto/uom.dto';

/**
 * UOM Form Configuration
 */
export const uomFormConfig: FormConfig<CreateUomDto | UpdateUomDto> = {
  fields: [
    {
      name: 'code',
      label: 'UOM Code',
      type: 'text',
      placeholder: 'e.g., PCS, KG, M',
      required: true,
      validation: (value) => {
        if (!value) return 'UOM Code is required';
        if (value.length < 2) return 'UOM Code must be at least 2 characters';
        if (value.length > 10) return 'UOM Code must not exceed 10 characters';
        if (!/^[A-Z0-9]+$/.test(value)) return 'UOM Code must contain only uppercase letters and numbers';
        return undefined;
      },
      helpText: 'Unique code for the unit (uppercase letters and numbers only)',
      gridColumn: 'span 1',
    },
    {
      name: 'name',
      label: 'UOM Name',
      type: 'text',
      placeholder: 'e.g., Pieces, Kilogram, Meter',
      required: true,
      validation: (value) => {
        if (!value) return 'UOM Name is required';
        if (value.length < 2) return 'UOM Name must be at least 2 characters';
        if (value.length > 100) return 'UOM Name must not exceed 100 characters';
        return undefined;
      },
      helpText: 'Full name of the unit of measurement',
      gridColumn: 'span 1',
    },
  ],
  submitLabel: 'Save UOM',
  cancelLabel: 'Cancel',
  showCancel: true,
};
