import { FormConfig } from '@/components/v2/forms';

export const currencyFormConfig: FormConfig = {
  fields: [
    {
      name: 'code',
      label: 'Currency Code',
      type: 'text',
      placeholder: 'e.g., USD, EUR, VND',
      required: true,
      validation: (value) => {
        if (!value) return 'Currency Code is required';
        if (value.length !== 3) return 'Currency Code must be exactly 3 characters';
        if (!/^[A-Z]+$/.test(value)) return 'Currency Code must contain only uppercase letters';
        return undefined;
      },
      helpText: 'ISO 4217 currency code (3 uppercase letters)',
    },
  ],
  submitLabel: 'Add Currency',
  cancelLabel: 'Cancel',
  showCancel: true,
};
