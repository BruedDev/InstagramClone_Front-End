import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Tên cookie chứa token xác thực tiêu chuẩn
const AUTH_TOKEN_COOKIE = "token"; // Điều chỉnh tên này theo backend của bạn

// Tên cookie đặc biệt cho thiết bị Apple
const APPLE_AUTH_COOKIE = "auth_user_data";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Các đường dẫn công khai không cần xác thực
  const publicPaths = ["/accounts", "/accounts/login", "/accounts/register"];
  if (publicPaths.includes(pathname)) {
    return NextResponse.next();
  }

  // Đọc cookie token tiêu chuẩn
  const token = request.cookies.get(AUTH_TOKEN_COOKIE);

  // Đọc cookie đặc biệt cho thiết bị Apple
  const appleAuthCookie = request.cookies.get(APPLE_AUTH_COOKIE);

  // Phát hiện thiết bị Apple từ User-Agent
  const userAgent = request.headers.get("user-agent") || "";
  const isApplePlatform =
    userAgent.toLowerCase().includes('mac') ||
    userAgent.toLowerCase().includes('iphone') ||
    userAgent.toLowerCase().includes('ipad') ||
    userAgent.toLowerCase().includes('ipod');

  // Xác thực dựa trên:
  // 1. Token tiêu chuẩn cho tất cả các thiết bị
  // 2. Cookie đặc biệt cho thiết bị Apple
  const isAuthenticated = token || (isApplePlatform && appleAuthCookie);

  if (!isAuthenticated) {
    return NextResponse.redirect(new URL("/accounts", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};