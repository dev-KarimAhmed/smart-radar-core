import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, FileText, User, MapPin, Clock } from 'lucide-react';
import { formatHistoryMoney } from './history-shared';
import { HistorySkeleton } from './history-skeleton';

const styles = {
  container: "space-y-6",
  card: "relative overflow-hidden rounded-3xl border border-[#14B8A6]/20 bg-[#0B0F19]/90 shadow-2xl backdrop-blur-xl w-full text-white",
  accentBar: "absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#14F5D5]/50 to-transparent",
  header: "p-5 pb-3",
  headerRow: "flex items-center justify-between gap-3",
  headerInfo: "flex items-center gap-3 min-w-0",
  iconBox: "flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-[#14B8A6]/30 bg-[#14B8A6]/10 text-[#14F5D5] shadow-[0_0_15px_rgba(20,245,213,0.15)]",
  icon: "h-5 w-5",
  titleBox: "min-w-0",
  title: "text-base font-black text-white flex items-center gap-2 font-sans",
  desc: "text-xs text-slate-400 mt-0.5 leading-relaxed truncate font-sans",
  countBadge: "shrink-0 rounded-full border border-[#14B8A6]/30 bg-[#14B8A6]/10 px-3 py-1 text-xs font-bold text-[#14F5D5] shadow-sm font-mono",
  content: "p-5 pt-2",
  emptyBox: "rounded-2xl border border-dashed border-white/10 bg-black/20 p-6 text-center flex flex-col items-center justify-center gap-2.5 my-2",
  emptyIcon: "h-8 w-8 text-slate-500",
  emptyText: "text-xs font-semibold text-slate-400",
  tripsList: "space-y-3",
  tripCard: "group relative rounded-2xl border border-white/10 bg-gradient-to-b from-white/[0.04] to-transparent hover:border-[#14B8A6]/40 p-4 transition-all duration-200 shadow-sm space-y-3",
  tripTopRow: "flex items-start justify-between gap-3",
  riderBox: "flex items-center gap-2.5 min-w-0",
  riderAvatar: "h-9 w-9 rounded-xl border border-[#14B8A6]/30 bg-[#14B8A6]/10 flex items-center justify-center text-[#14F5D5] shrink-0",
  riderAvatarIcon: "h-4 w-4",
  riderNameContainer: "min-w-0 space-y-0.5",
  riderLabel: "text-[11px] text-slate-400 font-medium block",
  riderName: "font-black text-white text-sm truncate block",
  priceBox: "text-left shrink-0",
  priceText: "text-base font-black text-[#14F5D5] font-mono block",
  routeBox: "flex items-center gap-2 text-xs bg-black/40 border border-white/5 rounded-xl p-2.5",
  routePin: "h-3.5 w-3.5 text-[#14F5D5] shrink-0",
  routeText: "flex items-center gap-1.5 flex-wrap font-sans min-w-0",
  routeLabel: "text-slate-400 font-medium",
  routeValue: "font-semibold text-slate-200 truncate",
  routeArrow: "text-[#14F5D5] font-black px-1",
  tripBottomRow: "flex items-center justify-between pt-2 border-t border-white/5 text-xs text-slate-300 gap-2 flex-wrap",
  dateTimeBox: "flex items-center gap-1.5 text-slate-300 font-sans text-xs flex-wrap",
  clockIcon: "h-3.5 w-3.5 text-[#14F5D5] shrink-0",
  dateValue: "font-semibold text-slate-200",
  separatorDot: "text-slate-500",
  timeValue: "font-mono font-medium text-slate-200",
  timeAgoBadge: "text-[10px] text-[#14F5D5] bg-[#14B8A6]/15 px-2 py-0.5 rounded-md border border-[#14B8A6]/25 font-sans font-medium",
  serialBadge: "inline-flex items-center gap-1 font-mono text-[11px] font-bold text-[#14F5D5] bg-[#14B8A6]/15 border border-[#14B8A6]/30 px-2 py-0.5 rounded-lg",
};

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
    <div className={styles.container}>
      <Card className={styles.card}>
        <div className={styles.accentBar} />
        <CardHeader className={styles.header}>
          <div className={styles.headerRow}>
            <div className={styles.headerInfo}>
              <div className={styles.iconBox}>
                <FileText className={styles.icon} />
              </div>
              <div className={styles.titleBox}>
                <CardTitle className={styles.title}>
                  {t('captainSectionTitle')}
                </CardTitle>
                <CardDescription className={styles.desc}>
                  {t('captainSectionDesc')}
                </CardDescription>
              </div>
            </div>

            <Badge variant="outline" className={styles.countBadge}>
              {captainHistoricalTrips.length} {isArabic ? t('tripCount') : 'trips'}
            </Badge>
          </div>
        </CardHeader>

        <CardContent className={styles.content}>
          {loading ? (
            <HistorySkeleton />
          ) : captainHistoricalTrips.length === 0 ? (
            <div className={styles.emptyBox}>
              <AlertCircle className={styles.emptyIcon} />
              <p className={styles.emptyText}>
                {isArabic ? "لا توجد رحلات مكتملة مسجلة حالياً." : "No completed field tasks recorded for this area currently."}
              </p>
            </div>
          ) : (
            <div className={styles.tripsList}>
              {captainHistoricalTrips.map((trip) => {
                const timeAgo = Math.floor((now - trip.timestamp) / (1000 * 60 * 60));
                const tripDate = new Date(trip.timestamp);
                const formattedDate = tripDate.toLocaleDateString(isArabic ? 'ar-EG' : 'en-US', {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric'
                });
                const formattedTime = tripDate.toLocaleTimeString(isArabic ? 'ar-EG' : 'en-US', {
                  hour: '2-digit',
                  minute: '2-digit'
                });

                return (
                  <div key={trip.tripId} className={styles.tripCard}>
                    {/* Top Row: Rider Info & Earned Price */}
                    <div className={styles.tripTopRow}>
                      <div className={styles.riderBox}>
                        <div className={styles.riderAvatar}>
                          <User className={styles.riderAvatarIcon} />
                        </div>
                        <div className={styles.riderNameContainer}>
                          <span className={styles.riderLabel}>{isArabic ? 'الراكب' : 'Rider'}</span>
                          <h4 className={styles.riderName} dir="auto">{trip.riderName}</h4>
                        </div>
                      </div>

                      <div className={styles.priceBox}>
                        <span className={styles.priceText}>
                          +{formatHistoryMoney(trip.earnedPrice, activeCurrency)}
                        </span>
                      </div>
                    </div>

                    {/* Middle Row: Route Details */}
                    <div className={styles.routeBox}>
                      <MapPin className={styles.routePin} />
                      <div className={styles.routeText}>
                        <span className={styles.routeLabel}>{isArabic ? 'من:' : 'From:'}</span>
                        <span className={styles.routeValue}>{trip.pickup}</span>
                        <span className={styles.routeArrow}>➔</span>
                        <span className={styles.routeLabel}>{isArabic ? 'إلى:' : 'To:'}</span>
                        <span className={styles.routeValue}>{trip.dropoff}</span>
                      </div>
                    </div>

                    {/* Bottom Row: Clear Date, Time, Relative Age & Serial ID */}
                    <div className={styles.tripBottomRow}>
                      <div className={styles.dateTimeBox}>
                        <Clock className={styles.clockIcon} />
                        <span className={styles.dateValue}>{formattedDate}</span>
                        <span className={styles.separatorDot}>•</span>
                        <span className={styles.timeValue}>{formattedTime}</span>
                        <span className={styles.timeAgoBadge}>
                          {isArabic ? t('before') : ''} {timeAgo === 0 ? t('lessThanHour') : `${timeAgo} ${t('hours')}`} {isArabic ? '' : t('ago')}
                        </span>
                      </div>

                      {trip.serialId && (
                        <div>
                          <span dir="ltr" className={styles.serialBadge}>
                            #{trip.serialId}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
