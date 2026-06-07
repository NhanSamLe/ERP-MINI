import { TableConfig } from '@/components/v2/tables';
import { Tax } from '../dto/tax.dto';

export const createTaxTableConfig = (
  onEdit: (tax: Tax) => void,
  onDelete: (tax: Tax) => void,
  canEdit: (tax: Tax) => boolean,
  canDelete: (tax: Tax) => boolean
): TableConfig<Tax> => ({
  columns: [
    {
      key: 'code',
      label: 'Code',
      sortable: true,
      width: '150px',
    },
    {
      key: 'name',
      label: 'Name',
      sortable: true,
    },
    {
      key: 'rate',
      label: 'Rate (%)',
      sortable: true,
      width: '120px',
      align: 'right',
      render: (value) => `${Number(value).toFixed(2)}%`,
    },
    {
      key: 'status',
      label: 'Status',
      width: '120px',
      render: (value) => value === 'active' ? 'Active' : 'Inactive',
    },
    {
      key: 'effective_date',
      label: 'Effective Date',
      sortable: true,
      width: '150px',
      hideOnMobile: true,
      render: (value) => {
        if (!value) return '-';
        const date = new Date(value);
        return date.toLocaleDateString('vi-VN');
      },
    },
  ],
  actions: [
    {
      label: 'Edit',
      onClick: onEdit,
      show: canEdit,
      variant: 'primary',
    },
    {
      label: 'Delete',
      onClick: onDelete,
      show: canDelete,
      variant: 'danger',
    },
  ],
  pagination: true,
  sortable: true,
  searchable: true,
  searchPlaceholder: 'Search by code or name...',
  emptyMessage: 'No tax rates found. Create your first tax rate.',
  loadingMessage: 'Loading tax rates...',
  rowKey: 'id',
});
