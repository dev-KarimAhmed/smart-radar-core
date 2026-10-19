import { NextResponse } from 'next/server';

/**
 * Universal sovereign translation endpoint (0 external cost / 0 API keys required).
 * Translates text between Arabic and English seamlessly with automatic language detection.
 */
async function translateText(text: string, targetLang: 'ar' | 'en', sourceLang: string = 'auto'): Promise<string> {
  const trimmed = (text || '').trim();
  if (!trimmed) return '';

  // 1. Primary: Google GTX Translation Gateway
  try {
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${encodeURIComponent(
      sourceLang
    )}&tl=${encodeURIComponent(targetLang)}&dt=t&q=${encodeURIComponent(trimmed)}`;

    const res = await fetch(url, {
      method: 'GET',
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
    const src = sourceLang === 'auto' ? (targetLang === 'en' ? 'ar' : 'en') : sourceLang;
    const fallbackUrl = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(
      trimmed
    )}&langpair=${encodeURIComponent(src)}|${encodeURIComponent(targetLang)}`;

    const fallbackRes = await fetch(fallbackUrl, {
      method: 'GET',
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
    const body = await req.json();
    const { text, texts, targetLang = 'en', sourceLang = 'auto' } = body || {};

    if (!text && (!texts || !Array.isArray(texts) || texts.length === 0)) {
      return NextResponse.json({ success: false, error: 'No text provided to translate' }, { status: 400 });
    }

    const target: 'ar' | 'en' = targetLang === 'ar' ? 'ar' : 'en';

    // Handle batch texts
    if (Array.isArray(texts)) {
      const translations = await Promise.all(
        texts.map((t) => (typeof t === 'string' ? translateText(t, target, sourceLang) : Promise.resolve('')))
      );
      return NextResponse.json({
        success: true,
        translations,
        targetLang: target,
      });
    }

    // Handle single text
    const translatedText = await translateText(String(text), target, sourceLang);

    return NextResponse.json({
      success: true,
      translatedText,
      targetLang: target,
      originalText: text,
    });
  } catch (error: any) {
    console.error('[API Translate] POST error:', error);
    return NextResponse.json(
      { success: false, error: error?.message || 'Translation failed' },
      { status: 500 }
    );
  }
}

