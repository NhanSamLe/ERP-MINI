import { Branch } from "../../company/models/branch.model";
import { Department } from "../models/department.model";
import { Employee } from "../models/employee.model";
import { Position } from "../models/position.model";

export interface OrgEmployee {
  id: number;
  emp_code: string;
  full_name: string;
  status: string;
}

export interface OrgPosition {
  id: number;
  name: string;
  employees: OrgEmployee[];
}

export interface OrgDepartment {
  id: number;
  code: string;
  name: string;
  positions: OrgPosition[];
}

export interface OrganizationChart {
  branch: {
    id: number;
    code: string;
    name: string;
  };
  departments: OrgDepartment[];
}

class OrganizationService {
  async getOrganizationChart(branchId: number): Promise<OrganizationChart> {
    const branch = await Branch.findByPk(branchId);

    if (!branch) {
      throw new Error("Branch not found");
    }

    // 1. Lấy danh sách phòng ban của chi nhánh
    const departments = await Department.findAll({
      where: { branch_id: branchId },
      attributes: ["id", "code", "name"],
      order: [["name", "ASC"]],
    });

    // 2. Lấy toàn bộ nhân viên của chi nhánh, include Department + Position
    const employees = await Employee.findAll({
      where: { branch_id: branchId },
      include: [
        {
          model: Department,
          as: "department",
          attributes: ["id", "code", "name"],
        },
        {
          model: Position,
          as: "position",
          attributes: ["id", "name"],
        },
      ],
      order: [["full_name", "ASC"]],
    });

    // 3. Build cấu trúc: Department -> Position -> Employees
    const deptMap: Map<number, OrgDepartment> = new Map();

    // Khởi tạo department rỗng
    for (const dept of departments) {
      deptMap.set(dept.id, {
        id: dept.id,
        code: dept.code,
        name: dept.name,
        positions: [],
      });
    }

    // Helper map vị trí theo dept
    const deptPosMap: Map<number, Map<number, OrgPosition>> = new Map();

    for (const empInstance of employees) {
      const emp = empInstance.toJSON() as any;

      const dept = emp.department;
      const pos = emp.position;

      if (!dept) continue; // nhân viên chưa gán phòng ban thì bỏ qua

      const deptId = dept.id as number;

      if (!deptMap.has(deptId)) {
        // fallback nếu phòng ban không nằm trong danh sách ở trên
        deptMap.set(deptId, {
          id: dept.id,
          code: dept.code,
          name: dept.name,
          positions: [],
        });
      }

      if (!deptPosMap.has(deptId)) {
        deptPosMap.set(deptId, new Map<number, OrgPosition>());
      }

      const posMap = deptPosMap.get(deptId)!;

      const posId = pos?.id as number | undefined;

      let posKey = posId ?? 0; // 0 = "Chưa gán chức danh"

      if (!posMap.has(posKey)) {
        posMap.set(posKey, {
          id: posId ?? 0,
          name: pos?.name ?? "Chưa gán chức danh",
          employees: [],
        });
      }

      const orgPos = posMap.get(posKey)!;
      orgPos.employees.push({
        id: emp.id,
        emp_code: emp.emp_code,
        full_name: emp.full_name,
        status: emp.status,
      });
    }

    // Đưa positions vào departments
    for (const [deptId, orgDept] of deptMap.entries()) {
      const posMap = deptPosMap.get(deptId);
      if (posMap) {
        orgDept.positions = Array.from(posMap.values());
      } else {
        orgDept.positions = [];
      }
    }

    return {
      branch: {
        id: branch.id,
        code: branch.code,
        name: branch.name,
      },
      departments: Array.from(deptMap.values()),
    };
  }
}

export const organizationService = new OrganizationService();
