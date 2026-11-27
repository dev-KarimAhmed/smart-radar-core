'use client';

import { useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { Clock, LogOut, Users } from 'lucide-react';
import { useWhatsAppGroupLeaderMinutes } from '../hooks/use-whatsapp-group-leader-minutes';
import { WhatsAppGroupErrorBoundary } from './whatsapp-group-error-boundary';

export interface HistoryGroupMinutesRowProps {
  isCaptain: boolean;
  userId?: string | null;
}

const styles = {
  container:
    'relative overflow-hidden rounded-2xl border border-[#14B8A6]/25 bg-[#0B0F19]/90 px-4 py-3.5 shadow-lg backdrop-blur-xl text-white space-y-3',
  topGlow:
    'absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#14F5D5]/50 to-transparent',
  headerRow: 'flex items-center justify-between gap-3',
  labelGroup: 'flex items-center gap-2.5 min-w-0',
  iconWrap:
    'flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-teal-500/30 bg-teal-500/10 text-[#14F5D5]',
  icon: 'h-4 w-4',
  titleWrap: 'min-w-0',
  label: 'text-sm font-black text-white truncate',
  periodText: 'text-xs font-medium text-slate-400 tabular-nums',
  metricsGrid: 'grid grid-cols-1 sm:grid-cols-2 gap-2',
  linksStack: 'space-y-2.5',
  linkCard: 'rounded-xl border border-slate-800/80 bg-slate-900/50 p-2.5 space-y-2',
  linkHeader: 'flex items-center justify-between gap-2',
  linkTitle: 'text-xs font-bold text-white truncate',
  linkCode: 'shrink-0 font-mono text-[11px] font-semibold text-teal-300',
  metricBox:
    'flex items-center justify-between gap-2 rounded-xl border border-slate-800/80 bg-slate-900/70 px-3 py-2',
  metricLabel: 'text-xs font-semibold text-slate-300',
  metricValue: 'shrink-0 text-sm font-black tabular-nums text-[#14F5D5]',
  totalValue: 'shrink-0 text-sm font-black tabular-nums text-emerald-400',
  divider: 'border-t border-slate-800/80 pt-3',
  membershipRow: 'flex flex-wrap items-center justify-between gap-2.5',
  membershipMeta: 'flex items-center gap-2 min-w-0',
  membershipIconWrap:
    'flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-teal-500/25 bg-teal-500/10 text-teal-300',
  membershipLabel: 'text-xs font-semibold text-slate-400',
  membershipName: 'text-sm font-bold text-white truncate',
  leaveBtn:
    'inline-flex items-center gap-1.5 rounded-xl border border-teal-500/35 bg-slate-900/90 px-3 py-1.5 text-xs font-bold text-slate-200 transition hover:border-teal-400/60 hover:text-white disabled:opacity-50',
  confirmBox:
    'mt-2.5 rounded-xl border border-teal-500/30 bg-slate-900/80 p-3 space-y-2.5',
  confirmHint: 'text-xs text-slate-300 leading-relaxed',
  confirmActions: 'flex flex-wrap items-center gap-2',
  confirmBtn:
    'rounded-xl bg-[#14B8A6] px-3 py-1.5 text-xs font-black text-slate-950 transition hover:bg-[#14F5D5] disabled:opacity-50',
  cancelBtn:
    'rounded-xl border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs font-bold text-slate-200 transition hover:border-slate-500 disabled:opacity-50',
  noticeText: 'text-xs font-semibold text-emerald-400',
  errorText: 'text-xs font-semibold text-teal-300',
} as const;

function HistoryGroupMinutesRowInner({ isCaptain, userId }: HistoryGroupMinutesRowProps) {
  const t = useTranslations('whatsappGroupHistory');
  const durationLabels = useMemo(
    () => ({
      hoursUnit: t('hoursUnit'),
      minutesUnit: t('minutesUnit'),
      secondsUnit: t('secondsUnit'),
    }),
    [t],
  );

  const {
    data,
    membership,
    leaderLinks,
    currentMonthFormatted,
    totalQualifiedFormatted,
    confirmingLeave,
    isLeaving,
    leaveError,
    leftGroupNotice,
    requestLeave,
    cancelLeave,
    confirmLeave,
  } = useWhatsAppGroupLeaderMinutes(isCaptain, userId, durationLabels);

  const showLeaderMinutes = Boolean(isCaptain && data?.isGroupLeader);
  const showMembership = Boolean(membership);

  if (!showLeaderMinutes && !showMembership && !leftGroupNotice) {
    return null;
  }

  return (
    <div className={styles.container} data-testid="whatsapp-group-history-minutes">
      <div className={styles.topGlow} />

      {showLeaderMinutes && data && (
        <>
          <div className={styles.headerRow}>
            <div className={styles.labelGroup}>
              <div className={styles.iconWrap}>
                <Clock className={styles.icon} />
              </div>
              <div className={styles.titleWrap}>
                <p className={styles.label}>{t('label')}</p>
                <p className={styles.periodText}>{t('periodLabel', { period: data.periodMonth })}</p>
              </div>
            </div>
          </div>

          {leaderLinks.length > 0 ? (
            <div className={styles.linksStack} data-testid="whatsapp-group-leader-links">
              {leaderLinks.map((link) => (
                <div key={link.groupId || link.groupCode} className={styles.linkCard}>
                  <div className={styles.linkHeader}>
                    <span className={styles.linkTitle}>{link.groupName || link.groupCode}</span>
                    {link.groupCode && <span className={styles.linkCode} dir="ltr">{link.groupCode}</span>}
                  </div>
                  <div className={styles.metricsGrid}>
                    <div className={styles.metricBox}>
                      <span className={styles.metricLabel}>{t('currentMonthLabel')}</span>
                      <span className={styles.metricValue}>{link.currentMonthFormatted}</span>
                    </div>
                    <div className={styles.metricBox}>
                      <span className={styles.metricLabel}>{t('totalLabel')}</span>
                      <span className={styles.totalValue}>{link.totalQualifiedFormatted}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className={styles.metricsGrid}>
              <div className={styles.metricBox}>
                <span className={styles.metricLabel}>{t('currentMonthLabel')}</span>
                <span className={styles.metricValue}>{currentMonthFormatted}</span>
              </div>
              <div className={styles.metricBox}>
                <span className={styles.metricLabel}>{t('totalLabel')}</span>
                <span className={styles.totalValue}>{totalQualifiedFormatted}</span>
              </div>
            </div>
          )}
        </>
      )}

      {showMembership && membership && (
        <div className={showLeaderMinutes ? styles.divider : undefined} data-testid="whatsapp-group-membership-row">
          <div className={styles.membershipRow}>
            <div className={styles.membershipMeta}>
              <div className={styles.membershipIconWrap}>
                <Users className={styles.icon} />
              </div>
              <div className={styles.titleWrap}>
                <p className={styles.membershipLabel}>{t('membershipLabel')}</p>
                <p className={styles.membershipName}>{membership.groupName || membership.groupCode}</p>
              </div>
            </div>

            {!confirmingLeave && (
              <button
                type="button"
                className={styles.leaveBtn}
                onClick={requestLeave}
                disabled={isLeaving}
                data-testid="whatsapp-group-leave-btn"
              >
                <LogOut className={styles.icon} />
                <span>{t('leaveButton')}</span>
              </button>
            )}
          </div>

          {confirmingLeave && (
            <div className={styles.confirmBox} data-testid="whatsapp-group-leave-confirm">
              <p className={styles.confirmHint}>{t('leaveConfirmHint')}</p>
              <div className={styles.confirmActions}>
                <button
                  type="button"
                  className={styles.confirmBtn}
                  onClick={() => { void confirmLeave(); }}
                  disabled={isLeaving}
                >
                  {isLeaving ? t('leavingProgress') : t('confirmLeaveButton')}
                </button>
                <button
                  type="button"
                  className={styles.cancelBtn}
                  onClick={cancelLeave}
                  disabled={isLeaving}
                >
                  {t('cancelLeaveButton')}
                </button>
              </div>
            </div>
          )}

          {leaveError && <p className={styles.errorText}>{t('leaveError')}</p>}
        </div>
      )}

      {!showMembership && leftGroupNotice && (
        <p className={styles.noticeText} data-testid="whatsapp-group-left-notice">
          {t('leftSuccess')}
        </p>
      )}
    </div>
  );
}

export function HistoryGroupMinutesRow(props: HistoryGroupMinutesRowProps) {
  return (
    <WhatsAppGroupErrorBoundary scope="history_minutes">
      <HistoryGroupMinutesRowInner {...props} />
    </WhatsAppGroupErrorBoundary>
  );
}
