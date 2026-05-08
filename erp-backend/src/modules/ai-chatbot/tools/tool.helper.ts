import axios from "axios";
import { ToolContext, ToolResult } from "../types/llm.types";
import { logger } from "../../../config/logger";

const BASE_URL = process.env.APP_BASE_URL ?? "http://localhost:3000/api";

/**
 * Gọi ERP API nội bộ với JWT token của user hiện tại.
 * Luôn forward token để RBAC được thực thi đúng.
 */
export async function callErpApi(
  path: string,
  params: Record<string, any>,
  context: ToolContext,
): Promise<ToolResult> {
  try {
    const url = `${context.baseUrl || BASE_URL}${path}`;
    logger.info(`[callErpApi] GET ${url}`, { params });
    const response = await axios.get(url, {
      params,
      headers: { Authorization: `Bearer ${context.userToken}` },
      timeout: 10000,
    });
    logger.info(`[callErpApi] Response ${url}`, {
      status: response.status,
      dataLength: Array.isArray(response.data)
        ? response.data.length
        : typeof response.data,
    });
    return { success: true, data: response.data };
  } catch (err: any) {
    if (err.response?.status === 403) {
      return {
        success: false,
        error: "Bạn không có quyền truy cập dữ liệu này",
      };
    }
    return {
      success: false,
      error: err.response?.data?.message ?? err.message ?? "Lỗi không xác định",
    };
  }
}
