import { useEffect } from "react";
import { useDispatch } from "react-redux";
import { setUser, clearAuth, finishLoading } from "../features/auth/authSlice";
import {refresh,getProfile} from "../features/auth/auth.service";

export function useAuthInitializer() {
  const dispatch = useDispatch();

  useEffect(() => {
    let mounted = true; // tránh memory leak nếu component bị unmount khi promise chưa xong

    const initAuth = async () => {
      try {
        // 1. Gọi refresh() để thử lấy lại accessToken từ refreshToken (cookie)
        const { token } = await refresh();

        if (mounted) {
          if (token) {
            // 2. Nếu có token mới → gọi API lấy thông tin user
            const user = await getProfile();
            // 3. Lưu user vào Redux
            dispatch(setUser(user));
          } else {
            // 4. Nếu không có token → clear state (xem như chưa đăng nhập)
            dispatch(clearAuth());
          }
        }
      } catch {
        // 5. Nếu refresh() bị lỗi (refreshToken hết hạn, cookie không có, v.v.)
        if (mounted) dispatch(clearAuth());
      } finally {
        // 6. Báo cho Redux biết "auth đã check xong" (dù thành công hay fail)
        if (mounted) dispatch(finishLoading());
      }
    };
    initAuth();
    // cleanup function: khi component unmount thì gán mounted = false
    return () => {
      mounted = false;
    };
  }, [dispatch]);
}