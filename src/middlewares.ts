import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Các đường dẫn công khai không cần xác thực
  const publicPaths = ["/accounts", "/accounts/login", "/accounts/register"];
  if (publicPaths.some(path => pathname.startsWith(path))) {
    return NextResponse.next();
  }

  // Đọc cookie "token" từ request
  const token = request.cookies.get("token");

  // Nếu không có token trong cookie, kiểm tra query params (cho trường hợp redirect từ Facebook)
  if (!token) {
    // Nếu là chuyển hướng đầu tiên từ Facebook với token trong URL, cho phép truy cập
    const url = new URL(request.url);
    const tokenParam = url.searchParams.get("token");
    const cookieSetParam = url.searchParams.get("cookieSet");

    if (tokenParam && cookieSetParam === "true") {
      // Cho phép truy cập để client-side code có thể lưu token vào localStorage
      return NextResponse.next();
    }

    // Nếu không có token trong cookie hoặc URL, kiểm tra header xem có token không (từ localStorage)
    const authHeader = request.headers.get("Authorization");
    if (authHeader && authHeader.startsWith("Bearer ")) {
      // Có token trong header, cho phép truy cập
      return NextResponse.next();
    }

    // Không có token ở bất kỳ đâu, chuyển hướng đến trang đăng nhập
    return NextResponse.redirect(new URL("/accounts", request.url));
  }

  // Có token trong cookie, cho phép truy cập
  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|instagram.png|api|styles|globals.css).*)",
  ],
};
