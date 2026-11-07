'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { AlertCircle, BarChart2, ShieldAlert, Activity, TrendingUp, TrendingDown, ShieldCheck, Loader2 } from 'lucide-react';
import { AdDisplayCard } from '@/features/ads/ad-display/contract';
import { cn } from '@/lib/utils';
import { styles } from './driver-pricing-styles';
import { PricingInput } from './pricing-input';

interface DriverPricingSetupModalProps {
  isBlocked: boolean;
  isArabic: boolean;
  professionalAd: any;
  pulseData: any;
  isOperatorLinked: boolean;
  setIsOperatorLinked: (val: boolean) => void;
  isWarned: boolean;
  isImmuneRisk: boolean;
  matrix: { shortTripFare: number; longTripKmRate: number; minuteRate: number };
  setMatrix: React.Dispatch<React.SetStateAction<{ shortTripFare: number; longTripKmRate: number; minuteRate: number }>>;
  error: string;
  setError: (val: string) => void;
  isSaving: boolean;
  handleSetupSave: () => void;
  onCancel: () => void;
  tAuto: (key: string) => string;
}

export function DriverPricingSetupModal({
  isBlocked,
  isArabic,
  professionalAd,
  pulseData,
  isOperatorLinked,
  setIsOperatorLinked,
  isWarned,
  isImmuneRisk,
  matrix,
  setMatrix,
  error,
  setError,
  isSaving,
  handleSetupSave,
  onCancel,
  tAuto,
}: DriverPricingSetupModalProps) {
  return (
    <div className={styles.style240_6}>
      <div className={styles.style241_7}>
        {/* [المادة 4] تجميد شاشة السائق وعرض الإعلان المهني الموجه عند تجاوز الـ 15% */}
        {isBlocked && (
          <div className={cn(styles.style245_8, isArabic ? styles.style245_9 : styles.style245_10)} dir={isArabic ? 'rtl' : 'ltr'}>
            <div className={styles.style246_11}>
              <div className={styles.style247_12}>
                <AlertCircle className={styles.style248_13} />
                <div>
                  <h4 className={styles.style250_14}>
                    {isArabic ? tAuto('key_ec8882fc') : "🚫 Input Error: Value is operationally illogical"}
                  </h4>
                  <p className={styles.style251_15}>
                    {isArabic ? tAuto('key_9ed950c9') : "The entered price is too far from the appropriate market price. The offer has been paused until you adjust it."}
                  </p>
                </div>
              </div>

              {professionalAd && (
                <AdDisplayCard
                  ad={professionalAd}
                  showHeart={false}
                  badgeText={isArabic ? tAuto('key_747ae6ec') : "Driver Support"}
                  ctaText={professionalAd.buttonText}
                  className={styles.style263_16}
                  onOpen={(event: React.MouseEvent) => {
                    event.stopPropagation();
                    window.open(professionalAd.actionUrl, '_blank', 'noopener,noreferrer');
                  }}
                />
              )}
            </div>

            <div className={styles.style300_25}>
              <p className={styles.style301_26}>
                {tAuto('key_6745363d')}
              </p>

              <div className={styles.style305_27}>
                <Button
                  onClick={() => {
                    setMatrix({
                      shortTripFare: 1.20,
                      longTripKmRate: 0.25,
                      minuteRate: 0.05,
                    });
                    setError('');
                  }}
                  className={styles.style315_28}
                >
                  <span>{tAuto('key_02a19696')}</span>
                </Button>

                <Button
                  onClick={onCancel}
                  variant="outline"
                  className={styles.style323_29}
                >
                  {tAuto('key_c7ae9d1f')}
                </Button>
              </div>
            </div>
          </div>
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
            <p className={styles.style344_39}>
              &ldquo;{pulseData?.msg}&rdquo;
            </p>
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
                <p className={styles.style360_48}>
                  {tAuto('key_810f8db4')}
                </p>
              </div>
              <Switch
                checked={isOperatorLinked}
                onCheckedChange={setIsOperatorLinked}
                className={styles.style367_49}
              />
            </div>

            <div className={styles.style371_50}>
              <p className={styles.style372_51}>
                {tAuto('key_d5a4e5e2')}
              </p>
            </div>
          </div>

          {/* Sovereign Alerts Panel */}
          {!isOperatorLinked && (
            <div className={styles.style381_52}>
              {/* Warning 1: Blocked (Deviation >= 15% or Base < 1.0) */}
              {isBlocked && (
                <div className={styles.style384_53}>
                  <span className={styles.style385_54}>🚫</span>
                  <div className={styles.style386_55}>
                    <strong className={styles.style387_56}>{tAuto('key_193abc87')}</strong>
                    <p className={styles.style388_57}>
                      {tAuto('key_82954d59')}
                    </p>
                  </div>
                </div>
              )}

              {/* Warning 2: Amber Deviation Warning (10% to 14.9%) */}
              {isWarned && (
                <div className={styles.style397_58}>
                  <span className={styles.style398_59}>⚠️</span>
                  <div className={styles.style399_60}>
                    <strong className={styles.style400_61}>{tAuto('key_05b7d234')}</strong>
                    <p className={styles.style401_62}>
                      {tAuto('key_63f73e63')}
                    </p>
                  </div>
                </div>
              )}

              {/* Warning 3: Immune system risk (Rating <= 4.3) */}
              {isImmuneRisk && (
                <div className={styles.style410_63}>
                  <span className={styles.style411_64}>🧬</span>
                  <div className={styles.style412_65}>
                    <strong className={styles.style413_66}>{tAuto('key_934367c7')}</strong>
                    <p className={styles.style414_67}>
                      {tAuto('key_c5f40bd5')}
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          <div className={cn(styles.style423_68, isOperatorLinked ? styles.style423_69 : styles.style423_70)}>
            <div>
              <h4 className={styles.style425_71}>{tAuto('key_87e0eb00')}</h4>
              <div className={styles.style426_72}>
                <PricingInput
                  id="shortTripFare"
                  label={tAuto('key_cc656643')}
                  value={matrix.shortTripFare}
                  onChange={(val) => setMatrix((m) => ({ ...m, shortTripFare: val }))}
                  icon={<BarChart2 className={styles.style427_73} />}
                  hasError={!isOperatorLinked && ((matrix.shortTripFare || 0) < 1.0 || isBlocked)}
                />
              </div>
            </div>

            <Separator className={styles.style431_74} />

            <div>
              <h4 className={styles.style434_75}>{tAuto('key_09a247fe')}</h4>
              <div className={styles.style435_76}>
                <PricingInput
                  id="longTripKmRate"
                  label={tAuto('key_02c1325b')}
                  value={matrix.longTripKmRate}
                  onChange={(val) => setMatrix((m) => ({ ...m, longTripKmRate: val }))}
                  icon={<BarChart2 className={styles.style436_77} />}
                  hasError={!isOperatorLinked && isBlocked}
                />
                <PricingInput
                  id="minuteRate"
                  label={tAuto('key_2af82021')}
                  value={matrix.minuteRate}
                  onChange={(val) => setMatrix((m) => ({ ...m, minuteRate: val }))}
                  icon={<ShieldAlert className={styles.style437_78} />}
                  hasError={!isOperatorLinked && isBlocked}
                />
              </div>
            </div>
          </div>

          {error && (
            <div className={styles.style442_79}>
              <AlertCircle className={styles.style442_80} /> {error}
            </div>
          )}

          <div className={styles.style444_81}>
            <Button
              onClick={handleSetupSave}
              disabled={isSaving || (!isOperatorLinked && isBlocked)}
              className={cn(
                styles.style448_82,
                !isOperatorLinked && isBlocked ? styles.style450_83 : styles.style451_84,
              )}
            >
              {isSaving ? <Loader2 className={styles.style454_85} /> : tAuto('key_cd789dd0')}
            </Button>
            <Button onClick={onCancel} variant="outline" className={styles.style456_86}>
              {tAuto('key_9932cca0')}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
