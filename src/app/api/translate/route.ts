import { NextResponse } from 'next/server';
import { consumeRateLimit, getClientIp } from '@/shared/server/api-auth-guard';

const ALLOWED_SOURCE_LANGS = new Set(['auto', 'ar', 'en']);
const MAX_BATCH_TEXTS = 30;
const MAX_TEXT_LENGTH = 500;
const REQUEST_TIMEOUT_MS = 5_000;

/**
 * Universal sovereign translation endpoint (0 external cost / 0 API keys required).
 * Translates text between Arabic and English seamlessly with automatic language detection.
 */
async function translateText(text: string, targetLang: 'ar' | 'en', sourceLang: string = 'auto'): Promise<string> {
  const trimmed = (text || '').trim().slice(0, MAX_TEXT_LENGTH);
  if (!trimmed) return '';
  const safeSourceLang = ALLOWED_SOURCE_LANGS.has(sourceLang) ? sourceLang : 'auto';

  // 1. Primary: Google GTX Translation Gateway
  try {
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${encodeURIComponent(
      safeSourceLang
    )}&tl=${encodeURIComponent(targetLang)}&dt=t&q=${encodeURIComponent(trimmed)}`;

    const res = await fetch(url, {
      method: 'GET',
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      },
      next: { revalidate: 3600 },
    });

    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && Array.isArray(data[0])) {
        const translated = data[0].map((chunk: any) => (chunk && chunk[0] ? chunk[0] : '')).join('');
        if (translated && translated.trim().length > 0) {
          return translated.trim();
        }
      }
    }
  } catch (err) {
    console.warn('[translateText] Primary GTX error:', err);
  }

  // 2. Secondary Fallback: MyMemory Open Translation API
  try {
    const src = safeSourceLang === 'auto' ? (targetLang === 'en' ? 'ar' : 'en') : safeSourceLang;
    const fallbackUrl = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(
      trimmed
    )}&langpair=${encodeURIComponent(src)}|${encodeURIComponent(targetLang)}`;

    const fallbackRes = await fetch(fallbackUrl, {
      method: 'GET',
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      next: { revalidate: 3600 },
    });

    if (fallbackRes.ok) {
      const fbData = await fallbackRes.json();
      const match = fbData?.responseData?.translatedText;
      if (match && typeof match === 'string' && match.trim().length > 0) {
        return match.trim();
      }
    }
  } catch (fbErr) {
    console.warn('[translateText] Secondary MyMemory error:', fbErr);
  }

  // 3. Graceful degrade: return original trimmed string
  return trimmed;
}

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
            ? translateText(t, target, safeSourceLang)
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
    const translatedText = await translateText(text, target, safeSourceLang);

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

