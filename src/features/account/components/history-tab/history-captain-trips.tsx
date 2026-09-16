import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, FileText } from 'lucide-react';
import { styles, formatHistoryMoney } from './history-shared';
import { HistorySkeleton } from './history-skeleton';
import { useTranslations } from "next-intl";

interface HistoryCaptainTripsProps {
  captainHistoricalTrips: any[];
  loading: boolean;
  currencyLabel: string;
  isArabic: boolean;
  now: number;
  t: any;
}

export function HistoryCaptainTrips({
  captainHistoricalTrips,
  loading,
  currencyLabel,
  isArabic,
  now,
  t
}: HistoryCaptainTripsProps) {
  const tAuto = useTranslations('auto');
  return (
    <div className={styles.style1158_112}>
      <Card className={styles.style1159_113}>
        <CardHeader className={styles.style1160_114}>
          <div>
            <CardTitle className={styles.style1162_115}>
              <FileText className={styles.style1163_116} />
              {t('captainSectionTitle')}
            </CardTitle>
            <CardDescription className={styles.style1166_117}>
              {t('captainSectionDesc')}
            </CardDescription>
          </div>
          <Badge variant="outline" className={styles.style1170_118}>
            {captainHistoricalTrips.length} {isArabic ? tAuto('key_8238548e') : 'tasks'}
          </Badge>
        </CardHeader>

        <CardContent className={styles.style1175_119}>
          {loading ? (
            <HistorySkeleton />
          ) : captainHistoricalTrips.length === 0 ? (
            <div className={styles.style1179_120}>
              <AlertCircle className={styles.style1180_121} />
              <p className={styles.style1181_122}>
                {isArabic ? tAuto('key_407660f1') : "No completed field tasks recorded for this area currently."}
              </p>
            </div>
          ) : (
            captainHistoricalTrips.map((trip) => {
              const timeAgo = Math.floor((now - trip.timestamp) / (1000 * 60 * 60));

              return (
                <div key={trip.tripId} className={styles.style1190_123}>
                  <div className={styles.style1192_124}>
                    <div>
                      <h4 className={styles.style1194_125}>
                        👤 {isArabic ? tAuto('key_5620a395') : 'Rider'}: {trip.riderName}
                      </h4>
                      <p className={styles.style1197_126}>
                        {isArabic ? tAuto('key_99fb92ed') : 'From'}: {trip.pickup} ➔ {isArabic ? tAuto('key_0985d27c') : 'To'}: {trip.dropoff}
                      </p>
                      {trip.serialId && (
                        <div className={styles.style1201_127}>
                          <span className={styles.style1202_128}>
                            🧬 {trip.serialId}
                          </span>
                        </div>
                      )}
                    </div>
                    <div className={styles.style1208_129}>
                      <span className={styles.style1209_130}>
                        +{formatHistoryMoney(trip.earnedPrice, currencyLabel)}
                      </span>
                      <span className={styles.style1212_131}>
                        {isArabic ? tAuto('key_cf811897') : ''} {timeAgo} {t('hours')} {isArabic ? '' : 'ago'}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </CardContent>
      </Card>
    </div>
  );
}
