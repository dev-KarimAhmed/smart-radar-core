import React from 'react';
import { motion } from 'framer-motion';
import { Sparkles, type LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { styles } from './role-step.styles';

interface RoleStepCardProps {
  roleKey: string;
  Icon: LucideIcon;
  title: string;
  description: string;
  badgeLabel?: string;
  isArabic: boolean;
  index: number;
  onSelect: () => void;
}

export function RoleStepCard({
  roleKey,
  Icon,
  title,
  description,
  badgeLabel,
  isArabic,
  index,
  onSelect,
}: RoleStepCardProps) {
  return (
    <motion.button
      layout
      key={roleKey}
      type="button"
      onClick={onSelect}
      initial={{ opacity: 0, y: 24, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 12, scale: 0.94 }}
      transition={{ duration: 0.32, delay: index * 0.035, ease: 'easeOut' }}
      whileHover={{ scale: 1.05, y: -5 }}
      whileTap={{ scale: 0.985 }}
      className={cn(
        styles.style348_22,
        isArabic ? styles.style349_23 : styles.style349_24,
      )}
    >
      <div className={styles.style352_25}>
        <div className="flex w-full items-center justify-between gap-2">
          <span className={styles.style353_26}>
            <Icon aria-hidden="true" className={styles.style354_27} strokeWidth={1.8} />
          </span>

          {badgeLabel && (
            <span className="inline-flex items-center gap-1 rounded-full border border-teal-400/40 bg-teal-500/15 px-2.5 py-0.5 text-[10px] font-black text-[#14F5D5] shadow-[0_0_12px_rgba(20,245,213,0.18)]">
              <Sparkles className="h-3 w-3 text-[#14F5D5]" />
              <span>{badgeLabel}</span>
            </span>
          )}
        </div>

        <span className={styles.style357_28}>
          {title}
        </span>
      </div>

      <span className={styles.style362_29}>
        {description}
      </span>
    </motion.button>
  );
}
