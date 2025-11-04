export interface Product {
  id: number;
  sku: string;
  name: string;
  sale_price?: number;
  status: "active" | "inactive";
  image_url?: string | null;
  created_at: string;
}
