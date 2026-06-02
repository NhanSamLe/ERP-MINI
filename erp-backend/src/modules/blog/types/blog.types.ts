export interface CreateBlogPostDto {
  title: string;
  slug: string;
  content: string;
  summary?: string;
  status?: "draft" | "published";
  product_id?: number;
  seo_title?: string;
  seo_meta_desc?: string;
  seo_keywords?: string;
  image_url?: string;
}

export interface UpdateBlogPostDto {
  title?: string;
  slug?: string;
  content?: string;
  summary?: string;
  status?: "draft" | "published";
  product_id?: number;
  seo_title?: string;
  seo_meta_desc?: string;
  seo_keywords?: string;
  image_url?: string;
}

export interface GeneratePRBlogDto {
  productId: number;
  tone: "professional" | "persuasive" | "humorous" | "curious";
  targetGoal: "feature" | "promotion" | "comparison";
  additionalNotes?: string;
}
