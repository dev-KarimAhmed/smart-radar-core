import React from 'react';
import { motion } from 'framer-motion';
import { Construction, type LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { styles } from './role-step.styles';

interface RoleStepCardProps {
  roleKey: string;
  Icon: LucideIcon;
  title: string;
  description: string;
  underDevelopmentLabel: string;
  disabled?: boolean;
  isArabic: boolean;
  index: number;
  onSelect: () => void;
}

export function RoleStepCard({
  roleKey,
  Icon,
  title,
  description,
  underDevelopmentLabel,
  disabled,
  isArabic,
  index,
  onSelect,
}: RoleStepCardProps) {
  return (
    <motion.button
      layout
      key={roleKey}
      type="button"
      disabled={disabled}
      aria-disabled={disabled}
      onClick={() => {
        if (!disabled) {
          onSelect();
        }
      }}
      initial={{ opacity: 0, y: 24, scale: 0.96 }}
      animate={{ opacity: disabled ? 0.55 : 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 12, scale: 0.94 }}
      transition={{ duration: 0.32, delay: index * 0.035, ease: 'easeOut' }}
      whileHover={disabled ? undefined : { scale: 1.05, y: -5 }}
      whileTap={disabled ? undefined : { scale: 0.985 }}
      className={cn(
        styles.style348_22,
        isArabic ? styles.style349_23 : styles.style349_24,
        disabled && 'cursor-not-allowed opacity-55 bg-[#161F30]/30 border-white/5 hover:border-white/5 hover:shadow-none select-none pointer-events-none sm:pointer-events-auto'
      )}
    >
      <div className={styles.style352_25}>
        <div className="flex w-full items-center justify-between gap-2">
          <span
            className={cn(
              styles.style353_26,
              disabled && 'border-slate-700/40 bg-slate-800/30 text-slate-500 group-hover:border-slate-700/40 group-hover:bg-slate-800/30'
            )}
          >
            <Icon aria-hidden="true" className={styles.style354_27} strokeWidth={1.8} />
          </span>

          {disabled && (
            <span className="inline-flex items-center gap-1 rounded-full border border-amber-500/30 bg-amber-500/15 px-2 py-0.5 text-[10px] font-black text-amber-300 shadow-[0_0_12px_rgba(245,158,11,0.15)]">
              <Construction className="h-3 w-3 text-amber-400" />
              <span>{underDevelopmentLabel}</span>
            </span>
          )}
        </div>

        <span className={cn(styles.style357_28, disabled && 'text-slate-400')}>
          {title}
        </span>
      </div>

      <span className={cn(styles.style362_29, disabled && 'text-slate-500')}>
        {description}
      </span>
    </motion.button>
  );
}
