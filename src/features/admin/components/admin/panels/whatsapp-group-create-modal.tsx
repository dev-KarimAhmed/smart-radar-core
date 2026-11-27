'use client';

import { AlertTriangle, Loader2, Plus } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useAdminWhatsAppGroupCreate } from '@/features/admin/hooks/use-admin-whatsapp-group-create';
import type { AdminCaptainLookupItem, AdminWhatsAppGeoOption } from '@/features/whatsapp-groups/contract';

const styles = {
  dialogContent: 'bg-[#090e1a] border border-teal-500/25 text-white max-w-lg rounded-2xl',
  dialogHeader: 'space-y-1.5',
  dialogTitle: 'text-base font-black text-white',
  dialogDesc: 'text-xs text-slate-400 leading-relaxed',
  formStack: 'space-y-4 py-2',
  fieldGroup: 'space-y-1.5',
  fieldLabel: 'text-xs font-bold text-slate-200',
  fieldInput: 'bg-[#0B0F19] border-white/15 text-white text-xs h-9 rounded-xl',
  fieldErrorHint: 'text-[11px] text-amber-300',
  fieldPreviewHint: 'text-[11px] text-teal-300 font-mono truncate',
  captainList: 'max-h-44 overflow-y-auto rounded-xl border border-white/10 bg-[#0B0F19] divide-y divide-white/5',
  captainRowIdle: 'w-full px-3 py-2 text-start hover:bg-white/5 transition-colors flex items-center justify-between gap-2 text-xs',
  captainRowSelected: 'w-full px-3 py-2 text-start bg-teal-500/15 text-teal-200 flex items-center justify-between gap-2 text-xs',
  captainMetaCol: 'min-w-0',
  captainName: 'font-bold block truncate',
  captainZone: 'text-[10px] text-slate-400 block truncate',
  captainPhone: 'text-[11px] text-slate-400 font-mono shrink-0',
  emptyCaptains: 'p-4 text-center text-xs text-slate-400',
  moreHint: 'text-[11px] text-slate-400',
  selectedBox: 'text-xs text-teal-300 bg-teal-500/10 border border-teal-500/25 rounded-xl px-3 py-2',
  existingWarnBox: 'text-[11px] text-amber-300 bg-amber-500/10 border border-amber-500/30 rounded-xl px-3 py-2 flex items-center gap-1.5',
  warnIcon: 'w-3.5 h-3.5 shrink-0',
  dialogFooter: 'gap-2 pt-2',
  cancelBtn: 'border-white/15 bg-white/5 hover:bg-white/10 text-slate-200 text-xs h-9 rounded-xl',
  createBtn: 'bg-[#14B8A6] hover:bg-teal-400 text-[#0B0F19] font-black text-xs h-9 rounded-xl shadow-sm',
  btnIcon: 'w-4 h-4',
  spinner: 'w-4 h-4 animate-spin text-[#0B0F19]',
} as const;

export interface WhatsappGroupCreateModalProps {
  open: boolean;
  direction: 'rtl' | 'ltr';
  captains: AdminCaptainLookupItem[];
  leaderGroupCounts?: Readonly<Record<string, number>>;
  governorateOptions?: AdminWhatsAppGeoOption[];
  districtOptions?: AdminWhatsAppGeoOption[];
  onOpenChange: (open: boolean) => void;
  onCreated: () => Promise<void>;
}

export function WhatsappGroupCreateModal({
  open,
  direction,
  captains,
  leaderGroupCounts,
  governorateOptions,
  districtOptions,
  onOpenChange,
  onCreated,
}: WhatsappGroupCreateModalProps) {
  const t = useTranslations('adminWhatsappGroups');
  const {
    groupName, groupCode, captainSearch, selectedCaptainId, submitting,
    codeFormatInvalid, previewSharePath, totalMatchingCaptains, filteredCaptains, selectedCaptain,
    setGroupName, setGroupCode, setCaptainSearch, setSelectedCaptainId,
    handleOpenChange, handleClose, handleCreate,
  } = useAdminWhatsAppGroupCreate({
    captains, leaderGroupCounts, governorateOptions, districtOptions, onOpenChange, onCreated,
  });

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className={styles.dialogContent} dir={direction}>
        <DialogHeader className={styles.dialogHeader}>
          <DialogTitle className={styles.dialogTitle}>{t('modalTitle')}</DialogTitle>
          <DialogDescription className={styles.dialogDesc}>{t('modalDesc')}</DialogDescription>
        </DialogHeader>
        <div className={styles.formStack}>
          <div className={styles.fieldGroup}>
            <Label className={styles.fieldLabel}>{t('groupNameLabel')}</Label>
            <Input value={groupName} maxLength={120} onChange={(e) => setGroupName(e.target.value)} placeholder={t('groupNamePlaceholder')} className={styles.fieldInput} />
          </div>
          <div className={styles.fieldGroup}>
            <Label className={styles.fieldLabel}>{t('groupCodeLabel')}</Label>
            <Input value={groupCode} maxLength={64} onChange={(e) => setGroupCode(e.target.value)} placeholder={t('groupCodePlaceholder')} className={styles.fieldInput} />
            {codeFormatInvalid ? (
              <p className={styles.fieldErrorHint}>{t('invalidCodeDesc')}</p>
            ) : previewSharePath ? (
              <p className={styles.fieldPreviewHint}>{t('previewLinkLabel', { path: previewSharePath })}</p>
            ) : null}
          </div>
          <div className={styles.fieldGroup}>
            <Label className={styles.fieldLabel}>{t('captainSearchLabel')}</Label>
            <Input value={captainSearch} onChange={(e) => setCaptainSearch(e.target.value)} placeholder={t('captainSearchPlaceholder')} className={styles.fieldInput} />
            <div className={styles.captainList}>
              {filteredCaptains.length === 0 ? (
                <p className={styles.emptyCaptains}>{t('noCaptainsFound')}</p>
              ) : (
                filteredCaptains.map((cap) => (
                  <button key={cap.id} type="button" onClick={() => setSelectedCaptainId(cap.id)} className={selectedCaptainId === cap.id ? styles.captainRowSelected : styles.captainRowIdle}>
                    <span className={styles.captainMetaCol}>
                      <span className={styles.captainName}>{cap.fullName}</span>
                      {cap.zoneLabel ? <span className={styles.captainZone}>{cap.zoneLabel}</span> : null}
                    </span>
                    <span className={styles.captainPhone}>{cap.phone}</span>
                  </button>
                ))
              )}
            </div>
            {totalMatchingCaptains > filteredCaptains.length ? (
              <p className={styles.moreHint}>{t('captainsMoreHint', { shown: filteredCaptains.length, total: totalMatchingCaptains })}</p>
            ) : null}
            {selectedCaptain && (
              <div className={styles.selectedBox}>
                {t('selectedCaptain')} {selectedCaptain.fullName} ({selectedCaptain.phone})
                {selectedCaptain.zoneLabel ? ` • ${selectedCaptain.zoneLabel}` : ''}
              </div>
            )}
            {selectedCaptain && selectedCaptain.existingLinksCount > 0 ? (
              <div className={styles.existingWarnBox}>
                <AlertTriangle className={styles.warnIcon} />
                <span>{t('captainHasExistingLinksWarn', { count: selectedCaptain.existingLinksCount })}</span>
              </div>
            ) : null}
          </div>
        </div>
        <DialogFooter className={styles.dialogFooter}>
          <Button variant="outline" disabled={submitting} onClick={handleClose} className={styles.cancelBtn}>{t('cancel')}</Button>
          <Button onClick={handleCreate} disabled={submitting || codeFormatInvalid} className={styles.createBtn}>
            {submitting ? <Loader2 className={styles.spinner} /> : <Plus className={styles.btnIcon} />}
            <span>{t('submitCreate')}</span>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
