import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "../../../config/db";

export interface ConversationAttributes {
  id: number;
  user_id: number;
  branch_id: number;
  title?: string | null;
  is_active: boolean;
  created_at?: Date;
  updated_at?: Date;
}

type ConversationCreation = Optional<
  ConversationAttributes,
  "id" | "title" | "is_active"
>;

export class Conversation
  extends Model<ConversationAttributes, ConversationCreation>
  implements ConversationAttributes
{
  public id!: number;
  public user_id!: number;
  public branch_id!: number;
  public title?: string | null;
  public is_active!: boolean;
  public created_at?: Date;
  public updated_at?: Date;
}

Conversation.init(
  {
    id: { type: DataTypes.BIGINT, autoIncrement: true, primaryKey: true },
    user_id: { type: DataTypes.BIGINT, allowNull: false },
    branch_id: { type: DataTypes.BIGINT, allowNull: false },
    title: { type: DataTypes.STRING(255), allowNull: true },
    is_active: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
  },
  {
    sequelize,
    tableName: "chat_conversations",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
  },
);
