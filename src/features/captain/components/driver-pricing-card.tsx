import React from 'react';
import { PricingMatrix } from '@/hooks/use-pricing-matrix';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { AlertCircle, BarChart2, ShieldAlert, Activity, TrendingUp, TrendingDown, ShieldCheck, Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { useDashboardLanguage } from '@/hooks/use-dashboard-language';
import { cn } from '@/lib/utils';
import { useTranslations } from "next-intl";
import { styles } from './pricing-card/pricing-card-styles';
import { PricingInput } from './pricing-card/pricing-input';
import { PricingCardBlockedAdView } from './pricing-card/pricing-card-blocked-ad-view';
import { PricingCardOfferView } from './pricing-card/pricing-card-offer-view';
import { useDriverPricingLogic } from './pricing-card/use-driver-pricing-logic';

export interface PricingCardProps {
  mode: 'setup' | 'offer';
  tripDistance?: number;
  tripDuration?: number;
  pricingPreference?: 'APP' | 'TAXI' | 'FREE' | null;
  onConfirm: (data: PricingMatrix | number) => void;
  onCancel: () => void;
  isSubmitting?: boolean;
}

export { PricingInput };

export function DriverPricingCard({
  mode,
  tripDistance = 0,
  tripDuration = 0,
  pricingPreference = null,
  onConfirm,
  onCancel,
  isSubmitting = false
}: PricingCardProps) {
  const tAuto = useTranslations('auto');
  const { isArabic } = useDashboardLanguage();

  const {
    matrix,
    setMatrix,
    savedMatrix,
    isOperatorLinked,
    setIsOperatorLinked,
    error,
    setError,
    pulseData,
    isSaving,
    isBlocked,
    isWarned,
    isImmuneRisk,
    professionalAd,
    handleSetupSave,
    officialRateFare,
    calculatedOffers
  } = useDriverPricingLogic({
    mode,
    tripDistance,
    tripDuration,
    onConfirm,
    tAuto
  });

  if (mode === 'setup') {
    return (
      <div className={styles.style240_6}>
        <div className={styles.style241_7}>
          {isBlocked && (
            <PricingCardBlockedAdView
              isArabic={isArabic}
              tAuto={tAuto}
              professionalAd={professionalAd}
              onResetDefaults={() => {
                setMatrix({ shortTripFare: 1.20, longTripKmRate: 0.25, minuteRate: 0.05 });
                setError('');
              }}
              onCancel={onCancel}
            />
          )}

          <div className={styles.style332_30}>
            <div className={styles.style333_31}>
              <div className={styles.style334_32}>
                <div className={styles.style335_33}>
                  <Activity className={styles.style336_34} />
                  <span className={styles.style337_35}>{tAuto('key_a2c9a591')}</span>
                </div>
                <Badge variant="outline" className={styles.style339_36}>
                  {pulseData?.trend === 'up' ? <TrendingUp className={styles.style340_37} /> : <TrendingDown className={styles.style340_38} />}
                  {pulseData?.change}
                </Badge>
              </div>
              <p className={styles.style344_39}>"{pulseData?.msg}"</p>
            </div>
          </div>

          <div className={styles.style350_40}>
            <h3 className={styles.style351_41}>{tAuto('key_fc747737')}</h3>
            <p className={styles.style352_42}>{tAuto('key_ed117f6c')}</p>

            <div className={styles.style354_43}>
              <div className={styles.style355_44}>
                <div className={styles.style356_45}>
                  <Label className={styles.style357_46}>
                    <ShieldCheck className={styles.style358_47} /> {tAuto('key_26ab989c')}
                  </Label>
                  <p className={styles.style360_48}>{tAuto('key_810f8db4')}</p>
                </div>
                <Switch checked={isOperatorLinked} onCheckedChange={setIsOperatorLinked} className={styles.style367_49} />
              </div>
              <div className={styles.style371_50}>
                <p className={styles.style372_51}>{tAuto('key_d5a4e5e2')}</p>
              </div>
            </div>

            {!isOperatorLinked && (
              <div className={styles.style381_52}>
                {isBlocked && (
                  <div className={styles.style384_53}>
                    <span className={styles.style385_54}>🚫</span>
                    <div className={styles.style386_55}>
                      <strong className={styles.style387_56}>{tAuto('key_193abc87')}</strong>
                      <p className={styles.style388_57}>{tAuto('key_82954d59')}</p>
                    </div>
                  </div>
                )}
                {isWarned && (
                  <div className={styles.style397_58}>
                    <span className={styles.style398_59}>⚠️</span>
                    <div className={styles.style399_60}>
                      <strong className={styles.style400_61}>{tAuto('key_05b7d234')}</strong>
                      <p className={styles.style401_62}>{tAuto('key_63f73e63')}</p>
                    </div>
                  </div>
                )}
                {isImmuneRisk && (
                  <div className={styles.style410_63}>
                    <span className={styles.style411_64}>🧬</span>
                    <div className={styles.style412_65}>
                      <strong className={styles.style413_66}>{tAuto('key_934367c7')}</strong>
                      <p className={styles.style414_67}>{tAuto('key_c5f40bd5')}</p>
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className={cn(styles.style423_68, isOperatorLinked ? styles.style423_69 : styles.style423_70)}>
              <div>
                <h4 className={styles.style425_71}>{tAuto('key_87e0eb00')}</h4>
                <div className={styles.style426_72}>
                  <PricingInput id="shortTripFare" label={tAuto('key_cc656643')} value={matrix.shortTripFare} onChange={val => setMatrix(m => ({ ...m, shortTripFare: val }))} icon={<BarChart2 className={styles.style427_73} />} hasError={!isOperatorLinked && ((matrix.shortTripFare || 0) < 1.0 || isBlocked)} />
                </div>
              </div>

              <Separator className={styles.style431_74} />

              <div>
                <h4 className={styles.style434_75}>{tAuto('key_09a247fe')}</h4>
                <div className={styles.style435_76}>
                  <PricingInput id="longTripKmRate" label={tAuto('key_02c1325b')} value={matrix.longTripKmRate} onChange={val => setMatrix(m => ({ ...m, longTripKmRate: val }))} icon={<BarChart2 className={styles.style436_77} />} hasError={!isOperatorLinked && isBlocked} />
                  <PricingInput id="minuteRate" label={tAuto('key_2af82021')} value={matrix.minuteRate} onChange={val => setMatrix(m => ({ ...m, minuteRate: val }))} icon={<ShieldAlert className={styles.style437_78} />} hasError={!isOperatorLinked && isBlocked} />
                </div>
              </div>
            </div>

            {error && <div className={styles.style442_79}><AlertCircle className={styles.style442_80} /> {error}</div>}

            <div className={styles.style444_81}>
              <Button
                onClick={handleSetupSave}
                disabled={isSaving || (!isOperatorLinked && isBlocked)}
                className={cn(styles.style448_82, !isOperatorLinked && isBlocked ? styles.style450_83 : styles.style451_84)}
              >
                {isSaving ? <Loader2 className={styles.style454_85} /> : tAuto('key_cd789dd0')}
              </Button>
              <Button onClick={onCancel} variant="outline" className={styles.style456_86}>{tAuto('key_9932cca0')}</Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (mode === 'offer') {
    return (
      <PricingCardOfferView
        pricingPreference={pricingPreference}
        tripDistance={tripDistance}
        isOperatorLinked={savedMatrix.isOperatorLinked || false}
        officialRateFare={officialRateFare}
        calculatedOffers={calculatedOffers}
        isSubmitting={isSubmitting}
        tAuto={tAuto}
        onConfirm={onConfirm}
        onCancel={onCancel}
      />
    );
  }

  return null;
}
