import { UomConversion } from "../../master-data/dto/uom.dto";
import { Uom } from "../../master-data/dto/uom.dto";

/**
 * Lọc danh sách UOM hợp lệ cho 1 product line dựa trên stock UOM của product.
 *
 * Một UOM được coi là hợp lệ nếu:
 * 1. Chính là stock UOM của product (factor = 1, không cần convert)
 * 2. Có conversion từ UOM đó → stock UOM (thuận: from_uom_id = uom, to_uom_id = stockUom)
 * 3. Có conversion từ stock UOM → UOM đó (ngược: from_uom_id = stockUom, to_uom_id = uom)
 *
 * Ví dụ: product Lavie có stock UOM = CHAI (id=1)
 * - CHAI → hợp lệ (chính là stock UOM)
 * - THUNG → hợp lệ nếu có conversion THUNG→CHAI hoặc CHAI→THUNG
 * - KG → KHÔNG hợp lệ nếu không có conversion nào với CHAI
 */
export function getValidUomsForProduct(
  allUoms: Uom[],
  allConversions: UomConversion[],
  stockUomId: number | null | undefined,
): Uom[] {
  if (!stockUomId) {
    // Không có stock UOM → cho phép chọn tất cả (không thể validate)
    return allUoms;
  }

  return allUoms.filter((uom) => {
    // 1. Chính là stock UOM
    if (uom.id === stockUomId) return true;

    // 2. Có conversion thuận: uom → stockUom
    const forward = allConversions.find(
      (c) => c.from_uom_id === uom.id && c.to_uom_id === stockUomId,
    );
    if (forward) return true;

    // 3. Có conversion ngược: stockUom → uom
    const reverse = allConversions.find(
      (c) => c.from_uom_id === stockUomId && c.to_uom_id === uom.id,
    );
    if (reverse) return true;

    return false;
  });
}

/**
 * Tính qty_in_stock_uom ở frontend để hiển thị preview cho user.
 * Backend sẽ tính lại chính xác, đây chỉ để UX.
 */
export function previewQtyInStockUom(
  quantity: number,
  purchaseUomId: number | null | undefined,
  stockUomId: number | null | undefined,
  allConversions: UomConversion[],
): number {
  if (!purchaseUomId || !stockUomId || purchaseUomId === stockUomId) {
    return quantity;
  }

  const forward = allConversions.find(
    (c) => c.from_uom_id === purchaseUomId && c.to_uom_id === stockUomId,
  );
  if (forward) return quantity * Number(forward.factor);

  const reverse = allConversions.find(
    (c) => c.from_uom_id === stockUomId && c.to_uom_id === purchaseUomId,
  );
  if (reverse) return quantity / Number(reverse.factor);

  return quantity;
}
