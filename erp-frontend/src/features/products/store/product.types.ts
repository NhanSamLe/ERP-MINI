export interface Product {
  id: number;
  category_id?: number;
  sku: string;
  name: string;
  barcode?: string;
  // UOM
  uom_id?: number | null;
  purchase_uom_id?: number | null;
  uom?: {
    id: number;
    code: string;
    name: string;
  } | null;
  purchaseUom?: {
    id: number;
    code: string;
    name: string;
  } | null;
  // Product type & source
  product_type?: "storable" | "consumable" | "service";
  source_type?: "purchased" | "manufactured";
  min_stock_qty?: number | null;
  // Extra attributes
  internal_ref?: string | null;
  weight?: number | null;
  volume?: number | null;
  warranty_months?: number | null;
  notes?: string | null;
  // Pricing
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
  taxRate?: {
    id: number;
    name: string;
    rate: number;
  } | null;
  supplierInfo?: ProductSupplierInfo[];
  supplierInfos?: ProductSupplierInfo[]; // alias từ backend (Sequelize as: "supplierInfos")
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

export interface ProductSupplierInfo {
  id: number;
  product_id: number;
  supplier_id: number;
  supplier_product_code?: string | null;
  supplier_product_name?: string | null;
  min_order_qty?: number | null;
  lead_time_days?: number | null;
  price?: number | null;
  currency_id?: number | null;
  is_preferred: boolean;
  supplier?: {
    id: number;
    name: string;
    phone?: string;
    email?: string;
  };
  currency?: {
    id: number;
    code: string;
    name: string;
    symbol?: string;
  };
}

export interface ProductSupplierInfoInput {
  supplier_id: number;
  supplier_product_code?: string;
  supplier_product_name?: string;
  min_order_qty?: number;
  lead_time_days?: number;
  price?: number;
  currency_id?: number;
  is_preferred?: boolean;
}

export interface ProductCreateInput {
  category_id: number;
  sku: string;
  name: string;
  barcode?: string;
  // UOM
  uom_id?: number;
  purchase_uom_id?: number;
  // Product type & source
  product_type?: "storable" | "consumable" | "service";
  source_type?: "purchased" | "manufactured";
  min_stock_qty?: number;
  // Extra attributes
  internal_ref?: string;
  weight?: number;
  volume?: number;
  warranty_months?: number;
  notes?: string;
  // Pricing
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
  // UOM
  uom_id?: number;
  purchase_uom_id?: number;
  // Product type & source
  product_type?: "storable" | "consumable" | "service";
  source_type?: "purchased" | "manufactured";
  min_stock_qty?: number;
  // Extra attributes
  internal_ref?: string;
  weight?: number;
  volume?: number;
  warranty_months?: number;
  notes?: string;
  // Pricing
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

export interface PreviewItem {
  type: "old" | "new";
  id?: number;
  url: string;
  file?: File;
}
