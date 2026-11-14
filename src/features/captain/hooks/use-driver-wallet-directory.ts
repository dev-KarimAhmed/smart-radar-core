'use client';

import { useEffect, useMemo, useState } from 'react';
import type { User } from '@/core/types';
import { getSupabaseAuthHeaders } from '@/shared/services/supabase-auth-headers';
import {
  CAPTAIN_PAYMENT_CHANNELS,
  getCaptainDistrictPaymentInfo,
} from '../lib/wallet-static-config';
import type { PaymentTransferChannel, FinancialDelegate } from '@/features/admin/types/wallet-directory';
import type {
  EffectivePaymentChannel,
  EffectiveFinancialDelegate,
} from '../types/driver-wallet-types';

export function useDriverWalletDirectory(user: User | null, defaultDelegateHint: string) {
  const [dynamicChannels, setDynamicChannels] = useState<PaymentTransferChannel[]>([]);
  const [dynamicDelegate, setDynamicDelegate] = useState<FinancialDelegate | null>(null);
  const [isLoadingDirectory, setIsLoadingDirectory] = useState<boolean>(true);

  const districtPaymentInfo = getCaptainDistrictPaymentInfo(user?.district);

  useEffect(() => {
    let isMounted = true;
    const fetchDirectory = async () => {
      try {
        const params = new URLSearchParams();
        if (user?.countryId) params.append('countryId', String(user.countryId));
        if (user?.governorate) params.append('governorate', user.governorate);
        if (user?.district) params.append('district', user.district);

        const authHeaders = await getSupabaseAuthHeaders();
        const res = await fetch(`/api/captain/wallet-directory?${params.toString()}`, {
          headers: authHeaders,
        });
        if (!res.ok) return;
        const data = await res.json();
        if (isMounted && data.success) {
          if (Array.isArray(data.channels) && data.channels.length > 0) {
            setDynamicChannels(data.channels);
          }
          setDynamicDelegate(data.delegate || null);
        }
      } catch (err) {
        console.warn('[DriverWalletTab] Failed to fetch dynamic wallet directory, using fallback:', err);
      } finally {
        if (isMounted) setIsLoadingDirectory(false);
      }
    };

    fetchDirectory();
    return () => {
      isMounted = false;
    };
  }, [user?.uid, user?.countryId, user?.governorate, user?.district]);

  const effectiveChannels: EffectivePaymentChannel[] = useMemo(() => {
    if (dynamicChannels.length > 0) {
      return dynamicChannels.map((c) => ({
        id: c.id,
        labelAr: c.nameAr,
        labelEn: c.nameEn,
        descriptionAr: c.descriptionAr || '',
        descriptionEn: c.descriptionEn || '',
        accountNumber: c.accountNumber,
        accountHolder: c.accountHolder,
      }));
    }
    return CAPTAIN_PAYMENT_CHANNELS.map((channel) => ({
      id: channel.id,
      labelAr: channel.labelAr,
      labelEn: channel.labelEn,
      descriptionAr: channel.descriptionAr,
      descriptionEn: channel.descriptionEn,
      accountNumber: districtPaymentInfo.channelNumbers[channel.id] || '',
      accountHolder: undefined,
    }));
  }, [dynamicChannels, districtPaymentInfo]);

  const effectiveDelegate: EffectiveFinancialDelegate | null = useMemo(() => {
    if (!dynamicDelegate) return null;
    if (!dynamicDelegate.phone && !dynamicDelegate.whatsapp) return null;
    return {
      name: dynamicDelegate.name,
      phone: dynamicDelegate.phone,
      whatsapp: dynamicDelegate.whatsapp || dynamicDelegate.phone,
      areaBadge: dynamicDelegate.districtName || dynamicDelegate.governorateName || undefined,
      hint: dynamicDelegate.notes || defaultDelegateHint,
    };
  }, [dynamicDelegate, defaultDelegateHint]);

  return {
    effectiveChannels,
    effectiveDelegate,
    isLoadingDirectory,
  };
}
