"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { checkAuth, handleAuthFromURL } from "@/server/auth";
import type { User } from "@/server/auth";

// Loading component để hiển thị khi đang tải
function LoadingSpinner() {
  return (
    <div className="flex h-screen w-full items-center justify-center">
      <div className="text-center">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]" />
        <p className="mt-2">Đang tải...</p>
      </div>
    </div>
  );
}

// Component nội dung chính
function ProtectedContent({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const checkUserAuth = async () => {
      try {
        // Xử lý token từ URL nếu có (từ redirect Facebook)
        const token = searchParams?.get("token");
        const cookieSet = searchParams?.get("cookieSet");

        if (token && cookieSet === "true") {
          // Sử dụng hàm handleAuthFromURL để xử lý token từ URL
          handleAuthFromURL();

          // Đánh dấu đã xác thực
          setIsAuthenticated(true);
          setLoading(false);
          return;
        }

        // Kiểm tra xác thực thông thường bằng API
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
  }, [router, searchParams]);

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!isAuthenticated) {
    return null;
  }

  return <>{children}</>;
}

// Component chính với Suspense
export default function ProtectedRoute({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <ProtectedContent>{children}</ProtectedContent>
    </Suspense>
  );
}
