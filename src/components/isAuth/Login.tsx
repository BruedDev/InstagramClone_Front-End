"use client";

import { useState, FormEvent, useEffect } from "react";
import { useRouter } from "next/navigation";
import { checkAuth } from "@/utils/isAuth";
import LoginUi from "./LoginUi";

interface LoginFormData {
  identifier: string;
  password: string;
}

export default function Login() {
  const router = useRouter();
  const [formData, setFormData] = useState<LoginFormData>({
    identifier: "",
    password: "",
  });
  const [error, setError] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Kiểm tra người dùng đã đăng nhập chưa khi component được load
  useEffect(() => {
    const checkIfLoggedIn = async () => {
      try {
        const isAuthenticated = await checkAuth();

        if (isAuthenticated) {
          router.replace("/");
        }
      } catch (error: unknown) {
        setError(error instanceof Error ? error.message : "Có lỗi xảy ra");
      }
    };

    checkIfLoggedIn();
  }, [router]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);
    const apiUrl = process.env.NEXT_PUBLIC_API_URL;

    try {
      // Gửi dữ liệu đăng nhập
      const response = await fetch(`${apiUrl}/api/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          identifier: formData.identifier,
          password: formData.password,
        }),
        credentials: "include",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Đăng nhập thất bại");
      }

      router.replace("/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Có lỗi xảy ra");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <LoginUi
        {...{ formData, handleChange, handleSubmit, error, isLoading }}
      />
    </>
  );
}
