"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { logout } from "@/server/auth";

export default function LogoutComponent() {
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const handleLogout = async () => {
      try {
        setIsLoggingOut(true);
        await logout();

        // Xóa token từ localStorage (phòng trường hợp cookie bị chặn)
        sessionStorage.removeItem("authToken");

        // Redirect về trang login sau khi đăng xuất thành công
        router.push("/accounts");
      } catch (err) {
        setIsLoggingOut(false);
        setError(
          err instanceof Error ? err.message : "Có lỗi xảy ra khi đăng xuất"
        );
        console.error("Lỗi đăng xuất:", err);
      }
    };

    // Tự động đăng xuất khi component được render
    handleLogout();
  }, [router]);

  const handleManualLogout = async () => {
    if (isLoggingOut) return;

    try {
      setIsLoggingOut(true);
      setError(null);
      await logout();

      // Xóa token từ localStorage
      sessionStorage.removeItem("authToken");

      // Redirect về trang login sau khi đăng xuất thành công
      router.push("/accounts");
    } catch (err) {
      setIsLoggingOut(false);
      setError(
        err instanceof Error ? err.message : "Có lỗi xảy ra khi đăng xuất"
      );
      console.error("Lỗi đăng xuất:", err);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
      <div className="w-full max-w-md p-6 bg-white rounded-lg shadow-md">
        <h1 className="mb-6 text-2xl font-bold text-center text-gray-800">
          Đăng xuất
        </h1>

        {isLoggingOut ? (
          <div className="flex flex-col items-center justify-center space-y-4">
            <div className="w-8 h-8 border-t-2 border-b-2 border-blue-500 rounded-full animate-spin"></div>
            <p className="text-gray-600">Đang đăng xuất...</p>
          </div>
        ) : error ? (
          <div className="space-y-4">
            <div className="p-4 text-red-700 bg-red-100 border border-red-400 rounded-md">
              <p>{error}</p>
            </div>
            <button
              onClick={handleManualLogout}
              className="w-full px-4 py-2 text-white transition duration-300 bg-blue-500 rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
            >
              Thử lại
            </button>
            <button
              onClick={() => router.push("/")}
              className="w-full px-4 py-2 text-gray-700 transition duration-300 bg-gray-200 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-opacity-50"
            >
              Trở về trang chủ
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center space-y-4">
            <p className="text-green-600">Đăng xuất thành công!</p>
            <p className="text-gray-600">Đang chuyển hướng...</p>
          </div>
        )}
      </div>
    </div>
  );
}
