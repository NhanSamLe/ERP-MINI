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

// Gán allowedRoles cho từng nhóm tool dựa trên nghiệp vụ của role
inventoryTools.forEach((t) => {
  if (!t.allowedRoles) {
    t.allowedRoles = ["ADMIN", "CEO", "WHMANAGER", "WHSTAFF", "PURCHASE", "PURCHASEMANAGER", "SALES", "SALESMANAGER"];
  }
});

salesTools.forEach((t) => {
  if (!t.allowedRoles) {
    t.allowedRoles = ["ADMIN", "CEO", "SALES", "SALESMANAGER", "ACCOUNT", "CHACC"];
  }
});

arTools.forEach((t) => {
  if (!t.allowedRoles) {
    t.allowedRoles = ["ADMIN", "CEO", "ACCOUNT", "CHACC", "SALES", "SALESMANAGER"];
  }
});

purchaseTools.forEach((t) => {
  if (!t.allowedRoles) {
    if (["create_purchase_order", "submit_po_for_approval", "create_rfq"].includes(t.name)) {
      t.allowedRoles = ["ADMIN", "CEO", "PURCHASE", "PURCHASEMANAGER"];
    } else {
      t.allowedRoles = ["ADMIN", "CEO", "PURCHASE", "PURCHASEMANAGER", "ACCOUNT", "CHACC"];
    }
  }
});

crmTools.forEach((t) => {
  if (!t.allowedRoles) {
    t.allowedRoles = ["ADMIN", "CEO", "SALES", "SALESMANAGER"];
  }
});

hrmTools.forEach((t) => {
  if (!t.allowedRoles) {
    t.allowedRoles = ["ADMIN", "CEO", "HRMANAGER", "HR_STAFF"];
  }
});

hrmExtraTools.forEach((t) => {
  if (!t.allowedRoles) {
    t.allowedRoles = ["ADMIN", "CEO", "HRMANAGER"];
  }
});

financeTools.forEach((t) => {
  if (!t.allowedRoles) {
    t.allowedRoles = ["ADMIN", "CEO", "ACCOUNT", "CHACC"];
  }
});

productTools.forEach((t) => {
  if (!t.allowedRoles) {
    t.allowedRoles = ["ADMIN", "CEO", "WHMANAGER", "WHSTAFF", "SALES", "SALESMANAGER", "PURCHASE", "PURCHASEMANAGER", "ACCOUNT", "CHACC"];
  }
});

partnerTools.forEach((t) => {
  if (!t.allowedRoles) {
    t.allowedRoles = ["ADMIN", "CEO", "WHMANAGER", "WHSTAFF", "SALES", "SALESMANAGER", "PURCHASE", "PURCHASEMANAGER", "ACCOUNT", "CHACC"];
  }
});

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

/** Lấy danh sách tất cả tools (dùng để gửi cho LLM) */
export function getAllTools(): ITool[] {
  return ALL_TOOLS;
}

/** Lấy ToolDefinitions để gửi cho LLM (chỉ name, description, parameters, được lọc theo userRole) */
export function getToolDefinitions(userRole?: string): ToolDefinition[] {
  if (!userRole) {
    return ALL_TOOLS.map((t) => ({
      name: t.name,
      description: t.description,
      parameters: t.parameters,
    }));
  }

  return ALL_TOOLS.filter((t) => {
    // ADMIN và CEO được phép dùng tất cả các công cụ
    if (userRole === "ADMIN" || userRole === "CEO") {
      return true;
    }
    // Nếu tool có cấu hình allowedRoles, kiểm tra role người dùng
    if (t.allowedRoles) {
      return t.allowedRoles.includes(userRole);
    }
    return true;
  }).map((t) => ({
    name: t.name,
    description: t.description,
    parameters: t.parameters,
  }));
}

/** Tra cứu tool theo tên */
export function getTool(name: string): ITool | undefined {
  return ALL_TOOLS.find((t) => t.name === name);
}

