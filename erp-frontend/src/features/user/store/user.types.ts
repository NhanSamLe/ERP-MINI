import {User, Role} from "../../../types/User"
export interface UserState {
  users: User[];
  roles: Role[];
  loading: boolean;
  error?: string | null;
}