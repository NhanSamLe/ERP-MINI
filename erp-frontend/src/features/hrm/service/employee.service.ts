import { employeeApi } from "../api/employee.api";
import { EmployeeDTO, EmployeeFilter, EmployeeFormPayload } from "../dto/employee.dto";

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
