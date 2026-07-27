import { Loader2 } from 'lucide-react';

const styles = {
  root: 'flex min-h-[12rem] flex-col items-center justify-center gap-4 rounded-2xl border border-white/[0.06] bg-[#0F172A]/60 p-8 text-center text-white backdrop-blur-md',
  icon: 'h-8 w-8 animate-spin text-[#14B8A6]',
  label: 'text-xs font-bold text-[#94A3B8]',
} as const;

export function RouteLoading({ label }: { label: string }) {
  return (
    <div className={styles.root} data-route-loading>
      <Loader2 className={styles.icon} aria-hidden="true" />
      <p className={styles.label}>{label}</p>
    </div>
  );
}
