import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, FileText, User } from 'lucide-react';
import { styles, formatHistoryMoney } from './history-shared';
import { HistorySkeleton } from './history-skeleton';

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
  const activeCurrency = currencyLabel || (isArabic ? 'د.أ' : 'JOD');

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
            {captainHistoricalTrips.length} {isArabic ? t('tripCount') : 'trips'}
          </Badge>
        </CardHeader>

        <CardContent className={styles.style1175_119}>
          {loading ? (
            <HistorySkeleton />
          ) : captainHistoricalTrips.length === 0 ? (
            <div className={styles.style1179_120}>
              <AlertCircle className={styles.style1180_121} />
              <p className={styles.style1181_122}>
                {isArabic ? "لا توجد رحلات مكتملة مسجلة حالياً." : "No completed field tasks recorded for this area currently."}
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
                        <User className="h-3.5 w-3.5 text-[#00ffcc]" />
                        <span>{isArabic ? 'الراكب' : 'Rider'}: {trip.riderName}</span>
                      </h4>
                      <p className={styles.style1197_126}>
                        {isArabic ? 'من' : 'From'}: {trip.pickup} ➔ {isArabic ? 'إلى' : 'To'}: {trip.dropoff}
                      </p>
                      {trip.serialId && (
                        <div className={styles.style1201_127}>
                          <span className={styles.style1202_128}>
                            #{trip.serialId}
                          </span>
                        </div>
                      )}
                    </div>
                    <div className={styles.style1208_129}>
                      <span className={styles.style1209_130}>
                        +{formatHistoryMoney(trip.earnedPrice, activeCurrency)}
                      </span>
                      <span className={styles.style1212_131}>
                        {isArabic ? t('before') : ''} {timeAgo === 0 ? t('lessThanHour') : `${timeAgo} ${t('hours')}`} {isArabic ? '' : t('ago')}
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
