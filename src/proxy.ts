import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

if (!process.env.JWT_SECRET) {
  throw new Error('FATAL: JWT_SECRET environment variable is missing.');
}
const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET);

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. Only enforce protection on /admin, /lister, and /hub paths
  const isAdminPath = pathname.startsWith('/admin');
  const isListerPath = pathname.startsWith('/lister');
  const isHubPath = pathname.startsWith('/hub');
  const isApiPath = pathname.startsWith('/api/');

  // If path is not a protected area, bypass
  if (!isAdminPath && !isListerPath && !isHubPath) {
    return NextResponse.next();
  }

  // Bypass auth for public login and registration paths
  if (
    pathname.startsWith('/lister/register') ||
    pathname.startsWith('/lister/login') ||
    pathname.startsWith('/admin/login') ||
    pathname.startsWith('/hub/login')
  ) {
    return NextResponse.next();
  }

  const token = request.cookies.get('auth_token')?.value;

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
    return NextResponse.redirect(new URL('/lister/login', request.url));
  }

  try {
    // Verify JWT payload on the Node.js runtime using 'jose'
    const { payload } = await jwtVerify(token, JWT_SECRET);
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
    const target = isAdminPath ? '/admin/login' : isHubPath ? '/hub/login' : '/lister/login';
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
