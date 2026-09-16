export const styles = {
  style99_1: "bg-muted/30 border-border transition-all hover:border-primary",
  style99_2: "relative border-primary/40 animate-pulse-slow",
  style100_3: "space-y-3 p-4",
  style101_4: "flex items-center gap-3",
  style102_5: "h-12 w-12 border-2 border-border",
  style106_6: "min-w-0 flex-1",
  style107_7: "flex flex-wrap items-center gap-2",
  style108_8: "font-bold text-white",
  style110_9: "inline-flex items-center gap-1 rounded-full border border-emerald-300/40 bg-emerald-400/12 px-2 py-0.5 text-[10px] font-black text-emerald-300 shadow-[0_0_18px_rgba(52,211,153,0.18)]",
  style111_10: "h-3.5 w-3.5 fill-emerald-300 text-emerald-300",
  style120_11: "rounded-full border border-amber-600/30 bg-amber-900/20 px-2 py-0.5 text-[10px] font-black text-amber-600 backdrop-blur-md",
  style126_12: "animate-pulse rounded-full border border-yellow-400/40 bg-yellow-900/30 px-2 py-0.5 text-[10px] font-black text-yellow-400 backdrop-blur-md",
  style132_13: "animate-bounce-slow rounded-full border border-[#14B8A6]/40 bg-teal-950/40 px-2 py-0.5 text-[10px] font-black tracking-wide text-[#14B8A6] backdrop-blur-md",
  style139_14: "rounded-full border border-slate-400/30 bg-slate-800/20 px-2 py-0.5 text-[10px] font-black text-slate-400 backdrop-blur-md",
  style147_15: "flex flex-wrap items-center gap-2 text-xs text-muted-foreground",
  style148_16: "flex items-center gap-1",
  style149_17: "h-3 w-3 fill-current text-yellow-400",
  style150_18: "font-bold text-white",
  style152_19: "h-3",
  style156_20: "h-3",
  style157_21: "px-2 py-0 text-[10px] font-black",
  style165_22: "text-left",
  style166_23: "text-xs text-muted-foreground",
  style168_24: "bg-yellow-400/10 text-sm text-yellow-300",
  style172_25: "text-xl font-black text-primary",
  style173_26: "text-xs",
  style180_27: "grid grid-cols-2 gap-3 bg-white/5 rounded-xl p-3 border border-white/5",
  style181_28: "flex items-center gap-2",
  style182_29: "h-4 w-4 text-slate-400",
  style183_30: "text-slate-400 text-xs",
  style187_31: "flex items-center gap-2",
  style188_32: "h-4 w-4 text-[#14B8A6] animate-pulse",
  style189_33: "text-[#14B8A6] font-bold text-xs",
  style196_34: "space-y-2",
  style197_35: "rounded-md border border-red-500/20 bg-red-500/10 p-2 text-center text-[11px] font-bold text-red-400",
  style207_36: "h-[230px] rounded-3xl",
  style217_37: "flex items-center justify-between gap-2 rounded-md bg-black/20 p-2 text-xs text-muted-foreground",
  style221_38: "h-auto p-1 text-xs",
  style222_39: "ml-1 h-3 w-3",
  style229_40: "bg-teal-500/10 border border-teal-500/20 rounded-xl p-2.5 flex items-center justify-between",
  style230_41: "text-slate-400 text-xs",
  style231_42: "flex items-center gap-1.5",
  style232_43: "text-white font-bold text-sm",
  style233_44: "h-3.5 w-3.5 text-white",
  style238_45: "h-12 w-full bg-primary font-bold hover:bg-primary/90",
  style239_46: "animate-spin",
  style285_47: "flex min-h-screen animate-in items-center justify-center p-4 fade-in",
  style286_48: "w-full max-w-md border-border bg-card shadow-2xl",
  style287_49: "border-b border-border p-4 text-center",
  style288_50: "flex items-center justify-center gap-2 text-xl font-bold text-white",
  style289_51: "h-6 w-6 text-primary",
  style292_52: "mt-1 text-sm text-muted-foreground",
  style297_53: "h-[60vh]",
  style298_54: "space-y-4 p-4",
  style312_55: "border-t border-border p-4",
  style313_56: "w-full",
  style314_57: "animate-spin",
  style316_58: "ml-2",
} as const;

export const getRankBadge = (rank: 'Platinum' | 'Gold' | 'Silver' | 'Bronze', t: any) => {
  switch (rank) {
    case 'Platinum':
      return { label: t('rankPlatinum'), className: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20' };
    case 'Gold':
      return { label: t('rankGold'), className: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20' };
    case 'Silver':
      return { label: t('rankSilver'), className: 'bg-slate-500/10 text-slate-400 border-slate-500/20' };
    case 'Bronze':
    default:
      return { label: t('rankBronze'), className: 'bg-orange-500/10 text-orange-400 border-orange-500/20' };
  }
};

export const getBenefitAdImage = 'https://images.unsplash.com/photo-1556741533-6e6a62bd8b49?auto=format&fit=crop&q=80&w=1200';
