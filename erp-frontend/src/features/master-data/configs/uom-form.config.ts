import { FormConfig } from '@/components/v2/forms';

export const uomFormConfig: FormConfig = {
  fields: [
    {
      name: 'code',
      label: 'Mã đơn vị',
      type: 'text',
      required: true,
      placeholder: 'VD: KG, PCS, BOX',
      validation: (value) => {
        if (!value) return 'Vui lòng nhập mã đơn vị';
        if (String(value).length > 20) return 'Mã đơn vị không được vượt quá 20 ký tự';
        return undefined;
      },
    },
    {
      name: 'name',
      label: 'Tên đơn vị',
      type: 'text',
      required: true,
      placeholder: 'VD: Kilogram, Cái, Thùng',
      validation: (value) => {
        if (!value) return 'Vui lòng nhập tên đơn vị';
        if (String(value).length > 100) return 'Tên đơn vị không được vượt quá 100 ký tự';
        return undefined;
      },
    },
  ],
  submitLabel: 'Lưu đơn vị',
  cancelLabel: 'Hủy',
  showCancel: true,
};
