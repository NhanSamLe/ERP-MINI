import { Op } from "sequelize";
import { Department } from "../models/department.model";
import { Employee } from '../models/employee.model';

export interface DepartmentFilter {
  search?: string | undefined;
  branch_id?: number | undefined;
}

export async function getAllDepartments(filter: DepartmentFilter = {}) {
  const where: any = {};

  if (filter.search) {
    where[Op.or] = [
      { name: { [Op.like]: `%${filter.search}%` } },
      { code: { [Op.like]: `%${filter.search}%` } },
    ];
  }

  if (filter.branch_id) {
    where.branch_id = filter.branch_id;
  }

  const rows = await Department.findAll({
    where,
    order: [["id", "ASC"]],
  });

  return rows;
}

export async function getDepartmentById(id: number) {
  const row = await Department.findByPk(id);
  if (!row) throw new Error("Department not found");
  return row;
}

export async function createDepartment(payload: {
  branch_id: number;
  code: string;
  name: string;
}) {
  if (!payload.branch_id) throw new Error("Branch is required");
  if (!payload.code) throw new Error("Code is required");
  if (!payload.name) throw new Error("Name is required");

  // ❌ BỎ check code global
  // const existed = await Department.findOne({ where: { code: payload.code } });

  // ✅ Check trùng theo (branch_id + code)
  const existed = await Department.findOne({
    where: {
      branch_id: payload.branch_id,
      code: payload.code,
    },
  });
  if (existed) {
    throw new Error("Mã phòng ban này đã tồn tại trong chi nhánh này");
  }

  const row = await Department.create(payload);
  return row;
}
export async function updateDepartment(
  id: number,
  payload: Partial<{ branch_id: number; code: string; name: string }>
) {
  const row = await Department.findByPk(id);
  if (!row) throw new Error("Department not found");

  const newBranchId = payload.branch_id ?? row.branch_id;
  const newCode = payload.code ?? row.code;

  // ✅ Nếu có thay đổi code hoặc branch → check trùng (branch_id + code)
  if (newBranchId !== row.branch_id || newCode !== row.code) {
    const existed = await Department.findOne({
      where: {
        branch_id: newBranchId,
        code: newCode,
        id: { [Op.ne]: id }, // bỏ qua chính nó
      },
    });

    if (existed) {
      throw new Error("Mã phòng ban này đã tồn tại trong chi nhánh này");
    }
  }

  await row.update(payload);
  return row;
}



export async function deleteDepartment(departmentId: number) {
  // Kiểm tra employee
  const employeeCount = await Employee.count({
    where: {
      department_id: departmentId,
      status: 'active'
    }
  });

  if (employeeCount > 0) {
    const error = new Error(
      `Không thể xóa phòng ban này vì còn ${employeeCount} nhân viên đang làm việc. Vui lòng chuyển nhân viên sang phòng ban khác trước.`
    );
    (error as any).code = 'DEPARTMENT_HAS_EMPLOYEES';
    (error as any).employeeCount = employeeCount;
    throw error;
  }

  // Xóa department
  await Department.destroy({
    where: { id: departmentId }
  });

  return { 
    success: true, 
    message: 'Đã xóa phòng ban thành công' 
  };
}