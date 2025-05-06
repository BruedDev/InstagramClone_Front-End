"use client";

import { useState, FormEvent, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

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
      const apiUrl = process.env.NEXT_PUBLIC_API_URL;
      console.log("apiUrl:", apiUrl);
      try {
        // Kiểm tra trạng thái đăng nhập bằng cách gọi API check
        const response = await fetch(`${apiUrl}/api/auth/check`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include", // Đảm bảo gửi cookie với request
        });

        if (response.ok) {
          // Nếu đã đăng nhập, chuyển hướng đến trang chính
          console.log("Người dùng đã đăng nhập, chuyển hướng về trang chủ");
          router.replace("/");
        } else {
          console.log("Chưa đăng nhập, ở lại trang đăng nhập");
        }
      } catch (error) {
        console.error("Lỗi khi kiểm tra đăng nhập:", error);
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
    console.log("Đang gửi dữ liệu đăng nhập:", formData);
    const apiUrl = process.env.NEXT_PUBLIC_API_URL;

    try {
      const response = await fetch(`${apiUrl}/api/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
        credentials: "include", // Quan trọng để nhận cookie từ server
      });

      console.log("Response status:", response.status);
      console.log("Response headers:", Object.fromEntries(response.headers));

      const data = await response.json();
      console.log("Response data:", data);

      if (!response.ok) {
        throw new Error(data.message || "Đăng nhập thất bại");
      }

      console.log("Đăng nhập thành công:", data);
      console.log("Kiểm tra cookies sau đăng nhập:", document.cookie);

      // Chuyển hướng đến trang chủ
      router.replace("/");
    } catch (err) {
      console.error("Lỗi đăng nhập:", err);
      setError(err instanceof Error ? err.message : "Có lỗi xảy ra");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full bg-white p-8 rounded-lg shadow-md">
        <div className="text-center mb-6">
          <h2 className="text-3xl font-bold text-gray-900">Đăng nhập</h2>
          <p className="mt-2 text-sm text-gray-600">Đăng nhập để tiếp tục</p>
        </div>

        <form className="space-y-6" onSubmit={handleSubmit}>
          <div>
            <label
              htmlFor="identifier"
              className="block text-sm font-medium text-gray-700"
            >
              Tên đăng nhập/Email/Số điện thoại
            </label>
            <input
              id="identifier"
              name="identifier"
              type="text"
              required
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="Nhập tên đăng nhập, email hoặc số điện thoại"
              value={formData.identifier}
              onChange={handleChange}
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-gray-700"
            >
              Mật khẩu
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="Nhập mật khẩu"
              value={formData.password}
              onChange={handleChange}
            />
          </div>

          {error && (
            <div className="p-2 text-center text-red-500 text-sm bg-red-50 rounded-md">
              {error}
            </div>
          )}

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {isLoading ? "Đang xử lý..." : "Đăng nhập"}
            </button>
          </div>

          <div className="flex items-center justify-between mt-4 text-sm">
            <Link
              href="/forgot-password"
              className="font-medium text-blue-600 hover:text-blue-500"
            >
              Quên mật khẩu?
            </Link>
            <Link
              href="/register"
              className="font-medium text-blue-600 hover:text-blue-500"
            >
              Đăng ký tài khoản
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
