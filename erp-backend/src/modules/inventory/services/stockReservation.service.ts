import { Transaction } from "sequelize";
import { StockBalance } from "../models/stockBalance.model";
import { StockReservation } from "../models/stockReservation.model";
import { Product } from "../../product/models/product.model";
import { sequelize } from "../../../config/db";

export interface ReserveParams {
  product_id: number;
  warehouse_id: number;
  qty: number;
  reference_type: "sale_order" | "transfer";
  reference_id: number;
}

export const stockReservationService = {
  /**
   * Giữ chỗ tồn kho cho Sale Order hoặc Transfer
   */
  async reserve(params: ReserveParams, transaction?: Transaction) {
    const execReserve = async (t: Transaction) => {
      // 1. Lock stock balance
      let balance = await StockBalance.findOne({
        where: {
          warehouse_id: params.warehouse_id,
          product_id: params.product_id,
        },
        lock: t.LOCK.UPDATE,
        transaction: t,
      });

      if (!balance) {
        const product = await Product.findByPk(params.product_id, { transaction: t });
        throw {
          status: 400,
          message: `Sản phẩm ${product?.name ?? params.product_id} không có sẵn tồn kho tại kho được chọn.`,
        };
      }

      // 2. Kiểm tra số lượng khả dụng (available = quantity - reserved_qty)
      const quantity = Number(balance.quantity || 0);
      const reservedQty = Number(balance.reserved_qty || 0);
      const availableQty = quantity - reservedQty;

      if (availableQty < params.qty) {
        const product = await Product.findByPk(params.product_id, { transaction: t });
        throw {
          status: 400,
          message: `Không đủ tồn kho khả dụng cho sản phẩm ${product?.name ?? params.product_id}. Yêu cầu: ${params.qty}, Khả dụng: ${availableQty} (Tồn thực tế: ${quantity}, Đã giữ chỗ: ${reservedQty})`,
        };
      }

      // 3. Tăng reserved_qty trong StockBalance
      await balance.update(
        { reserved_qty: reservedQty + params.qty },
        { transaction: t }
      );

      // 4. Tạo bản ghi StockReservation
      const reservation = await StockReservation.create(
        {
          product_id: params.product_id,
          warehouse_id: params.warehouse_id,
          qty: params.qty,
          reference_type: params.reference_type,
          reference_id: params.reference_id,
          status: "active",
        },
        { transaction: t }
      );

      return reservation;
    };

    if (transaction) {
      return await execReserve(transaction);
    } else {
      return await sequelize.transaction(async (t) => {
        return await execReserve(t);
      });
    }
  },

  /**
   * Giải phóng (hủy bỏ) toàn bộ giữ chỗ của một Sale Order hoặc Transfer
   */
  async release(
    referenceType: "sale_order" | "transfer",
    referenceId: number,
    transaction?: Transaction
  ) {
    const execRelease = async (t: Transaction) => {
      const reservations = await StockReservation.findAll({
        where: {
          reference_type: referenceType,
          reference_id: referenceId,
          status: "active",
        },
        lock: t.LOCK.UPDATE,
        transaction: t,
      });

      for (const res of reservations) {
        const balance = await StockBalance.findOne({
          where: {
            warehouse_id: res.warehouse_id,
            product_id: res.product_id,
          },
          lock: t.LOCK.UPDATE,
          transaction: t,
        });

        if (balance) {
          const newReserved = Math.max(0, Number(balance.reserved_qty || 0) - Number(res.qty));
          await balance.update(
            { reserved_qty: newReserved },
            { transaction: t }
          );
        }

        await res.update(
          {
            status: "released",
            released_at: new Date(),
          },
          { transaction: t }
        );
      }
    };

    if (transaction) {
      await execRelease(transaction);
    } else {
      await sequelize.transaction(async (t) => {
        await execRelease(t);
      });
    }
  },

  /**
   * Hoàn thành giữ chỗ khi xuất kho (Fulfill)
   * Giảm reserved_qty tương ứng với số lượng xuất kho thực tế
   */
  async fulfill(
    productId: number,
    warehouseId: number,
    qty: number,
    referenceType: "sale_order" | "transfer",
    referenceId: number,
    transaction: Transaction
  ) {
    // Tìm reservation active
    const res = await StockReservation.findOne({
      where: {
        product_id: productId,
        warehouse_id: warehouseId,
        reference_type: referenceType,
        reference_id: referenceId,
        status: "active",
      },
      lock: transaction.LOCK.UPDATE,
      transaction,
    });

    if (!res) return;

    const balance = await StockBalance.findOne({
      where: {
        warehouse_id: warehouseId,
        product_id: productId,
      },
      lock: transaction.LOCK.UPDATE,
      transaction,
    });

    const fulfillQty = Math.min(qty, Number(res.qty));

    if (balance) {
      const newReserved = Math.max(0, Number(balance.reserved_qty || 0) - fulfillQty);
      await balance.update(
        { reserved_qty: newReserved },
        { transaction }
      );
    }

    if (fulfillQty >= Number(res.qty)) {
      await res.update(
        {
          status: "fulfilled",
          fulfilled_at: new Date(),
        },
        { transaction }
      );
    } else {
      await res.update(
        {
          qty: Number(res.qty) - fulfillQty,
        },
        { transaction }
      );
    }
  }
};
