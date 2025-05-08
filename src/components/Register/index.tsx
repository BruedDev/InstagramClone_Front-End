"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import api from "@/utils/api"; // Sử dụng api được cấu hình chung
import { toast } from "react-hot-toast";

interface FormData {
  email: string;
  fullName: string;
  username: string;
  password: string;
}

interface RegisterResponse {
  message: string;
  user: {
    id: string;
    username: string;
    fullName: string;
    profilePicture?: string;
    followers: string[];
    following: string[];
    email?: string;
    phoneNumber?: string;
  };
}

export default function Register() {
  const router = useRouter();
  const [formData, setFormData] = useState<FormData>({
    email: "",
    fullName: "",
    username: "",
    password: "",
  });
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [step, setStep] = useState<number>(1); // Đa bước như Instagram

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleNextStep = () => {
    // Validate step 1 (email)
    if (step === 1) {
      if (!formData.email || !formData.email.includes("@")) {
        toast.error("Vui lòng nhập địa chỉ email hợp lệ");
        return;
      }
      setStep(2);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate form data
    if (
      !formData.email ||
      !formData.fullName ||
      !formData.username ||
      !formData.password
    ) {
      toast.error("Tất cả các trường đều bắt buộc");
      return;
    }

    if (formData.password.length < 6) {
      toast.error("Mật khẩu phải có ít nhất 6 ký tự");
      return;
    }

    setIsLoading(true);

    try {
      // Sử dụng api đã được cấu hình thay vì axios trực tiếp
      await api.post<RegisterResponse>("/api/auth/register", formData);

      toast.success("Đăng ký thành công!");
      router.push("/"); // Chuyển hướng đến trang chủ sau khi đăng ký thành công
    } catch (error: unknown) {
      // Không cần xử lý lỗi chi tiết ở đây vì interceptor đã xử lý
      console.error("Registration error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
      <div className="w-full max-w-md">
        <div className="bg-white p-8 border border-gray-300 rounded-lg mb-4">
          {/* Instagram Logo */}
          <div className="flex justify-center mb-8">
            <Image
              src="/instagram-logo.png"
              alt="Instagram"
              width={175}
              height={51}
              priority
            />
          </div>

          {step === 1 ? (
            // Step 1: Email
            <>
              <h2 className="text-center text-lg font-semibold text-gray-700 mb-6">
                Đăng ký để xem ảnh và video từ bạn bè của bạn.
              </h2>

              <button className="w-full bg-blue-500 text-white py-2 rounded font-semibold mb-4 flex items-center justify-center">
                <svg
                  className="w-5 h-5 mr-2"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm1.441 18.389h-2.894v-5.69H8.538v-2.777h2.01V8.472c0-1.994 1.212-3.083 3-3.083.853 0 1.585.064 1.797.093v2.094h-1.234c-.967 0-1.153.46-1.153 1.134v1.486h2.304l-.303 2.777h-2.001v5.69z"></path>
                </svg>
                Đăng nhập bằng Facebook
              </button>

              <div className="flex items-center my-4">
                <div className="flex-1 border-t border-gray-300"></div>
                <div className="px-4 text-sm text-gray-500">HOẶC</div>
                <div className="flex-1 border-t border-gray-300"></div>
              </div>

              <form>
                <div className="mb-3">
                  <div className="relative">
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="Số điện thoại hoặc Email"
                      className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-gray-400"
                    />
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleNextStep}
                  className="w-full bg-blue-500 text-white py-2 rounded font-semibold disabled:opacity-50"
                  disabled={!formData.email}
                >
                  Tiếp tục
                </button>
              </form>
            </>
          ) : (
            // Step 2: Full Registration
            <>
              <h2 className="text-center text-lg font-semibold text-gray-700 mb-6">
                Hoàn tất đăng ký
              </h2>

              <form onSubmit={handleSubmit}>
                <div className="mb-3">
                  <div className="relative">
                    <input
                      type="text"
                      name="fullName"
                      value={formData.fullName}
                      onChange={handleChange}
                      placeholder="Họ và tên"
                      className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-gray-400"
                    />
                  </div>
                </div>

                <div className="mb-3">
                  <div className="relative">
                    <input
                      type="text"
                      name="username"
                      value={formData.username}
                      onChange={handleChange}
                      placeholder="Tên người dùng"
                      className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-gray-400"
                    />
                  </div>
                </div>

                <div className="mb-3">
                  <div className="relative">
                    <input
                      type="password"
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      placeholder="Mật khẩu"
                      className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-gray-400"
                    />
                  </div>
                </div>

                <p className="text-xs text-gray-500 mb-4 text-center">
                  Những người sử dụng dịch vụ của chúng tôi có thể đã tải thông
                  tin liên hệ của bạn lên Instagram.{" "}
                  <Link href="#" className="text-blue-900">
                    Tìm hiểu thêm
                  </Link>
                </p>

                <p className="text-xs text-gray-500 mb-4 text-center">
                  Bằng cách đăng ký, bạn đồng ý với Điều khoản, Chính sách Quyền
                  riêng tư và Chính sách Cookie của chúng tôi.
                </p>

                <button
                  type="submit"
                  className="w-full bg-blue-500 text-white py-2 rounded font-semibold disabled:opacity-50"
                  disabled={
                    isLoading ||
                    !formData.fullName ||
                    !formData.username ||
                    !formData.password
                  }
                >
                  {isLoading ? "Đang đăng ký..." : "Đăng ký"}
                </button>
              </form>
            </>
          )}
        </div>

        <div className="bg-white p-6 border border-gray-300 rounded-lg text-center">
          <p>
            Bạn đã có tài khoản?{" "}
            <Link href="/login" className="text-blue-500 font-semibold">
              Đăng nhập
            </Link>
          </p>
        </div>

        <div className="mt-4 text-center">
          <p className="text-sm">Tải ứng dụng.</p>
          <div className="flex justify-center space-x-4 mt-4">
            <Image
              src="/app-store.png"
              alt="App Store"
              width={136}
              height={40}
            />
            <Image
              src="/google-play.png"
              alt="Google Play"
              width={136}
              height={40}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
