import { payrollPeriodApi } from "../api/payrollPeriod.api";
import { PayrollPeriodDTO, PayrollPeriodFilter } from "../dto/payrollPeriod.dto";

export async function fetchPayrollPeriods(filter?: PayrollPeriodFilter) {
  return payrollPeriodApi.getAll(filter);
}

export async function createPayrollPeriod(data: PayrollPeriodDTO) {
  return payrollPeriodApi.create(data);
}

export async function updatePayrollPeriod(
  id: number,
  data: Partial<PayrollPeriodDTO>
) {
  return payrollPeriodApi.update(id, data);
}

export async function closePayrollPeriod(id: number) {
  return payrollPeriodApi.close(id);
}
