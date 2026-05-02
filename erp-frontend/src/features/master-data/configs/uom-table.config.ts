/**
 * UOM Table Configuration
 * @description Configuration for UOM data table
 * @author Senior Frontend Team
 */

import { TableConfig } from '@/components/v2/tables';
import { Uom } from '../dto/uom.dto';

/**
 * Create UOM Table Configuration
 */
export const createUomTableConfig = (
  onEdit: (uom: Uom) => void,
  onDelete: (uom: Uom) => void,
  canEdit: (uom: Uom) => boolean,
  canDelete: (uom: Uom) => boolean
): TableConfig<Uom> => ({
  columns: [
    {
      key: 'code',
      label: 'Code',
      sortable: true,
      width: '200px',
    },
    {
      key: 'name',
      label: 'Name',
      sortable: true,
    },
    {
      key: 'created_at',
      label: 'Created At',
      sortable: true,
      width: '180px',
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
  emptyMessage: 'No UOM found. Create your first unit of measurement.',
  loadingMessage: 'Loading UOM data...',
  rowKey: 'id',
});
