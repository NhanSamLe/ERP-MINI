export class ResponseParser {
  /**
   * Parse narrative response từ Claude
   */
  static parseNarrative(text: string) {
    return {
      narrative: text,
      keyInsights: this.extractKeyInsights(text),
      risks: this.extractRisks(text),
      recommendations: this.extractRecommendations(text),
    };
  }

  /**
   * Trích xuất key insights
   */
  private static extractKeyInsights(text: string): string[] {
    const keywords = [
      "tăng",
      "giảm",
      "đáng chú ý",
      "cải thiện",
      "sụt giảm",
      "nổi bật",
    ];
    const sentences = text.split(/[.!?]+/).filter((s) => s.trim());

    return sentences
      .filter((s) => keywords.some((k) => s.toLowerCase().includes(k)))
      .slice(0, 3)
      .map((s) => s.trim());
  }

  /**
   * Trích xuất risks
   */
  private static extractRisks(text: string): string[] {
    const riskKeywords = [
      "rủi ro",
      "nguy cơ",
      "cảnh báo",
      "cần chú ý",
      "vấn đề",
      "thiếu",
      "giảm",
    ];
    const sentences = text.split(/[.!?]+/).filter((s) => s.trim());

    return sentences
      .filter((s) => riskKeywords.some((k) => s.toLowerCase().includes(k)))
      .slice(0, 2)
      .map((s) => s.trim());
  }

  /**
   * Trích xuất recommendations
   */
  private static extractRecommendations(text: string): string[] {
    const recKeywords = [
      "nên",
      "khuyến nghị",
      "cần",
      "hành động",
      "thực hiện",
      "tối ưu",
    ];
    const sentences = text.split(/[.!?]+/).filter((s) => s.trim());

    return sentences
      .filter((s) => recKeywords.some((k) => s.toLowerCase().includes(k)))
      .slice(0, 2)
      .map((s) => s.trim());
  }

  /**
   * Validate response quality
   */
  static validateResponse(text: string): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!text || text.trim().length === 0) {
      errors.push("Response is empty");
    }

    if (text.length < 100) {
      errors.push("Response is too short (< 100 characters)");
    }

    if (text.length > 2000) {
      errors.push("Response is too long (> 2000 characters)");
    }

    // Check for common LLM errors
    if (text.includes("[PLACEHOLDER]") || text.includes("[TODO]")) {
      errors.push("Response contains placeholders");
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }
}
