import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

function isValidSession(token: string | undefined): boolean {
  if (!token) return false;
  try {
    const jsonStr = Buffer.from(token, 'base64').toString('utf-8');
    const data = JSON.parse(jsonStr);
    return Boolean(data && data.id && data.email && data.role);
  } catch {
    return false;
  }
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get('production_erp_session')?.value;
  const isAuthenticated = isValidSession(token);

  // If already authenticated and trying to visit /login, redirect to /
  if (pathname === '/login') {
    if (isAuthenticated) {
      return NextResponse.redirect(new URL('/', request.url));
    }
    return NextResponse.next();
  }

  // If not authenticated
  if (!isAuthenticated) {
    // API routes return 401 Unauthorized
    if (pathname.startsWith('/api/')) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized. Please login.' },
        { status: 401 }
      );
    }

    // Web pages redirect to /login
    const loginUrl = new URL('/login', request.url);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export default proxy;

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - api/auth/login (Login endpoint)
     * - api/auth/logout (Logout endpoint)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - static assets (.svg, .png, .ico, etc.)
     */
    '/((?!api/auth/login|api/auth/logout|_next/static|_next/image|favicon\\.ico|icon\\.svg|.*\\.(?:svg|png|jpg|jpeg|gif|webp|xlsx|xlsb)$).*)',
  ],
};
