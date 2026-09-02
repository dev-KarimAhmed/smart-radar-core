import { calculateSovereignDistance, estimateTripTime } from '@/core/logic/geospatial-kernel';

/**
 * [SCR-2026-PROTOCOL-16] المحرك الأساسي لاستخلاص الإحداثيات (SSOT)
 * المستخرج السريع للمؤشرات الجغرافية للتتبع دون استهلاك الخرائط المدفوعة وحماية خصوصية الإحداثيات الجغرافية للمستخدمين.
 */

/**
 * مرتبة من الأدق إلى الأقل دقة. `@lat,lng` هو مركز كاميرا الخريطة وليس دبوس المكان،
 * فلازم يكون آخر خيار — كان أول خيار، فأي رابط /maps/place/ كاميرته مش واقفة على المكان
 * بالظبط كان يرجّع نقطة غلط ممكن تبعد عشرات الكيلومترات، والراكب يتسعّر عليها.
 */
export const coordinatePatterns = [
    /!8m2!3d(-?\d+\.\d+)!4d(-?\d+\.\d+)/,        // دبوس المكان القياسي داخل data=
    /!3d(-?\d+\.\d+)!4d(-?\d+\.\d+)/,            // نفس الدبوس بدون غلاف !8m2
    /q=(-?\d+\.\d+),(-?\d+\.\d+)/,               // إحداثيات معلنة كهدف q=lat,lng
    /query=(-?\d+\.\d+)(?:\+2C|%2C|%2c|,)(-?\d+\.\d+)/i,   // نمط البحث الأساسي query=lat,lng
    /destination=(-?\d+\.\d+)(?:\+2C|%2C|%2c|,)(-?\d+\.\d+)/i, // وجهة رابط الاتجاهات
    /ll=(-?\d+\.\d+)(?:\+2C|%2C|%2c|,)(-?\d+\.\d+)/i,      // نمط ll المعزز
    /center=(-?\d+\.\d+)(?:\+2C|%2C|%2c|,)(-?\d+\.\d+)/i,  // نمط المركز المعزز
    /@(-?\d+\.\d+),(-?\d+\.\d+)/,                // الكاميرا — آخر خيار
    /(-?\d{1,2}\.\d+)(?:\+2C|%2C|%2c|,)\s*(-?\d{1,3}\.\d+)/i // النمط العشري الصريح المرن (lat,lng) الموحد
];

/** حدود الكرة الأرضية. أي ناتج خارجها هو مطابقة زائفة، مش إحداثي. */
function isPlausibleCoordinate(lat: number, lng: number) {
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return false;
    if (Math.abs(lat) > 90 || Math.abs(lng) > 180) return false;
    // 0,0 في خليج غينيا — عملياً دايماً قيمة افتراضية فاضية، مش وجهة.
    return !(lat === 0 && lng === 0);
}

/**
 * تهيئة وتنظيف الروابط لضمان احتوائها على المعطيات الكافية.
 * يدعم صائد المعلمات الطرفي (Local Parameter Trapping) لفرز الإحداثيات محلياً بصفر تكلفة.
 */
export function sanitizeUrl(rawUrl: string): string {
    let cleanUrl = rawUrl.trim();
    
    // صائد المعلمات الموضعي: فحص واقتطاع الإحداثيات فوراً إذا تواجدت في النص لمنع فواتير السيرفرات
    const coords = extractCoordsLocally(cleanUrl);
    if (coords) {
        return `${coords.lat.toFixed(6)}, ${coords.lng.toFixed(6)}`;
    }

    if (cleanUrl.startsWith('ps://')) cleanUrl = 'https://' + cleanUrl.substring(5);
    if (cleanUrl.startsWith('naps://')) cleanUrl = 'https://maps' + cleanUrl.substring(4);
    if (!cleanUrl.startsWith('http') && !cleanUrl.includes(',') && !cleanUrl.includes('°')) cleanUrl = 'https://' + cleanUrl;
    return cleanUrl;
}

/**
 * استخراج الإحداثيات محلياً من الرابط الطويل دون طلب خارجي.
 */
export function extractCoordsLocally(url: string): { lat: number; lng: number } | null {
    // 1. استخدام الأنماط القياسية
    for (const pattern of coordinatePatterns) {
        const match = url.match(pattern);
        if (!match) continue;

        const lat = parseFloat(match[1]);
        const lng = parseFloat(match[2]);
        // النمط الأخير فضفاض وبيلقط أي رقمين عشريين مفصولين بفاصلة، فأي حاجة برّه حدود
        // الكرة الأرضية تُرفض ويكمّل البحث بدل ما ترجع كإحداثي.
        if (!isPlausibleCoordinate(lat, lng)) continue;

        return { lat, lng };
    }

    // 2. فك نمط الدرجات والدقائق والثواني DMS (مثال: 33°18'45.0"N 44°21'30.0"E)
    const dmsRegex = /(\d+)°(\d+)'(\d+(\.\d+)?)"\s*([NS])\s*(\d+)°(\d+)'(\d+(\.\d+)?)"\s*([EW])/i;
    const dmsMatch = url.match(dmsRegex);
    if (dmsMatch) {
         const latDeg = parseFloat(dmsMatch[1]);
         const latMin = parseFloat(dmsMatch[2]);
         const latSec = parseFloat(dmsMatch[3]);
         const latDir = dmsMatch[5].toUpperCase();

         const lngDeg = parseFloat(dmsMatch[6]);
         const lngMin = parseFloat(dmsMatch[7]);
         const lngSec = parseFloat(dmsMatch[8]);
         const lngDir = dmsMatch[10].toUpperCase();

         let lat = latDeg + (latMin / 60) + (latSec / 3600);
         if (latDir === 'S') lat = -lat;

         let lng = lngDeg + (lngMin / 60) + (lngSec / 3600);
         if (lngDir === 'W') lng = -lng;

         return { lat, lng };
    }

    return null;
}

/**
 * [SCR-2026-LOOSE-COUPLING] الاتصال المباشر بالخادم السحابي لفتح الروابط المختصرة وتفادي مشاكل الـ CORS في المتصفحات.
 */
export async function resolveSovereignUrl(cleanUrl: string): Promise<{lat: number, lng: number} | null> {
    // 1. محاولة استخلاص محلي أولاً (إذا كان الرابط طويلاً)
    const localCoords = extractCoordsLocally(cleanUrl);
    if (localCoords) return localCoords;

    // 2. إذا كان قصيراً، يتم تحويله سحابياً عبر الـ Proxy لمنع الـ CORS
    if (cleanUrl.length < 60 || cleanUrl.includes('goo.gl')) {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 8000);

        try {
            const response = await fetch('/api/sovereign-digger', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ shortUrl: cleanUrl }),
                signal: controller.signal
            });

            clearTimeout(timeoutId);

            if (!response.ok) throw new Error("الاستجابة البرمجية غير مطابقة للمواثيق.");
            const data = await response.json();
            if (data.success && data.coords) return data.coords;
        } catch (err: any) {
            clearTimeout(timeoutId);
            if (err.name === 'AbortError') {
                throw new Error("انتهت مهلة استخلاص الرابط (يرجى إدخال الموقع يدوياً).");
            }
            // تفعيل صمام الأمان الاستنباطي: بروتوكول الارتداد الذكي اللامركزي لتصحيح المسار فوراً دون سيرفر خارجي
            throw new Error("CORS_FALLBACK_REQUIRED");
        }
    }

    return null;
}

/**
 * [SCR-2026-TIME-CORE] مخرجات الحسابات الميدانية
 * دمج المسافة والزمن في مصفوفة مخرجات واحدة.
 */
export function generateSovereignMetrics(
    anchorLat: number, 
    anchorLng: number, 
    destLat: number, 
    destLng: number
): { distance: number, time: number } {
    const distance = calculateSovereignDistance(anchorLat, anchorLng, destLat, destLng);
    const time = estimateTripTime(distance);
    return { distance, time };
}
