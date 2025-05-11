import LoginGoogle from "@/components/LoginGoogle";
import Image from "next/image";

type RegisterProps = {
  email: string;
  setEmail: (email: string) => void;
  password: string;
  setPassword: (password: string) => void;
  fullName: string;
  setFullName: (fullName: string) => void;
  username: string;
  setUsername: (username: string) => void;
  error: string | null;
  setError: (error: string | null) => void;
  handleRegister: () => Promise<void>;
  handleKeyDown: (e: React.KeyboardEvent) => void;
};

export default function Register({
  email,
  setEmail,
  password,
  setPassword,
  fullName,
  setFullName,
  username,
  setUsername,
  error,
  handleRegister,
  handleKeyDown,
}: RegisterProps) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-black">
      <div className="w-full max-w-sm">
        <div className="mb-4 rounded border border-gray-800 bg-black p-8">
          <div className="mb-6 flex justify-center">
            <Image
              src="/Images/logo.svg"
              alt="Instagram"
              width={175}
              height={51}
              priority
            />
          </div>

          <p className="mb-6 text-center text-sm text-gray-400">
            Đăng ký để xem ảnh và video từ bạn bè.
          </p>

          <LoginGoogle />

          <div className="relative my-4 flex items-center">
            <div className="flex-grow border-t border-gray-700"></div>
            <span className="mx-4 flex-shrink text-xs text-gray-400">HOẶC</span>
            <div className="flex-grow border-t border-gray-700"></div>
          </div>

          <div className="space-y-3">
            <div>
              <input
                type="email"
                placeholder="Số di động hoặc email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded border border-gray-700 bg-black px-2 py-2 text-sm text-white focus:border-gray-500 focus:outline-none"
                onKeyDown={handleKeyDown}
              />
            </div>

            <div>
              <input
                type="text"
                placeholder="Tên đầy đủ"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full rounded border border-gray-700 bg-black px-2 py-2 text-sm text-white focus:border-gray-500 focus:outline-none"
                onKeyDown={handleKeyDown}
              />
            </div>

            <div>
              <input
                type="text"
                placeholder="Tên người dùng"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full rounded border border-gray-700 bg-black px-2 py-2 text-sm text-white focus:border-gray-500 focus:outline-none"
                onKeyDown={handleKeyDown}
              />
            </div>

            <div>
              <input
                type="password"
                placeholder="Mật khẩu"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded border border-gray-700 bg-black px-2 py-2 text-sm text-white focus:border-gray-500 focus:outline-none"
                onKeyDown={handleKeyDown}
              />
            </div>

            <div className="pt-2">
              <button
                onClick={handleRegister}
                className="w-full rounded bg-blue-500 py-2 text-sm font-semibold text-white hover:bg-blue-600"
              >
                Đăng ký
              </button>
            </div>

            {error && (
              <div className="text-center text-xs text-red-500">{error}</div>
            )}

            <div className="mt-3 text-center text-xs text-gray-400">
              <p>
                Những người dùng dịch vụ của chúng tôi có thể đã tải thông tin
                liên hệ của bạn lên Instagram.{" "}
                <a href="#" className="text-blue-500 hover:text-blue-400">
                  Tìm hiểu thêm
                </a>
              </p>
            </div>

            <div className="mt-3 text-center text-xs text-gray-400">
              <p>
                Bằng cách đăng ký, bạn đồng ý với{" "}
                <a href="#" className="text-blue-500 hover:text-blue-400">
                  Điều khoản
                </a>
                ,{" "}
                <a href="#" className="text-blue-500 hover:text-blue-400">
                  Chính sách quyền riêng tư
                </a>{" "}
                và{" "}
                <a href="#" className="text-blue-500 hover:text-blue-400">
                  Chính sách cookie
                </a>{" "}
                của chúng tôi.
              </p>
            </div>
          </div>
        </div>

        <div className="mt-4 rounded border border-gray-800 bg-black p-6 text-center">
          <p className="text-sm text-gray-400">
            Bạn có tài khoản?{" "}
            <a href="/accounts/login" className="font-semibold text-blue-500">
              Đăng nhập
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
