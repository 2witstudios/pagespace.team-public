import { NextRequest, NextResponse } from 'next/server';
import { decodeToken } from '@/lib/auth-utils';
import { parse } from 'cookie';

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Allow authentication routes to be accessed without a token
  if (pathname.startsWith('/api/auth')) {
    return NextResponse.next();
  }

  const cookieHeader = req.headers.get('cookie');
  const cookies = parse(cookieHeader || '');
  const accessToken = cookies.accessToken;

  if (!accessToken) {
    // If on an API route, return 401
    if (pathname.startsWith('/api')) {
      return new NextResponse('Authentication required', { status: 401 });
    }
    // For page routes, redirect to signin
    return NextResponse.redirect(new URL('/auth/signin', req.url));
  }

  const decoded = await decodeToken(accessToken);

  if (!decoded) {
    // If on an API route, return 401
    if (pathname.startsWith('/api')) {
      return new NextResponse('Invalid token', { status: 401 });
    }
    // For page routes, redirect to signin
    return NextResponse.redirect(new URL('/auth/signin', req.url));
  }

  // Token is valid, proceed with the request
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - /auth (authentication pages)
     */
    '/((?!_next/static|_next/image|favicon.ico|auth).*)',
  ],
};