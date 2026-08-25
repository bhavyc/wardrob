import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

if (!process.env.JWT_SECRET) {
  throw new Error('FATAL: JWT_SECRET environment variable is missing.');
}
const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET);

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. Bypass auth for login and registration paths
  if (
    pathname.startsWith('/lister/register') ||
    pathname.startsWith('/lister/login') ||
    pathname.startsWith('/admin/login')
  ) {
    return NextResponse.next();
  }

  const token = request.cookies.get('auth_token')?.value;

  // If no token, redirect to respective login screens
  if (!token) {
    if (pathname.startsWith('/admin')) {
      return NextResponse.redirect(new URL('/admin/login', request.url));
    }
    return NextResponse.redirect(new URL('/lister/login', request.url));
  }

  try {
    // Verify JWT payload on the Node.js runtime using 'jose'
    const { payload } = await jwtVerify(token, JWT_SECRET);
    const role = payload.role as string;

    // 2. Protect Admin routes
    if (pathname.startsWith('/admin')) {
      if (role !== 'ADMIN') {
        return NextResponse.redirect(new URL('/admin/login', request.url));
      }
    }

    // 3. Protect Lister routes
    if (pathname.startsWith('/lister')) {
      if (role !== 'LISTER') {
        return NextResponse.redirect(new URL('/lister/login', request.url));
      }
    }
    // 4. Protect Hub routes
    if (pathname.startsWith('/hub')) {
      if (role !== 'HUB_PARTNER' && role !== 'ADMIN') {
        return NextResponse.redirect(new URL('/admin/login', request.url));
      }
    }

    return NextResponse.next();
  } catch (error) {
    console.error('Proxy Auth Verification Failed:', error);
    const target = pathname.startsWith('/admin') ? '/admin/login' : '/lister/login';
    const redirectResponse = NextResponse.redirect(new URL(target, request.url));
    redirectResponse.cookies.delete('auth_token');
    return redirectResponse;
  }
}

// Config to specify the matched routes
export const config = {
  matcher: [
    '/admin/:path*',
    '/lister/:path*',
    '/hub/:path*',
  ],
};
