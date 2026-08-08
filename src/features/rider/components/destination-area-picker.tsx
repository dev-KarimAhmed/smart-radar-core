'use client';

import React from 'react';
import { MapPin } from 'lucide-react';
import { useTranslations } from 'next-intl';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { DistrictOption, GovernorateOption } from '../services/rider-destination-normalizers';

const styles = {
  section: "rounded-2xl border border-white/10 bg-[#111827]/80 p-3 shadow-lg shadow-black/15",
  header: "mb-3 flex items-start gap-2.5",
  icon: "flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[#14B8A6]/12 text-[#14F5D5]",
  iconGlyph: "h-4 w-4",
  headerText: "min-w-0",
  title: "text-xs font-black text-white",
  subtitle: "mt-0.5 text-[10px] leading-relaxed text-slate-400",
  grid: "grid grid-cols-2 gap-2",
  field: "min-w-0 space-y-1.5",
  fieldLabel: "block text-[10px] font-black text-slate-400",
  trigger: "h-11 w-full min-w-0 rounded-xl border border-white/10 bg-black/35 px-3 text-xs font-black text-white outline-none transition focus:outline-none focus:ring-0 focus:ring-offset-0 focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-offset-0 data-[state=open]:outline-none data-[state=open]:ring-0 data-[state=open]:ring-offset-0",
  content: "border-white/10 bg-[#0F172A] text-white shadow-2xl shadow-black/40",
  item: "cursor-pointer rounded-lg py-2.5 text-xs font-black text-slate-200 focus:bg-[#14B8A6]/15 focus:text-[#14F5D5] data-[state=checked]:bg-[#14B8A6]/10 data-[state=checked]:text-[#14F5D5]",
} as const;

export interface DestinationAreaPickerProps {
  isArabic: boolean;
  destinationGovernorates: GovernorateOption[];
  destinationDistricts: DistrictOption[];
  selectedGovernorateId: string;
  selectedDistrictId: string;
  isLoadingGovernorates: boolean;
  isLoadingDistricts: boolean;
  onGovernorateChange: (governorateId: string) => void;
  onDistrictChange: (districtId: string) => void;
}

export function DestinationAreaPicker({
  isArabic,
  destinationGovernorates,
  destinationDistricts,
  selectedGovernorateId,
  selectedDistrictId,
  isLoadingGovernorates,
  isLoadingDistricts,
  onGovernorateChange,
  onDistrictChange,
}: DestinationAreaPickerProps) {
  const locationCopy = useTranslations('location');
  const t = useTranslations('riderView');

  return (
    <section className={styles.section}>
      <div className={styles.header}>
        <span className={styles.icon}>
          <MapPin className={styles.iconGlyph} />
        </span>
        <div className={styles.headerText}>
          <h3 className={styles.title}>{locationCopy('area_title')}</h3>
          <p className={styles.subtitle}>{locationCopy('area_helper')}</p>
        </div>
      </div>

      <div className={styles.grid}>
        <div className={styles.field}>
          <span id="destination-governorate-label" className={styles.fieldLabel}>{t('destination.governorate')}</span>
          <Select
            value={selectedGovernorateId}
            onValueChange={onGovernorateChange}
            disabled={isLoadingGovernorates || destinationGovernorates.length === 0}
          >
            <SelectTrigger aria-labelledby="destination-governorate-label" className={styles.trigger}>
              <SelectValue placeholder={isLoadingGovernorates ? t('destination.loading') : t('destination.noGovernorates')} />
            </SelectTrigger>
            <SelectContent className={styles.content}>
              <SelectGroup>
                {destinationGovernorates.map((governorate) => (
                  <SelectItem key={governorate.id} value={governorate.id} className={styles.item}>
                    {isArabic ? governorate.nameAr || governorate.nameEn : governorate.nameEn || governorate.nameAr}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>

        <div className={styles.field}>
          <span id="destination-district-label" className={styles.fieldLabel}>{t('destination.district')}</span>
          <Select
            value={selectedDistrictId}
            onValueChange={onDistrictChange}
            disabled={isLoadingDistricts || destinationDistricts.length === 0}
          >
            <SelectTrigger aria-labelledby="destination-district-label" className={styles.trigger}>
              <SelectValue placeholder={isLoadingDistricts ? t('destination.loading') : t('destination.noDistricts')} />
            </SelectTrigger>
            <SelectContent className={styles.content}>
              <SelectGroup>
                {destinationDistricts.map((destination) => (
                  <SelectItem
                    key={destination.id}
                    value={destination.id}
                    disabled={!destination.anchor}
                    className={styles.item}
                  >
                    {isArabic ? destination.districtAr || destination.districtEn : destination.districtEn || destination.districtAr}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>
      </div>
    </section>
  );
}
