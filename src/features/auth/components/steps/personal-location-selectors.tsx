'use client';

import React from 'react';
import { MapPin } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { styles } from './personal-step-constants';
import { Field } from './personal-step-field';
import type { LocationOption, PersonalRegistrationState } from '../../types/registration-types';

interface PersonalLocationSelectorsProps {
  isArabic: boolean;
  t: {
    country: string;
    countryPlaceholder: string;
    governorate: string;
    governoratePlaceholder: string;
    district: string;
    districtPlaceholder: string;
  };
  personal: PersonalRegistrationState;
  setPersonal: React.Dispatch<React.SetStateAction<PersonalRegistrationState>>;
  locationDataLoading: boolean;
  countries: LocationOption[];
  governorates: LocationOption[];
  districts: LocationOption[];
}

export function PersonalLocationSelectors({
  isArabic,
  t,
  personal,
  setPersonal,
  locationDataLoading,
  countries,
  governorates,
  districts,
}: PersonalLocationSelectorsProps) {
  return (
    <div className={styles.style652_87}>
      <Field label={t.country} icon={<MapPin className={styles.style653_88} />}>
        <Select
          dir={isArabic ? 'rtl' : 'ltr'}
          value={personal.country}
          onValueChange={(value) => setPersonal((prev) => ({ ...prev, country: value, gov: '', district: '' }))}
          disabled={locationDataLoading && !countries.length}
        >
          <SelectTrigger className={styles.customSelectTrigger}>
            <SelectValue placeholder={locationDataLoading && !countries.length ? '...' : t.countryPlaceholder} />
          </SelectTrigger>
          <SelectContent className={styles.customSelectContent}>
            {countries.map((country) => (
              <SelectItem key={country.id} value={country.id} className={styles.customSelectItem}>
                {isArabic ? country.label : country.labelEn}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Field>

      <Field label={t.governorate} icon={<MapPin className={styles.style679_96} />}>
        <Select
          dir={isArabic ? 'rtl' : 'ltr'}
          value={personal.gov}
          onValueChange={(value) => setPersonal((prev) => ({ ...prev, gov: value, district: '' }))}
          disabled={!personal.country || locationDataLoading}
        >
          <SelectTrigger className={styles.customSelectTrigger}>
            <SelectValue placeholder={locationDataLoading ? '...' : t.governoratePlaceholder} />
          </SelectTrigger>
          <SelectContent className={styles.customSelectContent}>
            {governorates.map((gov) => (
              <SelectItem key={gov.id} value={gov.id} className={styles.customSelectItem}>
                {isArabic ? gov.label : gov.labelEn}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Field>

      <Field label={t.district} icon={<MapPin className={styles.style705_104} />}>
        <Select
          dir={isArabic ? 'rtl' : 'ltr'}
          value={personal.district}
          onValueChange={(value) => setPersonal((prev) => ({ ...prev, district: value }))}
          disabled={!personal.gov || locationDataLoading}
        >
          <SelectTrigger className={styles.customSelectTrigger}>
            <SelectValue placeholder={locationDataLoading ? '...' : t.districtPlaceholder} />
          </SelectTrigger>
          <SelectContent className={styles.customSelectContent}>
            {districts.map((district) => (
              <SelectItem key={district.id} value={district.value} className={styles.customSelectItem}>
                {isArabic ? district.label : district.labelEn}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Field>
    </div>
  );
}
