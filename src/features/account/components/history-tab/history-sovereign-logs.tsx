import React, { useState, useMemo } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Activity, ShieldCheck, Trash2, Clock, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { HistorySkeleton } from './history-skeleton';
import { formatReadableDateTime } from '@/shared/utils/date-format';
import { sovereignLogsStyles as styles, type HistorySovereignLogsProps } from './sovereign/sovereign-logs-styles';
import { SovereignDiagnosticsCard } from './sovereign/sovereign-diagnostics-card';

export * from './sovereign/sovereign-logs-styles';
export * from './sovereign/sovereign-diagnostics-card';

export function HistorySovereignLogs({
  sovereignLogs,
  loading,
  clearSovereignLogs,
  hideCaptainDiagnostics = false,
  user,
  trips = [],
  isArabic = true,
  t,
}: HistorySovereignLogsProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  // Fixed item calculation: consumed & remaining hours/mins recorded at time of opening the log
  const [openedAtTime] = useState(() => {
    const d = new Date();
    const hours = d.getHours();
    const minutes = String(d.getMinutes()).padStart(2, '0');
    const period = hours >= 12 ? (isArabic ? 'م' : 'PM') : (isArabic ? 'ص' : 'AM');
    const h12 = hours % 12 || 12;
    return `${h12}:${minutes} ${period}`;
  });

  const { consumedHours, consumedMinutes, remainingHours, remainingMinutes } = useMemo(() => {
    // 1. Consumed in trips
    let totalTripMins = 0;
    if (Array.isArray(trips)) {
      for (const tr of trips) {
        const mins = Number(tr.duration_minutes ?? tr.durationMinutes);
        if (Number.isFinite(mins) && mins > 0) {
          totalTripMins += mins;
        } else if (tr.completed_at && tr.started_at) {
          const diff = Math.round((new Date(tr.completed_at).getTime() - new Date(tr.started_at).getTime()) / 60000);
          if (diff > 0) totalTripMins += diff;
        }
      }
    }
    const cH = Math.floor(totalTripMins / 60);
    const cM = totalTripMins % 60;

    // 2. Remaining in balance
    const paidMins = Number(user?.paidHoursRemaining ?? (user?.subscriptionHours ? user.subscriptionHours * 60 : 0)) || 0;
    const bonusMins = Number(user?.bonusHoursRemaining) || 0;
    const totalRemainingMins = Math.max(0, paidMins + bonusMins);
    const rH = Math.floor(totalRemainingMins / 60);
    const rM = totalRemainingMins % 60;

    return {
      consumedHours: cH,
      consumedMinutes: cM,
      remainingHours: rH,
      remainingMinutes: rM,
    };
  }, [trips, user]);

  return (
    <>
      {hideCaptainDiagnostics ? null : <SovereignDiagnosticsCard t={t} />}

      {/* Dedicated Activity & Event Logs (Collapsible Dropdown) */}
      <Card className={styles.card}>
        <div className={styles.accentBar} />
        <CardHeader
          className={cn(styles.header, styles.headerButton)}
          onClick={() => setIsExpanded((prev) => !prev)}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              setIsExpanded((prev) => !prev);
            }
          }}
          aria-expanded={isExpanded}
        >
          <div className={styles.headerRow}>
            {/* Top on Mobile: Icon + Full Title */}
            <div className={styles.headerInfo}>
              <div className={styles.iconBox}>
                <Activity className={styles.icon} />
              </div>
              <div className={styles.titleBox}>
                <CardTitle className={styles.title}>{t('eventsLogTitle')}</CardTitle>
                <CardDescription className={styles.descDesktop}>{t('eventsLogDesc')}</CardDescription>
              </div>
            </div>

            {/* Bottom on Mobile: Subtitle + Badge + Chevron */}
            <div className={styles.actionsRow}>
              <CardDescription className={styles.descMobile}>{t('eventsLogDesc')}</CardDescription>

              <div className={styles.actionsGroup}>
                <Badge variant="outline" className={styles.countBadge}>
                  {sovereignLogs.length} {t('movement')}
                </Badge>
                <div className={styles.chevronBox}>
                  <ChevronDown className={cn(styles.chevronIcon, isExpanded && styles.chevronRotated)} />
                </div>
              </div>
            </div>
          </div>
        </CardHeader>

        {isExpanded && (
          <CardContent className={styles.content}>
            {/* Item ثابت: الساعات والدقائق المستهلكة في الرحلات والمتبقية في الرصيد حتى وقت فتح السجل */}
            <div className="rounded-2xl border border-cyan-500/30 bg-gradient-to-br from-cyan-950/40 via-[#0B0F19] to-slate-900/60 p-3.5 mb-3.5 shadow-lg shadow-cyan-950/20">
              <div className="flex items-center justify-between gap-2 pb-2.5 mb-2.5 border-b border-white/5 flex-wrap">
                <div className="flex items-center gap-2">
                  <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-cyan-500/40 bg-cyan-500/15 text-xs font-bold text-[#14F5D5]">
                    <Clock className="h-3.5 w-3.5 text-[#14F5D5]" />
                    <span>{t('tripHoursSummaryTitle') || (isArabic ? 'ملخص ساعات الرحلات (ثابت)' : 'Trip Hours Summary (Fixed)')}</span>
                  </span>
                </div>
                <div className="flex items-center gap-1.5 text-[11px] font-mono text-slate-400">
                  <span>{t('openedAtLabel') || (isArabic ? 'وقت فتح السجل:' : 'Log opened at:')}</span>
                  <span className="text-white font-bold">{openedAtTime}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 sm:gap-3">
                {/* المستهلكة في الرحلات */}
                <div className="rounded-xl border border-white/5 bg-black/40 p-2.5 flex flex-col justify-between">
                  <span className="text-[11px] font-bold text-slate-400 leading-tight">
                    {t('consumedHoursLabel') || (isArabic ? 'المستهلكة في الرحلات' : 'Consumed in Trips')}
                  </span>
                  <div className="mt-1.5 flex items-baseline gap-1 font-mono">
                    <span className="text-base sm:text-lg font-black text-amber-300">
                      {consumedHours}
                    </span>
                    <span className="text-xs text-amber-300/80 font-bold">{t('hoursUnit') || (isArabic ? 'س' : 'h')}</span>
                    <span className="text-sm sm:text-base font-black text-amber-300 ml-1">
                      {consumedMinutes}
                    </span>
                    <span className="text-xs text-amber-300/80 font-bold">{t('minsUnit') || (isArabic ? 'د' : 'm')}</span>
                  </div>
                </div>

                {/* المتبقية في الرصيد */}
                <div className="rounded-xl border border-emerald-500/25 bg-emerald-950/20 p-2.5 flex flex-col justify-between">
                  <span className="text-[11px] font-bold text-emerald-300 leading-tight">
                    {t('remainingHoursLabel') || (isArabic ? 'المتبقية في الرصيد' : 'Remaining in Balance')}
                  </span>
                  <div className="mt-1.5 flex items-baseline gap-1 font-mono">
                    <span className="text-base sm:text-lg font-black text-emerald-300">
                      {remainingHours}
                    </span>
                    <span className="text-xs text-emerald-300/80 font-bold">{t('hoursUnit') || (isArabic ? 'س' : 'h')}</span>
                    <span className="text-sm sm:text-base font-black text-emerald-300 ml-1">
                      {remainingMinutes}
                    </span>
                    <span className="text-xs text-emerald-300/80 font-bold">{t('minsUnit') || (isArabic ? 'د' : 'm')}</span>
                  </div>
                </div>
              </div>
            </div>

            {sovereignLogs.length > 0 && (
              <div className="flex flex-wrap items-center justify-between gap-2 pb-3 mb-3 border-b border-white/5">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-400 font-sans font-medium">
                    {sovereignLogs.length} {t('movement')}
                  </span>
                </div>
                <Button variant="ghost" size="sm" onClick={clearSovereignLogs} className={styles.clearBtn}>
                  <Trash2 className={styles.clearBtnIcon} />
                  <span>{t('clearLog')}</span>
                </Button>
              </div>
            )}
            {loading ? (
              <HistorySkeleton />
            ) : sovereignLogs.length === 0 ? (
              <div className={styles.emptyBox}>
                <ShieldCheck className={styles.emptyIcon} />
                <p className={styles.emptyTitle}>{t('emptyLog')}</p>
                <p className={styles.emptyDesc}>{t('emptyLogDesc')}</p>
              </div>
            ) : (
              <div className={styles.logsList}>
                {sovereignLogs.map((log) => {
                  let badgeColor: string = styles.logDefault;
                  let iconEmoji = '🧭';
                  if (log.type === 'system_action') {
                    badgeColor = styles.logSystemAction;
                    iconEmoji = '🤖';
                  } else if (log.type === 'district_exit') {
                    badgeColor = styles.logDistrictExit;
                    iconEmoji = '🗺️';
                  }

                  const messageText = log.message || log.details || log.event || '';
                  const { dateText, timeText } = formatReadableDateTime(log.timestamp, true);

                  return (
                    <div key={log.id} className={styles.logCard}>
                      <div className={styles.logHeader}>
                        <span className={cn(styles.logBadge, badgeColor)}>
                          <span>{iconEmoji}</span>
                          <span>
                            {t(
                              log.type === 'status_change'
                                ? 'statusChange'
                                : log.type === 'system_action'
                                ? 'systemAction'
                                : 'boundaryCross'
                            )}
                          </span>
                        </span>
                        <div className={styles.logDateTimeBox}>
                          <Clock className={styles.logClockIcon} />
                          <span className={styles.logDateText}>{dateText}</span>
                          <span className={styles.logSeparatorDot}>•</span>
                          <span className={styles.logTimeText}>{timeText}</span>
                        </div>
                      </div>
                      {Boolean(messageText) && <p className={styles.logMessage}>{messageText}</p>}
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        )}
      </Card>
    </>
  );
}
