// Tạo file Client Component để phát hiện iOS
"use client";

import { useEffect } from "react";

export default function IOSDetector() {
  useEffect(() => {
    try {
      const iOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
      if (iOS) {
        document.documentElement.classList.add("ios");
      }
    } catch (e) {
      console.error("Error detecting iOS:", e);
    }
  }, []);

  return null;
}
