import { Op } from "sequelize";
import { Partner } from "../../partner/models/partner.model";

export interface VendorMatchResult {
  matchedPartnerId: number | null;
  matchConfidence: number;
  suggestion?: string;
  matchMethod: "exact_tax_code" | "fuzzy_name" | "none";
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
        dp[i]![j] = dp[i - 1]![j - 1]!;
      } else {
        dp[i]![j] =
          1 + Math.min(dp[i - 1]![j - 1]!, dp[i - 1]![j]!, dp[i]![j - 1]!);
      }
    }
  }
  return dp[m]![n]!;
}

export class VendorMatcherService {
  async match(
    vendor_name: string,
    vendor_tax_code: string,
    branch_id: number,
  ): Promise<VendorMatchResult> {
    const normalizedTaxCode = vendor_tax_code?.trim();

    // Step 1: Exact tax code match (case-insensitive)
    if (normalizedTaxCode) {
      const exactMatch = await Partner.findOne({
        where: {
          tax_code: { [Op.like]: normalizedTaxCode },
          type: "supplier",
        },
      });

      if (exactMatch) {
        return {
          matchedPartnerId: exactMatch.id,
          matchConfidence: 1.0,
          matchMethod: "exact_tax_code",
        };
      }
    }

    // Step 2: Fuzzy name matching using Levenshtein distance
    const allSuppliers = await Partner.findAll({ where: { type: "supplier" } });

    if (allSuppliers.length === 0) {
      return {
        matchedPartnerId: null,
        matchConfidence: 0,
        matchMethod: "none",
      };
    }

    const normalizedVendorName = vendor_name?.trim().toLowerCase() ?? "";

    let bestMatch: Partner | null = null;
    let bestDistance = Infinity;

    for (const supplier of allSuppliers) {
      const supplierName = supplier.name?.trim().toLowerCase() ?? "";
      const distance = levenshtein(normalizedVendorName, supplierName);
      if (distance < bestDistance) {
        bestDistance = distance;
        bestMatch = supplier;
      }
    }

    if (bestMatch) {
      const maxLen = Math.max(
        normalizedVendorName.length,
        bestMatch.name.trim().toLowerCase().length,
      );
      const ratio = maxLen > 0 ? bestDistance / maxLen : 1;

      if (bestDistance <= 5 || ratio <= 0.4) {
        const confidence =
          1 -
          bestDistance /
            Math.max(normalizedVendorName.length, bestMatch.name.length);
        return {
          matchedPartnerId: bestMatch.id,
          matchConfidence: Math.max(0, confidence),
          matchMethod: "fuzzy_name",
        };
      }

      return {
        matchedPartnerId: null,
        matchConfidence: 0,
        suggestion: bestMatch.name,
        matchMethod: "none",
      };
    }

    return { matchedPartnerId: null, matchConfidence: 0, matchMethod: "none" };
  }
}
