import { NextResponse } from "next/server"
import { getToken } from "next-auth/jwt"
import type { NextRequest } from "next/server"

export async function middleware(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET })
  const isLoggedIn = !!token

  const isOnProtectedRoute = req.nextUrl.pathname.startsWith("/profile")
  const isOnAuthRoute = req.nextUrl.pathname === "/login" ||
                        req.nextUrl.pathname === "/register"

  if (isLoggedIn && isOnAuthRoute) {
    return NextResponse.redirect(new URL("/", req.nextUrl))
  }

  if (!isLoggedIn && isOnProtectedRoute) {
    return NextResponse.redirect(new URL("/login", req.nextUrl))
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    "/profile/:path*",
    "/login",
    "/register"
  ]
}
