'use client';

import React from 'react';
import { useTranslations } from 'next-intl';
import { Loader2 } from 'lucide-react';
import { useAdminAds } from '@/hooks/use-admin-ads';
import { AdForm } from './ads-management/ad-form';
import { AdCampaignCard } from './ads-management/ad-campaign-card';
import { styles } from './ads-management/ads-management-styles';

export { AdForm } from './ads-management/ad-form';
export { AdCampaignCard } from './ads-management/ad-campaign-card';
export { styles as adsManagementStyles } from './ads-management/ads-management-styles';

export function AdsManagementTab() {
  const { ads, isLoading, isProcessing, createAd, toggleAdStatus, deleteAd, freezeAd, extendAd } = useAdminAds();
  const t = useTranslations('adminTab.adsManagement.tab');

  return (
    <div className={styles.style407_85} dir="rtl">
      <div className={styles.style408_86}>
        <div className={styles.style409_87}>
          <h2 className={styles.style410_88}>{t('title')}</h2>
          <p className={styles.style411_89}>{t('desc')}</p>
        </div>
        <AdForm onFinish={createAd} isProcessing={isProcessing} />
      </div>

      {isLoading ? (
        <Loader2 className={styles.style417_90} />
      ) : ads.length > 0 ? (
        <div className={styles.style419_91}>
          {ads
            .filter((ad) => (ad.status as string) !== 'archived')
            .map((ad) => (
              <AdCampaignCard
                key={ad.id}
                ad={ad}
                onToggle={toggleAdStatus}
                onDelete={deleteAd}
                onFreeze={freezeAd}
                onExtend={extendAd}
              />
            ))}
        </div>
      ) : (
        <p className={styles.style432_92}>{t('empty')}</p>
      )}
    </div>
  );
}
