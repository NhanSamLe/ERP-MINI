import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "../../../config/db";

export interface EmailActivityAttrs {
  id: number;
  activity_id: number;
  direction?: "in" | "out" | null;
  email_from?: string | null;
  email_to?: string | null;
  cc?: string | null;
  bcc?: string | null; 
  subject?: string | null;
  html_body?:string | null;
  text_body?:string | null;
  sent_via?: string | null;
  error_message?: string | null;
  status?: string | null;
  message_id?: string | null;
}

type EmailActivityCreation = Optional<EmailActivityAttrs, "id">;

export class EmailActivity
  extends Model<EmailActivityAttrs, EmailActivityCreation>
  implements EmailActivityAttrs
{
  public id!: number;
  public activity_id!: number;

  public direction?: "in" | "out" | null;

  public email_from?: string | null;
  public email_to?: string | null;

  public cc?: string | null;
  public bcc?: string | null;

  public subject?: string | null;

  public html_body?: string | null;
  public text_body?: string | null;

  public status?: string | null;
  public message_id?: string | null;

  public sent_via?: string | null;
  public error_message?: string | null;
}

EmailActivity.init(
  {
    id: { type: DataTypes.BIGINT, autoIncrement: true, primaryKey: true },
    activity_id: { type: DataTypes.BIGINT, allowNull: false },
    direction: { type: DataTypes.ENUM("in", "out") },
    email_from: { type: DataTypes.STRING(255) },
    email_to: { type: DataTypes.STRING(255) },
    cc: { type: DataTypes.TEXT, allowNull: true },
    bcc: { type: DataTypes.TEXT, allowNull: true },
    subject: { type: DataTypes.STRING(255), allowNull: true },

    html_body: { type: DataTypes.TEXT, allowNull: true },
    text_body: { type: DataTypes.TEXT, allowNull: true },
    status: { type: DataTypes.STRING(50) },
    message_id: { type: DataTypes.STRING(255) },
    sent_via: { type: DataTypes.STRING(50), allowNull: true },
    error_message: { type: DataTypes.STRING(255), allowNull: true },
  },
  {
    sequelize,
    tableName: "crm_activity_emails",
    timestamps: false,
  }
);
