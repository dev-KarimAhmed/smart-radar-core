import React from 'react';
import { Car } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Panel, EditableField, styles } from './driver-profile-shared';
import { resolveColorDisplayName, colorNameToHex, hexToColorName } from '@/shared/services/color-name';
import { DriverVehicleAffiliation } from './driver-vehicle-affiliation';
import { DriverVehicleSocial } from './driver-vehicle-social';

export function DriverVehiclePanel({ state, language }: { state: any, language: 'ar' | 'en' }) {
  const t = useTranslations('captainProfile');
  const {
    vehiclePlate, setVehiclePlate, vehicleMake, setVehicleMake,
    vehicleModel, setVehicleModel, vehicleColor, setVehicleColor, vehicleYear, setVehicleYear,
    setBusinessName, setCompanyCode, setOfficePhone, setSideId,
    affiliationType, setAffiliationType,
    savedSnapshotRef, isFieldEditing, isSaving, startEditingField, stopEditingField, handleFieldSave
  } = state;

  const firstString = (...values: any[]) => {
    for (const value of values) {
      if (typeof value === 'string' && value.trim()) return value.trim();
    }
    return '';
  };

  const getAffiliationLabel = (type: string) => {
    switch (type) {
      case 'smart-app':
        return t('affiliationSmartApp');
      case 'office-taxi':
        return t('affiliationOfficeTaxi');
      case 'independent':
        return t('affiliationIndependent');
      default:
        return t('notProvided');
    }
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
      <EditableField
        label={t('color')}
        value={vehicleColor ? resolveColorDisplayName(vehicleColor, language) : t('notProvided')}
        originalValue={savedSnapshotRef.current.vehicleColor ? resolveColorDisplayName(savedSnapshotRef.current.vehicleColor, language) : t('notProvided')}
        isEditing={isFieldEditing('vehicleColor')}
        isSaving={isSaving}
        onEdit={() => startEditingField('vehicleColor')}
        onSave={handleFieldSave}
        onCancel={() => { setVehicleColor(savedSnapshotRef.current.vehicleColor); stopEditingField('vehicleColor'); }}
      >
        <div className="flex items-center gap-2">
          <input
            type="color"
            value={colorNameToHex(vehicleColor) || '#ffffff'}
            onChange={(event) => setVehicleColor(hexToColorName(event.target.value, language))}
            className="h-9 w-12 rounded-lg cursor-pointer border border-white/20 bg-transparent p-0.5 shrink-0"
            title={language === 'ar' ? 'اختر اللون' : 'Pick Color'}
          />
          <input
            value={vehicleColor}
            onChange={(event) => setVehicleColor(event.target.value)}
            placeholder={language === 'ar' ? 'أدخل لون السيارة...' : 'Enter vehicle color...'}
            className={styles.editingInput}
          />
        </div>
      </EditableField>
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
      <EditableField
        label={t('affiliationTypeLabel')}
        value={getAffiliationLabel(affiliationType)}
        originalValue={getAffiliationLabel(savedSnapshotRef.current.affiliationType)}
        isEditing={isFieldEditing('affiliationType')}
        isSaving={isSaving}
        onEdit={() => startEditingField('affiliationType')}
        onSave={handleFieldSave}
        onCancel={() => {
          setAffiliationType(savedSnapshotRef.current.affiliationType || 'independent');
          stopEditingField('affiliationType');
        }}
      >
        <select
          value={affiliationType || 'independent'}
          onChange={(event) => {
            const nextType = event.target.value;
            setAffiliationType(nextType);
            if (nextType === 'independent') {
              setBusinessName('');
              setCompanyCode('');
              setOfficePhone('');
              setSideId('');
            }
          }}
          className={styles.editingInput}
        >
          <option value="smart-app" className={styles.selectOption}>{t('affiliationSmartApp')}</option>
          <option value="office-taxi" className={styles.selectOption}>{t('affiliationOfficeTaxi')}</option>
          <option value="independent" className={styles.selectOption}>{t('affiliationIndependent')}</option>
        </select>
      </EditableField>

      <DriverVehicleAffiliation state={state} firstString={firstString} />
      <DriverVehicleSocial state={state} firstString={firstString} />
    </Panel>
  );
}
