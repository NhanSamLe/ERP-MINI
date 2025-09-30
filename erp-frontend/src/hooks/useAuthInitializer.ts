import { useEffect } from "react";
import { useDispatch } from "react-redux";
import { setToken, setUser, clearAuth, finishLoading } from "../features/auth/authSlice";
import {refresh,getProfile} from "../features/auth/auth.service";

export function useAuthInitializer() {
  const dispatch = useDispatch();

  useEffect(() => {
    const initAuth = async () => {
      try {
        // gọi /auth/refresh → backend đọc refreshToken từ cookie
        const { token } = await refresh();
        dispatch(setToken(token));

        // gọi tiếp /auth/me → lấy user info
        const user = await getProfile();
        dispatch(setUser(user));
      } catch (err ) {
        console.error("Refresh failed:", err);
        dispatch(clearAuth());
      }
    };

    initAuth().finally(() => {
      dispatch(finishLoading()); 
    });
  }, [dispatch]);
}
