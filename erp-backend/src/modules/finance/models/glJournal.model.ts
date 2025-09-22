import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "../../../config/db";

export interface GlJournalAttrs {
  id: number;
  code: string;
  name: string;
}

type GlJournalCreation = Optional<GlJournalAttrs, "id">;

export class GlJournal extends Model<GlJournalAttrs, GlJournalCreation> implements GlJournalAttrs {
  public id!: number;
  public code!: string;
  public name!: string;
}

GlJournal.init(
  {
    id: { type: DataTypes.BIGINT, autoIncrement: true, primaryKey: true },
    code: { type: DataTypes.STRING(20), allowNull: false, unique: true },
    name: { type: DataTypes.STRING(100), allowNull: false },
  },
  { sequelize, tableName: "gl_journals", timestamps: true, createdAt: "created_at", updatedAt: "updated_at" }
);
