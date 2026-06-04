import { combineReducers } from "@reduxjs/toolkit";
import authReducer from "../features/auth/store";
import userReducer from "../features/user/store";
import branchReducer from "../features/company/store";
import productReducer from "../features/products/store";
import categoryReducer from "../features/categories/store";
import purchaseOrderReducer from "../features/purchase/store";
// import masterDataReducer from "../features/master-data/store"
import {
  currencyReducer,
  taxReducer,
  uomReducer,
  conversionReducer,
} from "../features/master-data/store";
import partnersReducer from "../features/partner/store";
import departmentReducer from "../features/hrm/store/department/department.slice";
import { positionReducer } from "../features/hrm/store/position/position.slice";
import { stockBalanceReducer } from "../features/inventory/store";
import { warehouseReducer } from "../features/inventory/store";
import { stockMoveReducer } from "../features/inventory/store";
import { stockLocationReducer } from "../features/inventory/store";
import { stockLotReducer } from "../features/inventory/store";
import { physicalInventoryReducer } from "../features/inventory/store";
import { chatReducer } from "../features/ai-chatbot/store/chatSlice";
import { localRagReducer } from "../features/ai-local-rag/store/localRagSlice";
import {
  leadReducer,
  opportunityReducer,
  activityReducer,
  leadSourceReducer,
  pipelineReducer,
  scoringRuleReducer,
} from "../features/crm/store";
import saleOrderReducer from "@/features/sales/store/saleOrder.slice";
import invoiceReducer from "@/features/sales/store/invoice.slice";
import receiptReducer from "@/features/sales/store/receipt.slice";
import quotationReducer from "@/features/sales/store/quotation.slice";
import attendanceReducer from "../features/hrm/store/attendance/attendance.slice";
import payrollPeriodReducer from "../features/hrm/store/payrollPeriod/payrollPeriod.slice";
import payrollItemReducer from "../features/hrm/store/payrollItem/payrollItem.slice";
import payrollRunReducer from "../features/hrm/store/payrollRun/payrollRun.slice";
import { employeeReducer } from "../features/hrm/store/employee/employee.slice";
import apInvoiceRouter from "../features/purchase/store/apInvoice/apInvoice.slice";
import apPaymentReducer from "@/features/purchase/store/apPayment";
import documentIntelligenceReducer from "@/features/purchase/store/documentIntelligence";
import { narrativeReducer } from "@/features/ai-narrative/store/narrativeSlice";
import { rfqReducer } from "@/features/purchase/store/rfq";
import { purchaseReturnReducer } from "@/features/purchase/store/purchaseReturn";
import leaveRequestReducer from "../features/hrm/store/leaveRequest/leaveRequest.slice";

const rootReducer = combineReducers({
  auth: authReducer,
  user: userReducer,
  branch: branchReducer,
  product: productReducer,
  category: categoryReducer,
  currency: currencyReducer,
  tax: taxReducer,
  uom: uomReducer,
  conversion: conversionReducer,
  partners: partnersReducer,
  purchaseOrder: purchaseOrderReducer,
  hrmDepartment: departmentReducer,
  position: positionReducer,
  stockBalance: stockBalanceReducer,
  warehouse: warehouseReducer,
  stockMove: stockMoveReducer,
  stockLocation: stockLocationReducer,
  stockLot: stockLotReducer,
  physicalInventory: physicalInventoryReducer,
  chat: chatReducer,
  localRag: localRagReducer,
  lead: leadReducer,
  opportunity: opportunityReducer,
  activity: activityReducer,
  leadSource: leadSourceReducer,
  pipeline: pipelineReducer,
  scoringRule: scoringRuleReducer,
  attendance: attendanceReducer,
  payrollPeriod: payrollPeriodReducer,
  saleOrder: saleOrderReducer,
  quotation: quotationReducer,
  invoice: invoiceReducer,
  receipt: receiptReducer,
  payrollItem: payrollItemReducer,
  payrollRun: payrollRunReducer,
  employee: employeeReducer,
  apInvoice: apInvoiceRouter,
  apPayment: apPaymentReducer,
  documentIntelligence: documentIntelligenceReducer,
  narrative: narrativeReducer,
  rfq: rfqReducer,
  purchaseReturn: purchaseReturnReducer,
  leaveRequest: leaveRequestReducer,
});

export default rootReducer;
