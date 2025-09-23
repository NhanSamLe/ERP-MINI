import type { User , Role} from "../../models/index";
export interface UserWithRole extends User {
  role?: Role;
}
