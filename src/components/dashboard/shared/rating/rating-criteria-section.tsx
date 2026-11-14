import React from 'react';
import { ThumbsDown, ThumbsUp } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { styles } from './rating-modal-styles';
import { CriterionVerdict } from './rating-types';

export function RatingCriteriaSection<T extends string>({
  title,
  hint,
  items,
  values,
  accent,
  onSelect,
}: {
  title: string;
  hint: string;
  items: Array<{ key: T; label: string }>;
  values: Record<T, CriterionVerdict>;
  accent: 'amber' | 'teal';
  onSelect: (key: T, verdict: Exclude<CriterionVerdict, null>) => void;
}) {
  const upActiveClass = accent === 'amber' ? styles.activeAmber : styles.activeTeal;

  return (
    <div className={styles.style349_33}>
      <Label className={styles.style350_34}>{title}</Label>
      <div className={styles.style351_35}>
        {items.map((item) => {
          const verdict = values[item.key];

          return (
            <div key={item.key} className={styles.style359_36}>
              <span className={styles.style368_40}>{item.label}</span>
              <div className={styles.style370_41}>
                <button
                  type="button"
                  onClick={() => onSelect(item.key, 'up')}
                  className={cn(styles.style372_42, verdict === 'up' ? upActiveClass : styles.style376_44)}
                  aria-pressed={verdict === 'up'}
                  aria-label={item.label}
                >
                  <ThumbsUp className={styles.style374_43} />
                </button>
                <button
                  type="button"
                  onClick={() => onSelect(item.key, 'down')}
                  className={cn(styles.style372_42, verdict === 'down' ? styles.style378_45 : styles.style376_44)}
                  aria-pressed={verdict === 'down'}
                  aria-label={item.label}
                >
                  <ThumbsDown className={styles.style374_43} />
                </button>
              </div>
            </div>
          );
        })}
      </div>
      <p className={styles.style380_46}>{hint}</p>
    </div>
  );
}
