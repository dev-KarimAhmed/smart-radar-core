import { calculateSovereignDistance } from '@/core/logic/geospatial-kernel';
import { estimateTripTime } from './geospatial';

/**
 * [SCR-2026-PROTOCOL-16] المحرك السيادي لاستخلاص الإحداثيات (SSOT)
 * المستخرج السريع للمؤشرات الجغرافية للتتبع دون استهلاك الخرائط المدفوعة وحماية خصوصية الإحداثيات الجغرافية للمستخدمين.
 */

export const coordinatePatterns = [
    /@(-?\d+\.\d+),(-?\d+\.\d+)/,                // النمط القياسي @lat,lng
    /!3d(-?\d+\.\d+)!4d(-?\d+\.\d+)/,            // نمط الأبعاد الأربعة !3dlat!4dlng
    /center=(-?\d+\.\d+)(?:\+2C|%2C|%2c|,)(-?\d+\.\d+)/i,  // نمط المركز المعزز
    /ll=(-?\d+\.\d+)(?:\+2C|%2C|%2c|,)(-?\d+\.\d+)/i,      // نمط ll المعزز
    /q=(-?\d+\.\d+),(-?\d+\.\d+)/,               // نمط البحث المبسط q=lat,lng
    /query=(-?\d+\.\d+)(?:\+2C|%2C|%2c|,)(-?\d+\.\d+)/i,   // نمط البحث الأساسي query=lat,lng
    /(-?\d{1,2}\.\d+)(?:\+2C|%2C|%2c|,)\s*(-?\d{1,3}\.\d+)/i // النمط العشري الصريح المرن (lat,lng) الموحد
];

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
        if (match) {
            return { 
                lat: parseFloat(match[1]), 
                lng: parseFloat(match[2]) 
            };
        }
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
