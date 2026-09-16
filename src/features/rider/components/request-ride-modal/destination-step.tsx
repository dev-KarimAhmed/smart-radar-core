import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { useTranslations } from 'next-intl';
import { styles } from './request-modal-shared';

interface DestinationStepProps {
  selectedDestination: any;
  destinationOptions: any[];
  resetLocationMetrics: () => void;
  setDropoff: (val: string) => void;
  setPickup: (val: string) => void;
}

export function DestinationStep({
  selectedDestination,
  destinationOptions,
  resetLocationMetrics,
  setDropoff,
  setPickup,
}: DestinationStepProps) {
  const t = useTranslations('requestRide');

  return (
    <div className={styles.style64_7}>
      <Label className={styles.style65_8}>
        <span>{t('step1Title')}</span>
      </Label>
      <div className={styles.style68_9}>
        <Select
          value={selectedDestination?.governorate || ''}
          onValueChange={(governorate) => {
            const option = destinationOptions.find((item) => item.governorate === governorate);
            if (!option) return;
            resetLocationMetrics();
            setDropoff(option.label);
            setPickup(option.coords);
          }}
        >
          <SelectTrigger className={styles.style79_10}>
            <SelectValue placeholder={t('governorate')} />
          </SelectTrigger>
          <SelectContent className={styles.style82_11}>
            {[...new Set(destinationOptions.map((item) => item.governorate))].map((governorate) => (
              <SelectItem key={governorate} value={governorate}>{governorate}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={selectedDestination?.id || ''}
          onValueChange={(id) => {
            const option = destinationOptions.find((item) => item.id === id);
            if (!option) return;
            resetLocationMetrics();
            setDropoff(option.label);
            setPickup(option.coords);
          }}
        >
          <SelectTrigger className={styles.style99_12}>
            <SelectValue placeholder={t('district')} />
          </SelectTrigger>
          <SelectContent className={styles.style102_13}>
            {destinationOptions.map((option) => (
              <SelectItem key={option.id} value={option.id}>{option.district}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
