import { Branch } from "../../company/models/branch.model";
import { Department } from "./department.model";
import { Position } from "./position.model";
import { Employee } from "./employee.model";

// Branch 1 - n Department
Branch.hasMany(Department, { foreignKey: "branch_id", as: "departments" });
Department.belongsTo(Branch, { foreignKey: "branch_id", as: "branch" });

// Branch 1 - n Position
Branch.hasMany(Position, { foreignKey: "branch_id", as: "positions" });
Position.belongsTo(Branch, { foreignKey: "branch_id", as: "branch" });

// Branch 1 - n Employee
Branch.hasMany(Employee, { foreignKey: "branch_id", as: "employees" });
Employee.belongsTo(Branch, { foreignKey: "branch_id", as: "branch" });

// Department 1 - n Employee
Department.hasMany(Employee, { foreignKey: "department_id", as: "employees" });
Employee.belongsTo(Department, { foreignKey: "department_id", as: "department" });

// Position 1 - n Employee
Position.hasMany(Employee, { foreignKey: "position_id", as: "employees" });
Employee.belongsTo(Position, { foreignKey: "position_id", as: "position" });
