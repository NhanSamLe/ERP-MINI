import { departmentApi } from "../api/department.api";
import { DepartmentDTO, DepartmentFilter } from "../dto/department.dto";

export async function fetchDepartments(filter?: DepartmentFilter) {
  return departmentApi.getAll(filter);
}


export async function createDepartment(data: DepartmentDTO) {
  return departmentApi.create(data);
}

export async function updateDepartment(id: number, data: Partial<DepartmentDTO>) {
  return departmentApi.update(id, data);
}

export async function deleteDepartment(id: number) {
  return departmentApi.remove(id);
}
