import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { isSaudiRequest, SAUDI_RESTRICTION_MESSAGES } from '@/core/logic/saudi-restriction';

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static assets)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - static assets in public folder (icons, images, manifest, sw)
     */
    '/((?!_next/static|_next/image|favicon.ico|manifest.json|sw.js|icons/|images/).*)',
  ],
};

export function middleware(req: NextRequest) {
  if (isSaudiRequest(req.headers)) {
    const { pathname } = req.nextUrl;

    // Allow geo-check API so frontend can read the diagnostic status
    if (pathname === '/api/geo/check') {
      return NextResponse.json({
        country: 'SA',
        isBlocked: true,
      });
    }

    // All other API endpoints return 403 Forbidden with clear message
    if (pathname.startsWith('/api/')) {
      return NextResponse.json(
        {
          success: false,
          error: SAUDI_RESTRICTION_MESSAGES.ar.regionBlockedDesc,
          errorEn: SAUDI_RESTRICTION_MESSAGES.en.regionBlockedDesc,
        },
        { status: 403 },
      );
    }

    // Web pages are rewritten to the dedicated sovereign blocked screen
    if (pathname !== '/blocked-region') {
      const url = req.nextUrl.clone();
      url.pathname = '/blocked-region';
      return NextResponse.rewrite(url);
    }
  }

  return NextResponse.next();
}
