import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "../../../config/db";

export type PhysicalInventoryStatus =
  | "draft"
  | "in_progress"
  | "validated"
  | "cancelled";

export interface PhysicalInventoryAttrs {
  id: number;
  inv_no: string;
  warehouse_id: number;
  branch_id: number;
  inv_date: string; // DATEONLY → 'YYYY-MM-DD'
  status: PhysicalInventoryStatus;
  created_by: number;
  validated_by?: number | null;
  validated_at?: Date | null;
}

type PhysicalInventoryCreation = Optional<
  PhysicalInventoryAttrs,
  "id" | "status" | "validated_by" | "validated_at"
>;

export class PhysicalInventory
  extends Model<PhysicalInventoryAttrs, PhysicalInventoryCreation>
  implements PhysicalInventoryAttrs
{
  public id!: number;
  public inv_no!: string;
  public warehouse_id!: number;
  public branch_id!: number;
  public inv_date!: string;
  public status!: PhysicalInventoryStatus;
  public created_by!: number;
  public validated_by?: number | null;
  public validated_at?: Date | null;
}

PhysicalInventory.init(
  {
    id: { type: DataTypes.BIGINT, autoIncrement: true, primaryKey: true },
    inv_no: { type: DataTypes.STRING(50), allowNull: false, unique: true },
    warehouse_id: { type: DataTypes.BIGINT, allowNull: false },
    branch_id: { type: DataTypes.BIGINT, allowNull: false },
    inv_date: { type: DataTypes.DATEONLY, allowNull: false },
    status: {
      type: DataTypes.ENUM("draft", "in_progress", "validated", "cancelled"),
      allowNull: false,
      defaultValue: "draft",
    },
    created_by: { type: DataTypes.BIGINT, allowNull: false },
    validated_by: { type: DataTypes.BIGINT, allowNull: true },
    validated_at: { type: DataTypes.DATE, allowNull: true },
  },
  {
    sequelize,
    tableName: "physical_inventories",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
  },
);
