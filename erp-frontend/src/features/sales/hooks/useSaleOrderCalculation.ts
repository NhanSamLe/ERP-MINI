import { SaleOrderLineDto } from '../dto/saleOrder.dto';
import { Product } from '@/features/products/store/product.types';

interface LineCalculation {
  lineTotal: number;
  taxAmount: number;
  total: number;
}

interface OrderTotals {
  subtotal: number;
  tax: number;
  total: number;
}

export function useSaleOrderCalculation(products: Product[]) {
  const calcLine = (line: SaleOrderLineDto): LineCalculation => {
    if (!line.product_id || !line.unit_price) {
      return { lineTotal: 0, taxAmount: 0, total: 0 };
    }

    const product = products.find(p => p.id === line.product_id);
    const taxRate = product?.taxRate?.rate || 0;
    
    const lineTotal = line.unit_price * (line.quantity || 1);
    const taxAmount = (lineTotal * taxRate) / 100;
    const total = lineTotal + taxAmount;

    return { lineTotal, taxAmount, total };
  };

  const calcTotals = (lines: SaleOrderLineDto[]): OrderTotals => {
    return lines.reduce((acc, line) => {
      const calc = calcLine(line);
      return {
        subtotal: acc.subtotal + calc.lineTotal,
        tax: acc.tax + calc.taxAmount,
        total: acc.total + calc.total,
      };
    }, { subtotal: 0, tax: 0, total: 0 });
  };

  return { calcLine, calcTotals };
}