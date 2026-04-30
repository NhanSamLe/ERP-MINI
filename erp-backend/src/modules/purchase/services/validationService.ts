import { PurchaseOrder } from "../models/purchaseOrder.model";
import { PurchaseOrderLine } from "../models/purchaseOrderLine.model";
import { Partner } from "../../../models";
import { productService } from "../../product/services/product.service";
import { Op } from "sequelize";

export const validationService = {
  /**
   * Kiểm tra tính duy nhất của po_no
   */
  async validatePoNoUniqueness(
    po_no: string,
    excludeId?: number,
  ): Promise<void> {
    const where: any = { po_no };
    if (excludeId) {
      where.id = { [Op.ne]: excludeId };
    }

    const existing = await PurchaseOrder.findOne({ where });
    if (existing) {
      throw {
        status: 400,
        message: `Mã đơn đặt hàng "${po_no}" đã tồn tại trong hệ thống`,
      };
    }
  },

  /**
   * Kiểm tra nhà cung cấp có tồn tại không
   */
  async validateSupplierExists(supplier_id: number): Promise<void> {
    const supplier = await Partner.findByPk(supplier_id);
    if (!supplier) {
      throw {
        status: 400,
        message: `Nhà cung cấp với ID ${supplier_id} không tồn tại`,
      };
    }
  },

  /**
   * Kiểm tra ngày đặt hàng hợp lệ
   */
  validateOrderDate(order_date: Date): void {
    if (!order_date) {
      throw {
        status: 400,
        message: "Ngày đặt hàng không được để trống",
      };
    }

    const date = new Date(order_date);
    if (isNaN(date.getTime())) {
      throw {
        status: 400,
        message: "Ngày đặt hàng không hợp lệ",
      };
    }

    // Không cho phép ngày trong tương lai quá 30 ngày
    const maxFutureDate = new Date();
    maxFutureDate.setDate(maxFutureDate.getDate() + 30);

    if (date > maxFutureDate) {
      throw {
        status: 400,
        message: "Ngày đặt hàng không được vượt quá 30 ngày trong tương lai",
      };
    }
  },

  /**
   * Kiểm tra danh sách sản phẩm không được trống
   */
  validateLinesNotEmpty(lines: any[]): void {
    if (!lines || lines.length === 0) {
      throw {
        status: 400,
        message: "Đơn đặt hàng phải có ít nhất một sản phẩm",
      };
    }
  },

  /**
   * Kiểm tra chi tiết từng dòng sản phẩm
   */
  async validateLineItem(line: any): Promise<void> {
    // Kiểm tra product_id
    if (!line.product_id) {
      throw {
        status: 400,
        message: "Mã sản phẩm không được để trống",
      };
    }

    // Kiểm tra sản phẩm có tồn tại không
    const product = await productService.getById(line.product_id);
    if (!product) {
      throw {
        status: 400,
        message: `Sản phẩm với ID ${line.product_id} không tồn tại`,
      };
    }

    // Kiểm tra số lượng
    if (!line.quantity || line.quantity <= 0) {
      throw {
        status: 400,
        message: `Số lượng sản phẩm "${product.name}" phải lớn hơn 0`,
      };
    }

    // Kiểm tra giá đơn vị
    if (!line.unit_price || line.unit_price <= 0) {
      throw {
        status: 400,
        message: `Giá đơn vị sản phẩm "${product.name}" phải lớn hơn 0`,
      };
    }

    // Kiểm tra tax_rate_id nếu có
    if (line.tax_rate_id) {
      // Có thể thêm kiểm tra TaxRate tồn tại nếu cần
    }
  },

  /**
   * Kiểm tra toàn bộ dữ liệu PO
   */
  async validatePO(data: any, excludeId?: number): Promise<void> {
    // Kiểm tra po_no
    if (!data.po_no || data.po_no.trim() === "") {
      throw {
        status: 400,
        message: "Mã đơn đặt hàng không được để trống",
      };
    }

    await this.validatePoNoUniqueness(data.po_no, excludeId);

    // Kiểm tra supplier_id
    if (!data.supplier_id) {
      throw {
        status: 400,
        message: "Nhà cung cấp không được để trống",
      };
    }

    await this.validateSupplierExists(data.supplier_id);

    // Kiểm tra order_date
    if (data.order_date) {
      this.validateOrderDate(data.order_date);
    }

    // Kiểm tra lines
    this.validateLinesNotEmpty(data.lines);

    // Kiểm tra từng line
    for (const line of data.lines) {
      await this.validateLineItem(line);
    }
  },
};
