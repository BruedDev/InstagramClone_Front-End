import { useState, useEffect } from "react";

interface TimeOfflineResult {
  timeOffline: string;
  isOnline: boolean;
}

export const useTimeOffline = (
  p0: string | number | null,
  p1: string | number | null,
  lastActive: string | null,
  lastOnline: string | null,
  status: "online" | "offline"
): TimeOfflineResult => {
  const [timeOffline, setTimeOffline] = useState<string>("");

  const formatTimeOffline = (timestamp: string): string => {
    const now = new Date();
    const time = new Date(timestamp);
    const diffInMs = now.getTime() - time.getTime();
    const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
    const diffInHours = Math.floor(diffInMinutes / 60);
    const diffInDays = Math.floor(diffInHours / 24);

    // Nếu thời gian không hợp lệ
    if (isNaN(diffInMinutes) || diffInMinutes < 0) {
      return "Hoạt động gần đây";
    }

    // Vừa mới (dưới 2 phút)
    if (diffInMinutes < 2) {
      return "Vừa hoạt động";
    }

    // Dưới 1 giờ - hiển thị phút
    if (diffInMinutes < 60) {
      return `Hoạt động ${diffInMinutes} phút trước`;
    }

    // Dưới 24 giờ - hiển thị giờ
    if (diffInHours < 24) {
      return `Hoạt động ${diffInHours} giờ trước`;
    }

    // Dưới 7 ngày - hiển thị ngày
    if (diffInDays < 7) {
      return `Hoạt động ${diffInDays} ngày trước`;
    }

    // Dưới 4 tuần - hiển thị tuần
    if (diffInDays < 28) {
      const weeks = Math.floor(diffInDays / 7);
      return `Hoạt động ${weeks} tuần trước`;
    }

    // Dưới 12 tháng - hiển thị tháng
    if (diffInDays < 365) {
      const months = Math.floor(diffInDays / 30);
      return `Hoạt động ${months} tháng trước`;
    }

    // Trên 1 năm - hiển thị năm
    const years = Math.floor(diffInDays / 365);
    return `Hoạt động ${years} năm trước`;
  };

  useEffect(() => {
    const updateTimeOffline = () => {
      if (status === "online") {
        setTimeOffline("Đang hoạt động");
        return;
      }

      // Ưu tiên lastOnline nếu có, nếu không thì dùng lastActive
      const timestamp = lastOnline || lastActive;

      if (!timestamp) {
        setTimeOffline("Hoạt động gần đây");
        return;
      }

      const formattedTime = formatTimeOffline(timestamp);
      setTimeOffline(formattedTime);
    };

    // Cập nhật ngay lập tức
    updateTimeOffline();

    // Cập nhật mỗi phút cho thời gian real-time
    const interval = setInterval(updateTimeOffline, 60000);

    return () => clearInterval(interval);
  }, [lastActive, lastOnline, status]);

  return {
    timeOffline,
    isOnline: status === "online",
  };
};

export default useTimeOffline;
