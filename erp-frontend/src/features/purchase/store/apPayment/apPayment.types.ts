export type PaymentStatus = "draft" | "posted" | "completed" | "cancelled";
export type ApprovalStatus =
  | "draft"
  | "waiting_approval"
  | "approved"
  | "rejected";
export type PaymentMethod = "cash" | "bank" | "transfer";

export interface ApPayment {
  id: number;
  payment_no: string;

  supplier_id: number;
  supplier?: {
    id: number;
    name: string;
    email?: string;
    phone?: string;
  };

  payment_date: string;

  amount: string;

  method: PaymentMethod;
  status: PaymentStatus;
  approval_status: ApprovalStatus;

  created_by: number;
  creator?: {
    id: number;
    full_name: string;
    email?: string;
    phone?: string;
    avatar_url?: string | null;
  } | null;

  approved_by?: number | null;
  approver?: {
    id: number;
    full_name: string;
    email?: string;
    phone?: string;
    avatar_url?: string | null;
  } | null;

  submitted_at?: string | null;
  approved_at?: string | null;
  reject_reason?: string | null;

  branch_id: number;
  branch?: {
    id: number;
    code: string;
    name: string;
    address?: string;
    province?: string;
    district?: string;
    ward?: string;
    tax_code?: string;
    bank_account?: string;
    bank_name?: string;
    status: "active" | "inactive";
  };

  created_at: string;
  updated_at: string;
}

export interface UnpaidInvoice {
  id: number;
  invoice_no: string;
  total_after_tax: number;
  allocated_amount: number;
  unpaid_amount: number;
  allocate_amount: number;
}

export interface AvailableAmount {
  payment_id: number;
  available_amount: number;
}
