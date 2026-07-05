import fs from "fs";
import path from "path";
import OpenAI from "openai";
import pdfParse from "pdf-parse";
import { IOcrEngine, OcrRawResult } from "../types/ocr.types";
import { logger } from "../../../config/logger";

const IMAGE_MIME_MAP: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
};

const SYSTEM_PROMPT = `You are an invoice OCR assistant. Extract invoice data from the provided document.

IMPORTANT FOR VIETNAMESE INVOICES:
- Vietnamese invoices use dot (.) as a thousands separator and comma (,) as a decimal separator. For example, "4.900.500" means 4900500, NOT 490.5 or 490500. "25.000.000" means 25000000. "990.000" means 990000. Please parse all numbers carefully according to this rule. Do not lose digits.
  - Double-check that the extracted numbers match the document:
    - Extract all fields and line items exactly as they are printed on the invoice.
    - If there is a document-level discount (e.g., "Chiết khấu tổng đơn hàng"), do not attempt to perform calculations or distribute it yourself. Simply extract the line items, subtotal, tax_amount, and total exactly as written. The system backend will automatically reconcile the discount mathematically.
    - Ensure \`tax_amount\` and \`total\` are read correctly.

Return ONLY a valid JSON object with the following fields:
{
  "vendor_name": "string",
  "vendor_tax_code": "string",
  "invoice_no": "string",
  "invoice_series": "string or null",
  "invoice_template": "string or null",
  "invoice_date": "string (YYYY-MM-DD or DD/MM/YYYY)",
  "items": [
    {
      "name": "string",
      "qty": number,
      "unit": "string",
      "unit_price": number,
      "tax_rate": number,
      "discount_percent": number,
      "discount_amount": number,
      "amount": number
    }
  ],
  "subtotal": number,
  "tax_amount": number,
  "total": number
}
Return ONLY the JSON object, no markdown, no explanation.`;

export class OpenAIVisionOcr implements IOcrEngine {
  private client: OpenAI;
  private model: string;
  private timeoutMs: number;

  constructor(
    apiKey: string,
    model: string = "gpt-4o-mini",
    timeoutMs: number = 25000,
  ) {
    this.client = new OpenAI({ apiKey });
    this.model = model;
    this.timeoutMs = timeoutMs;
  }

  async extract(filePath: string): Promise<OcrRawResult> {
    const startTime = Date.now();
    const ext = path.extname(filePath).toLowerCase().replace(".", "");
    const isPdf = ext === "pdf";

    let lastError: Error | null = null;

    for (let attempt = 0; attempt < 2; attempt++) {
      if (attempt > 0) {
        await new Promise((resolve) => setTimeout(resolve, 3000));
      }

      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.timeoutMs);

        let rawText: string;
        try {
          let messages: any[];

          if (isPdf) {
            // PDF: extract text content and send as text message
            const fileBuffer = fs.readFileSync(filePath);
            const pdfData = await pdfParse(fileBuffer);
            const pdfText = pdfData.text?.trim() || "";

            if (pdfText.length < 20) {
              // PDF dạng ảnh (Scanned PDF) -> mượn tạm Cloudinary để convert PDF sang Ảnh
              const { uploadBufferToCloudinary, deleteFromCloudinary } = require("../../../core/utils/uploadCloudinary");
              const cloudinaryResult = await uploadBufferToCloudinary(fileBuffer, "ocr_temp");
              
              // Đổi extension sang .jpg để ép Cloudinary render trang đầu tiên thành Ảnh
              const imageUrl = cloudinaryResult.url.replace(/\.pdf$/i, ".jpg");

              messages = [
                { role: "system", content: SYSTEM_PROMPT },
                {
                  role: "user",
                  content: [
                    {
                      type: "image_url",
                      image_url: { url: imageUrl },
                    },
                  ],
                },
              ];

              // Dọn dẹp Cloudinary sau 2 phút (để OpenAI kịp kéo ảnh về)
              setTimeout(() => {
                deleteFromCloudinary(cloudinaryResult.public_id).catch((err: any) => {
                  logger.warn(`Failed to cleanup temp OCR cloudinary image: ${err.message}`);
                });
              }, 120000);
            } else {
              messages = [
                { role: "system", content: SYSTEM_PROMPT },
                {
                  role: "user",
                  content: `Extract invoice data from the following invoice text:\n\n${pdfText}`,
                },
              ];
            }
          } else {
            // Image (jpg/jpeg/png): send as base64 image_url
            const fileBuffer = fs.readFileSync(filePath);
            const base64Data = fileBuffer.toString("base64");
            const mimeType = IMAGE_MIME_MAP[ext] || "image/jpeg";
            const dataUrl = `data:${mimeType};base64,${base64Data}`;

            messages = [
              { role: "system", content: SYSTEM_PROMPT },
              {
                role: "user",
                content: [
                  {
                    type: "image_url",
                    image_url: { url: dataUrl },
                  },
                ],
              },
            ];
          }

          const response = await this.client.chat.completions.create(
            {
              model: this.model,
              max_tokens: 1500,
              messages,
            },
            { signal: controller.signal as any },
          );

          rawText = response.choices[0]?.message?.content ?? "";
        } finally {
          clearTimeout(timeoutId);
        }

        // Strip markdown code fences if present, then parse JSON
        const cleaned = rawText
          .replace(/^```(?:json)?\s*/i, "")
          .replace(/\s*```$/, "")
          .trim();
        const structured_data = JSON.parse(cleaned);

        const processing_time_ms = Date.now() - startTime;
        return { raw_text: rawText, structured_data, processing_time_ms };
      } catch (err: any) {
        lastError = err;
        if (attempt === 0) {
          logger.warn(
            `OpenAIVisionOcr: attempt ${attempt + 1} failed, retrying in 3s — ${err?.message}`,
          );
        }
      }
    }

    throw lastError;
  }
}
