import * as model from "../../../models";
import dayjs from "dayjs";
import { notificationService } from "../../../core/services/notification.service";
import { checkPeriodLocked } from "../../finance/services/glJournal.service";

export async function getAll(filter: any = {}) {
  const where: any = {};
  if (filter.branch_id) {
    where.branch_id = filter.branch_id;
  }
  if (filter.status && filter.status !== "all") {
    where.status = filter.status;
  }
  if (filter.employee_id) {
    where.employee_id = filter.employee_id;
  }

  return model.LeaveRequest.findAll({
    where,
    order: [["created_at", "DESC"]],
    include: [
      {
        model: model.Employee,
        as: "employee",
        attributes: ["id", "full_name", "emp_code"],
      },
      {
        model: model.Branch,
        as: "branch",
        attributes: ["id", "code", "name"],
      },
    ],
  });
}

export async function getByEmployee(employeeId: number) {
  return model.LeaveRequest.findAll({
    where: { employee_id: employeeId },
    order: [["created_at", "DESC"]],
    include: [
      {
        model: model.Employee,
        as: "employee",
        attributes: ["id", "full_name", "emp_code"],
      },
      {
        model: model.Branch,
        as: "branch",
        attributes: ["id", "code", "name"],
      },
    ],
  });
}

export async function create(
  payload: {
    employee_id: number;
    branch_id: number;
    start_date: string;
    end_date: string;
    half_day?: "none" | "morning" | "afternoon";
    leave_type?: "annual" | "sick" | "unpaid" | "maternity";
    reason?: string;
  },
  user?: any,
  app?: any
) {
  await checkPeriodLocked(payload.start_date);
  await checkPeriodLocked(payload.end_date);

  const row = await model.LeaveRequest.create({
    employee_id: payload.employee_id,
    branch_id: payload.branch_id,
    start_date: payload.start_date,
    end_date: payload.end_date,
    half_day: payload.half_day || "none",
    leave_type: payload.leave_type || "annual",
    reason: payload.reason || "",
    status: "pending",
  });

  if (app) {
    const io = app.get("io");
    setImmediate(async () => {
      try {
        const requester = await model.Employee.findByPk(payload.employee_id);
        if (!requester) return;

        const requesterUser = await model.User.findOne({
          where: { employee_id: payload.employee_id },
        });

        const submitterId = requesterUser ? requesterUser.id : (user ? user.id : undefined);
        const submitterName = requester.full_name || (user ? user.username : undefined);

        await notificationService.createNotification({
          type: "SUBMIT",
          referenceType: "LEAVE_REQUEST",
          referenceId: row.id,
          referenceNo: `NP-${row.id}`,
          branchId: row.branch_id,
          submitterId,
          submitterName,
          io,
        });
      } catch (err) {
        console.error("Error creating leave request notification:", err);
      }
    });
  }

  return row;
}

export async function updateStatus(
  id: number,
  status: "approved" | "rejected",
  approvedByUserId: number,
  app?: any,
  user?: any
) {
  const row = await model.LeaveRequest.findByPk(id);
  if (!row) throw new Error("Leave request not found");

  await checkPeriodLocked(row.start_date);
  await checkPeriodLocked(row.end_date);

  if (row.status !== "pending") {
    throw new Error("This leave request has already been processed");
  }

  const updatedRow = await model.sequelize.transaction(async (t) => {
    row.status = status;
    row.approved_by = approvedByUserId;
    row.approved_at = new Date();
    await row.save({ transaction: t });

    if (status === "approved") {
      const start = dayjs(row.start_date);
      const end = dayjs(row.end_date);
      let current = start;

      const leaveTypeText = {
        annual: "Annual Leave",
        sick: "Sick Leave",
        unpaid: "Unpaid Leave",
        maternity: "Maternity Leave",
      }[row.leave_type] || row.leave_type;

      const halfDayText = {
        none: "",
        morning: " (Morning)",
        afternoon: " (Afternoon)",
      }[row.half_day] || "";

      const noteText = `${leaveTypeText}${halfDayText}${row.reason ? ` - Reason: ${row.reason}` : ""}`;

      while (current.isBefore(end) || current.isSame(end, "day")) {
        // Chỉ ghi nhận ngày nghỉ phép vào các ngày làm việc (bỏ qua Chủ Nhật)
        if (current.day() !== 0) {
          const dateStr = current.format("YYYY-MM-DD");

          const [attendance, created] = await model.Attendance.findOrCreate({
            where: {
              employee_id: row.employee_id,
              work_date: dateStr as any,
            },
            defaults: {
              branch_id: row.branch_id,
              employee_id: row.employee_id,
              work_date: dateStr as any,
              status: "leave",
              note: noteText,
            },
            transaction: t,
          });

          if (!created) {
            await attendance.update(
              {
                status: "leave",
                note: noteText,
              },
              { transaction: t }
            );
          }
        }

        current = current.add(1, "day");
      }
    }

    return row;
  });

  if (app) {
    const io = app.get("io");
    setImmediate(async () => {
      try {
        const requesterUser = await model.User.findOne({
          where: { employee_id: row.employee_id },
        });

        if (requesterUser) {
          const approverUser = user || await model.User.findByPk(approvedByUserId);
          const approverName = approverUser ? (approverUser.full_name || approverUser.username) : "Manager";

          await notificationService.createNotification({
            type: status === "approved" ? "APPROVE" : "REJECT",
            referenceType: "LEAVE_REQUEST",
            referenceId: row.id,
            referenceNo: `NP-${row.id}`,
            branchId: row.branch_id,
            submitterId: requesterUser.id,
            approverName,
            io,
          });
        }
      } catch (err) {
        console.error("Error creating leave request status update notification:", err);
      }
    });
  }

  return updatedRow;
}
