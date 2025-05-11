import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl;

  // ✅ Nếu URL chứa cookieSet=true thì redirect về Home
  const cookieSet = searchParams.get("cookieSet");
  if (cookieSet === "true") {
    const redirectUrl = new URL("/", request.url);
    return NextResponse.redirect(redirectUrl);
  }

  const publicPaths = ["/accounts", "/accounts/login", "/accounts/register"];
  if (publicPaths.includes(pathname)) {
    return NextResponse.next();
  }

  // ✅ Kiểm tra token trong cookie
  const token = request.cookies.get("token");

  if (!token) {
    return NextResponse.redirect(new URL("/accounts", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
