import { useContext } from "react";
import { UserContext } from "@/contexts/UserContext";
import type { UserContextType } from "@/contexts/UserContext";

export const useUser = (): UserContextType => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error("useUser phải được dùng bên trong UserProvider");
  }
  return context;
};
