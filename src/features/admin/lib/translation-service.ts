export async function requestTranslation(
  text: string,
  targetLang: 'ar' | 'en' = 'en'
): Promise<string> {
  const trimmed = (text || '').trim();
  if (!trimmed) return '';

  try {
    const res = await fetch('/api/translate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: trimmed, targetLang }),
    });

    if (!res.ok) return '';
    const data = await res.json();
    return data.translatedText || data.translation || '';
  } catch (err) {
    console.warn('[requestTranslation] Failed:', err);
    return '';
  }
}
