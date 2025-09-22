import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "../../../config/db";

export interface GlEntryAttrs {
  id: number;
  journal_id: number;
  entry_no: string;
  entry_date: Date;
  reference_type?: string;
  reference_id?: number;
  memo?: string;
  status: "draft" | "posted";
}

type GlEntryCreation = Optional<GlEntryAttrs, "id" | "reference_type" | "reference_id" | "memo">;

export class GlEntry extends Model<GlEntryAttrs, GlEntryCreation> implements GlEntryAttrs {
  public id!: number;
  public journal_id!: number;
  public entry_no!: string;
  public entry_date!: Date;
  public reference_type?: string;
  public reference_id?: number;
  public memo?: string;
  public status!: "draft" | "posted";
}

GlEntry.init(
  {
    id: { type: DataTypes.BIGINT, autoIncrement: true, primaryKey: true },
    journal_id: { type: DataTypes.BIGINT, allowNull: false },
    entry_no: { type: DataTypes.STRING(50), allowNull: false, unique: true },
    entry_date: { type: DataTypes.DATE, allowNull: false },
    reference_type: { type: DataTypes.STRING(50) },
    reference_id: { type: DataTypes.BIGINT },
    memo: { type: DataTypes.TEXT },
    status: { type: DataTypes.ENUM("draft", "posted"), defaultValue: "draft" },
  },
  { sequelize, tableName: "gl_entries", timestamps: true, createdAt: "created_at", updatedAt: "updated_at" }
);
