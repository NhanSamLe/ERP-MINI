export interface ProductCategory {
  id: number;
  name: string;
  parent_id?: number | null;
  created_at?: string;
  updated_at?: string;
  children?: ProductCategory[];
}

export interface ProductCategoryState {
  items: ProductCategory[];
  categories_child: ProductCategory[];
  selectedCategory?: ProductCategory;
  loading: boolean;
  error: string | null;
}

export interface CategoryCreate {
  name: string;
  parent_id?: number | null;
}

export interface CategoryUpdate {
  name: string;
  parent_id?: number | null;
}
