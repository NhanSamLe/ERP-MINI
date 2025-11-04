import axiosClient from "../../../api/axiosClient";
export function getAllBranches() {
  return axiosClient.get("/branch");
}