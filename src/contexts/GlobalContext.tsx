import React, { ReactNode } from "react";
import { UserProvider } from "@/contexts/UserContext";

interface GlobalProviderProps {
  children: ReactNode;
}

export const GlobalProvider: React.FC<GlobalProviderProps> = ({ children }) => {
  return <UserProvider>{children}</UserProvider>;
};

export default GlobalProvider;
