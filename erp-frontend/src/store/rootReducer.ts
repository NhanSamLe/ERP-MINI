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
import {
  leadReducer,
  opportunityReducer,
  activityReducer,
} from "../features/crm/store";
import saleOrderReducer from "@/features/sales/store/saleOrder.slice";
import invoiceReducer from "@/features/sales/store/invoice.slice";
import receiptReducer from "@/features/sales/store/receipt.slice";
import attendanceReducer from "../features/hrm/store/attendance/attendance.slice";
import payrollPeriodReducer from "../features/hrm/store/payrollPeriod/payrollPeriod.slice";
import payrollItemReducer from "../features/hrm/store/payrollItem/payrollItem.slice";
import payrollRunReducer from "../features/hrm/store/payrollRun/payrollRun.slice";
import { employeeReducer } from "../features/hrm/store/employee/employee.slice";
import apInvoiceRouter from "../features/purchase/store/apInvoice/apInvoice.slice";

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
  lead: leadReducer,
  opportunity: opportunityReducer,
  activity: activityReducer,
  attendance: attendanceReducer,
  payrollPeriod: payrollPeriodReducer,
  saleOrder: saleOrderReducer,
  invoice: invoiceReducer,
  receipt: receiptReducer,
  payrollItem: payrollItemReducer,
  payrollRun: payrollRunReducer,
  employee: employeeReducer,
  apInvoice: apInvoiceRouter,
});

export default rootReducer;
