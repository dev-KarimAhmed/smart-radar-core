import React from 'react';
import { useTranslations } from 'next-intl';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase-client';
import { getSupabaseAuthHeaders } from '@/shared/services/supabase-auth-headers';
import { firstDisplayString, normalizeWhatsappContact } from '../services/rider-view-format';

export interface EmergencyContactTripContext {
  captainId?: string | null;
  captainName?: string;
  captainPhone?: string;
  captainSerial?: string;
  vehicleModel?: string;
  vehiclePlate?: string;
  vehicleColor?: string;
  destinationLabel?: string;
  requestId?: string | null;
  riderLocation?: { lat: number; lng: number };
}

function getCurrentCoordinates(fallback?: { lat: number; lng: number }): Promise<{ lat: number; lng: number } | undefined> {
  if (typeof navigator === 'undefined' || !navigator.geolocation) {
    return Promise.resolve(fallback);
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

export function useEmergencyContact(userId: string | undefined, tripContext: EmergencyContactTripContext) {
  const { toast } = useToast();
  const t = useTranslations('riderView');
  const [emergencyWhatsappContact, setEmergencyWhatsappContact] = React.useState('');
  const [showEmergencyContactDialog, setShowEmergencyContactDialog] = React.useState(false);
  const [showConsentDialog, setShowConsentDialog] = React.useState(false);

  React.useEffect(() => {
    let active = true;

    async function loadEmergencyContact() {
      if (!userId) {
        setEmergencyWhatsappContact('');
        return;
      }

      const storageKey = `radar_emergency_whatsapp_${userId}`;
      const localValue = typeof window !== 'undefined' ? window.localStorage.getItem(storageKey) || '' : '';
      setEmergencyWhatsappContact(localValue);

      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('emergency_whatsapp_contact')
          .eq('id', userId)
          .maybeSingle();

        if (error) throw error;

        const value = firstDisplayString((data as Record<string, unknown> | null)?.emergency_whatsapp_contact);
        if (active && value) {
          setEmergencyWhatsappContact(value);
          window.localStorage.setItem(storageKey, value);
        }
      } catch (error) {
        if ((process.env.NODE_ENV !== 'production')) console.warn('[Rider Emergency Contact]', error);
      }
    }

    void loadEmergencyContact();

    return () => {
      active = false;
    };
  }, [userId]);

  const handleAddEmergencyContact = React.useCallback(() => {
    setShowEmergencyContactDialog(false);
    window.location.hash = '#profile';
  }, []);

  const handleEmergencyWhatsapp = React.useCallback(() => {
    setShowConsentDialog(true);
  }, []);

  const handleConfirmConsent = React.useCallback(async () => {
    setShowConsentDialog(false);

    const whatsapp = normalizeWhatsappContact(emergencyWhatsappContact);
    if (!whatsapp) {
      setShowEmergencyContactDialog(true);
      return;
    }

    if (!tripContext.requestId) {
      toast({
        variant: 'destructive',
        title: 'تعذر مشاركة التتبع',
        description: 'لا توجد رحلة نشطة حالياً لمشاركة رابط التتبع المباشر.',
      });
      return;
    }

    // 1. Mint signed HMAC tracking token & notify Captain on server first
    let trackingToken = '';
    try {
      const authHeaders = await getSupabaseAuthHeaders({ 'Content-Type': 'application/json' });
      const notifyRes = await fetch('/api/trip/share-tracking-notify', {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({
          requestId: tripContext.requestId,
          captainId: tripContext.captainId || null,
        }),
      });
      const notifyData = await notifyRes.json().catch(() => null);
      if (!notifyRes.ok || !notifyData?.success || !notifyData?.trackingToken) {
        toast({
          variant: 'destructive',
          title: 'تعذر تفعيل رابط التتبع الآمن',
          description: 'يرجى المحاولة مرة أخرى بعد لحظات.',
        });
        return;
      }
      trackingToken = String(notifyData.trackingToken);
    } catch (err) {
      if (process.env.NODE_ENV !== 'production') {
        console.warn('[useEmergencyContact] Failed to mint tracking link:', err);
      }
      toast({
        variant: 'destructive',
        title: 'تعذر تفعيل رابط التتبع الآمن',
        description: 'يرجى التحقق من الاتصال بالإنترنت والمحاولة مجدداً.',
      });
      return;
    }

    const coords = await getCurrentCoordinates(tripContext.riderLocation);
    const captainName = firstDisplayString(tripContext.captainName) || 'السائق';
    const destination = firstDisplayString(tripContext.destinationLabel) || 'الوجهة المحددة';
    const shortRequestId = tripContext.requestId.slice(0, 8).toUpperCase();
    const vehicle = [tripContext.vehicleModel, tripContext.vehicleColor].filter(Boolean).join(' ') || '';
    const plate = tripContext.vehiclePlate || '';

    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://bynkcom.com';
    const lang = typeof document !== 'undefined' && document.documentElement.lang === 'en' ? 'en' : 'ar';
    const query = new URLSearchParams({
      id: tripContext.requestId,
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
      `• الكابتن: ${captainName}`,
      plate ? `• اللوحة: ${plate}` : '',
      vehicle ? `• السيارة: ${vehicle}` : '',
      `• الوجهة: ${destination}`,
      `• رقم الطلب: #${shortRequestId}`
    );

    const fullMessage = lines.filter((l) => l !== '').join('\n');

    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      void navigator.clipboard.writeText(fullMessage).catch(() => {});
    }

    toast({
      title: t('emergency.sosToastTitle'),
      description: t('emergency.sosToastDescription'),
    });

    // 2. Broadcast on realtime channel for instant on-screen badge
    try {
      const channelName = `trip-tracking-${tripContext.requestId}`;
      const channel = supabase.channel(channelName, {
        config: { broadcast: { ack: false } },
      });
      channel.subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          void channel.send({
            type: 'broadcast',
            event: 'RIDER_TRACKING_ACTIVE',
            payload: {
              requestId: tripContext.requestId,
              timestamp: Date.now(),
            },
          });
        }
      });
    } catch (bErr) {
      if (process.env.NODE_ENV !== 'production') {
        console.warn('[useEmergencyContact] realtime broadcast error:', bErr);
      }
    }

    // 3. Open WhatsApp
    const encodedMessage = encodeURIComponent(fullMessage);
    const whatsappUrl = `https://api.whatsapp.com/send?phone=${whatsapp}&text=${encodedMessage}`;
    if (typeof window !== 'undefined') {
      const newTab = window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
      if (!newTab || newTab.closed || typeof newTab.closed === 'undefined') {
        window.location.href = whatsappUrl;
      }
    }
  }, [emergencyWhatsappContact, t, toast, tripContext]);

  return {
    emergencyWhatsappContact,
    showEmergencyContactDialog,
    setShowEmergencyContactDialog,
    showConsentDialog,
    setShowConsentDialog,
    handleConfirmConsent,
    handleAddEmergencyContact,
    handleEmergencyWhatsapp,
  };
}
