import { glAccountApi } from "../api/glAccount.api";
import { GlAccountDTO, GlAccountFilter } from "../dto/glAccount.dto";

export async function fetchGlAccounts(filter?: GlAccountFilter) {
  const res = await glAccountApi.getAll(filter);
  return res.data;
}

export async function createGlAccount(data: GlAccountDTO) {
  const res = await glAccountApi.create(data);
  return res.data;
}

export async function updateGlAccount(
  id: number,
  data: Partial<GlAccountDTO>
) {
  const res = await glAccountApi.update(id, data);
  return res.data;
}

export async function deleteGlAccount(id: number) {
  await glAccountApi.remove(id);
}
