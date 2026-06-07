import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "../../../config/db";

export interface GlJournalAttrs {
  id: number;
  company_id?: number | null;
  code: string;
  name: string;
}

type GlJournalCreation = Optional<GlJournalAttrs, "id" | "company_id">;

export class GlJournal extends Model<GlJournalAttrs, GlJournalCreation> implements GlJournalAttrs {
  public id!: number;
  public company_id?: number | null;
  public code!: string;
  public name!: string;
}

GlJournal.init(
  {
    id: { type: DataTypes.BIGINT, autoIncrement: true, primaryKey: true },
    company_id: { type: DataTypes.BIGINT, allowNull: true },
    code: { type: DataTypes.STRING(20), allowNull: false, unique: true },
    name: { type: DataTypes.STRING(100), allowNull: false },
  },
  { sequelize, tableName: "gl_journals", timestamps: true, createdAt: "created_at", updatedAt: "updated_at" }
);
