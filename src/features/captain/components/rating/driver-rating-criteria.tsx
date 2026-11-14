import React from 'react';
import { ThumbsDown, ThumbsUp } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { styles } from './driver-rating-modal.styles';
import { CriterionVerdict, RiderRatingKey } from './driver-rating-modal.types';

interface DriverRatingCriteriaProps {
  rider: Record<RiderRatingKey, CriterionVerdict>;
  onSelect: (key: RiderRatingKey, verdict: Exclude<CriterionVerdict, null>) => void;
  copy: {
    riderSection: string;
    criteriaHint: string;
    riderRespect: string;
    riderPunctuality: string;
    riderCleanliness: string;
    riderCommunication: string;
    riderCooperation: string;
  };
}

export function DriverRatingCriteria({
  rider,
  onSelect,
  copy,
}: DriverRatingCriteriaProps) {
  const criteria = [
    { key: 'respect' as const, label: copy.riderRespect },
    { key: 'punctuality' as const, label: copy.riderPunctuality },
    { key: 'cleanliness' as const, label: copy.riderCleanliness },
    { key: 'communication' as const, label: copy.riderCommunication },
    { key: 'cooperation' as const, label: copy.riderCooperation },
  ];

  return (
    <div className={styles.criteriaSection}>
      <Label className={styles.criteriaLabel}>{copy.riderSection}</Label>
      <div className={styles.criteriaList}>
        {criteria.map((item) => {
          const verdict = rider[item.key];
          return (
            <div key={item.key} className={styles.criteriaRow}>
              <span className={styles.criteriaItemLabel}>{item.label}</span>
              <div className={styles.criteriaVerdicts}>
                <button
                  type="button"
                  onClick={() => onSelect(item.key, 'up')}
                  className={cn(
                    styles.criteriaButton,
                    verdict === 'up' ? styles.criteriaUpActive : styles.criteriaIdle,
                  )}
                  aria-pressed={verdict === 'up'}
                  aria-label={item.label}
                >
                  <ThumbsUp className={styles.criteriaIcon} />
                </button>
                <button
                  type="button"
                  onClick={() => onSelect(item.key, 'down')}
                  className={cn(
                    styles.criteriaButton,
                    verdict === 'down' ? styles.criteriaDownActive : styles.criteriaIdle,
                  )}
                  aria-pressed={verdict === 'down'}
                  aria-label={item.label}
                >
                  <ThumbsDown className={styles.criteriaIcon} />
                </button>
              </div>
            </div>
          );
        })}
      </div>
      <p className={styles.criteriaHint}>{copy.criteriaHint}</p>
    </div>
  );
}

