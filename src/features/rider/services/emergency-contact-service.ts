import { supabase } from '@/lib/supabase-client';
import { getSupabaseAuthHeaders } from '@/shared/services/supabase-auth-headers';
import { firstDisplayString } from './rider-view-format';

export async function getCurrentCoordinates(
  fallback?: { lat: number; lng: number }
): Promise<{ lat: number; lng: number } | undefined> {
  if (typeof navigator === 'undefined' || !navigator.geolocation) {
    return fallback;
  }
  return new Promise((resolve) => {
    let settled = false;
    const timer = setTimeout(() => {
      if (!settled) {
        settled = true;
        resolve(fallback);
      }
    }, 2500);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        if (!settled) {
          settled = true;
          clearTimeout(timer);
          resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        }
      },
      () => {
        if (!settled) {
          settled = true;
          clearTimeout(timer);
          resolve(fallback);
        }
      },
      { timeout: 2000, enableHighAccuracy: true, maximumAge: 30000 }
    );
  });
}

export async function mintEmergencyTrackingToken(
  requestId: string,
  captainId?: string | null
): Promise<{ ok: boolean; trackingToken?: string }> {
  try {
    const authHeaders = await getSupabaseAuthHeaders({ 'Content-Type': 'application/json' });
    const notifyRes = await fetch('/api/trip/share-tracking-notify', {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({ requestId, captainId: captainId || null }),
    });
    const notifyData = await notifyRes.json().catch(() => null);
    if (!notifyRes.ok || !notifyData?.success || !notifyData?.trackingToken) {
      return { ok: false };
    }
    return { ok: true, trackingToken: String(notifyData.trackingToken) };
  } catch (err) {
    if (process.env.NODE_ENV !== 'production') {
      console.warn('[emergency-contact-service] Failed to mint tracking token:', err);
    }
    return { ok: false };
  }
}

export interface BuildEmergencyMessageParams {
  requestId: string;
  trackingToken: string;
  coords?: { lat: number; lng: number };
  captainName?: string;
  destinationLabel?: string;
  vehicleModel?: string;
  vehiclePlate?: string;
  vehicleColor?: string;
}

export function buildEmergencySosMessage({
  requestId,
  trackingToken,
  coords,
  captainName,
  destinationLabel,
  vehicleModel,
  vehiclePlate,
  vehicleColor,
}: BuildEmergencyMessageParams): string {
  const cName = firstDisplayString(captainName) || 'السائق';
  const dest = firstDisplayString(destinationLabel) || 'الوجهة المحددة';
  const shortRequestId = requestId.slice(0, 8).toUpperCase();
  const vehicle = [vehicleModel, vehicleColor].filter(Boolean).join(' ') || '';
  const plate = vehiclePlate || '';

  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://bynkcom.com';
  const lang = typeof document !== 'undefined' && document.documentElement.lang === 'en' ? 'en' : 'ar';
  const query = new URLSearchParams({
    id: requestId,
    t: trackingToken,
    lang,
  });
  const trackUrl = `${origin}/track?${query.toString()}`;
  const mapsUrl = coords ? `https://maps.google.com/?q=${coords.lat.toFixed(5)},${coords.lng.toFixed(5)}` : '';

  const lines: string[] = [
    '\u{1F6A8} نداء طوارئ واستغاثة - تطبيق بينكم (bynkcom)',
    'أنا في رحلة حالياً وبحاجة للمتابعة والمساعدة.',
    '',
    '\u{1F7E2} رابط تتبع الرحلة حياً:',
    trackUrl,
  ];

  if (mapsUrl) {
    lines.push('', '\u{1F4CD} موقعي الحالي على الخريطة:', mapsUrl);
  }

  lines.push(
    '',
    '\u{1F697} بيانات الرحلة:',
    `• الكابتن: ${cName}`,
    plate ? `• اللوحة: ${plate}` : '',
    vehicle ? `• السيارة: ${vehicle}` : '',
    `• الوجهة: ${dest}`,
    `• رقم الطلب: #${shortRequestId}`
  );

  return lines.filter((l) => l !== '').join('\n');
}

export function broadcastEmergencyTrackingActive(requestId: string): void {
  try {
    const channelName = `trip-tracking-${requestId}`;
    const channel = supabase.channel(channelName, {
      config: { broadcast: { ack: false } },
    });
    channel.subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        void channel.send({
          type: 'broadcast',
          event: 'RIDER_TRACKING_ACTIVE',
          payload: {
            requestId,
            timestamp: Date.now(),
          },
        });
      }
    });
  } catch (err) {
    if (process.env.NODE_ENV !== 'production') {
      console.warn('[emergency-contact-service] broadcast error:', err);
    }
  }
}

export function openEmergencyWhatsapp(phone: string, message: string): void {
  const encoded = encodeURIComponent(message);
  const whatsappUrl = `https://api.whatsapp.com/send?phone=${phone}&text=${encoded}`;
  if (typeof window !== 'undefined') {
    const newTab = window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
    if (!newTab || newTab.closed || typeof newTab.closed === 'undefined') {
      window.location.href = whatsappUrl;
    }
  }
}
