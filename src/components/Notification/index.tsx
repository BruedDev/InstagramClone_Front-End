import { useEffect, useState, useRef } from "react";
import {
  fetchNotifications,
  markNotificationsAsRead,
} from "../../server/notification";
import { socketService } from "../../server/socket";
import Image from "next/image";
import { useHandleUserClick } from "../../utils/useHandleUserClick";
import { useRouter } from "next/navigation";

function formatTimeAgo(dateString: string) {
  const date = new Date(dateString);
  const now = new Date();
  const diff = Math.floor((now.getTime() - date.getTime()) / 1000);
  if (diff < 60) return `${diff}s trước`;
  if (diff < 3600) return `${Math.floor(diff / 60)}p trước`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h trước`;
  return `${Math.floor(diff / 86400)} ngày trước`;
}

function getTimeCategory(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffInDays = Math.floor(
    (now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24)
  );

  if (diffInDays === 0) return "Hôm nay";
  if (diffInDays === 1) return "Hôm qua";
  if (diffInDays <= 7) return "Tuần này";
  if (diffInDays <= 30) return "Tháng này";
  if (diffInDays <= 365) return "Năm nay";
  return "Cũ";
}

function groupNotificationsByTime(notifications: NotificationType[]) {
  const groups: { [key: string]: NotificationType[] } = {};

  notifications.forEach((notification) => {
    const category = getTimeCategory(notification.createdAt);
    if (!groups[category]) {
      groups[category] = [];
    }
    groups[category].push(notification);
  });

  // Sắp xếp theo thứ tự ưu tiên
  const order = [
    "Hôm nay",
    "Hôm qua",
    "Tuần này",
    "Tháng này",
    "Năm nay",
    "Cũ",
  ];
  const sortedGroups: { [key: string]: NotificationType[] } = {};

  order.forEach((category) => {
    if (groups[category]) {
      sortedGroups[category] = groups[category];
    }
  });

  return sortedGroups;
}

const notificationText = (type: string) => {
  switch (type) {
    case "like":
      return "đã thích bài viết của bạn";
    case "comment":
      return "đã bình luận bài viết của bạn";
    case "reply":
      return "đã trả lời bình luận của bạn";
    case "follow":
      return "đã theo dõi bạn";
    default:
      return "có hoạt động mới";
  }
};

type NotificationType = {
  post: { _id: string } | boolean;
  _id: string;
  type: string;
  fromUser?: {
    username?: string;
    profilePicture?: string;
  };
  comment?: {
    _id: string;
    text?: string;
  };
  isRead: boolean;
  createdAt: string;
};

export default function Notification({}: { onClose?: () => void } = {}) {
  const [notifications, setNotifications] = useState<NotificationType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const listRef = useRef<HTMLDivElement>(null);
  const handleUserClick = useHandleUserClick();
  const router = useRouter();

  // Fetch notifications on mount
  useEffect(() => {
    let ignore = false;
    setLoading(true);
    fetchNotifications()
      .then((data: unknown) => {
        if (!ignore && Array.isArray(data)) {
          setNotifications(data as NotificationType[]);
          setUnreadCount(
            (data as NotificationType[]).filter((n) => !n.isRead).length
          );
        }
      })
      .catch(() => setError("Không thể tải thông báo"))
      .finally(() => setLoading(false));
    return () => {
      ignore = true;
    };
  }, []);

  // Listen for realtime notification
  useEffect(() => {
    const handleNewNotification = (data: { notification: unknown }) => {
      const notification = data.notification as NotificationType;
      setNotifications((prev) => [notification, ...prev]);
      setUnreadCount((c) => c + 1);
    };
    socketService.onNotificationNew(handleNewNotification);
    return () => {
      socketService.offNotificationNew(handleNewNotification);
    };
  }, []);

  // Mark as read when open notification page
  useEffect(() => {
    if (unreadCount > 0) {
      markNotificationsAsRead().then(() => {
        setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
        setUnreadCount(0);
      });
    }
  }, [unreadCount]);

  if (loading) {
    return (
      <div className="p-4">
        <h1 className="text-xl font-bold text-white mb-4">Thông báo</h1>
        <div className="flex items-center justify-center py-6">
          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
          <p className="ml-3 text-gray-400 text-sm">Đang tải...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4">
        <h1 className="text-xl font-bold text-white mb-4">Thông báo</h1>
        <div className="text-center py-6">
          <div className="text-red-400 text-2xl mb-2">⚠️</div>
          <p className="text-red-400 text-sm">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 max-w-lg mx-auto">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold text-white">Thông báo</h1>
        {unreadCount > 0 && (
          <div className="bg-red-500 text-white text-xs font-medium px-2 py-1 rounded-full min-w-[20px] text-center">
            {unreadCount}
          </div>
        )}
      </div>

      {notifications.length === 0 ? (
        <div className="text-center py-8">
          <div className="text-gray-500 text-3xl mb-2">🔔</div>
          <p className="text-gray-400 text-sm">Bạn chưa có thông báo nào.</p>
        </div>
      ) : (
        <div ref={listRef} className="space-y-4">
          {Object.entries(groupNotificationsByTime(notifications)).map(
            ([timeCategory, groupNotifications]) => (
              <div key={timeCategory}>
                {/* Time Category Header */}
                <div className="flex items-center mb-3">
                  <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wide">
                    {timeCategory}
                  </h2>
                  <div className="flex-1 h-px bg-gradient-to-r from-gray-600 to-transparent ml-3"></div>
                  <span className="text-xs text-gray-500 ml-2">
                    {groupNotifications.length}
                  </span>
                </div>

                {/* Notifications in this category */}
                <div className="space-y-1">
                  {groupNotifications.map((n, idx) => {
                    const handleClick = () => {
                      if (n.type === "follow" && n.fromUser?.username) {
                        handleUserClick(n.fromUser.username);
                        window.dispatchEvent(new CustomEvent("close-panel"));
                      } else if (
                        (n.type === "comment" || n.type === "reply") &&
                        n.post &&
                        typeof n.post === "object" &&
                        "_id" in n.post &&
                        n.comment &&
                        n.comment._id
                      ) {
                        // Điều hướng tới post và truyền commentId
                        router.push(
                          `/post/${n.post._id}?commentId=${n.comment._id}`
                        );
                        window.dispatchEvent(new CustomEvent("close-panel"));
                      }
                    };

                    const notificationItem = (
                      <div
                        className={`group flex items-center gap-3 p-3 rounded-lg transition-all duration-200 hover:bg-white/5 ${
                          !n.isRead
                            ? "bg-blue-500/10" // Đã bỏ border-l-2 border-blue-400
                            : ""
                        }`}
                        onClick={
                          n.type === "comment" ||
                          n.type === "reply" ||
                          n.type === "follow"
                            ? handleClick
                            : undefined
                        }
                        style={{
                          cursor:
                            n.type === "comment" ||
                            n.type === "reply" ||
                            n.type === "follow"
                              ? "pointer"
                              : undefined,
                        }}
                      >
                        {/* Avatar */}
                        <div className="relative flex-shrink-0">
                          <Image
                            src={
                              n.fromUser?.profilePicture ||
                              "/default-avatar.png"
                            }
                            alt={n.fromUser?.username || "user"}
                            width={36}
                            height={36}
                            className={`rounded-full object-cover ${
                              n.type !== "follow"
                                ? "cursor-pointer hover:ring-2 hover:ring-white/20"
                                : ""
                            } transition-all duration-200`}
                            onClick={() => {
                              if (n.type !== "follow" && n.fromUser?.username) {
                                handleUserClick(n.fromUser.username);
                                window.dispatchEvent(
                                  new CustomEvent("close-panel")
                                );
                              }
                            }}
                          />
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <p className="text-sm text-white leading-tight">
                              <span
                                className={`font-medium${
                                  n.type !== "follow"
                                    ? " cursor-pointer hover:text-blue-400 transition-colors"
                                    : ""
                                }`}
                                onClick={() => {
                                  if (
                                    n.type !== "follow" &&
                                    n.fromUser?.username
                                  ) {
                                    handleUserClick(n.fromUser.username);
                                    window.dispatchEvent(
                                      new CustomEvent("close-panel")
                                    );
                                  }
                                }}
                              >
                                {n.fromUser?.username || "Người dùng"}
                              </span>
                              <span className="text-gray-300 ml-1">
                                {notificationText(n.type)}
                              </span>
                            </p>

                            {/* Unread indicator */}
                            {!n.isRead && (
                              <div className="w-2 h-2 bg-blue-400 rounded-full flex-shrink-0"></div>
                            )}
                          </div>

                          {/* Comment preview */}
                          {(n.type === "comment" || n.type === "reply") &&
                            n.comment?.text && (
                              <p className="text-xs text-gray-400 italic mt-1 truncate">
                                {n.comment.text}
                              </p>
                            )}

                          {/* Timestamp */}
                          <p className="text-xs text-gray-500 mt-1">
                            {formatTimeAgo(n.createdAt)}
                          </p>
                        </div>
                      </div>
                    );

                    return n.type === "follow" ||
                      n.type === "comment" ||
                      n.type === "reply" ? (
                      <div
                        key={n._id || idx}
                        className="cursor-pointer"
                        onClick={handleClick}
                      >
                        {notificationItem}
                      </div>
                    ) : (
                      <div key={n._id || idx}>{notificationItem}</div>
                    );
                  })}
                </div>
              </div>
            )
          )}
        </div>
      )}
    </div>
  );
}
