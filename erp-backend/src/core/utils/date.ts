import dayjs from "dayjs";

//  Format ngày thành chuỗi
export const formatDate = (date: Date | string, format = "DD/MM/YYYY"): string => {
  return dayjs(date).format(format);
};
//Lấy ngày đầu tháng
export const startOfMonth = (date: Date | string = new Date()): Date => {
  return dayjs(date).startOf("month").toDate();
};
// Lấy ngày cuối tháng
export const endOfMonth = (date: Date | string = new Date()): Date => {
  return dayjs(date).endOf("month").toDate();
};
// Cộng thêm số ngày
export const addDays = (date: Date | string, days: number): Date => {
  return dayjs(date).add(days, "day").toDate();
};
