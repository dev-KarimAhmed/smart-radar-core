import React from 'react';
import { useTranslations } from 'next-intl';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase-client';
import { firstDisplayString, normalizeWhatsappContact } from '../services/rider-view-format';

export interface EmergencyContactTripContext {
  captainName?: string;
  destinationLabel?: string;
  requestId?: string | null;
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

  const handleEmergencyWhatsapp = React.useCallback(() => {
    const whatsapp = normalizeWhatsappContact(emergencyWhatsappContact);
    if (!whatsapp) {
      setShowEmergencyContactDialog(true);
      return;
    }

    const captainName = firstDisplayString(tripContext.captainName);
    const destination = firstDisplayString(tripContext.destinationLabel);
    const shortRequestId = tripContext.requestId ? tripContext.requestId.slice(0, 8).toUpperCase() : '';
    const defaultMessage = [
      t('emergency.messageIntro'),
      captainName ? t('emergency.messageCaptainLine', { captainName }) : '',
      destination ? t('emergency.messageDestinationLine', { destination }) : '',
      shortRequestId ? t('emergency.messageRequestLine', { requestId: shortRequestId }) : '',
    ].filter(Boolean).join(' ');

    const message = encodeURIComponent(t('emergency.message') || defaultMessage);
    const opened = window.open(`https://wa.me/${whatsapp}?text=${message}`, '_blank', 'noopener,noreferrer');
    if (!opened) {
      toast({
        variant: 'destructive',
        title: t('emergency.unavailableTitle'),
        description: t('emergency.unavailableDescription'),
      });
    }
  }, [emergencyWhatsappContact, t, toast, tripContext.captainName, tripContext.destinationLabel, tripContext.requestId]);

  return {
    emergencyWhatsappContact,
    showEmergencyContactDialog,
    setShowEmergencyContactDialog,
    handleAddEmergencyContact,
    handleEmergencyWhatsapp,
  };
}
