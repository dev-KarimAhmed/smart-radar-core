'use client';

import React from 'react';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';
import { useRiderSidebarRadar } from '../../hooks/use-rider-sidebar-radar';
import { styles, statusClass } from './app-sidebar-styles';

export function RiderFavoriteDrivers() {
  const tAuto = useTranslations('auto');
  const { nearbyFavorites, isLoading } = useRiderSidebarRadar();

  if (isLoading) {
    return (
      <div className={styles.favoriteList}>
        {[0, 1].map((item) => <div className={styles.skeleton} key={item} />)}
      </div>
    );
  }

  if (nearbyFavorites.length === 0) {
    return <p className={styles.empty}>{tAuto('key_0ea45449')}</p>;
  }

  return (
    <div className={styles.favoriteList}>
      {nearbyFavorites.map((driver) => (
        <div className={styles.favoriteItem} key={driver.uid}>
          <span className={styles.favoriteName}>{driver.name}</span>
          <div className={styles.favoriteStatus}>
            <span className={styles.favoriteStatusText}>{driver.status || tAuto('key_eaec5eff')}</span>
            <span className={cn(styles.favoriteStatusDot, statusClass(driver.status))} />
          </div>
        </div>
      ))}
    </div>
  );
}
