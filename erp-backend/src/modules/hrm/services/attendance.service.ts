import * as model from "../../../models"; // đường dẫn từ service tới src/models/index.ts

export async function getAll(filter: any) {
  return model.Attendance.findAll({
    where: filter,
    order: [["work_date", "DESC"]],
    include: [
  {
    model: model.Employee,
    as: "employee",
    attributes: ["id", "full_name"], // 👈 bỏ 'code'
  },
  {
    model: model.Branch,
    as: "branch",
    attributes: ["id", "code", "name"],
  },
],

  });
}

export async function getByEmployee(employee_id: number) {
  return model.Attendance.findAll({
    where: { employee_id },
    order: [["work_date", "DESC"]],
    include: [
  {
    model: model.Employee,
    as: "employee",
    attributes: ["id", "full_name"], // 👈 sửa giống trên
  },
  {
    model: model.Branch,
    as: "branch",
    attributes: ["id", "code", "name"],
  },
],

  });
}

export async function create(payload: any) {
  return model.Attendance.create(payload);
}

export async function update(id: number, payload: any) {
  const row = await model.Attendance.findByPk(id);
  if (!row) throw new Error("Attendance not found");
  await row.update(payload);
  return row;
}

export async function remove(id: number) {
  const row = await model.Attendance.findByPk(id);
  if (!row) throw new Error("Attendance not found");
  await row.destroy();
  return true;
}
