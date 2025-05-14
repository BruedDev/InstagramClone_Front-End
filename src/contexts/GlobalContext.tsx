import React, { ReactNode } from "react";
import { UserProvider } from "@/contexts/UserContext";
import { LogoutProvider } from "@/contexts/LogoutContext";

interface GlobalProviderProps {
  children: ReactNode;
}

export const GlobalProvider: React.FC<GlobalProviderProps> = ({ children }) => {
  return (
    <LogoutProvider>
      <UserProvider>{children}</UserProvider>
    </LogoutProvider>
  );
};

export default GlobalProvider;
