import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(req: NextRequest) {
  try {
    const pathname = req.nextUrl.pathname;
    
    // Check for Supabase auth token in cookies
    const authToken = req.cookies.get('sb-auth-token');
    const hasSession = authToken?.value ? true : false;

    const isProtectedRoute = pathname.startsWith('/dashboard');
    const isLoginRoute = pathname === '/login' || pathname.startsWith('/login');

    // Redirect unauthenticated users to login when accessing dashboard
    if (!hasSession && isProtectedRoute) {
      const loginUrl = new URL('/login', req.url);
      loginUrl.searchParams.set('redirectedFrom', pathname);
      return NextResponse.redirect(loginUrl);
    }

    // Redirect authenticated users away from login page
    if (hasSession && isLoginRoute) {
      return NextResponse.redirect(new URL('/dashboard', req.url));
    }

    // Allow the request to proceed
    return NextResponse.next();
  } catch (error) {
    // If anything goes wrong, allow the request through
    console.error('Middleware error:', error);
    return NextResponse.next();
  }
}

export const config = {
  matcher: ['/dashboard', '/dashboard/:path*', '/login'],
};
