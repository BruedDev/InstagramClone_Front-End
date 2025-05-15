// hooks/useTime.tsx
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import "dayjs/locale/vi";

// Khởi tạo plugin chỉ một lần
dayjs.extend(relativeTime);
dayjs.locale("vi");

export const useTime = () => {
  /**
   * Trả về chuỗi thời gian dạng "một phút trước", "3 giờ trước", v.v.
   * @param timestamp Chuỗi ISO hoặc Date object
   */
  const fromNow = (timestamp: string | Date): string => {
    return dayjs(timestamp).fromNow();
  };

  /**
   * Trả về định dạng tùy chỉnh, ví dụ: "15 tháng 5, 19:30"
   * @param timestamp Chuỗi ISO hoặc Date object
   * @param format Mặc định: "D [tháng] M, HH:mm"
   */
  const formatTime = (
    timestamp: string | Date,
    format = "D [tháng] M, HH:mm"
  ): string => {
    return dayjs(timestamp).format(format);
  };

  return { fromNow, formatTime };
};
