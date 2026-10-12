'use client';

import React from 'react';
import { useTranslations } from 'next-intl';
import { Loader2 } from 'lucide-react';
import type { User } from '@/core/types';
import { useToast } from '@/hooks/use-toast';
import { useDriverProfileState } from '../hooks/use-driver-profile-state';
import { styles } from './profile/driver-profile-shared';
import { DriverAccountPanel } from './profile/driver-account-panel';
import { DriverVehiclePanel } from './profile/driver-vehicle-panel';
import { DriverTariffPanel } from './profile/driver-tariff-panel';

interface DriverProfileTabProps {
  user: User | null;
  language: 'ar' | 'en';
}

export function DriverProfileTab({ user, language }: DriverProfileTabProps) {
  const t = useTranslations('captainProfile');
  const { toast } = useToast();
  const state = useDriverProfileState(user, toast);

  if (state.isLoadingProfile) {
    return (
      <section className={styles.style244_1}>
        <div className={styles.style245_2}>
          <div className={styles.style246_3}>
            <div className={styles.style247_4}>
              <Loader2 className={styles.style248_5} />
            </div>
            <div>
              <p className={styles.style251_6}>
                {t('loadingTitle')}
              </p>
              <p className={styles.style254_7}>
                {t('loadingBody')}
              </p>
            </div>
          </div>
          <div className={styles.style261_8}>
            {Array.from({ length: 6 }).map((_, index) => (
              <div key={index} className={styles.style263_9} />
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (state.profileLoadFailed) {
    return (
      <section className={styles.style273_10}>
        <div className={styles.style274_11}>
          <div className={styles.style275_12}>
            <div>
              <p className={styles.style277_13}>
                {t('loadErrorTitle')}
              </p>
              <p className={styles.style280_14}>
                {t('loadErrorBody')}
              </p>
            </div>
            <button
              type="button"
              onClick={() => state.setProfileReloadToken((value: number) => value + 1)}
              className={styles.style289_15}
            >
              {t('retry')}
            </button>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className={styles.style300_16}>
      <div className={styles.style430_61}>
        <DriverAccountPanel state={state} user={user} />
        <DriverVehiclePanel state={state} language={language} />
        <DriverTariffPanel state={state} />
      </div>
    </section>
  );
}
