import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl;

  // Các đường dẫn công khai không cần xác thực
  const publicPaths = ["/accounts", "/accounts/login", "/accounts/register"];
  if (publicPaths.some(path => pathname === path || pathname.startsWith(path + "/"))) {
    return NextResponse.next();
  }

  let isAuthenticated = false;

  // 1. Kiểm tra token trong cookie
  const tokenCookie = request.cookies.get("token");
  if (tokenCookie?.value) {
    isAuthenticated = true;
  }

  // 2. Kiểm tra token trong Authorization header (dùng cho fallback khi cookie bị chặn)
  const authHeader = request.headers.get("Authorization");
  if (!isAuthenticated && authHeader && authHeader.startsWith("Bearer ")) {
    isAuthenticated = true;
  }

  // 3. Kiểm tra token trong query params (dùng cho OAuth callbacks và trường hợp iOS/macOS)
  const tokenParam = searchParams.get("token");
  if (!isAuthenticated && tokenParam) {
    isAuthenticated = true;

    // Chuyển hướng tới cùng URL nhưng không có token trong query params
    // Để tránh để lộ token trong URL history
    if (tokenParam) {
      const cleanUrl = new URL(request.url);
      cleanUrl.searchParams.delete("token");

      // Chỉ chuyển hướng nếu URL đã thay đổi
      if (cleanUrl.toString() !== request.url) {
        return NextResponse.redirect(cleanUrl);
      }
    }
  }

  // Nếu không có token, chuyển hướng đến trang đăng nhập
  if (!isAuthenticated) {
    return NextResponse.redirect(new URL("/accounts", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|assets|api).*)"],
};