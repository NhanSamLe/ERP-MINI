import rateLimit from "express-rate-limit";

/**
 * Rate limit cho chatbot: 20 requests/phút per user (dựa theo IP + userId).
 * Ngăn spam tốn quota OpenAI.
 */
export const chatRateLimit = rateLimit({
  windowMs: 60 * 1000, // 1 phút
  max: 20, // tối đa 20 requests/phút
  keyGenerator: (req) => {
    // Key theo userId nếu đã auth, fallback về IP
    const user = (req as any).user;
    return user?.id ? `user:${user.id}` : (req.ip ?? "unknown");
  },
  handler: (_req, res) => {
    res.status(429).json({
      message: "Bạn gửi quá nhiều tin nhắn. Vui lòng chờ 1 phút rồi thử lại.",
    });
  },
  standardHeaders: true,
  legacyHeaders: false,
  validate: false,
});
