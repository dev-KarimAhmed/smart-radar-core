export const styles = {
  content:
    'max-w-[380px] w-[92vw] max-h-[85vh] overflow-y-auto rounded-2xl border border-[#14B8A6]/30 bg-[#0A0F1D]/95 text-white p-3.5 sm:p-4 shadow-2xl backdrop-blur-xl space-y-2.5',
  headerRow: 'flex items-center justify-between gap-2 border-b border-white/[0.08] pb-2',
  headerStart: 'flex items-center gap-2 min-w-0',
  headerIconWrap:
    'flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#14B8A6]/15 text-[#14F5D5] border border-[#14B8A6]/30',
  title: 'text-xs sm:text-sm font-black text-white truncate',
  subtitle: 'text-[9.5px] text-slate-400 font-medium leading-none mt-0.5',
  warningBanner: 'rounded-xl border border-amber-500/30 bg-amber-500/10 p-2 flex items-start gap-2',
  warningIcon: 'h-3.5 w-3.5 text-amber-400 shrink-0 mt-0.5',
  warningText: 'text-[9.5px] leading-relaxed text-amber-200/90 font-medium',
  cardList: 'space-y-1.5',
  permissionCard: 'rounded-xl border border-white/8 bg-white/[0.03] p-2.5 transition-colors',
  cardHeader: 'flex items-center justify-between gap-2',
  cardTitleWrap: 'flex items-center gap-2 min-w-0',
  cardIconWrap: 'flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-[#14B8A6]/15 text-[#14F5D5]',
  cardTitle: 'text-[11px] font-bold text-white leading-tight',
  cardDesc: 'text-[9px] text-slate-400 leading-tight',
  statusBadgeGranted:
    'inline-flex items-center gap-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 px-1.5 py-0.5 text-[9px] font-black text-emerald-300 shrink-0',
  statusBadgeDenied:
    'inline-flex items-center gap-1 rounded-full bg-rose-500/15 border border-rose-500/30 px-1.5 py-0.5 text-[9px] font-black text-rose-300 shrink-0',
  statusBadgePrompt:
    'inline-flex items-center gap-1 rounded-full bg-amber-500/15 border border-amber-500/30 px-1.5 py-0.5 text-[9px] font-black text-amber-300 shrink-0',
  inlineActionButton:
    'h-6 px-2.5 rounded-md bg-[#14B8A6] font-bold text-[10px] text-[#0A0F1D] hover:bg-[#2DD4BF] transition-all active:scale-[0.98] shrink-0',
  deniedBanner: 'rounded-xl border border-rose-500/25 bg-rose-500/10 p-2 flex items-start gap-2 text-slate-300',
  instructionsToggle:
    'w-full py-0.5 text-[9.5px] font-medium text-slate-400 hover:text-[#14F5D5] flex items-center justify-between transition-colors',
  instructionsPanel:
    'rounded-xl bg-black/50 border border-white/5 p-2 space-y-1 text-[9.5px] text-slate-300 leading-relaxed max-h-32 overflow-y-auto',
  footerActions: 'pt-1 flex items-center gap-2',
  refreshButton:
    'h-8.5 flex-1 rounded-xl border border-white/10 bg-white/5 font-bold text-[10.5px] text-white hover:bg-white/10 transition-all flex items-center justify-center gap-1.5',
  closeButton:
    'h-8.5 flex-1 rounded-xl bg-[#14B8A6] font-black text-[10.5px] text-[#0A0F1D] hover:bg-[#2DD4BF] transition-all active:scale-[0.98]',
} as const;

export type PermissionCheckStatus = 'checking' | 'granted' | 'prompt' | 'denied';

export type DetectedEnvironment =
  | 'telegram'
  | 'messenger'
  | 'facebook'
  | 'instagram'
  | 'whatsapp'
  | 'ios-safari'
  | 'android'
  | 'other';

export function getDetectedEnvironment(): DetectedEnvironment {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') return 'other';
  const ua = navigator.userAgent || '';
  const ref = typeof document !== 'undefined' ? document.referrer || '' : '';

  if (/Telegram/i.test(ua) || /t\.me/i.test(ref) || /telegram\.org/i.test(ref)) {
    return 'telegram';
  }
  if (/FBAN|FBAV|FB_IAB|Messenger/i.test(ua)) {
    return 'messenger';
  }
  if (/Instagram/i.test(ua)) {
    return 'instagram';
  }
  if (/WhatsApp/i.test(ua)) {
    return 'whatsapp';
  }

  const isIOS =
    /iPad|iPhone|iPod/.test(ua) ||
    (typeof navigator.platform === 'string' &&
      navigator.platform === 'MacIntel' &&
      navigator.maxTouchPoints > 1);

  if (isIOS) return 'ios-safari';
  if (/Android/i.test(ua)) return 'android';

  return 'other';
}
