export const formatDateTime = (value?: string | null) => {
  if (!value) return "-";

  const date = new Date(value);

  const day = date.getDate().toString().padStart(2, "0");
  const month = (date.getMonth() + 1).toString().padStart(2, "0");
  const year = date.getFullYear();

  let hour = date.getHours();
  const minute = date.getMinutes().toString().padStart(2, "0");

  const ampm = hour >= 12 ? "PM" : "AM";
  hour = hour % 12 || 12;

  const hourStr = hour.toString().padStart(2, "0");

  return `${day}/${month}/${year} ${hourStr}:${minute} ${ampm}`;
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
