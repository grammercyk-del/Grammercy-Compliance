import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // Auth disabled temporarily for stability
  return NextResponse.next();
}

export const config = {
  matcher: [],
};