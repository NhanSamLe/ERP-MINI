import { combineReducers } from "@reduxjs/toolkit";
import authReducer from "../features/auth/store";
import userReducer from "../features/user/store";
import branchReducer from "../features/company/store";
// import masterDataReducer from "../features/master-data/store"
import {
  currencyReducer,
  taxReducer,
  uomReducer,
  conversionReducer,
} from "../features/master-data/store";
const rootReducer = combineReducers({
  auth: authReducer,
  user: userReducer,
  branch: branchReducer,
  currency: currencyReducer,
  tax: taxReducer,
  uom: uomReducer,
  conversion: conversionReducer,
});
  
export default rootReducer;
