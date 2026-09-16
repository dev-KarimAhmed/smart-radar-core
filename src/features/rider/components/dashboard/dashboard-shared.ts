import { sanitizeText } from '../../hooks/use-rider-dashboard-state';

export const styles = {
  style358_1: "radar-rider-container relative mx-auto max-w-xl overflow-hidden rounded-xl border border-[#14B8A6]/20 bg-[#0F172A]/70 p-5 text-white shadow-2xl shadow-black/40 backdrop-blur-xl md:p-6",
  style358_2: "text-right",
  style358_3: "text-left",
  style361_4: "mb-4 border-b border-white/10 pb-4",
  style362_5: "mb-3 text-base font-black text-[#14B8A6] md:text-lg",
  style363_6: "flex items-center justify-between rounded-xl border border-[#14B8A6]/20 bg-white/[0.04] p-4 backdrop-blur",
  style364_7: "text-[11px] font-bold text-gray-300",
  style366_8: "rounded-lg px-3 py-1 text-lg font-black md:text-xl",
  style377_9: "mt-2 flex items-start gap-2 rounded-lg border border-rose-500/20 bg-rose-500/10 p-2.5 text-[10px] text-[#ff3366]",
  style378_10: "h-3.5 w-3.5 shrink-0",
  style379_11: "font-bold",
  style386_12: "mb-5 flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-[#14B8A6]/30 bg-[#14B8A6]/10 text-xs font-black text-white hover:bg-[#14B8A6]/20",
  style388_13: "h-4 w-4 text-[#14B8A6]",
  style394_14: "mb-6 space-y-3",
  style395_15: "text-xs font-bold uppercase tracking-wide text-gray-400",
  style398_16: "rounded-xl border border-dashed border-white/10 bg-white/[0.03] p-5 text-center",
  style399_17: "mx-auto mb-2 h-5 w-5 text-gray-600",
  style400_18: "text-[11px] text-gray-500",
  style411_19: "relative space-y-3 rounded-xl border border-white/10 border-r-4 border-r-[#14B8A6] bg-white/[0.04] p-4 shadow-md backdrop-blur transition-all hover:border-[#14B8A6]/30",
  style415_20: "absolute left-3 top-3 rounded-md p-1.5 text-rose-500 transition-all hover:bg-neutral-900",
  style420_21: "h-5 w-5 transition-all duration-300",
  style421_22: "fill-[#14B8A6] text-[#14B8A6]",
  style421_23: "text-gray-400 hover:text-[#14B8A6]",
  style426_24: "space-y-1 pl-8 text-[12px] md:text-[13px]",
  style427_25: "text-gray-300",
  style429_26: "font-black text-white",
  style431_27: "text-[10px] text-amber-400",
  style434_28: "font-black text-amber-400",
  style437_29: "text-[11px] text-gray-400",
  style444_30: "inline-flex h-9 items-center justify-center gap-1.5 rounded-lg border border-[#14B8A6]/30 bg-[#14B8A6]/10 px-4 text-[11px] font-black text-[#14B8A6] transition-all hover:bg-[#14B8A6]/20",
  style447_31: "h-3.5 w-3.5",
  style451_32: "flex items-center gap-2 border-t border-white/10 pt-2",
  style457_33: "min-w-0 flex-1 rounded-lg border border-white/10 bg-black px-3 py-2 text-[11px] text-white placeholder:text-gray-600 focus:border-red-500 focus:outline-none",
  style457_34: "text-right",
  style457_35: "text-left",
  style462_36: "h-8 shrink-0 rounded-lg border border-red-500/20 bg-red-950/30 px-3 text-[10px] font-black text-red-400 hover:bg-red-900/40",
  style464_37: "ml-1 h-3 w-3",
  style469_38: "flex items-center justify-between text-[10px] text-gray-500",
  style470_39: "flex items-center gap-1 font-bold text-rose-500",
  style471_40: "h-3 w-3",
  style474_41: "font-mono text-[9px] text-gray-600",
  style482_42: "space-y-3 rounded-xl border border-white/[0.06] bg-[#0F172A]/40 p-4",
  style483_43: "flex items-center justify-between border-b border-white/10 pb-2 text-xs font-black uppercase tracking-wide text-[#14B8A6]",
  style485_44: "rounded-full bg-[#14B8A6]/10 px-2 py-0.5 font-mono text-[8px] text-[#14B8A6]",
  style491_45: "rounded-lg border border-dashed border-[#14B8A6]/10 bg-black/30 p-4 text-center",
  style492_46: "mx-auto mb-2 h-5 w-5 text-gray-600",
  style493_47: "text-[10px] leading-normal text-gray-400",
  style496_48: "grid grid-cols-1 gap-2.5",
  style498_49: "relative space-y-2 rounded-lg border border-[#14B8A6]/20 bg-black/80 p-3",
  style501_50: "absolute left-2 top-2 p-1 text-rose-500 transition-all hover:scale-105",
  style505_51: "h-3.5 w-3.5 opacity-70 hover:opacity-100",
  style508_52: "pl-6 text-[11px]",
  style509_53: "text-[12px] font-extrabold text-white",
  style511_54: "font-mono text-[9px] text-amber-400",
  style513_55: "text-[10px] leading-normal text-gray-400",
  style516_56: "flex items-center justify-between border-t border-white/10 pt-2",
  style517_57: "rounded border border-[#14B8A6]/10 bg-[#14B8A6]/10 px-1.5 py-0.5 text-[9px] font-bold text-[#14B8A6]",
  style522_58: "flex h-7 items-center gap-1 rounded-md border border-[#14B8A6]/20 bg-[#14B8A6] px-2.5 text-[10px] font-black text-[#031315] hover:bg-[#2DD4BF]",
  style525_59: "h-3 w-3",
  style535_60: "mt-6 space-y-3 rounded-xl border border-white/[0.06] bg-[#0F172A]/40 p-4",
  style536_61: "border-b border-white/10 pb-2 text-xs font-black text-amber-400",
  style540_62: "space-y-2 pr-1 text-[11px] leading-relaxed text-gray-300",
  style542_63: "flex items-start gap-2 text-right",
  style543_64: "mt-0.5 shrink-0 text-amber-500",
  style549_65: "py-1 text-center text-[10px] italic text-gray-500",
  style554_66: "absolute inset-0 z-50 flex flex-col overflow-y-auto bg-[#0A0F1D]/98 p-5 md:p-6",
  style554_67: "text-right",
  style554_68: "text-left",
  style555_69: "mb-4 flex items-center justify-between border-b border-[#14B8A6]/20 pb-4",
  style556_70: "flex items-center gap-2",
  style557_71: "h-5 w-5 text-[#14B8A6]",
  style558_72: "text-sm font-black text-white md:text-base",
  style562_73: "rounded-lg bg-neutral-900 p-1.5 text-gray-400 transition-all hover:bg-neutral-800 hover:text-white",
  style565_74: "h-5 w-5",
  style569_75: "flex-1 space-y-4",
  style570_76: "mb-1 text-right text-[10px] leading-relaxed text-gray-400",
  style575_77: "flex h-64 flex-col items-center justify-center rounded-xl border border-dashed border-[#14B8A6]/10 bg-black/40 p-5 text-center opacity-80",
  style576_78: "mb-2 h-10 w-10 text-gray-600",
  style577_79: "text-xs font-black text-gray-400",
  style578_80: "mt-1 text-[10px] leading-normal text-gray-500",
  style581_81: "space-y-3",
  style589_82: "relative space-y-3 overflow-hidden rounded-xl border border-white/[0.06] bg-[#0F172A]/40 p-4 shadow-md",
  style589_83: "text-right",
  style589_84: "text-left",
  style593_85: "absolute left-3 top-3 rounded-lg border border-red-500/10 bg-red-950/20 p-1.5 text-red-400 transition-all hover:border-red-500/30 hover:bg-red-950/50",
  style597_86: "h-3.5 w-3.5",
  style600_87: "space-y-1 pl-8",
  style601_88: "flex items-center gap-1.5",
  style602_89: "text-xs font-extrabold text-white md:text-sm",
  style603_90: "rounded border border-amber-500/10 bg-amber-950/20 px-1 py-0.5 font-mono text-[10px] text-amber-400",
  style607_91: "text-[10px] leading-normal text-gray-400",
  style608_92: "font-mono text-[9px] text-[#14B8A6]",
  style613_93: "border-t border-dashed border-white/[0.06] pt-2.5",
  style614_94: "mb-1 block text-[9px] text-gray-400",
  style615_95: "grid grid-cols-3 gap-1.5",
  style620_96: "h-7 rounded-md border text-[9px] font-black transition-all",
  style623_97: "border-white bg-white text-black",
  style625_98: "border-[#14B8A6]/30 bg-[#14B8A6]/20 text-[#14B8A6]",
  style626_99: "border-blue-500/30 bg-blue-950/20 text-blue-300",
  style627_100: "border-white/10 bg-black/40 text-gray-500 hover:border-white/20",
  style637_101: "flex gap-2.5 border-t border-white/10 pt-2",
  style640_102: "flex h-9 flex-1 items-center justify-center gap-1 rounded-lg bg-[#14B8A6] text-[10px] font-black text-[#031315] transition-transform hover:scale-[1.01] hover:bg-[#2DD4BF]",
  style643_103: "h-3.5 w-3.5",
  style650_104: "flex h-9 flex-1 items-center justify-center gap-1.5 rounded-lg border border-[#14B8A6]/30 bg-[#14B8A6]/10 text-[10px] font-black text-[#14B8A6] transition-transform hover:scale-[1.01] hover:bg-[#14B8A6]/20",
  style653_105: "h-3.5 w-3.5 text-[#14B8A6]",
  style664_106: "mt-6 border-t border-white/10 pt-4 text-center",
  style667_107: "rounded-lg bg-neutral-900 px-6 py-2 text-[11px] font-black text-white hover:bg-neutral-800",
} as const;

export interface HistoricalTrip {
  tripId: string;
  captainId?: string;
  captainName: string;
  captainRank: 'PLATINUM' | 'GOLD' | 'SILVER' | 'BRONZE';
  captainPhone: string;
  vehicleInfo: string;
  finalPrice: number;
  timestamp: number;
}

export interface FavoriteCaptain extends HistoricalTrip {
  id?: number;
  heartedAt: number;
  captainType?: 'uber' | 'careem' | 'independent';
}

export const formatDashboardMoney = (value: number, currencyLabel: string) =>
  currencyLabel ? `${Number(value).toFixed(2)} ${currencyLabel}` : Number(value).toFixed(2);

export const buildWhatsappUrl = (phone: string, name: string, isArabic: boolean) => {
  const cleanPhone = phone.replace(/\D/g, '');
  const waPhone = cleanPhone.startsWith('0')
    ? `962${cleanPhone.slice(1)}`
    : cleanPhone.startsWith('962')
      ? cleanPhone
      : `962${cleanPhone}`;

  return `https://wa.me/${waPhone}?text=${encodeURIComponent(`${isArabic ? 'مرحبا سائق ' : 'Hello driver '}${sanitizeText(name)}${isArabic ? '، أريد التواصل بخصوص رحلة سابقة.' : ', I want to connect regarding a previous trip.'}`)}`;
};
