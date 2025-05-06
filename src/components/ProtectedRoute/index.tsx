"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { checkAuth } from "@/utils/isAuth";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

// Component bảo vệ trang Home, chỉ cho phép người dùng đã đăng nhập truy cập
export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    // Hàm kiểm tra xác thực bằng cách gọi utility function
    const verifyAuth = async () => {
      try {
        const isAuthed = await checkAuth();

        setIsAuthenticated(isAuthed);

        if (!isAuthed) {
          router.replace("/accounts");
        }
      } catch {
        setIsAuthenticated(false);
        router.replace("/accounts");
      }
    };

    // Kiểm tra xác thực khi component được mount
    verifyAuth();

    // Thiết lập event listener để kiểm tra mỗi khi tab được focus lại
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        verifyAuth();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    // Thiết lập interval để kiểm tra định kỳ (mỗi 1 tiếng)
    const authCheckInterval = setInterval(verifyAuth, 60 * 60 * 1000);

    // Cleanup function
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      clearInterval(authCheckInterval);
    };
  }, [router]);

  // Hiển thị trạng thái loading trong khi kiểm tra xác thực
  if (isAuthenticated === null) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  // Nếu đã xác thực, hiển thị nội dung con
  return isAuthenticated ? <>{children}</> : null;
}
