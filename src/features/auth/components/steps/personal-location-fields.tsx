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
import { styles } from './personal-step.styles';
import { PersonalStepField } from './personal-step-field';

interface LocationOption {
  id: string;
  label: string;
  labelEn: string;
  value?: string;
}

interface PersonalLocationFieldsProps {
  isArabic: boolean;
  country: string;
  gov: string;
  district: string;
  onChangeCountry: (country: string) => void;
  onChangeGov: (gov: string) => void;
  onChangeDistrict: (district: string) => void;
  countries: LocationOption[];
  governorates: LocationOption[];
  districts: (LocationOption & { value: string })[];
  locationDataLoading: boolean;
  countryLabel: string;
  countryPlaceholder: string;
  governorateLabel: string;
  governoratePlaceholder: string;
  districtLabel: string;
  districtPlaceholder: string;
}

export function PersonalLocationFields({
  isArabic,
  country,
  gov,
  district,
  onChangeCountry,
  onChangeGov,
  onChangeDistrict,
  countries,
  governorates,
  districts,
  locationDataLoading,
  countryLabel,
  countryPlaceholder,
  governorateLabel,
  governoratePlaceholder,
  districtLabel,
  districtPlaceholder,
}: PersonalLocationFieldsProps) {
  return (
    <div className={styles.style652_87}>
      <PersonalStepField label={countryLabel} icon={<MapPin className={styles.style653_88} />}>
        <Select
          dir={isArabic ? 'rtl' : 'ltr'}
          value={country}
          onValueChange={onChangeCountry}
          disabled={locationDataLoading && !countries.length}
        >
          <SelectTrigger className={styles.customSelectTrigger}>
            <SelectValue placeholder={locationDataLoading && !countries.length ? '...' : countryPlaceholder} />
          </SelectTrigger>
          <SelectContent className={styles.customSelectContent}>
            {countries.map((item) => (
              <SelectItem key={item.id} value={item.id} className={styles.customSelectItem}>
                {isArabic ? item.label : item.labelEn}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </PersonalStepField>

      <PersonalStepField label={governorateLabel} icon={<MapPin className={styles.style679_96} />}>
        <Select
          dir={isArabic ? 'rtl' : 'ltr'}
          value={gov}
          onValueChange={onChangeGov}
          disabled={!country || locationDataLoading}
        >
          <SelectTrigger className={styles.customSelectTrigger}>
            <SelectValue placeholder={locationDataLoading ? '...' : governoratePlaceholder} />
          </SelectTrigger>
          <SelectContent className={styles.customSelectContent}>
            {governorates.map((item) => (
              <SelectItem key={item.id} value={item.id} className={styles.customSelectItem}>
                {isArabic ? item.label : item.labelEn}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </PersonalStepField>

      <PersonalStepField label={districtLabel} icon={<MapPin className={styles.style705_104} />}>
        <Select
          dir={isArabic ? 'rtl' : 'ltr'}
          value={district}
          onValueChange={onChangeDistrict}
          disabled={!gov || locationDataLoading}
        >
          <SelectTrigger className={styles.customSelectTrigger}>
            <SelectValue placeholder={locationDataLoading ? '...' : districtPlaceholder} />
          </SelectTrigger>
          <SelectContent className={styles.customSelectContent}>
            {districts.map((item) => (
              <SelectItem key={item.id} value={item.value} className={styles.customSelectItem}>
                {isArabic ? item.label : item.labelEn}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </PersonalStepField>
    </div>
  );
}
