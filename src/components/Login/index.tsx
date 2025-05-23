"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { login } from "@/server/auth";
import type { User } from "@/types/auth.type";
import Login from "@/app/ui/Login";

export default function LoginComponent() {
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleLogin = async () => {
    try {
      const user: User = await login({ identifier, password });
      localStorage.setItem("id", user.id);
      localStorage.setItem("username", user.username);
      router.push("/");
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
        console.error("Lỗi đăng nhập:", err.message);
      } else {
        setError("Đã xảy ra lỗi khi đăng nhập. Vui lòng thử lại.");
        console.error("Lỗi không xác định:", err);
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleLogin();
    }
  };

  return (
    <Login
      identifier={identifier}
      setIdentifier={setIdentifier}
      password={password}
      setPassword={setPassword}
      error={error}
      handleLogin={handleLogin}
      handleKeyDown={handleKeyDown}
    />
  );
}
