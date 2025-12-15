export interface ExcelColumn<T> {
  header: string;
  key: keyof T;
  width?: number;
  align?: "left" | "center" | "right";
  format?: "text" | "number" | "currency";
  formatter?: (value: T[keyof T], row: T) => string | number;
}

export interface ExcelReportOptions<T> {
  title: string;
  subtitle?: string;
  meta?: Record<string, string>;
  columns: ExcelColumn<T>[];
  data: T[];
  fileName: string;
}
