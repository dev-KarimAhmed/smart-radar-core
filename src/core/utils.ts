export function calculateRiderRank(ratingSum?: number, ratingCount?: number): string {
  if (!ratingSum || !ratingCount) return 'Silver';
  const avg = ratingSum / ratingCount;
  if (avg >= 4.8) return 'Platinum';
  if (avg >= 4.3) return 'Gold';
  return 'Silver';
}

export function getRankTheme(rank?: 'Platinum' | 'Gold' | 'Silver' | 'Bronze' | string) {
  switch (rank) {
    case 'Platinum':
      return {
        bg: 'bg-teal-500',
        color: 'text-teal-400',
        border: 'border-teal-500/50',
        glow: 'shadow-[0_0_15px_rgba(20,184,166,0.15)]',
        icon: 'ShieldAlert',
        label: 'بلاتيني',
      };
    case 'Gold':
      return {
        bg: 'bg-amber-500',
        color: 'text-amber-400',
        border: 'border-amber-500/50',
        glow: 'shadow-[0_0_15px_rgba(245,158,11,0.15)]',
        icon: 'ShieldAlert',
        label: 'ذهبي',
      };
    case 'Silver':
      return {
        bg: 'bg-slate-400',
        color: 'text-slate-300',
        border: 'border-slate-500/30',
        glow: 'shadow-none',
        icon: 'ShieldAlert',
        label: 'فضي',
      };
    case 'Bronze':
    default:
      return {
        bg: 'bg-amber-700',
        color: 'text-amber-600',
        border: 'border-amber-700/30',
        glow: 'shadow-none',
        icon: 'ShieldAlert',
        label: 'برونزي',
      };
  }
}

