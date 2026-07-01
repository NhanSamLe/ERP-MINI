import { TableConfig } from '@/components/v2/tables';
import { Uom } from '../dto/uom.dto';
import { Edit2, Trash2 } from 'lucide-react';
import { createElement } from 'react';

export const createUomTableConfig = (
  onEdit: (uom: Uom) => void,
  onDelete: (uom: Uom) => void,
  canEdit: (uom: Uom) => boolean,
  canDelete: (uom: Uom) => boolean
): TableConfig<Uom> => ({
  columns: [
    { key: 'code', label: 'Mã đơn vị', sortable: true, width: '160px' },
    { key: 'name', label: 'Tên đơn vị', sortable: true },
    {
      key: 'created_at',
      label: 'Ngày tạo',
      sortable: true,
      width: '160px',
      render: (value) => value ? new Date(value).toLocaleDateString('vi-VN') : '-',
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
  searchPlaceholder: 'Tìm theo mã hoặc tên đơn vị...',
  emptyMessage: 'Chưa có đơn vị tính nào.',
  loadingMessage: 'Đang tải danh sách đơn vị...',
  rowKey: 'id',
});
