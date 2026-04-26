import { ITool, ToolDefinition } from "../types/llm.types";
import { inventoryTools } from "./inventory.tools";
import { salesTools } from "./sales.tools";
import { purchaseTools } from "./purchase.tools";
import { crmTools } from "./crm.tools";
import { hrmTools } from "./hrm.tools";
import { hrmExtraTools } from "./hrm.extra.tools";
import { financeTools } from "./finance.tools";
import { productTools } from "./product.tools";
import { partnerTools } from "./partner.tools";
import { arTools } from "./ar.tools";

// Tập hợp tất cả tools
const ALL_TOOLS: ITool[] = [
  ...inventoryTools,
  ...salesTools,
  ...arTools,
  ...purchaseTools,
  ...crmTools,
  ...hrmTools,
  ...hrmExtraTools,
  ...financeTools,
  ...productTools,
  ...partnerTools,
];

// Cache definitions — tính 1 lần, dùng mãi
let _cachedDefinitions: ToolDefinition[] | null = null;

/** Reset cache (dùng khi test) */
export function resetToolCache() {
  _cachedDefinitions = null;
}

/** Lấy danh sách tất cả tools (dùng để gửi cho LLM) */
export function getAllTools(): ITool[] {
  return ALL_TOOLS;
}

/** Lấy ToolDefinitions để gửi cho LLM (chỉ name, description, parameters) */
export function getToolDefinitions(): ToolDefinition[] {
  if (!_cachedDefinitions) {
    _cachedDefinitions = ALL_TOOLS.map((t) => ({
      name: t.name,
      description: t.description,
      parameters: t.parameters,
    }));
  }
  return _cachedDefinitions;
}

/** Tra cứu tool theo tên */
export function getTool(name: string): ITool | undefined {
  return ALL_TOOLS.find((t) => t.name === name);
}
