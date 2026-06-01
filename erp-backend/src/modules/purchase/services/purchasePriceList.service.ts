import { Op } from "sequelize";
import { PurchasePriceList } from "../models/purchasePriceList.model";
import { PurchasePriceListItem } from "../models/purchasePriceListItem.model";
import { Product } from "../../product/models/product.model";
import { Partner } from "../../../models";

export const purchasePriceListService = {
  // ─── READ ──────────────────────────────────────────────────────────────────

  async getAll(query: any, user: any) {
    const where: any = {};
    if (query.supplier_id) where.supplier_id = Number(query.supplier_id);
    if (query.is_active !== undefined)
      where.is_active = query.is_active === "true" ? 1 : 0;

    return PurchasePriceList.findAll({
      where,
      include: [
        { model: Partner, as: "supplier", attributes: ["id", "name"] },
        { model: PurchasePriceListItem, as: "items" },
      ],
      order: [["id", "DESC"]],
    });
  },

  async getById(id: number, user: any) {
    const pl = await PurchasePriceList.findByPk(id, {
      include: [
        { model: Partner, as: "supplier", attributes: ["id", "name"] },
        {
          model: PurchasePriceListItem,
          as: "items",
          include: [
            {
              model: Product,
              as: "product",
              attributes: ["id", "name", "image_url"],
            },
          ],
        },
      ],
    });
    if (!pl) throw { status: 404, message: "Purchase Price List not found" };
    return pl;
  },

  // ─── CREATE ────────────────────────────────────────────────────────────────

  async create(data: any, user: any) {
    if (!data.name?.trim()) throw { status: 400, message: "name is required" };

    return PurchasePriceList.create({
      name: data.name.trim(),
      code: data.code ?? null,
      currency_id: data.currency_id ?? null,
      supplier_id: data.supplier_id ?? null,
      is_active: data.is_active !== undefined ? Boolean(data.is_active) : true,
      start_date: data.start_date ?? null,
      end_date: data.end_date ?? null,
      notes: data.notes ?? null,
      created_by: user.id,
    });
  },

  // ─── UPDATE ────────────────────────────────────────────────────────────────

  async update(id: number, data: any, user: any) {
    const pl = await PurchasePriceList.findByPk(id);
    if (!pl) throw { status: 404, message: "Purchase Price List not found" };

    await pl.update({
      name: data.name !== undefined ? data.name : pl.name,
      code: data.code !== undefined ? data.code : pl.code,
      currency_id:
        data.currency_id !== undefined ? data.currency_id : pl.currency_id,
      supplier_id:
        data.supplier_id !== undefined ? data.supplier_id : pl.supplier_id,
      is_active:
        data.is_active !== undefined ? Boolean(data.is_active) : pl.is_active,
      start_date:
        data.start_date !== undefined ? data.start_date : pl.start_date,
      end_date: data.end_date !== undefined ? data.end_date : pl.end_date,
      notes: data.notes !== undefined ? data.notes : pl.notes,
    });

    return this.getById(id, user);
  },

  // ─── DELETE ────────────────────────────────────────────────────────────────

  async delete(id: number, user: any) {
    const pl = await PurchasePriceList.findByPk(id);
    if (!pl) throw { status: 404, message: "Purchase Price List not found" };
    // Items sẽ bị xóa cascade theo migration
    await pl.destroy();
    return { success: true };
  },

  // ─── ITEMS ─────────────────────────────────────────────────────────────────

  async addItems(priceListId: number, items: any[], user: any) {
    const pl = await PurchasePriceList.findByPk(priceListId);
    if (!pl) throw { status: 404, message: "Purchase Price List not found" };

    if (!Array.isArray(items) || items.length === 0) {
      throw { status: 400, message: "items must be a non-empty array" };
    }

    const created = [];
    for (const item of items) {
      if (!item.product_id)
        throw { status: 400, message: "product_id is required for each item" };
      if (item.unit_price === undefined || item.unit_price === null) {
        throw { status: 400, message: "unit_price is required for each item" };
      }

      const pItem = await PurchasePriceListItem.create({
        price_list_id: priceListId,
        product_id: item.product_id,
        supplier_id: item.supplier_id ?? null,
        min_quantity: item.min_quantity ?? 1,
        unit_price: item.unit_price,
        discount_percent: item.discount_percent ?? 0,
        uom_id: item.uom_id ?? null,
        lead_time_days: item.lead_time_days ?? null,
        start_date: item.start_date ?? null,
        end_date: item.end_date ?? null,
      });
      created.push(pItem);
    }
    return created;
  },

  async updateItem(itemId: number, data: any, user: any) {
    const item = await PurchasePriceListItem.findByPk(itemId);
    if (!item) throw { status: 404, message: "Price List Item not found" };

    await item.update({
      supplier_id:
        data.supplier_id !== undefined ? data.supplier_id : item.supplier_id,
      min_quantity:
        data.min_quantity !== undefined ? data.min_quantity : item.min_quantity,
      unit_price:
        data.unit_price !== undefined ? data.unit_price : item.unit_price,
      discount_percent:
        data.discount_percent !== undefined
          ? data.discount_percent
          : item.discount_percent,
      uom_id: data.uom_id !== undefined ? data.uom_id : item.uom_id,
      lead_time_days:
        data.lead_time_days !== undefined
          ? data.lead_time_days
          : item.lead_time_days,
      start_date:
        data.start_date !== undefined ? data.start_date : item.start_date,
      end_date: data.end_date !== undefined ? data.end_date : item.end_date,
    });
    return item;
  },

  async removeItem(itemId: number, user: any) {
    const item = await PurchasePriceListItem.findByPk(itemId);
    if (!item) throw { status: 404, message: "Price List Item not found" };
    await item.destroy();
    return { success: true };
  },

  // ─── PRICE LOOKUP ──────────────────────────────────────────────────────────

  /**
   * Tra giá mua cho 1 sản phẩm từ 1 NCC cụ thể.
   *
   * Thứ tự ưu tiên:
   * 1. Price list item khớp (supplier_id + product_id + min_quantity <= qty + còn hiệu lực)
   * 2. Price list item chung (supplier_id = NULL + product_id + min_quantity <= qty)
   * 3. product_supplier_info.price (giá NCC mặc định)
   * 4. products.cost_price (giá vốn mặc định)
   *
   * @param productId   - ID sản phẩm
   * @param supplierId  - ID nhà cung cấp
   * @param quantity    - Số lượng đặt (để áp dụng price break)
   * @param priceListId - ID price list cụ thể (optional, nếu không truyền sẽ tìm price list active)
   * @param date        - Ngày áp dụng (default = today)
   */
  async getProductPrice(
    productId: number,
    supplierId: number | null,
    quantity: number,
    priceListId?: number,
    date?: string,
  ): Promise<{
    unit_price: number;
    discount_percent: number;
    lead_time_days: number | null;
    source: "price_list" | "supplier_info" | "cost_price";
    price_list_item_id: number | null;
  }> {
    const today = date ?? new Date().toISOString().split("T")[0]!;

    // Build where for price list items
    const plWhere: any = {
      product_id: productId,
      min_quantity: { [Op.lte]: quantity },
    };

    // Date range filter
    const dateFilter = {
      [Op.or]: [{ start_date: null }, { start_date: { [Op.lte]: today } }],
    };
    const dateEndFilter = {
      [Op.or]: [{ end_date: null }, { end_date: { [Op.gte]: today } }],
    };

    // Find active price lists to search in
    const plFilter: any = { is_active: 1 };
    if (priceListId) {
      plFilter.id = priceListId;
    } else if (supplierId) {
      plFilter[Op.or] = [{ supplier_id: supplierId }, { supplier_id: null }];
    }

    const activePriceLists = await PurchasePriceList.findAll({
      where: {
        ...plFilter,
        [Op.and]: [
          {
            [Op.or]: [
              { start_date: null },
              { start_date: { [Op.lte]: today } },
            ],
          },
          { [Op.or]: [{ end_date: null }, { end_date: { [Op.gte]: today } }] },
        ],
      },
      attributes: ["id", "supplier_id"],
    });

    if (activePriceLists.length > 0) {
      const plIds = activePriceLists.map((p) => p.id);

      // Priority 1: supplier-specific item
      if (supplierId) {
        const specificItem = await PurchasePriceListItem.findOne({
          where: {
            ...plWhere,
            price_list_id: { [Op.in]: plIds },
            supplier_id: supplierId,
            [Op.and]: [dateFilter, dateEndFilter],
          },
          order: [["min_quantity", "DESC"]], // highest min_quantity that still qualifies
        });

        if (specificItem) {
          return {
            unit_price: Number(specificItem.unit_price),
            discount_percent: Number(specificItem.discount_percent),
            lead_time_days: specificItem.lead_time_days ?? null,
            source: "price_list",
            price_list_item_id: specificItem.id,
          };
        }
      }

      // Priority 2: generic item (supplier_id = NULL)
      const genericItem = await PurchasePriceListItem.findOne({
        where: {
          ...plWhere,
          price_list_id: { [Op.in]: plIds },
          supplier_id: null,
          [Op.and]: [dateFilter, dateEndFilter],
        },
        order: [["min_quantity", "DESC"]],
      });

      if (genericItem) {
        return {
          unit_price: Number(genericItem.unit_price),
          discount_percent: Number(genericItem.discount_percent),
          lead_time_days: genericItem.lead_time_days ?? null,
          source: "price_list",
          price_list_item_id: genericItem.id,
        };
      }
    }

    // Priority 3: product_supplier_info
    if (supplierId) {
      const [supplierInfo]: any[] = await (
        PurchasePriceList as any
      ).sequelize.query(
        `SELECT price, lead_time_days FROM product_supplier_info
         WHERE product_id = ? AND supplier_id = ? LIMIT 1`,
        { replacements: [productId, supplierId], type: "SELECT" },
      );
      if (supplierInfo?.price) {
        return {
          unit_price: Number(supplierInfo.price),
          discount_percent: 0,
          lead_time_days: supplierInfo.lead_time_days ?? null,
          source: "supplier_info",
          price_list_item_id: null,
        };
      }
    }

    // Priority 4: products.cost_price
    const product = (await Product.findByPk(productId, {
      attributes: ["id", "cost_price"],
    })) as any;
    return {
      unit_price: Number(product?.cost_price ?? 0),
      discount_percent: 0,
      lead_time_days: null,
      source: "cost_price",
      price_list_item_id: null,
    };
  },
};
