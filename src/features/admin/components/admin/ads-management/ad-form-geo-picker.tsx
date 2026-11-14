import React, { useMemo } from 'react';
import { Control, Controller } from 'react-hook-form';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { jordanGovernorates, getDistrictsByGovernorate } from '@/lib/data';
import type { AdInput } from '@/core/types';
import { styles } from './ads-management-styles';

interface AdFormGeoPickerProps {
  control: Control<AdInput>;
  selectedGov?: string;
  t: (key: string) => string;
}

export function AdFormGeoPicker({ control, selectedGov, t }: AdFormGeoPickerProps) {
  const districts = useMemo(() => (selectedGov ? getDistrictsByGovernorate(selectedGov) : []), [selectedGov]);

  return (
    <div className={styles.style142_14}>
      <div className={styles.style143_15}>
        <Label>{t('form.govLabel')}</Label>
        <Controller
          control={control}
          name="geo.governorate"
          render={({ field }) => (
            <Select onValueChange={field.onChange} defaultValue={field.value}>
              <SelectTrigger>
                <SelectValue placeholder={t('form.allGovs')} />
              </SelectTrigger>
              <SelectContent>
                {jordanGovernorates.map((g) => (
                  <SelectItem key={g} value={g}>
                    {g}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        />
      </div>
      <div className={styles.style156_16}>
        <Label>{t('form.districtLabel')}</Label>
        <Controller
          control={control}
          name="geo.district"
          render={({ field }) => (
            <Select onValueChange={field.onChange} defaultValue={field.value} disabled={!selectedGov}>
              <SelectTrigger>
                <SelectValue placeholder={t('form.allDistricts')} />
              </SelectTrigger>
              <SelectContent>
                {districts.map((d) => (
                  <SelectItem key={d} value={d}>
                    {d}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        />
      </div>
    </div>
  );
}

