import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(req: NextRequest) {
  const pathname = req.nextUrl.pathname;
  
  // Check for auth token in cookies (lightweight check, no server imports)
  const token = req.cookies.get('sb-auth-token')?.value;
  const hasSession = !!token;

  const isProtectedRoute = pathname.startsWith('/dashboard');
  const isLoginRoute = pathname === '/login';

  if (!hasSession && isProtectedRoute) {
    const redirectUrl = req.nextUrl.clone();
    redirectUrl.pathname = '/login';
    redirectUrl.search = `redirectedFrom=${encodeURIComponent(pathname)}`;
    return NextResponse.redirect(redirectUrl);
  }

  if (hasSession && isLoginRoute) {
    return NextResponse.redirect(new URL('/dashboard', req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*', '/login'],
};
