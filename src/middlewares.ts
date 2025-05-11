import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Các đường dẫn công khai không cần xác thực
  const publicPaths = ["/accounts", "/accounts/login", "/accounts/register"];
  const isPublicPath = publicPaths.some(path => pathname === path || pathname.startsWith(`${path}/`));

  if (isPublicPath) {
    return NextResponse.next();
  }

  // Kiểm tra cookie "token"
  const token = request.cookies.get("token");

  // Kiểm tra header Authorization (có thể được gửi từ client với token từ localStorage)
  const authHeader = request.headers.get("Authorization");
  const xAccessToken = request.headers.get("X-Access-Token");

  // Thêm kiểm tra cả query param token (dùng cho trường hợp dự phòng)
  const urlToken = request.nextUrl.searchParams.get("token");

  // Nếu không có token trong cookie và không có header Authorization
  if (!token && !authHeader && !xAccessToken && !urlToken) {
    // Kiểm tra user agent để xác định có phải WebKit
    const userAgent = request.headers.get("user-agent") || "";
    const isWebKit = userAgent.includes("Safari") &&
                     (userAgent.includes("iPhone") ||
                      userAgent.includes("iPad") ||
                      userAgent.includes("Mac"));

    if (isWebKit) {
      // Đối với WebKit, thêm query param để trang frontend biết đây là request từ WebKit
      const redirectUrl = new URL("/accounts/login", request.url);
      redirectUrl.searchParams.set("webkit", "true");
      return NextResponse.redirect(redirectUrl);
    }

    return NextResponse.redirect(new URL("/accounts", request.url));
  }

  return NextResponse.next();
}

// Bao gồm API routes trong matcher để cho phép xác thực API
export const config = {
  matcher: [
    // Loại trừ các tệp tĩnh
    "/((?!_next/static|_next/image|favicon.ico|api/auth/check).*)",
  ],
};