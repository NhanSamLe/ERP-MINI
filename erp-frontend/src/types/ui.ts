export type AlertType = "success" | "error" | "warning" | "info";

export interface UiAlert {
  type: AlertType;
  message: string;
}
