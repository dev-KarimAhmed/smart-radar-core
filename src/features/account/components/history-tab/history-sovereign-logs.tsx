import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Activity, ShieldCheck, Trash2, Clock, Lock, Sliders, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { HistorySkeleton } from './history-skeleton';

const styles = {
  container: "space-y-6",
  card: "relative overflow-hidden rounded-3xl border border-[#14B8A6]/20 bg-[#0B0F19]/90 shadow-2xl backdrop-blur-xl w-full text-white",
  accentBar: "absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#14F5D5]/50 to-transparent",
  header: "p-5 pb-3",
  headerButton: "w-full text-right cursor-pointer select-none transition-colors hover:bg-white/[0.02]",
  headerRow: "flex items-center justify-between gap-3",
  headerInfo: "flex items-center gap-3 min-w-0",
  iconBox: "flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-[#14B8A6]/30 bg-[#14B8A6]/10 text-[#14F5D5] shadow-[0_0_15px_rgba(20,245,213,0.15)]",
  icon: "h-5 w-5",
  titleBox: "min-w-0",
  title: "text-base font-black text-white flex items-center gap-2 font-sans",
  desc: "text-xs text-slate-400 mt-0.5 leading-relaxed truncate font-sans",
  actionsBox: "flex items-center gap-2",
  clearBtn: "h-8 text-[11px] text-rose-400 hover:bg-rose-950/20 hover:text-rose-300 gap-1 rounded-xl",
  clearBtnIcon: "h-3.5 w-3.5",
  countBadge: "shrink-0 rounded-full border border-[#14B8A6]/30 bg-[#14B8A6]/10 px-3 py-1 text-xs font-bold text-[#14F5D5] shadow-sm font-mono",
  chevronBox: "flex h-8 w-8 items-center justify-center rounded-xl border border-[#14B8A6]/20 bg-[#14B8A6]/10 text-[#14F5D5] transition-all hover:bg-[#14B8A6]/20 shrink-0",
  chevronIcon: "h-4 w-4 transition-transform duration-200",
  chevronRotated: "rotate-180",
  content: "p-5 pt-2",
  emptyBox: "rounded-2xl border border-dashed border-white/10 bg-black/20 p-6 text-center flex flex-col items-center justify-center gap-2.5 my-2",
  emptyIcon: "h-8 w-8 text-slate-500",
  emptyTitle: "text-xs font-semibold text-slate-400",
  emptyDesc: "text-[11px] text-slate-500 leading-normal max-w-sm",
  logsList: "space-y-3 max-h-[400px] overflow-y-auto pr-1",
  logCard: "group relative rounded-2xl border border-white/10 bg-gradient-to-b from-white/[0.04] to-transparent hover:border-[#14B8A6]/30 p-3.5 transition-all space-y-2 text-right",
  logHeader: "flex items-center justify-between gap-2",
  logBadge: "text-[10px] font-bold px-2.5 py-0.5 rounded-md border inline-flex items-center gap-1 font-sans",
  logDateTimeBox: "flex items-center gap-1.5 text-xs text-slate-300 font-medium font-sans",
  logClockIcon: "h-3 w-3 text-[#14F5D5] shrink-0",
  logDateText: "font-semibold text-slate-200",
  logSeparatorDot: "text-slate-500",
  logTimeText: "font-mono text-slate-300",
  logMessage: "text-xs sm:text-sm text-slate-200 font-normal leading-relaxed pt-0.5 font-sans",
  logStatusChange: "border-teal-500/30 bg-teal-950/40 text-[#14F5D5]",
  logSystemAction: "border-cyan-500/30 bg-cyan-950/40 text-cyan-300",
  logDistrictExit: "border-amber-500/30 bg-amber-950/40 text-amber-300",
  logDefault: "border-teal-500/30 bg-teal-950/40 text-teal-300",
  diagContentBox: "p-4 bg-teal-950/10 border border-teal-500/10 rounded-xl space-y-3",
  diagItem: "flex items-start gap-3",
  diagIconBox: "p-2 bg-teal-950/40 rounded-lg text-[#14F5D5] shrink-0 mt-0.5 border border-[#14B8A6]/20",
  diagIcon: "h-4 w-4",
  diagTextBox: "space-y-1",
  diagItemTitle: "text-xs font-bold text-white",
  diagItemDesc: "text-[11px] text-slate-400 leading-relaxed",
  diagBorderTop: "flex items-start gap-3 pt-3 border-t border-white/5",
  diagStatusBox: "flex items-center justify-between p-3 bg-black/40 border border-[#14B8A6]/20 rounded-lg",
  diagStatusInner: "flex items-center gap-2",
  diagStatusDot: "h-2 w-2 rounded-full bg-[#14F5D5] animate-ping",
  diagStatusLabel: "text-[10px] text-slate-400 font-sans",
  diagStatusValue: "text-[10px] text-[#14F5D5] font-black font-mono",
  diagStatusDecree: "text-[9px] text-slate-500 font-sans",
};

interface HistorySovereignLogsProps {
  sovereignLogs: any[];
  loading: boolean;
  clearSovereignLogs: () => void;
  hideCaptainDiagnostics?: boolean;
  t: any;
}

export function HistorySovereignLogs({
  sovereignLogs,
  loading,
  clearSovereignLogs,
  hideCaptainDiagnostics = false,
  t
}: HistorySovereignLogsProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <>
      {hideCaptainDiagnostics ? null : (
        <Card className={styles.card}>
          <div className={styles.accentBar} />
          <CardHeader className={styles.header}>
            <div className={styles.headerRow}>
              <div>
                <CardTitle className={styles.title}>
                  <ShieldCheck className={styles.icon} />
                  {t('antiChatTitle')}
                </CardTitle>
                <CardDescription className={styles.desc}>
                  {t('antiChatDesc')}
                </CardDescription>
              </div>
              <Badge variant="outline" className={styles.countBadge}>
                SECURE-V2.6
              </Badge>
            </div>
          </CardHeader>
          <CardContent className={styles.content}>
            <div className={styles.diagContentBox}>
              <div className={styles.diagItem}>
                <div className={styles.diagIconBox}>
                  <Lock className={styles.diagIcon} />
                </div>
                <div className={styles.diagTextBox}>
                  <h5 className={styles.diagItemTitle}>{t('zeroChatTitle')}</h5>
                  <p className={styles.diagItemDesc}>{t('zeroChatDesc')}</p>
                </div>
              </div>

              <div className={styles.diagBorderTop}>
                <div className={styles.diagIconBox}>
                  <Activity className={styles.diagIcon} />
                </div>
                <div className={styles.diagTextBox}>
                  <h5 className={styles.diagItemTitle}>{t('financialActivityTitle')}</h5>
                  <p className={styles.diagItemDesc}>{t('financialActivityDesc')}</p>
                </div>
              </div>

              <div className={styles.diagBorderTop}>
                <div className={styles.diagIconBox}>
                  <Sliders className={styles.diagIcon} />
                </div>
                <div className={styles.diagTextBox}>
                  <h5 className={styles.diagItemTitle}>{t('autoPurgeTitle')}</h5>
                  <p className={styles.diagItemDesc}>{t('autoPurgeDesc')}</p>
                </div>
              </div>
            </div>

            <div className={styles.diagStatusBox}>
              <div className={styles.diagStatusInner}>
                <div className={styles.diagStatusDot} />
                <span className={styles.diagStatusLabel}>{t('purityStatus')}</span>
                <span className={styles.diagStatusValue}>100% PURE & SECURE</span>
              </div>
              <span className={styles.diagStatusDecree}>{t('certifiedDecree')}</span>
            </div>
          </CardContent>
        </Card>
      )}

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
            <div className={styles.headerInfo}>
              <div className={styles.iconBox}>
                <Activity className={styles.icon} />
              </div>
              <div className={styles.titleBox}>
                <CardTitle className={styles.title}>
                  {t('eventsLogTitle')}
                </CardTitle>
                <CardDescription className={styles.desc}>
                  {t('eventsLogDesc')}
                </CardDescription>
              </div>
            </div>
            <div className={styles.actionsBox}>
              {sovereignLogs.length > 0 && isExpanded && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    clearSovereignLogs();
                  }}
                  className={styles.clearBtn}
                >
                  <Trash2 className={styles.clearBtnIcon} />
                  {t('clearLog')}
                </Button>
              )}
              <Badge variant="outline" className={styles.countBadge}>
                {sovereignLogs.length} {t('movement')}
              </Badge>
              <div className={styles.chevronBox}>
                <ChevronDown className={cn(styles.chevronIcon, isExpanded && styles.chevronRotated)} />
              </div>
            </div>
          </div>
        </CardHeader>

        {isExpanded && (
          <CardContent className={styles.content}>
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
                let badgeColor = styles.logDefault;
                let iconEmoji = "🧭";
                if (log.type === 'system_action') {
                  badgeColor = styles.logSystemAction;
                  iconEmoji = "🤖";
                } else if (log.type === 'district_exit') {
                  badgeColor = styles.logDistrictExit;
                  iconEmoji = "🗺️";
                }

                const messageText = log.message || log.details || log.event || '';
                const logDate = new Date(log.timestamp);
                const formattedDate = logDate.toLocaleDateString('ar-EG', {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric'
                });
                const formattedTime = logDate.toLocaleTimeString('ar-EG', {
                  hour: '2-digit',
                  minute: '2-digit'
                });

                return (
                  <div key={log.id} className={styles.logCard}>
                    <div className={styles.logHeader}>
                      <span className={cn(styles.logBadge, badgeColor)}>
                        <span>{iconEmoji}</span>
                        <span>{t(log.type === 'status_change' ? 'statusChange' : log.type === 'system_action' ? 'systemAction' : 'boundaryCross')}</span>
                      </span>
                      <div className={styles.logDateTimeBox}>
                        <Clock className={styles.logClockIcon} />
                        <span className={styles.logDateText}>{formattedDate}</span>
                        <span className={styles.logSeparatorDot}>•</span>
                        <span className={styles.logTimeText}>{formattedTime}</span>
                      </div>
                    </div>
                    {Boolean(messageText) && (
                      <p className={styles.logMessage}>
                        {messageText}
                      </p>
                    )}
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
