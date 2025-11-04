import * as api from "./api/branch.api";

export async function getAllBranches() {
    const res = await api.getAllBranches();
    return res.data;
}
