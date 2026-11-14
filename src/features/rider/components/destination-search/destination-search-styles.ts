export const styles = {
  section: "space-y-3 rounded-2xl border border-white/10 bg-[#111827]/80 p-3 shadow-lg shadow-black/15",
  step1Header: "mb-2 flex items-start gap-2.5",
  stepBadge: "flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#14B8A6]/15 text-xs font-black text-[#14F5D5]",
  stepTitle: "text-xs font-black text-white",
  stepHelper: "mt-1 text-[11px] leading-relaxed text-slate-400",
  searchButton: "flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#14B8A6] px-4 text-sm font-black text-[#031315] transition hover:bg-[#2DD4BF] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#14F5D5] disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer shadow-md shadow-[#14B8A6]/15 active:scale-[0.98]",
  searchButtonIcon: "h-4 w-4 shrink-0",
  step2Wrapper: "border-t border-white/8 pt-3",
  step2Header: "mb-2 flex items-start gap-2.5",
  confirmButton: "flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-[#14B8A6]/35 bg-[#14B8A6]/12 px-3 py-2.5 text-[11px] font-bold text-[#BFFCF2] transition-all duration-300 hover:bg-[#14B8A6]/20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#14F5D5] disabled:cursor-not-allowed disabled:opacity-60 cursor-pointer active:scale-[0.98]",
  confirmButtonLoadingIcon: "h-4 w-4 animate-spin",
  confirmButtonIcon: "h-4 w-4 text-[#14F5D5] shrink-0",
} as const;

