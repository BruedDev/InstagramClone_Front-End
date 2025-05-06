"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

// Component bảo vệ trang Home, chỉ cho phép người dùng đã đăng nhập truy cập
export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    // Hàm kiểm tra xác thực bằng cách gọi API
    const checkAuth = async () => {
      try {
        console.log("[ProtectedRoute] Đang kiểm tra xác thực qua API");
        const response = await fetch("http://localhost:5000/api/auth/check", {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include", // Đảm bảo gửi cookie với request
        });

        if (response.ok) {
          console.log("[ProtectedRoute] Xác thực thành công");
          setIsAuthenticated(true);
        } else {
          console.log(
            "[ProtectedRoute] Xác thực thất bại, chuyển hướng đến trang đăng nhập"
          );
          setIsAuthenticated(false);
          router.replace("/accounts");
        }
      } catch (error) {
        console.error("[ProtectedRoute] Lỗi khi kiểm tra xác thực:", error);
        setIsAuthenticated(false);
        router.replace("/accounts");
      }
    };

    // Kiểm tra xác thực khi component được mount
    console.log("[ProtectedRoute] Component được mount, kiểm tra xác thực");
    checkAuth();

    // Thiết lập event listener để kiểm tra mỗi khi tab được focus lại
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        console.log("[ProtectedRoute] Tab được focus lại, kiểm tra xác thực");
        checkAuth();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    // Thiết lập interval để kiểm tra định kỳ (mỗi 5 phút)
    const authCheckInterval = setInterval(() => {
      console.log("[ProtectedRoute] Kiểm tra định kỳ xác thực");
      checkAuth();
    }, 5 * 60 * 1000); // 5 phút thay vì 3 giây

    // Cleanup function
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      clearInterval(authCheckInterval);
      console.log("[ProtectedRoute] Cleanup effect");
    };
  }, [router]);

  // Hiển thị trạng thái loading trong khi kiểm tra xác thực
  if (isAuthenticated === null) {
    console.log("[ProtectedRoute] Đang hiển thị loading");
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  // Nếu đã xác thực, hiển thị nội dung con
  console.log("[ProtectedRoute] Trạng thái xác thực:", isAuthenticated);
  return isAuthenticated ? <>{children}</> : null;
}
