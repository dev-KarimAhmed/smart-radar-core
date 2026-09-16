import React from 'react';
import { Car } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Panel, Field, EditableField, styles } from './driver-profile-shared';
import { resolveColorDisplayName } from '@/shared/services/color-name';

export function DriverVehiclePanel({ state, language }: { state: any, language: 'ar' | 'en' }) {
  const t = useTranslations('captainProfile');
  const {
    vehiclePlate, setVehiclePlate, vehicleMake, setVehicleMake,
    vehicleModel, setVehicleModel, vehicleColor, vehicleYear, setVehicleYear,
    businessName, companyCode, setCompanyCode, isTaxi, officePhone, setOfficePhone,
    sideId, setSideId, facebookUrl, setFacebookUrl, instagramUrl, setInstagramUrl,
    savedSnapshotRef, isFieldEditing, isSaving, startEditingField, stopEditingField, handleFieldSave
  } = state;

  const firstString = (...values: any[]) => {
    for (const value of values) {
      if (typeof value === 'string' && value.trim()) return value.trim();
    }
    return '';
  };

  return (
    <Panel icon={<Car className={styles.style439_63} />} title={t('vehicle')}>
          <EditableField
            label={t('plate')}
            value={firstString(vehiclePlate, t('notProvided'))}
            originalValue={firstString(savedSnapshotRef.current.vehiclePlate, t('notProvided'))}
            isEditing={isFieldEditing('vehiclePlate')}
            isSaving={isSaving}
            onEdit={() => startEditingField('vehiclePlate')}
            onSave={handleFieldSave}
            onCancel={() => { setVehiclePlate(savedSnapshotRef.current.vehiclePlate); stopEditingField('vehiclePlate'); }}
          >
            <input value={vehiclePlate} onChange={(event) => setVehiclePlate(event.target.value)} className={styles.editingInput} />
          </EditableField>
          <EditableField
            label={t('make')}
            value={firstString(vehicleMake, t('notProvided'))}
            originalValue={firstString(savedSnapshotRef.current.vehicleMake, t('notProvided'))}
            isEditing={isFieldEditing('vehicleMake')}
            isSaving={isSaving}
            onEdit={() => startEditingField('vehicleMake')}
            onSave={handleFieldSave}
            onCancel={() => { setVehicleMake(savedSnapshotRef.current.vehicleMake); stopEditingField('vehicleMake'); }}
          >
            <input value={vehicleMake} onChange={(event) => setVehicleMake(event.target.value)} className={styles.editingInput} />
          </EditableField>
          <EditableField
            label={t('model')}
            value={firstString(vehicleModel, t('notProvided'))}
            originalValue={firstString(savedSnapshotRef.current.vehicleModel, t('notProvided'))}
            isEditing={isFieldEditing('vehicleModel')}
            isSaving={isSaving}
            onEdit={() => startEditingField('vehicleModel')}
            onSave={handleFieldSave}
            onCancel={() => { setVehicleModel(savedSnapshotRef.current.vehicleModel); stopEditingField('vehicleModel'); }}
          >
            <input value={vehicleModel} onChange={(event) => setVehicleModel(event.target.value)} className={styles.editingInput} />
          </EditableField>
          {/* Fixed at registration — never editable from the account. */}
          <Field label={t('color')} value={vehicleColor ? resolveColorDisplayName(vehicleColor, language) : t('notProvided')} />
          <EditableField
            label={t('year')}
            value={firstString(vehicleYear, t('notProvided'))}
            originalValue={firstString(savedSnapshotRef.current.vehicleYear, t('notProvided'))}
            isEditing={isFieldEditing('vehicleYear')}
            isSaving={isSaving}
            onEdit={() => startEditingField('vehicleYear')}
            onSave={handleFieldSave}
            onCancel={() => { setVehicleYear(savedSnapshotRef.current.vehicleYear); stopEditingField('vehicleYear'); }}
          >
            <input
              value={vehicleYear}
              onChange={(event) => setVehicleYear(event.target.value.replace(/[^\d]/g, '').slice(0, 4))}
              inputMode="numeric"
              className={styles.editingInput}
            />
          </EditableField>
          {/* Fixed — company/office name cannot be edited directly by the captain. */}
          <Field label={isTaxi ? t('officeName') : t('companyName')} value={firstString(businessName, t('notProvided'))} />
          {!isTaxi ? (
            <EditableField
              label={t('companyCode')}
              helper={t('companyCodeHelper')}
              value={firstString(companyCode, t('notProvided'))}
              originalValue={firstString(savedSnapshotRef.current.companyCode, t('notProvided'))}
              isEditing={isFieldEditing('companyCode')}
              isSaving={isSaving}
              onEdit={() => startEditingField('companyCode')}
              onSave={handleFieldSave}
              onCancel={() => { setCompanyCode(savedSnapshotRef.current.companyCode); stopEditingField('companyCode'); }}
            >
              <input
                value={companyCode}
                onChange={(event) => setCompanyCode(event.target.value)}
                placeholder={t('companyCodePlaceholder')}
                className={styles.editingInput}
                dir="ltr"
              />
            </EditableField>
          ) : null}
          {isTaxi ? (
            <>
              <EditableField
                label={t('officePhone')}
                value={firstString(officePhone, t('notProvided'))}
                originalValue={firstString(savedSnapshotRef.current.officePhone, t('notProvided'))}
                isEditing={isFieldEditing('officePhone')}
                isSaving={isSaving}
                onEdit={() => startEditingField('officePhone')}
                onSave={handleFieldSave}
                onCancel={() => { setOfficePhone(savedSnapshotRef.current.officePhone); stopEditingField('officePhone'); }}
              >
                <input value={officePhone} onChange={(event) => setOfficePhone(event.target.value)} className={styles.editingInput} />
              </EditableField>
              <EditableField
                label={t('sideId')}
                value={firstString(sideId, t('notProvided'))}
                originalValue={firstString(savedSnapshotRef.current.sideId, t('notProvided'))}
                isEditing={isFieldEditing('sideId')}
                isSaving={isSaving}
                onEdit={() => startEditingField('sideId')}
                onSave={handleFieldSave}
                onCancel={() => { setSideId(savedSnapshotRef.current.sideId); stopEditingField('sideId'); }}
              >
                <input value={sideId} onChange={(event) => setSideId(event.target.value)} className={styles.editingInput} />
              </EditableField>
            </>
          ) : null}
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
        </Panel>
  );
}
