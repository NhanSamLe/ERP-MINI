import { TableConfig } from '@/components/v2/tables';
import { Currency } from '../dto/currency.dto';

export const currencyTableConfig: TableConfig<Currency> = {
  columns: [
    {
      key: 'name',
      label: 'Currency Name',
      sortable: true,
    },
    {
      key: 'code',
      label: 'Code',
      sortable: true,
      width: '150px',
    },
    {
      key: 'symbol',
      label: 'Symbol',
      width: '100px',
    },
  ],
  pagination: true,
  sortable: true,
  searchable: true,
  searchPlaceholder: 'Search by name or code...',
  emptyMessage: 'No currencies found. Add your first currency.',
  loadingMessage: 'Loading currencies...',
  rowKey: 'id',
};
