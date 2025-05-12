"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { checkAuth } from "@/server/auth";
import type { User } from "@/types/auth.type";
import LoadingSpinner from "@/components/Loading/Loading";

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
