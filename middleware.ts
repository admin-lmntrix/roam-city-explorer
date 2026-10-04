import NextAuth from "next-auth";
import { NextResponse } from "next/server";
import authConfig from "./auth.config";

const { auth } = NextAuth(authConfig);

// First line of defence. Admin API handlers ALSO re-check the role against the
// database (see lib/http.ts → getCurrentUser) so a stale token can't act as admin.
export default auth((req) => {
  const { nextUrl } = req;
  const user = req.auth?.user;
  const isApi = nextUrl.pathname.startsWith("/api/");
  const needsAdmin = nextUrl.pathname.startsWith("/admin") || nextUrl.pathname.startsWith("/api/admin");

  if (!user) {
    if (isApi) return NextResponse.json({ error: "Please sign in." }, { status: 401 });
    const url = new URL("/login", nextUrl);
    url.searchParams.set("callbackUrl", nextUrl.pathname);
    return NextResponse.redirect(url);
  }
  if (needsAdmin && user.role !== "ADMIN") {
    if (isApi) return NextResponse.json({ error: "Admins only." }, { status: 403 });
    return NextResponse.redirect(new URL("/", nextUrl));
  }
  return NextResponse.next();
});

export const config = { matcher: ["/admin/:path*", "/api/admin/:path*", "/saved"] };
