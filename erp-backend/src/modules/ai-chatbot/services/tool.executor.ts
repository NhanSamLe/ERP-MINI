import { ToolCall, ToolContext, ToolResult } from "../types/llm.types";
import { getTool } from "../tools/registry";
import { logger } from "../../../config/logger";

export class ToolExecutor {
  /**
   * Thực thi một tool call từ LLM.
   * Không throw exception — luôn trả về ToolResult để LLM có thể xử lý lỗi.
   */
  async execute(toolCall: ToolCall, context: ToolContext): Promise<ToolResult> {
    const tool = getTool(toolCall.name);

    if (!tool) {
      logger.warn(`[ToolExecutor] Tool không tồn tại: ${toolCall.name}`);
      return {
        success: false,
        error: `Tool "${toolCall.name}" không tồn tại trong hệ thống`,
      };
    }

    try {
      logger.info(`[ToolExecutor] Thực thi tool: ${toolCall.name}`, {
        args: toolCall.arguments,
      });
      const result = await tool.execute(toolCall.arguments, context);
      if (!result.success) {
        logger.warn(`[ToolExecutor] Tool thất bại: ${toolCall.name}`, {
          error: result.error,
        });
      } else {
        logger.info(`[ToolExecutor] Tool thành công: ${toolCall.name}`, {
          dataLength: Array.isArray(result.data)
            ? result.data.length
            : typeof result.data,
        });
      }
      return result;
    } catch (err: any) {
      const errorMsg = err?.message ?? "Lỗi không xác định khi thực thi tool";
      logger.error(
        `[ToolExecutor] Lỗi khi thực thi tool ${toolCall.name}:`,
        err,
      );
      return { success: false, error: errorMsg };
    }
  }

  /**
   * Thực thi nhiều tool calls song song.
   */
  async executeAll(
    toolCalls: ToolCall[],
    context: ToolContext,
  ): Promise<ToolResult[]> {
    return Promise.all(toolCalls.map((tc) => this.execute(tc, context)));
  }
}
