import React from 'react';
import { ShieldCheck, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { styles } from './offer-card-styles';
import type { CaptainProfile } from './offer-card-types';

export * from './offer-card-styles';
export * from './offer-card-types';
export * from './offer-card-utils';

export function CaptainAvatar({ captain, captainName }: { captain: CaptainProfile; captainName: string }) {
  if (captain.avatar_url) {
    return (
      <img
        src={captain.avatar_url}
        alt={captainName}
        className={styles.avatarImg}
      />
    );
  }

  return (
    <div className={styles.avatarFallback}>
      <ShieldCheck className={styles.avatarFallbackIcon} />
    </div>
  );
}

export function SectionHeader({
  icon,
  title,
  isOpen,
  onToggle,
}: {
  icon: React.ReactNode;
  title: string;
  isOpen?: boolean;
  onToggle?: () => void;
}) {
  if (onToggle) {
    return (
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={isOpen}
        className={styles.sectionHeaderButton}
      >
        <span className={styles.sectionHeaderTitleWrap}>
          {icon}
          <span>{title}</span>
        </span>
        <span className={styles.sectionHeaderLine} />
        <span className={styles.sectionChevronWrap}>
          <ChevronDown
            className={cn(
              styles.sectionChevron,
              isOpen ? styles.sectionChevronOpen : styles.sectionChevronClosed,
            )}
          />
        </span>
      </button>
    );
  }

  return (
    <div className={styles.sectionHeader}>
      {icon}
      <span>{title}</span>
      <span className={styles.sectionHeaderLine} />
    </div>
  );
}

export function InfoRow({
  icon,
  label,
  value,
  helper,
  highlight = false,
  fullWidth = false,
}: {
  icon?: React.ReactNode;
  label: string;
  value?: string;
  helper?: string;
  highlight?: boolean;
  fullWidth?: boolean;
}) {
  return (
    <div className={cn(styles.infoRow, fullWidth ? styles.infoRowFullWidth : '')}>
      <p className={styles.infoRowLabel}>
        {icon ? <span className={highlight ? styles.infoRowLabelIconHighlight : styles.infoRowLabelIconPlain}>{icon}</span> : null}
        {label}
      </p>
      <p className={cn(styles.infoRowValue, highlight ? styles.infoRowValueHighlight : styles.infoRowValuePlain)}>{value}</p>
      {helper ? <p className={styles.infoRowHelper}>{helper}</p> : null}
    </div>
  );
}

export function BreakdownRow({
  label,
  helper,
  value,
  accent = false,
  strong = false,
}: {
  label: string;
  helper?: string;
  value: string;
  accent?: boolean;
  strong?: boolean;
}) {
  return (
    <div className={styles.breakdownRow}>
      <span className={styles.breakdownLabelWrap}>
        <span className={strong ? styles.breakdownLabelStrong : styles.breakdownLabelPlain}>{label}</span>
        {helper ? <span className={styles.breakdownHelper}>{helper}</span> : null}
      </span>
      <strong
        className={cn(
          styles.breakdownValue,
          accent ? styles.breakdownValueAccent : styles.breakdownValuePlain,
          strong ? styles.breakdownValueStrong : '',
        )}
        dir="ltr"
      >
        {value}
      </strong>
    </div>
  );
}
