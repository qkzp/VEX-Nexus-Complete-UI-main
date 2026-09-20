import { NextResponse } from "next/server";
import { auth } from "@/auth";

const protectedPrefixes = [
  "/app", "/dashboard", "/robots", "/ai", "/code", "/diagnostics",
  "/rankings", "/events", "/competition", "/team", "/join-team", "/forum",
  "/calculators", "/notebook", "/build-log", "/settings", "/onboarding",
];

function isProtectedPath(pathname: string) {
  return protectedPrefixes.some((prefix) => pathname === prefix || pathname.startsWith(prefix + "/"));
}

export const proxy = auth((request) => {
  if (!isProtectedPath(request.nextUrl.pathname) || request.auth?.user?.id) return NextResponse.next();
  const gateUrl = new URL("/login", request.nextUrl.origin);
  gateUrl.searchParams.set("callbackUrl", request.nextUrl.pathname + request.nextUrl.search);
  return NextResponse.redirect(gateUrl);
});

export const config = {
  matcher: [
    "/app/:path*", "/dashboard/:path*", "/robots/:path*", "/ai/:path*", "/code/:path*",
    "/diagnostics/:path*", "/rankings/:path*", "/events/:path*", "/competition/:path*",
    "/team/:path*", "/join-team/:path*", "/forum/:path*", "/calculators/:path*",
    "/notebook/:path*", "/build-log/:path*", "/settings/:path*", "/onboarding/:path*",
  ],
};
