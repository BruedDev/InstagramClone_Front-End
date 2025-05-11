import LoginGoogle from "@/components/LoginGoogle";
import Image from "next/image";
import Link from "next/link";

interface LoginProps {
  identifier: string;
  setIdentifier: (value: string) => void;
  password: string;
  setPassword: (value: string) => void;
  error: string | null;
  handleLogin: () => void;
  handleKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void;
}

export default function Login({
  identifier,
  setIdentifier,
  password,
  setPassword,
  error,
  handleLogin,
  handleKeyDown,
}: LoginProps) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-black">
      <div className="w-full max-w-sm">
        <div className="mb-4 rounded border border-gray-800 bg-black p-8">
          <div className="mb-8 flex justify-center">
            <Image
              src="/Images/logo.svg"
              alt="Instagram"
              width={175}
              height={51}
              priority
            />
          </div>

          <div className="space-y-4">
            <div>
              <input
                type="text"
                placeholder="Số điện thoại, tên người dùng hoặc email"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
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

            <button
              onClick={handleLogin}
              className="w-full rounded bg-blue-500 py-2 text-sm font-semibold text-white hover:bg-blue-600"
            >
              Đăng nhập
            </button>

            {error && (
              <div className="text-center text-xs text-red-500">{error}</div>
            )}

            <div className="relative my-4 flex items-center">
              <div className="flex-grow border-t border-gray-700"></div>
              <span className="mx-4 flex-shrink text-xs text-gray-400">
                HOẶC
              </span>
              <div className="flex-grow border-t border-gray-700"></div>
            </div>

            <LoginGoogle />

            <div className="text-center">
              <a
                href="#"
                className="text-xs font-medium text-blue-500 hover:text-blue-400"
              >
                Quên mật khẩu?
              </a>
            </div>
          </div>
        </div>

        <div className="mt-4 rounded border border-gray-800 bg-black p-6 text-center">
          <p className="text-sm text-gray-400">
            Bạn chưa có tài khoản?{" "}
            <Link
              href="/accounts/register"
              className="font-semibold text-blue-500"
            >
              Đăng ký
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
