import { ITool, ToolContext, ToolResult } from "../types/llm.types";
import { Op } from "sequelize";

export const hrmExtraTools: ITool[] = [
  {
    name: "get_employees",
    description:
      "Lấy danh sách nhân viên. Dùng khi hỏi về nhân viên, danh sách nhân sự, tìm nhân viên theo tên hoặc phòng ban.",
    parameters: {
      type: "object",
      properties: {
        name: {
          type: "string",
          description: "Tên nhân viên cần tìm (tùy chọn)",
        },
        department_name: {
          type: "string",
          description: "Tên phòng ban (tùy chọn)",
        },
        status: {
          type: "string",
          enum: ["active", "inactive"],
          description: "Trạng thái nhân viên (tùy chọn)",
        },
      },
    },
    async execute(args: any, context: ToolContext): Promise<ToolResult> {
      try {
        const { Employee } = await import("../../hrm/models/employee.model");
        const { Department } =
          await import("../../hrm/models/department.model");

        const where: any = { branch_id: context.branchId };
        if (args.name) where.full_name = { [Op.like]: `%${args.name}%` };
        if (args.status) where.status = args.status;

        const deptWhere: any = {};
        if (args.department_name)
          deptWhere.name = { [Op.like]: `%${args.department_name}%` };

        const data = await Employee.findAll({
          where,
          include: [
            {
              model: Department,
              as: "department",
              where: Object.keys(deptWhere).length ? deptWhere : undefined,
              attributes: ["id", "name"],
              required: !!args.department_name,
            },
          ],
          attributes: [
            "id",
            "full_name",
            "email",
            "phone",
            "position",
            "status",
          ],
          order: [["full_name", "ASC"]],
          limit: 50,
        });

        return { success: true, data: { total: data.length, employees: data } };
      } catch (err: any) {
        return { success: false, error: err.message };
      }
    },
  },
];
