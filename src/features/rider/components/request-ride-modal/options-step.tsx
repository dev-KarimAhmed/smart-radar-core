import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';
import { styles } from './request-modal-shared';
import { AlertCircle } from 'lucide-react';

interface OptionsStepProps {
  seats: string;
  setSeats: (val: string) => void;
  pricingPreference: string | null;
  setPricingPreference: (val: any) => void;
}

export function OptionsStep({
  seats,
  setSeats,
  pricingPreference,
  setPricingPreference,
}: OptionsStepProps) {
  const t = useTranslations('requestRide');

  return (
    <>
      <div className={styles.style242_65}>
        <div className={styles.style243_66}>
          <span className={styles.style244_67}>{t('step7Title')}</span>
          <Select value={seats} onValueChange={setSeats}>
            <SelectTrigger className={styles.style246_68}>
              <SelectValue placeholder={t('selectSeats')} />
            </SelectTrigger>
            <SelectContent className={styles.style249_69}>
              {[1, 2, 3, 4].map((n) => (
                <SelectItem key={n} value={n.toString()}>
                  {n} {n === 1 ? t('passenger') : t('passengers')}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className={styles.style255_70}>
          <span className={styles.style256_71}>{t('step8Title')}</span>
          <div className={styles.style257_72}>
            <Select
              value={pricingPreference || 'none'}
              onValueChange={(val) => setPricingPreference(val === 'none' ? null : val)}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder={t('noPreference')} />
              </SelectTrigger>
              <SelectContent className="border-white/10 bg-[#0F172A] text-white">
                <SelectItem value="none">{t('noPreference')}</SelectItem>
                <SelectItem value="FREE">{t('freePrice')}</SelectItem>
                <SelectItem value="APP">{t('appPricing')}</SelectItem>
                <SelectItem value="TAXI">{t('taxiMeter')}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <div className={styles.style265_75}>
        <span className={styles.style266_76}>{t('availabilityStatus')}</span>
        <div className={styles.style267_77}>
          <span
            className={cn(
              styles.style269_78,
              parseInt(seats) <= 2 ? styles.style270_79 : styles.style270_80
            )}
          >
            {parseInt(seats) <= 2 ? t('supplyHigh') : t('demandHigh')}
          </span>
          <span className={styles.style274_81}>γ = 1.35</span>
        </div>
      </div>

      <div className={styles.style281_82}>
        <div className={styles.style282_83}>
          <AlertCircle className={styles.style283_84} />
          <span>{t('integrityTitle')}</span>
        </div>
        <p className={styles.style286_85}>{t('integrityDesc')}</p>
      </div>
    </>
  );
}
