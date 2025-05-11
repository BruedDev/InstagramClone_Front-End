import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const publicPaths = ["/accounts", "/accounts/login", "/accounts/register"];
  if (publicPaths.includes(pathname)) {
    return NextResponse.next();
  }

  // Đọc cookie "token" hoặc tên khác bạn dùng trong backend
  const token = request.cookies.get("token"); // ví dụ token

  if (!token) {
    return NextResponse.redirect(new URL("/accounts", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
