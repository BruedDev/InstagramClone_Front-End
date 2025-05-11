"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation"; // Để điều hướng khi chưa đăng nhập
import { checkAuth } from "@/server/auth"; // Để gọi API kiểm tra xác thực
import type { User } from "@/server/auth"; // Để dùng kiểu dữ liệu User

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const router = useRouter();

  useEffect(() => {
    const checkUserAuth = async () => {
      try {
        const user: User | null = await checkAuth();
        if (user) {
          setIsAuthenticated(true);
        } else {
          setIsAuthenticated(false);
          router.push("/accounts/login");
        }
      } catch (error) {
        console.error("❌ Lỗi kiểm tra xác thực:", error);
        setIsAuthenticated(false);
        router.push("/accounts/login");
      } finally {
        setLoading(false);
      }
    };

    checkUserAuth();
  }, [router]);

  if (loading) {
    return <div>Đang tải...</div>;
  }

  if (!isAuthenticated) {
    return null;
  }

  return <div>{children}</div>;
}
