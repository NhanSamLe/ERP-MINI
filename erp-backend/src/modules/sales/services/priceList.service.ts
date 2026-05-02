import { PriceList } from "../models/priceList.model";
import { PriceListItem } from "../models/priceListItem.model";
import { Product } from "../../product/models/product.model";

export const priceListService = {
  async getAll(user: any) {
    const where: any = {};
    return await PriceList.findAll({
      where,
      include: [{ model: PriceListItem, as: "items" }],
      order: [["id", "DESC"]]
    });
  },

  async getById(id: number, user: any) {
    const pl = await PriceList.findByPk(id, {
      include: [{ model: PriceListItem, as: "items" }]
    });
    if (!pl) throw new Error("Price List not found");
    return pl;
  },

  async create(data: any, user: any) {
    return await PriceList.create({
      name: data.name,
      code: data.code,
      currency_id: data.currency_id,
      type: data.type || "sales",
      start_date: data.start_date,
      end_date: data.end_date,
      is_active: data.is_active !== undefined ? data.is_active : true,
    });
  },

  async update(id: number, data: any, user: any) {
    const pl = await this.getById(id, user);
    await pl.update({
      name: data.name !== undefined ? data.name : pl.name,
      code: data.code !== undefined ? data.code : pl.code,
      type: data.type !== undefined ? data.type : pl.type,
      currency_id: data.currency_id !== undefined ? data.currency_id : pl.currency_id,
      start_date: data.start_date !== undefined ? data.start_date : pl.start_date,
      end_date: data.end_date !== undefined ? data.end_date : pl.end_date,
      is_active: data.is_active !== undefined ? data.is_active : pl.is_active,
    });
    return pl;
  },

  async delete(id: number, user: any) {
    const pl = await this.getById(id, user);
    // Ideally we soft delete, but for price list items we might hard delete depending on schema setup.
    await pl.destroy();
    return true;
  },

  async getProductPrice(productId: number, priceListId: number | undefined, quantity: number) {
    const p = await Product.findByPk(productId) as any;
    if (!p) throw new Error("Product not found");

    let finalPrice = Number(p.sale_price || 0);

    if (priceListId) {
      const customPrice = await PriceListItem.findOne({
        where: { price_list_id: priceListId, product_id: productId },
        order: [["min_quantity", "DESC"]]
      }) as any;

      if (customPrice && quantity >= Number(customPrice.min_quantity || 1)) {
        if (customPrice.unit_price !== null && Number(customPrice.unit_price) > 0) {
          finalPrice = Number(customPrice.unit_price);
        } else if (Number(customPrice.discount_percent || 0) > 0) {
          finalPrice = finalPrice - (finalPrice * Number(customPrice.discount_percent) / 100);
        }
      }
    }
    return finalPrice;
  },

  async addItemsToPriceList(priceListId: number, items: any[], user: any) {
    const pl = await this.getById(priceListId, user);
    const createdItems = [];
    for (const item of items) {
      const pItem = await PriceListItem.create({
        price_list_id: pl.id,
        product_id: item.product_id,
        min_quantity: item.min_quantity || 1,
        unit_price: item.unit_price || 0,
        discount_percent: item.discount_percent || 0
      });
      createdItems.push(pItem);
    }
    return createdItems;
  },

  async updateItem(itemId: number, data: any, user: any) {
    const pItem = await PriceListItem.findByPk(itemId);
    if (!pItem) throw new Error("Item not found");
    // Can optionally check if pl belongs to user
    await pItem.update({
      min_quantity: data.min_quantity !== undefined ? data.min_quantity : pItem.min_quantity,
      unit_price: data.unit_price !== undefined ? data.unit_price : pItem.unit_price,
      discount_percent: data.discount_percent !== undefined ? data.discount_percent : pItem.discount_percent,
    });
    return pItem;
  },

  async removeItem(itemId: number, user: any) {
    const pItem = await PriceListItem.findByPk(itemId);
    if (!pItem) throw new Error("Item not found");
    await pItem.destroy();
    return true;
  }
};
