import { FormConfig } from '@/components/v2/forms';
import { CreateTaxRateDto, UpdateTaxRateDto } from '../dto/tax.dto';

export const taxFormConfig: FormConfig<CreateTaxRateDto | UpdateTaxRateDto> = {
  sections: [
    {
      title: 'Thông tin cơ bản',
      columns: 2,
      fields: [
        {
          name: 'code',
          label: 'Mã thuế',
          type: 'text',
          placeholder: 'VD: VAT10, GST',
          required: true,
          validation: (value) => {
            if (!value) return 'Vui lòng nhập mã thuế';
            if (String(value).length < 2) return 'Mã thuế phải có ít nhất 2 ký tự';
            if (String(value).length > 20) return 'Mã thuế không được vượt quá 20 ký tự';
            return undefined;
          },
          gridColumn: 'span 1',
        },
        {
          name: 'name',
          label: 'Tên thuế',
          type: 'text',
          placeholder: 'VD: Thuế GTGT 10%',
          required: true,
          validation: (value) => {
            if (!value) return 'Vui lòng nhập tên thuế';
            if (String(value).length < 2) return 'Tên thuế phải có ít nhất 2 ký tự';
            return undefined;
          },
          gridColumn: 'span 1',
        },
        {
          name: 'type',
          label: 'Loại thuế',
          type: 'select',
          required: true,
          options: [
            { value: 'VAT', label: 'VAT' },
            { value: 'CIT', label: 'Thuế thu nhập doanh nghiệp' },
            { value: 'PIT', label: 'Thuế thu nhập cá nhân' },
            { value: 'IMPORT', label: 'Thuế nhập khẩu' },
            { value: 'EXPORT', label: 'Thuế xuất khẩu' },
            { value: 'EXCISE', label: 'Thuế tiêu thụ đặc biệt' },
            { value: 'ENVIRONMENTAL', label: 'Thuế bảo vệ môi trường' },
            { value: 'OTHER', label: 'Khác' },
          ],
          gridColumn: 'span 1',
        },
        {
          name: 'rate',
          label: 'Thuế suất',
          type: 'number',
          placeholder: '0.00',
          required: true,
          validation: (value) => {
            if (value === null || value === undefined || value === '') return 'Vui lòng nhập thuế suất';
            if (Number(value) < 0) return 'Thuế suất không được âm';
            if (Number(value) > 100) return 'Thuế suất không được vượt quá 100%';
            return undefined;
          },
          helpText: 'Nhập theo phần trăm, ví dụ 10 tương ứng 10%',
          gridColumn: 'span 1',
        },
      ],
    },
    {
      title: 'Thiết lập áp dụng',
      columns: 2,
      fields: [
        {
          name: 'applies_to',
          label: 'Áp dụng cho',
          type: 'select',
          required: true,
          options: [
            { value: 'sale', label: 'Bán hàng' },
            { value: 'purchase', label: 'Mua hàng' },
            { value: 'both', label: 'Cả hai' },
          ],
          gridColumn: 'span 1',
        },
        {
          name: 'status',
          label: 'Trạng thái',
          type: 'select',
          required: true,
          options: [
            { value: 'active', label: 'Đang áp dụng' },
            { value: 'inactive', label: 'Ngừng áp dụng' },
          ],
          defaultValue: 'active',
          gridColumn: 'span 1',
        },
        {
          name: 'is_vat',
          label: 'Là thuế GTGT',
          type: 'checkbox',
          defaultValue: false,
          helpText: 'Đánh dấu nếu đây là thuế giá trị gia tăng',
          gridColumn: 'span 2',
        },
      ],
    },
    {
      title: 'Thời hạn hiệu lực',
      columns: 2,
      fields: [
        {
          name: 'effective_date',
          label: 'Ngày hiệu lực',
          type: 'date',
          required: true,
          gridColumn: 'span 1',
        },
        {
          name: 'expiry_date',
          label: 'Ngày hết hiệu lực',
          type: 'date',
          helpText: 'Để trống nếu không giới hạn thời hạn',
          gridColumn: 'span 1',
        },
      ],
    },
  ],
  submitLabel: 'Lưu thuế',
  cancelLabel: 'Hủy',
  showCancel: true,
};
