// src/features/company/branch.service.ts
import { BranchAPI, Branch } from "./api/branch.api";

/** Lấy danh sách chi nhánh */
export async function fetchBranches() {
  const res = await BranchAPI.list();
  return res.data;
}

/** Lấy 1 chi nhánh theo id */
export async function fetchBranch(id: number) {
  const res = await BranchAPI.get(id);
  return res.data;
}

/** Tạo chi nhánh */
export async function createBranch(payload: Branch) {
  const res = await BranchAPI.create(payload);
  return res.data;
}

/** Cập nhật chi nhánh */
export async function updateBranch(id: number, payload: Branch) {
  const res = await BranchAPI.update(id, payload);
  return res.data;
}

/** Khóa (deactivate) chi nhánh */
export async function deactivateBranch(id: number) {
  const res = await BranchAPI.deactivate(id);
  return res.data; // { message: "Branch deactivated" }
}

/** (tuỳ chọn) Xóa cứng */
export async function deleteBranch(id: number) {
  const res = await BranchAPI.remove(id);
  return res.data; // { message: "Branch deleted" }
}
export async function activateBranch(id: number) {
  const res = await BranchAPI.activate(id);
  return res.data;
}


export type { Branch } from "./api/branch.api";
