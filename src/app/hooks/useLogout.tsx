"use client";

import { useContext } from "react";
import { LogoutContext, LogoutContextType } from "@/contexts/LogoutContext";

export const useLogout = (): LogoutContextType => {
  const context = useContext(LogoutContext);
  if (!context) {
    throw new Error("useLogout phải được sử dụng trong LogoutProvider");
  }
  return context;
};

export default useLogout;
