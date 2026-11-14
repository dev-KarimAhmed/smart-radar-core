import React, { useState } from 'react';
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
  t,
}: HistorySovereignLogsProps) {
  const [isExpanded, setIsExpanded] = useState(false);

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
