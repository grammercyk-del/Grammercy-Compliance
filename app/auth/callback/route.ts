import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export async function GET(req: NextRequest) {
  const res = NextResponse.redirect(new URL('/dashboard', req.url));
  const supabase = createSupabaseServerClient(res);
  const code = req.nextUrl.searchParams.get('code');

  if (!supabase || !code) {
    return NextResponse.redirect(new URL('/login', req.url));
  }

  const { data, error } = await supabase.auth.exchangeCodeForSession(code);

  if (error || !data.session) {
    const redirectUrl = new URL('/login', req.url);
    redirectUrl.searchParams.set('error', error?.message ?? 'Authentication failed');
    return NextResponse.redirect(redirectUrl);
  }

  return res;
}
