// @/components/Story/ViewStoryUi.tsx
import React, { useEffect, useState } from "react";
import Image from "next/image";
import { useSelector } from "react-redux";
import { RootState } from "@/store";
import { User } from "@/types/user.type";
import { OnlineIndicator } from "@/components/OnlineIndicator";

// Giả định các hook này tồn tại ở đường dẫn này dựa trên mã bạn đã cung cấp
import { useCheckOnline } from "@/app/hooks/useCheckOnline";

import styles from "./ViewStoryUi.module.scss";

// Kiểu dữ liệu thật từ backend cho một người xem
interface RealViewer {
  _id: string;
  username: string;
  fullName: string;
  profilePicture?: string;
  viewedAt: string; // Giữ lại để làm fallback nếu không có dữ liệu hoạt động
}

// Kiểu dữ liệu User từ Redux store, đảm bảo có các trường cần thiết
interface UserWithStatus extends User {
  _id: string;
  isOnline?: boolean;
  lastActive?: string | number | null;
  lastOnline?: string | number | null;
}

/**
 * @component ViewerRow
 * @description Component con để hiển thị thông tin của MỘT người xem.
 * Component này sẽ tự động lắng nghe và cập nhật trạng thái online/offline real-time.
 * Đây là cách tiếp cận đúng đắn để sử dụng hook trong một danh sách.
 */
const ViewerRow = ({ viewer }: { viewer: RealViewer }) => {
  const { availableUsers } = useSelector((state: RootState) => state.messenger);

  // 2. Sử dụng hook `useCheckOnline` để xác định trạng thái online
  // Hook này sẽ nhận toàn bộ danh sách users và trả về một hàm để kiểm tra
  const { isUserOnline } = useCheckOnline(availableUsers as UserWithStatus[]);
  const isOnline = isUserOnline(viewer._id);

  // 3. Bỏ useTimeOffline, tự xử lý đếm phút offline ở đây
  const [offlineMinutes, setOfflineMinutes] = useState<number>(1);
  const offlineStartRef = React.useRef<number | null>(null);

  useEffect(() => {
    if (isOnline) {
      offlineStartRef.current = null;
      setOfflineMinutes(1);
      return;
    }
    // Khi vừa offline, set mốc là 1 phút trước
    if (!offlineStartRef.current) {
      offlineStartRef.current = Date.now();
      setOfflineMinutes(1);
    }
    const interval = setInterval(() => {
      setOfflineMinutes((prev) => prev + 1);
    }, 60000);
    return () => clearInterval(interval);
  }, [isOnline]);

  let timeOffline = "";
  if (isOnline) {
    timeOffline = "Đang hoạt động";
  } else {
    timeOffline = `Hoạt động ${offlineMinutes} phút trước`;
  }

  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  return (
    <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-zinc-800/50 cursor-pointer">
      <div className="relative">
        <Image
          src={viewer.profilePicture || "/api/placeholder/40/40"}
          alt={viewer.fullName || viewer.username}
          className={`$${
            isMobile ? "w-12 h-12" : "w-10 h-10"
          } rounded-full object-cover border-2 border-zinc-700 hover:border-zinc-500 flex-shrink-0`}
          width={isMobile ? 48 : 40}
          height={isMobile ? 48 : 40}
        />
        {/* Chấm xanh online */}
        <OnlineIndicator isOnline={isOnline} size={isMobile ? "md" : "sm"} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-white font-medium truncate">{viewer.username}</div>
        {/* Hiển thị trực tiếp kết quả thời gian hoạt động */}
        <div className="text-xs text-zinc-400 truncate">{timeOffline}</div>
      </div>
    </div>
  );
};

/**
 * @component ViewStoryUi
 * @description Component chính hiển thị giao diện chi tiết về Story.
 */
export default function ViewStoryUi({
  onClose,
  viewers = [],
}: {
  onClose: () => void;
  // Đảm bảo viewers luôn là mảng RealViewer để có _id
  viewers?: RealViewer[];
}) {
  const [visible, setVisible] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);
    const timeout = setTimeout(() => setVisible(true), 50);

    return () => {
      clearTimeout(timeout);
      window.removeEventListener("resize", checkMobile);
    };
  }, []);

  const handleClose = () => {
    setVisible(false);
    setTimeout(onClose, 400);
  };

  return (
    <>
      {isMobile && (
        <div
          className={`fixed inset-0 bg-black z-30 transition-all duration-400 ease-in-out ${
            visible ? "opacity-50" : "opacity-0 pointer-events-none"
          } max-[767px]:block hidden`}
          onClick={handleClose}
        />
      )}
      <div
        className={`
          ${
            isMobile
              ? `fixed left-1/2 bottom-0 w-full max-w-[420px] bg-zinc-900 shadow-2xl z-40
                 transform -translate-x-1/2 transition-all duration-400 ease-in-out
                 rounded-t-3xl h-[85dvh]
                 ${
                   visible
                     ? "translate-y-0 opacity-100 scale-100"
                     : "translate-y-full opacity-0 scale-90"
                 }`
              : `fixed bottom-4 left-[50.5%] transform -translate-x-1/2 w-full max-w-[425px] mx-auto bg-zinc-900 rounded-t-2xl rounded-b-2xl shadow-2xl z-40 transition-all duration-400 ease-in-out h-[60dvh] ${
                  visible
                    ? "translate-y-0 opacity-100 scale-100"
                    : "translate-y-8 opacity-0 scale-90"
                }`
          }
        `}
        style={{
          minHeight: isMobile ? "auto" : 550,
          transformOrigin: "center bottom",
        }}
      >
        {/* Header - Fixed */}
        <div
          className={`flex items-center justify-between px-6 py-3 border-b border-zinc-800 transition-all duration-350 ease-out ${
            visible ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"
          } ${isMobile ? "sticky top-0 bg-zinc-900 z-10 rounded-t-2xl" : ""}`}
        >
          <span className="text-lg font-semibold text-white">
            Chi tiết về tin
          </span>
          <button
            onClick={handleClose}
            className="text-zinc-400 hover:text-white text-xl w-8 h-8 flex items-center justify-center rounded-full hover:bg-zinc-800 transition-all duration-150 hover:scale-110"
          >
            <span aria-label="Đóng">×</span>
          </button>
        </div>

        {/* Content Container */}
        <div
          className={`transition-all duration-400 ease-out ${
            visible ? "translate-y-0 opacity-100" : "translate-y-6 opacity-0"
          } ${
            isMobile
              ? "overflow-y-auto h-[calc(85dvh-69px)] px-6"
              : "px-6 py-4 h-[calc(100%-69px)]"
          }`}
          style={{
            transitionDelay: visible ? "100ms" : "0ms",
            ...(isMobile && { scrollBehavior: "smooth" }),
          }}
        >
          {/* Story Preview Section */}
          <div className={isMobile ? "py-4" : ""}>
            <div
              className={`flex gap-4 mb-4 transition-all duration-350 ease-out ${
                visible
                  ? "translate-y-0 opacity-100"
                  : "translate-y-4 opacity-0"
              }`}
              style={{ transitionDelay: visible ? "150ms" : "0ms" }}
            >
              <div className="w-20 h-28 bg-zinc-800 rounded-lg flex-shrink-0 overflow-hidden transition-all duration-200 ease-out hover:scale-105 hover:rotate-1">
                <div className="w-full h-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center">
                  <span className="text-white text-2xl">📖</span>
                </div>
              </div>
              <div className="w-20 h-28 bg-zinc-800 rounded-lg flex-shrink-0 flex items-center justify-center text-blue-500 font-bold text-2xl hover:bg-zinc-700 transition-all duration-200 ease-out cursor-pointer hover:scale-105 hover:rotate-1">
                +
              </div>
            </div>

            <hr
              className={`border-zinc-700 mb-4 transition-all duration-350 ease-out ${
                visible ? "opacity-100 scale-x-100" : "opacity-0 scale-x-0"
              }`}
              style={{
                transitionDelay: visible ? "200ms" : "0ms",
                transformOrigin: "left",
              }}
            />

            <div
              className={`flex items-center gap-2 text-zinc-300 mb-4 transition-all duration-350 ease-out ${
                visible
                  ? "translate-y-0 opacity-100"
                  : "translate-y-4 opacity-0"
              }`}
              style={{ transitionDelay: visible ? "250ms" : "0ms" }}
            >
              <svg
                width="20"
                height="20"
                fill="none"
                viewBox="0 0 24 24"
                className="transition-transform duration-150 hover:scale-110"
              >
                <path
                  fill="currentColor"
                  d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10Zm0-2a8 8 0 1 1 0-16 8 8 0 0 1 0 16Zm0-7a3 3 0 1 0 0-6 3 3 0 0 0 0 6Zm0 2c-2.33 0-7 1.17-7 3.5V20h14v-1.5c0-2.33-4.67-3.5-7-3.5Z"
                />
              </svg>
              <span className="font-semibold">{viewers.length} người xem</span>
            </div>
          </div>

          {/* Viewers List - Sử dụng component ViewerRow */}
          <div
            className={`space-y-1 ${styles.viewList} ${isMobile ? "pb-6" : ""}`}
            style={{
              ...(!isMobile && {
                maxHeight: "calc(60dvh - 210px)", // Adjusted height
                overflowY: "auto",
                overflowX: "hidden",
                paddingRight: "4px",
              }),
            }}
          >
            {/* Vòng lặp bây giờ sẽ render component ViewerRow */}
            {viewers.map((viewer, i) => (
              <div
                key={viewer._id || i}
                className={`transition-all duration-350 ease-out ${
                  visible
                    ? "translate-y-0 opacity-100"
                    : "translate-y-6 opacity-0"
                }`}
                style={{
                  transitionDelay: `${250 + i * 70}ms`,
                }}
              >
                <ViewerRow viewer={viewer} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
