import OpenAI from "openai";
import { BlogPost } from "../models/blogPost.model";
import { Product } from "../../product/models/product.model";
import { User } from "../../auth/models/user.model";
import { CreateBlogPostDto, UpdateBlogPostDto, GeneratePRBlogDto } from "../types/blog.types";
import { Op } from "sequelize";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || process.env.LLM_API_KEY,
});

export class BlogService {
  /**
   * Lấy danh sách bài viết blog
   */
  async getBlogPostList(filters: { status?: string; search?: string; productId?: number }) {
    const whereClause: any = {};

    if (filters.status) {
      whereClause.status = filters.status;
    }

    if (filters.productId) {
      whereClause.product_id = filters.productId;
    }

    if (filters.search) {
      whereClause[Op.or] = [
        { title: { [Op.like]: `%${filters.search}%` } },
        { content: { [Op.like]: `%${filters.search}%` } },
      ];
    }

    return await BlogPost.findAll({
      where: whereClause,
      include: [
        {
          model: User,
          as: "author",
          attributes: ["id", "username", "full_name", "email"],
        },
        {
          model: Product,
          as: "product",
          attributes: ["id", "name", "sku", "sale_price", "image_url"],
        },
      ],
      order: [["created_at", "DESC"]],
    });
  }

  /**
   * Lấy chi tiết bài viết blog theo ID hoặc Slug
   */
  async getBlogPostByIdOrSlug(idOrSlug: string) {
    const isId = /^\d+$/.test(idOrSlug);
    const whereClause = isId ? { id: idOrSlug } : { slug: idOrSlug };

    const post = await BlogPost.findOne({
      where: whereClause,
      include: [
        {
          model: User,
          as: "author",
          attributes: ["id", "username", "full_name", "email"],
        },
        {
          model: Product,
          as: "product",
          attributes: ["id", "name", "sku", "sale_price", "image_url", "description"],
        },
      ],
    });

    if (!post) {
      throw new Error("Không tìm thấy bài viết.");
    }

    return post;
  }

  /**
   * Tạo bài viết mới
   */
  async createBlogPost(data: CreateBlogPostDto, authorId: number) {
    // Kiểm tra trùng slug
    const existing = await BlogPost.findOne({ where: { slug: data.slug } });
    if (existing) {
      throw new Error(`Đường dẫn tĩnh (Slug) "${data.slug}" đã tồn tại. Vui lòng nhập slug khác.`);
    }

    // Nếu có product_id, kiểm tra xem sản phẩm có tồn tại không
    if (data.product_id) {
      const product = await Product.findByPk(data.product_id);
      if (!product) {
        throw new Error("Sản phẩm liên kết không tồn tại.");
      }
    }

    return await BlogPost.create({
      ...data,
      author_id: authorId,
    });
  }

  /**
   * Cập nhật bài viết
   */
  async updateBlogPost(id: number, data: UpdateBlogPostDto) {
    const post = await BlogPost.findByPk(id);
    if (!post) {
      throw new Error("Không tìm thấy bài viết cần cập nhật.");
    }

    // Kiểm tra trùng slug nếu có đổi slug
    if (data.slug && data.slug !== post.slug) {
      const existing = await BlogPost.findOne({ where: { slug: data.slug } });
      if (existing) {
        throw new Error(`Đường dẫn tĩnh (Slug) "${data.slug}" đã tồn tại. Vui lòng chọn slug khác.`);
      }
    }

    // Kiểm tra sản phẩm
    if (data.product_id) {
      const product = await Product.findByPk(data.product_id);
      if (!product) {
        throw new Error("Sản phẩm liên kết không tồn tại.");
      }
    }

    return await post.update(data);
  }

  /**
   * Xóa bài viết
   */
  async deleteBlogPost(id: number) {
    const post = await BlogPost.findByPk(id);
    if (!post) {
      throw new Error("Không tìm thấy bài viết cần xóa.");
    }
    await post.destroy();
    return true;
  }

  /**
   * Sinh bài viết bằng AI dựa trên thông tin sản phẩm
   */
  async generatePRBlog(dto: GeneratePRBlogDto) {
    const product = await Product.findByPk(dto.productId);
    if (!product) {
      throw new Error("Không tìm thấy sản phẩm yêu cầu.");
    }

    const provider = process.env.RAG_PROVIDER || "openai";
    const activeModel = provider === "openai" ? "gpt-4o-mini" : "qwen2.5:7b";

    // Format các thông tin sản phẩm
    const formattedPrice = product.sale_price 
      ? new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(product.sale_price)
      : "Liên hệ";

    const systemPrompt = `Bạn là một chuyên gia Content Marketing chuyên viết blog giới thiệu và quảng bá sản phẩm (PR) cho doanh nghiệp.
Nhiệm vụ của bạn là viết một bài viết blog chuẩn SEO, hấp dẫn để giới thiệu sản phẩm sau:
- Tên sản phẩm: ${product.name}
- Giá bán: ${formattedPrice}
- SKU: ${product.sku}
- Xuất xứ: ${product.origin || "Không rõ"}
- Mô tả chi tiết: ${product.description || "Chưa có mô tả chi tiết"}
- Ghi chú/Đặc tính: ${product.notes || "Không có"}

Yêu cầu về phong cách và định dạng bài viết:
1. Giọng điệu (Tone): ${this.getToneVietnamese(dto.tone)}
2. Mục tiêu viết bài: ${this.getGoalVietnamese(dto.targetGoal)}
3. Ghi chú bổ sung từ người dùng: ${dto.additionalNotes || "Không có"}
4. Định dạng đầu ra: Bắt buộc ở định dạng JSON object chứa các trường sau:
   - title: Tiêu đề bài viết hấp dẫn, thu hút người đọc (không chứa ký tự Markdown như #, **, v.v.)
   - content: Nội dung bài viết hoàn chỉnh bằng Markdown (bao gồm tiêu đề lớn #, các đề mục lớn nhỏ ##, ###, đoạn văn, bullet points, v.v.)
   - summary: Đoạn tóm tắt bài viết ngắn gọn khoảng 2-3 câu (phù hợp làm meta description)
   - seo_title: Tiêu đề SEO gợi ý (dưới 60 ký tự)
   - seo_meta_desc: Đoạn mô tả SEO gợi ý (dưới 160 ký tự)
   - seo_keywords: Từ khóa SEO liên quan (ngăn cách bằng dấu phẩy)

Hãy trả về một đối tượng JSON hợp lệ duy nhất có cấu trúc đúng như trên.`;

    if (provider === "openai") {
      const response = await openai.chat.completions.create({
        model: activeModel,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Hãy viết bài PR cho sản phẩm ${product.name} ngay bây giờ theo định dạng JSON yêu cầu.` }
        ],
        response_format: { type: "json_object" },
        temperature: 0.7,
      });

      const resultText = response.choices[0]?.message?.content || "{}";
      try {
        return JSON.parse(resultText);
      } catch (err) {
        throw new Error("Lỗi định dạng dữ liệu trả về từ AI: " + resultText);
      }
    } else {
      // Local LLM (nếu có dự phòng)
      throw new Error("Chế độ Local LLM không hỗ trợ định dạng xuất ra JSON của Blog. Vui lòng chuyển sang nhà cung cấp OpenAI.");
    }
  }

  /**
   * Sinh bài viết AI dạng Stream (SSE) để tạo hiệu ứng viết trực tiếp
   */
  async *generatePRBlogStream(dto: GeneratePRBlogDto): AsyncGenerator<string, void, unknown> {
    const product = await Product.findByPk(dto.productId);
    if (!product) {
      throw new Error("Không tìm thấy sản phẩm yêu cầu.");
    }

    const provider = process.env.RAG_PROVIDER || "openai";
    const activeModel = provider === "openai" ? "gpt-4o-mini" : "qwen2.5:7b";

    const formattedPrice = product.sale_price 
      ? new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(product.sale_price)
      : "Liên hệ";

    const systemPrompt = `Bạn là một chuyên gia Content Marketing chuyên viết blog giới thiệu và quảng bá sản phẩm (PR) cho doanh nghiệp.
Nhiệm vụ của bạn là viết một bài viết blog chuẩn SEO, hấp dẫn để giới thiệu sản phẩm sau:
- Tên sản phẩm: ${product.name}
- Giá bán: ${formattedPrice}
- SKU: ${product.sku}
- Xuất xứ: ${product.origin || "Không rõ"}
- Mô tả chi tiết: ${product.description || "Chưa có mô tả chi tiết"}
- Ghi chú/Đặc tính: ${product.notes || "Không có"}

Yêu cầu về phong cách và định dạng bài viết:
1. Giọng điệu (Tone): ${this.getToneVietnamese(dto.tone)}
2. Mục tiêu viết bài: ${this.getGoalVietnamese(dto.targetGoal)}
3. Ghi chú bổ sung từ người dùng: ${dto.additionalNotes || "Không có"}
4. Định dạng đầu ra: Hãy viết trực tiếp nội dung bài viết dưới dạng **Markdown** hoàn chỉnh (bao gồm tiêu đề lớn #, đề mục ##, ###, bullet points, v.v.). Không bao bọc trong định dạng JSON. Viết trực tiếp nội dung bài viết.`;

    if (provider === "openai") {
      const responseStream = await openai.chat.completions.create({
        model: activeModel,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Hãy viết bài PR cho sản phẩm ${product.name} ngay.` }
        ],
        stream: true,
        temperature: 0.7,
      });

      for await (const chunk of responseStream) {
        const content = chunk.choices[0]?.delta?.content || "";
        if (content) {
          yield content;
        }
      }
    } else {
      throw new Error("Chế độ Local LLM không hỗ trợ Stream. Vui lòng chuyển sang nhà cung cấp OpenAI.");
    }
  }

  private getToneVietnamese(tone: string): string {
    switch (tone) {
      case "persuasive": return "Thuyết phục, lôi cuốn, thúc đẩy mua hàng";
      case "humorous": return "Hài hước, gần gũi, trẻ trung, dí dỏ";
      case "curious": return "Khơi gợi sự tò mò, tạo sự bí ẩn và hứng thú";
      case "professional":
      default:
        return "Chuyên nghiệp, đáng tin cậy, lịch sự, khách quan";
    }
  }

  private getGoalVietnamese(goal: string): string {
    switch (goal) {
      case "promotion": return "Tập trung quảng bá chương trình khuyến mãi, giảm giá và kêu gọi chốt đơn nhanh";
      case "comparison": return "So sánh các đặc điểm nổi bật của sản phẩm này so với các sản phẩm đối thủ hoặc sản phẩm cùng phân khúc khác để thấy lợi thế vượt trội";
      case "feature":
      default:
        return "Tập trung nêu bật các tính năng công nghệ, công dụng và giải pháp hữu ích mà sản phẩm đem lại cho khách hàng";
    }
  }
}

export const blogService = new BlogService();
