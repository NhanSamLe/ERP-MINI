import * as model from "../../../models"; // đường dẫn từ service tới src/models/index.ts
import { checkPeriodLocked } from "../../finance/services/glJournal.service";
import { sequelize } from "../../../config/db";
import dayjs from "dayjs";

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

export async function createHolidayBulk(startDateStr: string, endDateStr: string, holidayName: string, branchId?: number) {
  await checkPeriodLocked(startDateStr);
  await checkPeriodLocked(endDateStr);

  const start = dayjs(startDateStr);
  const end = dayjs(endDateStr);

  if (end.isBefore(start)) {
    throw new Error("Ngày kết thúc phải sau hoặc bằng ngày bắt đầu.");
  }

  const dateList: string[] = [];
  let current = start;
  while (current.isBefore(end) || current.isSame(end, "day")) {
    dateList.push(current.format("YYYY-MM-DD"));
    current = current.add(1, "day");
  }

  const whereClause: any = { status: "active" };
  if (branchId) {
    whereClause.branch_id = branchId;
  }

  const employees = await model.Employee.findAll({ where: whereClause });
  let affectedCount = 0;

  await sequelize.transaction(async (t) => {
    for (const dateStr of dateList) {
      for (const emp of employees) {
        const [attendance, created] = await model.Attendance.findOrCreate({
          where: {
            employee_id: emp.id,
            work_date: dateStr as any,
          },
          defaults: {
            branch_id: emp.branch_id || branchId || 1,
            employee_id: emp.id,
            work_date: dateStr as any,
            status: "holiday",
            note: holidayName,
          },
          transaction: t,
        });

        if (!created) {
          await attendance.update(
            {
              status: "holiday",
              note: holidayName,
            },
            { transaction: t }
          );
        }
        affectedCount++;
      }
    }
  });

  return { success: true, count: affectedCount };
}
