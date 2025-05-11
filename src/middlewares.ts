import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const { pathname, searchParams, origin } = request.nextUrl;

  const publicPaths = ["/accounts", "/accounts/login", "/accounts/register"];

  // Nếu là public path
  if (publicPaths.includes(pathname)) {
    const token = searchParams.get("token");
    console.log("Token from URL:", token);

    if (token) {
      // Lưu token vào cookie
      const response = NextResponse.redirect(new URL("/", origin)); // Chuyển hướng về `/`
      response.cookies.set("token", token, {
        httpOnly: true,
        secure: true,
        sameSite: "strict",
        path: "/",
        maxAge: 60 * 60 * 24, // 1 day
      });
      return response;
    }

    return NextResponse.next();
  }

  // Kiểm tra token trong cookie với các route protected
  const token = request.cookies.get("token")?.value;

  if (!token) {
    return NextResponse.redirect(new URL("/accounts", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
