import { FormConfig } from '@/components/v2/forms';
import { CreateTaxRateDto, UpdateTaxRateDto } from '../dto/tax.dto';

export const taxFormConfig: FormConfig<CreateTaxRateDto | UpdateTaxRateDto> = {
  sections: [
    {
      title: 'Basic Information',
      columns: 2,
      fields: [
        {
          name: 'code',
          label: 'Tax Code',
          type: 'text',
          placeholder: 'e.g., VAT10, GST',
          required: true,
          validation: (value) => {
            if (!value) return 'Tax Code is required';
            if (value.length < 2) return 'Tax Code must be at least 2 characters';
            if (value.length > 20) return 'Tax Code must not exceed 20 characters';
            return undefined;
          },
          gridColumn: 'span 1',
        },
        {
          name: 'name',
          label: 'Tax Name',
          type: 'text',
          placeholder: 'e.g., Value Added Tax 10%',
          required: true,
          validation: (value) => {
            if (!value) return 'Tax Name is required';
            if (value.length < 2) return 'Tax Name must be at least 2 characters';
            return undefined;
          },
          gridColumn: 'span 1',
        },
        {
          name: 'type',
          label: 'Tax Type',
          type: 'select',
          required: true,
          options: [
            { value: 'VAT', label: 'VAT' },
            { value: 'CIT', label: 'Corporate Income Tax' },
            { value: 'PIT', label: 'Personal Income Tax' },
            { value: 'IMPORT', label: 'Import Tax' },
            { value: 'EXPORT', label: 'Export Tax' },
            { value: 'EXCISE', label: 'Excise Tax' },
            { value: 'ENVIRONMENTAL', label: 'Environmental Tax' },
            { value: 'OTHER', label: 'Other' },
          ],
          gridColumn: 'span 1',
        },
        {
          name: 'rate',
          label: 'Tax Rate',
          type: 'number',
          placeholder: '0.00',
          required: true,
          validation: (value) => {
            if (value === null || value === undefined) return 'Tax Rate is required';
            if (value < 0) return 'Tax Rate cannot be negative';
            if (value > 100) return 'Tax Rate cannot exceed 100%';
            return undefined;
          },
          helpText: 'Enter percentage (e.g., 10 for 10%)',
          gridColumn: 'span 1',
        },
      ],
    },
    {
      title: 'Application Settings',
      columns: 2,
      fields: [
        {
          name: 'applies_to',
          label: 'Applies To',
          type: 'select',
          required: true,
          options: [
            { value: 'sale', label: 'Sales' },
            { value: 'purchase', label: 'Purchases' },
            { value: 'both', label: 'Both' },
          ],
          gridColumn: 'span 1',
        },
        {
          name: 'status',
          label: 'Status',
          type: 'select',
          required: true,
          options: [
            { value: 'active', label: 'Active' },
            { value: 'inactive', label: 'Inactive' },
          ],
          defaultValue: 'active',
          gridColumn: 'span 1',
        },
        {
          name: 'is_vat',
          label: 'Is VAT',
          type: 'checkbox',
          defaultValue: false,
          helpText: 'Check if this is a VAT tax',
          gridColumn: 'span 2',
        },
      ],
    },
    {
      title: 'Validity Period',
      columns: 2,
      fields: [
        {
          name: 'effective_date',
          label: 'Effective Date',
          type: 'date',
          required: true,
          gridColumn: 'span 1',
        },
        {
          name: 'expiry_date',
          label: 'Expiry Date',
          type: 'date',
          helpText: 'Leave empty for no expiry',
          gridColumn: 'span 1',
        },
      ],
    },
  ],
  submitLabel: 'Save Tax Rate',
  cancelLabel: 'Cancel',
  showCancel: true,
};
