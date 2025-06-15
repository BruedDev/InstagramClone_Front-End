"use client";
import { useEffect } from "react";
import { useNotification } from "@/utils/useNotification";

export default function NotificationPermissionRequester() {
  const { requestPermission, closeAll } = useNotification();

  useEffect(() => {
    requestPermission();

    // Cleanup khi component unmount
    return () => {
      closeAll();
    };
  }, [requestPermission, closeAll]);

  // Cleanup khi user rời khỏi trang
  useEffect(() => {
    const handleBeforeUnload = () => {
      closeAll();
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      closeAll();
    };
  }, [closeAll]);

  return null;
}
