import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "../../../config/db";

export interface InvoiceDocumentAttrs {
  id: number;
  branch_id: number;
  purchase_invoice_id?: number | null;
  original_filename: string;
  file_path: string;
  file_type: "pdf" | "jpg" | "png";
  ocr_status: "pending" | "processing" | "done" | "failed";
  ocr_engine: "openai_vision" | "google_doc_ai";
  ocr_raw_text?: string | null;
  ocr_result?: Record<string, any> | null;
  ocr_confidence?: number | null;
  processing_time_ms?: number | null;
  anomaly_result?: Record<string, any> | null;
  created_by: number;
  created_at?: Date;
  updated_at?: Date;
}

type InvoiceDocumentCreation = Optional<
  InvoiceDocumentAttrs,
  | "id"
  | "purchase_invoice_id"
  | "ocr_raw_text"
  | "ocr_result"
  | "ocr_confidence"
  | "processing_time_ms"
  | "anomaly_result"
>;

export class InvoiceDocument
  extends Model<InvoiceDocumentAttrs, InvoiceDocumentCreation>
  implements InvoiceDocumentAttrs
{
  public id!: number;
  public branch_id!: number;
  public purchase_invoice_id?: number | null;
  public original_filename!: string;
  public file_path!: string;
  public file_type!: "pdf" | "jpg" | "png";
  public ocr_status!: "pending" | "processing" | "done" | "failed";
  public ocr_engine!: "openai_vision" | "google_doc_ai";
  public ocr_raw_text?: string | null;
  public ocr_result?: Record<string, any> | null;
  public ocr_confidence?: number | null;
  public processing_time_ms?: number | null;
  public anomaly_result?: Record<string, any> | null;
  public created_by!: number;
  public created_at?: Date;
  public updated_at?: Date;
}

InvoiceDocument.init(
  {
    id: { type: DataTypes.BIGINT, autoIncrement: true, primaryKey: true },
    branch_id: { type: DataTypes.BIGINT, allowNull: false },
    purchase_invoice_id: { type: DataTypes.BIGINT, allowNull: true },
    original_filename: { type: DataTypes.STRING(255), allowNull: false },
    file_path: { type: DataTypes.STRING(500), allowNull: false },
    file_type: {
      type: DataTypes.ENUM("pdf", "jpg", "png"),
      allowNull: false,
    },
    ocr_status: {
      type: DataTypes.ENUM("pending", "processing", "done", "failed"),
      allowNull: false,
      defaultValue: "pending",
    },
    ocr_engine: {
      type: DataTypes.ENUM("openai_vision", "google_doc_ai"),
      allowNull: false,
    },
    ocr_raw_text: { type: DataTypes.TEXT, allowNull: true },
    ocr_result: { type: DataTypes.JSON, allowNull: true },
    ocr_confidence: { type: DataTypes.DECIMAL(5, 4), allowNull: true },
    processing_time_ms: { type: DataTypes.INTEGER, allowNull: true },
    anomaly_result: { type: DataTypes.JSON, allowNull: true },
    created_by: { type: DataTypes.BIGINT, allowNull: false },
  },
  {
    sequelize,
    tableName: "invoice_documents",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
  },
);
