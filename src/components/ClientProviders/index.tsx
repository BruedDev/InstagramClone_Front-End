// components/ClientProviders/index.tsx
"use client";

import { Provider } from "react-redux";
import { store } from "@/store";
import GlobalProvider from "@/contexts/GlobalContext";
import ProtectedRoute from "@/components/ClientProviders/ProtectedRoute";
import LoadingBar from "@/components/Loading/LoadingBar";
import IOSDetector from "@/components/ClientProviders/IOSDetector";
import { useEffect, useState } from "react";
import CallProvider from "./CallProvider";

export default function ClientProviders({
  children,
}: {
  children: React.ReactNode;
}) {
  const [userId, setUserId] = useState<string | null>(null);

  // Lấy userId từ localStorage sau khi component được mount
  useEffect(() => {
    // Mô phỏng việc lấy userId từ localStorage hoặc bất kỳ nguồn nào khác
    const getUserId = () => {
      // Thử lấy từ localStorage trước
      const storedUserId = localStorage.getItem("id");
      if (storedUserId) {
        return storedUserId;
      }
    };

    const currentUserId = getUserId();
    if (currentUserId) {
      setUserId(currentUserId);
      console.log("UserId set in ClientProviders:", currentUserId);
    }
  }, []);

  return (
    <ProtectedRoute>
      <Provider store={store}>
        <GlobalProvider>
          <LoadingBar />
          <IOSDetector />
          {userId && <CallProvider userId={userId} />}
          {children}
        </GlobalProvider>
      </Provider>
    </ProtectedRoute>
  );
}
