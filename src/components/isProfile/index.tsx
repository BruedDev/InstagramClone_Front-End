"use client";
import { useUser } from "@/app/hooks/useUser";

interface IsProfileProps {
  profileId: string; // ID hoặc username để kiểm tra
  children: React.ReactNode;
  fallback?: React.ReactNode; // Nội dung hiển thị nếu không phải là profile
}

export default function IsProfile({
  profileId,
  children,
  fallback = null,
}: IsProfileProps) {
  const { user, loading } = useUser();

  if (loading || !user) {
    return null;
  }

  const isUser = user.username;
  const isId = user.id;

  const isProfile = profileId === isId || profileId === isUser;

  return <>{isProfile ? children : fallback}</>;
}
