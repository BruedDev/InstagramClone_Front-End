// hooks/useCall.tsx
import { useContext } from "react";
import CallContext from "@/contexts/CallContext";

export const useCall = () => {
  const context = useContext(CallContext);
  if (context === undefined) {
    throw new Error("useCall phải được dùng bên trong CallProvider");
  }
  return context;
};
