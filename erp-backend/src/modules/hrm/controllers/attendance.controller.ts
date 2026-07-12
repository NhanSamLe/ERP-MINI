import { Request, Response } from "express";
import * as service from "../services/attendance.service";
import * as attendanceService from "../services/attendance.service";

export const getAll = async (req: Request, res: Response) => {
  try {
    // 🚫 TẠM THỜI KHÔNG DÙNG req.query LÀM where, cho đỡ lỗi
    // const filter = { ...req.query };

    const filter: any = {}; // lấy hết, không filter gì cả

    const rows = await attendanceService.getAll(filter);
    return res.json(rows);
  } catch (err: any) {
    console.error("getAll attendance error:", err);
    // Đổi thành 500 để biết là lỗi server, không phải do client gửi sai
    return res.status(500).json({ message: err.message || "Internal server error" });
  }
};

export async function getByEmployee(req: Request, res: Response) {
  try {
    const data = await service.getByEmployee(Number(req.params.employeeId));
    res.json(data);
  } catch (e: unknown) {
    const err = e as Error;
    res.status(400).json({ error: err.message });
  }
}

export async function create(req: Request, res: Response) {
  try {
    const { employee_id, work_date } = req.body;
    const { Attendance } = await import("../../../models/index");
    
    const exists = await Attendance.findOne({ where: { employee_id, work_date } });
    if (exists) {
      return res.status(400).json({ error: "Nhân viên đã có bản ghi chấm công trong ngày này." });
    }

    const data = await service.create(req.body);
    res.json(data);
  } catch (e: unknown) {
    const err = e as Error;
    res.status(400).json({ error: err.message });
  }
}

export async function update(req: Request, res: Response) {
  try {
    const { employee_id, work_date } = req.body;
    const { Op } = await import("sequelize");
    const { Attendance } = await import("../../../models/index");

    if (employee_id && work_date) {
      const exists = await Attendance.findOne({
        where: {
          employee_id,
          work_date,
          id: { [Op.ne]: Number(req.params.id) }
        }
      });
      if (exists) {
        return res.status(400).json({ error: "Nhân viên đã có bản ghi chấm công trong ngày này." });
      }
    }

    const data = await service.update(Number(req.params.id), req.body);
    res.json(data);
  } catch (e: unknown) {
    const err = e as Error;
    res.status(400).json({ error: err.message });
  }
}

export async function remove(req: Request, res: Response) {
  try {
    await service.remove(Number(req.params.id));
    res.json({ message: "Deleted" });
  } catch (e: unknown) {
    const err = e as Error;
    res.status(400).json({ error: err.message });
  }
}

export async function checkInAI(req: Request, res: Response) {
  const { faceVector } = req.body;

  if (!faceVector || !Array.isArray(faceVector)) {
    return res.status(400).json({ error: "Thiếu vector khuôn mặt" });
  }

  try {
    // 1. So khớp khuôn mặt
    const { findBestMatch } = await import("../services/faceMatcher.service");
    const match = await findBestMatch(faceVector, 0.45);

    if (!match) {
      return res.status(404).json({ error: "Không tìm thấy nhân viên nào trùng khớp khuôn mặt này." });
    }

    const { employeeId, fullName, empCode, branchId, distance } = match;
    const { Attendance } = await import("../../../models/index");

    // 2. Tính toán ngày giờ địa phương (Vietnam)
    const now = new Date();
    const tzOffset = now.getTimezoneOffset() * 60000; // offset in ms
    const localNow = new Date(now.getTime() - tzOffset);
    const todayStr = localNow.toISOString().split("T")[0]; // YYYY-MM-DD

    // 3. Quy định giờ đi muộn (ví dụ: sau 08:30)
    let status: "present" | "late" = "present";
    if (now.getHours() > 8 || (now.getHours() === 8 && now.getMinutes() > 30)) {
      status = "late";
    }

    // 4. Kiểm tra xem hôm nay nhân viên đã check-in chưa
    const existingLog = await Attendance.findOne({
      where: {
        employee_id: employeeId,
        work_date: todayStr
      }
    });

    if (existingLog) {
      // Đã có log check-in -> Thực hiện check-out (yêu cầu cooldown tối thiểu 10 phút)
      const checkInTime = new Date(existingLog.check_in!);
      const diffMins = (now.getTime() - checkInTime.getTime()) / (1000 * 60);

      if (diffMins < 10) {
        return res.json({
          success: true,
          type: "cooldown",
          employee: { employeeId, fullName, empCode },
          time: now.toLocaleTimeString("vi-VN", { hour12: false }),
          message: `Bạn đã check-in thành công trước đó lúc ${checkInTime.toLocaleTimeString("vi-VN", { hour12: false })}. Vui lòng đợi thêm để thực hiện check-out.`
        });
      }

      const hours = (now.getTime() - checkInTime.getTime()) / (1000 * 60 * 60);
      const workingHours = parseFloat(hours.toFixed(2));

      await existingLog.update({
        check_out: now,
        working_hours: workingHours,
        note: `${existingLog.note || ""} | Check-out AI (Độ lệch: ${distance.toFixed(4)})`
      });

      const checkOutTimeStr = now.toLocaleTimeString("vi-VN", { hour12: false });

      return res.json({
        success: true,
        type: "checkout",
        employee: { employeeId, fullName, empCode },
        time: checkOutTimeStr,
        workingHours,
        distance,
        message: `Tạm biệt ${fullName}, ra ca thành công! Số giờ làm: ${workingHours}h`
      });
    } else {
      // Chưa có log -> Thực hiện check-in
      const checkInTimeStr = now.toLocaleTimeString("vi-VN", { hour12: false });
      
      const newAttendance = await Attendance.create({
        branch_id: branchId,
        employee_id: employeeId,
        work_date: todayStr as any,
        check_in: now,
        status,
        note: `Chấm công bằng AI (Độ lệch: ${distance.toFixed(4)})`
      });

      return res.json({
        success: true,
        type: "checkin",
        employee: { employeeId, fullName, empCode },
        time: checkInTimeStr,
        status,
        distance,
        message: `Chào ${fullName}, điểm danh ${status === "late" ? "MUỘN" : "THÀNH CÔNG"} lúc ${checkInTimeStr}!`
      });
    }
  } catch (error: any) {
    console.error("AI check-in error:", error);
    return res.status(500).json({ error: error.message || "Internal server error" });
  }
}

export async function createHolidayBulk(req: Request, res: Response) {
  try {
    const { startDate, endDate, holidayName, branch_id } = req.body;
    if (!startDate || !endDate || !holidayName) {
      return res.status(400).json({ error: "Ngày bắt đầu, Ngày kết thúc và Tên ngày lễ là bắt buộc." });
    }
    const data = await service.createHolidayBulk(startDate, endDate, holidayName, branch_id ? Number(branch_id) : undefined);
    res.json(data);
  } catch (e: unknown) {
    const err = e as Error;
    res.status(400).json({ error: err.message });
  }
}
