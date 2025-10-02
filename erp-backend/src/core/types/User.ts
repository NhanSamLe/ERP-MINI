import type { User , Role, Branch} from "../../models/index";
export interface UserWithRole extends User {
  role?: Role;
  branch?: Branch;
}
