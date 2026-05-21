import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(req: NextRequest) {
  // Completely minimal - just pass through
  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*'],
};
