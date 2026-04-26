import { ITool, ToolDefinition } from "../types/llm.types";
import { inventoryTools } from "./inventory.tools";
import { salesTools } from "./sales.tools";
import { purchaseTools } from "./purchase.tools";
import { crmTools } from "./crm.tools";
import { hrmTools } from "./hrm.tools";
import { financeTools } from "./finance.tools";

// Tập hợp tất cả 14 tools
const ALL_TOOLS: ITool[] = [
  ...inventoryTools,
  ...salesTools,
  ...purchaseTools,
  ...crmTools,
  ...hrmTools,
  ...financeTools,
];

/** Lấy danh sách tất cả tools (dùng để gửi cho LLM) */
export function getAllTools(): ITool[] {
  return ALL_TOOLS;
}

/** Lấy ToolDefinitions để gửi cho LLM (chỉ name, description, parameters) */
export function getToolDefinitions(): ToolDefinition[] {
  return ALL_TOOLS.map((t) => ({
    name: t.name,
    description: t.description,
    parameters: t.parameters,
  }));
}

/** Tra cứu tool theo tên */
export function getTool(name: string): ITool | undefined {
  return ALL_TOOLS.find((t) => t.name === name);
}
