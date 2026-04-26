import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "../../../config/db";

export type MessageRole = "user" | "assistant" | "tool";

export interface MessageAttributes {
  id: number;
  conversation_id: number;
  role: MessageRole;
  content: string;
  tool_name?: string | null;
  tool_call_id?: string | null;
  created_at?: Date;
}

type MessageCreation = Optional<
  MessageAttributes,
  "id" | "tool_name" | "tool_call_id"
>;

export class ChatMessage
  extends Model<MessageAttributes, MessageCreation>
  implements MessageAttributes
{
  public id!: number;
  public conversation_id!: number;
  public role!: MessageRole;
  public content!: string;
  public tool_name?: string | null;
  public tool_call_id?: string | null;
  public created_at?: Date;
}

ChatMessage.init(
  {
    id: { type: DataTypes.BIGINT, autoIncrement: true, primaryKey: true },
    conversation_id: { type: DataTypes.BIGINT, allowNull: false },
    role: {
      type: DataTypes.ENUM("user", "assistant", "tool"),
      allowNull: false,
    },
    content: { type: DataTypes.TEXT, allowNull: false },
    tool_name: { type: DataTypes.STRING(100), allowNull: true },
    tool_call_id: { type: DataTypes.STRING(100), allowNull: true },
  },
  {
    sequelize,
    tableName: "chat_messages",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: false,
  },
);
