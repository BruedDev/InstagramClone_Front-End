// hooks/useTime.tsx
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import "dayjs/locale/vi";

dayjs.extend(relativeTime);
dayjs.locale("vi");

export const useTime = () => {
  /**
   * Trả về chuỗi thời gian như "3 phút trước", "2 ngày trước"
   * Nếu < 24 giờ → "x phút/x giờ trước"
   * Nếu ≥ 24 giờ → "x ngày trước"
   */
  const fromNow = (timestamp: string | Date): string => {
    const now = dayjs();
    const time = dayjs(timestamp);
    const diffMs = now.diff(time); // milliseconds

    const oneDayMs = 24 * 60 * 60 * 1000;
    if (diffMs < oneDayMs) {
      return time.fromNow(); // ví dụ: "5 giờ trước", "1 phút trước"
    } else {
      const diffInDays = now.diff(time, "day");
      return `${diffInDays} ngày trước`;
    }
  };

  /**
   * Trả về định dạng cố định, ví dụ: "15 tháng 5, 19:30"
   */
  const formatTime = (
    timestamp: string | Date,
    format = "D [tháng] M, HH:mm"
  ): string => {
    return dayjs(timestamp).format(format);
  };

  return { fromNow, formatTime };
};
