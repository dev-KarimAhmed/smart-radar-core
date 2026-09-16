import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Clipboard, Loader2, Ruler, CheckCircle2, MapPinned, Clock, AlertCircle } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';
import { styles } from './request-modal-shared';

interface DistanceStepProps {
  pickup: string;
  setPickup: (val: string) => void;
  isResolvingUrl: boolean;
  isLocationConfirmed: boolean;
  calculateSovereignMetrics: () => void;
  resetLocationMetrics: () => void;
  estimatedDistance: number;
  estimatedTime: number;
  isBlindSpot: boolean;
}

export function DistanceStep({
  pickup,
  setPickup,
  isResolvingUrl,
  isLocationConfirmed,
  calculateSovereignMetrics,
  resetLocationMetrics,
  estimatedDistance,
  estimatedTime,
  isBlindSpot,
}: DistanceStepProps) {
  const t = useTranslations('requestRide');

  return (
    <div className={styles.style112_14}>
      <Label className={styles.style113_15}>{t('step2Title')}</Label>
      <div className={styles.style114_16}>
        <div className={styles.style115_17}>
          <div className={styles.style116_18}>
            <Input
              placeholder={t('pickupPlaceholder')}
              value={pickup}
              onChange={(e) => setPickup(e.target.value)}
              className={styles.style121_19}
              title={t('localCoordsTooltip')}
            />
            <Clipboard className={styles.style124_20} />
          </div>
        </div>

        {!isLocationConfirmed ? (
          <Button
            onClick={calculateSovereignMetrics}
            disabled={isResolvingUrl || !pickup}
            className={cn(
              styles.style135_21,
              (!pickup || isResolvingUrl) && styles.style136_22
            )}
          >
            {isResolvingUrl ? (
              <Loader2 className={styles.style140_23} />
            ) : (
              <Ruler className={styles.style142_24} />
            )}
            <span className={styles.style144_25}>{t('calculateBtn')}</span>
          </Button>
        ) : (
          <div className={styles.style149_26}>
            <div className={styles.style150_27}>
              <div className={styles.style151_28}>
                <div className={styles.style152_29}>
                  <CheckCircle2 className={styles.style153_30} />
                </div>
                <span className={styles.style155_31}>{t('calculatedLocally')}</span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setPickup('');
                  resetLocationMetrics();
                }}
                className={styles.style161_32}
              >
                {t('resetBtn')}
              </Button>
            </div>

            <div className={styles.style167_33}>
              <div className={styles.style168_34}>
                <div className={styles.style169_35}>
                  <MapPinned className={styles.style170_36} />
                </div>
                <div className={styles.style172_37}>
                  <p className={styles.style173_38}>{t('actualDistance')}</p>
                  <p className={styles.style174_39}>
                    {isBlindSpot ? (
                      <span className={styles.style176_40}>
                        <AlertCircle className={styles.style176_41} /> {t('blindSpot')}
                      </span>
                    ) : (
                      <>
                        {estimatedDistance.toFixed(2)}
                        <span className={styles.style180_42}>{t('km')}</span>
                      </>
                    )}
                  </p>
                </div>
              </div>
              <div className={styles.style186_43}>
                <div className={styles.style187_44}>
                  <Clock className={styles.style188_45} />
                </div>
                <div className={styles.style190_46}>
                  <p className={styles.style191_47}>{t('estimatedTime')}</p>
                  <p className={styles.style192_48}>
                    {estimatedTime > 0 ? `~${estimatedTime}` : '--'}
                    <span className={styles.style194_49}>{t('min')}</span>
                  </p>
                </div>
              </div>
            </div>

            {!isBlindSpot && estimatedDistance > 0 && (
              <div className={styles.style201_50}>
                <div className={styles.style202_51}>
                  <span className={styles.style203_52}>{t('formulaTitle')}</span>
                  <span className={styles.style206_53}>SSOT Engine</span>
                </div>
                <div className={styles.style208_54}>
                  <div className={styles.style209_55}>
                    <span>{t('haversine')}</span>
                    <span>
                      {(estimatedDistance / 1.35).toFixed(2)} {t('km')}
                    </span>
                  </div>
                  <div className={styles.style213_56}>
                    <span>{t('tortuosity')}</span>
                    <span className={styles.style215_57}>× 1.35</span>
                  </div>
                  <div className={styles.style217_58}>
                    <span className={styles.style218_59}>{t('approvedDistance')}</span>
                    <span className={styles.style219_60}>
                      {estimatedDistance.toFixed(2)} {t('km')}
                    </span>
                  </div>
                  <div className={styles.style221_61}>
                    <span>{t('timeCalc')}</span>
                    <span className={styles.style223_62}>
                      ~{estimatedTime} {t('min')}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {isBlindSpot && (
              <div className={styles.style230_63}>
                <p className={styles.style231_64}>{t('blindSpotWarning')}</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
