import { AxiosError } from "axios";

export function getErrorMessage(error: unknown): string {
  if (error instanceof AxiosError) {
    return error.response?.data?.message || "API Error";
  }
  if (error instanceof Error) {
    return error.message;
  }
  return "Unexpected error";
}
