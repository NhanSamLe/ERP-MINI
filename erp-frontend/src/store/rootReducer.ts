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
import { leadReducer, opportunityReducer, activityReducer } from "../features/crm/store";
import saleOrderReducer from "@/features/sales/store/saleOrder.slice";
import invoiceReducer from "@/features/sales/store/invoice.slice";
import receiptReducer from "@/features/sales/store/receipt.slice";
import attendanceReducer from "../features/hrm/store/attendance/attendance.slice";
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
  saleOrder: saleOrderReducer,
  invoice: invoiceReducer,
  receipt: receiptReducer
});

export default rootReducer;
