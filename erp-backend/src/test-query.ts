import { Product } from "./modules/product/models/product.model";
import { ProductCategory } from "./modules/product/models/productCategory.model";
import { Uom } from "./modules/master-data/models/uom.model";
import { sequelize } from "./models";
import { Op } from "sequelize";

async function test() {
  try {
    console.log("Searching for iPhone 15 Pro Max using new dynamic query...");
    const include: any[] = [
      {
        model: ProductCategory,
        as: "category",
        attributes: ["id", "name"],
        required: false,
      },
      { model: Uom, as: "uom", attributes: ["id", "code", "name"] },
    ];
    const data = await Product.findAll({
      where: { name: { [Op.like]: "%iPhone 15 Pro Max%" } },
      include,
    });
    console.log("Results count:", data.length);
    if (data.length > 0 && data[0]) {
      console.log("Product found:", data[0].toJSON());
    }
  } catch (err: any) {
    console.error("Query failed:", err);
  } finally {
    await sequelize.close();
  }
}

test();
