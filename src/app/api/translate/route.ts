import { NextResponse } from 'next/server';
import { consumeRateLimit, getClientIp } from '@/shared/server/api-auth-guard';
import { translateTextServer } from '@/shared/server/translate';

const ALLOWED_SOURCE_LANGS = new Set(['auto', 'ar', 'en']);
const MAX_BATCH_TEXTS = 30;
const MAX_TEXT_LENGTH = 500;

export async function POST(req: Request) {
  try {
    const ip = getClientIp(req);
    const rate = consumeRateLimit(`translate:${ip}`, 40, 60_000);
    if (!rate.allowed) {
      return NextResponse.json(
        { success: false, error: 'Too many translation requests' },
        { status: 429, headers: { 'Retry-After': String(rate.retryAfterSeconds) } }
      );
    }

    const body = await req.json().catch(() => ({}));
    const { text, texts, targetLang = 'en', sourceLang = 'auto' } = body || {};
    const safeSourceLang = typeof sourceLang === 'string' && ALLOWED_SOURCE_LANGS.has(sourceLang) ? sourceLang : 'auto';

    if (!text && (!texts || !Array.isArray(texts) || texts.length === 0)) {
      return NextResponse.json({ success: false, error: 'No text provided to translate' }, { status: 400 });
    }

    const target: 'ar' | 'en' = targetLang === 'ar' ? 'ar' : 'en';

    // Handle batch texts with hard ceiling
    if (Array.isArray(texts)) {
      if (texts.length > MAX_BATCH_TEXTS) {
        return NextResponse.json(
          { success: false, error: `Batch size exceeds limit of ${MAX_BATCH_TEXTS}` },
          { status: 400 }
        );
      }

      const translations = await Promise.all(
        texts.map((t) =>
          typeof t === 'string' && t.length <= MAX_TEXT_LENGTH * 2
            ? translateTextServer(t, target, safeSourceLang)
            : Promise.resolve(typeof t === 'string' ? t.slice(0, MAX_TEXT_LENGTH) : '')
        )
      );
      return NextResponse.json({
        success: true,
        translations,
        targetLang: target,
      });
    }

    if (typeof text !== 'string' || text.length > MAX_TEXT_LENGTH * 2) {
      return NextResponse.json(
        { success: false, error: `Text exceeds maximum length of ${MAX_TEXT_LENGTH * 2}` },
        { status: 400 }
      );
    }

    // Handle single text
    const translatedText = await translateTextServer(text, target, safeSourceLang);

    return NextResponse.json({
      success: true,
      translatedText,
      targetLang: target,
      originalText: text,
    });
  } catch (error) {
    console.error('[API Translate] POST error:', error);
    return NextResponse.json(
      { success: false, error: 'Translation failed' },
      { status: 500 }
    );
  }
}
