import { ITool, ToolContext, ToolResult } from "../types/llm.types";
import { callErpApi, callErpApiWrite } from "./tool.helper";

// ─── Marker để chat.service biết đây là write tool cần xác nhận ──────────────
export const WRITE_TOOLS = new Set([
  "create_purchase_order",
  "submit_po_for_approval",
  "create_rfq",
]);

export const purchaseTools: ITool[] = [
  {
    name: "get_purchase_orders",
    description:
      "Truy vấn danh sách đơn mua hàng. Dùng khi hỏi về đơn mua, đơn đặt hàng nhà cung cấp.",
    parameters: {
      type: "object",
      properties: {
        status: {
          type: "string",
          enum: [
            "draft",
            "waiting_approval",
            "confirmed",
            "sent",
            "supplier_accepted",
            "partially_received",
            "received",
            "completed",
            "cancelled",
          ],
          description: "Trạng thái đơn mua (tùy chọn)",
        },
        supplier_name: {
          type: "string",
          description: "Tên nhà cung cấp (tùy chọn)",
        },
        from_date: {
          type: "string",
          description: "Ngày bắt đầu YYYY-MM-DD (tùy chọn)",
        },
        to_date: {
          type: "string",
          description: "Ngày kết thúc YYYY-MM-DD (tùy chọn)",
        },
      },
    },
    async execute(args: any, context: ToolContext): Promise<ToolResult> {
      return callErpApi(
        "/purchase-order",
        {
          ...(args.status && { status: args.status }),
          ...(args.supplier_name && { supplierName: args.supplier_name }),
          ...(args.from_date && { from: args.from_date }),
          ...(args.to_date && { to: args.to_date }),
        },
        context,
      );
    },
  },

  {
    name: "get_payables",
    description:
      "Xem công nợ phải trả nhà cung cấp. Dùng khi hỏi về nợ phải trả, hóa đơn chưa thanh toán, công nợ NCC.",
    parameters: {
      type: "object",
      properties: {
        supplier_name: {
          type: "string",
          description: "Tên nhà cung cấp (tùy chọn)",
        },
        overdue_only: {
          type: "boolean",
          description: "Chỉ lấy hóa đơn quá hạn (mặc định false)",
          default: false,
        },
      },
    },
    async execute(args: any, context: ToolContext): Promise<ToolResult> {
      return callErpApi(
        "/ap/invoices",
        {
          status: "posted",
          ...(args.supplier_name && { supplierName: args.supplier_name }),
          ...(args.overdue_only && { overdueOnly: true }),
        },
        context,
      );
    },
  },

  {
    name: "get_purchase_returns",
    description:
      "Truy vấn danh sách đơn trả hàng mua (Purchase Returns). Dùng khi hỏi về phiếu trả hàng cho nhà cung cấp.",
    parameters: {
      type: "object",
      properties: {
        status: {
          type: "string",
          enum: ["draft", "shipping", "confirmed", "completed", "cancelled"],
          description: "Trạng thái phiếu trả hàng (tùy chọn)",
        },
        supplier_name: {
          type: "string",
          description: "Tên nhà cung cấp (tùy chọn)",
        },
      },
    },
    async execute(args: any, context: ToolContext): Promise<ToolResult> {
      return callErpApi(
        "/purchase/returns",
        {
          ...(args.status && { status: args.status }),
          ...(args.supplier_name && { supplierName: args.supplier_name }),
        },
        context,
      );
    },
  },

  {
    name: "get_debit_notes",
    description:
      "Truy vấn danh sách Thẻ nợ / Ghi chú nợ (Debit Notes). Dùng khi hỏi về chứng từ giảm công nợ phải trả cho nhà cung cấp.",
    parameters: {
      type: "object",
      properties: {
        status: {
          type: "string",
          enum: ["draft", "posted", "cancelled"],
          description: "Trạng thái thẻ nợ (tùy chọn)",
        },
        supplier_name: {
          type: "string",
          description: "Tên nhà cung cấp (tùy chọn)",
        },
      },
    },
    async execute(args: any, context: ToolContext): Promise<ToolResult> {
      return callErpApi(
        "/purchase/debit-notes",
        {
          ...(args.status && { status: args.status }),
          ...(args.supplier_name && { supplierName: args.supplier_name }),
        },
        context,
      );
    },
  },

  {
    name: "get_vendor_refunds",
    description:
      "Truy vấn danh sách Phiếu hoàn tiền nhà cung cấp (Vendor Refunds). Dùng khi hỏi về tiền nhận lại từ nhà cung cấp sau khi trả hàng.",
    parameters: {
      type: "object",
      properties: {
        status: {
          type: "string",
          enum: ["draft", "posted"],
          description: "Trạng thái phiếu hoàn tiền (tùy chọn)",
        },
        supplier_name: {
          type: "string",
          description: "Tên nhà cung cấp (tùy chọn)",
        },
      },
    },
    async execute(args: any, context: ToolContext): Promise<ToolResult> {
      return callErpApi(
        "/purchase/vendor-refunds",
        {
          ...(args.status && { status: args.status }),
          ...(args.supplier_name && { supplierName: args.supplier_name }),
        },
        context,
      );
    },
  },

  {
    name: "get_purchase_return_authorizations",
    description:
      "Truy vấn danh sách Yêu cầu trả hàng mua (Purchase Return Authorizations - PRA). Dùng khi hỏi về yêu cầu/thỏa thuận trả hàng.",
    parameters: {
      type: "object",
      properties: {
        status: {
          type: "string",
          enum: ["draft", "waiting_approval", "approved", "rejected"],
          description: "Trạng thái yêu cầu trả hàng (tùy chọn)",
        },
        supplier_name: {
          type: "string",
          description: "Tên nhà cung cấp (tùy chọn)",
        },
      },
    },
    async execute(args: any, context: ToolContext): Promise<ToolResult> {
      return callErpApi(
        "/purchase/return-authorizations",
        {
          ...(args.status && { status: args.status }),
          ...(args.supplier_name && { supplierName: args.supplier_name }),
        },
        context,
      );
    },
  },

  {
    name: "get_ap_payments",
    description:
      "Truy vấn danh sách Phiếu chi / Phiếu thanh toán cho nhà cung cấp (AP Payments). Dùng khi hỏi về lịch sử chi tiền, thanh toán công nợ nhà cung cấp.",
    parameters: {
      type: "object",
      properties: {
        supplier_name: {
          type: "string",
          description: "Tên nhà cung cấp (tùy chọn)",
        },
      },
    },
    async execute(args: any, context: ToolContext): Promise<ToolResult> {
      return callErpApi(
        "/ap/payments",
        {
          ...(args.supplier_name && { supplierName: args.supplier_name }),
        },
        context,
      );
    },
  },

  {
    name: "get_ap_invoices",
    description:
      "Xem danh sách hóa đơn mua hàng / hóa đơn phải trả (AP Invoices). Dùng khi hỏi về hóa đơn mua, hóa đơn từ OCR, hóa đơn nhà cung cấp, hoặc số lượng hóa đơn tạo từ OCR.",
    parameters: {
      type: "object",
      properties: {
        status: {
          type: "string",
          enum: ["draft", "posted", "paid", "cancelled"],
          description: "Trạng thái hóa đơn (tùy chọn)",
        },
        approval_status: {
          type: "string",
          enum: ["draft", "waiting_approval", "approved", "rejected"],
          description: "Trạng thái phê duyệt (tùy chọn)",
        },
        source: {
          type: "string",
          enum: ["manual", "ai_ocr"],
          description: "Nguồn tạo hóa đơn: manual hoặc ai_ocr (tùy chọn)",
        },
        supplier_name: {
          type: "string",
          description: "Tên nhà cung cấp (tùy chọn)",
        },
      },
    },
    async execute(args: any, context: ToolContext): Promise<ToolResult> {
      return callErpApi(
        "/ap/invoices",
        {
          ...(args.status && { status: args.status }),
          ...(args.approval_status && {
            approval_status: args.approval_status,
          }),
          ...(args.source && { source: args.source }),
          ...(args.supplier_name && { supplierName: args.supplier_name }),
        },
        context,
      );
    },
  },
];

// ─── WRITE TOOLS (yêu cầu xác nhận trước khi thực thi) ────────────────────────

const writePurchaseTools: ITool[] = [
  {
    name: "find_best_supplier_price",
    description:
      "Tìm nhà cung cấp có giá tốt nhất cho sản phẩm dựa trên bảng giá hiện tại. " +
      "Dùng trước khi tạo PO để đề xuất NCC và giá tối ưu. " +
      "Có thể tìm bằng tên sản phẩm (product_name) hoặc ID (product_id). " +
      "Ưu tiên dùng tên nếu user cung cấp tên.",
    parameters: {
      type: "object",
      properties: {
        product_name: {
          type: "string",
          description: "Tên sản phẩm cần tìm giá (tùy chọn)",
        },
        product_id: {
          type: "number",
          description: "ID sản phẩm (tùy chọn, ưu tiên hơn product_name)",
        },
        quantity: {
          type: "number",
          description: "Số lượng cần mua (ảnh hưởng giá bậc thang)",
        },
      },
    },
    async execute(args: any, context: ToolContext): Promise<ToolResult> {
      return callErpApi(
        "/purchase/price-lists/best-price",
        {
          ...(args.product_id && { product_id: args.product_id }),
          ...(args.product_name && { product_name: args.product_name }),
          ...(args.quantity && { quantity: args.quantity }),
        },
        context,
      );
    },
  },

  {
    name: "get_product_price_suggestions",
    description:
      "Lấy gợi ý giá mua cho một sản phẩm từ tất cả nguồn: " +
      "(1) Bảng giá mua (purchase_price_list) — có min_quantity và discount, " +
      "(2) Thông tin NCC của sản phẩm (product_supplier_info) — giá mặc định theo NCC. " +
      "QUAN TRỌNG: Gọi tool này TRƯỚC khi tạo PO để hiển thị đầy đủ thông tin giá cho user. " +
      "Nếu user không cung cấp đơn giá cụ thể, hãy dùng kết quả từ tool này để điền vào PO.",
    parameters: {
      type: "object",
      required: ["product_id"],
      properties: {
        product_id: {
          type: "number",
          description: "ID sản phẩm cần tra giá",
        },
        supplier_id: {
          type: "number",
          description: "ID nhà cung cấp (tùy chọn, để lọc giá theo NCC)",
        },
        quantity: {
          type: "number",
          description: "Số lượng cần mua (để áp dụng giá bậc thang đúng)",
        },
      },
    },
    async execute(args: any, _context: ToolContext): Promise<ToolResult> {
      try {
        const { ProductSupplierInfo } =
          await import("../../product/models/productSupplierInfo.model");
        const { purchasePriceListService } =
          await import("../../purchase/services/purchasePriceList.service");
        const { Partner } = await import("../../partner/models/partner.model");
        const { Op } = await import("sequelize");

        const productId = Number(args.product_id);
        const supplierId = args.supplier_id ? Number(args.supplier_id) : null;
        const quantity = Number(args.quantity ?? 1);

        const results: Array<{
          source: string;
          supplier_id: number | null;
          supplier_name: string | null;
          unit_price: number;
          min_quantity: number;
          discount_percent: number;
          lead_time_days: number | null;
          is_preferred?: boolean;
        }> = [];

        // ── Nguồn 1: product_supplier_info ──────────────────────────────
        const supplierInfoWhere: any = { product_id: productId };
        if (supplierId) supplierInfoWhere.supplier_id = supplierId;

        const supplierInfos = await ProductSupplierInfo.findAll({
          where: supplierInfoWhere,
          include: [
            {
              model: Partner,
              as: "supplier",
              attributes: ["id", "name"],
            },
          ],
          order: [["is_preferred", "DESC"]],
        });

        for (const si of supplierInfos) {
          if (si.price) {
            results.push({
              source: "Thông tin NCC sản phẩm",
              supplier_id: si.supplier_id,
              supplier_name: (si as any).supplier?.name ?? null,
              unit_price: Number(si.price),
              min_quantity: Number(si.min_order_qty ?? 1),
              discount_percent: 0,
              lead_time_days: si.lead_time_days ?? null,
              is_preferred: si.is_preferred,
            });
          }
        }

        // ── Nguồn 2: purchase_price_list_items ───────────────────────────
        const today = new Date().toISOString().split("T")[0]!;
        const { PurchasePriceList } =
          await import("../../purchase/models/purchasePriceList.model");
        const { PurchasePriceListItem } =
          await import("../../purchase/models/purchasePriceListItem.model");

        const plWhere: any = {
          is_active: 1,
          [Op.and]: [
            {
              [Op.or]: [
                { start_date: null },
                { start_date: { [Op.lte]: today } },
              ],
            },
            {
              [Op.or]: [{ end_date: null }, { end_date: { [Op.gte]: today } }],
            },
          ],
        };
        if (supplierId) {
          plWhere[Op.or] = [{ supplier_id: supplierId }, { supplier_id: null }];
        }

        const priceLists = await PurchasePriceList.findAll({
          where: plWhere,
          attributes: ["id", "name", "supplier_id"],
          include: [
            { model: Partner, as: "supplier", attributes: ["id", "name"] },
          ],
        });

        if (priceLists.length > 0) {
          const plIds = priceLists.map((p) => p.id);
          const items = await PurchasePriceListItem.findAll({
            where: {
              product_id: productId,
              price_list_id: { [Op.in]: plIds },
              [Op.and]: [
                {
                  [Op.or]: [
                    { start_date: null },
                    { start_date: { [Op.lte]: today } },
                  ],
                },
                {
                  [Op.or]: [
                    { end_date: null },
                    { end_date: { [Op.gte]: today } },
                  ],
                },
              ],
            },
            order: [["min_quantity", "DESC"]],
          });

          for (const item of items) {
            const pl = priceLists.find((p) => p.id === item.price_list_id);
            const plSupplier = (pl as any)?.supplier;
            results.push({
              source: `Bảng giá: ${pl?.name ?? "—"}`,
              supplier_id: item.supplier_id ?? pl?.supplier_id ?? null,
              supplier_name: plSupplier?.name ?? null,
              unit_price: Number(item.unit_price),
              min_quantity: Number(item.min_quantity),
              discount_percent: Number(item.discount_percent),
              lead_time_days: item.lead_time_days ?? null,
            });
          }
        }

        if (results.length === 0) {
          return {
            success: true,
            data: {
              message:
                "Không có thông tin giá trong hệ thống cho sản phẩm này.",
              suggestions: [],
            },
          };
        }

        // Sắp xếp: giá thấp nhất lên đầu
        results.sort((a, b) => a.unit_price - b.unit_price);

        return { success: true, data: { suggestions: results } };
      } catch (err: any) {
        return { success: false, error: err.message };
      }
    },
  },

  {
    name: "create_purchase_order",
    description:
      "⚠️ WRITE OPERATION — Tạo đơn mua hàng mới (draft). " +
      "Tool này yêu cầu xác nhận từ user trước khi thực thi. " +
      "QUAN TRỌNG: Người dùng chỉ cung cấp tên, KHÔNG biết ID. " +
      "Trước khi gọi tool này, BẮT BUỘC phải: " +
      "(1) Dùng get_partners hoặc get_suppliers để tìm supplier_id từ tên nhà cung cấp. " +
      "(2) Dùng get_products để tìm product_id từ tên sản phẩm. " +
      "(3) Dùng get_product_price_suggestions để lấy giá đề xuất từ bảng giá/NCC nếu user không cung cấp đơn giá cụ thể. " +
      "Không được tự đoán ID hay giá — phải lookup từ các tool trước.",
    parameters: {
      type: "object",
      required: ["supplier_id", "lines"],
      properties: {
        supplier_id: {
          type: "number",
          description: "ID nhà cung cấp — phải lấy từ get_partners trước",
        },
        supplier_name: {
          type: "string",
          description:
            "Tên nhà cung cấp — điền vào để hiển thị cho user khi xác nhận",
        },
        description: {
          type: "string",
          description: "Ghi chú đơn hàng",
        },
        payment_term_id: {
          type: "number",
          description: "ID điều khoản thanh toán (tùy chọn) — tra cứu từ get_payment_terms",
        },
        payment_term_name: {
          type: "string",
          description: "Tên điều khoản thanh toán (tùy chọn) — dùng để hiển thị",
        },
        discount_percent: {
          type: "number",
          description: "Tỷ lệ chiết khấu tổng đơn (%) (tùy chọn)",
        },
        discount_amount: {
          type: "number",
          description: "Số tiền chiết khấu tổng đơn (tùy chọn)",
        },
        discount_type: {
          type: "string",
          enum: ["percentage", "fixed"],
          description: "Loại chiết khấu tổng đơn: percentage (phần trăm) hoặc fixed (tiền cố định) (tùy chọn)",
        },
        lines: {
          type: "array",
          description: "Danh sách sản phẩm",
          items: {
            type: "object",
            properties: {
              product_id: {
                type: "number",
                description: "ID sản phẩm — phải lấy từ get_products trước",
              },
              product_name: {
                type: "string",
                description: "Tên sản phẩm — điền vào để hiển thị khi xác nhận",
              },
              quantity: { type: "number", description: "Số lượng" },
              unit_price: { type: "number", description: "Đơn giá" },
              uom_name: {
                type: "string",
                description: "Tên đơn vị tính (tùy chọn, để hiển thị)",
              },
              uom_id: {
                type: "number",
                description: "ID đơn vị tính (tùy chọn) — tra cứu từ get_uoms",
              },
              tax_rate_id: {
                type: "number",
                description: "ID thuế suất (tùy chọn)",
              },
              discount_percent: {
                type: "number",
                description: "Tỷ lệ chiết khấu của dòng này (%) (tùy chọn)",
              },
              discount_amount: {
                type: "number",
                description: "Số tiền chiết khấu của dòng này (tùy chọn)",
              },
              discount_type: {
                type: "string",
                enum: ["percentage", "fixed"],
                description: "Loại chiết khấu dòng: percentage hoặc fixed (tùy chọn)",
              },
            },
          },
        },
      },
    },
    async execute(args: any, context: ToolContext): Promise<ToolResult> {
      return callErpApiWrite(
        "POST",
        "/purchase-order",
        {
          supplier_id: args.supplier_id,
          branch_id: context.branchId, // ← lấy từ JWT của user
          // order_date không truyền — backend tự set new Date() để tránh AI điền ngày sai
          ...(args.description && { description: args.description }),
          ...(args.payment_term_id && { payment_term_id: args.payment_term_id }),
          ...(args.discount_percent !== undefined && { discount_percent: args.discount_percent }),
          ...(args.discount_amount !== undefined && { discount_amount: args.discount_amount }),
          ...(args.discount_type && { discount_type: args.discount_type }),
          // Chỉ gửi fields API cần, bỏ display-only fields
          lines: (args.lines ?? []).map((l: any) => ({
            product_id: l.product_id,
            quantity: l.quantity,
            unit_price: l.unit_price,
            ...(l.uom_id && { uom_id: l.uom_id }),
            ...(l.tax_rate_id && { tax_rate_id: l.tax_rate_id }),
            ...(l.discount_percent !== undefined && { discount_percent: l.discount_percent }),
            ...(l.discount_amount !== undefined && { discount_amount: l.discount_amount }),
            ...(l.discount_type && { discount_type: l.discount_type }),
          })),
        },
        context,
      );
    },
  },

  {
    name: "submit_po_for_approval",
    description:
      "⚠️ WRITE OPERATION — Gửi đơn mua hàng lên chờ phê duyệt. " +
      "Chỉ thực thi sau khi user xác nhận. " +
      "PO phải đang ở trạng thái draft. " +
      "Có thể truyền po_id (số) HOẶC po_no (mã PO dạng PO-2026-xxx) — tool sẽ tự lookup.",
    parameters: {
      type: "object",
      properties: {
        po_id: {
          type: "number",
          description: "ID số của đơn mua hàng (nếu có)",
        },
        po_no: {
          type: "string",
          description: "Mã PO dạng PO-2026-... (nếu không có po_id)",
        },
      },
    },
    async execute(args: any, context: ToolContext): Promise<ToolResult> {
      let poId = args.po_id;

      // Nếu không có po_id, lookup từ po_no
      if (!poId && args.po_no) {
        try {
          const { PurchaseOrder } =
            await import("../../purchase/models/purchaseOrder.model");
          const po = await PurchaseOrder.findOne({
            where: { po_no: args.po_no },
            attributes: ["id"],
          });
          if (!po) {
            return {
              success: false,
              error: `Không tìm thấy đơn mua hàng với mã ${args.po_no}`,
            };
          }
          poId = po.id;
        } catch (err: any) {
          return { success: false, error: err.message };
        }
      }

      if (!poId) {
        return {
          success: false,
          error: "Cần cung cấp po_id hoặc po_no để gửi duyệt",
        };
      }

      return callErpApiWrite(
        "PATCH",
        `/purchase-order/${poId}/submit`,
        {},
        context,
      );
    },
  },

  {
    name: "create_rfq",
    description:
      "⚠️ WRITE OPERATION — Tạo yêu cầu báo giá (RFQ) gửi nhà cung cấp. " +
      "Yêu cầu xác nhận từ user. " +
      "Dùng khi cần hỏi giá trước khi tạo PO chính thức.",
    parameters: {
      type: "object",
      required: ["rfq_date", "lines"],
      properties: {
        supplier_id: {
          type: "number",
          description: "ID nhà cung cấp (tùy chọn, có thể điền sau)",
        },
        rfq_date: {
          type: "string",
          description: "Ngày yêu cầu báo giá YYYY-MM-DD",
        },
        valid_until: {
          type: "string",
          description: "Hiệu lực đến YYYY-MM-DD (tùy chọn)",
        },
        lines: {
          type: "array",
          description: "Danh sách sản phẩm cần báo giá",
          items: {
            type: "object",
            properties: {
              product_id: { type: "number" },
              quantity: { type: "number" },
              uom_id: {
                type: "number",
                description: "ID đơn vị tính (tùy chọn)",
              },
            },
          },
        },
      },
    },
    async execute(args: any, context: ToolContext): Promise<ToolResult> {
      return callErpApiWrite(
        "POST",
        "/purchase/rfqs",
        {
          rfq_date: args.rfq_date,
          branch_id: context.branchId, // ← lấy từ JWT của user
          ...(args.supplier_id && { supplier_id: args.supplier_id }),
          ...(args.valid_until && { valid_until: args.valid_until }),
          lines: args.lines,
        },
        context,
      );
    },
  },
];

// Export tất cả tools purchase (read + write)
purchaseTools.push(...writePurchaseTools);

const extraReadTools: ITool[] = [
  {
    name: "get_uoms",
    description: "Truy vấn danh sách đơn vị tính (UOM) trong hệ thống để lấy ID và Code.",
    parameters: {
      type: "object",
      properties: {}
    },
    async execute(args: any, context: ToolContext): Promise<ToolResult> {
      try {
        const { Uom } = await import("../../master-data/models/uom.model");
        const uoms = await Uom.findAll();
        return { success: true, data: uoms };
      } catch (err: any) {
        return { success: false, error: err.message };
      }
    }
  },
  {
    name: "get_payment_terms",
    description: "Truy vấn danh sách điều khoản thanh toán (Payment Terms) trong hệ thống.",
    parameters: {
      type: "object",
      properties: {}
    },
    async execute(args: any, context: ToolContext): Promise<ToolResult> {
      try {
        const { PaymentTerm } = await import("../../master-data/models/paymentTerm.model");
        const terms = await PaymentTerm.findAll();
        return { success: true, data: terms };
      } catch (err: any) {
        return { success: false, error: err.message };
      }
    }
  }
];

purchaseTools.push(...extraReadTools);
