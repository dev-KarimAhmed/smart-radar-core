'use client';

import React, { useState } from 'react';
import {
  Sparkles,
  Clock,
  Award,
  Loader2,
  Check
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
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
import { db } from '@/lib/firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { DriverData } from '@/hooks/admin/useSovereignDashboard';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';

const styles = {
  style181_1: "bg-[#050505] border border-[#00ffcc]/15 shadow-[0_8px_32px_rgba(0,0,0,0.5)] rounded-2xl overflow-hidden mt-8",
  style182_2: "bg-zinc-950 border-b border-[#00ffcc]/10 p-5",
  style183_3: "text-[#00ffcc] text-base font-extrabold flex items-center gap-2",
  style184_4: "w-5 h-5 text-[#00ffcc]",
  style187_5: "text-gray-400 text-xs leading-relaxed text-right",
  style191_6: "p-6 space-y-8",
  style192_7: "grid grid-cols-1 md:grid-cols-2 gap-6 text-right",
  style195_8: "bg-zinc-950 p-5 rounded-xl border border-white/5 space-y-4",
  style196_9: "flex items-center gap-2 border-b border-white/5 pb-3",
  style197_10: "w-5 h-5 text-amber-400",
  style198_11: "font-extrabold text-sm text-white",
  style200_12: "text-xs text-gray-400 leading-relaxed",
  style204_13: "space-y-3",
  style205_14: "text-[11px] text-gray-400 block font-bold",
  style207_15: "w-full bg-zinc-900 border border-white/10 rounded-lg p-2.5 text-xs text-white",
  customSelectContent: "border-white/10 bg-zinc-900 text-white shadow-2xl shadow-black/40",
  customSelectItem: "cursor-pointer rounded-lg py-2.5 text-xs font-black text-slate-200 focus:bg-[#00ffcc]/15 focus:text-[#00ffcc] data-[state=checked]:bg-[#00ffcc]/10 data-[state=checked]:text-[#00ffcc]",
  style219_16: "text-[11px] text-gray-400 block font-bold",
  style221_17: "w-full bg-zinc-900 border border-white/10 rounded-lg p-2.5 text-xs text-white",
  style235_18: "w-full bg-amber-500 hover:bg-amber-400 text-black font-black text-xs h-9 mt-2 cursor-pointer",
  style243_19: "bg-zinc-950 p-5 rounded-xl border border-white/5 space-y-4",
  style244_20: "flex items-center gap-2 border-b border-white/5 pb-3",
  style245_21: "w-5 h-5 text-[#00ffcc]",
  style246_22: "font-extrabold text-sm text-white",
  style248_23: "text-xs text-gray-400 leading-relaxed",
  style252_24: "space-y-3",
  style253_25: "text-[11px] text-gray-400 block font-bold",
  style255_26: "w-full bg-zinc-900 border border-white/10 rounded-lg p-2.5 text-xs text-white",
  style267_27: "text-[11px] text-gray-400 block font-bold",
  style268_28: "space-y-1",
  style274_29: "bg-zinc-900 border-white/10 text-xs text-white placeholder-gray-600 h-9 text-right",
  style277_30: "text-[9px] text-[#00ffcc] block cursor-pointer",
  style278_31: "underline font-bold",
  style285_32: "w-full bg-[#00ffcc] hover:bg-[#00ffcc]/80 text-black font-black text-xs h-9 mt-2 cursor-pointer",
  style295_33: "bg-zinc-900/40 border border-white/5 p-4 rounded-xl space-y-2 text-right",
  style296_34: "text-xs font-bold text-gray-300",
  style297_35: "text-[11px] text-gray-400 space-y-1",
  style298_36: "flex items-center gap-1.5",
  style299_37: "text-[#00ffcc]",
  style302_38: "flex items-center gap-1.5",
  style303_39: "text-[#00ffcc]",
  style306_40: "flex items-center gap-1.5 font-sans",
  style307_41: "text-[#ff3366]",
  style308_42: "text-right",
  style308_43: "text-red-400",
} as const;


// [SCR-GAP-LOCKDOWN-150] محرك سد الثغرات الاستراتيجية (الارتحال، الشحن، والصندوق الأسود)
// محصن ومغلق اً - يعمل بمعمارية الحافة وصفر كلفة تشغيلية
import { CaptainSovereignState, RadarGapLockdownKernel } from './sovereign-gap-kernel';

interface SovereignGapSimulatorProps {
  drivers: DriverData[];
  fetchDrivers: () => Promise<void>;
  isProcessing: boolean;
  setIsProcessing: (val: boolean) => void;
}

export function SovereignGapSimulator({
  drivers,
  fetchDrivers,
  isProcessing,
  setIsProcessing
}: SovereignGapSimulatorProps) {
  const { toast } = useToast();
  const t = useTranslations('adminTab.simulator');

  // Simulated operations states
  const [commuteDriverUid, setCommuteDriverUid] = useState<string>('');
  const [targetDistrict, setTargetDistrict] = useState<string>('منطقة الشونة الجنوبية');
  const [voucherCode, setVoucherCode] = useState<string>('');
  const [voucherDriverUid, setVoucherDriverUid] = useState<string>('');

  /**
   * 📡 executeCommuteSim
   * Commutes a captain to a new Jordanian district at the Edge & updates database.
   */
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

  /**
   * 🎫 executeVoucherRedeemSim [SECURE BACKEND INTERACTION]
   * Authenticates physical voucher against the secure backend route with IP rate-limiting.
   */
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

          {/* 1. Regional Commute Card */}
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
                  <SelectItem value={t('key_3fadd59c')} className={styles.customSelectItem}>{t('areas.shouna')}</SelectItem>
                  <SelectItem value={t('key_643e2556')} className={styles.customSelectItem}>{t('areas.naour')}</SelectItem>
                  <SelectItem value={t('key_656e3770')} className={styles.customSelectItem}>{t('areas.deirGhbar')}</SelectItem>
                  <SelectItem value={t('key_34c7df09')} className={styles.customSelectItem}>{t('areas.sweileh')}</SelectItem>
                  <SelectItem value={t('key_edbefa77')} className={styles.customSelectItem}>{t('areas.muqabalain')}</SelectItem>
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

          {/* 2. Voucher Top-Up Card */}
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

        </div>

        {/* 3. Operational Integrity Audit Checklist */}
        <div className={styles.style295_33}>
          <h4 className={styles.style296_34}>{t('metrics.title')}</h4>
          <ul className={styles.style297_35}>
            <li className={styles.style298_36}>
              <Check className={cn(styles.style299_37, 'w-4 h-4')} />
              <span>{t('metrics.item1')}</span>
            </li>
            <li className={styles.style302_38}>
              <Check className={cn(styles.style303_39, 'w-4 h-4')} />
              <span>{t('metrics.item2')}</span>
            </li>
            <li className={styles.style306_40}>
              <Check className={cn(styles.style307_41, 'w-4 h-4')} />
              <span className={styles.style308_42}>{t('metrics.item3Text')}<code className={styles.style308_43}>{t('metrics.item3Code')}</code>{t('metrics.item3Suffix')}</span>
            </li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
