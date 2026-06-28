export const formatDateTime = (value?: string | null) => {
  if (!value) return "-";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";

  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).format(date);
};

/**
 * Convert ISO date string to yyyy-MM-dd format for HTML date input
 * @param value - ISO date string (e.g., "2026-05-04T00:00:00.000Z")
 * @returns Date string in yyyy-MM-dd format (e.g., "2026-05-04")
 */
export const toDateInputValue = (value?: string | null): string => {
  if (!value) return "";
  return value.split("T")[0];
};
