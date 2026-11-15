import { NextResponse } from 'next/server';
import {
  consumeRateLimit,
  getClientIp,
  getVerifiedUser,
} from '@/shared/server/api-auth-guard';
import { handleGetCaptainAds } from '@/server/services/captain-ads/captain-ads-queries';
import { handleCreateCaptainAd, handleDeleteCaptainAd } from '@/server/services/captain-ads/captain-ads-mutations';
import { handleUpdateCaptainAd } from '@/server/services/captain-ads/captain-ads-update';

export const dynamic = 'force-dynamic';

function checkRateLimit(req: Request) {
  const ip = getClientIp(req);
  return consumeRateLimit(`captain-ads-write:${ip}`, 20, 60_000);
}

/**
 * جلب جميع إعلانات الكابتن من الباك إند
 */
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    return await handleGetCaptainAds(req, searchParams);
  } catch (error) {
    console.error('[Captain Ads API GET Error]:', error);
    return NextResponse.json(
      { success: false, error: 'internal_server_error' },
      { status: 500 }
    );
  }
}

/**
 * حفظ أو إضافة إعلان كابتن في مقعد محدد
 */
export async function POST(req: Request) {
  try {
    const rate = checkRateLimit(req);
    if (!rate.allowed) {
      return NextResponse.json(
        { success: false, error: 'rate_limit_exceeded' },
        { status: 429, headers: { 'Retry-After': String(rate.retryAfterSeconds) } }
      );
    }

    const caller = await getVerifiedUser(req);
    if (!caller) {
      return NextResponse.json(
        { success: false, error: 'authentication_required' },
        { status: 401 }
      );
    }

    const body = await req.json().catch(() => ({}));
    return await handleCreateCaptainAd(caller, body);
  } catch (error) {
    console.error('[Captain Ads API POST Error]:', error);
    return NextResponse.json(
      { success: false, error: 'internal_server_error' },
      { status: 500 }
    );
  }
}

/**
 * تعديل إعلان موجود (تحديث النص أو الصورة أو الحالة)
 */
export async function PUT(req: Request) {
  try {
    const rate = checkRateLimit(req);
    if (!rate.allowed) {
      return NextResponse.json(
        { success: false, error: 'rate_limit_exceeded' },
        { status: 429, headers: { 'Retry-After': String(rate.retryAfterSeconds) } }
      );
    }

    const caller = await getVerifiedUser(req);
    if (!caller) {
      return NextResponse.json(
        { success: false, error: 'authentication_required' },
        { status: 401 }
      );
    }

    const body = await req.json().catch(() => ({}));
    return await handleUpdateCaptainAd(caller, body);
  } catch (error) {
    console.error('[Captain Ads API PUT Error]:', error);
    return NextResponse.json(
      { success: false, error: 'internal_server_error' },
      { status: 500 }
    );
  }
}

/**
 * حذف إعلان من مقعد محدد
 */
export async function DELETE(req: Request) {
  try {
    const rate = checkRateLimit(req);
    if (!rate.allowed) {
      return NextResponse.json(
        { success: false, error: 'rate_limit_exceeded' },
        { status: 429, headers: { 'Retry-After': String(rate.retryAfterSeconds) } }
      );
    }

    const caller = await getVerifiedUser(req);
    if (!caller) {
      return NextResponse.json(
        { success: false, error: 'authentication_required' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    return await handleDeleteCaptainAd(caller, searchParams);
  } catch (error) {
    console.error('[Captain Ads API DELETE Error]:', error);
    return NextResponse.json(
      { success: false, error: 'internal_server_error' },
      { status: 500 }
    );
  }
}
