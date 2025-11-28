import { Attendance } from "../models/attendance.model";
import { Employee } from "../models/employee.model";
import { Branch } from "../../company/models/branch.model";

export async function getAll(filter: any) {
  return Attendance.findAll({
    where: filter,
    order: [["work_date", "DESC"]],
    include: [
      {
        model: Employee,
        as: "employee",
        attributes: ["id", "code", "full_name"],
      },
      {
        model: Branch,
        as: "branch",
        attributes: ["id", "code", "name"],
      },
    ],
  });
}

export async function getByEmployee(employee_id: number) {
  return Attendance.findAll({
    where: { employee_id },
    order: [["work_date", "DESC"]],
    include: [
      {
        model: Employee,
        as: "employee",
        attributes: ["id", "code", "full_name"],
      },
      {
        model: Branch,
        as: "branch",
        attributes: ["id", "code", "name"],
      },
    ],
  });
}

export async function create(payload: any) {
  return Attendance.create(payload);
}

export async function update(id: number, payload: any) {
  const row = await Attendance.findByPk(id);
  if (!row) throw new Error("Attendance not found");
  await row.update(payload);
  return row;
}

export async function remove(id: number) {
  const row = await Attendance.findByPk(id);
  if (!row) throw new Error("Attendance not found");
  await row.destroy();
  return true;
}
