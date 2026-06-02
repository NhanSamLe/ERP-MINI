import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "../../../config/db";

export interface EmployeeFaceAttrs {
  id: number;
  employee_id: number;
  face_vector: string; // Lưu mảng 128 số thực dạng JSON string
  created_at?: Date;
  updated_at?: Date;
}

type EmployeeFaceCreation = Optional<EmployeeFaceAttrs, "id" | "created_at" | "updated_at">;

export class EmployeeFace
  extends Model<EmployeeFaceAttrs, EmployeeFaceCreation>
  implements EmployeeFaceAttrs
{
  public id!: number;
  public employee_id!: number;
  public face_vector!: string;
  public readonly created_at!: Date;
  public readonly updated_at!: Date;
}

EmployeeFace.init(
  {
    id: {
      type: DataTypes.BIGINT,
      autoIncrement: true,
      primaryKey: true,
    },
    employee_id: {
      type: DataTypes.BIGINT,
      allowNull: false,
    },
    face_vector: {
      type: DataTypes.TEXT("long"),
      allowNull: false,
    },
  },
  {
    sequelize,
    tableName: "employee_faces",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
  }
);
