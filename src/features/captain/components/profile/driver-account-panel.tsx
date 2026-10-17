import React from 'react';
import { IdCard, ShieldCheck, ShieldAlert } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Panel, Field, EditableField, styles } from './driver-profile-shared';
import { RecoveryEmailField } from '@/features/auth/contract';

export function DriverAccountPanel({ state, user }: { state: any, user: any }) {
  const t = useTranslations('captainProfile');
  const {
    fullName, nickname, setNickname, phone, setPhone,
    nationalIdNumber, licenseNumber, tier, profile,
    savedSnapshotRef, isFieldEditing, isSaving, startEditingField, stopEditingField, handleFieldSave
  } = state;

  const firstString = (...values: any[]) => {
    for (const value of values) {
      if (typeof value === 'string' && value.trim()) return value.trim();
    }
    return '';
  };

  return (
    <Panel icon={<IdCard className={styles.style431_62} />} title={t('account')}>
          {/* Fixed at registration — matches the national ID card, so it never gets a pencil. */}
          <Field label={t('name')} value={fullName} />
          <EditableField
            label={t('nickname')}
            value={firstString(nickname, t('notProvided'))}
            originalValue={firstString(savedSnapshotRef.current.nickname, t('notProvided'))}
            isEditing={isFieldEditing('nickname')}
            isSaving={isSaving}
            onEdit={() => startEditingField('nickname')}
            onSave={handleFieldSave}
            onCancel={() => { setNickname(savedSnapshotRef.current.nickname); stopEditingField('nickname'); }}
          >
            <input value={nickname} onChange={(event) => setNickname(event.target.value)} className={styles.editingInput} />
          </EditableField>
          <EditableField
            label={t('phone')}
            value={phone}
            originalValue={savedSnapshotRef.current.phone}
            isEditing={isFieldEditing('phone')}
            isSaving={isSaving}
            onEdit={() => startEditingField('phone')}
            onSave={handleFieldSave}
            onCancel={() => { setPhone(savedSnapshotRef.current.phone); stopEditingField('phone'); }}
          >
            <input value={phone} onChange={(event) => setPhone(event.target.value)} className={styles.editingInput} />
          </EditableField>
          {/* The only thing that makes password recovery self-service. Without it a locked
              out captain must go through an admin, who then has the power to set their
              password. Shared component — the same "unconfirmed is not yet active" caveat
              has to read identically on every screen that offers this. */}
          <div className={styles.recoveryEmailBlock}>
            <RecoveryEmailField />
          </div>
          <Field label={t('accountNumber')} value={firstString(profile?.serial_id, user?.serial_id, '-')} />
          <Field label={t('role')} value={t('captainRole')} />
          <Field label={t('tier')} value={tier.label} />
          {/* Verification Status */}
          <div className="flex flex-col gap-1.5 rounded-2xl border border-white/5 bg-white/[0.02] p-3 sm:p-3.5">
            <span className="text-[11px] font-bold text-slate-400">حالة التوثيق والاعتماد</span>
            <div className="flex items-center gap-2">
              {profile?.captain_profile?.verification_status === 'APPROVED' ? (
                <span className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-500/40 bg-emerald-500/15 px-3 py-1 text-xs font-black text-emerald-300">
                  <ShieldCheck className="h-4 w-4 text-emerald-400" />
                  معتمد وموثق رسمياً من الإدارة ✓
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 rounded-xl border border-amber-500/40 bg-amber-500/15 px-3 py-1 text-xs font-black text-amber-300">
                  <ShieldAlert className="h-4 w-4 text-amber-400" />
                  قبول تلقائي (غير معتمد يدوياً)
                </span>
              )}
            </div>
            <p className="text-[10px] text-slate-400 leading-relaxed">
              {profile?.captain_profile?.verification_status === 'APPROVED'
                ? 'تم تدقيق وثائقك الرسمية واعتماد حسابك كابتن موثق رسمياً.'
                : 'جميع الكباتن مقبولين تلقائياً للعمل واستقبال الرحلات. شارة الاعتماد اليدوي تُمنح بعد مراجعة الإدارة للمستندات.'}
            </p>
          </div>
          {/* Identity-verification data set at registration — read-only here too. */}
          <Field label={t('nationalIdNumber')} value={firstString(nationalIdNumber, t('notProvided'))} />
          <Field label={t('licenseNumber')} value={firstString(licenseNumber, t('notProvided'))} />
        </Panel>
  );
}
