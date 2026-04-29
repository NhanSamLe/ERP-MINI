import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "../../../config/db";

export interface OcrFieldMappingAttrs {
  id: number;
  branch_id: number;
  vendor_id?: number | null;
  field_name: string;
  ocr_label: string;
  confidence?: number | null;
  sample_count: number;
  created_at?: Date;
  updated_at?: Date;
}

type OcrFieldMappingCreation = Optional<
  OcrFieldMappingAttrs,
  "id" | "vendor_id" | "confidence"
>;

export class OcrFieldMapping
  extends Model<OcrFieldMappingAttrs, OcrFieldMappingCreation>
  implements OcrFieldMappingAttrs
{
  public id!: number;
  public branch_id!: number;
  public vendor_id?: number | null;
  public field_name!: string;
  public ocr_label!: string;
  public confidence?: number | null;
  public sample_count!: number;
  public created_at?: Date;
  public updated_at?: Date;
}

OcrFieldMapping.init(
  {
    id: { type: DataTypes.BIGINT, autoIncrement: true, primaryKey: true },
    branch_id: { type: DataTypes.BIGINT, allowNull: false },
    vendor_id: { type: DataTypes.BIGINT, allowNull: true },
    field_name: { type: DataTypes.STRING(100), allowNull: false },
    ocr_label: { type: DataTypes.STRING(100), allowNull: false },
    confidence: { type: DataTypes.DECIMAL(5, 4), allowNull: true },
    sample_count: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
  },
  {
    sequelize,
    tableName: "ocr_field_mapping",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
  },
);
