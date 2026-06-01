import rateLimit from "express-rate-limit";

/**
 * Rate limit for invoice upload: 10 requests per minute per user.
 * Requirements: 10.6
 */
export const uploadRateLimit = rateLimit({
  windowMs: 60 * 1000, // 1 phút
  max: 10,
  keyGenerator: (req) => {
    const user = (req as any).user;
    return user?.id ? `user:${user.id}` : (req.ip ?? "unknown");
  },
  handler: (_req, res) => {
    res.status(429).json({
      message: "Bạn đã vượt quá giới hạn upload. Vui lòng thử lại sau 1 phút.",
    });
  },
  standardHeaders: true,
  legacyHeaders: false,
  validate: false,
});

/**
 * Rate limit for status check: 100 requests per minute per user.
 * Requirements: 10.6
 */
export const statusCheckRateLimit = rateLimit({
  windowMs: 60 * 1000, // 1 phút
  max: 100,
  keyGenerator: (req) => {
    const user = (req as any).user;
    return user?.id ? `user:${user.id}` : (req.ip ?? "unknown");
  },
  handler: (_req, res) => {
    res.status(429).json({
      message:
        "Bạn đã vượt quá giới hạn kiểm tra trạng thái. Vui lòng thử lại sau 1 phút.",
    });
  },
  standardHeaders: true,
  legacyHeaders: false,
  validate: false,
});
