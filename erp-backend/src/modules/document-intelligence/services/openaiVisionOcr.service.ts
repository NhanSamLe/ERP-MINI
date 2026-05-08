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

const SYSTEM_PROMPT = `You are an invoice OCR assistant. Extract invoice data from the provided document and return ONLY a valid JSON object with the following fields:
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

            messages = [
              { role: "system", content: SYSTEM_PROMPT },
              {
                role: "user",
                content: `Extract invoice data from the following invoice text:\n\n${pdfText}`,
              },
            ];
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
