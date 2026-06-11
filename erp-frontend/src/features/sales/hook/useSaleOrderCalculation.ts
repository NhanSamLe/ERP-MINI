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

    // Trừ chiết khấu cấp DÒNG trước khi tính thuế — khớp backend quotation.service
    // (lineSub = qty*price*(1 - discount_percent/100), thuế tính trên lineSub).
    const discPercent = Number((line as any).discount_percent || 0);
    const discAmount = Number((line as any).discount_amount || 0);
    let lineTotal = line.unit_price * (line.quantity || 1);
    if (discPercent > 0) lineTotal = lineTotal * (1 - discPercent / 100);
    else if (discAmount > 0) lineTotal = lineTotal - discAmount;
    if (lineTotal < 0) lineTotal = 0;

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