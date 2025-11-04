import { User } from "../../../types/User";

export interface AuthState {
  accessToken: string | null;
  isAuthenticated: boolean;
  user?: User;
  loading: boolean;
  error?: string | null;
}
