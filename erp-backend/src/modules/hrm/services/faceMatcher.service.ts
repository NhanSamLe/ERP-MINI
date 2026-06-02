import { Employee, EmployeeFace } from "../../../models";

export function calculateEuclideanDistance(vectorA: number[], vectorB: number[]): number {
  if (vectorA.length !== vectorB.length) {
    throw new Error("Độ dài hai vector không khớp.");
  }
  
  let sum = 0;
  for (let i = 0; i < vectorA.length; i++) {
    const valA = vectorA[i] ?? 0;
    const valB = vectorB[i] ?? 0;
    sum += Math.pow(valA - valB, 2);
  }
  return Math.sqrt(sum);
}

export async function findBestMatch(inputVector: number[], threshold: number = 0.45): Promise<{
  employeeId: number;
  fullName: string;
  empCode: string;
  branchId: number;
  distance: number;
} | null> {
  // Lấy danh sách tất cả khuôn mặt nhân viên đang hoạt động
  const faces = await EmployeeFace.findAll({
    include: [
      {
        model: Employee,
        as: "employee",
        where: { status: "active" },
        attributes: ["id", "full_name", "emp_code", "branch_id"]
      }
    ]
  });

  let bestMatch: {
    employeeId: number;
    fullName: string;
    empCode: string;
    branchId: number;
    distance: number;
  } | null = null;

  let minDistance = Infinity;

  for (const face of faces) {
    try {
      const dbVector: number[] = JSON.parse(face.face_vector);
      const distance = calculateEuclideanDistance(inputVector, dbVector);

      if (distance < minDistance) {
        minDistance = distance;
        
        // Chỉ chấp nhận nếu khoảng cách nhỏ hơn ngưỡng threshold
        if (distance < threshold) {
          const emp = (face as any).employee;
          if (emp) {
            bestMatch = {
              employeeId: Number(emp.id),
              fullName: emp.full_name,
              empCode: emp.emp_code,
              branchId: Number(emp.branch_id),
              distance: distance
            };
          }
        }
      }
    } catch (e) {
      console.error(`Lỗi phân tích vector của khuôn mặt ID ${face.id}:`, e);
    }
  }

  return bestMatch;
}
