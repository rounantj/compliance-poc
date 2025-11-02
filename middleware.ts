import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const token = request.cookies.get('auth-token');
  const { pathname } = request.nextUrl;

  // Public routes
  if (pathname === '/login') {
    return NextResponse.next();
  }

  // Protected routes
  if (!token && (pathname === '/consultoria' || pathname === '/relatorios')) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/consultoria', '/relatorios', '/login'],
};
