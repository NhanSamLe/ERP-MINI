// src/app/AppInitializer.tsx
import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "./store/store";
import {  fetchAllBranchesThunk,} from "./features/company/store";

export default function AppInitializer() {
  const dispatch = useDispatch<AppDispatch>();
  const { isAuthenticated } = useSelector((state: RootState) => state.auth);
  useEffect(() => {
    if (isAuthenticated) {
      Promise.all([
        dispatch(fetchAllBranchesThunk()),
      ]);
    }
  }, [isAuthenticated]);
  return null;
}
