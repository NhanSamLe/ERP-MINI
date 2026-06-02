import { employeeApi } from "../api/employee.api";
import { EmployeeFilter, EmployeeFormPayload } from "../dto/employee.dto";

// GET list
export async function fetchEmployees(filter?: EmployeeFilter) {
  const res = await employeeApi.getAll(filter);
  return res.data;
}

// GET detail
export async function fetchEmployee(id: number) {
  const res = await employeeApi.getById(id);
  return res.data;
}

// CREATE
export async function createEmployee(data: EmployeeFormPayload) {
  const res = await employeeApi.create(data);
  return res.data;
}

// UPDATE
export async function updateEmployee(id: number, data: EmployeeFormPayload) {
  const res = await employeeApi.update(id, data);
  return res.data;
}

// DELETE
export async function deleteEmployee(id: number) {
  await employeeApi.remove(id);
}
export async function resignEmployee(
  id: number,
  data: { resign_date: string; resign_reason?: string }
) {
  const res = await employeeApi.resign(id, data);
  return res.data;
}
export async function registerFace(id: number, faceVector: number[]) {
  const res = await employeeApi.registerFace(id, faceVector);
  return res.data;
}