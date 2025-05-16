import { useContext } from "react";
import { PostContext } from "@/contexts/PostContext";

export function usePost() {
  const context = useContext(PostContext);
  if (!context) {
    throw new Error("usePost must be used within a PostProvider");
  }
  return context;
}
