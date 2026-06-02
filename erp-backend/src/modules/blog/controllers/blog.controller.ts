import { Request, Response } from "express";
import { blogService } from "../services/blog.service";
import { CreateBlogPostDto, UpdateBlogPostDto, GeneratePRBlogDto } from "../types/blog.types";

export class BlogController {
  /**
   * GET /api/blog
   */
  async getList(req: Request, res: Response): Promise<void> {
    try {
      const { status, search, product_id } = req.query;
      const filters: any = {};
      
      if (status) filters.status = status as string;
      if (search) filters.search = search as string;
      if (product_id) filters.productId = Number(product_id);

      const posts = await blogService.getBlogPostList(filters);
      res.status(200).json({ success: true, data: posts });
    } catch (err: any) {
      console.error("[BlogController] getList error:", err);
      res.status(500).json({ success: false, error: err.message || "Internal server error" });
    }
  }

  /**
   * GET /api/blog/:idOrSlug
   */
  async getDetail(req: Request, res: Response): Promise<void> {
    try {
      const { idOrSlug } = req.params;
      if (!idOrSlug) {
        res.status(400).json({ success: false, error: "Tham số idOrSlug là bắt buộc." });
        return;
      }
      const post = await blogService.getBlogPostByIdOrSlug(idOrSlug);
      res.status(200).json({ success: true, data: post });
    } catch (err: any) {
      console.error("[BlogController] getDetail error:", err);
      res.status(404).json({ success: false, error: err.message || "Không tìm thấy bài viết" });
    }
  }

  /**
   * POST /api/blog
   */
  async create(req: Request, res: Response): Promise<void> {
    try {
      const body = req.body as CreateBlogPostDto;
      
      // Basic validation
      if (!body.title?.trim() || !body.content?.trim() || !body.slug?.trim()) {
        res.status(400).json({ success: false, error: "Tiêu đề (title), nội dung (content) và đường dẫn tĩnh (slug) là bắt buộc." });
        return;
      }

      // Giả sử user_id được gắn vào request từ authMiddleware
      const authorId = (req as any).user?.id || 1; // Fallback về 1 (ADMIN) nếu đang test

      const post = await blogService.createBlogPost(body, authorId);
      res.status(201).json({ success: true, data: post, message: "Tạo bài viết mới thành công." });
    } catch (err: any) {
      console.error("[BlogController] create error:", err);
      res.status(400).json({ success: false, error: err.message || "Internal server error" });
    }
  }

  /**
   * PUT /api/blog/:id
   */
  async update(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const body = req.body as UpdateBlogPostDto;

      const post = await blogService.updateBlogPost(Number(id), body);
      res.status(200).json({ success: true, data: post, message: "Cập nhật bài viết thành công." });
    } catch (err: any) {
      console.error("[BlogController] update error:", err);
      res.status(400).json({ success: false, error: err.message || "Internal server error" });
    }
  }

  /**
   * DELETE /api/blog/:id
   */
  async delete(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      await blogService.deleteBlogPost(Number(id));
      res.status(200).json({ success: true, message: "Xóa bài viết thành công." });
    } catch (err: any) {
      console.error("[BlogController] delete error:", err);
      res.status(400).json({ success: false, error: err.message || "Internal server error" });
    }
  }

  /**
   * POST /api/blog/generate
   */
  async generatePR(req: Request, res: Response): Promise<void> {
    try {
      const body = req.body as GeneratePRBlogDto;

      if (!body.productId) {
        res.status(400).json({ success: false, error: "Mã sản phẩm (productId) là bắt buộc." });
        return;
      }

      const result = await blogService.generatePRBlog(body);
      res.status(200).json({ success: true, data: result });
    } catch (err: any) {
      console.error("[BlogController] generatePR error:", err);
      res.status(500).json({ success: false, error: err.message || "Internal server error" });
    }
  }

  /**
   * POST /api/blog/generate/stream
   */
  async generatePRStream(req: Request, res: Response): Promise<void> {
    try {
      const body = req.body as GeneratePRBlogDto;

      if (!body.productId) {
        res.status(400).json({ success: false, error: "Mã sản phẩm (productId) là bắt buộc." });
        return;
      }

      // Thiết lập SSE stream headers
      res.setHeader("Content-Type", "text/event-stream");
      res.setHeader("Cache-Control", "no-cache");
      res.setHeader("Connection", "keep-alive");
      res.flushHeaders();

      const generator = blogService.generatePRBlogStream(body);

      for await (const chunk of generator) {
        res.write(`data: ${JSON.stringify({ chunk })}\n\n`);
      }

      res.write("data: [DONE]\n\n");
      res.end();
    } catch (err: any) {
      console.error("[BlogController] generatePRStream error:", err);
      res.write(`data: ${JSON.stringify({ error: err.message || "Internal server error" })}\n\n`);
      res.end();
    }
  }
}

export const blogController = new BlogController();
