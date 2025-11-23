export interface Product {
  id: number;
  category_id?: number;
  sku: string;
  name: string;
  barcode?: string;
  uom?: string;
  origin?: string;
  cost_price?: number;
  sale_price?: number;
  tax_rate_id?: number;
  description?: string;
  status: "active" | "inactive";
  image_url?: string | null;
  image_public_id?: string | null;
  created_at: string;
  updated_at?: string;
  images?: ProductImage[];
}

export interface ProductCategory {
  id: number;
  name: string;
  parent_id?: number | null;
  created_at: string;
  updated_at?: string;
  children?: ProductCategory[];
}

export interface ProductImage {
  id: number;
  product_id: number;
  image_url: string;
  image_public_id: string;
  created_at: string;
  updated_at?: string;
}

export interface ProductCreateInput {
  category_id: number;
  sku: string;
  name: string;
  barcode?: string;
  uom?: string;
  origin?: string;
  cost_price?: number;
  sale_price?: number;
  tax_rate_id?: number;
  description?: string;
  status: "active" | "inactive";
  thumbnail: File | null;
  gallery: File[];
}

export interface ProductUpdateInput {
  category_id: number;
  sku: string;
  name: string;
  barcode?: string;
  uom?: string;
  origin?: string;
  cost_price?: number;
  sale_price?: number;
  tax_rate_id?: number;
  description?: string;
  status: "active" | "inactive";
  thumbnail: File | null;
  gallery: File[];
}

export interface ProductState {
  items: Product[];
  categories: ProductCategory[];
  selectedProduct?: Product;
  loading: boolean;
  error: string | null;
}
