import axiosClient from "../../../api/axiosClient";

export async function fetchRoles() {
  const res = await axiosClient.get("/auth/roles");
  return res.data; // [{id, code, name}, ...]
}

export async function createUser(payload: {
  username: string;
  password: string;
  full_name: string;
  branch_id: number;
  employee_id: number;
  role_id: number;
}) {
  const res = await axiosClient.post("/auth/users", payload);
  return res.data;
}
