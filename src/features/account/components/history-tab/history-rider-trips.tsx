import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AlertCircle, FileText, Heart, Phone } from 'lucide-react';
import { cn } from '@/lib/utils';
import { styles, formatHistoryMoney, type HistoricalTrip } from './history-shared';
import { HistorySkeleton } from './history-skeleton';

interface HistoryRiderTripsProps {
  riderHistoricalTrips: HistoricalTrip[];
  loading: boolean;
  favoriteCaptainIds: Set<string>;
  toggleFavorite: (trip: HistoricalTrip) => void;
  currencyLabel: string;
  isArabic: boolean;
  now: number;
  tripReviews: Record<string, any>;
  t: any;
}


export function HistoryRiderTrips({
  riderHistoricalTrips,
  loading,
  favoriteCaptainIds,
  toggleFavorite,
  currencyLabel,
  isArabic,
  now,
  tripReviews,
  t
}: HistoryRiderTripsProps) {

  const renderDetailedReview = (tripId: string) => {
    const review = tripReviews[tripId];
    if (!review) return null;

    const stars = review.detailed_stars || {};
    const captainObj = stars.captain || {};

    const activeCaptain = Object.keys(captainObj).filter(k => Number(captainObj[k]) === 1);

    if (activeCaptain.length === 0 && !review.comment) {
      return null;
    }



    return (
      <div className={styles.style830_10}>
        <div className={styles.style831_11}>
          <span>{t('detailedFeedback')}</span>
        </div>
        
        {activeCaptain.length > 0 && (
          <div className={styles.style837_13}>
            {activeCaptain.map(k => (
              <span key={k} className={styles.style839_14}>
                👤 {t(`captainCriteria.${k}`)}
              </span>
            ))}
          </div>
        )}

        {review.comment && (
          <p className={styles.style847_15}>
            &ldquo;{review.comment}&rdquo;
          </p>
        )}
      </div>
    );
  };

  return (
    <div className={styles.style1002_63}>
      <Card className={styles.style1003_64}>
        <CardHeader className={styles.style1004_65}>
          <div>
            <CardTitle className={styles.style1006_66}>
              <FileText className={styles.style1007_67} />
              {t('recentTripsTitle')}
            </CardTitle>
            <CardDescription className={styles.style1010_68}>
              {t('recentTripsDesc')}
            </CardDescription>
          </div>
          <Badge variant="outline" className={styles.style1014_69}>
            {riderHistoricalTrips.length} {t('tripCount')}
          </Badge>
        </CardHeader>

        <CardContent className={styles.style1019_70}>
          {loading ? (
            <HistorySkeleton />
          ) : riderHistoricalTrips.length === 0 ? (
            <div className={styles.style1023_71}>
              <AlertCircle className={styles.style1024_72} />
              <p className={styles.style1025_73}>{t('noTrips')}</p>
            </div>
          ) : (
            riderHistoricalTrips.map((trip) => {
              const isHearted = favoriteCaptainIds.has(String(trip.captainId));
              const timeAgo = Math.floor((now - trip.timestamp) / (1000 * 60 * 60));

              return (
                <div key={trip.tripId} className={styles.style1035_74}>
                  {/* Heart action */}
                  <button
                    onClick={() => toggleFavorite(trip)}
                    className={styles.style1040_75}
                  >
                    <Heart className={cn(styles.style1042_76, isHearted ? styles.style1042_77 : styles.style1042_78)} />
                  </button>

                  <div className={styles.style1045_79}>
                    <div>
                      <h4 className={styles.style1047_80}>
                        🚗 {trip.captainName}
                        <span className={styles.style1049_81}>
                          [{trip.captainRank}]
                        </span>
                      </h4>
                      <p className={styles.style1053_82}>{trip.vehicleInfo}</p>
                      {trip.serialId && (
                        <div className={styles.style1055_83}>
                          <span className={styles.style1056_84}>
                            🧬 {trip.serialId}
                          </span>
                        </div>
                      )}
                    </div>
                    <div className={styles.style1062_85}>
                      <span className={styles.style1063_86}>
                        {formatHistoryMoney(trip.finalPrice, currencyLabel)}
                      </span>
                      <span className={styles.style1066_87}>
                        {isArabic ? t('before') : ''} {timeAgo === 0 ? t('lessThanHour') : `${timeAgo} ${t('hours')}`} {isArabic ? '' : t('ago')}
                      </span>
                    </div>
                  </div>

                  {renderDetailedReview(trip.tripId)}

                  <div className={styles.style1074_88}>
                    <a
                      href={`tel:${trip.captainPhone}`}
                      className={styles.style1077_89}
                      style={{ textDecoration: 'none' }}
                    >
                      <Phone className={styles.style1080_90} />
                      <span>{t('callCaptain')}</span>
                    </a>
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
