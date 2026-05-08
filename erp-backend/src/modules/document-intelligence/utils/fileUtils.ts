import { randomUUID } from "crypto";
import path from "path";
import fs from "fs";
import { promisify } from "util";

const rename = promisify(fs.rename);
const copyFile = promisify(fs.copyFile);
const unlink = promisify(fs.unlink);
const mkdir = promisify(fs.mkdir);

/**
 * Sanitize a filename by removing path traversal sequences and unsafe characters.
 * Also fixes Latin-1 / mojibake encoding that multer sometimes produces for
 * non-ASCII filenames (e.g. Vietnamese characters).
 * Requirements: 10.5
 */
export function sanitizeFilename(filename: string): string {
  // Fix mojibake: multer may decode the filename as Latin-1 instead of UTF-8.
  // Detect by checking if re-encoding as Latin-1 then decoding as UTF-8 gives valid text.
  let fixed = filename;
  try {
    const bytes = Buffer.from(filename, "latin1");
    const decoded = bytes.toString("utf8");
    // Only use the decoded version if it looks like valid UTF-8 (no replacement chars)
    if (!decoded.includes("\uFFFD") && decoded !== filename) {
      fixed = decoded;
    }
  } catch {
    // keep original
  }

  return fixed
    .replace(/\.\.[/\\]/g, "") // remove ../  and ..\
    .replace(/[/\\]/g, "") // remove remaining / and \
    .replace(/\0/g, "") // remove null bytes
    .trim();
}

/**
 * Generate a storage path for an uploaded invoice file.
 * Requirements: 1.4
 */
export function generateStoragePath(
  branchId: number,
  originalFilename: string,
): { storagePath: string; uuid: string; ext: string } {
  const uuid = randomUUID();
  const ext = path.extname(originalFilename).toLowerCase().replace(".", "");
  const storagePath = `uploads/invoices/${branchId}/${uuid}.${ext}`;
  return { storagePath, uuid, ext };
}

/**
 * Move a file from a temporary path to its final storage path.
 * Creates the destination directory if it does not exist.
 * Falls back to copy+delete if cross-device rename fails.
 * Requirements: 10.5
 */
export async function moveFileToFinalPath(
  tempPath: string,
  finalPath: string,
): Promise<void> {
  const dir = path.dirname(finalPath);
  await mkdir(dir, { recursive: true });

  try {
    await rename(tempPath, finalPath);
  } catch (err: any) {
    // EXDEV: cross-device link — fall back to copy then delete
    if (err.code === "EXDEV") {
      await copyFile(tempPath, finalPath);
      await unlink(tempPath);
    } else {
      throw err;
    }
  }
}
