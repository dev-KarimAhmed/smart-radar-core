'use client';

import { useState } from 'react';
import { ArrowLeftRight, Clock, Eye, LogOut, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { WhatsAppGroupSwitchModal } from '@/features/whatsapp-groups/contract';
import { useTranslations } from 'next-intl';

const styles = {
  banner: 'flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-xs',
  infoWrap: 'flex items-center gap-2 text-amber-200 font-bold',
  infoIcon: 'w-4 h-4 text-amber-400 shrink-0',
  actionsWrap: 'flex flex-wrap items-center gap-2',
  previewBtn: 'border-amber-500/35 bg-black/40 hover:bg-amber-500/20 text-amber-200 text-xs h-8 px-3 rounded-xl',
  btnIcon: 'w-3.5 h-3.5',
  historyDialog: 'bg-[#090e1a] border border-teal-500/25 text-white max-w-xl rounded-2xl',
  historyBox: 'rounded-2xl border border-[#14B8A6]/25 bg-[#0B0F19] p-4 space-y-3',
  historyHeader: 'flex items-center gap-2.5',
  iconWrap: 'flex h-9 w-9 items-center justify-center rounded-xl border border-teal-500/30 bg-teal-500/10 text-[#14F5D5]',
  historyTitle: 'text-sm font-black text-white',
  historySub: 'text-xs text-slate-400',
  linkCard: 'rounded-xl border border-slate-800 bg-slate-900/60 p-3 space-y-2',
  linkTop: 'flex items-center justify-between text-xs',
  linkName: 'font-bold text-white',
  linkCode: 'font-mono text-teal-300',
  metricsGrid: 'grid grid-cols-2 gap-2',
  metricTile: 'flex items-center justify-between rounded-xl border border-slate-800 bg-slate-950/70 px-3 py-2 text-xs',
  metricVal: 'font-black text-[#14F5D5]',
  memberFooter: 'flex items-center justify-between pt-2 border-t border-slate-800 text-xs',
  memberLeft: 'flex items-center gap-2 text-slate-300',
  leavePreviewBtn: 'inline-flex items-center gap-1 rounded-xl border border-teal-500/35 bg-slate-900 px-3 py-1.5 font-bold text-slate-200',
} as const;

export function WhatsappGroupUiPreviewBar({ isArabic, direction }: { isArabic: boolean; direction: 'rtl' | 'ltr' }) {
  const tHistory = useTranslations('whatsappGroupHistory');
  const [switchOpen, setSwitchOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);

  return (
    <>
      <div className={styles.banner}>
        <div className={styles.infoWrap}>
          <Eye className={styles.infoIcon} />
          <span>
            {isArabic
              ? 'وضع معاينة الواجهة فقط (UI Preview) — بيانات تجريبية قبل ربط قاعدة البيانات'
              : 'UI Preview Mode Only — Sample data shown before database wiring'}
          </span>
        </div>
        <div className={styles.actionsWrap}>
          <Button variant="outline" size="sm" onClick={() => setSwitchOpen(true)} className={styles.previewBtn}>
            <ArrowLeftRight className={styles.btnIcon} />
            <span>{isArabic ? 'معاينة نافذة الانتقال (Popup)' : 'Preview Switch Popup'}</span>
          </Button>
          <Button variant="outline" size="sm" onClick={() => setHistoryOpen(true)} className={styles.previewBtn}>
            <Clock className={styles.btnIcon} />
            <span>{isArabic ? 'معاينة بطاقة «سجلاتي»' : 'Preview History Card'}</span>
          </Button>
        </div>
      </div>

      <WhatsAppGroupSwitchModal
        open={switchOpen}
        currentGroupName={isArabic ? 'مجموعة كباتن تلاع العلي والشميساني' : 'Tla Al-Ali Captains Group'}
        targetGroupName={isArabic ? 'رابط مجموعة إربد السريع' : 'Irbid Express Group'}
        isConfirming={false}
        isArabic={isArabic}
        onConfirm={() => setSwitchOpen(false)}
      />

      <Dialog open={historyOpen} onOpenChange={setHistoryOpen}>
        <DialogContent className={styles.historyDialog} dir={direction}>
          <DialogHeader>
            <DialogTitle className={styles.historyTitle}>
              {isArabic ? 'معاينة ظهور المنظومة داخل شاشة «سجلاتي»' : 'History Tab Preview'}
            </DialogTitle>
          </DialogHeader>
          <div className={styles.historyBox}>
            <div className={styles.historyHeader}>
              <div className={styles.iconWrap}><Clock className={styles.btnIcon} /></div>
              <div>
                <p className={styles.historyTitle}>{tHistory('label')}</p>
                <p className={styles.historySub}>{tHistory('periodLabel', { period: '2026-11' })}</p>
              </div>
            </div>
            <div className={styles.linkCard}>
              <div className={styles.linkTop}>
                <span className={styles.linkName}>{isArabic ? 'مجموعة كباتن تلاع العلي والشميساني' : 'Amman Group 1'}</span>
                <span className={styles.linkCode} dir="ltr">WA-AMMAN-01</span>
              </div>
              <div className={styles.metricsGrid}>
                <div className={styles.metricTile}><span>{tHistory('currentMonthLabel')}</span><span className={styles.metricVal}>1 س 34 د</span></div>
                <div className={styles.metricTile}><span>{tHistory('totalLabel')}</span><span className={styles.metricVal}>5 س 07 د</span></div>
              </div>
            </div>
            <div className={styles.linkCard}>
              <div className={styles.linkTop}>
                <span className={styles.linkName}>{isArabic ? 'رابط مجموعة إربد السريع' : 'Irbid Group 2'}</span>
                <span className={styles.linkCode} dir="ltr">WA-IRBID-WEST</span>
              </div>
              <div className={styles.metricsGrid}>
                <div className={styles.metricTile}><span>{tHistory('currentMonthLabel')}</span><span className={styles.metricVal}>35 د</span></div>
                <div className={styles.metricTile}><span>{tHistory('totalLabel')}</span><span className={styles.metricVal}>1 س 12 د</span></div>
              </div>
            </div>
            <div className={styles.memberFooter}>
              <div className={styles.memberLeft}><Users className={styles.btnIcon} /><span>{tHistory('membershipLabel')} WA-AMMAN-01</span></div>
              <button type="button" onClick={() => setHistoryOpen(false)} className={styles.leavePreviewBtn}>
                <LogOut className={styles.btnIcon} /><span>{tHistory('leaveButton')}</span>
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
