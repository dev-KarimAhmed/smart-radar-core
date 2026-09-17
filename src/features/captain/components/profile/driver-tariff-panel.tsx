import React from 'react';
import { Wallet } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Panel, EditableField, styles } from './driver-profile-shared';

export function DriverTariffPanel({ state }: { state: any }) {
  const t = useTranslations('captainProfile');
  const {
    baseFare, setBaseFare, includedKm, setIncludedKm,
    pricePerKm, setPricePerKm, pricePerMin, setPricePerMin,
    minBaseFare, tariffError,
    savedSnapshotRef, isFieldEditing, isSaving, startEditingField, stopEditingField, handleFieldSave
  } = state;

  const firstString = (...values: any[]) => {
    for (const value of values) {
      if (typeof value === 'string' && value.trim()) return value.trim();
    }
    return '';
  };

  return (
    <Panel icon={<Wallet className={styles.style439_63} />} title={t('tariffTitle')}>
          <EditableField
            label={`${t('tariffBaseFare')} (${t('tariffMinimum', { min: minBaseFare.toFixed(2) })})`}
            value={firstString(baseFare, t('notProvided'))}
            originalValue={firstString(savedSnapshotRef.current.baseFare, t('notProvided'))}
            isEditing={isFieldEditing('baseFare')}
            isSaving={isSaving}
            onEdit={() => startEditingField('baseFare')}
            onSave={handleFieldSave}
            onCancel={() => { setBaseFare(savedSnapshotRef.current.baseFare); stopEditingField('baseFare'); }}
          >
            <input
              value={baseFare}
              onChange={(event) => setBaseFare(event.target.value)}
              type="number"
              inputMode="decimal"
              min={minBaseFare}
              step="0.01"
              className={styles.editingInput}
            />
          </EditableField>
          <EditableField
            label={t('tariffIncludedKm')}
            value={firstString(includedKm, '0')}
            originalValue={firstString(savedSnapshotRef.current.includedKm, '0')}
            isEditing={isFieldEditing('includedKm')}
            isSaving={isSaving}
            onEdit={() => startEditingField('includedKm')}
            onSave={handleFieldSave}
            onCancel={() => { setIncludedKm(savedSnapshotRef.current.includedKm); stopEditingField('includedKm'); }}
          >
            <input
              value={includedKm}
              onChange={(event) => setIncludedKm(event.target.value)}
              type="number"
              inputMode="decimal"
              min="0"
              step="0.1"
              className={styles.editingInput}
            />
          </EditableField>
          <EditableField
            label={t('tariffPerKm')}
            value={firstString(pricePerKm, t('notProvided'))}
            originalValue={firstString(savedSnapshotRef.current.pricePerKm, t('notProvided'))}
            isEditing={isFieldEditing('pricePerKm')}
            isSaving={isSaving}
            onEdit={() => startEditingField('pricePerKm')}
            onSave={handleFieldSave}
            onCancel={() => { setPricePerKm(savedSnapshotRef.current.pricePerKm); stopEditingField('pricePerKm'); }}
          >
            <input
              value={pricePerKm}
              onChange={(event) => setPricePerKm(event.target.value)}
              type="number"
              inputMode="decimal"
              min="0"
              step="0.01"
              className={styles.editingInput}
            />
          </EditableField>
          <EditableField
            label={t('tariffPerMin')}
            value={firstString(pricePerMin, t('notProvided'))}
            originalValue={firstString(savedSnapshotRef.current.pricePerMin, t('notProvided'))}
            isEditing={isFieldEditing('pricePerMin')}
            isSaving={isSaving}
            onEdit={() => startEditingField('pricePerMin')}
            onSave={handleFieldSave}
            onCancel={() => { setPricePerMin(savedSnapshotRef.current.pricePerMin); stopEditingField('pricePerMin'); }}
          >
            <input
              value={pricePerMin}
              onChange={(event) => setPricePerMin(event.target.value)}
              type="number"
              inputMode="decimal"
              min="0"
              step="0.01"
              className={styles.editingInput}
            />
          </EditableField>
          {tariffError ? <p className={styles.tariffError}>{tariffError}</p> : null}
        </Panel>
  );
}
