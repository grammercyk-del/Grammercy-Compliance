import { createSupabaseServerClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();
  const supabase = createSupabaseServerClient(res);

  if (supabase) {
    await supabase.auth.refreshSession();
  }

  const {
    data: { session },
  } = supabase ? await supabase.auth.getSession() : { data: { session: null } };

  const pathname = req.nextUrl.pathname;
  const isProtectedRoute = pathname.startsWith('/dashboard');
  const isLoginRoute = pathname === '/login';

  if (!session && isProtectedRoute) {
    const redirectUrl = req.nextUrl.clone();
    redirectUrl.pathname = '/login';
    redirectUrl.search = `redirectedFrom=${encodeURIComponent(pathname)}`;
    return NextResponse.redirect(redirectUrl);
  }

  if (session && isLoginRoute) {
    return NextResponse.redirect(new URL('/dashboard', req.url));
  }

  return res;
}

export const config = {
  matcher: ['/dashboard/:path*', '/login'],
};
