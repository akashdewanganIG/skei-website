import { type NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE } from "@/lib/auth/constants";
import { verifyToken } from "@/lib/auth/jwt";

const LOGIN_PATH = "/skei-portal/login";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  const secret = process.env.AUTH_SECRET;
  const session = token && secret ? await verifyToken(token, secret) : null;

  const isLoginPage = pathname === LOGIN_PATH;

  // Already signed in but sitting on the login page → send to the dashboard.
  if (session && isLoginPage) {
    return NextResponse.redirect(new URL("/skei-portal", request.url));
  }

  // Protect everything under /skei-portal except the login page itself.
  if (!session && !isLoginPage) {
    const loginUrl = new URL(LOGIN_PATH, request.url);
    if (pathname !== "/skei-portal") loginUrl.searchParams.set("from", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/skei-portal/:path*"],
};
