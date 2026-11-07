'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { ShieldAlert, ShieldCheck, Loader2 } from 'lucide-react';
import { styles } from './driver-pricing-styles';

interface DriverPricingOfferModalProps {
  pricingPreference: 'APP' | 'TAXI' | 'FREE' | null;
  officialRateFare: number;
  calculatedOffers: { min: number; avg: number; peak: number } | null;
  isOperatorLinked: boolean;
  tripDistance: number;
  isSubmitting: boolean;
  onConfirm: (fare: number) => void;
  onCancel: () => void;
  tAuto: (key: string) => string;
}

export function DriverPricingOfferModal({
  pricingPreference,
  officialRateFare,
  calculatedOffers,
  isOperatorLinked,
  tripDistance,
  isSubmitting,
  onConfirm,
  onCancel,
  tAuto,
}: DriverPricingOfferModalProps) {
  if (pricingPreference === 'APP') {
    return (
      <div className={styles.style467_87}>
        <div className={styles.style468_88}>
          <h3 className={styles.style469_89}>
            <ShieldAlert className={styles.style470_90} />
            {tAuto('key_2230e090')}
          </h3>
          <p className={styles.style473_91}>
            {tAuto('key_2e1fb4fc')}
          </p>

          <div className={styles.style477_92}>
            <p className={styles.style478_93}>{tAuto('key_50a1f4eb')}</p>
            <div className={styles.style479_94}>
              {officialRateFare.toFixed(2)} <span className={styles.style480_95}>{tAuto('key_220dddd6')}</span>
            </div>
            <span className={styles.style482_96}>{tAuto('key_a5a9c2c5')}</span>
          </div>

          <p className={styles.style485_97}>
            {tAuto('key_ac419809')}
          </p>

          <div className={styles.style489_98}>
            <Button
              onClick={() => onConfirm(officialRateFare)}
              disabled={isSubmitting}
              size="lg"
              className={styles.style494_99}
            >
              {isSubmitting ? <Loader2 className={styles.style496_100} /> : tAuto('key_09b7f5c7')}
            </Button>

            <Button
              onClick={onCancel}
              variant="outline"
              className={styles.style502_101}
            >
              {tAuto('key_ad1436e3')}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (calculatedOffers) {
    if (isOperatorLinked) {
      return (
        <div className={styles.style515_102}>
          <div className={styles.style516_103}>
            <h3 className={styles.style517_104}>
              <ShieldCheck className={styles.style517_105} /> {tAuto('key_3a80d104')}
            </h3>
            <p className={styles.style518_106}>
              {tAuto('key_1f1cda12')}
            </p>
            <div className={styles.style521_107}>
              <p className={styles.style522_108}>{tAuto('key_7f876217')}</p>
              <p className={styles.style523_109}>{tAuto('key_f8522b9b')}</p>
            </div>
            <p className={styles.style525_110}>{tAuto('key_81cb0f54')}</p>
            <div className={styles.style526_111}>
              <Button onClick={() => onConfirm(-1)} disabled={isSubmitting} size="lg" className={styles.style527_112}>
                {isSubmitting ? <Loader2 className={styles.style528_113} /> : <span className={styles.style528_114}>{tAuto('key_a0fba9f4')}</span>}
              </Button>
            </div>
            <Button onClick={onCancel} variant="ghost" className={styles.style531_115}>{tAuto('key_ad1436e3')}</Button>
          </div>
        </div>
      );
    }

    return (
      <div className={styles.style538_116}>
        <div className={styles.style539_117}>
          <h3 className={styles.style540_118}>{tAuto('key_fa12de96')}</h3>
          <p className={styles.style541_119}>
            {tAuto('key_bbcf5dc8')}{tripDistance.toFixed(1)} {tAuto('key_15f14042')}
          </p>

          <div className={styles.style545_120}>
            <p className={styles.style546_121}>{tAuto('key_52cc73f2')}</p>
            <p className={styles.style547_122}>
              {calculatedOffers.avg.toFixed(2)} <span className={styles.style547_123}>{tAuto('key_1801c96b')}</span>
            </p>
          </div>

          <p className={styles.style550_124}>{tAuto('key_fff81cc9')}</p>
          <div className={styles.style551_125}>
            <Button onClick={() => onConfirm(calculatedOffers.min)} disabled={isSubmitting} variant="outline" size="lg" className={styles.style552_126}>
              {isSubmitting ? <Loader2 className={styles.style553_127} /> : <span className={styles.style553_128}>{tAuto('key_8dbb0844')}</span>}
              <span className={styles.style554_129}>{calculatedOffers.min.toFixed(2)}</span>
            </Button>
            <Button onClick={() => onConfirm(calculatedOffers.avg)} disabled={isSubmitting} size="lg" className={styles.style556_130}>
              {isSubmitting ? <Loader2 className={styles.style557_131} /> : <span className={styles.style557_132}>{tAuto('key_60ac2455')}</span>}
              <span className={styles.style558_133}>{calculatedOffers.avg.toFixed(2)}</span>
            </Button>
            <Button onClick={() => onConfirm(calculatedOffers.peak)} disabled={isSubmitting} variant="outline" size="lg" className={styles.style560_134}>
              {isSubmitting ? <Loader2 className={styles.style561_135} /> : <span className={styles.style561_136}>{tAuto('key_bace34ec')}</span>}
              <span className={styles.style562_137}>{calculatedOffers.peak.toFixed(2)}</span>
            </Button>
          </div>
          <Button onClick={onCancel} variant="ghost" className={styles.style565_138}>{tAuto('key_ad1436e3')}</Button>
        </div>
      </div>
    );
  }

  return null;
}
