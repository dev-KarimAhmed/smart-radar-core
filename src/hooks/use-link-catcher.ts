'use client';

import { useEffect, useState, useCallback } from 'react';

/**
 * [SCR-2026-056] صياد الروابط الفطري (Native Link Catcher)
 * يمتثل للمادة (2) من ميثاق العهد الماسي: استقبال الروابط عبر Web Share Target.
 */
export function useLinkCatcher() {
  const [capturedLink, setCapturedLink] = useState<string | null>(null);

  const processIncomingParams = useCallback(() => {
    if (typeof window === 'undefined') return;

    // التقاط الرابط من معلمات PWA Share Target
    const searchParams = new URLSearchParams(window.location.search);
    const sharedText = searchParams.get('text');
    const sharedUrl = searchParams.get('shared_link');
    const rawInput = sharedText || sharedUrl;

    if (rawInput) {
      // استخراج رابط جوجل مابس من النص المشترك (Regex)
      const urlRegex = /(https?:\/\/[^\s]+)/g;
      const extractedUrls = rawInput.match(urlRegex);

      if (extractedUrls && extractedUrls.length > 0) {
        const pureLink = extractedUrls[0];
        // إذا كان النص المشترك يحتوي على إحداثيات صريحة بالإضافة للرابط، يفضل تمرير النص بالكامل لفك الإحداثيات محلياً فوراً
        if (rawInput.includes('°') || rawInput.includes(',')) {
          setCapturedLink(rawInput.trim());
        } else {
          setCapturedLink(pureLink);
        }
        console.info('[Sovereign Link Catcher] 🟢 Link Ingested via Share Target:', pureLink);
      } else {
        // في حال عدم وجود رابط ولكن النص قد يحتوي على إحداثيات صريحة
        setCapturedLink(rawInput.trim());
        console.info('[Sovereign Link Catcher] 🟡 Raw Text Ingested (Maybe has coords):', rawInput);
      }

      // تنظيف المتصفح فوراً لضمان عدم تكرار العملية عند التحديث
      const cleanUrl = window.location.pathname;
      window.history.replaceState(null, '', cleanUrl);
    }
  }, []);

  useEffect(() => {
    processIncomingParams();
  }, [processIncomingParams]);

  const clearCapturedLink = () => setCapturedLink(null);

  return { capturedLink, clearCapturedLink };
}
