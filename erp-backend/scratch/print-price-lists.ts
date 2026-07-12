import { sequelize } from "../src/config/db";
import { Partner } from "../src/modules/partner/models/partner.model";
import { PurchasePriceList } from "../src/modules/purchase/models/purchasePriceList.model";
import { PurchasePriceListItem } from "../src/modules/purchase/models/purchasePriceListItem.model";
import { Product } from "../src/modules/product/models/product.model";

async function main() {
  await sequelize.authenticate();
  
  // Tìm supplier NVB
  const nvb = await Partner.findOne({
    where: { name: "Công ty Cổ phần Công nghệ NVB" }
  });
  console.log("Supplier:", nvb?.toJSON());

  if (nvb) {
    const lists = await PurchasePriceList.findAll({
      where: { supplier_id: nvb.id }
    });
    console.log("Price Lists:", JSON.stringify(lists, null, 2));

    if (lists.length > 0) {
      const listIds = lists.map(l => l.id);
      const items = await PurchasePriceListItem.findAll({
        where: { price_list_id: listIds }
      });
      console.log("Price List Items:", JSON.stringify(items, null, 2));
    }
  }
  process.exit(0);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
