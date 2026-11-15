'use client';

import React from 'react';
import { Sparkles } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { useTranslations } from 'next-intl';
import type { DriverData } from '@/hooks/admin/useSovereignDashboard';
import { gapSimulatorStyles as styles } from './gap-simulator/gap-simulator-styles';
import { GapCommuteCard } from './gap-simulator/gap-commute-card';
import { GapVoucherCard } from './gap-simulator/gap-voucher-card';
import { GapIntegrityChecklist } from './gap-simulator/gap-integrity-checklist';

export interface SovereignGapSimulatorProps {
  drivers: DriverData[];
  fetchDrivers: () => Promise<void>;
  isProcessing: boolean;
  setIsProcessing: (val: boolean) => void;
}

export function SovereignGapSimulator({
  drivers,
  fetchDrivers,
  isProcessing,
  setIsProcessing,
}: SovereignGapSimulatorProps) {
  const t = useTranslations('adminTab.simulator');

  return (
    <Card className={styles.style181_1}>
      <CardHeader className={styles.style182_2}>
        <CardTitle className={styles.style183_3}>
          <Sparkles className={styles.style184_4} />
          {t('title')}
        </CardTitle>
        <CardDescription className={styles.style187_5}>
          {t('description')}
        </CardDescription>
      </CardHeader>
      <CardContent className={styles.style191_6}>
        <div className={styles.style192_7} dir="rtl">
          <GapCommuteCard
            drivers={drivers}
            fetchDrivers={fetchDrivers}
            isProcessing={isProcessing}
            setIsProcessing={setIsProcessing}
          />
          <GapVoucherCard
            drivers={drivers}
            fetchDrivers={fetchDrivers}
            isProcessing={isProcessing}
            setIsProcessing={setIsProcessing}
          />
        </div>
        <GapIntegrityChecklist />
      </CardContent>
    </Card>
  );
}
