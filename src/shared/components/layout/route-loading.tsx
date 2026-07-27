import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

const styles = {
  root: 'flex flex-col items-center justify-center space-y-4 rounded-2xl border border-white/[0.06] bg-[#0F172A]/60 p-8 text-center text-white backdrop-blur-md',
  fullscreen: 'min-h-screen w-full bg-[#0A0F1D]',
  inline: 'animate-pulse',
  icon: 'h-8 w-8 animate-spin text-[#14B8A6]',
  label: 'text-xs font-bold text-[#94A3B8]',
} as const;

export function RouteLoading({ fullscreen = false, label }: { fullscreen?: boolean; label: string }) {
  return (
    <div className={cn(styles.root, fullscreen ? styles.fullscreen : styles.inline)} data-route-loading>
      <Loader2 className={styles.icon} aria-hidden="true" />
      <p className={styles.label}>{label}</p>
    </div>
  );
}
