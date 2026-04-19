import { Op } from "sequelize";
import { ProductSupplierInfo } from "../models/productSupplierInfo.model";
import { Partner } from "../../partner/models/partner.model";
import { Currency } from "../../master-data/models/currency.model";

export interface ProductSupplierInfoDTO {
  product_id: number;
  supplier_id: number;
  supplier_product_code?: string | null;
  supplier_product_name?: string | null;
  min_order_qty?: number | null;
  lead_time_days?: number | null;
  price?: number | null;
  currency_id?: number | null;
  is_preferred?: boolean;
}

export const productSupplierInfoService = {
  /**
   * Lấy danh sách nhà cung cấp của một product
   */
  async getByProduct(productId: number) {
    return await ProductSupplierInfo.findAll({
      where: { product_id: productId },
      include: [
        {
          model: Partner,
          as: "supplier",
          attributes: ["id", "name", "phone", "email", "address"],
        },
        {
          model: Currency,
          as: "currency",
          attributes: ["id", "code", "name", "symbol"],
        },
      ],
      order: [
        ["is_preferred", "DESC"], // Ưu tiên lên đầu
        ["id", "ASC"],
      ],
    });
  },

  /**
   * Tạo mới supplier info
   */
  async create(data: ProductSupplierInfoDTO) {
    // Kiểm tra supplier có tồn tại và type = 'supplier'
    const supplier = await Partner.findByPk(data.supplier_id);
    if (!supplier) {
      throw new Error("Supplier not found");
    }
    if (supplier.type !== "supplier") {
      throw new Error("Partner must be a supplier");
    }

    // Kiểm tra duplicate
    const existing = await ProductSupplierInfo.findOne({
      where: {
        product_id: data.product_id,
        supplier_id: data.supplier_id,
      },
    });

    if (existing) {
      throw new Error("This supplier is already linked to this product");
    }

    const supplierInfo = await ProductSupplierInfo.create(data);

    // Nếu is_preferred = true, set các record khác thành false
    if (data.is_preferred) {
      await ProductSupplierInfo.update(
        { is_preferred: false },
        {
          where: {
            product_id: data.product_id,
            id: { [Op.ne]: supplierInfo.id },
          },
        },
      );
    }

    return await ProductSupplierInfo.findByPk(supplierInfo.id, {
      include: [
        {
          model: Partner,
          as: "supplier",
          attributes: ["id", "name", "phone", "email"],
        },
        {
          model: Currency,
          as: "currency",
          attributes: ["id", "code", "name", "symbol"],
        },
      ],
    });
  },

  /**
   * Cập nhật supplier info
   */
  async update(
    id: number,
    data: Partial<ProductSupplierInfoDTO>,
  ): Promise<ProductSupplierInfo | null> {
    const supplierInfo = await ProductSupplierInfo.findByPk(id);
    if (!supplierInfo) {
      throw new Error("Supplier info not found");
    }

    await supplierInfo.update(data);

    // Nếu is_preferred = true, set các record khác thành false
    if (data.is_preferred) {
      await ProductSupplierInfo.update(
        { is_preferred: false },
        {
          where: {
            product_id: supplierInfo.product_id,
            id: { [Op.ne]: id },
          },
        },
      );
    }

    return await ProductSupplierInfo.findByPk(id, {
      include: [
        {
          model: Partner,
          as: "supplier",
          attributes: ["id", "name", "phone", "email"],
        },
        {
          model: Currency,
          as: "currency",
          attributes: ["id", "code", "name", "symbol"],
        },
      ],
    });
  },

  /**
   * Xóa supplier info
   */
  async delete(id: number) {
    const supplierInfo = await ProductSupplierInfo.findByPk(id);
    if (!supplierInfo) {
      throw new Error("Supplier info not found");
    }

    await supplierInfo.destroy();
    return { message: "Supplier info deleted successfully" };
  },

  /**
   * Đặt một supplier làm ưu tiên
   */
  async setPreferred(id: number, productId: number) {
    const supplierInfo = await ProductSupplierInfo.findByPk(id);
    if (!supplierInfo) {
      throw new Error("Supplier info not found");
    }

    if (supplierInfo.product_id !== productId) {
      throw new Error("Supplier info does not belong to this product");
    }

    // Set tất cả về false
    await ProductSupplierInfo.update(
      { is_preferred: false },
      { where: { product_id: productId } },
    );

    // Set record này thành true
    await supplierInfo.update({ is_preferred: true });

    return await ProductSupplierInfo.findByPk(id, {
      include: [
        {
          model: Partner,
          as: "supplier",
          attributes: ["id", "name", "phone", "email"],
        },
      ],
    });
  },
};
