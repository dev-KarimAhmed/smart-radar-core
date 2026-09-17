import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Languages, MapPin, ShieldCheck, User } from 'lucide-react';
import { styles } from './profile-shared';

interface ProfileHeaderCardProps {
  isArabic: boolean;
  t: any;
  toggleLanguage: () => void;
  displayName: string;
  displayRole: string;
  serialId?: string | null;
  rating: number;
  locationLabel: string;
  displayPhone: string;
  currency?: string | null;
}

export function ProfileHeaderCard({
  isArabic,
  t,
  toggleLanguage,
  displayName,
  displayRole,
  serialId,
  rating,
  locationLabel,
  displayPhone,
  currency,
}: ProfileHeaderCardProps) {
  return (
    <>
      <Card className={styles.style559_5}>
        <CardContent className={styles.style560_6}>
          <div className={styles.style561_7}>
            <p className={styles.style562_8}>{t('languageTitle')}</p>
            <p className={styles.style563_9}>{t('languageDescription')}</p>
          </div>
          <Button
            type="button"
            onClick={toggleLanguage}
            className={styles.style568_10}
          >
            <Languages className={styles.style570_11} />
            {isArabic ? t('switchToEnglish') : t('switchToArabic')}
          </Button>
        </CardContent>
      </Card>

      <Card className={styles.style576_12}>
        <div className={styles.style577_13} />
        <CardContent className={styles.style578_14}>
          <div className={styles.style579_15}>
            <div className={styles.style580_16}>
              <div className={styles.style581_17}>
                {displayName ? displayName.substring(0, 1).toUpperCase() : <User className={styles.style582_18} />}
              </div>
              <div>
                <h2 className={styles.style585_19}>{displayName}</h2>
                <div className={styles.style586_20}>
                  <Badge variant="outline" className={styles.style587_21}>
                    {displayRole}
                  </Badge>
                  {serialId ? (
                    <Badge variant="outline" className={styles.style591_22}>
                      {t('accountNumber')}: {String(serialId)}
                    </Badge>
                  ) : null}
                </div>
              </div>
            </div>

            <div className={styles.style599_23}>
              <span className={styles.style600_24}>{t('currentRating')}</span>
              <div className={styles.style601_25}>
                <span className={styles.style602_26}>{rating.toFixed(1)}</span>
                <span className={styles.style603_27}> / 5</span>
              </div>
            </div>
          </div>

          <div className={styles.style608_28}>
            <div className={styles.style609_29}>
              <span className={styles.style610_30}>
                <MapPin className={styles.style611_31} />
                {t('location')}
              </span>
              <strong className={styles.style614_32}>{locationLabel}</strong>
            </div>

            <div className={styles.style619_33}>
              <span className={styles.style620_34}>
                <ShieldCheck className={styles.style621_35} />
                {t('accountData')}
              </span>
              <strong className={styles.style624_36}>{displayPhone || t('phoneUnavailable')}</strong>
              {currency ? <span className={styles.style625_37}>{t('currency')}: {currency}</span> : null}
            </div>
          </div>
        </CardContent>
      </Card>
    </>
  );
}
