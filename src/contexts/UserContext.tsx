"use client";

import React, { createContext, useEffect, useState, ReactNode } from "react";
import { getUser } from "@/server/user";
import { GetUserResponse } from "@/types/user.type";

// Update UserContextType to allow null for user
interface UserContextType {
  user: GetUserResponse["user"] | null;
  loading: boolean;
  refreshUser: (username?: string) => Promise<void>;
}

// ✅ Tạo context với giá trị mặc định là undefined
const UserContext = createContext<UserContextType | undefined>(undefined);

// ✅ Provider để bọc toàn ứng dụng
export const UserProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<GetUserResponse["user"] | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Sử dụng logic từ ProfileUserId
  const fetchUser = async (username?: string) => {
    try {
      setLoading(true);
      // Nếu không truyền username thì lấy từ localStorage
      const finalUsername = username || localStorage.getItem("username");
      if (!finalUsername) {
        throw new Error("Không tìm thấy username trong localStorage");
      }
      const response = await getUser(finalUsername);
      setUser(response.user);
    } catch (error) {
      console.error("Lỗi khi lấy dữ liệu người dùng:", error);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUser();
  }, []);

  return (
    <UserContext.Provider value={{ user, loading, refreshUser: fetchUser }}>
      {children}
    </UserContext.Provider>
  );
};

export { UserContext };
export type { UserContextType };
