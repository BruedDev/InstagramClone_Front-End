"use client";

import React, { createContext, useState } from "react";
import { useRouter } from "next/navigation";
import { logout } from "@/server/auth";

// Tạo type cho context
export type LogoutContextType = {
  isLoggingOut: boolean;
  logoutError: string | null;
  handleLogout: (redirectPath?: string) => Promise<void>;
  clearLogoutError: () => void;
};

// Tạo context với giá trị mặc định
export const LogoutContext = createContext<LogoutContextType | undefined>(
  undefined
);

// Props cho Provider
type LogoutProviderProps = {
  children: React.ReactNode;
};

// Provider component
export const LogoutProvider: React.FC<LogoutProviderProps> = ({ children }) => {
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [logoutError, setLogoutError] = useState<string | null>(null);

  // Hàm xử lý đăng xuất
  const handleLogout = async (redirectPath: string = "/accounts") => {
    setIsLoggingOut(true);
    setLogoutError(null);

    try {
      // Gọi hàm logout từ server
      await logout();

      // Xóa dữ liệu lưu trữ cục bộ
      localStorage.clear();

      // Xóa cookies nếu cần thiết
      // document.cookie.split(";").forEach(cookie => {
      //   document.cookie = cookie
      //     .replace(/^ +/, "")
      //     .replace(/=.*/, `=;expires=${new Date().toUTCString()};path=/`);
      // });

      // Chuyển hướng đến trang đã chỉ định
      router.push(redirectPath);
    } catch (error) {
      console.error("Đăng xuất thất bại:", error);
      setLogoutError("Đã xảy ra lỗi khi đăng xuất. Vui lòng thử lại.");
    } finally {
      setIsLoggingOut(false);
    }
  };

  // Hàm xóa thông báo lỗi
  const clearLogoutError = () => {
    setLogoutError(null);
  };

  // Giá trị được chia sẻ qua context
  const value: LogoutContextType = {
    isLoggingOut,
    logoutError,
    handleLogout,
    clearLogoutError,
  };

  return (
    <LogoutContext.Provider value={value}>{children}</LogoutContext.Provider>
  );
};

export default LogoutContext;
