export interface ExcelColumn<T> {
  header: string;
  key: keyof T;
  width?: number;
  align?: "left" | "center" | "right";
  format?: "text" | "number" | "currency";
  formatter?: (value: T[keyof T], row: T) => string | number;
}

export interface CompanyInfo {
  name: string;
  address: string;
  taxId?: string;
  phone?: string;
  email?: string;
}

export interface ReportFooter {
  creator?: string;
  approver?: string;
  accountant?: string;
}

export interface ExcelReportOptions<T> {
  title: string;
  subtitle?: string;
  meta?: Record<string, string | number>;
  columns: ExcelColumn<T>[];
  data: T[];
  fileName: string;
  companyInfo?: CompanyInfo;
  footer?: ReportFooter;
}
