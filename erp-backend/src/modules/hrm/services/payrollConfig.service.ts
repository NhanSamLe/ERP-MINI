import { PayrollConfig } from "../models/payrollConfig.model";

export async function getPayrollConfigs() {
  return await PayrollConfig.findAll({
    order: [["config_key", "ASC"]],
  });
}

export async function getPayrollConfigMap() {
  const configs = await getPayrollConfigs();
  const map: Record<string, string> = {};
  for (const c of configs) {
    map[c.config_key] = c.config_value;
  }
  return map;
}

export async function updatePayrollConfigs(data: Record<string, string | number>) {
  for (const [key, value] of Object.entries(data)) {
    const config = await PayrollConfig.findOne({ where: { config_key: key } });
    if (config) {
      await config.update({ config_value: String(value) });
    }
  }
  return await getPayrollConfigs();
}
