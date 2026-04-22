export interface PhysicalInventoryLine {
  id: number;
  inventory_id: number;
  product_id: number;
  location_id?: number | null;
  lot_id?: number | null;
  theoretical_qty: number;
  counted_qty: number;
  difference_qty: number;
  unit_cost?: number | null;
  product?: {
    id: number;
    name: string;
    sku: string;
    image_url?: string;
    uom?: { id: number; code: string; name: string };
  };
  location?: { id: number; name: string; code: string; type: string } | null;
  lot?: { id: number; lot_no: string; expiry_date?: string } | null;
}

export interface PhysicalInventory {
  id: number;
  inv_no: string;
  warehouse_id: number;
  branch_id: number;
  inv_date: string;
  status: "draft" | "in_progress" | "validated" | "cancelled";
  created_by: number;
  validated_by?: number | null;
  validated_at?: string | null;
  created_at?: string;
  updated_at?: string;
  warehouse?: { id: number; name: string; code: string };
  creator?: {
    id: number;
    full_name: string;
    email: string;
    avatar_url?: string;
  };
  validator?: {
    id: number;
    full_name: string;
    email: string;
    avatar_url?: string;
  } | null;
  lines?: PhysicalInventoryLine[];
}

export interface CreateInventoryDTO {
  warehouse_id: number;
  inv_date: string;
}

export interface AddInventoryLineDTO {
  product_id: number;
  location_id?: number | null;
  lot_id?: number | null;
}

export interface PhysicalInventoryState {
  items: PhysicalInventory[];
  selected: PhysicalInventory | null;
  loading: boolean;
  error: string | null;
}
