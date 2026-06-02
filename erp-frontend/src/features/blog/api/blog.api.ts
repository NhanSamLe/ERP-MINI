import axiosClient from "../../../api/axiosClient";
import { BlogPost, CreateBlogPostInput, UpdateBlogPostInput, GeneratePRInput, GeneratePRResponse } from "../dto/blog.dto";

/**
 * Lấy danh sách bài viết blog
 */
export const getBlogPosts = async (filters?: { status?: string; search?: string; product_id?: number }) => {
  const response = await axiosClient.get<{ success: boolean; data: BlogPost[] }>("/blog", {
    params: filters,
  });
  return response.data.data;
};

/**
 * Lấy chi tiết bài viết blog theo ID hoặc Slug
 */
export const getBlogPost = async (idOrSlug: string) => {
  const response = await axiosClient.get<{ success: boolean; data: BlogPost }>(`/blog/${idOrSlug}`);
  return response.data.data;
};

/**
 * Tạo bài viết mới
 */
export const createBlogPost = async (data: CreateBlogPostInput) => {
  const response = await axiosClient.post<{ success: boolean; data: BlogPost; message: string }>("/blog", data);
  return response.data;
};

/**
 * Cập nhật bài viết
 */
export const updateBlogPost = async (id: number, data: UpdateBlogPostInput) => {
  const response = await axiosClient.put<{ success: boolean; data: BlogPost; message: string }>(`/blog/${id}`, data);
  return response.data;
};

/**
 * Xóa bài viết
 */
export const deleteBlogPost = async (id: number) => {
  const response = await axiosClient.delete<{ success: boolean; message: string }>(`/blog/${id}`);
  return response.data;
};

/**
 * Sinh bài viết PR sản phẩm (Phản hồi JSON)
 */
export const generatePRBlog = async (data: GeneratePRInput) => {
  const response = await axiosClient.post<{ success: boolean; data: GeneratePRResponse }>("/blog/generate", data);
  return response.data.data;
};

/**
 * Sinh bài viết PR sản phẩm (Streaming SSE)
 */
export const generatePRBlogStream = async (
  data: GeneratePRInput,
  accessToken: string,
  onChunk: (text: string) => void,
  onDone: () => void,
  onError: (err: any) => void
) => {
  try {
    const baseUrl = import.meta.env.VITE_API_URL || "http://localhost:8888/api";
    const response = await fetch(`${baseUrl}/blog/generate/stream`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error("No readable stream in response");
    }

    const decoder = new TextDecoder("utf-8");
    let buffer = "";

    while (true) {
      const { value, done } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() || ""; // Giữ phần dư trong buffer

      for (const line of lines) {
        const cleanedLine = line.trim();
        if (!cleanedLine) continue;

        if (cleanedLine.startsWith("data: ")) {
          const dataStr = cleanedLine.replace("data: ", "").trim();
          if (dataStr === "[DONE]") {
            continue;
          }

          try {
            const dataObj = JSON.parse(dataStr);
            if (dataObj.chunk) {
              onChunk(dataObj.chunk);
            } else if (dataObj.error) {
              onError(new Error(dataObj.error));
            }
          } catch (e) {
            console.error("Failed to parse SSE chunk:", e);
          }
        }
      }
    }
    
    onDone();
  } catch (err: any) {
    console.error("[generatePRBlogStream API Error]:", err);
    onError(err);
  }
};
