import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "../../../config/db";

export interface AccountMappingAttrs {
  id: number;
  branch_id: number;
  mapping_key: string;
  account_id: number;
  description?: string | null;
}

type AccountMappingCreation = Optional<AccountMappingAttrs, "id" | "description">;

export class AccountMapping
  extends Model<AccountMappingAttrs, AccountMappingCreation>
  implements AccountMappingAttrs
{
  public id!: number;
  public branch_id!: number;
  public mapping_key!: string;
  public account_id!: number;
  public description!: string | null;
}

AccountMapping.init(
  {
    id: { type: DataTypes.BIGINT, autoIncrement: true, primaryKey: true },
    branch_id: { type: DataTypes.BIGINT, allowNull: false },
    mapping_key: { type: DataTypes.STRING(100), allowNull: false },
    account_id: { type: DataTypes.BIGINT, allowNull: false },
    description: { type: DataTypes.STRING(255), allowNull: true },
  },
  {
    sequelize,
    tableName: "account_mappings",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
  }
);
