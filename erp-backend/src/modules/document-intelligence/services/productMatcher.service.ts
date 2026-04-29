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
  const dp: number[][] = Array.from({ length: m + 1 }, (_, i) =>
    Array.from({ length: n + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0)),
  );
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (a[i - 1] === b[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1];
      } else {
        dp[i][j] = 1 + Math.min(dp[i - 1][j - 1], dp[i - 1][j], dp[i][j - 1]);
      }
    }
  }
  return dp[m][n];
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
        const maxLen = Math.max(
          normalizedItemName.length,
          bestProduct.name.trim().toLowerCase().length,
        );
        const ratio = maxLen > 0 ? bestDistance / maxLen : 1;

        if (ratio <= 0.4) {
          const confidence =
            1 -
            bestDistance /
              Math.max(normalizedItemName.length, bestProduct.name.length);
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
