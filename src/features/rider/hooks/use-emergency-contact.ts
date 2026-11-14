import React from 'react';
import { useTranslations } from 'next-intl';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase-client';
import { firstDisplayString, normalizeWhatsappContact } from '../services/rider-view-format';
import {
  getCurrentCoordinates,
  mintEmergencyTrackingToken,
  buildEmergencySosMessage,
  broadcastEmergencyTrackingActive,
  openEmergencyWhatsapp,
} from '../services/emergency-contact-service';

export * from '../services/emergency-contact-service';

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
        if (process.env.NODE_ENV !== 'production') console.warn('[Rider Emergency Contact]', error);
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

    const mintResult = await mintEmergencyTrackingToken(tripContext.requestId, tripContext.captainId);
    if (!mintResult.ok || !mintResult.trackingToken) {
      toast({
        variant: 'destructive',
        title: 'تعذر تفعيل رابط التتبع الآمن',
        description: 'يرجى التحقق من الاتصال بالإنترنت والمحاولة مجدداً.',
      });
      return;
    }

    const coords = await getCurrentCoordinates(tripContext.riderLocation);
    const fullMessage = buildEmergencySosMessage({
      requestId: tripContext.requestId,
      trackingToken: mintResult.trackingToken,
      coords,
      captainName: tripContext.captainName,
      destinationLabel: tripContext.destinationLabel,
      vehicleModel: tripContext.vehicleModel,
      vehiclePlate: tripContext.vehiclePlate,
      vehicleColor: tripContext.vehicleColor,
    });

    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      void navigator.clipboard.writeText(fullMessage).catch(() => {});
    }

    toast({
      title: t('emergency.sosToastTitle'),
      description: t('emergency.sosToastDescription'),
    });

    broadcastEmergencyTrackingActive(tripContext.requestId);
    openEmergencyWhatsapp(whatsapp, fullMessage);
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
