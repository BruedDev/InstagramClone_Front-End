import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const { pathname, searchParams, origin } = request.nextUrl;

  const publicPaths = ["/accounts", "/accounts/login", "/accounts/register"];

  // Cho phép truy cập các path công khai
  if (publicPaths.includes(pathname)) {
    const token = searchParams.get("token");
    console.log("Token from URL:", token);

    if (token) {
      // Lưu token vào cookie
      const response = NextResponse.redirect(new URL("/accounts", origin));
      response.cookies.set("token", token, {
        httpOnly: true,
        secure: true,
        sameSite: "none",
        path: "/",
        maxAge: 60 * 60 * 24,
      });
      return response;
    }

    return NextResponse.next();
  }

  // Kiểm tra token từ cookie
  const token = request.cookies.get("token")?.value;

  // Nếu không có token, chuyển hướng về trang đăng nhập
  if (!token) {
    return NextResponse.redirect(new URL("/accounts", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
