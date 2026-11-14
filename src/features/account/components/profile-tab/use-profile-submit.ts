import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useTranslations } from 'next-intl';
import { isSaudiPhoneNumber, SAUDI_RESTRICTION_MESSAGES } from '@/core/logic/saudi-restriction';
import { recordLegalDeclaration } from '@/features/account/services/legal-log-service';
import type { ProfileKey } from './profile-shared';
import { normalizeInternationalPhone, saveProfile, mapProfileSaveError } from './profile-shared';

interface UseProfileSubmitParams {
  user: any;
  profileKey: ProfileKey | null;
  fullName: string;
  phone: string;
  emergencyWhatsappContact: string;
  countryId: string;
  governorateId: string;
  districtId: string;
  isArabic: boolean;
}

export function useProfileSubmit({
  user,
  profileKey,
  fullName,
  phone,
  emergencyWhatsappContact,
  countryId,
  governorateId,
  districtId,
  isArabic,
}: UseProfileSubmitParams) {
  const { toast } = useToast();
  const t = useTranslations('profileTab');
  const [isSaving, setIsSaving] = useState(false);
  const [showAccuracyModal, setShowAccuracyModal] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!user?.uid) return;

    const nextCountryId = Number(countryId);
    const nextGovernorateId = Number(governorateId);
    const nextDistrictId = Number(districtId);

    if (isSaudiPhoneNumber(phone) || isSaudiPhoneNumber(emergencyWhatsappContact)) {
      toast({
        variant: 'destructive',
        title: isArabic ? 'رقم هاتف غير مدعوم' : 'Unsupported Phone Number',
        description: isArabic ? SAUDI_RESTRICTION_MESSAGES.ar.phoneRejected : SAUDI_RESTRICTION_MESSAGES.en.phoneRejected,
      });
      return;
    }

    if (!fullName.trim()) {
      toast({
        variant: 'destructive',
        title: t('incompleteData'),
        description: t('enterFullName'),
      });
      return;
    }

    if (![nextCountryId, nextGovernorateId, nextDistrictId].every((value) => Number.isInteger(value) && value > 0)) {
      toast({
        variant: 'destructive',
        title: t('incompleteData'),
        description: t('chooseLocationData'),
      });
      return;
    }

    const normalizedEmergencyWhatsapp = normalizeInternationalPhone(emergencyWhatsappContact);
    if (emergencyWhatsappContact.trim() && !normalizedEmergencyWhatsapp) {
      toast({
        variant: 'destructive',
        title: t('invalidEmergencyWhatsappTitle'),
        description: t('invalidEmergencyWhatsappDescription'),
      });
      return;
    }

    setShowAccuracyModal(true);
  };

  const confirmSaveProfile = async () => {
    setShowAccuracyModal(false);
    if (!user?.uid) return;

    const nextCountryId = Number(countryId);
    const nextGovernorateId = Number(governorateId);
    const nextDistrictId = Number(districtId);
    const normalizedEmergencyWhatsapp = normalizeInternationalPhone(emergencyWhatsappContact);

    setIsSaving(true);
    try {
      const payload = {
        full_name: fullName.trim(),
        phone: phone.trim(),
        emergency_whatsapp_contact: normalizedEmergencyWhatsapp || null,
        country_id: nextCountryId,
        governorate_id: nextGovernorateId,
        district_id: nextDistrictId,
      };

      await saveProfile(profileKey, user.uid, payload);

      if (normalizedEmergencyWhatsapp) {
        localStorage.setItem(`radar_emergency_whatsapp_${user.uid}`, normalizedEmergencyWhatsapp);
      } else {
        localStorage.removeItem(`radar_emergency_whatsapp_${user.uid}`);
      }

      void recordLegalDeclaration({
        userId: user.uid,
        userSerialId: user.serial_id,
        actionType: 'PROFILE_UPDATE',
        actionLabel: 'تعديل بيانات الحساب الشخصي',
        isArabic,
      });

      toast({
        title: t('saveSuccessTitle'),
        description: t('saveSuccessDesc'),
      });
    } catch (error) {
      const msg = mapProfileSaveError(error);
      toast({
        variant: 'destructive',
        title: t('saveErrorTitle'),
        description: t(msg as any),
      });
    } finally {
      setIsSaving(false);
    }
  };

  return {
    isSaving,
    showAccuracyModal,
    handleSubmit,
    confirmSaveProfile,
    cancelSaveProfile: () => setShowAccuracyModal(false),
  };
}
