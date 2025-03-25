import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const isAuth = !!token;
    const isAuthPage =
      req.nextUrl.pathname.startsWith("/auth/login") ||
      req.nextUrl.pathname.startsWith("/auth/register") ||
      req.nextUrl.pathname.startsWith("/auth/forgot-password") ||
      req.nextUrl.pathname.startsWith("/auth/reset-password");

    // Redirect authenticated users away from auth pages
    if (isAuthPage) {
      if (isAuth) {
        return NextResponse.redirect(new URL("/dashboard", req.url));
      }
      return null;
    }

    // Protected routes
    if (!isAuth) {
      let from = req.nextUrl.pathname;
      if (req.nextUrl.search) {
        from += req.nextUrl.search;
      }

      return NextResponse.redirect(
        new URL(`/auth/login?from=${encodeURIComponent(from)}`, req.url)
      );
    }
  },
  {
    callbacks: {
      authorized: () => true, // Always return true to let our middleware handle the logic
    },
  }
);

// Specify which paths should trigger this middleware
export const config = {
  matcher: [
    // Protected routes that require authentication
    "/dashboard/:path*",
    "/accounts/:path*",
    "/transactions/:path*",
    "/categories/:path*",

    "/debts/:path*",
    "/upload/:path*",
    "/chat/:path*",
    "/settings/:path*",
    // Auth pages that should redirect authenticated users away
    "/auth/login",
    "/auth/register",
    "/auth/forgot-password",
    "/auth/reset-password",
  ],
};
