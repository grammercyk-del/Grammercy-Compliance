import { createServerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import type { NextResponse } from 'next/server';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '';

function getServerCookieMethods(res?: NextResponse) {
  return {
    getAll: () =>
      cookies().getAll().map((cookie) => ({
        name: cookie.name,
        value: cookie.value,
        options: {},
      })),
    setAll: res
      ? (cookieArray: { name: string; value: string; options: Record<string, unknown> }[]) => {
          cookieArray.forEach((cookie) => {
            res.cookies.set(cookie.name, cookie.value, cookie.options as Record<string, string | number | boolean>);
          });
        }
      : undefined,
  };
}

export function createSupabaseServerClient(res?: NextResponse) {
  if (!supabaseUrl || !supabaseKey) {
    return null;
  }

  return createServerClient(supabaseUrl, supabaseKey, {
    cookies: getServerCookieMethods(res),
  });
}
