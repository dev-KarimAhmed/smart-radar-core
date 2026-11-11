import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { isValidStorageRelativePath } from '@/shared/server/api-auth-guard';

export const dynamic = 'force-dynamic';

const ALLOWED_BUCKETS = new Set(['captain-ads', 'captain-documents']);
const SEAT_AD_PATH_PATTERN = /^[a-zA-Z0-9_-]{8,128}\/seat_\d+_\d+(?:_[a-f0-9-]+)?\.(png|jpe?g|webp|gif)$/i;

function resolveSafeImageContentType(path: string): string | null {
  const ext = path.split('.').pop()?.toLowerCase();
  if (ext === 'jpg' || ext === 'jpeg') return 'image/jpeg';
  if (ext === 'webp') return 'image/webp';
  if (ext === 'gif') return 'image/gif';
  if (ext === 'png') return 'image/png';
  return null;
}

/**
 * بروكسي آمن ومباشر لخدمة وعرض صور إعلانات الكباتن
 * يتيح جلب الصور وعرضها للركاب حتى وإن كانت محفوظة في سلة خاصة
 * مع تفعيل التخزين المؤقت بالمتصفح لأقصى سرعة وحظر الوصول لأي مستندات حساسة
 */
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const rawPath = (searchParams.get('path') || '').trim();
    const bucket = (searchParams.get('bucket') || 'captain-documents').trim();

    if (!ALLOWED_BUCKETS.has(bucket)) {
      return new NextResponse('Forbidden bucket', { status: 403 });
    }

    if (!rawPath) {
      return new NextResponse('Missing image path', { status: 400 });
    }

    let cleanPath = '';
    try {
      cleanPath = decodeURIComponent(rawPath).replace(/^\/+/, '').trim();
    } catch {
      return new NextResponse('Invalid image path encoding', { status: 400 });
    }

    if (!isValidStorageRelativePath(cleanPath)) {
      return new NextResponse('Invalid image path', { status: 400 });
    }

    const safeContentType = resolveSafeImageContentType(cleanPath);
    if (!safeContentType) {
      return new NextResponse('Unsupported image extension', { status: 400 });
    }

    // Strictly permit ONLY valid seat promotional ad paths (never KYC docs, receipts, or contracts)
    if (!SEAT_AD_PATH_PATTERN.test(cleanPath)) {
      return new NextResponse('Forbidden object path', { status: 403 });
    }

    // 1. محاولة جلب الصورة من السلة المطلوبة
    let downloadRes = await supabaseAdmin.storage
      .from(bucket)
      .download(cleanPath);

    // 2. إذا فشل الجلب وكانت السلة captain-ads، نجرب سلة captain-documents (لإعلانات المقاعد فقط) والعكس
    if (downloadRes.error || !downloadRes.data) {
      const fallbackBucket = bucket === 'captain-ads' ? 'captain-documents' : 'captain-ads';
      const canUseFallback =
        fallbackBucket === 'captain-ads' || SEAT_AD_PATH_PATTERN.test(cleanPath);

      if (canUseFallback) {
        const fallbackRes = await supabaseAdmin.storage
          .from(fallbackBucket)
          .download(cleanPath);

        if (!fallbackRes.error && fallbackRes.data) {
          downloadRes = fallbackRes;
        }
      }
    }

    if (downloadRes.error || !downloadRes.data) {
      return new NextResponse('Image not found', { status: 404 });
    }

    const blob = downloadRes.data;
    const arrayBuffer = await blob.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': safeContentType,
        'Content-Disposition': 'inline',
        'X-Content-Type-Options': 'nosniff',
        'Cache-Control': 'public, max-age=86400, stale-while-revalidate=604800',
      },
    });
  } catch (error) {
    console.error('[Captain Ad Image Proxy Server Error]:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
