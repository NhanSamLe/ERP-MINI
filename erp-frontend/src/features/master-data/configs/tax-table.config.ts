import { TableConfig } from '@/components/v2/tables';
import { Tax } from '../dto/tax.dto';
import { Edit2, Trash2 } from 'lucide-react';
import { formatPercent } from '@/utils/currency.helper';
import { createElement } from 'react';

const statusLabels: Record<string, string> = {
  active: 'Đang áp dụng',
  inactive: 'Ngừng áp dụng',
};

export const createTaxTableConfig = (
  onEdit: (tax: Tax) => void,
  onDelete: (tax: Tax) => void,
  canEdit: (tax: Tax) => boolean,
  canDelete: (tax: Tax) => boolean
): TableConfig<Tax> => ({
  columns: [
    { key: 'code', label: 'Mã thuế', sortable: true, width: '140px' },
    { key: 'name', label: 'Tên thuế', sortable: true },
    { key: 'type', label: 'Loại thuế', sortable: true, width: '140px' },
    {
      key: 'rate',
      label: 'Thuế suất',
      sortable: true,
      width: '140px',
      render: (value) => createElement('span', { className: 'font-medium text-gray-900' }, formatPercent(Number(value), 2)),
    },
    {
      key: 'status',
      label: 'Trạng thái',
      sortable: true,
      width: '160px',
      render: (value) => createElement(
        'span',
        {
          className: `inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
            value === 'active'
              ? 'bg-emerald-50 text-emerald-700'
              : 'bg-gray-100 text-gray-700'
          }`,
        },
        statusLabels[String(value)] || String(value)
      ),
    },
  ],
  actions: [
    {
      label: 'Sửa',
      icon: createElement(Edit2, { className: 'w-4 h-4' }),
      onClick: onEdit,
      show: canEdit,
    },
    {
      label: 'Xóa',
      icon: createElement(Trash2, { className: 'w-4 h-4' }),
      onClick: onDelete,
      show: canDelete,
      variant: 'danger',
    },
  ],
  pagination: true,
  sortable: true,
  searchable: true,
  searchPlaceholder: 'Tìm theo mã hoặc tên thuế...',
  emptyMessage: 'Chưa có thuế nào.',
  loadingMessage: 'Đang tải danh sách thuế...',
  rowKey: 'id',
});
