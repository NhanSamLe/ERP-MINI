import { Op, where, fn, col } from "sequelize";
import { ApInvoice } from "../../purchase/models/apInvoice.model";
import { Partner } from "../../partner/models/partner.model";

export interface DuplicateCheckResult {
  isDuplicate: boolean;
  existingInvoiceId?: number | undefined;
  existingInvoiceDate?: Date | undefined;
  vendorName?: string | undefined;
  message?: string | undefined;
}

export class DuplicateDetectorService {
  async check(
    invoice_no: string,
    supplier_id: number,
    branch_id: number,
  ): Promise<DuplicateCheckResult> {
    const normalizedInvoiceNo = invoice_no?.trim().toLowerCase() ?? "";

    const existing = await ApInvoice.findOne({
      where: {
        [Op.and]: [
          where(
            fn("LOWER", fn("TRIM", col("invoice_no"))),
            normalizedInvoiceNo,
          ),
          { supplier_id },
          { branch_id },
          { status: { [Op.ne]: "cancelled" } },
        ],
      },
    });

    if (!existing) {
      return { isDuplicate: false };
    }

    let vendorName: string | undefined;
    if (existing.supplier_id) {
      const supplier = await Partner.findByPk(existing.supplier_id);
      vendorName = supplier?.name;
    }

    return {
      isDuplicate: true,
      existingInvoiceId: existing.id,
      existingInvoiceDate: existing.invoice_date,
      vendorName,
      message: "Hóa đơn đã tồn tại trong hệ thống",
    };
  }
}
