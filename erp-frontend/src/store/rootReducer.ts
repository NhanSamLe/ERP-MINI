import { combineReducers } from "@reduxjs/toolkit";
import authReducer from "../features/auth/store";
import userReducer from "../features/user/store";
import branchReducer from "../features/company/store";
import productReducer from "../features/products/store";
import categoryReducer from "../features/categories/store";
// import masterDataReducer from "../features/master-data/store"
import {
  currencyReducer,
  taxReducer,
  uomReducer,
  conversionReducer,
} from "../features/master-data/store";
import { leadReducer, opportunityReducer, activityReducer } from "../features/crm/store";
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
  lead: leadReducer,
  opportunity: opportunityReducer,
  activity: activityReducer,
});

export default rootReducer;
