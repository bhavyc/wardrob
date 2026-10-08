import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

const JWT_SECRET_RAW = process.env.JWT_SECRET;

export async function proxy(request: NextRequest) {
  // Filter out invalid bot probes or outdated client Next-Action headers
  if (request.headers.get('next-action')) {
    return new NextResponse('Action Not Found', { status: 404 });
  }

  const { pathname } = request.nextUrl;

  // 1. Identify protected route areas
  const isAdminPath = pathname.startsWith('/admin') || pathname.startsWith('/api/admin');
  const isListerPath = pathname.startsWith('/lister') || pathname.startsWith('/api/lister');
  const isHubPath = pathname.startsWith('/hub') || pathname.startsWith('/api/hub');
  const isRenterPath = 
    pathname === '/profile' || pathname.startsWith('/profile/') ||
    pathname === '/id-verification' || pathname.startsWith('/id-verification/') ||
    pathname.startsWith('/api/user') ||
    pathname.startsWith('/api/orders');
  const isApiPath = pathname.startsWith('/api/');

  // If path is not a protected area, bypass
  if (!isAdminPath && !isListerPath && !isHubPath && !isRenterPath) {
    return NextResponse.next();
  }

  // Bypass auth for public onboarding/login endpoints and token-based mobile camera capture
  if (
    pathname.startsWith('/lister/register') ||
    pathname.startsWith('/lister/login') ||
    pathname.startsWith('/lister/mobile-capture') ||
    pathname.startsWith('/api/lister/mobile-capture') ||
    pathname.startsWith('/admin/login') ||
    pathname.startsWith('/hub/login') ||
    pathname.startsWith('/hub/mobile-capture') ||
    pathname.startsWith('/api/hub/mobile-capture') ||
    pathname === '/api/lister/register' ||
    pathname === '/api/lister/login'
  ) {
    return NextResponse.next();
  }

  const token = request.cookies.get('auth_token')?.value || 
    request.headers.get('authorization')?.replace(/^Bearer\s+/i, '');

  // If no token, return 401 JSON for API requests or redirect for pages
  if (!token) {
    if (isApiPath) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }
    if (isAdminPath) {
      return NextResponse.redirect(new URL('/admin/login', request.url));
    }
    if (isHubPath) {
      return NextResponse.redirect(new URL('/hub/login', request.url));
    } 
    if (isListerPath) {
      return NextResponse.redirect(new URL('/lister/login', request.url));
    }
    return NextResponse.redirect(new URL('/login', request.url));
  }

  if (!JWT_SECRET_RAW) {
    console.error('FATAL: JWT_SECRET environment variable is missing.');
    if (isApiPath) {
      return NextResponse.json({ success: false, error: 'Server authentication configuration error.' }, { status: 500 });
    }
    return NextResponse.redirect(new URL('/login', request.url));
  }

  try {
    const secretKey = new TextEncoder().encode(JWT_SECRET_RAW);
    // Enforce HS256 algorithm to reject any signature algorithm confusion attacks
    const { payload } = await jwtVerify(token, secretKey, {
      algorithms: ['HS256'],
    });
    const role = payload.role as string;

    // 2. Protect Admin routes
    if (isAdminPath) {
      if (role !== 'ADMIN') {
        if (isApiPath) {
          return NextResponse.json({ success: false, error: 'Admin access required' }, { status: 403 });
        }
        return NextResponse.redirect(new URL('/admin/login', request.url));
      }
    }

    // 3. Protect Lister routes
    if (isListerPath) {
      if (role !== 'LISTER' && role !== 'ADMIN') {
        if (isApiPath) {
          return NextResponse.json({ success: false, error: 'Lister access required' }, { status: 403 });
        }
        return NextResponse.redirect(new URL('/lister/login', request.url));
      }
    }

    // 4. Protect Hub routes
    if (isHubPath) {
      if (role !== 'HUB_PARTNER' && role !== 'ADMIN') {
        if (isApiPath) {
          return NextResponse.json({ success: false, error: 'Hub access required' }, { status: 403 });
        }
        return NextResponse.redirect(new URL('/hub/login', request.url));
      }
    }

    return NextResponse.next();
  } catch (error) {
    console.error('Proxy Auth Verification Failed:', error);
    if (isApiPath) {
      return NextResponse.json({ success: false, error: 'Invalid or expired token' }, { status: 401 });
    }
    const target = isAdminPath ? '/admin/login' : isHubPath ? '/hub/login' : isListerPath ? '/lister/login' : '/login';
    const redirectResponse = NextResponse.redirect(new URL(target, request.url));
    redirectResponse.cookies.set('auth_token', '', { path: '/', maxAge: 0 });
    return redirectResponse;
  }
}

// Config to specify the matched routes (all routes except static assets)
export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
