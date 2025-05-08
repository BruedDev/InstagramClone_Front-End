"use client";

import { useEffect, useState, ReactNode } from "react";
import { useRouter } from "next/navigation";
import api from "@/utils/api";
import axios from "axios";

interface AuthGuardProps {
  children: ReactNode;
}

export default function ProtectedRoute({ children }: AuthGuardProps) {
  const router = useRouter();
  const [loading, setLoading] = useState<boolean>(true);
  const [authenticated, setAuthenticated] = useState<boolean>(false);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        await api.get("/api/auth/me");
        setAuthenticated(true);
      } catch (error) {
        if (axios.isAxiosError(error)) {
          console.error("Lỗi Axios:", error.response?.data || error.message);
        } else {
          console.error("Lỗi không xác định:", error);
        }
        setAuthenticated(false);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  useEffect(() => {
    if (!loading && !authenticated) {
      router.push("/accounts");
    }
  }, [loading, authenticated, router]);

  if (!authenticated) {
    return null;
  }

  return <>{children}</>;
}
