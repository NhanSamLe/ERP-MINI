export interface BlogPost {
  id: number;
  title: string;
  slug: string;
  content: string;
  summary: string | null;
  status: "draft" | "published";
  author_id: number;
  product_id: number | null;
  seo_title: string | null;
  seo_meta_desc: string | null;
  seo_keywords: string | null;
  image_url: string | null;
  created_at: string;
  updated_at: string;
  author?: {
    id: number;
    username: string;
    full_name?: string;
    email: string;
  };
  product?: {
    id: number;
    name: string;
    sku: string;
    sale_price: number;
    image_url: string | null;
    description?: string;
  };
}

export interface CreateBlogPostInput {
  title: string;
  slug: string;
  content: string;
  summary?: string;
  status?: "draft" | "published";
  product_id?: number | null;
  seo_title?: string;
  seo_meta_desc?: string;
  seo_keywords?: string;
  image_url?: string;
}

export interface UpdateBlogPostInput {
  title?: string;
  slug?: string;
  content?: string;
  summary?: string;
  status?: "draft" | "published";
  product_id?: number | null;
  seo_title?: string;
  seo_meta_desc?: string;
  seo_keywords?: string;
  image_url?: string;
}

export interface GeneratePRInput {
  productId: number;
  tone: "professional" | "persuasive" | "humorous" | "curious";
  targetGoal: "feature" | "promotion" | "comparison";
  additionalNotes?: string;
}

export interface GeneratePRResponse {
  title: string;
  content: string;
  summary: string;
  seo_title: string;
  seo_meta_desc: string;
  seo_keywords: string;
}
