"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { register } from "@/server/auth";
import type { User } from "@/server/auth";
import Register from "@/app/ui/Register";

export default function RegisterComponent() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [username, setUsername] = useState("");
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleRegister = async () => {
    setError(null);

    // Kiểm tra trường dữ liệu
    if (!email && !email.includes("@")) {
      setError("Vui lòng nhập email hợp lệ");
      return;
    }

    if (!password || password.length < 6) {
      setError("Mật khẩu phải có ít nhất 6 ký tự");
      return;
    }

    if (!fullName) {
      setError("Vui lòng nhập tên đầy đủ");
      return;
    }

    if (!username) {
      setError("Vui lòng nhập tên người dùng");
      return;
    }

    try {
      const user: User = await register({
        username,
        fullName,
        email,
        password,
      });
      console.log("✅ Đăng ký thành công:", user);
      router.push("/");
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
        console.error("❌ Lỗi đăng ký:", err.message);
      } else {
        setError("Đã xảy ra lỗi khi đăng ký. Vui lòng thử lại.");
        console.error("❌ Lỗi không xác định:", err);
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleRegister();
    }
  };

  return (
    <Register
      {...{
        email,
        setEmail,
        password,
        setPassword,
        fullName,
        setFullName,
        username,
        setUsername,
        error,
        setError,
        handleRegister,
        handleKeyDown,
      }}
    />
  );
}
