import { FormConfig } from '@/components/v2/forms';

export const currencyFormConfig: FormConfig = {
  fields: [
    {
      name: 'code',
      label: 'Mã tiền tệ',
      type: 'text',
      required: true,
      placeholder: 'VD: USD, EUR, VND',
      validation: (value) => {
        if (!value) return 'Vui lòng nhập mã tiền tệ';
        if (String(value).length !== 3) return 'Mã tiền tệ phải có đúng 3 ký tự';
        if (!/^[A-Z]+$/.test(String(value))) return 'Mã tiền tệ chỉ được dùng chữ cái in hoa';
        return undefined;
      },
    },
  ],
  submitLabel: 'Thêm tiền tệ',
  cancelLabel: 'Hủy',
  showCancel: true,
};
