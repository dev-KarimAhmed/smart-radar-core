import React from 'react';
import { useTranslations } from 'next-intl';
import { EditableField, styles } from './driver-profile-shared';

interface DriverVehicleAffiliationProps {
  state: any;
  firstString: (...values: any[]) => string;
}

export function DriverVehicleAffiliation({ state, firstString }: DriverVehicleAffiliationProps) {
  const t = useTranslations('captainProfile');
  const {
    businessName, setBusinessName,
    companyCode, setCompanyCode,
    sideId, setSideId,
    affiliationType,
    savedSnapshotRef, isFieldEditing, isSaving, startEditingField, stopEditingField, handleFieldSave
  } = state;

  if (affiliationType === 'smart-app') {
    return (
      <>
        <EditableField
          label={t('companyName')}
          value={firstString(businessName, t('notProvided'))}
          originalValue={firstString(savedSnapshotRef.current.businessName, t('notProvided'))}
          isEditing={isFieldEditing('businessName')}
          isSaving={isSaving}
          onEdit={() => startEditingField('businessName')}
          onSave={handleFieldSave}
          onCancel={() => {
            setBusinessName(savedSnapshotRef.current.businessName);
            stopEditingField('businessName');
          }}
        >
          <input
            value={businessName}
            onChange={(event) => setBusinessName(event.target.value)}
            placeholder={t('companyNamePlaceholder')}
            className={styles.editingInput}
          />
        </EditableField>
        <EditableField
          label={t('companyCode')}
          helper={t('companyCodeHelper')}
          value={firstString(companyCode, t('notProvided'))}
          originalValue={firstString(savedSnapshotRef.current.companyCode, t('notProvided'))}
          isEditing={isFieldEditing('companyCode')}
          isSaving={isSaving}
          onEdit={() => startEditingField('companyCode')}
          onSave={handleFieldSave}
          onCancel={() => {
            setCompanyCode(savedSnapshotRef.current.companyCode);
            stopEditingField('companyCode');
          }}
        >
          <input
            value={companyCode}
            onChange={(event) => setCompanyCode(event.target.value)}
            placeholder={t('companyCodePlaceholder')}
            className={styles.editingInput}
            dir="ltr"
          />
        </EditableField>
      </>
    );
  }

  if (affiliationType === 'office-taxi') {
    return (
      <>
        <EditableField
          label={t('officeName')}
          value={firstString(businessName, t('notProvided'))}
          originalValue={firstString(savedSnapshotRef.current.businessName, t('notProvided'))}
          isEditing={isFieldEditing('businessName')}
          isSaving={isSaving}
          onEdit={() => startEditingField('businessName')}
          onSave={handleFieldSave}
          onCancel={() => {
            setBusinessName(savedSnapshotRef.current.businessName);
            stopEditingField('businessName');
          }}
        >
          <input
            value={businessName}
            onChange={(event) => setBusinessName(event.target.value)}
            placeholder={t('officeNamePlaceholder')}
            className={styles.editingInput}
          />
        </EditableField>
        <EditableField
          label={t('sideId')}
          value={firstString(sideId, t('notProvided'))}
          originalValue={firstString(savedSnapshotRef.current.sideId, t('notProvided'))}
          isEditing={isFieldEditing('sideId')}
          isSaving={isSaving}
          onEdit={() => startEditingField('sideId')}
          onSave={handleFieldSave}
          onCancel={() => {
            setSideId(savedSnapshotRef.current.sideId);
            stopEditingField('sideId');
          }}
        >
          <input
            value={sideId}
            onChange={(event) => setSideId(event.target.value)}
            className={styles.editingInput}
          />
        </EditableField>
      </>
    );
  }

  return null;
}

