import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "../../../config/db";

export interface DocumentSignatureAttrs {
  id: number;
  document_type: "purchase_order" | "ap_invoice" | "ap_payment";
  document_id: number;
  signer_id: number;
  signature_image: string; // Chuỗi Base64 hoặc link Cloudinary của nét vẽ chữ ký tay
  hash_value: string;      // SHA-256 hash của tài liệu
  signer_ip?: string;      // IP của người ký phục vụ việc đối soát bảo mật
  signed_at: Date;
}

type DocumentSignatureCreation = Optional<DocumentSignatureAttrs, "id" | "signed_at">;

export class DocumentSignature
  extends Model<DocumentSignatureAttrs, DocumentSignatureCreation>
  implements DocumentSignatureAttrs
{
  public id!: number;
  public document_type!: "purchase_order" | "ap_invoice" | "ap_payment";
  public document_id!: number;
  public signer_id!: number;
  public signature_image!: string;
  public hash_value!: string;
  public signer_ip?: string;
  public signed_at!: Date;
}

DocumentSignature.init(
  {
    id: { type: DataTypes.BIGINT, autoIncrement: true, primaryKey: true },
    document_type: {
      type: DataTypes.ENUM("purchase_order", "ap_invoice", "ap_payment"),
      allowNull: false,
    },
    document_id: { type: DataTypes.BIGINT, allowNull: false },
    signer_id: { type: DataTypes.BIGINT, allowNull: false },
    signature_image: { type: DataTypes.TEXT, allowNull: false },
    hash_value: { type: DataTypes.STRING(255), allowNull: false },
    signer_ip: { type: DataTypes.STRING(45), allowNull: true },
    signed_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
  },
  {
    sequelize,
    tableName: "document_signatures",
    timestamps: false,
  },
);
