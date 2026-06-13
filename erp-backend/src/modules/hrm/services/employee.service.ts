import { Op } from "sequelize";
import { Employee } from "../models/employee.model";
import { Department } from "../models/department.model";
import { Position } from "../models/position.model";
import { PayrollRunLine } from "../models/payrollRunLine.model";
import { EmployeeFace } from "../models/employeeFace.model";
import { Branch } from "../../company/models/branch.model";
import { User } from "../../auth/models/user.model";
import { notificationService } from "../../../core/services/notification.service";

export interface EmployeeFilter {
  search?: string;
  branch_id?: number;
  department_id?: number;
  position_id?: number;
  status?: "active" | "inactive" | "resigned";
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
      { model: EmployeeFace, as: "faces", attributes: ["id"] },
      { model: User, as: "user", attributes: ["id", "username", "is_active"] },
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
      { model: User, as: "user", attributes: ["id", "username", "is_active"] },
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
  emp_code?: string;
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
  status?: "active" | "inactive" | "resigned";
}

// ============ CREATE ============

export async function createEmployee(payload: EmployeePayload, user: UserJwt, app?: any) {
  const branchId =
    user.role === "HR_STAFF" && user.branchId
      ? Number(user.branchId)
      : payload.branch_id;

  if (!branchId) throw new Error("branch_id is required");

  let emp_code = payload.emp_code;
  if (!emp_code || emp_code.trim() === "") {
    const employees = await Employee.findAll({
      attributes: ["emp_code"],
      where: {
        emp_code: { [Op.like]: "EMP%" }
      },
      raw: true
    });
    let maxNum = 0;
    for (const e of employees) {
      const numPart = e.emp_code.replace("EMP", "");
      const num = parseInt(numPart, 10);
      if (!isNaN(num) && num > maxNum) {
        maxNum = num;
      }
    }
    emp_code = "EMP" + String(maxNum + 1).padStart(3, "0");
  } else {
    const exists = await Employee.findOne({ where: { emp_code } });
    if (exists) throw new Error("Employee code already exists");
  }

  // Nếu là HR_STAFF thêm nhân viên mới, trạng thái mặc định là inactive (chờ HR Manager duyệt/kích hoạt)
  const defaultStatus = user.role === "HR_STAFF" ? "inactive" : "active";
  const statusToSet = user.role === "HR_STAFF" ? "inactive" : (payload.status || defaultStatus);

  const dataToCreate: any = {
    branch_id: branchId,
    emp_code,
    full_name: payload.full_name,
    gender: payload.gender,
    contract_type: payload.contract_type,
    base_salary: payload.base_salary,
    status: statusToSet,
  };

  if (payload.birth_date) dataToCreate.birth_date = new Date(payload.birth_date);
  if (payload.hire_date) dataToCreate.hire_date = new Date(payload.hire_date);
  if (payload.cccd) dataToCreate.cccd = payload.cccd;
  if (payload.department_id) dataToCreate.department_id = payload.department_id;
  if (payload.position_id) dataToCreate.position_id = payload.position_id;
  if (payload.bank_account) dataToCreate.bank_account = payload.bank_account;
  if (payload.bank_name) dataToCreate.bank_name = payload.bank_name;

  const emp = await Employee.create(dataToCreate);

  // Gửi thông báo nếu tạo ở trạng thái inactive (chờ duyệt)
  if (emp.status === "inactive" && app) {
    const io = app.get("io");
    setImmediate(async () => {
      try {
        await notificationService.createNotification({
          type: "SUBMIT",
          referenceType: "EMPLOYEE",
          referenceId: emp.id,
          referenceNo: emp.emp_code,
          employeeName: emp.full_name,
          branchId: emp.branch_id,
          submitterId: user.id,
          submitterName: user.username,
          io,
        });
      } catch (err) {
        console.error("Error creating employee notification:", err);
      }
    });
  }

  return emp;
}

// ============ UPDATE ============

export async function updateEmployee(
  id: number,
  payload: Partial<EmployeePayload>,
  user: UserJwt,
  app?: any
) {
  const emp = await Employee.findByPk(id);
  if (!emp) throw new Error("Employee not found");

  const oldStatus = emp.status;

  if (user.role === "HR_STAFF" && user.branchId) {
    if (emp.branch_id !== Number(user.branchId)) {
      throw new Error("Forbidden");
    }
    // HR không được đổi branch
    delete (payload as any).branch_id;
  }

  // Chặn HR_STAFF tự ý chuyển trạng thái thành active (tự duyệt)
  if (payload.status === "active" && oldStatus !== "active") {
    if (user.role === "HR_STAFF") {
      throw new Error("Chỉ HR Manager hoặc Admin mới có quyền phê duyệt nhân viên");
    }
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

  // Nếu chuyển từ inactive sang active (được duyệt)
  if (payload.status === "active" && oldStatus === "inactive") {
    if (app) {
      const io = app.get("io");
      
      // Tìm người submit ban đầu từ bảng notifications
      let originalSubmitterId: number | undefined = undefined;
      try {
        const { Notification } = await import("../../../core/models/notification.model");
        const submitNotification = await Notification.findOne({
          where: {
            reference_type: "EMPLOYEE",
            reference_id: emp.id,
            type: "SUBMIT"
          },
          order: [["created_at", "ASC"]]
        });
        if (submitNotification) {
          originalSubmitterId = submitNotification.user_id;
        }
      } catch (err) {
        console.error("Error finding original submitter:", err);
      }

      setImmediate(async () => {
        try {
          const params: any = {
            type: "APPROVE",
            referenceType: "EMPLOYEE",
            referenceId: emp.id,
            referenceNo: emp.emp_code,
            employeeName: emp.full_name,
            branchId: emp.branch_id,
            approverName: user.username,
            io,
          };
          if (originalSubmitterId !== undefined) {
            params.submitterId = originalSubmitterId;
          }
          await notificationService.createNotification(params);
        } catch (err) {
          console.error("Error sending approve notification:", err);
        }
      });
    }
  }

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

// ============ RESIGN (Offboarding) ============

export async function resignEmployee(
  id: number,
  payload: { resign_date: string; resign_reason?: string },
  user: UserJwt
) {
  const emp = await Employee.findByPk(id);
  if (!emp) throw new Error("Employee not found");

  if (user.role === "HR_STAFF" && user.branchId) {
    if (emp.branch_id !== Number(user.branchId)) throw new Error("Forbidden");
  }

  if (emp.status === "resigned") throw new Error("Nhân viên này đã nghỉ việc rồi");

  // 1. Set employee status = resigned
  const updateData: any = {
    status: "resigned",
    resign_date: new Date(payload.resign_date),
  };
  if (payload.resign_reason) updateData.resign_reason = payload.resign_reason;

  await emp.update(updateData);

  // 2. Disable login — tìm user liên kết qua employee_id và set is_active = false
  const { User } = await import("../../../models/index");
  const linkedUser = await User.findOne({ where: { employee_id: id } });
  if (linkedUser) {
    await linkedUser.update({ is_active: false });
  }

  return emp;
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
