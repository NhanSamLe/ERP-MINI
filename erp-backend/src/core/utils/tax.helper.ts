import { TaxRate } from "../../modules/master-data/models/taxRate.model";

export async function calculateLineTax(line: any) {
  if (!line.quantity || !line.unit_price) return null;

  const line_total = Number(line.quantity) * Number(line.unit_price);

  let line_tax = 0;
  if (line.tax_rate_id) {
    const rate = await TaxRate.findByPk(line.tax_rate_id);
    const taxPercent = rate ? Number(rate.rate) : 0;

    line_tax = (line_total * taxPercent) / 100;
  }

  const line_total_after_tax = line_total + line_tax;

  return {
    line_total,
    line_tax,
    line_total_after_tax,
  };
}

export async function calculateOrderTotals(lines: any[]) {
  let total_before_tax = 0;
  let total_tax = 0;
  let total_after_tax = 0;

  for (const line of lines) {
    total_before_tax += Number(line.line_total || 0);
    total_tax += Number(line.line_tax || 0);
    total_after_tax += Number(line.line_total_after_tax || 0);
  }

  return {
    total_before_tax,
    total_tax,
    total_after_tax,
  };
}
