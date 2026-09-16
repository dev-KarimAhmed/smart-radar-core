import React from 'react';
import { IdCard } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Panel, Field, EditableField, styles } from './driver-profile-shared';
import { RecoveryEmailField } from '@/features/auth/contract';

export function DriverAccountPanel({ state, user }: { state: any, user: any }) {
  const t = useTranslations('captainProfile');
  const {
    fullName, nickname, setNickname, phone, setPhone,
    nationalIdNumber, licenseNumber, affiliationType, tier, profile,
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
          <Field 
            label={t('affiliationTypeLabel')} 
            value={
              affiliationType === 'smart-app' ? t('affiliationSmartApp') :
              affiliationType === 'office-taxi' ? t('affiliationOfficeTaxi') :
              affiliationType === 'independent' ? t('affiliationIndependent') :
              (affiliationType || t('notProvided'))
            } 
          />
          <Field label={t('tier')} value={tier.label} />
          {/* Identity-verification data set at registration — read-only here too. */}
          <Field label={t('nationalIdNumber')} value={firstString(nationalIdNumber, t('notProvided'))} />
          <Field label={t('licenseNumber')} value={firstString(licenseNumber, t('notProvided'))} />
        </Panel>
  );
}
