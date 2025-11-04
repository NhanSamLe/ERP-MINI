import * as model from "../../../models/index";

export async function getAllBranches() {
  const branches = await model.Branch.findAll();
  return branches;
}