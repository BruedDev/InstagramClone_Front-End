// components/ClientProviders/index.tsx
"use client";

import { Provider } from "react-redux";
import { store } from "@/store";
import GlobalProvider from "@/contexts/GlobalContext";
import { CallProvider as CallContextProvider } from "@/contexts/CallContext"; // Import context provider
import ProtectedRoute from "@/components/ClientProviders/ProtectedRoute";
import LoadingBar from "@/components/Loading/LoadingBar";
import IOSDetector from "@/components/ClientProviders/IOSDetector";
import { useEffect, useState } from "react";
import CallInterface from "./CallProvider/index"; // Rename import để tránh xung đột

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
    }
  }, []);

  return (
    <ProtectedRoute>
      <Provider store={store}>
        <GlobalProvider>
          {/* Wrap CallContextProvider bên ngoài */}
          {userId ? (
            <CallContextProvider userId={userId}>
              <LoadingBar />
              <IOSDetector />
              <CallInterface userId={userId} />
              {children}
            </CallContextProvider>
          ) : (
            <>
              <LoadingBar />
              <IOSDetector />
              {children}
            </>
          )}
        </GlobalProvider>
      </Provider>
    </ProtectedRoute>
  );
}
