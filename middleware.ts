import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // Allow all routes - auth is handled on the client side
  return NextResponse.next();
}

export const config = {
  matcher: [],
};