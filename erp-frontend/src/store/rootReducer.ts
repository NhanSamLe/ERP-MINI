import { combineReducers } from "@reduxjs/toolkit";
import authReducer from "../features/auth/store";
import userReducer from "../features/user/store";
import branchReducer from "../features/company/store";
import productReducer from "../features/products/store";
import categoryReducer from "../features/categories/store";
const rootReducer = combineReducers({
  auth: authReducer,
  user: userReducer,
  branch: branchReducer,
  product: productReducer,
  category: categoryReducer,
});

export default rootReducer;
