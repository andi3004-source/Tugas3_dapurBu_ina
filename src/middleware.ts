import NextAuth from "next-auth";
import { NextResponse } from "next/server";
import { authConfig } from "@/lib/auth.config";
import { resolveAccess } from "@/lib/access";

const { auth } = NextAuth(authConfig);

export default auth((req) => {
  const { nextUrl } = req;
  const decision = resolveAccess(nextUrl.pathname, req.auth?.user?.role, !!req.auth);

  if (decision.action === "next") return NextResponse.next();
  const url = new URL(decision.to, nextUrl);
  if (decision.callbackUrl) url.searchParams.set("callbackUrl", decision.callbackUrl);
  return NextResponse.redirect(url);
});

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
