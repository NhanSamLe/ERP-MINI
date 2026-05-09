import { useState, useMemo } from 'react';
import { Product } from '@/features/products/store/product.types';
import { SaleOrderLineDto } from '../dto/saleOrder.dto';
import { useSaleOrderCalculation } from './useSaleOrderCalculation';

interface SaleOrderFormState {
  customer_id: number;
  order_date: string;
  lines: SaleOrderLineDto[];
  deletedLineIds: number[];
}

export const useSaleOrderForm = (
  initialState?: Partial<SaleOrderFormState>,
  products: Product[] = []
) => {
  const [customerId, setCustomerId] = useState<number>(initialState?.customer_id ?? 0);
  const [orderDate, setOrderDate] = useState<string>(
    initialState?.order_date 
      ? initialState.order_date.split('T')[0] 
      : new Date().toISOString().split('T')[0]
  );
  const [lines, setLines] = useState<SaleOrderLineDto[]>(initialState?.lines ?? []);
  const [deletedLineIds, setDeletedLineIds] = useState<number[]>(initialState?.deletedLineIds ?? []);

  const { calcLine, calcTotals } = useSaleOrderCalculation(products);

  const totals = useMemo(() => calcTotals(lines), [lines, calcTotals]);

  const addLine = () => {
    setLines((prev) => [
      ...prev,
      {
        id: undefined,
        product_id: undefined,
        quantity: 1,
        unit_price: 0,
        tax_rate_id: undefined,
      },
    ]);
  };

  const removeLine = (index: number) => {
    const lineToDelete = lines[index];
    if (lineToDelete.id) {
      setDeletedLineIds((prev) => [...prev, lineToDelete.id!]);
    }
    setLines((prev) => prev.filter((_, i) => i !== index));
  };

  const updateLine = (index: number, field: keyof SaleOrderLineDto, value: any) => {
    setLines((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const selectProductForLine = (index: number, product: Product) => {
    setLines((prev) => {
      const updated = [...prev];
      updated[index] = {
        ...updated[index],
        product_id:  product.id,
        unit_price:  product.sale_price ?? 0,
        tax_rate_id: product.tax_rate_id ?? undefined,
      };
      return updated;
    });
  };

  const selectedProductIds = useMemo(
    () => lines.map((l) => l.product_id).filter((id): id is number => !!id),
    [lines]
  );

  return {
    customerId,
    setCustomerId,
    orderDate,
    setOrderDate,
    lines,
    setLines,
    deletedLineIds,
    addLine,
    removeLine,
    updateLine,
    selectProductForLine,
    totals,
    calcLine,
    selectedProductIds,
  };
};
