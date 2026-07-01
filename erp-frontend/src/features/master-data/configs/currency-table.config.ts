import { TableConfig } from '@/components/v2/tables';
import { Currency } from '../dto/currency.dto';

export const currencyTableConfig: TableConfig<Currency> = {
  columns: [
    {
      key: 'name',
      label: 'Tên tiền tệ',
      sortable: true,
    },
    {
      key: 'code',
      label: 'Mã tiền tệ',
      sortable: true,
      width: '150px',
    },
    {
      key: 'symbol',
      label: 'Ký hiệu',
      width: '100px',
    },
  ],
  pagination: true,
  sortable: true,
  searchable: true,
  searchPlaceholder: 'Tìm theo tên hoặc mã tiền tệ...',
  emptyMessage: 'Chưa có tiền tệ nào.',
  loadingMessage: 'Đang tải danh sách tiền tệ...',
  rowKey: 'id',
};
