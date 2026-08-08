'use client';

import React from 'react';
import { latLngToCell } from 'h3-js';
import {
  Check,
  CheckCircle2,
  ChevronDown,
  Clock,
  ExternalLink,
  Heart,
  Loader2,
  MapPin,
  MessageCircle,
  Minus,
  Navigation,
  Phone,
  Plus,
  Route,
  Search,
  ShieldCheck,
  Star,
  Users,
  X,
} from 'lucide-react';
import { motion } from 'motion/react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { StarRating } from '@/components/ui/star-rating';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useAuth } from '@/hooks/use-auth';
import { useDashboardLanguage } from '@/hooks/use-dashboard-language';
import { useToast } from '@/hooks/use-toast';
import { dexieDb, type RiderTripLedgerEntry } from '@/lib/dexie-db';
import {
  ClipboardMapLocationError,
  extractGoogleMapsPlaceName,
  resolveClipboardMapLocation,
  type ResolvedLocationGeography,
} from '@/shared/services/google-maps-location';
import type { AppLanguage } from '@/lib/i18n/simple-copy';
import { supabase } from '@/lib/supabase-client';
import { cn } from '@/lib/utils';
import { fetchRoadRoute, type RoadRouteEstimate } from '@/lib/road-route';
import { calculateSovereignFareQuote } from '@/core/logic/geospatial-kernel';
import { AdStage } from '@/features/ads/ad-stage/contract';
import { RatingModal } from '@/components/dashboard/shared/rating-modal';
import { RadarRiderDashboard, type HistoricalTrip } from './rider-dashboard';
import { buildDistrictLoadKey } from '../services/rider-district-query';
import {
  findDistrictForGeography,
  findGovernorateForGeography,
  findNearestDistrict,
} from '../services/destination-geography';
import type { RiderLocation, RiderLocationStatus, RiderLocationUpdate } from './rider-map';
import dynamic from 'next/dynamic';

const styles = {
  style1548_1: "space-y-3 pb-20 lg:pb-4",
  style1549_2: "space-y-3",
  style1550_3: "flex items-start justify-between gap-3",
  style1551_4: "min-w-0",
  style1552_5: "text-[11px] font-black text-[#14F5D5]",
  style1553_6: "mt-1 text-2xl font-black leading-tight text-white",
  style1554_7: "mt-1 text-xs leading-relaxed text-slate-400",
  style1557_8: "shrink-0 rounded-full border border-[#14B8A6]/25 bg-[#14B8A6]/10 px-3 py-1.5 text-[10px] font-black text-[#14F5D5]",
  style1563_9: "grid grid-cols-3 gap-1.5",
  style1572_10: "flex min-w-0 items-center gap-1.5 rounded-lg border px-2 py-2 text-[9px] font-black transition-colors",
  style1574_11: "border-[#14B8A6]/30 bg-[#14B8A6]/12 text-[#BFFCF2]",
  style1575_12: "border-white/8 bg-white/[0.03] text-slate-500",
  style1580_13: "flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-[8px]",
  style1581_14: "bg-[#14B8A6] text-[#061316]",
  style1581_15: "bg-slate-800 text-slate-400",
  style1584_16: "h-2.5 w-2.5 stroke-[3]",
  style1586_17: "truncate",
  style1592_18: "grid gap-3",
  style1737_19: "rounded-2xl border border-white/10 bg-[#111827]/80 p-3 shadow-lg shadow-black/15",
  style1738_20: "mb-3 flex items-start gap-2.5",
  style1739_21: "flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[#14B8A6]/12 text-[#14F5D5]",
  style1740_22: "h-4 w-4",
  style1742_23: "min-w-0",
  style1743_24: "text-xs font-black text-white",
  style1744_25: "mt-0.5 text-[10px] leading-relaxed text-slate-400",
  style1748_26: "grid grid-cols-2 gap-2",
  style1749_27: "min-w-0 space-y-1.5",
  style1750_28: "block text-[10px] font-black text-slate-400",
  style1755_29: "h-11 w-full min-w-0 rounded-xl border border-white/10 bg-black/35 px-3 text-xs font-black text-white outline-none transition focus:outline-none focus:ring-0 focus:ring-offset-0 focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-offset-0 data-[state=open]:outline-none data-[state=open]:ring-0 data-[state=open]:ring-offset-0",
  style1768_30: "min-w-0 space-y-1.5",
  style1769_31: "block text-[10px] font-black text-slate-400",
  style1774_32: "h-11 w-full min-w-0 rounded-xl border border-white/10 bg-black/35 px-3 text-xs font-black text-white outline-none transition focus:outline-none focus:ring-0 focus:ring-offset-0 focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-offset-0 data-[state=open]:outline-none data-[state=open]:ring-0 data-[state=open]:ring-offset-0",
  style1775_32: "border-white/10 bg-[#0F172A] text-white shadow-2xl shadow-black/40",
  style1776_32: "cursor-pointer rounded-lg py-2.5 text-xs font-black text-slate-200 focus:bg-[#14B8A6]/15 focus:text-[#14F5D5] data-[state=checked]:bg-[#14B8A6]/10 data-[state=checked]:text-[#14F5D5]",
  style1788_33: "space-y-3 rounded-2xl border border-white/10 bg-[#111827]/80 p-3 shadow-lg shadow-black/15",
  searchMapEmbedWrapper: "h-[70vh] max-h-[560px] w-full overflow-hidden rounded-2xl border border-[#14B8A6]/25 bg-[#0F172A]",
  searchMapEmbedFrame: "h-full w-full border-0",
  searchMapDialogContent: "max-w-3xl border border-[#14B8A6]/25 bg-[#0B0F19] text-white shadow-2xl",
  searchMapDialogTitle: "text-sm font-black text-white",
  searchMapLoadingIcon: "h-4 w-4 animate-spin",
  destinationMapEmbedWrapper: "h-[220px] w-full overflow-hidden rounded-2xl border border-[#243249] bg-[#161F30] shadow-xl shadow-black/20",
  destinationMapEmbedFrame: "h-full w-full border-0",
  mapPickerFooter: "mt-3 flex flex-col gap-2 sm:flex-row",
  mapPickerCopyBtn: "flex h-11 flex-1 items-center justify-center gap-2 rounded-xl border border-white/10 bg-black/35 text-xs font-black text-slate-200 transition hover:bg-black/50",
  mapPickerConfirmBtn: "flex h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-[#14B8A6] text-xs font-black text-[#031315] transition hover:bg-[#2DD4BF]",
  mapPickerBtnIcon: "h-4 w-4",
  modalSearchForm: "mb-3 flex gap-2",
  modalSearchInputWrapper: "relative min-w-0 flex-1",
  modalSearchIcon: "pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#14B8A6]",
  modalSearchInput: "h-11 w-full rounded-xl border border-white/10 bg-black/40 pe-4 ps-10 text-sm font-bold text-white outline-none transition placeholder:text-slate-500 focus:border-[#14B8A6]/60",
  modalSearchButton: "flex h-11 shrink-0 items-center justify-center gap-2 rounded-xl bg-[#14B8A6] px-4 text-xs font-black text-[#031315] transition hover:bg-[#2DD4BF] disabled:cursor-not-allowed disabled:opacity-50",
  modalSearchButtonIcon: "h-4 w-4",
  style1790_34: "mb-2.5 flex items-start gap-2.5",
  style1791_35: "flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#14B8A6]/15 text-xs font-black text-[#14F5D5]",
  style1793_36: "text-xs font-black text-white",
  style1794_37: "mt-1 text-[11px] leading-relaxed text-slate-400",
  style1802_38: "flex gap-2",
  style1804_39: "relative min-w-0 flex-1",
  style1805_40: "pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#14B8A6]",
  style1818_41: "h-11 w-full rounded-xl border border-white/10 bg-black/40 pe-3 ps-10 text-sm font-bold text-white outline-none transition placeholder:text-slate-500 focus:border-[#14B8A6]/60",
  style1826_42: "flex h-11 shrink-0 items-center justify-center gap-2 rounded-xl bg-[#14B8A6] px-3 text-sm font-black text-[#031315] transition hover:bg-[#2DD4BF] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#14F5D5] disabled:cursor-not-allowed disabled:opacity-50",
  style1828_43: "h-4 w-4",
  style1829_44: "hidden sm:inline",
  style1836_45: "border-t border-white/8 pt-3",
  style1837_46: "mb-2.5 flex items-start gap-2.5",
  style1838_47: "flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#14B8A6]/15 text-xs font-black text-[#14F5D5]",
  style1840_48: "text-xs font-black text-white",
  style1841_49: "mt-1 text-[11px] leading-relaxed text-slate-400",
  style1848_50: "flex min-h-12 w-full items-center justify-center gap-2 rounded-xl border border-[#14B8A6]/35 bg-[#14B8A6]/12 px-4 text-xs font-black text-[#BFFCF2] transition-all duration-300 hover:bg-[#14B8A6]/20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#14F5D5] disabled:cursor-not-allowed disabled:opacity-60",
  style1850_51: "h-5 w-5 animate-spin",
  style1850_52: "h-5 w-5",
  style1860_53: "space-y-3 rounded-xl border border-[#14B8A6]/35 bg-[#14B8A6]/8 p-3 shadow-lg shadow-[#14B8A6]/5",
  style1861_54: "flex items-start gap-2.5 text-[#14F5D5]",
  style1862_55: "flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[#14B8A6]/15",
  style1863_56: "h-4 w-4",
  style1865_57: "min-w-0",
  style1866_58: "block text-xs font-black",
  style1867_59: "mt-0.5 text-[10px] leading-relaxed text-slate-400",
  style1874_60: "rounded-xl border border-[#14B8A6]/20 bg-[#14B8A6]/10 px-3 py-3 text-xs font-bold text-[#BFFCF2]",
  style1878_61: "grid grid-cols-2 gap-2",
  style1879_62: "rounded-xl border border-white/8 bg-black/20 p-2.5",
  style1880_63: "text-[10px] font-black text-slate-400",
  style1881_64: "mt-1 block font-mono text-base font-black text-white",
  style1885_65: "rounded-xl border border-[#14B8A6]/20 bg-black/15 p-2.5",
  style1886_66: "text-[10px] font-black text-slate-300",
  style1887_67: "mt-1 block font-mono text-base font-black text-[#14F5D5]",
  style1890_68: "mt-1 block text-[9px] text-slate-400",
  style1895_69: "group rounded-lg border border-white/8 bg-black/15",
  style1896_70: "flex cursor-pointer list-none items-center justify-between gap-2 px-3 py-2 text-[10px] font-bold text-slate-400 transition hover:text-slate-200",
  style1897_71: "flex min-w-0 items-center gap-2",
  style1898_72: "h-3.5 w-3.5 shrink-0",
  style1899_73: "truncate",
  style1901_74: "h-3.5 w-3.5 shrink-0 transition-transform group-open:rotate-180",
  style1903_75: "border-t border-white/8 p-2",
  style1908_76: "h-9 w-full rounded-lg border border-white/8 bg-[#1E293B] px-2 text-[10px] font-bold text-slate-300 outline-none",
  style1916_77: "flex items-center gap-3 rounded-xl border border-[#14B8A6]/25 bg-[#0B1220] p-3",
  style1917_78: "relative flex h-10 w-10 shrink-0 items-center justify-center",
  style1920_79: "absolute h-9 w-9 animate-ping rounded-full border border-[#14B8A6]/50",
  style1921_80: "absolute h-6 w-6 animate-ping rounded-full border border-[#14F5D5]/40 [animation-delay:180ms]",
  style1924_81: "absolute h-6 w-6 animate-pulse rounded-full bg-[#14B8A6]/20",
  style1925_82: "relative z-10 h-4 w-4 text-[#14F5D5]",
  style1927_83: "min-w-0 text-start",
  style1928_84: "text-xs font-black text-white",
  style1933_85: "mt-0.5 text-[9px] leading-relaxed text-slate-400",
  style1941_86: "overflow-hidden rounded-2xl border border-white/10 bg-[#0F172A] shadow-xl",
  style1942_87: "border-b border-white/10 px-3 py-2 text-[10px] font-black text-[#14F5D5]",
  style1945_88: "max-h-56 overflow-y-auto",
  style1951_89: "flex w-full items-start gap-2 border-b border-white/[0.06] px-3 py-3 text-start text-xs font-bold leading-relaxed text-slate-200 transition last:border-b-0 hover:bg-[#14B8A6]/10 hover:text-white",
  style1953_90: "mt-0.5 h-4 w-4 shrink-0 text-[#14B8A6]",
  style1962_91: "rounded-xl border border-amber-400/25 bg-amber-400/10 p-3 text-xs font-bold text-amber-100",
  style1968_92: "rounded-xl border border-[#14B8A6]/25 bg-[#14B8A6]/10 p-3 text-xs font-bold text-[#BFFCF2]",
  style1975_93: "flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-[#111827]/80 p-3",
  style1976_94: "flex min-w-0 items-center gap-2.5",
  style1977_95: "flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[#14B8A6]/12 text-[#14F5D5]",
  style1978_96: "h-4 w-4",
  style1980_97: "text-xs font-black text-slate-200",
  style1982_98: "flex h-10 items-center rounded-xl border border-white/10 bg-black/30 p-1",
  style1987_99: "flex h-8 w-8 items-center justify-center rounded-lg text-slate-300 transition hover:bg-white/8 hover:text-white disabled:cursor-not-allowed disabled:opacity-30",
  style1990_100: "h-4 w-4",
  style1992_101: "w-10 text-center font-mono text-sm font-black text-white",
  style1998_102: "flex h-8 w-8 items-center justify-center rounded-lg text-[#14F5D5] transition hover:bg-[#14B8A6]/12",
  style2001_103: "h-4 w-4",
  style2007_104: "rounded-2xl border border-amber-400/25 bg-amber-400/10 p-3 text-xs font-bold leading-relaxed text-amber-100",
  style2014_105: "overflow-hidden rounded-2xl border bg-[#111827]/90 shadow-xl shadow-black/20 transition-colors",
  style2015_106: "border-[#14B8A6]/40",
  style2015_107: "border-white/10",
  style2018_108: "flex items-center justify-between gap-3 border-b border-white/8 px-3 py-2.5",
  style2019_109: "flex items-center gap-2",
  style2022_110: "flex h-8 w-8 items-center justify-center rounded-xl",
  style2023_111: "bg-[#14B8A6]/15 text-[#14F5D5]",
  style2023_112: "bg-white/5 text-slate-500",
  style2026_113: "h-4 w-4",
  style2026_114: "h-4 w-4",
  style2029_115: "text-xs font-black text-white",
  style2030_116: "mt-0.5 text-[9px] text-slate-400",
  style2035_117: "h-4 w-4 animate-spin text-[#14F5D5]",
  style2038_118: "space-y-3 p-3",
  style2039_119: "flex items-start justify-between gap-3",
  style2040_120: "min-w-0",
  style2041_121: "block text-[9px] font-black uppercase text-slate-500",
  style2042_122: "mt-1 block truncate text-sm font-black text-white",
  style2044_123: "mt-1 block font-mono text-[9px] text-slate-600",
  style2049_124: "shrink-0 text-end",
  style2050_125: "block text-[9px] font-black uppercase text-slate-500",
  style2053_126: "mt-1 block font-mono text-xl font-black text-[#14F5D5]",
  style2057_127: "grid grid-cols-3 gap-2",
  style2058_128: "rounded-xl border border-[#14B8A6]/18 bg-[#14B8A6]/8 p-2.5",
  style2059_129: "mb-1.5 h-3.5 w-3.5 text-[#14F5D5]",
  style2060_130: "block text-[9px] font-black text-slate-500",
  style2063_131: "mt-1 block text-xs font-black text-white",
  style2070_132: "mt-0.5 block text-[8px] leading-tight text-slate-500",
  style2074_133: "rounded-xl border border-white/8 bg-black/20 p-2.5",
  style2075_134: "mb-1.5 h-3.5 w-3.5 text-slate-400",
  style2076_135: "block text-[9px] font-black text-slate-500",
  style2079_136: "mt-1 block text-xs font-black text-white",
  style2087_137: "rounded-xl border border-white/8 bg-black/20 p-2.5",
  style2088_138: "mb-1.5 h-3.5 w-3.5 text-slate-400",
  style2089_139: "block text-[9px] font-black leading-tight text-slate-500",
  style2092_140: "mt-1 block text-xs font-black text-white",
  style2099_141: "rounded-2xl border border-red-500/30 bg-red-950/30 p-3 text-xs font-bold leading-relaxed text-red-100",
  style2105_142: "text-xs font-bold text-red-500 text-center py-1 animate-pulse",
  style2112_143: "pt-1",
  style2124_144: "flex min-h-[72px] w-full items-center justify-center gap-3 rounded-2xl bg-[#14B8A6] px-6 py-6 text-xl font-black text-[#0A0F1D] shadow-2xl shadow-[#14B8A6]/30 transition-all duration-300 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#14F5D5]/80 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0A0F1D]",
  style2126_145: "cursor-not-allowed bg-gray-700 text-gray-400",
  style2127_146: "cursor-pointer bg-[#14B8A6] text-[#0A0F1D] hover:bg-[#2DD4BF] hover:shadow-[0_22px_48px_rgba(20,184,166,0.32)] disabled:cursor-not-allowed disabled:opacity-55 disabled:shadow-none",
  style2130_147: "h-5 w-5 animate-spin",
  style2130_148: "h-5 w-5",
  style2148_149: "space-y-4",
  style2148_150: "text-right",
  style2148_151: "text-left",
  style2149_152: "rounded-[24px] border border-amber-400/20 bg-amber-400/10 p-5",
  style2150_153: "text-[11px] font-black text-amber-200",
  style2151_154: "mt-2 text-xl font-bold text-white",
  style2152_155: "mt-3 text-sm leading-relaxed text-slate-300",
  style2162_156: "h-14 w-full bg-[#14B8A6] text-[#0A0F1D] font-bold text-base py-3.5 rounded-xl transition-transform active:scale-[0.98] hover:bg-[#2DD4BF] flex items-center justify-center cursor-pointer",
  style2171_157: "space-y-4",
  style2171_158: "text-right",
  style2171_159: "text-left",
  style2172_160: "flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between",
  style2173_161: "space-y-1",
  style2174_162: "text-[11px] font-black text-[#14F5D5]",
  style2175_163: "text-xl font-bold text-white",
  style2176_164: "text-xs text-slate-400",
  style2184_165: "h-11 rounded-xl border border-red-500/30 bg-red-600/15 px-4 text-sm font-black text-red-100 hover:bg-red-600/25 flex items-center justify-center gap-1 cursor-pointer",
  style2186_166: "h-4 w-4",
  style2192_167: "rounded-2xl border border-white/5 bg-white/5 p-4",
  style2193_168: "mb-3 text-[11px] font-black text-[#14F5D5]",
  style2194_169: "grid grid-cols-2 gap-3",
  style2204_170: "flex min-h-36 flex-col items-center justify-center gap-3 rounded-2xl border border-white/5 bg-white/5",
  style2205_171: "h-9 w-9 animate-spin text-[#14F5D5]",
  style2206_172: "px-4 text-center text-xs font-bold leading-relaxed text-slate-300",
  style2215_173: "space-y-3",
  style2360_174: "space-y-4",
  style2360_175: "text-right",
  style2360_176: "text-left",
  style2361_177: "flex items-start justify-between gap-3",
  style2362_178: "space-y-1",
  style2363_179: "text-[11px] font-black text-[#14F5D5]",
  style2364_180: "text-xl font-bold text-white",
  style2367_181: "text-xs text-slate-400",
  style2369_182: "rounded-2xl border border-white/5 bg-white/5 px-4 py-2 text-center min-w-[100px]",
  style2370_183: "mx-auto mb-1 h-4 w-4 text-[#14F5D5]",
  style2371_184: "font-mono text-lg text-[#14F5D5] block",
  style2374_185: "text-[9px] text-slate-400 block mt-0.5 whitespace-nowrap font-bold",
  style2382_186: "grid grid-cols-2 gap-3 rounded-2xl border border-white/5 bg-white/5 p-4",
  style2393_187: "flex flex-col items-center justify-center rounded-2xl border border-emerald-500/20 bg-emerald-950/10 p-5 text-center",
  style2394_188: "text-2xl font-extrabold text-teal-400 font-mono",
  style2397_189: "mt-1 text-xs font-bold text-slate-400",
  style2402_190: "rounded-2xl border border-[#14B8A6]/20 bg-[#14B8A6]/8 p-4 text-xs leading-relaxed text-slate-300",
  style2410_191: "flex gap-2",
  style2414_192: "flex h-14 w-14 items-center justify-center rounded-xl border border-[#14B8A6]/30 bg-[#14B8A6]/10 text-[#14F5D5] hover:bg-[#14B8A6]/20 transition-colors cursor-pointer",
  style2417_193: "h-6 w-6",
  style2450_194: "flex h-14 w-14 items-center justify-center rounded-xl border border-[#14B8A6]/30 bg-[#14B8A6]/10 text-[#14F5D5] transition-colors hover:bg-[#14B8A6]/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#14F5D5]/60",
  style2453_195: "h-6 w-6",
  style2470_196: "h-14 flex-1 bg-red-600/90 hover:bg-red-500 text-white font-bold text-base py-3.5 rounded-xl transition-transform active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-red-600/20",
  style2472_197: "h-5 w-5 animate-pulse",
  style2480_198: "h-14 flex-1 border border-red-500/30 bg-red-600/10 hover:bg-red-600/20 text-red-200 font-bold text-base py-3.5 rounded-xl transition-transform active:scale-[0.98] flex items-center justify-center cursor-pointer disabled:opacity-50",
  style2496_199: "relative h-[calc(100vh-120px)] w-full overflow-hidden text-white lg:h-screen lg:min-h-screen lg:overflow-hidden lg:bg-transparent",
  style2497_200: "relative h-full w-full lg:block lg:max-w-none",
  style2498_201: "hidden lg:block lg:absolute lg:inset-0 lg:z-0",
  style2502_202: "h-full w-full lg:rounded-none lg:border-0",
  style2512_203: "absolute bottom-0 start-0 end-0 z-10 w-full max-h-full overflow-hidden flex flex-col rounded-t-[32px] rounded-b-none border-t border-white/10 bg-[#0A0F1D]/80 shadow-[0_-10px_25px_rgba(0,0,0,0.5)] backdrop-blur-xl lg:absolute lg:bottom-6 lg:start-auto lg:end-6 lg:top-6 lg:z-40 lg:w-[420px] lg:rounded-[28px] lg:border lg:border-white/10 lg:bg-[#0A0F1D]/80 lg:shadow-[0_30px_100px_rgba(0,0,0,0.45)] lg:backdrop-blur-xl lg:max-h-none lg:rounded-b-[28px] lg:overflow-hidden",
  style2514_204: "relative z-50 flex items-center justify-between rounded-t-[32px] border-b border-white/5 bg-slate-900/40 px-4 py-3 backdrop-blur-md lg:rounded-t-[28px] lg:px-5",
  style2516_205: "w-9",
  style2519_206: "w-12 h-1.5 bg-slate-500/40 rounded-full",
  style2539_207: "h-9 w-9 flex items-center justify-center rounded-full bg-slate-800 border border-white/20 text-white shadow-md active:scale-95 cursor-pointer hover:bg-slate-700 transition-colors",
  style2542_208: "h-4 w-4 stroke-[3]",
  style2547_209: "flex-1 space-y-4 overflow-y-auto px-4 pb-4 pt-3 lg:p-5",
  style2550_210: "rounded-2xl border border-white/5 bg-white/5 p-4 shadow-xl shadow-black/20 backdrop-blur",
  style2551_211: "hidden",
  style2554_212: "mb-3 flex items-center justify-between sm:mb-4",
  style2556_213: "text-[11px] font-black text-[#14F5D5] tracking-wider",
  style2557_214: "text-xl font-bold text-white mt-0.5",
  style2559_215: "h-7 w-7 text-[#14F5D5]",
  style2562_216: "grid grid-cols-3 gap-2 lg:hidden",
  style2577_217: "space-y-4",
  style2577_218: "text-right",
  style2577_219: "text-left",
  style2578_220: "space-y-1",
  style2579_221: "text-[11px] font-black text-[#14F5D5]",
  style2580_222: "text-xl font-bold text-white",
  style2581_223: "text-xs leading-relaxed text-slate-400",
  style2586_224: "grid grid-cols-2 gap-3 rounded-2xl border border-white/5 bg-white/5 p-4",
  style2600_225: "h-14 w-full bg-[#14B8A6] text-[#0A0F1D] font-bold text-base py-3.5 rounded-xl transition-transform active:scale-[0.98] shadow-lg shadow-[#14B8A6]/20 hover:bg-[#2DD4BF] flex items-center justify-center gap-2 cursor-pointer",
  style2602_226: "ml-2 h-5 w-5",
  style2614_227: "hidden overflow-hidden rounded-[24px] border border-[#14B8A6]/15 bg-[#0B0F19]/88 shadow-2xl shadow-black/35 backdrop-blur-xl lg:block",
  style2632_228: "overflow-hidden rounded-[24px] border border-[#14B8A6]/15 lg:hidden",
  style2671_229: "max-w-[420px] border border-[#14B8A6]/25 bg-[#0B0F19] text-white shadow-2xl",
  style2672_230: "text-right",
  style2672_231: "text-left",
  style2673_232: "text-xl font-black text-white",
  style2676_233: "text-sm leading-6 text-slate-300",
  style2682_234: "mt-2 flex gap-3",
  style2682_235: "flex-row-reverse",
  style2682_236: "flex-row",
  style2686_237: "flex-1 rounded-xl bg-[#14B8A6] py-3 font-black text-[#07111F] hover:bg-[#2DD4BF]",
  style2694_238: "rounded-xl border-white/15 bg-white/5 px-5 text-white hover:bg-white/10",
  style3069_239: "min-w-0 space-y-1",
  style3070_240: "block text-[10px] font-bold text-slate-500",
  style3071_241: "block truncate text-xs font-black text-white",
  style3092_242: "flex items-center justify-between gap-3",
  style3093_243: "min-w-0",
  style3094_244: "block text-[10px] font-bold text-slate-500",
  style3095_245: "block truncate text-xs font-black text-white",
  style3101_246: "inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[#14B8A6]/30 bg-[#14B8A6]/10 text-[#14F5D5] transition hover:bg-[#14B8A6]/20",
  style3375_247: "h-10 rounded-xl border text-xs font-black transition",
  style3377_248: "border-[#14B8A6]/45 bg-[#14B8A6]/15 text-[#14F5D5]",
  style3378_249: "border-white/10 bg-black/20 text-slate-400 hover:border-[#14B8A6]/25 hover:text-white",
} as const;

const RiderMap = dynamic(() => import('./rider-map').then(m => m.RiderMap), { ssr: false });
import {
  type RiderActiveTrip,
  type RiderDestination,
  useRiderDashboardMachine,
} from '../state/rider-state-machine';
import {
  acceptRideOffer,
  buildRideRequestInsertPayload,
  calculateServerFare,
  cancelRideRequest,
  completeRideTrip,
  createRideRequest,
  fetchAvailableCaptainPresence,
  fetchRideRequestStatus,
  fetchRideOffers,
  isCaptainPresenceFresh,
  mapRiderMarketplaceError,
  submitRideRating,
  subscribeToRideOffers,
  subscribeToRideRequestStatus,
  type CaptainPresencePoint,
} from '../services/rider-server-marketplace';
import { CaptainOfferCard, type CaptainOffer, type CaptainRank } from './captain-offer-card';

const THREE_DAYS_MS = 3 * 24 * 60 * 60 * 1000;
const H3_RIDER_REQUEST_RESOLUTION = 9;
const OFFER_TIMEOUT_MS = 2 * 60 * 1000;
const FARE_RECALCULATION_DEBOUNCE_MS = 350;
const CAPTAIN_PRESENCE_REFRESH_MS = 15_000;
const CAPTAIN_PRESENCE_PRUNE_MS = 5_000;
const INITIAL_RIDER_LOCATION: RiderLocation = { lat: 30.0444, lng: 31.2357 };

async function readClipboardLocationText() {
  const plainText = await navigator.clipboard.readText();
  if (!navigator.clipboard.read) return plainText;

  try {
    const items = await navigator.clipboard.read();
    const richText = await Promise.all(
      items.flatMap((item) =>
        item.types
          .filter((type) => type === 'text/plain' || type === 'text/html')
          .map(async (type) => {
            try {
              return await (await item.getType(type)).text();
            } catch {
              return '';
            }
          }),
      ),
    );

    return [plainText, ...richText].filter(Boolean).join('\n');
  } catch {
    return plainText;
  }
}

interface CountryCurrencyConfig {
  id: number;
  name_ar?: string | null;
  name_en?: string | null;
  currency_ar?: string | null;
  currency_en?: string | null;
  currency_code?: string | null;
}

interface GovernorateOption {
  id: string;
  numericId: number;
  nameAr: string;
  nameEn: string;
}

interface DistrictOption {
  id: string;
  numericId: number;
  governorateId: string;
  governorateAr: string;
  governorateEn: string;
  districtAr: string;
  districtEn: string;
  anchor: RiderLocation | null;
  tortuosityFactor: number;
}

interface DestinationSearchResult {
  placeId: number;
  label: string;
  location: RiderLocation;
}

interface ExternalLocationContext {
  governorate: string;
  district: string;
  placeName: string;
}

export function RiderViewTab({ onExitRequestFlow, isStandbyDismissed = false }: { onExitRequestFlow?: () => void; isStandbyDismissed?: boolean } = {}) {
  const { user } = useAuth();
  const { toast } = useToast();
  const { isArabic, language } = useDashboardLanguage();
  const destinationSearchCopy = useTranslations('riderDestinationSearch');
  const locationCopy = useTranslations('location');
  const copy = riderViewCopy[language] as Record<string, string>;
  const requestFlowCopy = React.useMemo(() => (
    language === 'ar'
      ? {
          cancelRequest: 'إلغاء الطلب',
          cancellingRequest: 'جاري الإلغاء...',
          cancelRequestFailedTitle: 'تعذر إلغاء الطلب',
          requestCancelledTitle: 'تم إلغاء الطلب',
          requestCancelledDescription: 'تم إلغاء طلب الرحلة.',
        }
      : {
          cancelRequest: 'Cancel request',
          cancellingRequest: 'Cancelling...',
          cancelRequestFailedTitle: 'Could not cancel request',
          requestCancelledTitle: 'Request cancelled',
          requestCancelledDescription: 'Your ride request was cancelled.',
        }
  ), [language]);
  const { state, dispatch, showAdRiver } = useRiderDashboardMachine();
  const [selectedGovernorateId, setSelectedGovernorateId] = React.useState('');
  const [draftDestinationId, setDraftDestinationId] = React.useState('');
  const [riderCount, setRiderCount] = React.useState(1);
  const [rating, setRating] = React.useState({ captain: 0, vehicle: 0, favorite: false });
  const [ratingComment, setRatingComment] = React.useState('');
  const [preferredCaptainIds, setPreferredCaptainIds] = React.useState<string[]>([]);
  const [expandedOfferId, setExpandedOfferId] = React.useState<string | null>(null);
  const [captainSearchRadiusKm, setCaptainSearchRadiusKm] = React.useState(1.5);
  const [isExpandingCaptainSearch, setIsExpandingCaptainSearch] = React.useState(false);
  const [emergencyWhatsappContact, setEmergencyWhatsappContact] = React.useState('');
  const [showEmergencyContactDialog, setShowEmergencyContactDialog] = React.useState(false);
  const [etaSeconds, setEtaSeconds] = React.useState(0);
  const [riderLocation, setRiderLocation] = React.useState<RiderLocation>(INITIAL_RIDER_LOCATION);
  const [riderH3Cell, setRiderH3Cell] = React.useState(latLngToCell(INITIAL_RIDER_LOCATION.lat, INITIAL_RIDER_LOCATION.lng, H3_RIDER_REQUEST_RESOLUTION));
  const [locationStatus, setLocationStatus] = React.useState<RiderLocationStatus>('fallback');
  const [currentAddressName, setCurrentAddressName] = React.useState<string>('');
  const [isGeocoding, setIsGeocoding] = React.useState<boolean>(false);

  React.useEffect(() => {
    if (!riderLocation.lat || !riderLocation.lng) return;

    let active = true;
    const fetchAddress = async () => {
      setIsGeocoding(true);
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/reverse?lat=${riderLocation.lat}&lon=${riderLocation.lng}&format=json&accept-language=${language}`
        );
        if (!res.ok) throw new Error('Geocoding fail');
        const data = await res.json();
        if (active && data) {
          const addr = data.address || {};
          const localPart =
            addr.suburb ||
            addr.neighbourhood ||
            addr.village ||
            addr.town ||
            addr.city_district ||
            addr.road ||
            '';
          const cityPart =
            addr.city ||
            addr.state ||
            addr.governorate ||
            '';

          const separator = language === 'ar' ? '، ' : ', ';
          let displayAddress = '';
          if (localPart && cityPart && localPart !== cityPart) {
            displayAddress = `${localPart}${separator}${cityPart}`;
          } else {
            displayAddress = localPart || cityPart || data.display_name || '';
          }
          setCurrentAddressName(displayAddress);
        }
      } catch (err) {
        console.warn('Reverse geocoding failed:', err);
      } finally {
        if (active) setIsGeocoding(false);
      }
    };

    const timer = setTimeout(() => {
      fetchAddress();
    }, 800);

    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [riderLocation.lat, riderLocation.lng, language]);

  const [localCompletedTrips, setLocalCompletedTrips] = React.useState<HistoricalTrip[]>([]);
  const [captainLocations, setCaptainLocations] = React.useState<CaptainPresencePoint[]>([]);
  const [blockedCaptainIds, setBlockedCaptainIds] = React.useState<Set<string>>(new Set());
  const [isSendingRideRequest, setIsSendingRideRequest] = React.useState(false);
  const [isCancellingRideRequest, setIsCancellingRideRequest] = React.useState(false);
  const [acceptingOfferId, setAcceptingOfferId] = React.useState<string | null>(null);
  const [isCompletingTrip, setIsCompletingTrip] = React.useState(false);
  const [isSubmittingRating, setIsSubmittingRating] = React.useState(false);
  const [countryConfig, setCountryConfig] = React.useState<CountryCurrencyConfig | null>(null);
  const [destinationGovernorates, setDestinationGovernorates] = React.useState<GovernorateOption[]>([]);
  const [destinationDistricts, setDestinationDistricts] = React.useState<DistrictOption[]>([]);
  const [destinationPinLocation, setDestinationPinLocation] = React.useState<RiderLocation | null>(null);
  const [destinationFlyToTarget, setDestinationFlyToTarget] = React.useState<RiderLocation | null>(null);
  const [destinationSearchQuery, setDestinationSearchQuery] = React.useState('');
  const [destinationSearchResults, setDestinationSearchResults] = React.useState<DestinationSearchResult[]>([]);
  const [destinationSearchStatus, setDestinationSearchStatus] = React.useState<'idle' | 'searching' | 'empty' | 'error' | 'selected'>('idle');
  const [externalLocationUrl, setExternalLocationUrl] = React.useState('');
  const [externalLocationContext, setExternalLocationContext] = React.useState<ExternalLocationContext | null>(null);
  const [isMapPickerOpen, setIsMapPickerOpen] = React.useState(false);
  const [modalPinLocation, setModalPinLocation] = React.useState<RiderLocation | null>(null);
  const [isLoadingMapPreview, setIsLoadingMapPreview] = React.useState(false);
  const [modalSearchQuery, setModalSearchQuery] = React.useState('');
  const [isModalSearchLoading, setIsModalSearchLoading] = React.useState(false);
  const [isReadingClipboardLocation, setIsReadingClipboardLocation] = React.useState(false);
  const [isCaptainScanPreviewActive, setIsCaptainScanPreviewActive] = React.useState(false);
  const [isDestinationPinMoving, setIsDestinationPinMoving] = React.useState(false);
  const [isLoadingGovernorates, setIsLoadingGovernorates] = React.useState(false);
  const [isLoadingDistricts, setIsLoadingDistricts] = React.useState(false);
  const [destinationDataError, setDestinationDataError] = React.useState<string | null>(null);
  const [serverFareState, setServerFareState] = React.useState<{
    key: string;
    fare: number | null;
    isLoading: boolean;
    error: string | null;
  }>({
    key: '',
    fare: null,
    isLoading: false,
    error: null,
  });
  const [routeEstimateState, setRouteEstimateState] = React.useState<{
    key: string;
    estimate: RoadRouteEstimate | null;
    isLoading: boolean;
  }>({
    key: '',
    estimate: null,
    isLoading: false,
  });
  const pendingAcceptedOfferIdRef = React.useRef<string | null>(null);
  const destinationSearchAbortRef = React.useRef<AbortController | null>(null);
  const destinationSearchCacheRef = React.useRef(new Map<string, DestinationSearchResult[]>());
  const pendingConfirmedGeographyRef = React.useRef<ResolvedLocationGeography | null>(null);
  const pendingConfirmedLocationRef = React.useRef<RiderLocation | null>(null);

  const riderProfile = React.useMemo(() => {
    const ratingValue =
      user?.rating !== undefined
        ? user.rating
        : user?.ratingSum && user?.ratingCount
          ? user.ratingSum / user.ratingCount
          : 4.8;

    return {
      id: user?.uid || 'local-rider',
      rating: ratingValue,
      governorate: user?.governorate || 'عمّان',
      district: user?.district || 'وادي السير',
    };
  }, [user]);

  const availableDistricts = destinationDistricts;

  const selectedGovernorate = React.useMemo(
    () => destinationGovernorates.find((governorate) => governorate.id === selectedGovernorateId) || null,
    [destinationGovernorates, selectedGovernorateId],
  );
  const districtLoadKey = buildDistrictLoadKey({
    selectedGovernorateId,
    destinationPinLocation,
    externalLocationContext,
    selectedGovernorateName: selectedGovernorate?.nameAr || selectedGovernorate?.nameEn || '',
  });

  const selectedDistrict = React.useMemo(() => {
    const direct = destinationDistricts.find((district) => district.id === draftDestinationId);
    return direct || destinationDistricts[0] || null;
  }, [destinationDistricts, draftDestinationId]);

  const activeCountryId = user?.countryId;
  const profileDistrict = React.useMemo(() => {
    const profileDistrictId = String(user?.district || '');
    return destinationDistricts.find((district) => district.id === profileDistrictId) || null;
  }, [destinationDistricts, user?.district]);
  const profileFallbackLocation = profileDistrict?.anchor || selectedDistrict?.anchor || riderLocation;
  const selectedDestinationCoords = destinationPinLocation || selectedDistrict?.anchor || null;

  const fareRequestKey = React.useMemo(
    () => (selectedDestinationCoords ? buildFareRequestKey(riderLocation, selectedDestinationCoords, activeCountryId) : 'no-destination'),
    [activeCountryId, riderLocation, selectedDestinationCoords],
  );

  const currentServerFare = serverFareState.key === fareRequestKey ? serverFareState.fare : null;
  const currentRouteEstimate = routeEstimateState.key === fareRequestKey ? routeEstimateState.estimate : null;
  const hasUsableRiderLocation =
    Number.isFinite(riderLocation.lat) &&
    Number.isFinite(riderLocation.lng) &&
    (riderLocation.lat !== 0 || riderLocation.lng !== 0);
  const isRouteEstimateLoading =
    !!selectedDestinationCoords &&
    (!hasUsableRiderLocation || routeEstimateState.key !== fareRequestKey || routeEstimateState.isLoading || isDestinationPinMoving);
  const isServerFareLoading =
    !!selectedDestinationCoords && (serverFareState.key !== fareRequestKey || serverFareState.isLoading || isDestinationPinMoving);
  const serverFareError = serverFareState.key === fareRequestKey ? serverFareState.error : null;
  const currencyLabel = getCurrencyLabel(countryConfig, user, language);

  const selectedDraftDestination = React.useMemo(() => {
    if (!selectedDistrict || !selectedDestinationCoords) return null;
    const destination = buildRiderDestination(
      selectedDistrict,
      riderLocation,
      currentServerFare,
      selectedDestinationCoords,
      currentRouteEstimate?.distanceKm ?? null,
    );
    return destinationSearchStatus === 'selected' && destinationSearchQuery.trim()
      ? { ...destination, label: destinationSearchQuery.trim() }
      : destination;
  }, [currentRouteEstimate?.distanceKm, currentServerFare, destinationSearchQuery, destinationSearchStatus, riderLocation, selectedDestinationCoords, selectedDistrict]);

  const destinationMapQuery = React.useMemo(() => {
    if (selectedDestinationCoords) {
      return `${selectedDestinationCoords.lat},${selectedDestinationCoords.lng}`;
    }

    const typedLocation = destinationSearchQuery.trim() || externalLocationContext?.placeName.trim();
    if (typedLocation) return typedLocation;

    return [
      isArabic ? selectedDistrict?.districtAr : selectedDistrict?.districtEn,
      isArabic ? selectedGovernorate?.nameAr : selectedGovernorate?.nameEn,
      isArabic ? countryConfig?.name_ar : countryConfig?.name_en,
    ]
      .map((part) => String(part || '').trim())
      .filter(Boolean)
      .join(', ');
  }, [
    countryConfig?.name_ar,
    countryConfig?.name_en,
    destinationSearchQuery,
    externalLocationContext?.placeName,
    isArabic,
    selectedDestinationCoords,
    selectedDistrict?.districtAr,
    selectedDistrict?.districtEn,
    selectedGovernorate?.nameAr,
    selectedGovernorate?.nameEn,
  ]);

  const destinationMapEmbedUrl = React.useMemo(
    () => destinationMapQuery
      ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(destinationMapQuery)}&t=&z=15&ie=UTF8&iwloc=&output=embed`
      : '',
    [destinationMapQuery],
  );

  const clearExternalLocationContext = React.useCallback(() => {
    setExternalLocationContext(null);
    setDestinationGovernorates((current) => current.filter((item) => !item.id.startsWith('google:')));
    setDestinationDistricts((current) => current.filter((item) => !item.id.startsWith('google:')));
  }, []);

  const tripsWithin72Hours = React.useMemo<HistoricalTrip[]>(
    () => [...localCompletedTrips],
    [localCompletedTrips],
  );

  const systemMessages = React.useMemo(
    () => [
      'الخريطة تعمل بمصدر مجاني بدون خرائط مدفوعة.',
      `نطاقك الحالي: ${locationStatus === 'live' ? 'موقعك الحقيقي' : 'عمّان كنقطة احتياط'}.`,
    ],
    [locationStatus],
  );

  const handleLocationChange = React.useCallback((payload: RiderLocationUpdate) => {
    setRiderLocation(payload.location);
    setRiderH3Cell(payload.h3Cell);
    setLocationStatus(payload.status);
  }, []);

  const handleDestinationPinMoveStart = React.useCallback(() => {
    setIsDestinationPinMoving(true);
  }, []);

  const handleDestinationPinChange = React.useCallback((location: RiderLocation) => {
    setDestinationPinLocation(location);
    setIsDestinationPinMoving(false);
  }, []);

  const handleDestinationSearch = React.useCallback(async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const query = destinationSearchQuery.trim();
    if (query.length < 2) {
      setDestinationSearchResults([]);
      setDestinationSearchStatus('empty');
      return;
    }

    const districtName = isArabic
      ? selectedDistrict?.districtAr || selectedDistrict?.districtEn
      : selectedDistrict?.districtEn || selectedDistrict?.districtAr;
    const governorateName = isArabic
      ? selectedGovernorate?.nameAr || selectedGovernorate?.nameEn
      : selectedGovernorate?.nameEn || selectedGovernorate?.nameAr;
    const countryName = isArabic
      ? countryConfig?.name_ar || countryConfig?.name_en
      : countryConfig?.name_en || countryConfig?.name_ar;
    const scopedQuery = [query, districtName, governorateName, countryName]
      .map((part) => String(part || '').trim())
      .filter(Boolean)
      .filter((part, index, parts) => parts.indexOf(part) === index)
      .join(', ');
    const cacheKey = `${language}:${selectedGovernorateId}:${selectedDistrict?.id || ''}:${query.toLocaleLowerCase()}`;
    const cachedResults = destinationSearchCacheRef.current.get(cacheKey);
    if (cachedResults) {
      setDestinationSearchResults(cachedResults);
      setDestinationSearchStatus(cachedResults.length ? 'idle' : 'empty');
      return;
    }

    destinationSearchAbortRef.current?.abort();
    const controller = new AbortController();
    destinationSearchAbortRef.current = controller;
    setDestinationSearchStatus('searching');
    setDestinationSearchResults([]);

    try {
      const params = new URLSearchParams({
        q: scopedQuery,
        format: 'jsonv2',
        addressdetails: '1',
        limit: '5',
        'accept-language': language,
      });
      const response = await fetch(`https://nominatim.openstreetmap.org/search?${params.toString()}`, {
        signal: controller.signal,
        headers: { Accept: 'application/json' },
      });
      if (!response.ok) throw new Error(`Destination search failed: ${response.status}`);

      const payload = await response.json();
      const results = (Array.isArray(payload) ? payload : []).flatMap((item: any) => {
        const lat = Number(item?.lat);
        const lng = Number(item?.lon);
        const label = String(item?.display_name || '').trim();
        const placeId = Number(item?.place_id);
        return Number.isFinite(lat) && Number.isFinite(lng) && label && Number.isFinite(placeId)
          ? [{ placeId, label, location: { lat, lng } }]
          : [];
      }) as DestinationSearchResult[];

      destinationSearchCacheRef.current.set(cacheKey, results);
      setDestinationSearchResults(results);
      setDestinationSearchStatus(results.length ? 'idle' : 'empty');
    } catch (error) {
      if ((error as Error)?.name === 'AbortError') return;
      setDestinationSearchStatus('error');
    }
  }, [
    countryConfig?.name_ar,
    countryConfig?.name_en,
    destinationSearchQuery,
    isArabic,
    language,
    selectedDistrict,
    selectedGovernorate,
    selectedGovernorateId,
  ]);

  const handleDestinationSearchResult = React.useCallback((result: DestinationSearchResult) => {
    setDestinationSearchQuery(result.label);
    setDestinationSearchResults([]);
    setDestinationPinLocation(result.location);
    setDestinationFlyToTarget(result.location);
    setIsDestinationPinMoving(false);
    setDestinationSearchStatus('selected');
    setIsCaptainScanPreviewActive(false);
  }, []);

  const handleOpenGoogleMapsSearch = React.useCallback(async () => {
    setDestinationSearchResults([]);
    setDestinationSearchStatus('idle');
    const queryParts = [
      destinationSearchQuery.trim(),
      isArabic ? selectedDistrict?.districtAr || selectedDistrict?.districtEn : selectedDistrict?.districtEn || selectedDistrict?.districtAr,
      isArabic ? selectedGovernorate?.nameAr || selectedGovernorate?.nameEn : selectedGovernorate?.nameEn || selectedGovernorate?.nameAr,
      isArabic ? countryConfig?.name_ar || countryConfig?.name_en : countryConfig?.name_en || countryConfig?.name_ar,
    ].filter(Boolean);
    const query = queryParts.join(', ');
    const finalQuery = query || destinationSearchQuery.trim();
    if (!finalQuery) return;

    setIsLoadingMapPreview(true);
    try {
      const params = new URLSearchParams({
        q: finalQuery,
        format: 'jsonv2',
        limit: '1',
      });
      const response = await fetch(`https://nominatim.openstreetmap.org/search?${params.toString()}`, {
        headers: { Accept: 'application/json' },
      });
      if (!response.ok) throw new Error(`Map preview search failed: ${response.status}`);

      const payload = await response.json();
      const result = Array.isArray(payload) ? payload[0] : null;
      const lat = Number(result?.lat);
      const lon = Number(result?.lon);
      if (!result || !Number.isFinite(lat) || !Number.isFinite(lon)) {
        toast({
          variant: 'destructive',
          title: locationCopy('err_no_coords_found'),
        });
        return;
      }

      setModalPinLocation({ lat, lng: lon });
      setIsMapPickerOpen(true);
    } catch {
      toast({
        variant: 'destructive',
        title: locationCopy('err_invalid_clipboard_maps_link'),
      });
    } finally {
      setIsLoadingMapPreview(false);
    }
  }, [
    countryConfig?.name_ar,
    countryConfig?.name_en,
    destinationSearchQuery,
    isArabic,
    locationCopy,
    selectedDistrict?.districtAr,
    selectedDistrict?.districtEn,
    selectedGovernorate?.nameAr,
    selectedGovernorate?.nameEn,
    toast,
  ]);

  const handleCloseSearchMapEmbed = React.useCallback(() => {
    setIsMapPickerOpen(false);
    setModalSearchQuery('');
  }, []);

  const handleModalPinChange = React.useCallback((location: RiderLocation) => {
    setModalPinLocation(location);
  }, []);

  const handleModalMapSearch = React.useCallback(async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const query = modalSearchQuery.trim();
    if (query.length < 2) return;

    setIsModalSearchLoading(true);
    try {
      const params = new URLSearchParams({
        q: query,
        format: 'jsonv2',
        limit: '1',
        'accept-language': language,
      });
      const response = await fetch(`https://nominatim.openstreetmap.org/search?${params.toString()}`, {
        headers: { Accept: 'application/json' },
      });
      if (!response.ok) throw new Error(`Modal map search failed: ${response.status}`);

      const payload = await response.json();
      const result = Array.isArray(payload) ? payload[0] : null;
      const lat = Number(result?.lat);
      const lng = Number(result?.lon);
      if (!result || !Number.isFinite(lat) || !Number.isFinite(lng)) {
        toast({
          variant: 'destructive',
          title: locationCopy('err_no_coords_found'),
        });
        return;
      }

      setModalPinLocation({ lat, lng });
    } catch {
      toast({
        variant: 'destructive',
        title: destinationSearchCopy('error'),
      });
    } finally {
      setIsModalSearchLoading(false);
    }
  }, [destinationSearchCopy, language, locationCopy, modalSearchQuery, toast]);

  const handleConfirmModalLocation = React.useCallback(() => {
    if (!modalPinLocation) return;
    setDestinationPinLocation(modalPinLocation);
    setDestinationFlyToTarget(modalPinLocation);
    setDestinationSearchStatus('selected');
    setIsCaptainScanPreviewActive(false);
    setIsMapPickerOpen(false);
  }, [modalPinLocation]);

  const handleCopyModalLocationLink = React.useCallback(async () => {
    if (!modalPinLocation) return;
    const link = `https://www.google.com/maps/place/${modalPinLocation.lat},${modalPinLocation.lng}/@${modalPinLocation.lat},${modalPinLocation.lng},17z`;
    try {
      await navigator.clipboard.writeText(link);
      toast({ title: locationCopy('show_copied_link') });
    } catch {
      toast({
        variant: 'destructive',
        title: locationCopy('err_invalid_clipboard_maps_link'),
      });
    }
  }, [locationCopy, modalPinLocation, toast]);

  const applyClipboardLocation = React.useCallback((
    clipboardValue: string,
    parsedLocation: RiderLocation,
    geography?: ResolvedLocationGeography,
  ) => {
    const placeName = extractGoogleMapsPlaceName(clipboardValue);
    const resolvedPlaceName = placeName || locationCopy('external_place_name');
    const matchedGovernorate = findGovernorateForGeography(destinationGovernorates, geography);
    const matchedLoadedDistrict = matchedGovernorate?.id === selectedGovernorateId
      ? findDistrictForGeography(destinationDistricts, geography)
        || findNearestDistrict(destinationDistricts, parsedLocation)
      : null;
    const governorate = geography?.governorate || locationCopy('external_governorate');
    const district = geography?.city || geography?.district || resolvedPlaceName;
    const externalGovernorateId = `google:${slugifyLocationPart(governorate)}`;
    const externalDistrictId = `google:${slugifyLocationPart(`${district}-${parsedLocation.lat}-${parsedLocation.lng}`)}`;
    const externalGovernorate: GovernorateOption = {
      id: externalGovernorateId,
      numericId: 0,
      nameAr: governorate,
      nameEn: governorate,
    };
    const externalDistrict: DistrictOption = {
      id: externalDistrictId,
      numericId: 0,
      governorateId: externalGovernorateId,
      governorateAr: governorate,
      governorateEn: governorate,
      districtAr: district,
      districtEn: district,
      anchor: parsedLocation,
      tortuosityFactor: 1.3,
    };

    setExternalLocationUrl(clipboardValue);
    if (matchedGovernorate) {
      setExternalLocationContext(null);
      setDestinationGovernorates((current) => current.filter((item) => !item.id.startsWith('google:')));
      pendingConfirmedGeographyRef.current = geography || null;
      pendingConfirmedLocationRef.current = parsedLocation;
      setSelectedGovernorateId(matchedGovernorate.id);
      if (matchedLoadedDistrict) {
        setDraftDestinationId(matchedLoadedDistrict.id);
        pendingConfirmedGeographyRef.current = null;
        pendingConfirmedLocationRef.current = null;
      }
    } else {
      setExternalLocationContext({ governorate, district, placeName: resolvedPlaceName });
      setDestinationGovernorates((current) => [
        externalGovernorate,
        ...current.filter((item) => !item.id.startsWith('google:')),
      ]);
      setSelectedGovernorateId(externalGovernorateId);
      setDestinationDistricts([externalDistrict]);
      setDraftDestinationId(externalDistrictId);
    }
    setDestinationSearchQuery(resolvedPlaceName);
    // Route distance/time are calculated by the shared road-route effect after
    // the exact clipboard coordinates become the selected destination.
    setDestinationSearchResults([]);
    setDestinationPinLocation(parsedLocation);
    setDestinationFlyToTarget(parsedLocation);
    setIsDestinationPinMoving(false);
    setDestinationSearchStatus('selected');
    setIsCaptainScanPreviewActive(true);
  }, [destinationDistricts, destinationGovernorates, locationCopy, selectedGovernorateId]);

  const handleConfirmClipboardLocation = React.useCallback(async () => {
    if (!navigator.clipboard?.readText) {
      toast({
        variant: 'destructive',
        title: locationCopy('err_invalid_clipboard_maps_link'),
      });
      return;
    }

    setIsReadingClipboardLocation(true);
    setIsCaptainScanPreviewActive(false);
    try {
      const clipboardText = await readClipboardLocationText();
      const result = await resolveClipboardMapLocation(clipboardText);
      applyClipboardLocation(result.resolvedUrl, result.location, result.geography);
    } catch (error) {
      const errorKey =
        error instanceof ClipboardMapLocationError && error.code === 'COORDINATES_NOT_FOUND'
          ? 'err_no_coords_found'
          : error instanceof ClipboardMapLocationError && error.code === 'RESOLUTION_FAILED'
            ? 'err_short_maps_link_needs_expanded_url'
            : 'err_invalid_clipboard_maps_link';
      toast({
        variant: 'destructive',
        title: locationCopy(errorKey),
      });
    } finally {
      setIsReadingClipboardLocation(false);
    }
  }, [applyClipboardLocation, locationCopy, toast]);

  React.useEffect(() => () => {
    destinationSearchAbortRef.current?.abort();
  }, []);

  const openDestination = React.useCallback(() => {
    dispatch({ type: 'OPEN_DESTINATION' });
    if (selectedDraftDestination) {
      dispatch({ type: 'CONFIRM_DESTINATION', destination: selectedDraftDestination });
    }
  }, [dispatch, selectedDraftDestination]);

  React.useEffect(() => {
    if (state.screen === 'DESTINATION_SELECTION' && selectedDraftDestination) {
      dispatch({ type: 'CONFIRM_DESTINATION', destination: selectedDraftDestination });
    }
  }, [dispatch, selectedDraftDestination, state.screen]);

  React.useEffect(() => {
    setDestinationPinLocation(selectedDistrict?.anchor || null);
    setIsDestinationPinMoving(false);
  }, [selectedDistrict?.anchor, selectedDistrict?.id]);

  React.useEffect(() => {
    dispatch({ type: 'RESET_TO_IDLE' });
  }, [dispatch, user?.uid]);

  React.useEffect(() => {
    let active = true;

    async function loadEmergencyContact() {
      if (!user?.uid) {
        setEmergencyWhatsappContact('');
        return;
      }

      const storageKey = `radar_emergency_whatsapp_${user.uid}`;
      const localValue = typeof window !== 'undefined' ? window.localStorage.getItem(storageKey) || '' : '';
      setEmergencyWhatsappContact(localValue);

      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('emergency_whatsapp_contact')
          .eq('id', user.uid)
          .maybeSingle();

        if (error) throw error;

        const value = firstDisplayString((data as Record<string, unknown> | null)?.emergency_whatsapp_contact);
        if (active && value) {
          setEmergencyWhatsappContact(value);
          window.localStorage.setItem(storageKey, value);
        }
      } catch (error) {
        if ((process.env.NODE_ENV !== 'production')) console.warn('[Rider Emergency Contact]', error);
      }
    }

    void loadEmergencyContact();

    return () => {
      active = false;
    };
  }, [user?.uid]);

  const handleAddEmergencyContact = React.useCallback(() => {
    setShowEmergencyContactDialog(false);
    window.location.hash = '#profile';
  }, []);

  const handleEmergencyWhatsapp = React.useCallback(() => {
    const whatsapp = normalizeWhatsappContact(emergencyWhatsappContact);
    if (!whatsapp) {
      setShowEmergencyContactDialog(true);
      return;
    }

    const captainName = firstDisplayString(state.activeTrip?.captainName);
    const destination = firstDisplayString(state.activeTrip?.destinationLabel);
    const shortRequestId = state.requestId ? state.requestId.slice(0, 8).toUpperCase() : '';
    const defaultMessage = language === 'ar'
      ? [
          'أنا في رحلة الآن وأحتاج إلى المساعدة.',
          captainName ? `السائق: ${captainName}.` : '',
          destination ? `الوجهة: ${destination}.` : '',
          shortRequestId ? `رقم الطلب: ${shortRequestId}.` : '',
        ].filter(Boolean).join(' ')
      : [
          'I am currently on a ride and need help.',
          captainName ? `Captain: ${captainName}.` : '',
          destination ? `Destination: ${destination}.` : '',
          shortRequestId ? `Request: ${shortRequestId}.` : '',
        ].filter(Boolean).join(' ');

    const message = encodeURIComponent(copy.emergencyWhatsappMessage || defaultMessage);
    const opened = window.open(`https://wa.me/${whatsapp}?text=${message}`, '_blank', 'noopener,noreferrer');
    if (!opened) {
      toast({
        variant: 'destructive',
        title: copy.emergencyWhatsappUnavailableTitle || (language === 'ar' ? 'تعذر فتح واتساب' : 'Could not open WhatsApp'),
        description: copy.emergencyWhatsappUnavailableDescription || (language === 'ar' ? 'افتح واتساب يدوياً وتواصل مع رقم الطوارئ.' : 'Open WhatsApp manually and contact your emergency number.'),
      });
    }
  }, [copy, emergencyWhatsappContact, language, state.activeTrip?.captainName, state.activeTrip?.destinationLabel, state.requestId, toast]);

  React.useEffect(() => {
    window.addEventListener('rider-open-destination', openDestination);
    return () => window.removeEventListener('rider-open-destination', openDestination);
  }, [openDestination]);

  React.useEffect(() => {
    let active = true;
    const countryId = Number(activeCountryId);

    setCountryConfig(null);

    if (!Number.isInteger(countryId) || countryId <= 0) {
      return;
    }

    async function fetchCountryCurrency() {
      try {
        const { data, error } = await supabase
          .from('countries')
          .select('id,name_ar,name_en,currency_ar,currency_en')
          .eq('id', countryId)
          .single();
        if (error) throw error;
        if (active) setCountryConfig(data as CountryCurrencyConfig);
      } catch (error) {
        if (!active) return;
        if ((process.env.NODE_ENV !== 'production')) console.warn('[Supabase Country Currency Fetch]', error);
      }
    }

    void fetchCountryCurrency();

    return () => {
      active = false;
    };
  }, [activeCountryId, toast]);

  React.useEffect(() => {
    let active = true;
    const countryId = Number(activeCountryId);

    setDestinationGovernorates([]);
    setDestinationDistricts([]);
    setSelectedGovernorateId('');
    setDraftDestinationId('');
    setDestinationDataError(null);

    if (!Number.isInteger(countryId) || countryId <= 0) {
      setDestinationDataError('لا توجد دولة مرتبطة بالحساب. حدّث بيانات حسابك أولاً.');
      return;
    }

    async function fetchDestinationGovernorates() {
      setIsLoadingGovernorates(true);
      try {
        const { data, error } = await supabase
          .from('governorates')
          .select('*')
          .eq('country_id', countryId)
          .order('id', { ascending: true });

        if (error) throw error;
        if (!active) return;

        const options = normalizeGovernorates(data);
        setDestinationGovernorates(options);

        const profileGovernorateId = String(user?.governorate || '');
        const preferred = options.find((governorate) => governorate.id === profileGovernorateId) || options[0] || null;
        setSelectedGovernorateId(preferred?.id || '');
        if (!preferred) setDestinationDataError('لا توجد محافظات متاحة لهذه الدولة حالياً.');
      } catch (error) {
        if (!active) return;
        if ((process.env.NODE_ENV !== 'production')) console.warn('[Rider Destinations: Governorates]', error);
        setDestinationDataError(copy.networkError);
      } finally {
        if (active) setIsLoadingGovernorates(false);
      }
    }

    void fetchDestinationGovernorates();

    return () => {
      active = false;
    };
  }, [activeCountryId, copy.networkError, toast, user?.governorate]);

  React.useEffect(() => {
    let active = true;
    const governorateId = Number(selectedGovernorateId);

    setDestinationDistricts([]);
    setDraftDestinationId('');
    setDestinationDataError(null);

    if (selectedGovernorateId.startsWith('google:')) {
      const governorate = externalLocationContext?.governorate || selectedGovernorate?.nameAr || '';
      const district = externalLocationContext?.district || externalLocationContext?.placeName || '';
      if (governorate && district && destinationPinLocation) {
        const externalDistrict: DistrictOption = {
          id: `google:${slugifyLocationPart(`${district}-${destinationPinLocation.lat}-${destinationPinLocation.lng}`)}`,
          numericId: 0,
          governorateId: selectedGovernorateId,
          governorateAr: governorate,
          governorateEn: governorate,
          districtAr: district,
          districtEn: district,
          anchor: destinationPinLocation,
          tortuosityFactor: 1.3,
        };
        setDestinationDistricts([externalDistrict]);
        setDraftDestinationId(externalDistrict.id);
      }
      setIsLoadingDistricts(false);
      return () => {
        active = false;
      };
    }

    if (!Number.isInteger(governorateId) || governorateId <= 0) {
      return;
    }

    async function fetchDestinationDistricts() {
      setIsLoadingDistricts(true);
      try {
        const { data, error } = await supabase
          .from('districts')
          .select('*')
          .eq('governorate_id', governorateId)
          .order('id', { ascending: true });

        if (error) throw error;
        if (!active) return;

        const options = normalizeDistricts(data, selectedGovernorate);
        setDestinationDistricts(options);

        const confirmedDistrict = findDistrictForGeography(
          options,
          pendingConfirmedGeographyRef.current || undefined,
        ) || (
          pendingConfirmedLocationRef.current
            ? findNearestDistrict(options, pendingConfirmedLocationRef.current)
            : null
        );
        if (confirmedDistrict) {
          pendingConfirmedGeographyRef.current = null;
          pendingConfirmedLocationRef.current = null;
        }
        const profileDistrictId = String(user?.district || '');
        const preferred = confirmedDistrict
          || options.find((district) => district.id === profileDistrictId)
          || options.find((district) => district.anchor)
          || options[0]
          || null;
        setDraftDestinationId(preferred?.id || '');
        if (!preferred) setDestinationDataError('لا توجد مناطق متاحة لهذه المحافظة حالياً.');
      } catch (error) {
        if (!active) return;
        if ((process.env.NODE_ENV !== 'production')) console.warn('[Rider Destinations: Districts]', error);
        setDestinationDataError(copy.networkError);
      } finally {
        if (active) setIsLoadingDistricts(false);
      }
    }

    void fetchDestinationDistricts();

    return () => {
      active = false;
    };
  }, [copy.networkError, districtLoadKey, toast, user?.district]);

  React.useEffect(() => {
    let active = true;
    const countryId = Number(activeCountryId);

    if (!selectedDistrict) {
      setServerFareState({
        key: fareRequestKey,
        fare: null,
        isLoading: false,
        error: destinationDataError || 'اختر المحافظة والمنطقة أولاً.',
      });
      return;
    }

    if (!selectedDestinationCoords) {
      setServerFareState({
        key: fareRequestKey,
        fare: null,
        isLoading: false,
        error: 'هذه المنطقة لا تحتوي إحداثيات في قاعدة البيانات. حدّث بيانات المنطقة ثم حاول مرة أخرى.',
      });
      return;
    }

    if (!Number.isInteger(countryId) || countryId <= 0) {
      setServerFareState({
        key: fareRequestKey,
        fare: null,
        isLoading: false,
        error: 'لا يمكن حساب السعر قبل تحديد دولة الحساب.',
      });
      return;
    }

    setServerFareState({
      key: fareRequestKey,
      fare: null,
      isLoading: true,
      error: null,
    });

    const timeoutId = window.setTimeout(() => {
      calculateServerFare(supabase, {
        origin: riderLocation,
        destination: selectedDestinationCoords,
        countryId,
      })
        .then((fare) => {
          if (!active) return;
          setServerFareState({
            key: fareRequestKey,
            fare,
            isLoading: false,
            error: null,
          });
        })
        .catch((error) => {
          if (!active) return;
          const message = mapRiderMarketplaceError(error);
          setServerFareState({
            key: fareRequestKey,
            fare: null,
            isLoading: false,
            error: message,
          });
        });
    }, FARE_RECALCULATION_DEBOUNCE_MS);

    return () => {
      active = false;
      window.clearTimeout(timeoutId);
    };
  }, [activeCountryId, destinationDataError, fareRequestKey, riderLocation, selectedDestinationCoords, selectedDistrict]);

  React.useEffect(() => {
    if (!selectedDestinationCoords || !hasUsableRiderLocation) {
      setRouteEstimateState({ key: fareRequestKey, estimate: null, isLoading: false });
      return;
    }

    let active = true;
    const timeoutId = window.setTimeout(() => {
      setRouteEstimateState({ key: fareRequestKey, estimate: null, isLoading: true });

      void fetchRoadRoute(
        riderLocation,
        selectedDestinationCoords,
        selectedDistrict?.tortuosityFactor || 1.3,
      ).then((estimate) => {
        if (!active) return;
        setRouteEstimateState({ key: fareRequestKey, estimate, isLoading: false });
      }).catch((error) => {
        if (!active) return;
        if (process.env.NODE_ENV !== 'production') {
          console.warn('[Rider Distance Audit]', error);
        }
        setRouteEstimateState({ key: fareRequestKey, estimate: null, isLoading: false });
      });
    }, FARE_RECALCULATION_DEBOUNCE_MS);

    return () => {
      active = false;
      window.clearTimeout(timeoutId);
    };
  }, [fareRequestKey, hasUsableRiderLocation, riderLocation, selectedDestinationCoords, selectedDistrict?.tortuosityFactor]);

  const loadBlockedCaptains = React.useCallback(async () => {
    if (!user?.uid) return;
    try {
      const { data, error } = await supabase
        .from('user_blocks')
        .select('blocked_id')
        .eq('blocker_id', user.uid);
      if (error) throw error;
      setBlockedCaptainIds(new Set((data || []).map((row: any) => String(row.blocked_id))));
    } catch (err) {
      if ((process.env.NODE_ENV !== 'production')) console.warn('[Rider View Tab] loadBlockedCaptains error:', err);
    }
  }, [user?.uid]);

  React.useEffect(() => {
    void loadBlockedCaptains();
  }, [loadBlockedCaptains]);

  const mappedCaptains = React.useMemo(() => {
    return captainLocations.map((captain) => ({
      ...captain,
      isBlocked: blockedCaptainIds.has(captain.id),
    }));
  }, [captainLocations, blockedCaptainIds]);

  React.useEffect(() => {
    if (!state.requestId) return;

    return subscribeToRideRequestStatus(
      supabase,
      state.requestId,
      (row) => {
        const status = String(row.status || '').toUpperCase();

        if (status === 'RECEIVING_OFFERS') {
          dispatch({ type: 'SERVER_STATUS_RECEIVING_OFFERS' });
        }

        if (
          status === 'ACCEPTED'
          || status === 'EN_ROUTE'
          || status === 'ARRIVED'
          || status === 'STARTED'
          || status === 'TRIP_ACTIVE'
          || status === 'ACTIVE'
          || status === 'IN_PROGRESS'
        ) {
          dispatch({
            type: 'SERVER_STATUS_ACCEPTED',
            row: {
              ...row,
              selected_offer_id: row.selected_offer_id || row.accepted_offer_id || pendingAcceptedOfferIdRef.current,
            },
          });
          if (status === 'ACCEPTED') {
            pendingAcceptedOfferIdRef.current = null;
          }
        }

        if (status === 'CANCELLED') {
          pendingAcceptedOfferIdRef.current = null;
          dispatch({ type: 'REQUEST_CANCELLED' });
        }

        if (status === 'COMPLETED') {
          pendingAcceptedOfferIdRef.current = null;
          dispatch({ type: 'SERVER_STATUS_COMPLETED', row });
        }
      },
      (error) => {
        toast({
          variant: 'destructive',
          title: copy.requestUpdateFailedTitle,
          description: getLocalizedMarketplaceError(error, language),
        });
      },
    );
  }, [copy.requestUpdateFailedTitle, dispatch, language, state.requestId, toast]);

  React.useEffect(() => {
    let active = true;

    async function loadCaptainPresence() {
      if (!activeCountryId) {
        setCaptainLocations([]);
        return;
      }

      try {
        const rows = await fetchAvailableCaptainPresence(supabase, {
          centerH3Cell: riderH3Cell,
          countryId: activeCountryId,
          ringSize: 1,
        });
        if (active) setCaptainLocations(rows);
      } catch (error) {
        if (!active) return;
        if ((process.env.NODE_ENV !== 'production')) console.warn('[Rider Captain Presence]', error);
        setCaptainLocations([]);
      }
    }

    void loadCaptainPresence();
    const refreshInterval = window.setInterval(() => void loadCaptainPresence(), CAPTAIN_PRESENCE_REFRESH_MS);
    const pruneInterval = window.setInterval(() => {
      setCaptainLocations((previous) => previous.filter((captain) => isCaptainPresenceFresh(captain)));
    }, CAPTAIN_PRESENCE_PRUNE_MS);

    const channel = activeCountryId
      ? supabase
          .channel(`captain-presence-${activeCountryId}-${riderH3Cell}`)
          .on(
            'postgres_changes',
            {
              event: '*',
              schema: 'public',
              table: 'captain_locations',
            },
            () => void loadCaptainPresence(),
          )
          .subscribe()
      : null;

    return () => {
      active = false;
      window.clearInterval(refreshInterval);
      window.clearInterval(pruneInterval);
      void channel?.unsubscribe();
    };
  }, [activeCountryId, riderH3Cell]);

  React.useEffect(() => {
    if (!state.requestId || state.screen !== 'RECEIVING_OFFERS' || state.requestCancelledAt) return;

    let active = true;

    const refreshOffers = async () => {
      try {
        const [offers, favs] = await Promise.all([
          fetchRideOffers(supabase, state.requestId!),
          dexieDb.favoriteCaptains.toArray().catch(() => [])
        ]);

        const favoriteIds = collectPreferredCaptainIds(favs);
        const sortedOffers = prioritizeRiderOffers(offers, favoriteIds);

        if (active) {
          setPreferredCaptainIds(favoriteIds);
          dispatch({ type: 'RECEIVE_OFFERS', offers: sortedOffers });
        }
      } catch (error) {
        if (!active) return;
        if ((process.env.NODE_ENV !== 'production')) console.warn('[Rider Offers]', error);
        setPreferredCaptainIds([]);
        dispatch({ type: 'RECEIVE_OFFERS', offers: [] });
      }
    };

    void refreshOffers();

    const unsubscribe = subscribeToRideOffers(
      supabase,
      state.requestId,
      () => void refreshOffers(),
      () => {
        if ((process.env.NODE_ENV !== 'production')) console.warn('[Rider Offers Realtime] subscription unavailable');
      },
    );

    return () => {
      active = false;
      unsubscribe();
    };
  }, [dispatch, state.requestCancelledAt, state.requestId, state.screen, toast]);

  React.useEffect(() => {
    if (!state.requestId || state.screen !== 'RECEIVING_OFFERS' || state.offers.length > 0 || state.requestCancelledAt) return;

    const timeoutId = window.setTimeout(() => {
      cancelRideRequest(supabase, state.requestId!)
        .catch(() => {
          toast({
            variant: 'destructive',
            title: copy.requestUpdateFailedTitle,
            description: copy.networkError,
          });
        });
    }, OFFER_TIMEOUT_MS);

    return () => window.clearTimeout(timeoutId);
  }, [copy.networkError, copy.requestUpdateFailedTitle, dispatch, state.offers.length, state.requestCancelledAt, state.requestId, state.screen, toast]);

  React.useEffect(() => {
    if (state.screen !== 'RECEIVING_OFFERS' || state.offers.length > 0 || state.requestCancelledAt) {
      setCaptainSearchRadiusKm(1.5);
      setIsExpandingCaptainSearch(false);
      return;
    }

    if (captainSearchRadiusKm >= 2.5) return;

    const timeoutId = window.setTimeout(() => {
      setIsExpandingCaptainSearch(true);
      window.setTimeout(() => {
        setCaptainSearchRadiusKm(2.5);
        setIsExpandingCaptainSearch(false);
      }, 900);
    }, 4500);

    return () => window.clearTimeout(timeoutId);
  }, [captainSearchRadiusKm, state.offers.length, state.requestCancelledAt, state.screen]);

  React.useEffect(() => {
    if (state.screen !== 'RECEIVING_OFFERS' || state.offers.length === 0) {
      setExpandedOfferId(null);
      return;
    }

    setExpandedOfferId((current) => {
      if (current && state.offers.some((offer) => (offer.id || offer.driverId) === current)) return current;
      const first = state.offers[0];
      return first ? first.id || first.driverId : null;
    });
  }, [state.offers, state.screen]);

  React.useEffect(() => {
    if (!state.activeTrip) {
      setEtaSeconds(0);
      return;
    }

    setEtaSeconds(state.activeTrip.etaSeconds);
    const interval = window.setInterval(() => {
      setEtaSeconds((prev) => Math.max(0, prev - 1));
    }, 1000);

    return () => window.clearInterval(interval);
  }, [state.activeTrip]);

  const handleGovernorateChange = (governorateId: string) => {
    clearExternalLocationContext();
    setSelectedGovernorateId(governorateId);
    setDraftDestinationId('');
    setDestinationPinLocation(null);
    setDestinationFlyToTarget(null);
    setDestinationSearchQuery('');
    setDestinationSearchResults([]);
    setDestinationSearchStatus('idle');
    setExternalLocationUrl('');
    setIsMapPickerOpen(false);
    setIsCaptainScanPreviewActive(false);
  };

  const handleDistrictChange = (districtId: string) => {
    clearExternalLocationContext();
    setDraftDestinationId(districtId);
    const district = destinationDistricts.find((item) => item.id === districtId);
    setDestinationPinLocation(null);
    setDestinationFlyToTarget(district?.anchor || null);
    setDestinationSearchQuery('');
    setDestinationSearchResults([]);
    setDestinationSearchStatus('idle');
    setExternalLocationUrl('');
    setIsMapPickerOpen(false);
    setIsCaptainScanPreviewActive(false);
  };

  const handleSendRequest = async () => {
    if (!user?.uid) {
      toast({
        variant: 'destructive',
        title: copy.loginRequiredTitle,
        description: copy.loginRequiredDescription,
      });
      return;
    }

    const countryId = Number(activeCountryId);
    if (!Number.isInteger(countryId) || countryId <= 0) {
      toast({
        variant: 'destructive',
        title: copy.countryMissingTitle,
        description: copy.countryMissingDescription,
      });
      return;
    }

    if (!selectedDraftDestination || !selectedDestinationCoords) {
      toast({
        variant: 'destructive',
        title: copy.destinationNotReadyTitle,
        description: copy.destinationNotReadyDescription,
      });
      return;
    }

    if (
      selectedDraftDestination.serverEstimatedFare === undefined ||
      isServerFareLoading ||
      isRouteEstimateLoading ||
      !currentRouteEstimate
    ) {
      toast({
        variant: 'destructive',
        title: copy.fareNotReadyTitle,
        description: copy.fareNotReadyDescription,
      });
      return;
    }

    // Unlock audio context for modern browser autoplay policies
    if (typeof window !== 'undefined') {
      const unlockAudio = new Audio('/sounds/notification.mp3');
      unlockAudio.volume = 0;
      unlockAudio.play().catch(() => {});
    }

    dispatch({ type: 'CONFIRM_DESTINATION', destination: selectedDraftDestination });
    dispatch({ type: 'SEND_REQUEST' });
    setIsSendingRideRequest(true);

    try {
      const payload = buildRideRequestInsertPayload({
        riderId: user.uid,
        origin: riderLocation,
        destination: selectedDestinationCoords,
        originH3: selectedDraftDestination.originCell || latLngToCell(riderLocation.lat, riderLocation.lng, H3_RIDER_REQUEST_RESOLUTION),
        destinationH3:
          selectedDraftDestination.destinationCell ||
          latLngToCell(selectedDestinationCoords.lat, selectedDestinationCoords.lng, H3_RIDER_REQUEST_RESOLUTION),
        destinationAddressAr: selectedDraftDestination.label,
        serverEstimatedFare: selectedDraftDestination.serverEstimatedFare,
        countryId,
      });

      const request = await createRideRequest(supabase, payload);
      dispatch({ type: 'SERVER_REQUEST_CREATED', requestId: request.id });
      dispatch({ type: 'SERVER_STATUS_RECEIVING_OFFERS' });

      toast({
        title: copy.requestSentTitle,
        description: copy.requestSentDescription,
      });
    } catch (error) {
      if ((process.env.NODE_ENV !== 'production')) {
        console.warn('[Rider Ride Request Insert]', error);
      }
      pendingAcceptedOfferIdRef.current = null;
      dispatch({ type: 'REQUEST_FAILED' });
      toast({
        variant: 'destructive',
        title: copy.requestFailedTitle,
        description: getLocalizedMarketplaceError(error, language),
      });
    } finally {
      setIsSendingRideRequest(false);
    }
  };

  const resetRideDraftState = React.useCallback(() => {
    pendingAcceptedOfferIdRef.current = null;
    destinationSearchAbortRef.current?.abort();
    destinationSearchAbortRef.current = null;
    destinationSearchCacheRef.current.clear();
    pendingConfirmedGeographyRef.current = null;
    pendingConfirmedLocationRef.current = null;

    setSelectedGovernorateId('');
    setDraftDestinationId('');
    setRiderCount(1);
    setRating({ captain: 0, vehicle: 0, favorite: false });
    setRatingComment('');
    setExpandedOfferId(null);
    setCaptainSearchRadiusKm(1.5);
    setIsExpandingCaptainSearch(false);
    setEtaSeconds(0);
    setCaptainLocations([]);
    setExternalLocationUrl('');
    setExternalLocationContext(null);
    setDestinationSearchQuery('');
    setDestinationSearchResults([]);
    setDestinationSearchStatus('idle');
    setIsReadingClipboardLocation(false);
    setIsCaptainScanPreviewActive(false);
    setIsDestinationPinMoving(false);
    setDestinationPinLocation(null);
    setDestinationFlyToTarget(null);
    setDestinationDataError(null);
    setServerFareState({ key: '', fare: null, isLoading: false, error: null });
    setRouteEstimateState({ key: '', estimate: null, isLoading: false });
    setIsMapPickerOpen(false);
    setModalPinLocation(null);

    try {
      [
        'radar_ride_request_draft',
        'radar_destination_draft',
        'radar_auction_draft',
        'radar_external_location_draft',
        'radar_request_flow',
      ].forEach((key) => window.localStorage.removeItem(key));
    } catch {
      // Storage can be unavailable in private browsing; in-memory state is still reset.
    }
  }, []);

  const handleCancelRideRequest = async () => {
    if (!state.requestId) {
      resetRideDraftState();
      dispatch({ type: 'RESET_TO_IDLE' });
      onExitRequestFlow?.();
      return;
    }

    setIsCancellingRideRequest(true);

    try {
      await cancelRideRequest(supabase, state.requestId);
      resetRideDraftState();
      dispatch({ type: 'RESET_TO_IDLE' });
      onExitRequestFlow?.();
      toast({
        title: requestFlowCopy.requestCancelledTitle,
        description: requestFlowCopy.requestCancelledDescription,
      });
    } catch (error) {
      if ((process.env.NODE_ENV !== 'production')) console.warn('[Rider Cancel Request]', error);
      toast({
        variant: 'destructive',
        title: requestFlowCopy.cancelRequestFailedTitle,
        description: getLocalizedMarketplaceError(error, language),
      });
    } finally {
      setIsCancellingRideRequest(false);
    }
  };

  const handleAcceptOffer = async (offer: import('@/core/types').Offer) => {
    if (!state.requestId) {
      toast({
        variant: 'destructive',
        title: 'تعذر قبول العرض',
        description: 'لا يوجد طلب رحلة نشط حالياً. حاول إرسال الطلب مرة أخرى.',
      });
      return;
    }

    const offerId = offer.id;
    if (!offerId || offerId === offer.driverId) {
      toast({
        variant: 'destructive',
        title: 'تعذر قبول العرض',
        description: 'بيانات العرض غير مكتملة. انتظر تحديث العروض ثم حاول مرة أخرى.',
      });
      return;
    }

    setAcceptingOfferId(offerId);
    pendingAcceptedOfferIdRef.current = offerId;

    try {
      await acceptRideOffer(supabase, {
        requestId: state.requestId,
        offerId,
      });
      dispatch({ type: 'SELECT_OFFER', offerId });
    } catch (error) {
      pendingAcceptedOfferIdRef.current = null;
      if ((process.env.NODE_ENV !== 'production')) console.warn('[Rider Accept Offer]', error);
      toast({
        variant: 'destructive',
        title: language === 'ar' ? 'تعذر قبول العرض' : 'Could not accept offer',
        description: getLocalizedMarketplaceError(error, language),
      });
    } finally {
      setAcceptingOfferId(null);
    }
  };

  const handleCompleteTrip = async () => {
    if (!state.activeTrip) return;
    if (!state.requestId) {
      toast({
        variant: 'destructive',
        title: 'تعذر إنهاء الرحلة',
        description: 'لا يوجد طلب رحلة نشط. انتظر تحديث الرحلة ثم حاول مرة أخرى.',
      });
      return;
    }

    setIsCompletingTrip(true);

    const historicalTrip = toHistoricalTrip(state.activeTrip);
    const ledgerEntry: RiderTripLedgerEntry = {
      ...historicalTrip,
      purgeAt: historicalTrip.timestamp + THREE_DAYS_MS,
    };

    try {
      await completeRideTrip(supabase, { requestId: state.requestId });

      try {
        await dexieDb.riderTripLedger.put(ledgerEntry);
        setLocalCompletedTrips((previous) => [
          historicalTrip,
          ...previous.filter((trip) => trip.tripId !== historicalTrip.tripId),
        ]);
      } catch (cacheError) {
        if ((process.env.NODE_ENV !== 'production')) console.warn('[Rider Complete Trip Cache]', cacheError);
        setLocalCompletedTrips((previous) => [historicalTrip, ...previous]);
      }

      dispatch({ type: 'COMPLETE_TRIP' });
    } catch (error) {
      if ((process.env.NODE_ENV !== 'production')) console.warn('[Rider Complete Trip]', error);
      try {
        const row = await fetchRideRequestStatus(supabase, state.requestId);
        const status = String(row?.status || '').toUpperCase();
        if (status === 'COMPLETED') {
          dispatch({ type: 'SERVER_STATUS_COMPLETED', row: row || undefined });
          return;
        }
      } catch (statusError) {
        if ((process.env.NODE_ENV !== 'production')) console.warn('[Rider Complete Trip Status Check]', statusError);
      }
      toast({
        variant: 'destructive',
        title: 'تعذر إنهاء الرحلة',
        description: mapRiderMarketplaceError(error),
      });
    } finally {
      setIsCompletingTrip(false);
    }
  };

  const handleSubmitRating = async () => {
    if (!state.completedTrip || !state.requestId) {
      toast({
        variant: 'destructive',
        title: 'تعذر حفظ التقييم',
        description: 'بيانات الرحلة غير مكتملة. انتظر تحديث الرحلة ثم حاول مرة أخرى.',
      });
      return;
    }

    const ratingValue = Math.max(1, Math.min(5, Math.round(rating.captain)));
    setIsSubmittingRating(true);

    try {
      await submitRideRating(supabase, {
        requestId: state.requestId,
        captainId: state.completedTrip.captainId,
        ratingValue,
        comment: ratingComment || undefined,
      });

      if (rating.favorite) {
        try {
          const favoriteTrip = toHistoricalTrip(state.completedTrip);
          await dexieDb.favoriteCaptains.put({
            ...favoriteTrip,
            captainId: state.completedTrip.captainId,
            driverId: state.completedTrip.captainId,
            heartedAt: Date.now(),
          } as any);
          if (typeof window !== 'undefined' && state.completedTrip.captainId) {
            window.localStorage.setItem(
              `radar_preferred_captain_${state.completedTrip.captainId}`,
              JSON.stringify({
                captainId: state.completedTrip.captainId,
                driverId: state.completedTrip.captainId,
                captainName: state.completedTrip.captainName,
                fullName: state.completedTrip.captainName,
                captainPhone: state.completedTrip.captainPhone,
                phoneNumber: state.completedTrip.captainPhone,
                vehicleSpecs: `${state.completedTrip.vehicleType} - ${state.completedTrip.vehiclePlate}`,
                savedTimestamp: Date.now(),
              }),
            );
          }
        } catch (cacheError) {
          if ((process.env.NODE_ENV !== 'production')) console.warn('[Rider Favorite Captain Cache]', cacheError);
        }
      }

      dispatch({ type: 'SUBMIT_RATING' });
      setRating({ captain: 0, vehicle: 0, favorite: false });
      setRatingComment('');
    } catch (error) {
      if ((process.env.NODE_ENV !== 'production')) console.warn('[Rider Submit Rating]', error);
      toast({
        variant: 'destructive',
        title: 'تعذر حفظ التقييم',
        description: mapRiderMarketplaceError(error),
      });
    } finally {
      setIsSubmittingRating(false);
    }
  };

  const renderStatePanel = () => {
    if (state.screen === 'DESTINATION_SELECTION') {
      const hasDestinationOptions = destinationGovernorates.length > 0 && availableDistricts.length > 0;
      const selectedDestinationHasCoords = !!selectedDestinationCoords;
      const serverFareLabel =
        isServerFareLoading || isDestinationPinMoving
          ? copy.updatingFare
          : selectedDraftDestination?.serverEstimatedFare !== undefined
          ? formatMoney(selectedDraftDestination.serverEstimatedFare, currencyLabel)
          : copy.notAvailable;

      const originH3 = selectedDraftDestination?.originCell || '';
      const destinationH3 = selectedDraftDestination?.destinationCell || '';
      const isSameLocation = !!originH3 && !!destinationH3 && originH3 === destinationH3;
      const estimatedDistanceKm = currentRouteEstimate?.distanceKm ?? null;
      const estimatedDurationMinutes = currentRouteEstimate?.durationMinutes ?? null;
      const hasImportedLocation = externalLocationUrl.length > 0;
      const destinationReady =
        selectedDestinationHasCoords &&
        selectedDraftDestination?.serverEstimatedFare !== undefined &&
        currentRouteEstimate !== null &&
        !isServerFareLoading &&
        !isRouteEstimateLoading &&
        !isDestinationPinMoving &&
        !isSameLocation;
      const destinationLabel = externalLocationContext
        ? `${externalLocationContext.district} - ${externalLocationContext.governorate}`
        : selectedDistrict
          ? isArabic
            ? `${selectedDistrict.districtAr} - ${selectedDistrict.governorateAr}`
            : `${selectedDistrict.districtEn || selectedDistrict.districtAr} - ${selectedDistrict.governorateEn || selectedDistrict.governorateAr}`
          : copy.notAvailable;

      return (
        <div className={styles.style1548_1} dir={isArabic ? 'rtl' : 'ltr'}>
            <div className={styles.style1549_2}>
              <div className={styles.style1550_3}>
                <div className={styles.style1551_4}>
                  <p className={styles.style1552_5}>{copy.destinationEyebrow}</p>
                  <h2 className={styles.style1553_6}>{copy.whereTo}</h2>
                  <p className={styles.style1554_7}>{locationCopy('flow_helper')}</p>
                </div>
                {countryConfig?.name_ar || countryConfig?.name_en ? (
                  <span className={styles.style1557_8}>
                    {isArabic ? countryConfig.name_ar || countryConfig.name_en : countryConfig.name_en || countryConfig.name_ar}
                  </span>
                ) : null}
              </div>

              <div className={styles.style1563_9} aria-label={locationCopy('progress_label')}>
                {[
                  { label: locationCopy('progress_area'), complete: !!selectedDistrict },
                  { label: locationCopy('progress_location'), complete: hasImportedLocation || selectedDestinationHasCoords },
                  { label: locationCopy('progress_review'), complete: destinationReady },
                ].map((step, index) => (
                  <div
                    key={step.label}
                    className={cn(
                      styles.style1572_10,
                      step.complete
                        ? styles.style1574_11
                        : styles.style1575_12,
                    )}
                  >
                    <span
                      className={cn(
                        styles.style1580_13,
                        step.complete ? styles.style1581_14 : styles.style1581_15,
                      )}
                    >
                      {step.complete ? <Check className={styles.style1584_16} /> : index + 1}
                    </span>
                    <span className={styles.style1586_17}>{step.label}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className={styles.style1592_18}>
              {/* <div className="space-y-2">
                <span className="block text-[11px] font-black text-slate-400">{destinationSearchCopy('label')}</span>
                <form
                  onSubmit={(event) => {
                    event.preventDefault();
                    handleOpenGoogleMapsSearch();
                  }}
                  className="flex gap-2"
                >
                  <div className="relative min-w-0 flex-1">
                    <Search className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#14B8A6]" />
                    <input
                      type="search"
                      value={destinationSearchQuery}
                      onChange={(event) => {
                        clearExternalLocationContext();
                        setDestinationSearchQuery(event.target.value);
                        setDestinationSearchResults([]);
                        setDestinationSearchStatus('idle');
                        setExternalLocationUrl('');
                        setExternalCalculatedDistanceKm(null);
                        setExternalEstimatedDurationMinutes(null);
                        setIsCaptainScanPreviewActive(false);
                      }}
                      placeholder={locationCopy('placeholder_landmark')}
                      className="h-12 w-full rounded-2xl border border-white/10 bg-black/40 pe-4 ps-10 text-sm font-bold text-white outline-none transition placeholder:text-slate-500 focus:border-[#14B8A6]/60"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={destinationSearchStatus === 'searching' || destinationSearchQuery.trim().length < 2}
                    className="flex h-12 shrink-0 items-center justify-center gap-2 rounded-2xl bg-[#14B8A6] px-4 text-sm font-black text-[#031315] transition hover:bg-[#2DD4BF] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {destinationSearchStatus === 'searching' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                    <span className="hidden sm:inline">
                      {destinationSearchStatus === 'searching' ? destinationSearchCopy('searching') : destinationSearchCopy('search')}
                    </span>
                  </button>
                </form>

                <div className="grid gap-2 sm:grid-cols-2">
                  <button
                    type="button"
                    onClick={handleOpenGoogleMapsSearch}
                    disabled={destinationSearchQuery.trim().length < 2}
                    className="flex min-h-12 items-center justify-center gap-2 rounded-2xl border border-[#14B8A6]/30 bg-[#161F30]/80 px-4 text-xs font-black text-[#14F5D5] shadow-lg shadow-black/20 transition-all duration-300 hover:border-[#14B8A6] hover:bg-[#14B8A6]/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#14B8A6] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <Navigation className="h-4 w-4" />
                    <span>{locationCopy('btn_open_google_maps')}</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleConfirmClipboardLocation}
                    disabled={isReadingClipboardLocation}
                    className="flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-[#14B8A6] px-4 text-xs font-black text-[#061316] shadow-lg shadow-[#14B8A6]/20 transition-all duration-300 hover:bg-[#2DD4BF] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#14F5D5] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {isReadingClipboardLocation ? <Loader2 className="h-4 w-4 animate-spin" /> : <MapPin className="h-4 w-4" />}
                    <span>{locationCopy('btn_confirm_and_calculate')}</span>
                  </button>
                </div>

                {externalLocationUrl ? (
                  <div className="space-y-3 rounded-2xl border border-[#14B8A6]/25 bg-[#161F30]/80 p-3 shadow-xl shadow-black/20 backdrop-blur-md">
                    <label className="block space-y-2">
                      <span className="text-[10px] font-black uppercase tracking-wide text-slate-400">
                        {locationCopy('lbl_google_maps_url')}
                      </span>
                      <input
                        value={externalLocationUrl}
                        readOnly
                        disabled
                        aria-label={locationCopy('lbl_google_maps_url')}
                        className="h-11 w-full rounded-xl border border-white/10 bg-[#1E293B] px-3 text-xs font-bold text-slate-300 outline-none"
                      />
                    </label>
                    {isRouteEstimateLoading ? (
                      <div className="rounded-xl border border-[#14B8A6]/20 bg-[#14B8A6]/10 px-3 py-2 text-xs font-bold text-[#BFFCF2]" role="status">
                        {locationCopy('status_calculating_route')}
                      </div>
                    ) : currentRouteEstimate ? (
                      <div className="flex items-center justify-between gap-3 rounded-xl border border-[#14B8A6]/25 bg-[#14B8A6]/10 px-3 py-2">
                        <span className="text-[11px] font-black text-slate-300">{locationCopy('lbl_calculated_distance')}</span>
                        <strong className="font-mono text-sm font-black text-[#14F5D5]">
                          {currentRouteEstimate.distanceKm.toFixed(1)} {locationCopy('unit_km')}
                        </strong>
                      </div>
                    ) : null}
                    <button
                      type="button"
                      onClick={() => setIsCaptainScanPreviewActive(true)}
                      className="flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-[#14B8A6] px-4 text-sm font-black text-[#061316] shadow-lg shadow-[#14B8A6]/20 transition-all duration-300 hover:bg-[#2DD4BF] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#14F5D5]"
                    >
                      <Search className="h-4 w-4" />
                      <span>{locationCopy('btn_search_captains')}</span>
                    </button>
                  </div>
                ) : null}

                {isCaptainScanPreviewActive ? (
                  <div className="relative overflow-hidden rounded-2xl border border-[#14B8A6]/30 bg-[#161F30]/80 p-5 text-center shadow-2xl shadow-[#14B8A6]/10 backdrop-blur-md" role="status">
                    <div className="relative mx-auto flex h-24 w-24 items-center justify-center">
                      <span className="absolute h-20 w-20 animate-ping rounded-full border border-[#14B8A6]/50" />
                      <span className="absolute h-14 w-14 animate-ping rounded-full border border-[#14F5D5]/40 [animation-delay:180ms]" />
                      <span className="absolute h-8 w-8 animate-pulse rounded-full bg-[#14B8A6]/25" />
                      <Search className="relative z-10 h-6 w-6 text-[#14F5D5]" />
                    </div>
                    <p className="mt-3 text-sm font-black text-white">{locationCopy('status_scanning_captains')}</p>
                  </div>
                ) : null}

                {destinationSearchResults.length > 0 ? (
                  <div className="overflow-hidden rounded-2xl border border-white/10 bg-[#0F172A] shadow-xl">
                    <p className="border-b border-white/10 px-3 py-2 text-[10px] font-black text-[#14F5D5]">
                      {destinationSearchCopy('results')}
                    </p>
                    <div className="max-h-56 overflow-y-auto">
                      {destinationSearchResults.map((result) => (
                        <button
                          key={result.placeId}
                          type="button"
                          onClick={() => handleDestinationSearchResult(result)}
                          className="flex w-full items-start gap-2 border-b border-white/[0.06] px-3 py-3 text-start text-xs font-bold leading-relaxed text-slate-200 transition last:border-b-0 hover:bg-[#14B8A6]/10 hover:text-white"
                        >
                          <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-[#14B8A6]" />
                          <span>{result.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                ) : null}

                {destinationSearchStatus === 'empty' || destinationSearchStatus === 'error' ? (
                  <p className="rounded-xl border border-amber-400/25 bg-amber-400/10 p-3 text-xs font-bold text-amber-100" role="status">
                    {destinationSearchStatus === 'empty' ? destinationSearchCopy('noResults') : destinationSearchCopy('error')}
                  </p>
                ) : null}

                {destinationSearchStatus === 'selected' ? (
                  <p className="rounded-xl border border-[#14B8A6]/25 bg-[#14B8A6]/10 p-3 text-xs font-bold text-[#BFFCF2]" role="status">
                    {destinationSearchCopy('selected')}
                  </p>
                ) : null}
              </div> */}

              <section className={styles.style1737_19}>
                <div className={styles.style1738_20}>
                  <span className={styles.style1739_21}>
                    <MapPin className={styles.style1740_22} />
                  </span>
                  <div className={styles.style1742_23}>
                    <h3 className={styles.style1743_24}>{locationCopy('area_title')}</h3>
                    <p className={styles.style1744_25}>{locationCopy('area_helper')}</p>
                  </div>
                </div>

                <div className={styles.style1748_26}>
                  <div className={styles.style1749_27}>
                    <span id="destination-governorate-label" className={styles.style1750_28}>{copy.governorate}</span>
                    <Select
                      value={selectedGovernorateId}
                      onValueChange={handleGovernorateChange}
                      disabled={isLoadingGovernorates || destinationGovernorates.length === 0}
                    >
                      <SelectTrigger aria-labelledby="destination-governorate-label" className={styles.style1755_29}>
                        <SelectValue placeholder={isLoadingGovernorates ? copy.loading : copy.noGovernorates} />
                      </SelectTrigger>
                      <SelectContent className={styles.style1775_32}>
                        <SelectGroup>
                          {destinationGovernorates.map((governorate) => (
                            <SelectItem key={governorate.id} value={governorate.id} className={styles.style1776_32}>
                              {isArabic ? governorate.nameAr || governorate.nameEn : governorate.nameEn || governorate.nameAr}
                            </SelectItem>
                          ))}
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className={styles.style1768_30}>
                    <span id="destination-district-label" className={styles.style1769_31}>{copy.district}</span>
                    <Select
                      value={selectedDistrict?.id || ''}
                      onValueChange={handleDistrictChange}
                      disabled={isLoadingDistricts || availableDistricts.length === 0}
                    >
                      <SelectTrigger aria-labelledby="destination-district-label" className={styles.style1774_32}>
                        <SelectValue placeholder={isLoadingDistricts ? copy.loading : copy.noDistricts} />
                      </SelectTrigger>
                      <SelectContent className={styles.style1775_32}>
                        <SelectGroup>
                          {availableDistricts.map((destination) => (
                            <SelectItem
                              key={destination.id}
                              value={destination.id}
                              disabled={!destination.anchor}
                              className={styles.style1776_32}
                            >
                              {isArabic ? destination.districtAr || destination.districtEn : destination.districtEn || destination.districtAr}
                            </SelectItem>
                          ))}
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </section>
              <section className={styles.style1788_33}>
                <div>
                  <div className={styles.style1790_34}>
                    <span className={styles.style1791_35}>1</span>
                    <div>
                      <p className={styles.style1793_36}>{locationCopy('step_search_title')}</p>
                      <p className={styles.style1794_37}>{locationCopy('step_search_helper')}</p>
                    </div>
                  </div>
                  <form
                    onSubmit={(event) => {
                      event.preventDefault();
                      handleOpenGoogleMapsSearch();
                    }}
                    className={styles.style1802_38}
                  >
                    <div className={styles.style1804_39}>
                      <Search className={styles.style1805_40} />
                      <input
                        type="search"
                        value={destinationSearchQuery}
                        onChange={(event) => {
                          clearExternalLocationContext();
                          setDestinationSearchQuery(event.target.value);
                          setDestinationSearchResults([]);
                          setDestinationSearchStatus('idle');
                          setExternalLocationUrl('');
                          setIsMapPickerOpen(false);
                          setIsCaptainScanPreviewActive(false);
                        }}
                        placeholder={locationCopy('placeholder_landmark')}
                        className={styles.style1818_41}
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={destinationSearchQuery.trim().length < 2 || isLoadingMapPreview}
                      aria-label={locationCopy('btn_open_google_maps')}
                      title={locationCopy('btn_open_google_maps')}
                      className={styles.style1826_42}
                    >
                      {isLoadingMapPreview ? (
                        <Loader2 className={styles.searchMapLoadingIcon} />
                      ) : (
                        <Search className={styles.style1828_43} />
                      )}
                      <span className={styles.style1829_44}>
                        {locationCopy('btn_open_google_maps')}
                      </span>
                    </button>
                  </form>
                </div>

                <Dialog
                  open={isMapPickerOpen}
                  onOpenChange={(open) => {
                    if (!open) handleCloseSearchMapEmbed();
                  }}
                >
                  <DialogContent className={styles.searchMapDialogContent} dir={isArabic ? 'rtl' : 'ltr'}>
                    <DialogHeader>
                      <DialogTitle className={styles.searchMapDialogTitle}>
                        {locationCopy('step_search_title')}
                      </DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleModalMapSearch} className={styles.modalSearchForm}>
                      <div className={styles.modalSearchInputWrapper}>
                        <Search className={styles.modalSearchIcon} />
                        <input
                          type="search"
                          value={modalSearchQuery}
                          onChange={(event) => setModalSearchQuery(event.target.value)}
                          placeholder={locationCopy('modal_search_placeholder')}
                          className={styles.modalSearchInput}
                        />
                      </div>
                      <button
                        type="submit"
                        disabled={modalSearchQuery.trim().length < 2 || isModalSearchLoading}
                        className={styles.modalSearchButton}
                      >
                        {isModalSearchLoading ? (
                          <Loader2 className={styles.modalSearchButtonIcon} />
                        ) : (
                          <Search className={styles.modalSearchButtonIcon} />
                        )}
                        <span>{locationCopy('modal_search_button')}</span>
                      </button>
                    </form>
                    <div className={styles.searchMapEmbedWrapper}>
                      <RiderMap
                        showDestinationPin
                        className={styles.searchMapEmbedFrame}
                        destinationFlyToTarget={modalPinLocation}
                        fallbackLocation={modalPinLocation || riderLocation}
                        onDestinationChange={handleModalPinChange}
                        onLocationChange={handleLocationChange}
                      />
                    </div>
                    <div className={styles.mapPickerFooter}>
                      <button
                        type="button"
                        onClick={handleCopyModalLocationLink}
                        className={styles.mapPickerCopyBtn}
                      >
                        <ExternalLink className={styles.mapPickerBtnIcon} />
                        <span>{locationCopy('show_copied_link')}</span>
                      </button>
                      <button
                        type="button"
                        onClick={handleConfirmModalLocation}
                        className={styles.mapPickerConfirmBtn}
                      >
                        <CheckCircle2 className={styles.mapPickerBtnIcon} />
                        <span>{locationCopy('btn_confirm_and_calculate')}</span>
                      </button>
                    </div>
                  </DialogContent>
                </Dialog>

                <div className={styles.style1836_45}>
                  <div className={styles.style1837_46}>
                    <span className={styles.style1838_47}>2</span>
                    <div>
                      <p className={styles.style1840_48}>{locationCopy('step_confirm_title')}</p>
                      <p className={styles.style1841_49}>{locationCopy('step_confirm_helper')}</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleConfirmClipboardLocation}
                    disabled={isReadingClipboardLocation}
                    className={styles.style1848_50}
                  >
                    {isReadingClipboardLocation ? <Loader2 className={styles.style1850_51} /> : <MapPin className={styles.style1850_52} />}
                    <span>
                      {isReadingClipboardLocation
                        ? locationCopy('status_reading_clipboard')
                        : locationCopy('btn_confirm_and_calculate')}
                    </span>
                  </button>
                </div>

                {externalLocationUrl ? (
                  <div className={styles.style1860_53}>
                    <div className={styles.style1861_54}>
                      <span className={styles.style1862_55}>
                        <CheckCircle2 className={styles.style1863_56} />
                      </span>
                      <div className={styles.style1865_57}>
                        <strong className={styles.style1866_58}>{locationCopy('result_title')}</strong>
                        <p className={styles.style1867_59}>
                          {locationCopy('confirmed_location_helper')}
                        </p>
                      </div>
                    </div>

                    {isRouteEstimateLoading ? (
                      <div className={styles.style1874_60} role="status">
                        {locationCopy('status_calculating_route')}
                      </div>
                    ) : currentRouteEstimate ? (
                      <div className={styles.style1878_61}>
                        <div className={styles.style1879_62}>
                          <span className={styles.style1880_63}>{locationCopy('lbl_calculated_distance')}</span>
                          <strong className={styles.style1881_64}>
                            {currentRouteEstimate.distanceKm.toFixed(1)} {locationCopy('unit_km')}
                          </strong>
                        </div>
                        <div className={styles.style1885_65}>
                          <span className={styles.style1886_66}>{locationCopy('lbl_estimated_duration')}</span>
                          <strong className={styles.style1887_67}>
                            {formatDurationLabel(currentRouteEstimate.durationMinutes, language)}
                          </strong>
                          <span className={styles.style1890_68}>{locationCopy('helper_without_traffic')}</span>
                        </div>
                      </div>
                    ) : null}

                    <details className={styles.style1895_69}>
                      <summary className={styles.style1896_70}>
                        <span className={styles.style1897_71}>
                          <ExternalLink className={styles.style1898_72} />
                          <span className={styles.style1899_73}>{locationCopy('show_copied_link')}</span>
                        </span>
                        <ChevronDown className={styles.style1901_74} />
                      </summary>
                      <div className={styles.style1903_75}>
                        <input
                          value={externalLocationUrl}
                          readOnly
                          aria-label={locationCopy('lbl_google_maps_url')}
                          className={styles.style1908_76}
                        />
                      </div>
                    </details>
                  </div>
                ) : null}

                {isCaptainScanPreviewActive ? (
                  <div className={styles.style1916_77} role="status">
                    <div className={styles.style1917_78}>
                      {mappedCaptains.length === 0 ? (
                        <>
                          <span className={styles.style1920_79} />
                          <span className={styles.style1921_80} />
                        </>
                      ) : null}
                      <span className={styles.style1924_81} />
                      <Search className={styles.style1925_82} />
                    </div>
                    <div className={styles.style1927_83}>
                      <p className={styles.style1928_84}>
                        {mappedCaptains.length > 0
                          ? locationCopy('captains_found', { count: mappedCaptains.length })
                          : locationCopy('status_scanning_captains')}
                      </p>
                      <p className={styles.style1933_85}>
                        {locationCopy('captain_search_origin_helper')}
                      </p>
                    </div>
                  </div>
                ) : null}

                {destinationSearchResults.length > 0 ? (
                  <div className={styles.style1941_86}>
                    <p className={styles.style1942_87}>
                      {destinationSearchCopy('results')}
                    </p>
                    <div className={styles.style1945_88}>
                      {destinationSearchResults.map((result) => (
                        <button
                          key={result.placeId}
                          type="button"
                          onClick={() => handleDestinationSearchResult(result)}
                          className={styles.style1951_89}
                        >
                          <MapPin className={styles.style1953_90} />
                          <span>{result.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                ) : null}

                {destinationSearchStatus === 'empty' || destinationSearchStatus === 'error' ? (
                  <p className={styles.style1962_91} role="status">
                    {destinationSearchStatus === 'empty' ? destinationSearchCopy('noResults') : destinationSearchCopy('error')}
                  </p>
                ) : null}

                {destinationSearchStatus === 'selected' ? (
                  <p className={styles.style1968_92} role="status">
                    {destinationSearchCopy('selected')}
                  </p>
                ) : null}
              </section>
            </div>

            <div className={styles.style1975_93}>
              <div className={styles.style1976_94}>
                <span className={styles.style1977_95}>
                  <Users className={styles.style1978_96} />
                </span>
                <span className={styles.style1980_97}>{locationCopy('passengers_label')}</span>
              </div>
              <div className={styles.style1982_98}>
                <button
                  type="button"
                  onClick={() => setRiderCount((current) => Math.max(1, current - 1))}
                  disabled={riderCount <= 1}
                  className={styles.style1987_99}
                  aria-label="-"
                >
                  <Minus className={styles.style1990_100} />
                </button>
                <output className={styles.style1992_101} aria-live="polite">
                  {riderCount}
                </output>
                <button
                  type="button"
                  onClick={() => setRiderCount((current) => current + 1)}
                  className={styles.style1998_102}
                  aria-label="+"
                >
                  <Plus className={styles.style2001_103} />
                </button>
              </div>
            </div>

            {destinationDataError ? (
              <div className={styles.style2007_104}>
                {destinationDataError}
              </div>
            ) : null}

            <section
              className={cn(
                styles.style2014_105,
                destinationReady ? styles.style2015_106 : styles.style2015_107,
              )}
            >
              <div className={styles.style2018_108}>
                <div className={styles.style2019_109}>
                  <span
                    className={cn(
                      styles.style2022_110,
                      destinationReady ? styles.style2023_111 : styles.style2023_112,
                    )}
                  >
                    {destinationReady ? <CheckCircle2 className={styles.style2026_113} /> : <Route className={styles.style2026_114} />}
                  </span>
                  <div>
                    <h3 className={styles.style2029_115}>{locationCopy('trip_summary_title')}</h3>
                    <p className={styles.style2030_116}>
                      {destinationReady ? locationCopy('ready_to_request') : locationCopy('map_adjust_helper')}
                    </p>
                  </div>
                </div>
                {isServerFareLoading || isDestinationPinMoving ? <Loader2 className={styles.style2035_117} /> : null}
              </div>

              <div className={styles.style2038_118}>
                <div className={styles.style2039_119}>
                  <div className={styles.style2040_120}>
                    <span className={styles.style2041_121}>{copy.destination}</span>
                    <strong className={styles.style2042_122}>{destinationLabel}</strong>
                    {selectedDistrict?.anchor && selectedDestinationCoords ? (
                      <span className={styles.style2044_123}>
                        {selectedDestinationCoords.lat.toFixed(4)}, {selectedDestinationCoords.lng.toFixed(4)}
                      </span>
                    ) : null}
                  </div>
                  <div className={styles.style2049_124}>
                    <span className={styles.style2050_125}>
                      {locationCopy('lbl_estimated_fare')}
                    </span>
                    <strong className={styles.style2053_126}>{serverFareLabel}</strong>
                  </div>
                </div>

                <div className={styles.style2057_127}>
                  <div className={styles.style2058_128}>
                    <Clock className={styles.style2059_129} />
                    <span className={styles.style2060_130}>
                      {copy.estimatedDuration || locationCopy('lbl_estimated_duration')}
                    </span>
                    <strong className={styles.style2063_131}>
                      {isRouteEstimateLoading
                        ? locationCopy('status_calculating_route')
                        : estimatedDurationMinutes !== null
                          ? formatDurationLabel(estimatedDurationMinutes, language)
                          : copy.notAvailable}
                    </strong>
                    <span className={styles.style2070_132}>
                      {copy.withoutTrafficDelays || locationCopy('helper_without_traffic')}
                    </span>
                  </div>
                  <div className={styles.style2074_133}>
                    <Route className={styles.style2075_134} />
                    <span className={styles.style2076_135}>
                      {copy.estimatedDistance || locationCopy('lbl_calculated_distance')}
                    </span>
                    <strong className={styles.style2079_136}>
                      {isRouteEstimateLoading
                        ? locationCopy('status_calculating_route')
                        : estimatedDistanceKm !== null
                          ? `${estimatedDistanceKm.toFixed(1)} ${copy.km}`
                          : copy.notAvailable}
                    </strong>
                  </div>
                  <div className={styles.style2087_137}>
                    <Users className={styles.style2088_138} />
                    <span className={styles.style2089_139}>
                      {locationCopy('nearby_captains_label')}
                    </span>
                    <strong className={styles.style2092_140}>{mappedCaptains.length}</strong>
                  </div>
                </div>
              </div>
            </section>

           {/* {destinationMapEmbedUrl ? (
              <div className={styles.destinationMapEmbedWrapper}>
                <iframe
                  key={destinationMapEmbedUrl}
                  src={destinationMapEmbedUrl}
                  title={locationCopy('trip_summary_title')}
                  className={styles.destinationMapEmbedFrame}
                  allowFullScreen
                  loading="lazy"
                />
              </div>
            ) : null} */}

            {serverFareError && (
              <div className={styles.style2099_141}>
                {serverFareError}
              </div>
            )}

            {isSameLocation && (
              <div className={styles.style2105_142}>
                {language === 'ar'
                  ? 'لا يمكن أن تكون الوجهة هي نفس موقع الانطلاق.'
                  : 'Destination cannot be the same as origin location.'}
              </div>
            )}

            <div className={styles.style2112_143}>
              <button
                onClick={handleSendRequest}
                disabled={
                  isSendingRideRequest ||
                  isServerFareLoading ||
                  !hasDestinationOptions ||
                  !selectedDestinationHasCoords ||
                  selectedDraftDestination?.serverEstimatedFare === undefined ||
                  isSameLocation
                }
                className={cn(
                  styles.style2124_144,
                  isSameLocation
                    ? styles.style2126_145
                    : styles.style2127_146
                )}
              >
                {isSendingRideRequest ? <Loader2 className={styles.style2130_147} /> : <Navigation className={styles.style2130_148} />}
                {isSendingRideRequest ? copy.sendingRequest : copy.requestNow}
              </button>
            </div>
          </div>
        );
    }

    if (state.screen === 'RECEIVING_OFFERS') {
      const hasOffers = state.offers.length > 0;
      const isCancelled = !!state.requestCancelledAt;
      const requestFareLabel = state.destination?.serverEstimatedFare !== undefined
        ? formatMoney(state.destination.serverEstimatedFare, currencyLabel)
        : copy.notAvailable;
      const shortRequestId = state.requestId ? state.requestId.slice(0, 8).toUpperCase() : copy.notAvailable;

      if (isCancelled) {
        return (
          <div className={cn(styles.style2148_149, isArabic ? styles.style2148_150 : styles.style2148_151)} dir={isArabic ? 'rtl' : 'ltr'}>
            <div className={styles.style2149_152}>
              <p className={styles.style2150_153}>{copy.noOffersEyebrow}</p>
              <h2 className={styles.style2151_154}>{copy.noOffersTitle}</h2>
              <p className={styles.style2152_155}>
                {copy.noOffersDescription}
              </p>
            </div>

            <button
              onClick={() => {
                dispatch({ type: 'RESET_TO_IDLE' });
                window.setTimeout(openDestination, 0);
              }}
              className={styles.style2162_156}
            >
              {copy.retry}
            </button>
          </div>
        );
      }

      return (
        <div className={cn(styles.style2171_157, isArabic ? styles.style2171_158 : styles.style2171_159)} dir={isArabic ? 'rtl' : 'ltr'}>
          <div className={styles.style2172_160}>
            <div className={styles.style2173_161}>
              <p className={styles.style2174_162}>{hasOffers ? copy.offersArrived : copy.searchingCaptain}</p>
              <h2 className={styles.style2175_163}>{hasOffers ? copy.chooseCaptain : copy.requestVisibleTitle}</h2>
              <p className={styles.style2176_164}>
                {hasOffers ? copy.chooseOfferDescription : copy.waitingOffersDescription}
              </p>
            </div>
            <button
              type="button"
              onClick={() => void handleCancelRideRequest()}
              disabled={isCancellingRideRequest}
              className={styles.style2184_165}
            >
              <X className={styles.style2186_166} />
              {isCancellingRideRequest ? requestFlowCopy.cancellingRequest : requestFlowCopy.cancelRequest}
            </button>
          </div>

          {state.requestId ? (
            <div className={styles.style2192_167}>
              <p className={styles.style2193_168}>{copy.savedRequestTitle}</p>
              <div className={styles.style2194_169}>
                <Metric label={copy.requestNumber} value={shortRequestId} />
                <Metric label={copy.requestStatus} value={copy.savedInDatabase} />
                <Metric label={copy.destination} value={state.destination?.label || copy.notAvailable} />
                <Metric label={copy.serverFare} value={requestFareLabel} />
              </div>
            </div>
          ) : null}

          {!hasOffers ? (
            <div className={styles.style2204_170}>
              <Loader2 className={styles.style2205_171} />
              <span className={styles.style2206_172}>
                {isExpandingCaptainSearch
                  ? (copy.expandingSearchRadius || (language === 'ar' ? 'لم تصل عروض بعد. يتم توسيع نطاق البحث تلقائياً إلى 2.5 كم...' : 'No offers yet. Expanding the search radius to 2.5 km...'))
                  : captainSearchRadiusKm > 1.5
                    ? (copy.searchRadiusExpanded || (language === 'ar' ? 'تم توسيع نطاق البحث تلقائياً إلى 2.5 كم. ننتظر وصول العروض.' : 'Search radius expanded automatically to 2.5 km. Waiting for offers.'))
                    : copy.waitingOffersLoader}
              </span>
            </div>
          ) : (
            <div className={styles.style2215_173}>
              {state.offers.map((offer) => {
                const captain = captainLocations.find((c) => c.id === offer.driverId || c.serial === offer.driverName);
                let realDistance = offer.distance_to_rider;

                if (realDistance == null && captain && riderLocation) {
                  const R = 6371;
                  const dLat = (captain.coordinates.lat - riderLocation.lat) * (Math.PI / 180);
                  const dLon = (captain.coordinates.lng - riderLocation.lng) * (Math.PI / 180);
                  const a =
                    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                    Math.cos(riderLocation.lat * (Math.PI / 180)) *
                      Math.cos(captain.coordinates.lat * (Math.PI / 180)) *
                      Math.sin(dLon / 2) *
                      Math.sin(dLon / 2);
                  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
                  realDistance = R * c;
                }

                // Calculate trip distance (from rider's pickup to destination coords)
                let tripDistance: number | null = null;
                if (riderLocation && state.destination?.coords) {
                  const R = 6371;
                  const dLat = (state.destination.coords.lat - riderLocation.lat) * (Math.PI / 180);
                  const dLon = (state.destination.coords.lng - riderLocation.lng) * (Math.PI / 180);
                  const a =
                    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                    Math.cos(riderLocation.lat * (Math.PI / 180)) *
                      Math.cos(state.destination.coords.lat * (Math.PI / 180)) *
                      Math.sin(dLon / 2) *
                      Math.sin(dLon / 2);
                  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
                  tripDistance = R * c;
                }

                // Format it nicely for the same-location testing scenarios
                const distanceDisplay = realDistance != null ? (realDistance < 0.1 ? 0 : realDistance).toFixed(1) : '---';
                const etaDisplay = offer.pickup_eta_minutes ?? (realDistance != null ? Math.max(1, Math.round(realDistance * 3)) : '---');
                
                const rawDuration = offer.estimated_duration_minutes ?? (tripDistance != null ? Math.max(5, Math.round(tripDistance * 1.2)) : null);
                let durationDisplay = '';
                if (rawDuration != null) {
                  if (rawDuration >= 60) {
                    const hours = Math.floor(rawDuration / 60);
                    const mins = rawDuration % 60;
                    if (hours === 1) {
                      durationDisplay = mins > 0 ? `ساعة و ${mins} دقيقة` : `ساعة`;
                    } else if (hours === 2) {
                      durationDisplay = mins > 0 ? `ساعتين و ${mins} دقيقة` : `ساعتين`;
                    } else {
                      durationDisplay = mins > 0 ? `${hours} ساعات و ${mins} دقيقة` : `${hours} ساعات`;
                    }
                  } else {
                    durationDisplay = `${rawDuration} دقيقة`;
                  }
                }

                const captainName = getOfferCaptainName(offer, language);
                const vehicleSummary = getOfferVehicleSummary(offer, language);
                const plateValue = getOfferPlate(offer, language);
                const offerRecord = offer as unknown as Record<string, any>;
                const rawOfferIsPreferred =
                  Boolean(offerRecord.__isPreferredCaptain) ||
                  isPreferredOffer(offer, preferredCaptainIds);
                const captainOffer: CaptainOffer = {
                  id: offer.id || offer.driverId,
                  captain: {
                    id: offer.driverId || offer.captain?.id || '',
                    name: captainName,
                    avatar_url: offer.captain?.avatar_url || offer.driverAvatar,
                    trust_rating: Number(offer.captain?.trust_rating || offer.driverRating || 5),
                    rank: toCaptainOfferRank(offer.captain?.tier || offer.driverRank || offer.tier),
                    vehicle_model: firstDisplayString(
                      offer.captain?.vehicle_model,
                      offer.captain?.vehicle_name,
                      offer.driverVehicle?.model,
                      offer.driverVehicle?.make,
                      vehicleSummary,
                    ),
                    vehicle_color: firstDisplayString(offer.captain?.vehicle_color, offer.driverVehicle?.color),
                    plate_number: plateValue,
                    completed_trips: firstNumber(
                      offer.captain?.completed_trips,
                      offer.captain?.completedTrips,
                      offerRecord.completed_trips,
                      offerRecord.completedTrips,
                      offerRecord.driverCompletedTrips,
                    ) || 0,
                    company_name: firstDisplayString(
                      offer.captain?.company_name,
                      offer.captain?.company,
                      offerRecord.driverAffiliation?.company_name,
                      offer.driverAffiliation?.name,
                    ),
                    affiliation_label: getOfferAffiliationLabel(offer, language),
                    is_verified: Boolean(
                      offer.captain?.is_verified ||
                      offer.captain?.verified ||
                      offerRecord.driverVerified ||
                      offerRecord.is_verified,
                    ),
                    phone: getOfferCaptainPhone(offer),
                    contact_url: getOfferContactUrl(offer),
                    vehicle_year: firstDisplayString(offer.captain?.vehicle_year, offer.driverVehicle?.year),
                    vehicle_category: firstDisplayString(offer.captain?.vehicle_category, offer.driverVehicle?.category),
                  },
                  server_fare: Number(state.destination?.serverEstimatedFare || offer.price || 0),
                  submitted_fare: Number(offer.price || 0),
                  eta_minutes: Number(etaDisplay) || 1,
                  distance_km: Number(distanceDisplay) || 0,
                  estimated_duration_minutes: rawDuration || undefined,
                  trip_distance_km: tripDistance || undefined,
                  additional_info: firstDisplayString(offer.captain?.bio, offer.captain?.notes, offerRecord.additional_info),
                };
                const cardOfferIsPreferred =
                  rawOfferIsPreferred ||
                  isPreferredOffer(captainOffer as unknown as Record<string, any>, preferredCaptainIds);

                return (
                  <CaptainOfferCard
                    key={offer.id || offer.driverId}
                    offer={captainOffer}
                    currencyCode={currencyLabel || 'EGP'}
                    language={language === 'ar' ? 'ar' : 'en'}
                    isAccepting={acceptingOfferId === (offer.id || offer.driverId)}
                    isPreferred={cardOfferIsPreferred}
                    isExpanded={expandedOfferId === captainOffer.id}
                    onToggleExpand={() => setExpandedOfferId((current) => (current === captainOffer.id ? null : captainOffer.id))}
                    onAccept={() => void handleAcceptOffer(offer)}
                  />
                );
              })}
            </div>
          )}
        </div>
      );
    }

    if (state.screen === 'TRIP_ACTIVE' && state.activeTrip) {
      const minutes = Math.floor(etaSeconds / 60);
      const seconds = etaSeconds % 60;
      const activeTripStatus = String(state.activeTrip.status || '').toUpperCase();
      const tripHasStarted = isTripStartedStatus(activeTripStatus);

      return (
        <div className={cn(styles.style2360_174, isArabic ? styles.style2360_175 : styles.style2360_176)} dir={isArabic ? 'rtl' : 'ltr'}>
          <div className={styles.style2361_177}>
            <div className={styles.style2362_178}>
              <p className={styles.style2363_179}>{copy.tripStarted}</p>
              <h2 className={styles.style2364_180}>
                {state.activeTrip.captain?.full_name || state.activeTrip.captain?.name || state.activeTrip.captainName || "كابتن حركي"}
              </h2>
              <p className={styles.style2367_181}>{state.activeTrip.destinationLabel}</p>
            </div>
            <div className={styles.style2369_182}>
              <Clock className={styles.style2370_183} />
              <strong className={styles.style2371_184}>
                {minutes}:{seconds.toString().padStart(2, '0')}
              </strong>
              <span className={styles.style2374_185}>
                {tripHasStarted
                  ? (language === 'ar' ? 'متبقي للوصول' : 'Time Remaining')
                  : (language === 'ar' ? 'وصول الكابتن' : 'Driver Arrival')}
              </span>
            </div>
          </div>

          <div className={styles.style2382_186}>
            <Metric
              label={copy.vehicle}
              value={`${state.activeTrip.captain?.vehicle_color || ''} ${state.activeTrip.captain?.vehicle_model || state.activeTrip.vehicleType || 'سيارة مشغلة'}`.trim()}
            />
            <Metric
              label={copy.plate}
              value={state.activeTrip.captain?.plate_number || state.activeTrip.captain?.license_plate || state.activeTrip.vehiclePlate || "أ ر ج 1234"}
            />
          </div>

          <div className={styles.style2393_187}>
            <div className={styles.style2394_188}>
              {formatMoney(state.activeTrip.finalPrice, currencyLabel)}
            </div>
            <p className={styles.style2397_189}>
              {language === 'ar' ? 'تكلفة الرحلة النهائية' : 'Final Trip Cost'}
            </p>
          </div>

          <div className={styles.style2402_190}>
            {tripHasStarted
              ? (language === 'ar'
                  ? "رحلتك قيد التقدم الآن. نتمنى لك رحلة آمنة!"
                  : "Your trip is in progress. Have a safe ride!")
              : copy.driverEnRouteNote}
          </div>

          <div className={styles.style2410_191}>
            {state.activeTrip.captainPhone && (
              <a
                href={`tel:${state.activeTrip.captainPhone}`}
                className={styles.style2414_192}
                title={isArabic ? 'اتصال بالكابتن' : 'Call Captain'}
              >
                <Phone className={styles.style2417_193} />
              </a>
            )}
            <button
              type="button"
              onClickCapture={(event) => {
                event.preventDefault();
                event.stopPropagation();
                event.nativeEvent.stopImmediatePropagation();
                handleEmergencyWhatsapp();
              }}
              onClick={() => {
                const whatsapp = normalizeWhatsappContact(emergencyWhatsappContact);
                if (!whatsapp) {
                  toast({
                    variant: 'destructive',
                    title: copy.emergencyWhatsappMissingTitle || (language === 'ar' ? 'جهة الطوارئ غير مضافة' : 'Emergency contact is missing'),
                    description: copy.emergencyWhatsappMissingDescription || (language === 'ar' ? 'أضف رقم واتساب للطوارئ من صفحة حسابك أولاً.' : 'Add an Emergency WhatsApp Contact from your profile first.'),
                  });
                  return;
                }

                const message = encodeURIComponent(copy.emergencyWhatsappMessage || (language === 'ar' ? 'أنا الآن في رحلة وقد أحتاج إلى المساعدة. يرجى الاطمئنان علي.' : 'I am currently on a ride and may need help. Please check on me.'));
                const url = `https://wa.me/${whatsapp}?text=${message}`;
                const opened = window.open(url, '_blank', 'noopener,noreferrer');
                if (!opened) {
                  toast({
                    variant: 'destructive',
                    title: copy.whatsappUnavailableTitle || (language === 'ar' ? 'تعذر فتح واتساب' : 'Could not open WhatsApp'),
                    description: copy.whatsappUnavailableDescription || (language === 'ar' ? 'لم نتمكن من فتح واتساب. حاول الاتصال بجهة الطوارئ مباشرة.' : 'WhatsApp could not be opened. Try calling your emergency contact directly.'),
                  });
                }
              }}
              className={styles.style2450_194}
              title={copy.emergencyWhatsapp || (language === 'ar' ? 'واتساب الطوارئ' : 'Emergency WhatsApp')}
            >
              <MessageCircle className={styles.style2453_195} />
            </button>
            {tripHasStarted ? (
              <button
                type="button"
                onClickCapture={(event) => {
                  event.preventDefault();
                  event.stopPropagation();
                  event.nativeEvent.stopImmediatePropagation();
                  handleEmergencyWhatsapp();
                }}
                onClick={() => {
                  toast({
                    title: language === 'ar' ? 'طوارئ وتتبع الرحلة' : 'SOS & Trip Sharing',
                    description: language === 'ar' ? 'تم نسخ رابط تتبع الرحلة لمشاركته بأمان.' : 'Trip tracking link copied to clipboard.',
                  });
                }}
                className={styles.style2470_196}
              >
                <ShieldCheck className={styles.style2472_197} />
                {language === 'ar' ? "طوارئ SOS / تتبع الرحلة" : "SOS / Share Trip"}
              </button>
            ) : (
              <button
                type="button"
                onClick={handleCancelRideRequest}
                disabled={isCancellingRideRequest}
                className={styles.style2480_198}
              >
                {isCancellingRideRequest
                  ? (language === 'ar' ? 'جاري الإلغاء...' : 'Cancelling...')
                  : (language === 'ar' ? 'إلغاء الطلب' : 'Cancel Request')}
              </button>
            )}
          </div>
        </div>
      );
    }

    return null;
  };

  return (
    <div className={styles.style2496_199} dir={isArabic ? 'rtl' : 'ltr'}>
      <div className={styles.style2497_200}>
        <div className={styles.style2498_201}>
          <RiderMap
            activeTripCaptainId={state.activeTrip?.captainId || null}
            captainLocations={mappedCaptains}
            className={styles.style2502_202}
            destinationFlyToTarget={state.screen === 'DESTINATION_SELECTION' ? destinationFlyToTarget || selectedDistrict?.anchor || null : null}
            fallbackLocation={profileFallbackLocation}
            showDestinationPin={state.screen === 'DESTINATION_SELECTION'}
            onDestinationChange={handleDestinationPinChange}
            onDestinationMoveStart={handleDestinationPinMoveStart}
            onLocationChange={handleLocationChange}
          />
        </div>

        <aside className={styles.style2512_203}>
          {/* Top Bar with Center Drag Handle and Right-aligned Close Button */}
          <div className={styles.style2514_204}>
            {/* Left-aligned balance spacer */}
            <div className={styles.style2516_205} />

            {/* Drag Handle */}
            <div className={styles.style2519_206} />

            {/* Clear, High-Contrast Close Button */}
            <button
              type="button"
              onClick={async () => {
                if (state.requestId) {
                  await handleCancelRideRequest();
                } else if (state.screen === 'DESTINATION_SELECTION') {
                  dispatch({ type: 'RETURN_TO_MAP' });
                } else if (state.screen === 'PURGE_LEDGER' || state.screen === 'FAVORITE_CAPTAINS') {
                  dispatch({ type: 'RETURN_TO_MAP' });
                } else {
                  if (onExitRequestFlow) {
                    onExitRequestFlow();
                  } else {
                    window.dispatchEvent(new CustomEvent('exit-request-flow'));
                  }
                }
              }}
              className={styles.style2539_207}
              aria-label={copy.closeDestination}
            >
              <X className={styles.style2542_208} />
            </button>
          </div>

          {/* Scrollable Content Wrapper */}
          <div className={styles.style2547_209}>
            <div
              className={cn(
                styles.style2550_210,
                state.screen === 'DESTINATION_SELECTION' && styles.style2551_211,
              )}
            >
              <div className={styles.style2554_212}>
                <div>
                  <p className={styles.style2556_213}>{copy.panelEyebrow}</p>
                  <h1 className={styles.style2557_214}>{copy.panelTitle}</h1>
                </div>
                <ShieldCheck className={styles.style2559_215} />
              </div>

              <div className={styles.style2562_216}>
                <NavButton active={state.screen === 'IDLE_MAP'} onClick={() => dispatch({ type: 'RETURN_TO_MAP' })}>
                  {copy.mapTab}
                </NavButton>
                <NavButton active={state.screen === 'PURGE_LEDGER'} onClick={() => dispatch({ type: 'OPEN_PURGE_LEDGER' })}>
                  {copy.tripsTab}
                </NavButton>
                <NavButton active={state.screen === 'FAVORITE_CAPTAINS'} onClick={() => dispatch({ type: 'OPEN_FAVORITE_CAPTAINS' })}>
                  {copy.savedTab}
                </NavButton>
              </div>
            </div>

            {state.screen === 'IDLE_MAP' && (
              <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
                <div className={cn(styles.style2577_217, isArabic ? styles.style2577_218 : styles.style2577_219)} dir={isArabic ? 'rtl' : 'ltr'}>
                  <div className={styles.style2578_220}>
                    <p className={styles.style2579_221}>{copy.readyQuestion}</p>
                    <h2 className={styles.style2580_222}>{copy.whereTo}</h2>
                    <p className={styles.style2581_223}>
                      {copy.homeSubtitle}
                    </p>
                  </div>

                  <div className={styles.style2586_224}>
                    <Metric
                      label={copy.yourArea}
                      value={
                        isGeocoding
                          ? (language === 'ar' ? 'جاري تحديد الموقع...' : 'Locating...')
                          : currentAddressName || (locationStatus === 'live' ? copy.currentLocation : copy.fallbackLocation)
                      }
                    />
                    <Metric label={copy.yourRating} value={`${Math.floor(riderProfile.rating || 5)} / 5`} />
                  </div>

                  <button
                    onClick={openDestination}
                    className={styles.style2600_225}
                  >
                    <Navigation className={styles.style2602_226} />
                    {copy.requestRide}
                  </button>
                </div>
              </motion.div>
            )}

            {renderStatePanel()}



            {showAdRiver && (
              <div className={styles.style2614_227}>
                <AdStage />
              </div>
            )}

            {(state.screen === 'PURGE_LEDGER' || state.screen === 'FAVORITE_CAPTAINS') && (
              <RadarRiderDashboard
                riderProfile={riderProfile}
                tripsWithin72Hours={tripsWithin72Hours}
                systemMessages={systemMessages}
                currencyLabel={currencyLabel}
              />
            )}
          </div>
        </aside>

        {/* Hide secondary ads inside the active request map flow */}
        {false && showAdRiver && (
          <div className={styles.style2632_228}>
            <AdStage />
          </div>
        )}
      </div>

      {state.screen === 'RATING_MODAL' && state.completedTrip?.captainId && state.requestId && user?.uid && (
        <RatingModal
          isOpen={true}
          onClose={() => {
            dispatch({ type: 'SUBMIT_RATING' });
            if (onExitRequestFlow) {
              onExitRequestFlow();
            }
          }}
          tripId={state.requestId}
          captainId={state.completedTrip.captainId}
          reviewerId={user.uid}
          supabase={supabase}
          captainName={state.completedTrip.captainName}
          captainPhone={state.completedTrip.captainPhone}
          captainRank={toCaptainOfferRank(
            state.completedTrip.captain?.tier ||
              state.completedTrip.captain?.rank ||
              state.completedTrip.captain?.captain_rank,
          )}
          vehicleInfo={[state.completedTrip.vehicleType, state.completedTrip.vehiclePlate].filter(Boolean).join(' - ')}
          finalPrice={state.completedTrip.finalPrice}
          onSuccess={() => {
            void loadBlockedCaptains();
            dispatch({ type: 'SUBMIT_RATING' });
            if (onExitRequestFlow) {
              onExitRequestFlow();
            }
          }}
        />
      )}

      <Dialog open={showEmergencyContactDialog} onOpenChange={setShowEmergencyContactDialog}>
        <DialogContent className={styles.style2671_229} dir={isArabic ? 'rtl' : 'ltr'}>
          <DialogHeader className={cn(isArabic ? styles.style2672_230 : styles.style2672_231)}>
            <DialogTitle className={styles.style2673_232}>
              {copy.emergencyWhatsappMissingTitle || (language === 'ar' ? 'لا يوجد رقم طوارئ' : 'No emergency contact')}
            </DialogTitle>
            <DialogDescription className={styles.style2676_233}>
              {copy.emergencyWhatsappMissingDescription || (language === 'ar'
                ? 'لم تقم بإضافة رقم واتساب للطوارئ بعد. أضف رقماً من بيانات الحساب لاستخدام زر SOS أثناء الرحلة.'
                : 'You have not added an Emergency WhatsApp Contact yet. Add one from your profile to use SOS during a trip.')}
            </DialogDescription>
          </DialogHeader>
          <div className={cn(styles.style2682_234, isArabic ? styles.style2682_235 : styles.style2682_236)}>
            <Button
              type="button"
              onClick={handleAddEmergencyContact}
              className={styles.style2686_237}
            >
              {copy.addEmergencyWhatsapp || (language === 'ar' ? 'إضافة رقم' : 'Add number')}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowEmergencyContactDialog(false)}
              className={styles.style2694_238}
            >
              {copy.cancel || (language === 'ar' ? 'إلغاء' : 'Cancel')}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function normalizeGovernorates(rows: unknown): GovernorateOption[] {
  if (!Array.isArray(rows)) return [];

  return rows
    .map((row) => {
      const record = row as Record<string, unknown>;
      const numericId = Number(record.id);
      if (!Number.isInteger(numericId) || numericId <= 0) return null;

      return {
        id: String(numericId),
        numericId,
        nameAr: firstText(record.name_ar, record.nameAr, record.name, record.title_ar) || `محافظة ${numericId}`,
        nameEn: firstText(record.name_en, record.nameEn, record.title_en) || '',
      };
    })
    .filter((option): option is GovernorateOption => !!option);
}

function normalizeDistricts(rows: unknown, governorate: GovernorateOption | null): DistrictOption[] {
  if (!Array.isArray(rows)) return [];

  return rows
    .map((row) => {
      const record = row as Record<string, unknown>;
      const numericId = Number(record.id);
      if (!Number.isInteger(numericId) || numericId <= 0) return null;

      const anchor = getRowAnchor(record);

      return {
        id: String(numericId),
        numericId,
        governorateId: String(record.governorate_id || governorate?.id || ''),
        governorateAr: governorate?.nameAr || '',
        governorateEn: governorate?.nameEn || '',
        districtAr: firstText(record.name_ar, record.nameAr, record.name, record.title_ar) || `منطقة ${numericId}`,
        districtEn: firstText(record.name_en, record.nameEn, record.title_en) || '',
        anchor,
        tortuosityFactor: firstNumber(record.tortuosity_factor, record.road_factor, record.factor) ?? 1.3,
      };
    })
    .filter((option): option is DistrictOption => !!option);
}

function getRowAnchor(row: Record<string, unknown>): RiderLocation | null {
  const lat = firstNumber(row.lat, row.latitude, row.anchor_lat, row.center_lat, row.centroid_lat, row.location_lat);
  const lng = firstNumber(row.lng, row.lon, row.longitude, row.anchor_lng, row.anchor_lon, row.center_lng, row.centroid_lng, row.location_lng);

  if (lat === null || lng === null) return null;
  return { lat, lng };
}

function firstText(...values: unknown[]) {
  for (const value of values) {
    if (typeof value === 'string' && value.trim()) return value.trim();
  }
  return null;
}

function firstNumber(...values: unknown[]) {
  for (const value of values) {
    const numberValue = Number(value);
    if (Number.isFinite(numberValue)) return numberValue;
  }
  return null;
}

function slugifyLocationPart(value: string) {
  return value
    .normalize('NFKC')
    .trim()
    .toLocaleLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80) || 'external-location';
}

function buildRiderDestination(
  destination: DistrictOption,
  origin: RiderLocation,
  serverEstimatedFare: number | null,
  preciseDestination: RiderLocation,
  roadDistanceKm: number | null = null,
): RiderDestination {
  if (!preciseDestination) {
    throw new Error('destination_missing_coordinates');
  }

  const localFareQuote = calculateSovereignFareQuote(origin, preciseDestination, destination.tortuosityFactor);
  const fareQuote = roadDistanceKm === null
    ? localFareQuote
    : { ...localFareQuote, estimatedRoadDistanceKm: roadDistanceKm };

  return {
    id: destination.id,
    label: `${destination.districtAr} - ${destination.governorateAr}`,
    governorate: destination.governorateAr,
    district: destination.districtAr,
    coords: preciseDestination,
    tortuosityFactor: destination.tortuosityFactor,
    fareQuote,
    serverEstimatedFare: serverEstimatedFare ?? undefined,
    originCell: latLngToCell(origin.lat, origin.lng, H3_RIDER_REQUEST_RESOLUTION),
    destinationCell: latLngToCell(preciseDestination.lat, preciseDestination.lng, H3_RIDER_REQUEST_RESOLUTION),
  };
}

function buildFareRequestKey(origin: RiderLocation, destination: RiderLocation, countryId: unknown) {
  return [
    Number(countryId) || 'no-country',
    origin.lat.toFixed(6),
    origin.lng.toFixed(6),
    destination.lat.toFixed(6),
    destination.lng.toFixed(6),
  ].join(':');
}

function toHistoricalTrip(trip: RiderActiveTrip): HistoricalTrip {
  return {
    tripId: trip.tripId,
    captainId: trip.captainId,
    captainName: trip.captainName || trip.captainSerial,
    captainRank: toCaptainOfferRank(trip.captain?.tier || trip.captain?.rank || trip.captain?.captain_rank),
    captainPhone: trip.captainPhone,
    vehicleInfo: `${trip.vehicleType} - ${trip.vehiclePlate}`,
    finalPrice: trip.finalPrice,
    timestamp: Date.now(),
  };
}

function getCurrencyLabel(
  countryConfig: CountryCurrencyConfig | null,
  user: { currencyAr?: string; currencyEn?: string } | null | undefined,
  language: AppLanguage = 'ar',
) {
  if (language === 'en') {
    return (
      countryConfig?.currency_en ||
      user?.currencyEn ||
      countryConfig?.currency_code ||
      countryConfig?.currency_ar ||
      user?.currencyAr ||
      ''
    );
  }

  return countryConfig?.currency_ar || user?.currencyAr || countryConfig?.currency_en || user?.currencyEn || countryConfig?.currency_code || '';
}

function formatMoney(value: number, currencyLabel: string) {
  return currencyLabel ? `${value.toFixed(2)} ${currencyLabel}` : value.toFixed(2);
}

function getOfferCaptainName(offer: any, language: AppLanguage) {
  return firstDisplayString(
    offer?.captain?.full_name,
    offer?.captain?.name,
    offer?.driverName,
    offer?.captain?.serial_id,
    language === 'ar' ? 'سائق' : 'Captain',
  );
}

function getOfferCaptainPhone(offer: any) {
  return firstDisplayString(
    offer?.driverAffiliation?.phone,
    offer?.captain?.phone,
    offer?.captain?.phone_number,
    offer?.driverVehicle?.phone,
  );
}

function getOfferContactUrl(offer: any) {
  return firstDisplayString(
    offer?.captain?.contact_page_url,
    offer?.captain?.social_url,
    offer?.captain?.facebook_url,
    offer?.captain?.whatsapp_url,
    offer?.driverVehicle?.contact_page_url,
  );
}

function getOfferAffiliationLabel(offer: any, language: AppLanguage) {
  const rawType = firstDisplayString(offer?.driverAffiliation?.type, offer?.captain?.affiliation_type, offer?.captain?.employment_type);
  const rawName = firstDisplayString(offer?.driverAffiliation?.name, offer?.captain?.affiliation_name, offer?.captain?.company_name);
  const normalized = `${rawName || ''} ${rawType || ''}`.toLowerCase();

  if (normalized.includes('uber') || normalized.includes('أوبر')) {
    return language === 'ar' ? 'أوبر' : 'Uber';
  }
  if (normalized.includes('indrive') || normalized.includes('in-drive') || normalized.includes('in drive') || normalized.includes('إن درايف') || normalized.includes('اندرايف')) {
    return language === 'ar' ? 'إن درايف' : 'inDrive';
  }
  if (normalized.includes('careem') || normalized.includes('كريم')) {
    return language === 'ar' ? 'كريم' : 'Careem';
  }
  if (normalized.includes('office') || normalized.includes('taxi') || normalized.includes('company') || normalized.includes('مكتب') || normalized.includes('شركة')) {
    return language === 'ar' ? 'تابع لشركة' : 'Company driver';
  }
  if (normalized.includes('self') || normalized.includes('independent') || normalized.includes('freelance') || normalized.includes('مستقل')) {
    return language === 'ar' ? 'مستقل' : 'Self-employed';
  }
  if (normalized.includes('smart') || normalized.includes('app')) {
    return language === 'ar' ? 'تطبيق' : 'App driver';
  }

  return language === 'ar' ? 'مستقل' : 'Self-employed';
}

function toCaptainOfferRank(value: unknown): CaptainRank {
  const normalized = String(value || '').trim().toUpperCase();
  if (normalized.includes('PLATINUM') || normalized.includes('بلات')) return 'PLATINUM';
  if (normalized.includes('GOLD') || normalized.includes('ذهب')) return 'GOLD';
  if (normalized.includes('BRONZE') || normalized.includes('برون')) return 'BRONZE';
  return 'SILVER';
}

function prioritizeRiderOffers<T extends Record<string, any>>(offers: T[], favoriteIds: string[]) {
  const rankWeight: Record<CaptainRank, number> = {
    PLATINUM: 4,
    GOLD: 3,
    SILVER: 2,
    BRONZE: 1,
  };

  return offers.map((offer) => ({
    ...offer,
    __isPreferredCaptain: isPreferredOffer(offer, favoriteIds),
  })).sort((a, b) => {
    const aIsFavorite = isPreferredOffer(a, favoriteIds);
    const bIsFavorite = isPreferredOffer(b, favoriteIds);

    if (aIsFavorite && !bIsFavorite) return -1;
    if (!aIsFavorite && bIsFavorite) return 1;

    const aRankWeight = rankWeight[toCaptainOfferRank(a?.captain?.rank || a?.captain?.tier || a?.driverRank || a?.tier)] || 2;
    const bRankWeight = rankWeight[toCaptainOfferRank(b?.captain?.rank || b?.captain?.tier || b?.driverRank || b?.tier)] || 2;

    if (aRankWeight !== bRankWeight) return bRankWeight - aRankWeight;

    return getComparableOfferFare(a) - getComparableOfferFare(b);
  }) as T[];
}

function collectPreferredCaptainIds(favorites: Array<Record<string, any>> = []) {
  const ids = new Set<string>();

  const addValue = (value: unknown) => {
    if (typeof value === 'string' && value.trim()) ids.add(value.trim());
    if (typeof value === 'number' && Number.isFinite(value)) ids.add(String(value));
  };

  favorites.forEach((favorite) => {
    addValue(favorite?.captainId);
    addValue(favorite?.driverId);
    addValue(favorite?.captainPhone);
  });

  if (typeof window !== 'undefined') {
    for (let index = 0; index < window.localStorage.length; index += 1) {
      const key = window.localStorage.key(index);
      if (!key?.startsWith('radar_preferred_captain_')) continue;

      addValue(key.replace('radar_preferred_captain_', ''));

      try {
        const parsed = JSON.parse(window.localStorage.getItem(key) || '{}');
        addValue(parsed?.captainId);
        addValue(parsed?.driverId);
        addValue(parsed?.id);
        addValue(parsed?.phone);
        addValue(parsed?.phoneNumber);
        addValue(parsed?.captainPhone);
      } catch {
        // Ignore legacy/non-JSON favorite entries.
      }
    }
  }

  return Array.from(ids);
}

function isPreferredOffer(offer: Record<string, any>, favoriteIds: string[]) {
  if (favoriteIds.length === 0) return false;
  const favoriteTokens = favoriteIds.map(normalizeFavoriteToken).filter(Boolean);
  const favoriteSet = new Set(favoriteTokens);
  const offerTokens = getOfferFavoriteIdentifiers(offer).map(normalizeFavoriteToken).filter(Boolean);

  return offerTokens.some((offerToken) => favoriteSet.has(offerToken));
}

function getOfferFavoriteIdentifiers(offer: Record<string, any>) {
  return [
    offer?.captain?.id,
    offer?.captain_id,
    offer?.captainId,
    offer?.driverId,
    offer?.driver_id,
    offer?.id,
    offer?.driverAffiliation?.phone,
    offer?.captain?.phone,
    offer?.captain?.phone_number,
  ]
    .map((value) => firstDisplayString(value))
    .filter(Boolean);
}

function normalizeFavoriteToken(value: unknown) {
  const raw = firstDisplayString(value).trim().toLowerCase();
  if (!raw) return '';

  const digits = raw.replace(/\D/g, '');
  if (digits.length >= 7) return digits.replace(/^00/, '');

  return raw
    .replace(/[\u064B-\u065F]/g, '')
    .replace(/[\s\-_.()+]/g, '')
    .trim();
}

function getComparableOfferFare(offer: Record<string, any>) {
  const value = Number(
    offer?.finalFare ??
      offer?.final_fare ??
      offer?.submitted_fare ??
      offer?.offer_price ??
      offer?.price ??
      Number.MAX_SAFE_INTEGER,
  );

  return Number.isFinite(value) && value >= 0 ? value : Number.MAX_SAFE_INTEGER;
}

function getOfferVehicleSummary(offer: any, language: AppLanguage) {
  const parts = [
    firstDisplayString(offer?.captain?.vehicle_color, offer?.driverVehicle?.color),
    firstDisplayString(offer?.captain?.vehicle_brand, offer?.driverVehicle?.brand),
    firstDisplayString(offer?.captain?.vehicle_model, offer?.driverVehicle?.model, offer?.driverVehicle?.make),
    firstDisplayString(offer?.captain?.vehicle_type, offer?.driverVehicle?.type),
  ].filter(Boolean);

  return parts.length ? parts.join(' ') : language === 'ar' ? 'غير متاح' : 'Not available';
}

function getOfferPlate(offer: any, language: AppLanguage) {
  return firstDisplayString(
    offer?.captain?.plate_number,
    offer?.captain?.license_plate,
    offer?.driverVehicle?.plate,
    language === 'ar' ? 'غير متاح' : 'Not available',
  );
}

function firstDisplayString(...values: unknown[]) {
  for (const value of values) {
    if (typeof value === 'string' && value.trim()) return value.trim();
    if (typeof value === 'number' && Number.isFinite(value)) return String(value);
  }
  return '';
}

function Metric({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className={styles.style3069_239}>
      <span className={styles.style3070_240}>{label}</span>
      <span className={styles.style3071_241}>{value}</span>
    </div>
  );
}

function OfferContactAction({
  label,
  value,
  href,
  icon,
  actionLabel,
  external = false,
}: {
  label: string;
  value: string;
  href: string;
  icon: React.ReactNode;
  actionLabel: string;
  external?: boolean;
}) {
  return (
    <div className={styles.style3092_242}>
      <div className={styles.style3093_243}>
        <span className={styles.style3094_244}>{label}</span>
        <span className={styles.style3095_245}>{value}</span>
      </div>
      <a
        href={href}
        target={external ? '_blank' : undefined}
        rel={external ? 'noreferrer' : undefined}
        className={styles.style3101_246}
        aria-label={actionLabel}
        title={actionLabel}
      >
        {icon}
      </a>
    </div>
  );
}

function getLocalizedMarketplaceError(error: unknown, language: AppLanguage) {
  if (language === 'ar') return mapRiderMarketplaceError(error);

  const typedError = error as { message?: string; code?: string; details?: string; hint?: string };
  const message = [
    typedError?.code,
    typedError?.message,
    typedError?.details,
    typedError?.hint,
    error,
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();

  if (message.includes('42501') || message.includes('row-level security') || message.includes('permission denied')) {
    return 'The ride request could not be created because database permissions are not ready.';
  }

  if (message.includes('jwt') || message.includes('auth') || message.includes('rider_id')) {
    return 'You cannot create this request right now. Please sign in again.';
  }

  if (message.includes('network') || message.includes('fetch') || message.includes('timeout') || message.includes('gateway')) {
    return 'Could not connect to the service. Check your internet connection and try again.';
  }

  if (message.includes('calculate_server_fare') || message.includes('server_estimated_fare')) {
    return 'The server could not calculate the fare. Choose the destination again and retry.';
  }

  if (message.includes('42703') || message.includes('column') || message.includes('origin_h3') || message.includes('destination_h3')) {
    return 'The ride requests table is missing required columns. Apply the database update, then try again.';
  }

  if (message.includes('22p02') || message.includes('invalid input value for enum') || message.includes('ride_request_status')) {
    return 'The request status value does not match the database. Make sure PENDING is supported.';
  }

  if (message.includes('23503') || message.includes('foreign key') || message.includes('country_id')) {
    return 'The rider or country data does not match the database. Update the account or choose the destination again.';
  }

  if (message.includes('23505') || message.includes('duplicate') || message.includes('active request')) {
    return 'You already have an active ride request. Finish or cancel it, then try again.';
  }

  return 'Could not send the ride request. Try again in a moment.';
}

const riderViewCopy = {
  ar: {
    closeDestination: 'إغلاق اختيار الوجهة',
    country: 'الدولة',
    currentLocation: 'موقعك الحالي',
    destinationEyebrow: 'اختيار الوجهة',
    destinationH3: 'H3 الوجهة',
    destinationSubtitle: 'اختر المنطقة ثم حرّك الخريطة لتحديد الوجهة بدقة. لا نستخدم Google Places أو Geocoding.',
    district: 'المنطقة',
    fallbackLocation: 'موقعك',
    fareFailed: 'تعذر الحساب',
    fareLoading: 'جاري تحديث السعر...',
    fareStatus: 'حالة السعر',
    governorate: 'المحافظة',
    homeSubtitle: 'اختر وجهتك وسنبحث عن سائق قريب. السعر يظهر قبل إرسال الطلب.',
    loading: 'جاري التحميل...',
    mapTab: 'الخريطة',
    noDistricts: 'لا توجد مناطق',
    noGovernorates: 'لا توجد محافظات',
    notAvailable: 'غير متاح',
    originH3: 'H3 الانطلاق',
    panelEyebrow: 'لوحة الراكب',
    panelTitle: 'طلب الرحلة',
    ready: 'جاهز',
    readyQuestion: 'جاهز؟',
    acceptOffer: 'قبول العرض',
    acceptingOffer: 'جاري قبول العرض...',
    chooseCaptain: 'اختر السائق',
    chooseOfferDescription: 'اختر العرض المناسب لك.',
    countryMissingDescription: 'لا يمكن إرسال الطلب قبل تحميل دولة الحساب.',
    countryMissingTitle: 'الدولة غير محددة',
    destination: 'الوجهة',
    destinationNotReadyDescription: 'اختر منطقة تحتوي إحداثيات صحيحة من قاعدة البيانات.',
    destinationNotReadyTitle: 'الوجهة غير جاهزة',
    fareNotReadyDescription: 'انتظر حساب السعر من الخادم ثم حاول مرة أخرى.',
    fareNotReadyTitle: 'السعر غير جاهز',
    loginRequiredDescription: 'يرجى تسجيل الدخول قبل إرسال طلب الرحلة.',
    loginRequiredTitle: 'يلزم تسجيل الدخول',
    networkError: 'عذراً، تعذر الاتصال بالخادم. تحقق من شبكة الإنترنت.',
    noOffersDescription: 'لم نجد عروضاً تناسب رحلتك في هذه اللحظة. يمكنك إعادة المحاولة أو تغيير الوجهة.',
    noOffersEyebrow: 'لم تصل عروض',
    noOffersTitle: 'نعتذر منك، جميع السائقين مشغولون حالياً',
    offersArrived: 'وصلت عروض',
    plate: 'اللوحة',
    requestFailedTitle: 'تعذر إرسال الطلب',
    requestNumber: 'رقم الطلب',
    requestNow: 'اطلب الآن',
    requestSentDescription: 'تم حفظ طلب الرحلة. سنعرض العروض فور وصولها.',
    requestSentTitle: 'تم إرسال الطلب',
    requestStatus: 'حالة الطلب',
    requestUpdateFailedTitle: 'تعذر تحديث الطلب',
    requestVisibleTitle: 'طلبك ظاهر للسائقين القريبين',
    retry: 'إعادة المحاولة',
    requestRide: 'طلب رحلة',
    savedTab: 'المفضلة',
    savedInDatabase: 'محفوظ في قاعدة البيانات',
    savedRequestTitle: 'طلب الرحلة المحفوظ',
    searchingCaptain: 'نبحث عن سائق',
    sendingRequest: 'جاري إرسال الطلب...',
    serverFare: 'السعر من الخادم',
    tripsTab: 'رحلاتي',
    updatingFare: 'جاري تحديث السعر...',
    vehicle: 'السيارة',
    waitingOffersDescription: 'انتظر قليلاً، ستظهر العروض هنا.',
    waitingOffersLoader: 'جاري البحث عن أقرب سائقين متوفرين لك... ثوانٍ من فضلك',
    whereTo: 'إلى أين تريد الذهاب؟',
    yourArea: 'منطقتك',
    yourRating: 'تقييمك',
    tripStarted: 'الرحلة بدأت',
    tripDistance: 'المسافة',
    km: 'كم',
    tracking: 'التتبع',
    localUpdates: 'تحديثات محلية',
    roadFactor: 'عامل الطريق',
    driverEnRouteNote: 'السائق في الطريق إليك. يتم تحديث الحالة عبر نبضات موقع آمنة.',
    completingTrip: 'جاري إنهاء الرحلة...',
    completeTrip: 'إنهاء الرحلة',
  },
  en: {
    closeDestination: 'Close destination selection',
    country: 'Country',
    currentLocation: 'Your location',
    destinationEyebrow: 'Choose destination',
    destinationH3: 'Destination H3',
    destinationSubtitle: 'Choose an area, then move the map to set the exact destination. No Google Places or Geocoding.',
    district: 'District',
    fallbackLocation: 'Your area',
    fareFailed: 'Failed',
    fareLoading: 'Updating fare...',
    fareStatus: 'Fare status',
    governorate: 'Governorate',
    homeSubtitle: 'Choose your destination and we will look for a nearby driver. The fare appears before sending.',
    loading: 'Loading...',
    mapTab: 'Map',
    noDistricts: 'No districts',
    noGovernorates: 'No governorates',
    notAvailable: 'Not available',
    originH3: 'Origin H3',
    panelEyebrow: 'Rider dashboard',
    panelTitle: 'Request ride',
    ready: 'Ready',
    readyQuestion: 'Ready?',
    acceptOffer: 'Accept offer',
    acceptingOffer: 'Accepting offer...',
    cancelRequest: 'Cancel request',
    cancelRequestFailedTitle: 'Could not cancel request',
    cancellingRequest: 'Cancelling...',
    chooseCaptain: 'Choose captain',
    chooseOfferDescription: 'Choose the offer that works best for you.',
    countryMissingDescription: 'The request cannot be sent before your account country is loaded.',
    countryMissingTitle: 'Country is missing',
    destination: 'Destination',
    destinationNotReadyDescription: 'Choose an area with valid coordinates from the database.',
    destinationNotReadyTitle: 'Destination is not ready',
    fareNotReadyDescription: 'Wait for the server fare calculation, then try again.',
    fareNotReadyTitle: 'Fare is not ready',
    loginRequiredDescription: 'Please sign in before sending a ride request.',
    loginRequiredTitle: 'Sign in required',
    networkError: 'Could not connect to the server. Check your internet connection.',
    noOffersDescription: 'We did not find offers for your trip at this moment. You can retry or change the destination.',
    noOffersEyebrow: 'No offers arrived',
    noOffersTitle: 'Sorry, all nearby captains are busy right now',
    offersArrived: 'Offers arrived',
    plate: 'Plate',
    requestFailedTitle: 'Could not send request',
    requestNumber: 'Request number',
    requestNow: 'Request now',
    requestSentDescription: 'Your ride request was saved. Offers will appear as soon as they arrive.',
    requestSentTitle: 'Request sent',
    requestCancelledDescription: 'Your ride request was cancelled.',
    requestCancelledTitle: 'Request cancelled',
    requestStatus: 'Request status',
    requestUpdateFailedTitle: 'Could not update request',
    requestVisibleTitle: 'Your request is visible to nearby captains',
    retry: 'Retry',
    requestRide: 'Request ride',
    savedTab: 'Vault',
    savedInDatabase: 'Stored in database',
    savedRequestTitle: 'Stored ride request',
    searchingCaptain: 'Looking for a captain',
    sendingRequest: 'Sending request...',
    serverFare: 'Server fare',
    tripsTab: 'Trips',
    updatingFare: 'Updating fare...',
    vehicle: 'Vehicle',
    waitingOffersDescription: 'Wait a moment. Offers will appear here.',
    waitingOffersLoader: 'Looking for the nearest available captains... please wait a few seconds',
    estimatedDuration: 'Estimated duration',
    estimatedDistance: 'Estimated distance',
    withoutTrafficDelays: 'Without traffic delays',
    expandingSearchRadius: 'No offers yet. Expanding the search radius to 2.5 km...',
    searchRadiusExpanded: 'Search radius expanded automatically to 2.5 km. Waiting for offers.',
    emergencyWhatsapp: 'Emergency WhatsApp',
    emergencyWhatsappMissingTitle: 'Emergency contact is missing',
    emergencyWhatsappMissingDescription: 'Add an Emergency WhatsApp Contact from your profile first.',
    emergencyWhatsappUnavailableTitle: 'Could not open WhatsApp',
    emergencyWhatsappUnavailableDescription: 'Open WhatsApp manually and contact your emergency number.',
    emergencyWhatsappMessage: 'I am currently on a ride and may need help. Please check on me.',
    whereTo: 'Where do you want to go?',
    yourArea: 'Your area',
    yourRating: 'Your rating',
    tripStarted: 'Trip started',
    tripDistance: 'Distance',
    km: 'km',
    tracking: 'Tracking',
    localUpdates: 'Local updates',
    roadFactor: 'Road factor',
    driverEnRouteNote: 'The driver is on the way. Status is updated via secure location pulses.',
    completingTrip: 'Completing trip...',
    completeTrip: 'Complete trip',
  },
} satisfies Record<AppLanguage, Record<string, string>>;

function formatDurationLabel(minutes: number, language: AppLanguage) {
  const safeMinutes = Math.max(1, Math.round(minutes));
  if (safeMinutes < 60) {
    return language === 'ar' ? `${safeMinutes} دقيقة` : `${safeMinutes} min`;
  }

  const hours = Math.floor(safeMinutes / 60);
  const remainingMinutes = safeMinutes % 60;
  if (language === 'ar') {
    return remainingMinutes ? `${hours} س ${remainingMinutes} د` : `${hours} ساعة`;
  }

  return remainingMinutes ? `${hours}h ${remainingMinutes}m` : `${hours}h`;
}

function normalizeWhatsappContact(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return '';

  const compact = trimmed.replace(/\s+/g, '').replace(/[^\d+]/g, '');
  const international = compact.startsWith('+')
    ? compact
    : `+${compact.replace(/^00/, '').replace(/^0+/, '')}`;

  if (!/^\+[1-9]\d{7,14}$/.test(international)) return '';
  return international.replace(/[^\d]/g, '');
}

function isTripStartedStatus(status: string) {
  return status === 'STARTED'
    || status === 'TRIP_ACTIVE'
    || status === 'ACTIVE'
    || status === 'IN_PROGRESS';
}

function NavButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        styles.style3375_247,
        active
          ? styles.style3377_248
          : styles.style3378_249,
      )}
    >
      {children}
    </button>
  );
}

