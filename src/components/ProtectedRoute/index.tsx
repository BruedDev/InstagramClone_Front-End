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
    // Kiểm tra và lưu token từ URL (nếu có)
    const url = new URL(window.location.href);
    const token = url.searchParams.get("token");
    const cookieSet = url.searchParams.get("cookieSet");

    if (cookieSet === "true" && token) {
      // Lưu token vào localStorage để có thể dùng sau
      localStorage.setItem("token", token);

      // Xóa token và cookieSet khỏi URL để tránh trùng lặp
      url.searchParams.delete("token");
      url.searchParams.delete("cookieSet");
      const cleanUrl = `${url.pathname}${url.search}`;

      // Thực hiện chuyển hướng lại URL sạch
      router.replace(cleanUrl);
    }

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
