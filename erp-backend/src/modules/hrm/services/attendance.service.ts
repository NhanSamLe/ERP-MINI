import { Attendance } from "../models/attendance.model";

export async function getAll(filter: any) {
  return Attendance.findAll({ where: filter, order: [["work_date", "DESC"]] });
}

export async function getByEmployee(employee_id: number) {
  return Attendance.findAll({
    where: { employee_id },
    order: [["work_date", "DESC"]],
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
