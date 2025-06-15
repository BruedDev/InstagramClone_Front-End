import { useCallback, useRef } from "react";

export function useNotification() {
  const activeNotifications = useRef<Set<Notification>>(new Set());

  const requestPermission = useCallback(() => {
    if (typeof window !== "undefined" && "Notification" in window) {
      Notification.requestPermission();
    }
  }, []);

  const notify = useCallback((
    title: string,
    options?: NotificationOptions & { onClick?: () => void }
  ) => {
    if (typeof window !== "undefined" && "Notification" in window) {
      if (Notification.permission === "granted") {
        const { onClick, ...notificationOptions } = options || {};

        const notification = new Notification(title, {
          ...notificationOptions,
          requireInteraction: false,
        });

        activeNotifications.current.add(notification);

        notification.onclose = () => {
          activeNotifications.current.delete(notification);
        };

        notification.onclick = () => {
          notification.close();
          activeNotifications.current.delete(notification);
          // Focus vào window
          window.focus();
          // Gọi custom onClick handler nếu có
          if (onClick) {
            onClick();
          }
        };

        // Auto close sau 5 giây
        setTimeout(() => {
          if (activeNotifications.current.has(notification)) {
            notification.close();
            activeNotifications.current.delete(notification);
          }
        }, 5000);

        return notification;
      }
    }
  }, []);

  const closeAll = useCallback(() => {
    activeNotifications.current.forEach(notification => {
      notification.close();
    });
    activeNotifications.current.clear();
  }, []);

  return { requestPermission, notify, closeAll };
}