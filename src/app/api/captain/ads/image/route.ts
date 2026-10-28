import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

export const dynamic = 'force-dynamic';

/**
 * بروكسي آمن ومباشر لخدمة وعرض صور إعلانات الكباتن
 * يتيح جلب الصور وعرضها للركاب حتى وإن كانت محفوظة في سلة خاصة
 * مع تفعيل التخزين المؤقت بالمتصفح لأقصى سرعة
 */
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const rawPath = (searchParams.get('path') || '').trim();
    const bucket = (searchParams.get('bucket') || 'captain-documents').trim();

    if (!rawPath) {
      return new NextResponse('Missing image path', { status: 400 });
    }

    // تنظيف المسار
    const cleanPath = decodeURIComponent(rawPath).replace(/^\/+/, '');

    // 1. محاولة جلب الصورة من السلة المطلوبة
    let downloadRes = await supabaseAdmin.storage
      .from(bucket)
      .download(cleanPath);

    // 2. إذا فشل الجلب وكانت السلة captain-ads، نجرب سلة captain-documents كبديل والعكس
    if (downloadRes.error || !downloadRes.data) {
      const fallbackBucket = bucket === 'captain-ads' ? 'captain-documents' : 'captain-ads';
      const fallbackRes = await supabaseAdmin.storage
        .from(fallbackBucket)
        .download(cleanPath);

      if (!fallbackRes.error && fallbackRes.data) {
        downloadRes = fallbackRes;
      }
    }

    if (downloadRes.error || !downloadRes.data) {
      console.warn('[Captain Ad Image Proxy] Download failed for path:', cleanPath, downloadRes.error);
      return new NextResponse('Image not found', { status: 404 });
    }

    const blob = downloadRes.data;
    const arrayBuffer = await blob.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    let contentType = blob.type || 'image/png';
    if (!contentType || contentType === 'application/octet-stream') {
      const ext = cleanPath.split('.').pop()?.toLowerCase();
      if (ext === 'jpg' || ext === 'jpeg') contentType = 'image/jpeg';
      else if (ext === 'webp') contentType = 'image/webp';
      else if (ext === 'gif') contentType = 'image/gif';
      else contentType = 'image/png';
    }

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=86400, stale-while-revalidate=604800',
      },
    });
  } catch (error: any) {
    console.error('[Captain Ad Image Proxy Server Error]:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
