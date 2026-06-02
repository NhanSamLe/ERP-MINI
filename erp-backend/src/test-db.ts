import { connectDB, sequelize } from "./config/db";
import { EmployeeFace, Attendance } from "./models";

async function main() {
  console.log("=== DB CLEANUP ===");
  await connectDB();

  const testEmployeeId = 1;
  const now = new Date();
  const tzOffset = now.getTimezoneOffset() * 60000;
  const localNow = new Date(now.getTime() - tzOffset);
  const todayStr = localNow.toISOString().split("T")[0];

  try {
    // 1. Delete registered face for test employee
    const facesDeleted = await EmployeeFace.destroy({ where: { employee_id: testEmployeeId } });
    console.log(`Deleted ${facesDeleted} mock face record(s) for employee ID ${testEmployeeId}`);

    // 2. Delete attendance record for today
    const attDeleted = await Attendance.destroy({
      where: {
        employee_id: testEmployeeId,
        work_date: todayStr
      }
    });
    console.log(`Deleted ${attDeleted} attendance record(s) for today (${todayStr})`);

    console.log("✅ Cleanup successful.");
  } catch (err) {
    console.error("❌ Cleanup failed:", err);
  } finally {
    await sequelize.close();
    console.log("DB connection closed.");
  }
}

main();
