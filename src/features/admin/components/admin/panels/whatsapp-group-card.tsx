'use client';

import { useCallback } from 'react';
import {
  AlertTriangle, Car, Check, CheckCircle2, Clock, Copy, Link2, Loader2, MapPin, PauseCircle, Power, Unlink, Users,
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { AdminWhatsAppGroupLinkItem } from '@/features/whatsapp-groups/contract';

const styles = {
  groupCard: 'bg-[#090e1a] border border-white/10 rounded-2xl overflow-hidden',
  groupCardHeader: 'pb-3 border-b border-white/5',
  groupCardTop: 'flex items-start justify-between gap-3',
  groupName: 'text-sm font-black text-white',
  groupMetaText: 'text-xs text-slate-400 mt-1',
  zoneTag: 'inline-flex items-center gap-1 mt-1.5 text-[11px] font-bold text-teal-300 bg-teal-500/10 border border-teal-500/25 rounded-lg px-2 py-0.5',
  restrictedTag: 'inline-flex items-center gap-1 mt-1.5 ms-1.5 text-[11px] font-bold text-amber-300 bg-amber-500/10 border border-amber-500/30 rounded-lg px-2 py-0.5',
  unlinkedTag: 'inline-flex items-center gap-1 mt-1.5 ms-1.5 text-[11px] font-bold text-slate-200 bg-slate-800 border border-white/15 rounded-lg px-2 py-0.5',
  badgeActive: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30 text-[11px] font-bold shrink-0',
  badgeInactive: 'bg-slate-800 text-slate-300 border-white/15 text-[11px] font-bold shrink-0',
  badgeIcon: 'w-3 h-3 me-1',
  groupContent: 'pt-4 space-y-3',
  infoPanel: 'bg-[#0B0F19] border border-white/5 rounded-xl p-3 space-y-1.5 text-xs',
  infoRow: 'flex items-center justify-between gap-2',
  infoLabel: 'text-slate-400',
  infoValueMono: 'font-mono text-teal-300 font-bold truncate max-w-[220px]',
  infoValueWhite: 'text-slate-200 font-bold font-mono truncate max-w-[220px]',
  statsGrid: 'grid grid-cols-2 sm:grid-cols-4 gap-2',
  statTile: 'bg-[#0B0F19] border border-white/5 rounded-xl p-2.5 text-center',
  statValTeal: 'text-sm font-black text-teal-400 font-mono flex items-center justify-center gap-1',
  statValEmerald: 'text-sm font-black text-emerald-400 font-mono flex items-center justify-center gap-1',
  statValWhite: 'text-sm font-black text-white font-mono flex items-center justify-center gap-1',
  statLabel: 'text-[10px] text-slate-400 mt-0.5 block',
  statSub: 'text-[10px] text-slate-400 mt-0.5 block font-mono',
  actionsRow: 'flex items-center justify-between gap-2 pt-1 flex-wrap',
  copyGroup: 'flex items-center gap-1.5 flex-wrap',
  copyBtn: 'border-white/15 bg-white/5 hover:bg-white/10 text-slate-200 text-xs h-8 rounded-xl',
  toggleActiveBtn: 'border-amber-500/30 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 text-xs h-8 rounded-xl',
  toggleIdleBtn: 'border-emerald-500/30 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 text-xs h-8 rounded-xl',
  unlinkBtn: 'border-blue-500/30 bg-blue-500/10 hover:bg-blue-500/20 text-blue-200 text-xs h-8 rounded-xl',
  unlinkConfirmBtn: 'border-amber-500/40 bg-amber-500/15 hover:bg-amber-500/25 text-amber-200 text-xs h-8 rounded-xl',
  btnIcon: 'w-4 h-4',
  spinner: 'w-4 h-4 animate-spin text-teal-400',
} as const;

export interface WhatsappGroupCardProps {
  item: AdminWhatsAppGroupLinkItem;
  formattedDuration: string;
  formattedMonthDuration: string;
  sharePath: string;
  copiedKey: string | null;
  isToggling: boolean;
  isConfirmingDeactivate?: boolean;
  isUnlinking?: boolean;
  isConfirmingUnlink?: boolean;
  onCopy: (groupCode: string, key: string, mode: 'link' | 'code') => void;
  onToggleStatus: (item: AdminWhatsAppGroupLinkItem) => void;
  onCancelDeactivate?: () => void;
  onUnlinkOwner?: (item: AdminWhatsAppGroupLinkItem) => void;
  onCancelUnlink?: () => void;
}

export function WhatsappGroupCard({
  item, formattedDuration, formattedMonthDuration, sharePath, copiedKey,
  isToggling, isConfirmingDeactivate = false, isUnlinking = false, isConfirmingUnlink = false,
  onCopy, onToggleStatus, onCancelDeactivate, onUnlinkOwner, onCancelUnlink,
}: WhatsappGroupCardProps) {
  const t = useTranslations('adminWhatsappGroups');
  const linkKey = `link:${item.id}`;
  const codeKey = `code:${item.id}`;
  const isUnlinked = Boolean(item.ownerUnlinkedAt);
  const zoneText = [item.governorateName, item.districtName].filter(Boolean).join(' • ') || t('zoneUnassigned');

  const handleCopyLink = useCallback(() => { onCopy(item.groupCode, linkKey, 'link'); }, [item.groupCode, linkKey, onCopy]);
  const handleCopyCode = useCallback(() => { onCopy(item.groupCode, codeKey, 'code'); }, [codeKey, item.groupCode, onCopy]);
  const handleToggle = useCallback(() => { onToggleStatus(item); }, [item, onToggleStatus]);
  const handleUnlink = useCallback(() => { onUnlinkOwner?.(item); }, [item, onUnlinkOwner]);

  return (
    <Card className={styles.groupCard}>
      <CardHeader className={styles.groupCardHeader}>
        <div className={styles.groupCardTop}>
          <div>
            <CardTitle className={styles.groupName}>{item.groupName}</CardTitle>
            <CardDescription className={styles.groupMetaText}>
              {t('leaderLabel')} {item.leaderFullName} ({item.leaderPhone || '-'})
            </CardDescription>
            <span className={styles.zoneTag}><MapPin className={styles.badgeIcon} /><span>{zoneText}</span></span>
            {item.leaderRestricted && (
              <span className={styles.restrictedTag}><AlertTriangle className={styles.badgeIcon} /><span>{t('leaderRestrictedBadge')}</span></span>
            )}
            {isUnlinked && (
              <span className={styles.unlinkedTag}><Unlink className={styles.badgeIcon} /><span>{t('ownerUnlinkedBadge')}</span></span>
            )}
          </div>
          <Badge variant="outline" className={item.status === 'ACTIVE' ? styles.badgeActive : styles.badgeInactive}>
            {item.status === 'ACTIVE' ? <CheckCircle2 className={styles.badgeIcon} /> : <PauseCircle className={styles.badgeIcon} />}
            <span>{item.status === 'ACTIVE' ? t('statusActive') : t('statusInactive')}</span>
          </Badge>
        </div>
      </CardHeader>
      <CardContent className={styles.groupContent}>
        <div className={styles.infoPanel}>
          <div className={styles.infoRow}><span className={styles.infoLabel}>{t('codeLabel')}</span><span className={styles.infoValueMono} dir="ltr">{item.groupCode}</span></div>
          <div className={styles.infoRow}><span className={styles.infoLabel}>{t('linkLabel')}</span><span className={styles.infoValueWhite} dir="ltr">{sharePath}</span></div>
        </div>
        <div className={styles.statsGrid}>
          <div className={styles.statTile}>
            <span className={styles.statValWhite}><Car className={styles.badgeIcon} />{item.captainsCount}</span>
            <span className={styles.statLabel}>{t('captainsCountLabel')}</span>
            <span className={styles.statSub}>{t('activeOpsCount', { count: item.activeCaptainsCount })}</span>
          </div>
          <div className={styles.statTile}>
            <span className={styles.statValEmerald}><Users className={styles.badgeIcon} />{item.ridersCount}</span>
            <span className={styles.statLabel}>{t('ridersCountLabel')}</span>
            <span className={styles.statSub}>{t('activeOpsCount', { count: item.activeRidersCount })}</span>
          </div>
          <div className={styles.statTile}>
            <span className={styles.statValTeal}><Clock className={styles.badgeIcon} />{formattedDuration}</span>
            <span className={styles.statLabel}>{t('kpiQualifiedTime')}</span>
            <span className={styles.statSub}>
              {typeof item.currentMonthQualifiedTrips === 'number'
                ? t('kpiMonthQualifiedSummary', { duration: formattedMonthDuration, trips: item.currentMonthQualifiedTrips })
                : t('monthDurationLabel', { duration: formattedMonthDuration })}
            </span>
          </div>
          <div className={styles.statTile}>
            <span className={styles.statValWhite}>{item.qualifiedTripsCount}</span>
            <span className={styles.statLabel}>{t('tripsUnit')}</span>
            <span className={styles.statSub}>{t('totalSpreadCount', { count: item.activeMembersCount })}</span>
          </div>
        </div>
        <div className={styles.actionsRow}>
          <div className={styles.copyGroup}>
            <Button variant="outline" size="sm" disabled={item.status !== 'ACTIVE'} title={item.status !== 'ACTIVE' ? t('copyDisabledInactive') : undefined} onClick={handleCopyLink} className={styles.copyBtn}>
              {copiedKey === linkKey ? <Check className={styles.btnIcon} /> : <Link2 className={styles.btnIcon} />}
              <span>{t('copyLink')}</span>
            </Button>
            <Button variant="outline" size="sm" disabled={item.status !== 'ACTIVE'} title={item.status !== 'ACTIVE' ? t('copyDisabledInactive') : undefined} onClick={handleCopyCode} className={styles.copyBtn}>
              {copiedKey === codeKey ? <Check className={styles.btnIcon} /> : <Copy className={styles.btnIcon} />}
              <span>{t('copyCode')}</span>
            </Button>
          </div>
          <div className={styles.copyGroup}>
            {!isUnlinked && isConfirmingUnlink && onUnlinkOwner ? (
              <>
                <Button variant="outline" size="sm" disabled={isUnlinking} onClick={handleUnlink} className={styles.unlinkConfirmBtn}>
                  {isUnlinking ? <Loader2 className={styles.spinner} /> : <Unlink className={styles.btnIcon} />}
                  <span>{t('confirmUnlinkBtn')}</span>
                </Button>
                <Button variant="outline" size="sm" disabled={isUnlinking} onClick={onCancelUnlink} className={styles.copyBtn}>
                  <span>{t('cancel')}</span>
                </Button>
              </>
            ) : !isUnlinked && onUnlinkOwner ? (
              <Button variant="outline" size="sm" disabled={isUnlinking || isToggling} onClick={handleUnlink} className={styles.unlinkBtn}>
                {isUnlinking ? <Loader2 className={styles.spinner} /> : <Unlink className={styles.btnIcon} />}
                <span>{t('unlinkOwnerBtn')}</span>
              </Button>
            ) : null}
            {isConfirmingDeactivate && item.status === 'ACTIVE' ? (
              <>
                <Button variant="outline" size="sm" disabled={isToggling} onClick={handleToggle} className={styles.toggleActiveBtn}>
                  {isToggling ? <Loader2 className={styles.spinner} /> : <Power className={styles.btnIcon} />}
                  <span>{t('confirmDeactivateBtn')}</span>
                </Button>
                <Button variant="outline" size="sm" disabled={isToggling} onClick={onCancelDeactivate} className={styles.copyBtn}>
                  <span>{t('cancel')}</span>
                </Button>
              </>
            ) : (
              <Button
                variant="outline"
                size="sm"
                disabled={isToggling || isUnlinking || isUnlinked || (item.status !== 'ACTIVE' && Boolean(item.leaderRestricted))}
                title={isUnlinked ? t('errOwnerUnlinked') : item.status !== 'ACTIVE' && item.leaderRestricted ? t('activateDisabledRestricted') : undefined}
                onClick={handleToggle}
                className={item.status === 'ACTIVE' ? styles.toggleActiveBtn : styles.toggleIdleBtn}
              >
                {isToggling ? <Loader2 className={styles.spinner} /> : <Power className={styles.btnIcon} />}
                <span>{item.status === 'ACTIVE' ? t('deactivateBtn') : t('activateBtn')}</span>
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
