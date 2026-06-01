import { UomConversion } from "../../master-data/dto/uom.dto";
import { Uom } from "../../master-data/dto/uom.dto";

/**
 * Tìm conversion factor từ fromUomId → toUomId.
 * Ưu tiên: product-specific forward → generic forward
 *        → product-specific reverse → generic reverse
 */
function findFactor(
  allConversions: UomConversion[],
  fromUomId: number,
  toUomId: number,
  productId?: number | null,
): number | null {
  const isGeneric = (c: UomConversion) =>
    c.product_id == null || c.product_id === 0;

  // 1. Product-specific forward
  if (productId) {
    const c = allConversions.find(
      (c) =>
        c.product_id === productId &&
        c.from_uom_id === fromUomId &&
        c.to_uom_id === toUomId,
    );
    if (c) return Number(c.factor);
  }

  // 2. Generic forward
  const gf = allConversions.find(
    (c) =>
      isGeneric(c) && c.from_uom_id === fromUomId && c.to_uom_id === toUomId,
  );
  if (gf) return Number(gf.factor);

  // 3. Product-specific reverse
  if (productId) {
    const c = allConversions.find(
      (c) =>
        c.product_id === productId &&
        c.from_uom_id === toUomId &&
        c.to_uom_id === fromUomId,
    );
    if (c) return 1 / Number(c.factor);
  }

  // 4. Generic reverse
  const gr = allConversions.find(
    (c) =>
      isGeneric(c) && c.from_uom_id === toUomId && c.to_uom_id === fromUomId,
  );
  if (gr) return 1 / Number(gr.factor);

  return null;
}

/**
 * Lọc danh sách UOM hợp lệ cho 1 product line.
 * Truyền productId để ưu tiên conversion product-specific.
 */
export function getValidUomsForProduct(
  allUoms: Uom[],
  allConversions: UomConversion[],
  stockUomId: number | null | undefined,
  productId?: number | null, // ← thêm
): Uom[] {
  if (!stockUomId) return allUoms;

  return allUoms.filter((uom) => {
    if (uom.id === stockUomId) return true;
    return findFactor(allConversions, uom.id, stockUomId, productId) !== null;
  });
}

/**
 * Preview qty_in_stock_uom ở frontend (UX only, backend tính lại).
 * Truyền productId để dùng đúng conversion của từng product.
 */
export function previewQtyInStockUom(
  quantity: number,
  purchaseUomId: number | null | undefined,
  stockUomId: number | null | undefined,
  allConversions: UomConversion[],
  productId?: number | null, // ← thêm
): number {
  if (!purchaseUomId || !stockUomId || purchaseUomId === stockUomId) {
    return quantity;
  }

  const factor = findFactor(
    allConversions,
    purchaseUomId,
    stockUomId,
    productId,
  );
  return factor != null ? quantity * factor : quantity;
}

/**
 * Convert price từ fromUom sang toUom.
 * - purchaseUom → stockUom: dùng để tính sale_price (per stock UOM)
 * - stockUom → purchaseUom: dùng để hiển thị price_in_purchase_uom
 *
 * Ví dụ: 7000/box, 1 box = 24 pcs
 *   convertPrice(7000, box, pcs, conversions, productId) → 291.67/pcs
 *   convertPrice(291.67, pcs, box, conversions, productId) → 7000/box
 */
export function convertPrice(
  price: number,
  fromUomId: number | null | undefined,
  toUomId: number | null | undefined,
  allConversions: UomConversion[],
  productId?: number | null,
): number {
  if (!fromUomId || !toUomId || fromUomId === toUomId) return price;

  // factor = how many toUom units in 1 fromUom
  // e.g. box→pcs: factor=24 → 1 box = 24 pcs
  // price per toUom = price per fromUom / factor
  const factor = findFactor(allConversions, fromUomId, toUomId, productId);
  if (factor == null) return price;

  return price / factor;
}
