import React from 'react';
import { useTranslations } from 'next-intl';
import { EditableField, styles } from './driver-profile-shared';

interface DriverVehicleSocialProps {
  state: any;
  firstString: (...values: any[]) => string;
}

export function DriverVehicleSocial({ state, firstString }: DriverVehicleSocialProps) {
  const t = useTranslations('captainProfile');
  const {
    facebookUrl, setFacebookUrl, instagramUrl, setInstagramUrl,
    savedSnapshotRef, isFieldEditing, isSaving, startEditingField, stopEditingField, handleFieldSave
  } = state;

  return (
    <>
      <EditableField
        label={t('facebook')}
        value={firstString(facebookUrl, t('notProvided'))}
        originalValue={firstString(savedSnapshotRef.current.facebookUrl, t('notProvided'))}
        isEditing={isFieldEditing('facebookUrl')}
        isSaving={isSaving}
        onEdit={() => startEditingField('facebookUrl')}
        onSave={handleFieldSave}
        onCancel={() => { setFacebookUrl(savedSnapshotRef.current.facebookUrl); stopEditingField('facebookUrl'); }}
      >
        <input value={facebookUrl} onChange={(event) => setFacebookUrl(event.target.value)} className={styles.editingInput} dir="ltr" />
      </EditableField>
      <EditableField
        label={t('instagram')}
        value={firstString(instagramUrl, t('notProvided'))}
        originalValue={firstString(savedSnapshotRef.current.instagramUrl, t('notProvided'))}
        isEditing={isFieldEditing('instagramUrl')}
        isSaving={isSaving}
        onEdit={() => startEditingField('instagramUrl')}
        onSave={handleFieldSave}
        onCancel={() => { setInstagramUrl(savedSnapshotRef.current.instagramUrl); stopEditingField('instagramUrl'); }}
      >
        <input value={instagramUrl} onChange={(event) => setInstagramUrl(event.target.value)} className={styles.editingInput} dir="ltr" />
      </EditableField>
    </>
  );
}

