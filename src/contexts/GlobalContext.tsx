"use client";

import React, { ReactNode } from "react";
import { UserProvider } from "@/contexts/UserContext";
import { LogoutProvider } from "@/contexts/LogoutContext";
import { PostProvider } from "@/contexts/PostContext";

interface GlobalProviderProps {
  children: ReactNode;
}

export const GlobalProvider: React.FC<GlobalProviderProps> = ({ children }) => {
  return (
    <UserProvider>
      <LogoutProvider>
        <PostProvider>{children}</PostProvider>
      </LogoutProvider>
    </UserProvider>
  );
};

export default GlobalProvider;
