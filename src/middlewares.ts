import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl;

  // Danh sách các đường dẫn công khai (không cần token)
  const publicPaths = ["/accounts", "/accounts/login", "/accounts/register"];

  // Nếu là đường dẫn công khai, không cần kiểm tra token
  if (publicPaths.includes(pathname)) {
    return NextResponse.next();
  }

  // Lấy token từ query string trong URL
  const token = searchParams.get("token");

  // Nếu không có token, chuyển hướng đến trang đăng nhập
  if (!token) {
    return NextResponse.redirect(new URL("/accounts", request.url));
  }

  // Nếu có token, tiếp tục yêu cầu
  return NextResponse.next();
}

export const config = {
  // Matcher dùng để xác định các đường dẫn áp dụng middleware
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
