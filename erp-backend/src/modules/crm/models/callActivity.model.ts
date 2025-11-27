import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "../../../config/db";

export interface CallActivityAttrs {
  id: number;
  activity_id: number;
  duration?: number | null;
  call_from?: string | null;
  call_to?: string | null;
  result?: 
    | "no_answer"
    | "busy"
    | "connected"
    | "failed"
    | "call_back"
    | "wrong_number"
    | null;
  recording_url?: string | null;
  is_inbound?: boolean | null;
}

type CallActivityCreation = Optional<CallActivityAttrs, "id">;

export class CallActivity
  extends Model<CallActivityAttrs, CallActivityCreation>
  implements CallActivityAttrs
{
  public id!: number;
  public activity_id!: number;
  public duration?: number | null;
  public call_from?: string | null;
  public call_to?: string | null;
  public result?: | "no_answer"
    | "busy"
    | "connected"
    | "failed"
    | "call_back"
    | "wrong_number"
    | null;
  public recording_url?: string | null;
  public  is_inbound?: boolean | null;
}

CallActivity.init(
  {
    id: { type: DataTypes.BIGINT, autoIncrement: true, primaryKey: true },
    activity_id: { type: DataTypes.BIGINT, allowNull: false },
    duration: { type: DataTypes.INTEGER },
    call_from: { type: DataTypes.STRING(100) },
    call_to: { type: DataTypes.STRING(100) },
    result: {
      type: DataTypes.ENUM(
        "no_answer",
        "busy",
        "connected",
        "failed",
        "call_back",
        "wrong_number"
      ),
      allowNull: true,
    },
    recording_url: { type: DataTypes.STRING(255) },
    is_inbound: {type:DataTypes.BOOLEAN}
  },
  {
    sequelize,
    tableName: "crm_activity_calls",
    timestamps: false,
  }
);
