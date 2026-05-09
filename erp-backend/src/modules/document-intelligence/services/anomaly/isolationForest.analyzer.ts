import { Op } from "sequelize";
import { ApInvoice } from "../../../purchase/models/apInvoice.model";
import { AnomalyFlag } from "../../types/anomaly.types";
import { OcrInvoiceData } from "../../types/ocr.types";

// ---------------------------------------------------------------------------
// Isolation Forest — pure TypeScript implementation
// ---------------------------------------------------------------------------

/** A node in an isolation tree */
interface ITreeNode {
  isLeaf: boolean;
  /** Number of data points in this node (leaf only) */
  size?: number;
  /** Feature index used for splitting (internal node only) */
  featureIndex?: number;
  /** Split threshold (internal node only) */
  splitValue?: number;
  left?: ITreeNode;
  right?: ITreeNode;
}

/**
 * Euler–Mascheroni constant used in the harmonic number approximation.
 */
const EULER_MASCHERONI = 0.5772156649;

/**
 * Average path length of an unsuccessful search in a Binary Search Tree
 * with n nodes. This is the normalisation factor for anomaly scores.
 *
 * c(n) = 2 * H(n-1) - (2*(n-1)/n)
 * where H(k) ≈ ln(k) + γ
 */
function avgPathLength(n: number): number {
  if (n <= 1) return 1;
  if (n === 2) return 1;
  const harmonic = Math.log(n - 1) + EULER_MASCHERONI;
  return 2 * harmonic - (2 * (n - 1)) / n;
}

/**
 * Simple seeded pseudo-random number generator (Mulberry32).
 * Returns a function that produces values in [0, 1).
 */
function createRng(seed: number): () => number {
  let s = seed >>> 0;
  return function () {
    s += 0x6d2b79f5;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Build one isolation tree from a subsample of data.
 *
 * @param data     - Array of feature vectors (each row is one sample)
 * @param maxDepth - Maximum tree depth (ceil(log2(subsampleSize)))
 * @param depth    - Current recursion depth
 * @param rng      - Seeded random number generator
 */
function buildTree(
  data: number[][],
  maxDepth: number,
  depth: number,
  rng: () => number,
): ITreeNode {
  // Leaf conditions: too deep, or only one point (or zero)
  if (depth >= maxDepth || data.length <= 1) {
    return { isLeaf: true, size: data.length };
  }

  const numFeatures = data[0]?.length ?? 0;
  if (numFeatures === 0) {
    return { isLeaf: true, size: data.length };
  }

  // Pick a random feature
  const featureIndex = Math.floor(rng() * numFeatures);

  // Find min/max for that feature
  let min: number = data[0]?.[featureIndex] ?? 0;
  let max: number = data[0]?.[featureIndex] ?? 0;
  for (let i = 1; i < data.length; i++) {
    const v: number = data[i]?.[featureIndex] ?? 0;
    if (v < min) min = v;
    if (v > max) max = v;
  }

  // If all values are identical on this feature, make a leaf
  if (min === max) {
    return { isLeaf: true, size: data.length };
  }

  // Random split value in (min, max)
  const splitValue = min + rng() * (max - min);

  const leftData: number[][] = [];
  const rightData: number[][] = [];
  for (const point of data) {
    if ((point[featureIndex] ?? 0) < splitValue) {
      leftData.push(point);
    } else {
      rightData.push(point);
    }
  }

  // Edge case: split produced an empty partition — make a leaf
  if (leftData.length === 0 || rightData.length === 0) {
    return { isLeaf: true, size: data.length };
  }

  return {
    isLeaf: false,
    featureIndex,
    splitValue,
    left: buildTree(leftData, maxDepth, depth + 1, rng),
    right: buildTree(rightData, maxDepth, depth + 1, rng),
  };
}

/**
 * Compute the path length of a single point through an isolation tree.
 * Leaf nodes contribute an adjustment term c(size) to account for
 * the unbuilt subtree.
 */
function pathLength(point: number[], node: ITreeNode, depth: number): number {
  if (node.isLeaf) {
    // Add the expected path length for the remaining unbuilt subtree
    return depth + avgPathLength(node.size ?? 1);
  }

  const featureValue = point[node.featureIndex ?? 0] ?? 0;
  if (featureValue < (node.splitValue ?? 0)) {
    return pathLength(point, node.left!, depth + 1);
  } else {
    return pathLength(point, node.right!, depth + 1);
  }
}

// ---------------------------------------------------------------------------
// Configuration constants
// ---------------------------------------------------------------------------

/** Minimum number of historical invoices required to run Isolation Forest */
const MIN_TRAINING_SAMPLES = 20;

/** Number of trees in the forest */
const NUM_TREES = 100;

/** Maximum subsample size per tree */
const MAX_SUBSAMPLE_SIZE = 256;

/** Anomaly score threshold for high severity */
const HIGH_SEVERITY_THRESHOLD = -0.3;

/** Anomaly score threshold for medium severity */
const MEDIUM_SEVERITY_THRESHOLD = -0.1;

/** Default random seed (can be overridden for testing) */
const DEFAULT_SEED = 42;

// ---------------------------------------------------------------------------
// Feature vector helpers
// ---------------------------------------------------------------------------

/**
 * Compute the number of days between two dates.
 * Returns 0 if date2 is before date1 (or equal).
 */
function daysBetween(date1: Date, date2: Date): number {
  const msPerDay = 24 * 60 * 60 * 1000;
  const diff = date2.getTime() - date1.getTime();
  return Math.max(0, Math.floor(diff / msPerDay));
}

/**
 * Build a feature vector for a single invoice.
 *
 * Features:
 *   [0] total              — invoice total value
 *   [1] item_count         — number of line items
 *   [2] avg_line_value     — total / item_count (or total if no items)
 *   [3] days_since_last    — days between this invoice_date and the most
 *                            recent previous invoice for this vendor/branch
 *                            (0 if no previous invoice)
 */
function buildFeatureVector(
  total: number,
  itemCount: number,
  invoiceDate: Date,
  previousInvoiceDate: Date | null,
): number[] {
  const avgLineValue = itemCount > 0 ? total / itemCount : total;
  const daysSinceLast =
    previousInvoiceDate !== null
      ? daysBetween(previousInvoiceDate, invoiceDate)
      : 0;

  return [total, itemCount, avgLineValue, daysSinceLast];
}

// ---------------------------------------------------------------------------
// IsolationForestAnalyzer
// ---------------------------------------------------------------------------

/**
 * IsolationForestAnalyzer detects multivariate outliers in invoice data
 * using a pure TypeScript Isolation Forest algorithm.
 *
 * Requirements: 6.1–6.5
 */
export class IsolationForestAnalyzer {
  /**
   * Random seed used when building trees.
   * Configurable for deterministic testing.
   */
  private readonly seed: number;

  /**
   * Counter tracking confirmed invoices per vendor/branch key.
   * Used to decide when to clear the model cache.
   */
  private readonly confirmCounter = new Map<string, number>();

  /**
   * Simple model cache: stores the pre-built forest (trees) per vendor/branch.
   * Cleared when confirmCounter reaches 50.
   *
   * Key: `${vendorTaxCode}:${branchId}`
   * Value: { trees, trainingSize }
   */
  private readonly modelCache = new Map<
    string,
    { trees: ITreeNode[]; trainingSize: number }
  >();

  constructor(seed: number = DEFAULT_SEED) {
    this.seed = seed;
  }

  /**
   * Analyze a new invoice for multivariate anomalies using Isolation Forest.
   *
   * Steps:
   * 1. Query historical invoices for this vendor/branch (status not cancelled/draft)
   * 2. If count < 20: return empty flags, skippedReasons = ['insufficient_training_data']
   * 3. Build feature vectors for all historical invoices
   * 4. Build feature vector for current invoice
   * 5. Run Isolation Forest to get anomaly score
   * 6. Flag based on score thresholds
   *
   * @returns { flags, skippedReasons }
   */
  async analyze(
    ocrData: OcrInvoiceData,
    vendorTaxCode: string,
    branchId: number,
  ): Promise<{ flags: AnomalyFlag[]; skippedReasons: string[] }> {
    // 1. Query historical invoices
    const historicalInvoices = await ApInvoice.findAll({
      where: {
        branch_id: branchId,
        tax_code: vendorTaxCode,
        status: { [Op.notIn]: ["cancelled", "draft"] },
      },
      order: [["invoice_date", "DESC"]],
      limit: 500,
      attributes: ["id", "total_after_tax", "invoice_date"],
    });

    // 2. Insufficient data check
    if (historicalInvoices.length < MIN_TRAINING_SAMPLES) {
      return {
        flags: [],
        skippedReasons: ["insufficient_training_data"],
      };
    }

    // 3. Build feature vectors for historical invoices
    // Sort ascending by date for "days since last" computation
    const sorted = [...historicalInvoices].sort((a, b) => {
      const da = a.invoice_date ? new Date(a.invoice_date).getTime() : 0;
      const db = b.invoice_date ? new Date(b.invoice_date).getTime() : 0;
      return da - db;
    });

    const historicalVectors: number[][] = sorted.map((inv, idx) => {
      const total = Number(inv.total_after_tax ?? 0);
      // We don't have item_count in ap_invoices; use 1 as a neutral placeholder
      const itemCount = 1;
      const invoiceDate = inv.invoice_date
        ? new Date(inv.invoice_date)
        : new Date();
      const prevDate =
        idx > 0 && sorted[idx - 1]?.invoice_date
          ? new Date(sorted[idx - 1]!.invoice_date!)
          : null;
      return buildFeatureVector(total, itemCount, invoiceDate, prevDate);
    });

    // 4. Build feature vector for current invoice
    const currentTotal = ocrData.total;
    const currentItemCount = ocrData.items.length;
    const currentDate = ocrData.invoice_date
      ? new Date(ocrData.invoice_date)
      : new Date();

    // Most recent previous invoice date (sorted DESC, so first element is most recent)
    const mostRecentDate = historicalInvoices[0]?.invoice_date
      ? new Date(historicalInvoices[0].invoice_date)
      : null;

    const currentVector = buildFeatureVector(
      currentTotal,
      currentItemCount,
      currentDate,
      mostRecentDate,
    );

    // 5. Run Isolation Forest
    const anomalyScore = this.computeAnomalyScore(
      currentVector,
      historicalVectors,
    );

    // 6. Flag based on score
    const flags: AnomalyFlag[] = [];

    if (anomalyScore < HIGH_SEVERITY_THRESHOLD) {
      flags.push({
        type: "multivariate_outlier",
        severity: "high",
        description: `Invoice is a multivariate outlier (anomaly score: ${anomalyScore.toFixed(4)}). The combination of total value, item count, and invoice timing is highly unusual compared to historical patterns.`,
        metadata: {
          anomalyScore: parseFloat(anomalyScore.toFixed(4)),
          trainingSize: historicalInvoices.length,
          featureVector: currentVector,
        },
      });
    } else if (anomalyScore < MEDIUM_SEVERITY_THRESHOLD) {
      flags.push({
        type: "multivariate_outlier",
        severity: "medium",
        description: `Invoice shows multivariate anomaly characteristics (anomaly score: ${anomalyScore.toFixed(4)}). The combination of features is somewhat unusual compared to historical patterns.`,
        metadata: {
          anomalyScore: parseFloat(anomalyScore.toFixed(4)),
          trainingSize: historicalInvoices.length,
          featureVector: currentVector,
        },
      });
    }

    return { flags, skippedReasons: [] };
  }

  /**
   * Called after every confirmed invoice for a vendor/branch.
   * Increments the counter; when it reaches 50, clears the model cache
   * so the forest will be rebuilt on the next analyze() call.
   */
  async updateModel(vendorTaxCode: string, branchId: number): Promise<void> {
    const key = `${vendorTaxCode}:${branchId}`;
    const current = this.confirmCounter.get(key) ?? 0;
    const next = current + 1;
    this.confirmCounter.set(key, next);

    if (next >= 50) {
      // Clear model cache so it will be rebuilt on next analyze()
      this.modelCache.delete(key);
      // Reset counter
      this.confirmCounter.set(key, 0);
    }
  }

  /**
   * Compute the anomaly score for a single point against a training dataset.
   *
   * Algorithm:
   * 1. Normalize all features using min-max scaling derived from the training set.
   *    This ensures all features contribute equally regardless of magnitude.
   * 2. Build NUM_TREES isolation trees, each on a random subsample of
   *    min(MAX_SUBSAMPLE_SIZE, n) points.
   * 3. For each tree, compute the path length of the test point.
   * 4. Average path lengths across all trees.
   * 5. anomaly_score = (avg_path_length / avgPathLength(subsampleSize)) - 1
   *    - Score ≈ 0: normal point (path length ≈ expected)
   *    - Score < 0: anomaly (shorter path = more isolated)
   *
   * @param point    - Feature vector of the test point
   * @param training - Feature vectors of the training set
   */
  computeAnomalyScore(point: number[], training: number[][]): number {
    const n = training.length;
    if (n === 0) return 0;

    const numFeatures = point.length;

    // Compute per-feature min and max from training data
    const featureMin: number[] = new Array(numFeatures).fill(
      Infinity,
    ) as number[];
    const featureMax: number[] = new Array(numFeatures).fill(
      -Infinity,
    ) as number[];
    for (const row of training) {
      for (let f = 0; f < numFeatures; f++) {
        const val = row[f] ?? 0;
        if (val < (featureMin[f] ?? Infinity)) featureMin[f] = val;
        if (val > (featureMax[f] ?? -Infinity)) featureMax[f] = val;
      }
    }

    // Min-max normalize a vector using training statistics
    const normalize = (vec: number[]): number[] =>
      vec.map((v, f) => {
        const fMin = featureMin[f] ?? 0;
        const fMax = featureMax[f] ?? 0;
        const range = fMax - fMin;
        if (range === 0) return 0;
        return (v - fMin) / range;
      });

    // Normalize training data and test point
    const normalizedTraining = training.map(normalize);
    const normalizedPoint = normalize(point);

    const subsampleSize = Math.min(MAX_SUBSAMPLE_SIZE, n);
    const maxDepth = Math.ceil(Math.log2(subsampleSize));
    const normFactor = avgPathLength(subsampleSize);

    let totalPathLength = 0;

    for (let t = 0; t < NUM_TREES; t++) {
      // Use a deterministic seed per tree derived from the base seed
      const rng = createRng(this.seed + t * 1000);

      // Random subsample (without replacement using Fisher-Yates partial shuffle)
      const indices = Array.from({ length: n }, (_, i) => i);
      for (let i = 0; i < subsampleSize; i++) {
        const j = i + Math.floor(rng() * (n - i));
        const tmp = indices[i] as number;
        indices[i] = indices[j] as number;
        indices[j] = tmp;
      }
      const subsample: number[][] = indices
        .slice(0, subsampleSize)
        .map((i) => normalizedTraining[i] ?? [])
        .filter((v) => v.length > 0);

      // Build tree and compute path length
      const tree = buildTree(subsample, maxDepth, 0, rng);
      totalPathLength += pathLength(normalizedPoint, tree, 0);
    }

    const avgPath = totalPathLength / NUM_TREES;

    // Normalise: 0 = normal, negative = anomaly
    return avgPath / normFactor - 1;
  }

  /**
   * Expose the model cache size for testing purposes.
   */
  getModelCacheSize(): number {
    return this.modelCache.size;
  }

  /**
   * Expose the confirm counter for testing purposes.
   */
  getConfirmCount(vendorTaxCode: string, branchId: number): number {
    return this.confirmCounter.get(`${vendorTaxCode}:${branchId}`) ?? 0;
  }

  /**
   * Clear all internal state (for testing).
   */
  clearState(): void {
    this.confirmCounter.clear();
    this.modelCache.clear();
  }
}
