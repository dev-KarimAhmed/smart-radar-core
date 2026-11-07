export const TOTAL_SEARCH_SECONDS = 240; // 4 minutes
export const STAGE_DURATION_SECONDS = 48; // 240 / 5 = 48s for each of the 5 scan perimeters

export const receivingOffersStyles = {
  cancelledWrapper: "space-y-4 pointer-events-auto",
  rtl: "text-right",
  ltr: "text-left",
  wrapper: "space-y-3.5",
  offerList: "space-y-3",
} as const;

export interface RadarStage {
  index: number;
  radiusKm: number;
  title: string;
  description: string;
  badge: string;
}

export function getRadarStages(isArabic: boolean, isExpandingCaptainSearch: boolean): RadarStage[] {
  return isArabic
    ? [
        {
          index: 0,
          radiusKm: 0.5,
          title: 'رصد النطاق الأولي',
          description: isExpandingCaptainSearch
            ? 'جاري توسيع النطاق للبحث عن المزيد من الكباتن المتاحين...'
            : 'جاري مسح ومطابقة أقرب الكباتن المتواجدين في محيطك المباشر',
          badge: '0.5 كم',
        },
        {
          index: 1,
          radiusKm: 1.0,
          title: 'توسيع نطاق البحث',
          description: 'تم توسيع نطاق الرادار للبحث عن الكباتن المتاحين في المحيط المجاور',
          badge: '1 كم',
        },
        {
          index: 2,
          radiusKm: 1.5,
          title: 'توسيع نطاق التغطية',
          description: 'تم توسيع دائرة المسح لتأكيد توفر كابتن مناسب لرحلتك',
          badge: '1.5 كم',
        },
        {
          index: 3,
          radiusKm: 2.0,
          title: 'مسح محيط المنطقة',
          description: 'بث الطلب لكافة الكباتن المتاحين في المنطقة لتلقي العروض',
          badge: '2 كم',
        },
        {
          index: 4,
          radiusKm: 2.5,
          title: 'أقصى نطاق مسح جغرافي',
          description: 'المسح النهائي الشامل لضمان وصول عروض لك قبل انتهاء الوقت',
          badge: '2.5 كم',
        },
      ]
    : [
        {
          index: 0,
          radiusKm: 0.5,
          title: 'Scanning Initial Range',
          description: isExpandingCaptainSearch
            ? 'Expanding coverage to find more nearby available captains...'
            : 'Scanning and matching the nearest available captains in your immediate area',
          badge: '0.5 km',
        },
        {
          index: 1,
          radiusKm: 1.0,
          title: 'Expanding Search Range',
          description: 'Radar coverage expanded to include captains across the nearby area',
          badge: '1 km',
        },
        {
          index: 2,
          radiusKm: 1.5,
          title: 'Expanding Coverage Area',
          description: 'Extending search radius to secure an available captain for your ride',
          badge: '1.5 km',
        },
        {
          index: 3,
          radiusKm: 2.0,
          title: 'Broad Sector Sweep',
          description: 'Broadcasting request to active captains across the sector',
          badge: '2 km',
        },
        {
          index: 4,
          radiusKm: 2.5,
          title: 'Maximum Radar Range',
          description: 'Final maximum radar sweep to ensure receiving bids before search closes',
          badge: '2.5 km',
        },
      ];
}
