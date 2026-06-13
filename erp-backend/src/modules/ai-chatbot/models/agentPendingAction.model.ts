import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "../../../config/db";

export type PendingActionStatus =
  | "pending"
  | "confirmed"
  | "cancelled"
  | "executed";

export interface AgentPendingActionAttributes {
  id: number;
  conversation_id: number;
  tool_name: string;
  tool_args: string; // JSON stringified
  description: string; // Mô tả thân thiện cho user: "Tạo PO Lavie 100 thùng..."
  status: PendingActionStatus;
  expires_at: Date;
  created_at?: Date;
}

type AgentPendingActionCreation = Optional<
  AgentPendingActionAttributes,
  "id" | "status"
>;

export class AgentPendingAction
  extends Model<AgentPendingActionAttributes, AgentPendingActionCreation>
  implements AgentPendingActionAttributes
{
  public id!: number;
  public conversation_id!: number;
  public tool_name!: string;
  public tool_args!: string;
  public description!: string;
  public status!: PendingActionStatus;
  public expires_at!: Date;
  public created_at?: Date;

  /** Parse tool_args JSON */
  getParsedArgs(): Record<string, any> {
    try {
      return JSON.parse(this.tool_args);
    } catch {
      return {};
    }
  }

  /** Kiểm tra đã hết hạn chưa */
  isExpired(): boolean {
    return new Date() > this.expires_at;
  }
}

AgentPendingAction.init(
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    conversation_id: { type: DataTypes.BIGINT, allowNull: false },
    tool_name: { type: DataTypes.STRING(100), allowNull: false },
    tool_args: { type: DataTypes.TEXT, allowNull: false },
    description: { type: DataTypes.TEXT, allowNull: false },
    status: {
      type: DataTypes.ENUM("pending", "confirmed", "cancelled", "executed"),
      allowNull: false,
      defaultValue: "pending",
    },
    expires_at: { type: DataTypes.DATE, allowNull: false },
  },
  {
    sequelize,
    tableName: "agent_pending_actions",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: false,
  },
);
