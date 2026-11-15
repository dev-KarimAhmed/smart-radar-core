'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { ShieldCheck, HelpCircle } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { cn, formatTelUri } from '@/lib/utils';
import { useDashboardLanguage } from '@/hooks/use-dashboard-language';
import { useToast } from '@/hooks/use-toast';
import { vaultStyles as styles, USER_VAULT_LIFETIME_MS } from './vault/vault-styles';
import { VaultAdCard } from './vault/vault-ad-card';

export * from './vault/vault-styles';
export * from './vault/vault-ad-card';

export function VaultTab() {
  const { isArabic } = useDashboardLanguage();
  const { toast } = useToast();
  const tAuto = useTranslations('auto');
  const [heartedAdIds, setHeartedAdIds] = useState<string[]>([]);
  const [vaultDetails, setVaultDetails] = useState<Record<string, any>>({});

  useEffect(() => {
    try {
      const stored = localStorage.getItem('sovereign_hearted_ads');
      const details = localStorage.getItem('sovereign_ad_vault_details');
      const now = Date.now();

      if (stored && details) {
        let heartedIds: string[] = JSON.parse(stored);
        let detailsDict = JSON.parse(details);
        let changed = false;

        // [SCR-AD-VAULT-130] Auto-purge items older than 20 days with sovereign safety limit
        const activeIds = heartedIds.filter((id) => {
          const ad = detailsDict[id];
          if (ad) {
            const savedTime = ad.savedAtTimestamp || now;
            const isExpired = now - savedTime > USER_VAULT_LIFETIME_MS;
            if (isExpired) {
              delete detailsDict[id];
              changed = true;
              return false;
            }
          }
          return true;
        });

        if (changed) {
          localStorage.setItem('sovereign_hearted_ads', JSON.stringify(activeIds));
          localStorage.setItem('sovereign_ad_vault_details', JSON.stringify(detailsDict));
          setHeartedAdIds(activeIds);
          setVaultDetails(detailsDict);
        } else {
          setHeartedAdIds(heartedIds);
          setVaultDetails(detailsDict);
        }
      } else if (stored) {
        setHeartedAdIds(JSON.parse(stored));
      }
    } catch (e) {
      console.error('Failed to read sovereign ad vault localStorage contents:', e);
    }
  }, []);

  const savedAds = useMemo(() => {
    return [...heartedAdIds]
      .reverse()
      .map((id) => vaultDetails[id])
      .filter(Boolean);
  }, [heartedAdIds, vaultDetails]);

  const handleDelete = (adId: string) => {
    const nextIds = heartedAdIds.filter((id) => id !== adId);
    setHeartedAdIds(nextIds);
    localStorage.setItem('sovereign_hearted_ads', JSON.stringify(nextIds));

    const nextDetails = { ...vaultDetails };
    delete nextDetails[adId];
    setVaultDetails(nextDetails);
    localStorage.setItem('sovereign_ad_vault_details', JSON.stringify(nextDetails));

    // Optional haptic
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate(30);
    }
  };

  // [SCR-AD-VAULT-130] Handlers for resetting local safety life clock
  const handleExtend = (adId: string) => {
    const nextDetails = { ...vaultDetails };
    if (nextDetails[adId]) {
      nextDetails[adId] = {
        ...nextDetails[adId],
        savedAtTimestamp: Date.now(),
      };
      setVaultDetails(nextDetails);
      localStorage.setItem('sovereign_ad_vault_details', JSON.stringify(nextDetails));

      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        navigator.vibrate([40, 40]);
      }
      toast({ title: tAuto('vaultTab_extendAlert') });
    }
  };

  const handleZeroClickAction = (actionType: 'call' | 'whatsapp', contactNumber: string, title?: string) => {
    let url = '';
    const cleanNum = contactNumber.replace(/[^0-9+]/g, '');
    if (actionType === 'whatsapp') {
      const text = encodeURIComponent(
        tAuto('vaultTab_whatsappMessage', { title: title || '' })
      );
      url = `https://wa.me/${cleanNum}?text=${text}`;
      window.location.href = url;
    } else {
      url = formatTelUri(contactNumber);
      window.location.href = url;
    }
  };

  return (
    <div className={cn(styles.style112_1, isArabic ? styles.style112_2 : styles.style112_3)} dir={isArabic ? 'rtl' : 'ltr'}>
      <div className={styles.style114_4}>
        <div className={styles.style115_5}>
          <div className={styles.style116_6}>
            <ShieldCheck className={styles.style117_7} />
          </div>
          <div className={isArabic ? styles.style119_8 : styles.style119_9}>
            <h3 className={styles.style120_10}>{tAuto('vaultTab_title')}</h3>
            <p className={styles.style121_11}>{tAuto('vaultTab_subtitle')}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <div className={styles.style124_12}>
            {tAuto('vaultTab_count', { count: heartedAdIds.length })}
          </div>
        </div>
      </div>

      {/* Main List */}
      {savedAds.length === 0 ? (
        <div className={styles.style131_13}>
          <div className={styles.style132_14}>
            <HelpCircle className={styles.style133_15} />
          </div>
          <div className={styles.style135_16}>
            <p className={styles.style136_17}>{tAuto('vaultTab_emptyTitle')}</p>
            <p className={styles.style137_18}>{tAuto('vaultTab_emptyDescription')}</p>
          </div>
        </div>
      ) : (
        <div className={styles.style143_19}>
          {savedAds.map((ad: any) => (
            <VaultAdCard
              key={ad.id}
              ad={ad}
              isArabic={isArabic}
              tAuto={tAuto}
              onDelete={handleDelete}
              onExtend={handleExtend}
              onZeroClickAction={handleZeroClickAction}
            />
          ))}
        </div>
      )}
    </div>
  );
}
