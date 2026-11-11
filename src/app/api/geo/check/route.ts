import { NextResponse } from 'next/server';
import { isSaudiRequest } from '@/core/logic/saudi-restriction';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const isBlocked = isSaudiRequest(req.headers);
  const country =
    req.headers.get('cf-ipcountry') ||
    req.headers.get('x-vercel-ip-country') ||
    req.headers.get('cloudfront-viewer-country') ||
    req.headers.get('x-country-code') ||
    req.headers.get('x-geo-country') ||
    null;

  return NextResponse.json({
    country,
    isBlocked,
  });
}
