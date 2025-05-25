import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";

// Tuỳ chỉnh ngôn ngữ tiếng Việt (dùng số thay vì chữ: "1 phút" thay vì "một phút")
dayjs.extend(relativeTime);
dayjs.locale({
  name: "vi-custom",
  relativeTime: {
    future: "trong %s",
    past: "%s trước",
    s: "vài giây",
    m: "1 phút",
    mm: "%d phút",
    h: "1 giờ",
    hh: "%d giờ",
    d: "1 ngày",
    dd: "%d ngày",
    M: "1 tháng",
    MM: "%d tháng",
    y: "1 năm",
    yy: "%d năm",
  },
  formats: {
    LT: "HH:mm",
    LTS: "HH:mm:ss",
    L: "DD/MM/YYYY",
    LL: "D MMMM [năm] YYYY",
    LLL: "D MMMM [năm] YYYY HH:mm",
    LLLL: "dddd, D MMMM [năm] YYYY HH:mm",
  },
});

/**
 * Hook xử lý thời gian theo phong cách Instagram
 */
export const useTime = () => {
  /**
   * Trả về chuỗi thời gian như "3 phút trước", "2 ngày trước"
   */
  const fromNow = (timestamp: string | Date): string => {
    const now = dayjs();
    const time = dayjs(timestamp);
    const diffMs = now.diff(time);

    const oneDayMs = 24 * 60 * 60 * 1000;

    if (diffMs < oneDayMs) {
      return time.locale("vi-custom").fromNow(); // ví dụ: "1 phút trước"
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
