export function calculateRiderRank(ratingSum?: number, ratingCount?: number): string {
  if (!ratingSum || !ratingCount) return 'Silver';
  const avg = ratingSum / ratingCount;
  if (avg >= 4.8) return 'Platinum';
  if (avg >= 4.3) return 'Gold';
  return 'Silver';
}

export function getRankTheme(rank?: 'Platinum' | 'Gold' | 'Silver' | 'Bronze' | string) {
  const normalized = String(rank || 'Silver').toLowerCase();

  switch (normalized) {
    case 'platinum':
      return {
        bg: 'bg-teal-500/15',
        color: 'text-teal-300',
        border: 'border-teal-500/40',
        glow: 'shadow-[0_0_12px_rgba(20,184,166,0.2)]',
        icon: 'ShieldAlert',
        label: 'بلاتيني',
      };
    case 'gold':
      return {
        bg: 'bg-amber-500/15',
        color: 'text-amber-300',
        border: 'border-amber-500/40',
        glow: 'shadow-[0_0_12px_rgba(245,158,11,0.2)]',
        icon: 'ShieldAlert',
        label: 'ذهبي',
      };
    case 'silver':
      return {
        bg: 'bg-slate-400/15',
        color: 'text-slate-200',
        border: 'border-slate-400/40',
        glow: 'shadow-none',
        icon: 'ShieldAlert',
        label: 'فضي',
      };
    case 'bronze':
    default:
      return {
        bg: 'bg-amber-800/20',
        color: 'text-amber-300',
        border: 'border-amber-700/40',
        glow: 'shadow-none',
        icon: 'ShieldAlert',
        label: 'برونزي',
      };
  }
}

