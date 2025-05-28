// components/ClientProviders/index.tsx
"use client";

import { Provider } from "react-redux";
import { store } from "@/store";
import GlobalProvider from "@/contexts/GlobalContext";
import ProtectedRoute from "@/components/ClientProviders/ProtectedRoute";
import LoadingBar from "@/components/Loading/LoadingBar";
import IOSDetector from "@/components/ClientProviders/IOSDetector";
import { StoryProvider } from "@/contexts/StoryContext";
import { useEffect, useState } from "react";
import CallProvider from "./CallProvider";

export default function ClientProviders({
  children,
}: {
  children: React.ReactNode;
}) {
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const getUserId = () => {
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
          <StoryProvider>
            <LoadingBar />
            <IOSDetector />
            {userId && <CallProvider userId={userId} />}
            {children}
          </StoryProvider>
        </GlobalProvider>
      </Provider>
    </ProtectedRoute>
  );
}
