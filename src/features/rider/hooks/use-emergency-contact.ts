import React from 'react';
import { useTranslations } from 'next-intl';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase-client';
import { firstDisplayString, normalizeWhatsappContact } from '../services/rider-view-format';

export interface EmergencyContactTripContext {
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

  const handleEmergencyWhatsapp = React.useCallback(async () => {
    const whatsapp = normalizeWhatsappContact(emergencyWhatsappContact);
    if (!whatsapp) {
      setShowEmergencyContactDialog(true);
      return;
    }

    const coords = await getCurrentCoordinates(tripContext.riderLocation);
    const captainName = firstDisplayString(tripContext.captainName) || 'السائق';
    const destination = firstDisplayString(tripContext.destinationLabel) || 'الوجهة المحددة';
    const shortRequestId = tripContext.requestId ? tripContext.requestId.slice(0, 8).toUpperCase() : 'LIVE';
    const vehicle = [tripContext.vehicleModel, tripContext.vehicleColor].filter(Boolean).join(' ') || '';
    const plate = tripContext.vehiclePlate || '';

    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://bynkcom.com';
    const query = new URLSearchParams({
      trip: shortRequestId,
      c: captainName,
      ...(plate ? { p: plate } : {}),
      ...(vehicle ? { v: vehicle } : {}),
      ...(destination ? { d: destination } : {}),
      ...(tripContext.captainPhone ? { ph: tripContext.captainPhone } : {}),
      ...(coords ? { lat: coords.lat.toFixed(5), lng: coords.lng.toFixed(5) } : {}),
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
    handleAddEmergencyContact,
    handleEmergencyWhatsapp,
  };
}
