import { Op } from "sequelize";
import { Employee } from "../models/employee.model";
import { Department } from "../models/department.model";
import { Position } from "../models/position.model";
import { PayrollRunLine } from "../models/payrollRunLine.model";
import { Branch } from "../../company/models/branch.model";

export interface EmployeeFilter {
  search?: string;
  branch_id?: number;
  department_id?: number;
  position_id?: number;
  status?: "active" | "inactive";
}

interface UserJwt {
  id: number;
  username: string;
  role: string;       // "HR_STAFF" | "EMPLOYEE" | "CEO" | ...
  branchId?: string;  // từ token
}

// ============ LIST ============

export async function listEmployees(filter: EmployeeFilter, user: UserJwt) {
  const where: any = {};

  // HR Staff: chỉ xem được trong chi nhánh của mình
  if (user.role === "HR_STAFF" && user.branchId) {
    where.branch_id = Number(user.branchId);
  } else if (filter.branch_id) {
    where.branch_id = filter.branch_id;
  }

  if (filter.department_id) where.department_id = filter.department_id;
  if (filter.position_id) where.position_id = filter.position_id;
  if (filter.status) where.status = filter.status;

  if (filter.search) {
    where[Op.or] = [
      { full_name: { [Op.like]: `%${filter.search}%` } },
      { emp_code: { [Op.like]: `%${filter.search}%` } },
      { cccd: { [Op.like]: `%${filter.search}%` } },
    ];
  }

  const rows = await Employee.findAll({
    where,
    include: [
      { model: Department, as: "department", attributes: ["id", "code", "name"] },
      { model: Position, as: "position", attributes: ["id", "name"] },
      { model: Branch, as: "branch", attributes: ["id", "name"] },
    ],
    order: [["full_name", "ASC"]],
  });

  return rows;
}

// ============ DETAIL ============

export async function getEmployeeById(id: number, user: UserJwt) {
  const emp = await Employee.findByPk(id, {
    include: [
      { model: Department, as: "department", attributes: ["id", "code", "name"] },
      { model: Position, as: "position", attributes: ["id", "name"] },
    ],
  });

  if (!emp) throw new Error("Employee not found");

  if (user.role === "HR_STAFF" && user.branchId) {
    if (emp.branch_id !== Number(user.branchId)) {
      throw new Error("Forbidden");
    }
  }

  return emp;
}

// ============ CREATE ============

export interface EmployeePayload {
  branch_id?: number;
  emp_code: string;
  full_name: string;
  gender: "male" | "female" | "other";
  birth_date?: string;
  cccd?: string;
  hire_date?: string;
  contract_type: "trial" | "official" | "seasonal";
  department_id?: number;
  position_id?: number;
  base_salary: number;
  bank_account?: string;
  bank_name?: string;
  status?: "active" | "inactive";
}

// ============ CREATE ============

export async function createEmployee(payload: EmployeePayload, user: UserJwt) {
  const branchId =
    user.role === "HR_STAFF" && user.branchId
      ? Number(user.branchId)
      : payload.branch_id;

  if (!branchId) throw new Error("branch_id is required");

  const exists = await Employee.findOne({ where: { emp_code: payload.emp_code } });
  if (exists) throw new Error("Employee code already exists");

  // build object rõ ràng, convert date từ string -> Date
  const dataToCreate: any = {
    branch_id: branchId,
    emp_code: payload.emp_code,
    full_name: payload.full_name,
    gender: payload.gender,
    contract_type: payload.contract_type,
    base_salary: payload.base_salary,
  };

  if (payload.birth_date) dataToCreate.birth_date = new Date(payload.birth_date);
  if (payload.hire_date) dataToCreate.hire_date = new Date(payload.hire_date);
  if (payload.cccd) dataToCreate.cccd = payload.cccd;
  if (payload.department_id) dataToCreate.department_id = payload.department_id;
  if (payload.position_id) dataToCreate.position_id = payload.position_id;
  if (payload.bank_account) dataToCreate.bank_account = payload.bank_account;
  if (payload.bank_name) dataToCreate.bank_name = payload.bank_name;
  if (payload.status) dataToCreate.status = payload.status;

  const emp = await Employee.create(dataToCreate);
  return emp;
}

// ============ UPDATE ============

export async function updateEmployee(
  id: number,
  payload: Partial<EmployeePayload>,
  user: UserJwt
) {
  const emp = await Employee.findByPk(id);
  if (!emp) throw new Error("Employee not found");

  if (user.role === "HR_STAFF" && user.branchId) {
    if (emp.branch_id !== Number(user.branchId)) {
      throw new Error("Forbidden");
    }
    // HR không được đổi branch
    delete (payload as any).branch_id;
  }

  const dataToUpdate: any = {};

  if (payload.emp_code !== undefined) dataToUpdate.emp_code = payload.emp_code;
  if (payload.full_name !== undefined) dataToUpdate.full_name = payload.full_name;
  if (payload.gender !== undefined) dataToUpdate.gender = payload.gender;
  if (payload.contract_type !== undefined)
    dataToUpdate.contract_type = payload.contract_type;
  if (payload.base_salary !== undefined)
    dataToUpdate.base_salary = payload.base_salary;

  if (payload.birth_date !== undefined) {
    dataToUpdate.birth_date = payload.birth_date
      ? new Date(payload.birth_date)
      : null;
  }
  if (payload.hire_date !== undefined) {
    dataToUpdate.hire_date = payload.hire_date
      ? new Date(payload.hire_date)
      : null;
  }
  if (payload.cccd !== undefined) dataToUpdate.cccd = payload.cccd;
  if (payload.department_id !== undefined)
    dataToUpdate.department_id = payload.department_id;
  if (payload.position_id !== undefined)
    dataToUpdate.position_id = payload.position_id;
  if (payload.bank_account !== undefined)
    dataToUpdate.bank_account = payload.bank_account;
  if (payload.bank_name !== undefined)
    dataToUpdate.bank_name = payload.bank_name;
  if (payload.status !== undefined) dataToUpdate.status = payload.status;

  await emp.update(dataToUpdate);
  return emp;
}


// ============ DELETE ============

export async function deleteEmployee(id: number, user: UserJwt) {
  const emp = await Employee.findByPk(id);
  if (!emp) throw new Error("Employee not found");

  if (user.role === "HR_STAFF" && user.branchId) {
    if (emp.branch_id !== Number(user.branchId)) {
      throw new Error("Forbidden");
    }
  }

  // kiểm tra đã phát sinh dữ liệu lương chưa
  const payrollCount = await PayrollRunLine.count({
    where: { employee_id: id },
  });

  if (payrollCount > 0) {
    throw new Error(
      "Không thể xóa nhân viên đã phát sinh dữ liệu lương. Hãy chuyển trạng thái sang 'inactive'."
    );
  }

  await emp.destroy();
}

// ============ OWN PROFILE ============

export async function getOwnProfile(user: UserJwt) {
  // Giả sử username = mã nhân viên
  const emp = await Employee.findOne({
    where: { emp_code: user.username },
    include: [
      { model: Department, as: "department", attributes: ["id", "code", "name"] },
      { model: Position, as: "position", attributes: ["id", "name"] },
    ],
  });

  if (!emp) throw new Error("Employee profile not found for this account");

  return emp;
}
