import React, { ReactNode } from "react";
import { UserProvider } from "@/contexts/UserContext";
import { LogoutProvider } from "@/contexts/LogoutContext";
import { PostProvider } from "@/contexts/PostContext";

interface GlobalProviderProps {
  children: ReactNode;
}

export const GlobalProvider: React.FC<GlobalProviderProps> = ({ children }) => {
  return (
    <LogoutProvider>
      <UserProvider>
        <PostProvider>{children}</PostProvider>
      </UserProvider>
    </LogoutProvider>
  );
};

export default GlobalProvider;
