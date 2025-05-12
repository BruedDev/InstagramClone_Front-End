"use client";

import { useUser } from "@/app/hooks/useUser";

export default function Home() {
  const { user, loading } = useUser();

  if (loading || !user) {
    return [];
  }

  return (
    <div>
      <p>Xin chào, {user.username}</p>
      <p>Xin chào, {user.email}</p>
    </div>
  );
}
