'use client';

import React from 'react';
import { useTranslations } from 'next-intl';
import { ShieldAlert, Unlock, Lock, Loader2, PowerOff, Power } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { styles } from './kill-switch-styles';

interface EmergencyKillSwitchCardProps {
  gate1: boolean;
  setGate1: (v: boolean) => void;
  gate2: boolean;
  setGate2: (v: boolean) => void;
  safetyCleared: boolean;
  setSafetyCleared: (v: boolean) => void;
  onSafetyToggle: () => void;
  isRadarActive: boolean | null;
  isLoadingControls: boolean;
  isTogglingKillSwitch: boolean;
  onExecuteKillSwitch: () => void;
}

export function EmergencyKillSwitchCard({
  gate1,
  setGate1,
  gate2,
  setGate2,
  safetyCleared,
  setSafetyCleared,
  onSafetyToggle,
  isRadarActive,
  isLoadingControls,
  isTogglingKillSwitch,
  onExecuteKillSwitch,
}: EmergencyKillSwitchCardProps) {
  const t = useTranslations('adminTab.killSwitch');

  return (
    <Card className={styles.style145_2}>
      <CardHeader className={styles.style146_3}>
        <CardTitle className={styles.style147_4}>
          <ShieldAlert className={styles.style148_5} />
          {t('emergency.title')}
        </CardTitle>
        <CardDescription className={styles.style151_6}>{t('emergency.description')}</CardDescription>
      </CardHeader>
      <CardContent className={styles.style155_7}>
        <div className={styles.style156_8}>
          {/* Safety Confirmation Checklist */}
          <div className={styles.style158_9}>
            <span className={styles.style159_10}>{t('emergency.safetyLabel')}</span>

            <div className={styles.style161_11}>
              <label className={cn(styles.style163_12, gate1 ? styles.style164_13 : styles.style164_14)}>
                <input
                  type="checkbox"
                  checked={gate1}
                  onChange={(e) => {
                    setGate1(e.target.checked);
                    if (!e.target.checked) setSafetyCleared(false);
                  }}
                  className={styles.style173_15}
                />
                <span>{t('emergency.gate1')}</span>
              </label>

              <label className={cn(styles.style179_16, gate2 ? styles.style180_17 : styles.style180_18)}>
                <input
                  type="checkbox"
                  checked={gate2}
                  onChange={(e) => {
                    setGate2(e.target.checked);
                    if (!e.target.checked) setSafetyCleared(false);
                  }}
                  className={styles.style189_19}
                />
                <span>{t('emergency.gate2')}</span>
              </label>
            </div>

            {/* Step 3: Unlock button */}
            <Button
              onClick={onSafetyToggle}
              disabled={!gate1 || !gate2}
              className={cn(styles.style200_20, safetyCleared ? styles.style202_21 : styles.style203_22)}
            >
              {safetyCleared ? (
                <span className={styles.style207_23}>
                  <Unlock className={styles.style208_24} />
                  {t('emergency.unlockedBtn')}
                </span>
              ) : (
                <span className={styles.style212_25}>
                  <Lock className={styles.style213_26} />
                  {t('emergency.lockBtn')}
                </span>
              )}
            </Button>
          </div>

          {/* Lethal Red Execution Button */}
          <div className={styles.style221_27}>
            <div className={styles.style222_28}>
              <span className={styles.style223_29}>{t('emergency.radarStatus')}</span>
              <div className={styles.style224_30}>
                <span className={cn(styles.style226_31, isRadarActive ? styles.style227_32 : styles.style227_33)} />
                <span className={cn(styles.style230_34, isRadarActive ? styles.style231_35 : styles.style231_36)}>
                  {isRadarActive ? t('emergency.active') : t('emergency.suspended')}
                </span>
              </div>
            </div>

            <Button
              onClick={onExecuteKillSwitch}
              disabled={isLoadingControls || isTogglingKillSwitch || !safetyCleared}
              className={cn(
                styles.style242_37,
                !safetyCleared
                  ? styles.style244_38
                  : isRadarActive
                  ? styles.style246_39
                  : styles.style247_40
              )}
            >
              {isLoadingControls ? (
                <Loader2 className={styles.style251_41} />
              ) : isRadarActive ? (
                <>
                  <PowerOff className={styles.style254_42} />
                  {t('emergency.suspendBtn')}
                </>
              ) : (
                <>
                  <Power className={styles.style259_43} />
                  {t('emergency.resumeBtn')}
                </>
              )}
            </Button>

            <span className={styles.style265_44}>{t('emergency.warning')}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
