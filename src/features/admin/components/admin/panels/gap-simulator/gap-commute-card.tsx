'use client';

import React, { useState } from 'react';
import { Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useTranslations } from 'next-intl';
import type { DriverData } from '@/hooks/admin/useSovereignDashboard';
import { gapSimulatorStyles as styles } from './gap-simulator-styles';

export interface GapCommuteCardProps {
  drivers: DriverData[];
  fetchDrivers: () => Promise<void>;
  isProcessing: boolean;
  setIsProcessing: (val: boolean) => void;
}

export function GapCommuteCard({
  drivers,
  fetchDrivers,
  isProcessing,
  setIsProcessing,
}: GapCommuteCardProps) {
  const tAuto = useTranslations('auto');
  const t = useTranslations('adminTab.simulator');
  const { toast } = useToast();

  const [commuteDriverUid, setCommuteDriverUid] = useState<string>('');
  const [targetDistrict, setTargetDistrict] = useState<string>(tAuto('key_3fadd59c'));

  const executeCommuteSim = async () => {
    if (!commuteDriverUid) {
      toast({ variant: 'destructive', title: t('toasts.commuteErrorTitle'), description: t('toasts.commuteErrorNoDriver') });
      return;
    }
    const targetDriver = drivers.find(d => d.uid === commuteDriverUid);
    if (!targetDriver) return;

    setIsProcessing(true);
    try {
      const response = await fetch('/api/commute-driver', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ driverUid: targetDriver.uid, targetDistrict })
      });
      const data = await response.json();

      if (response.ok && data.success) {
        toast({
          title: t('toasts.commuteSuccessTitle'),
          description: t('toasts.commuteSuccessDesc', { name: targetDriver.name, district: targetDistrict })
        });
        await fetchDrivers();
      } else {
        toast({
          variant: 'destructive',
          title: t('toasts.commuteErrorTitle'),
          description: data.error || t('toasts.commuteErrorUnexpected')
        });
      }
    } catch (err: any) {
      toast({ variant: 'destructive', title: t('toasts.commuteErrorTitle'), description: err.message });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className={styles.style195_8}>
      <div className={styles.style196_9}>
        <Clock className={styles.style197_10} />
        <span className={styles.style198_11}>{t('commuteCard.title')}</span>
      </div>
      <p className={styles.style200_12}>
        {t('commuteCard.description')}
      </p>

      <div className={styles.style204_13}>
        <label className={styles.style205_14}>{t('commuteCard.selectLabel')}</label>
        <Select value={commuteDriverUid} onValueChange={setCommuteDriverUid}>
          <SelectTrigger className={styles.style207_15}>
            <SelectValue placeholder={t('commuteCard.selectPlaceholder')} />
          </SelectTrigger>
          <SelectContent className={styles.customSelectContent}>
            {drivers.map(d => (
              <SelectItem key={d.uid} value={d.uid} className={styles.customSelectItem}>
                {d.name} ({d.currentDistrict || t('commuteCard.unspecified')})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <label className={styles.style219_16}>{t('commuteCard.targetLabel')}</label>
        <Select value={targetDistrict} onValueChange={setTargetDistrict}>
          <SelectTrigger className={styles.style221_17}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent className={styles.customSelectContent}>
            <SelectItem value={tAuto('key_3fadd59c')} className={styles.customSelectItem}>{t('areas.shouna')}</SelectItem>
            <SelectItem value={tAuto('key_643e2556')} className={styles.customSelectItem}>{t('areas.naour')}</SelectItem>
            <SelectItem value={tAuto('key_656e3770')} className={styles.customSelectItem}>{t('areas.deirGhbar')}</SelectItem>
            <SelectItem value={tAuto('key_34c7df09')} className={styles.customSelectItem}>{t('areas.sweileh')}</SelectItem>
            <SelectItem value={tAuto('key_edbefa77')} className={styles.customSelectItem}>{t('areas.muqabalain')}</SelectItem>
          </SelectContent>
        </Select>

        <Button
          onClick={executeCommuteSim}
          disabled={isProcessing}
          className={styles.style235_18}
        >
          {t('commuteCard.btn')}
        </Button>
      </div>
    </div>
  );
}
