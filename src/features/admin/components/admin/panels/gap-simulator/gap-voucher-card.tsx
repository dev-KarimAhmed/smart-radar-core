'use client';

import React, { useState } from 'react';
import { Award } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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

export interface GapVoucherCardProps {
  drivers: DriverData[];
  fetchDrivers: () => Promise<void>;
  isProcessing: boolean;
  setIsProcessing: (val: boolean) => void;
}

export function GapVoucherCard({
  drivers,
  fetchDrivers,
  isProcessing,
  setIsProcessing,
}: GapVoucherCardProps) {
  const t = useTranslations('adminTab.simulator');
  const { toast } = useToast();

  const [voucherCode, setVoucherCode] = useState<string>('');
  const [voucherDriverUid, setVoucherDriverUid] = useState<string>('');

  const executeVoucherRedeemSim = async () => {
    if (!voucherDriverUid) {
      toast({ variant: 'destructive', title: t('toasts.voucherErrorTitle'), description: t('toasts.voucherErrorNoDriver') });
      return;
    }
    if (!voucherCode) {
      toast({ variant: 'destructive', title: t('toasts.voucherErrorTitle'), description: t('toasts.voucherErrorCode') });
      return;
    }

    const targetDriver = drivers.find(d => d.uid === voucherDriverUid);
    if (!targetDriver) return;

    setIsProcessing(true);
    try {
      const response = await fetch('/api/redeem-voucher', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ driverUid: targetDriver.uid, voucherCode })
      });
      const data = await response.json();

      if (response.ok && data.success) {
        toast({
          title: t('toasts.voucherSuccessTitle'),
          description: t('toasts.voucherSuccessDesc', { hours: data.hoursAdded, name: targetDriver.name })
        });
        setVoucherCode('');
        await fetchDrivers();
      } else {
        toast({
          variant: 'destructive',
          title: t('toasts.voucherFailedTitle'),
          description: data.error || t('toasts.voucherFailedDesc')
        });
      }
    } catch (err: any) {
      toast({ variant: 'destructive', title: t('toasts.voucherErrorTitle'), description: err.message });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className={styles.style243_19}>
      <div className={styles.style244_20}>
        <Award className={styles.style245_21} />
        <span className={styles.style246_22}>{t('voucherCard.title')}</span>
      </div>
      <p className={styles.style248_23}>
        {t('voucherCard.description')}
      </p>

      <div className={styles.style252_24}>
        <label className={styles.style253_25}>{t('voucherCard.selectLabel')}</label>
        <Select value={voucherDriverUid} onValueChange={setVoucherDriverUid}>
          <SelectTrigger className={styles.style255_26}>
            <SelectValue placeholder={t('voucherCard.selectPlaceholder')} />
          </SelectTrigger>
          <SelectContent className={styles.customSelectContent}>
            {drivers.map(d => (
              <SelectItem key={d.uid} value={d.uid} className={styles.customSelectItem}>
                {d.name} ({d.paidHoursRemaining || 0} {t('voucherCard.hoursRemaining')})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <label className={styles.style267_27}>{t('voucherCard.codeLabel')}</label>
        <div className={styles.style268_28}>
          <Input
            type="text"
            placeholder={t('voucherCard.codePlaceholder')}
            value={voucherCode}
            onChange={(e) => setVoucherCode(e.target.value)}
            className={styles.style274_29}
            dir="ltr"
          />
          <span className={styles.style277_30} onClick={() => setVoucherCode('RADAR-100H-JORDAN')}>
            {t('voucherCard.copyHint')}<code className={styles.style278_31}>RADAR-100H-JORDAN</code>
          </span>
        </div>

        <Button
          onClick={executeVoucherRedeemSim}
          disabled={isProcessing}
          className={styles.style285_32}
        >
          {t('voucherCard.btn')}
        </Button>
      </div>
    </div>
  );
}
