import { Product } from "../../product/models/product.model";
import { OcrLineItem } from "../types/ocr.types";

export interface ProductMatchResult {
  lineIndex: number;
  matchedProductId: number | null;
  matchConfidence: number;
  matchMethod: "exact_code" | "fuzzy_name" | "none";
  needsManualSelection?: boolean;
}

function levenshtein(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  // Dùng flat Uint32Array để tránh lỗi noUncheckedIndexedAccess với 2D array
  const dp = new Uint32Array((m + 1) * (n + 1));
  const idx = (i: number, j: number) => i * (n + 1) + j;

  for (let i = 0; i <= m; i++) dp[idx(i, 0)] = i;
  for (let j = 0; j <= n; j++) dp[idx(0, j)] = j;

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (a[i - 1] === b[j - 1]) {
        dp[idx(i, j)] = dp[idx(i - 1, j - 1)] ?? 0;
      } else {
        dp[idx(i, j)] =
          1 +
          Math.min(
            dp[idx(i - 1, j - 1)] ?? 0,
            dp[idx(i - 1, j)] ?? 0,
            dp[idx(i, j - 1)] ?? 0,
          );
      }
    }
  }
  return dp[idx(m, n)] ?? 0;
}

export class ProductMatcherService {
  async matchItems(
    items: OcrLineItem[],
    branch_id: number,
  ): Promise<ProductMatchResult[]> {
    const allProducts = await Product.findAll({ where: { status: "active" } });

    return items.map((item, lineIndex) => {
      const normalizedItemName = item.name?.trim().toLowerCase() ?? "";

      if (allProducts.length === 0) {
        return {
          lineIndex,
          matchedProductId: null,
          matchConfidence: 0,
          matchMethod: "none",
          needsManualSelection: true,
        };
      }

      let bestProduct: Product | null = null;
      let bestDistance = Infinity;

      for (const product of allProducts) {
        const productName = product.name?.trim().toLowerCase() ?? "";
        const distance = levenshtein(normalizedItemName, productName);
        if (distance < bestDistance) {
          bestDistance = distance;
          bestProduct = product;
        }
      }

      if (bestProduct) {
        const bestProductName = bestProduct.name?.trim().toLowerCase() ?? "";
        const maxLen = Math.max(
          normalizedItemName.length,
          bestProductName.length,
        );
        const ratio = maxLen > 0 ? bestDistance / maxLen : 1;

        if (ratio <= 0.4) {
          const confidence =
            1 -
            bestDistance /
              Math.max(normalizedItemName.length, bestProductName.length);
          return {
            lineIndex,
            matchedProductId: bestProduct.id,
            matchConfidence: Math.max(0, confidence),
            matchMethod: "fuzzy_name",
          };
        }
      }

      return {
        lineIndex,
        matchedProductId: null,
        matchConfidence: 0,
        matchMethod: "none",
        needsManualSelection: true,
      };
    });
  }
}
