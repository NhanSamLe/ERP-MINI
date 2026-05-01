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
