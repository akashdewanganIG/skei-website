import { NextResponse, type NextRequest } from "next/server";
import { verifyToken } from "@/lib/auth/jwt";
import { SESSION_COOKIE } from "@/lib/auth/constants";

const LOGIN_PATH = "/skei-admin/login";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  const secret = process.env.AUTH_SECRET;
  const session = token && secret ? await verifyToken(token, secret) : null;

  const isLoginPage = pathname === LOGIN_PATH;

  // Already signed in but sitting on the login page → send to the dashboard.
  if (session && isLoginPage) {
    return NextResponse.redirect(new URL("/skei-admin", request.url));
  }

  // Protect everything under /skei-admin except the login page itself.
  if (!session && !isLoginPage) {
    const loginUrl = new URL(LOGIN_PATH, request.url);
    if (pathname !== "/skei-admin") loginUrl.searchParams.set("from", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/skei-admin/:path*"],
};
