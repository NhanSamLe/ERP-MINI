import * as model from "../../../models"; // đường dẫn từ service tới src/models/index.ts
import { checkPeriodLocked } from "../../finance/services/glJournal.service";

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
  if (payload.work_date) {
    await checkPeriodLocked(payload.work_date);
  }
  return model.Attendance.create(payload);
}

export async function update(id: number, payload: any) {
  const row = await model.Attendance.findByPk(id);
  if (!row) throw new Error("Attendance not found");
  
  if (row.work_date) {
    await checkPeriodLocked(row.work_date);
  }
  if (payload.work_date && payload.work_date !== row.work_date) {
    await checkPeriodLocked(payload.work_date);
  }

  await row.update(payload);
  return row;
}

export async function remove(id: number) {
  const row = await model.Attendance.findByPk(id);
  if (!row) throw new Error("Attendance not found");
  
  if (row.work_date) {
    await checkPeriodLocked(row.work_date);
  }

  await row.destroy();
  return true;
}
