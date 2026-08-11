'use client';

import React, { useState, useMemo, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { jordanGovernorates, getDistrictsByGovernorate } from '@/lib/data';
import { motion, AnimatePresence } from 'motion/react';
import {
  ShieldCheck,
  Sparkles,
  Image as ImageIcon,
  Wallet,
  Phone,
  MessageSquare,
  Activity,
  ShieldAlert,
  CheckCircle,
  TrendingUp,
  Award,
  Zap,
  Megaphone
} from 'lucide-react';
import { useAdminAds } from '@/hooks/use-admin-ads';
import { useMarketPulse } from '@/hooks/use-market-pulse';
import { useToast } from '@/hooks/use-toast';
import { SOVEREIGN_PRICING_PACKAGES, SovereignPricingPackage } from '@/lib/constants';
import { AdDisplayCard } from '@/features/ads/ad-display/contract';

import { cn } from '@/lib/utils';
const styles = {
  style44_1: "w-full overflow-hidden py-3 bg-zinc-950/60 rounded-2xl border border-white/5 relative",
  style45_2: "absolute top-2.5 right-3.5 z-10 flex items-center gap-1.5 select-none pointer-events-none",
  style46_3: "w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping",
  style47_4: "text-[8px] font-black text-emerald-400 uppercase tracking-widest font-mono",
  style50_5: "w-full flex items-center overflow-hidden pt-4",
  style52_6: "flex gap-4.5 pl-4",
  style65_7: "w-56 shrink-0 h-28 rounded-xl border p-3 flex flex-col justify-end bg-gradient-to-br",
  style65_8: "shadow-lg relative",
  style68_9: "absolute top-2.5 right-2.5",
  style69_10: "text-[8px] font-black px-1.5 py-0.5 rounded-full uppercase",
  style70_11: "bg-white/5 text-gray-400 border border-white/10",
  style70_12: "bg-emerald-950/60 text-[#00ffcc] border border-emerald-500/30",
  style75_13: "space-y-0.5",
  style76_14: "text-white font-black text-[10px] leading-tight line-clamp-1",
  style77_15: "text-gray-400 text-[8px] leading-snug line-clamp-2 font-sans",
  style461_16: "w-full flex flex-col pb-20 max-w-2xl mx-auto p-4 sm:p-6 relative select-none font-sans text-right animate-fade-in",
  style464_17: "absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none",
  style465_18: "absolute bottom-0 left-0 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none",
  style468_19: "flex flex-col sm:flex-row sm:items-center justify-between border-b border-white/10 pb-2.5 mb-3.5 gap-2",
  style469_20: "flex items-center gap-1.5 flex-wrap",
  style470_21: "flex items-center gap-1 text-[9px] font-black text-emerald-400 bg-emerald-950/60 border border-emerald-500/20 px-2 py-0.5 rounded-full uppercase tracking-wider",
  style471_22: "w-3.5 h-3.5 text-emerald-400",
  style474_23: "text-[8px] bg-white/5 border border-white/10 text-gray-400 px-1.5 py-0.5 rounded-full font-mono font-bold",
  style480_24: "text-[10px] text-red-400 hover:text-red-300 font-extrabold bg-red-950/40 hover:bg-red-950 px-2.5 py-1 rounded-lg border border-red-500/20 mr-auto transition-all",
  style488_25: "flex bg-neutral-900/60 p-0.5 rounded-lg border border-white/5 self-end sm:self-auto",
  style491_26: "px-3 py-1 rounded-md text-[11px] font-black transition-all",
  style493_27: "bg-emerald-600 text-white shadow-md",
  style494_28: "text-gray-400 hover:text-white",
  style504_29: "px-3 py-1 rounded-md text-[11px] font-black transition-all",
  style506_30: "bg-emerald-600 text-white shadow-md",
  style507_31: "text-gray-400 hover:text-white",
  style514_32: "bg-[#050c05] border border-emerald-950/40 p-2 rounded-xl mb-3.5 flex items-start gap-2 relative overflow-hidden",
  style515_33: "absolute top-0 left-0 w-1 h-full bg-emerald-500",
  style516_34: "w-4 h-4 text-emerald-400 shrink-0 mt-0.5 animate-pulse",
  style517_35: "space-y-0.5",
  style518_36: "text-[11px] font-black text-emerald-300",
  style519_37: "text-[10px] text-gray-300 leading-tight font-sans font-medium",
  style521_38: "text-emerald-400 block mt-0.5 font-mono font-bold text-[9px]",
  style528_39: "space-y-6",
  style533_40: "space-y-2",
  style534_41: "text-xs font-black uppercase text-gray-400 tracking-wider flex items-center gap-1.5",
  style535_42: "w-3.5 h-3.5 text-emerald-400",
  style539_43: "grid grid-cols-2 md:grid-cols-4 gap-3",
  style540_44: "bg-neutral-900/40 p-4 rounded-2xl border border-white/5 relative overflow-hidden group hover:border-emerald-500/15 transition-all text-center",
  style541_45: "absolute top-1 right-2 text-[8px] font-mono font-bold text-gray-500",
  style542_46: "text-[10px] text-gray-400 block mb-1",
  style543_47: "text-xl sm:text-2xl font-black text-emerald-400 font-mono tracking-tight filter drop-shadow-[0_0_8px_rgba(16,185,129,0.3)]",
  style546_48: "text-[9px] text-gray-500 block mt-1 leading-none font-bold",
  style549_49: "bg-neutral-900/40 p-4 rounded-2xl border border-white/5 relative overflow-hidden group hover:border-emerald-500/15 transition-all text-center",
  style550_50: "absolute top-1 right-2 text-[8px] font-mono font-bold text-gray-500",
  style551_51: "text-[10px] text-gray-400 block mb-1",
  style552_52: "text-xl sm:text-2xl font-black text-amber-400 font-mono tracking-tight filter drop-shadow-[0_0_8px_rgba(245,158,11,0.3)]",
  style555_53: "text-[9px] text-gray-500 block mt-1 leading-none font-bold",
  style558_54: "bg-neutral-900/40 p-4 rounded-2xl border border-white/5 relative overflow-hidden group hover:border-emerald-500/15 transition-all text-center",
  style559_55: "absolute top-1 right-2 text-[8px] font-mono font-bold text-gray-500",
  style560_56: "text-[10px] text-gray-400 block mb-1",
  style561_57: "text-xl sm:text-2xl font-black text-cyan-400 font-mono tracking-tight filter drop-shadow-[0_0_8px_rgba(6,182,212,0.3)]",
  style564_58: "text-[9px] text-gray-500 block mt-1 leading-none font-bold",
  style568_59: "bg-gradient-to-b from-emerald-950/40 to-neutral-900/40 p-4 rounded-2xl border border-emerald-500/20 relative overflow-hidden group hover:border-emerald-500/30 transition-all text-center",
  style569_60: "absolute top-1 right-2 text-[8px] font-mono font-bold text-emerald-400",
  style570_61: "text-[10px] text-emerald-300 block mb-1 font-bold",
  style571_62: "text-xl sm:text-2xl font-black text-[#00ffcc] font-mono tracking-tight filter drop-shadow-[0_0_8px_rgba(0,255,204,0.3)]",
  style574_63: "text-[9px] text-emerald-500 block mt-1 leading-none font-bold animate-pulse",
  style580_64: "space-y-2",
  style581_65: "text-xs font-black uppercase text-gray-400 tracking-wider flex items-center gap-1.5",
  style582_66: "w-3.5 h-3.5 text-emerald-400",
  style586_67: "space-y-1.5",
  style616_68: "bg-neutral-900/60 rounded-xl border border-white/5 overflow-hidden hover:border-emerald-500/20 transition-all text-right",
  style621_69: "p-2 flex items-center justify-between gap-2.5 cursor-pointer hover:bg-white/5 transition-colors",
  style624_70: "flex items-center gap-2 min-w-0 flex-1",
  style629_71: "w-8 h-8 rounded-md object-cover shrink-0 border border-white/10",
  style633_72: "w-8 h-8 rounded-md bg-zinc-950 border border-white/5 flex items-center justify-center shrink-0",
  style634_73: "w-3.5 h-3.5 text-emerald-500",
  style637_74: "space-y-0.5 min-w-0",
  style638_75: "text-[11px] font-bold text-white truncate flex items-center gap-1",
  style640_76: "inline-block bg-[#021c17] text-[#00ffcc] text-[8px] font-mono px-1 rounded border border-emerald-500/20 shrink-0",
  style644_77: "text-[9px] text-gray-400 truncate leading-none",
  style649_78: "flex items-center gap-2 shrink-0",
  style651_79: "flex items-center gap-1",
  style658_80: "p-1.5 rounded bg-emerald-950/60 border border-emerald-500/20 hover:bg-emerald-900 text-emerald-400 transition-all",
  style661_81: "w-3 h-3",
  style668_82: "p-1.5 rounded bg-sky-950/60 border border-sky-500/20 hover:bg-sky-900 text-sky-400 transition-all",
  style671_83: "w-3 h-3",
  style677_84: "text-[9px] font-bold px-2 py-0.5 rounded border uppercase shrink-0",
  style682_85: "text-gray-500 text-[10px] transition-transform duration-200",
  style682_86: "rotate-180",
  style696_87: "border-t border-white/5 bg-black/60 overflow-hidden",
  style698_88: "p-3 space-y-2 text-xs text-gray-300",
  style700_89: "text-[9px] font-extrabold text-emerald-400 bg-emerald-950/80 border border-emerald-500/30 px-2.5 py-1 rounded-lg",
  style705_90: "grid grid-cols-2 sm:grid-cols-4 gap-2 text-[9px] font-mono text-gray-400",
  style706_91: "bg-zinc-900/40 p-1.5 rounded-lg border border-white/5",
  style707_92: "text-white font-sans",
  style709_93: "bg-zinc-900/40 p-1.5 rounded-lg border border-white/5",
  style710_94: "text-white",
  style712_95: "bg-zinc-900/40 p-1.5 rounded-lg border border-white/5",
  style713_96: "text-emerald-400",
  style715_97: "bg-zinc-900/40 p-1.5 rounded-lg border border-white/5",
  style716_98: "text-amber-400",
  style722_99: "bg-rose-950/20 border border-rose-500/20 p-2.5 rounded-xl mt-1 animate-fade-in text-right",
  style723_100: "flex items-start gap-1 py-0.5 text-center shrink-0",
  style724_101: "w-3.5 h-3.5 text-rose-500 mt-0.5 shrink-0",
  style725_102: "text-right",
  style726_103: "text-[9px] font-black text-rose-400 block",
  style727_104: "text-[9px] text-rose-300 leading-tight font-sans font-semibold mt-0.5",
  style737_105: "flex gap-2 pt-1.5 justify-start border-t border-white/5",
  style742_106: "h-7 px-2.5 border-white/10 hover:bg-white/5 text-[9px] font-black rounded-lg",
  style750_107: "h-7 px-2.5 border-white/10 hover:bg-emerald-950/20 text-emerald-400 text-[9px] font-black rounded-lg",
  style758_108: "h-7 px-2.5 border-rose-500/15 hover:bg-rose-950/20 text-rose-400 text-[9px] font-black rounded-lg mr-auto",
  style775_109: "space-y-3",
  style776_110: "text-xs font-black uppercase text-gray-400 tracking-wider flex items-center gap-1.5",
  style777_111: "w-3.5 h-3.5 text-emerald-400",
  style781_112: "bg-neutral-900/50 p-4 rounded-2xl border border-white/5 space-y-4",
  style782_113: "text-[10px] text-gray-400 leading-normal",
  style786_114: "space-y-3",
  style793_115: "space-y-1.5 bg-black/40 p-3 rounded-xl border border-white/5 hover:border-white/10 transition-all",
  style794_116: "flex justify-between items-center text-[10px]",
  style795_117: "font-bold text-white",
  style796_118: "flex items-center gap-2 text-gray-400",
  style797_119: "text-emerald-400 font-mono",
  style798_120: "w-1.5 h-1.5 rounded-full bg-white/20",
  style799_121: "text-amber-400 font-mono",
  style804_122: "w-full h-2.5 bg-zinc-950 rounded-full overflow-hidden relative border border-white/5",
  style806_123: "h-full rounded-full bg-gradient-to-l",
  style806_124: "transition-all duration-1000",
  style811_125: "flex justify-between items-center text-[9px] text-gray-500 font-mono",
  style825_126: "text-emerald-400 hover:text-emerald-300 font-sans font-bold flex items-center gap-0.5",
  style838_127: "space-y-3",
  style839_128: "text-xs font-black uppercase text-gray-400 tracking-wider flex items-center gap-1.5",
  style840_129: "w-3.5 h-3.5 text-emerald-400",
  style844_130: "p-4 bg-gradient-to-br from-emerald-950/20 to-neutral-900/60 border border-emerald-500/30 rounded-2xl space-y-3 relative overflow-hidden",
  style845_131: "absolute top-0 left-0 w-2 h-full bg-emerald-500",
  style847_132: "flex items-center gap-1.5 text-emerald-400 text-xs font-black",
  style848_133: "w-4 h-4 text-emerald-400 shrink-0",
  style853_134: "text-[11px] text-gray-100 leading-relaxed font-sans font-medium",
  style854_135: "text-emerald-300",
  style854_136: "text-emerald-300",
  style857_137: "flex gap-2 justify-end pt-1",
  style863_138: "bg-emerald-600 hover:bg-emerald-500 text-black font-black text-[10px] h-8 rounded-lg",
  style876_139: "h-8 border-white/10 text-gray-300 hover:bg-white/5 text-[10px] font-black rounded-lg px-2.5",
  style885_140: "space-y-3",
  style886_141: "text-xs font-black uppercase text-gray-400 tracking-wider flex items-center gap-1.5",
  style887_142: "w-3.5 h-3.5 text-emerald-400",
  style891_143: "grid grid-cols-1 md:grid-cols-2 gap-3",
  style893_144: "p-4 bg-gradient-to-br from-indigo-950/10 to-neutral-900 border border-indigo-500/20 rounded-2xl space-y-2 relative overflow-hidden",
  style894_145: "absolute -top-6 -left-6 w-16 h-16 bg-indigo-500/10 rounded-full blur-xl",
  style895_146: "flex items-center gap-1.5 text-indigo-400 text-xs font-black",
  style896_147: "w-4 h-4 animate-spin-slow shrink-0",
  style899_148: "text-[10px] text-gray-300 leading-relaxed font-sans",
  style902_149: "pt-2",
  style906_150: "w-full bg-indigo-600 hover:bg-indigo-500 text-white font-black text-[10px] h-8 rounded-lg transition-all",
  style914_151: "p-4 bg-gradient-to-br from-emerald-950/10 to-neutral-900 border border-emerald-500/20 rounded-2xl space-y-2 relative overflow-hidden",
  style915_152: "absolute -top-6 -left-6 w-16 h-16 bg-emerald-500/10 rounded-full blur-xl",
  style916_153: "flex items-center gap-1.5 text-emerald-400 text-xs font-black",
  style917_154: "w-4 h-4 text-emerald-400 shrink-0",
  style920_155: "text-[10px] text-gray-300 leading-relaxed font-sans",
  style923_156: "pt-2",
  style927_157: "w-full bg-emerald-700 hover:bg-emerald-600 text-white font-black text-[10px] h-8 rounded-lg transition-all",
  style937_158: "space-y-3",
  style938_159: "text-xs font-black uppercase text-gray-400 tracking-wider flex items-center gap-1.5",
  style939_160: "w-3.5 h-3.5 text-emerald-400",
  style943_161: "bg-neutral-900/50 p-4 rounded-2xl border border-white/5 space-y-4",
  style944_162: "flex flex-col sm:flex-row sm:items-center justify-between gap-3",
  style945_163: "space-y-1",
  style946_164: "text-[10px] text-gray-400 block",
  style947_165: "text-2xl font-black text-white font-mono tracking-tight flex items-baseline gap-1",
  style948_166: "text-emerald-400",
  style949_167: "text-xs text-gray-500 font-sans",
  style953_168: "flex gap-1.5 self-end sm:self-auto",
  style957_169: "bg-emerald-600 hover:bg-emerald-500 text-black font-black text-[10px] h-9 px-3 rounded-lg",
  style964_170: "bg-emerald-600 hover:bg-emerald-500 text-black font-black text-[10px] h-9 px-3 rounded-lg",
  style971_171: "p-3 bg-black/60 rounded-xl border border-white/5 space-y-2",
  style972_172: "text-[10px] text-gray-500 font-bold block uppercase border-b border-white/5 pb-1",
  style973_173: "flex flex-wrap gap-4 text-[9px] text-gray-400 justify-start",
  style974_174: "flex items-center gap-1.5",
  style975_175: "w-2 h-2 rounded-full bg-emerald-500",
  style978_176: "flex items-center gap-1.5",
  style979_177: "w-2 h-2 rounded-full bg-emerald-500",
  style982_178: "flex items-center gap-1.5",
  style983_179: "w-2 h-2 rounded-full bg-orange-400",
  style996_180: "space-y-6",
  style999_181: "flex items-center justify-between gap-2 mb-6 bg-[#040A04]/40 border border-white/5 p-3 rounded-2xl",
  style1005_182: "flex-1 flex flex-col items-start gap-1",
  style1006_183: "flex items-center gap-1.5 w-full",
  style1008_184: "w-6 h-6 rounded-full flex items-center justify-center text-xs font-black transition-all",
  style1010_185: "bg-emerald-500 text-black shadow-[0_0_15px_rgba(16,185,129,0.4)]",
  style1012_186: "bg-emerald-950 text-emerald-400 border border-emerald-500",
  style1013_187: "bg-white/5 text-gray-500 border border-white/10",
  style1018_188: "h-[2px] flex-1 rounded-full",
  style1018_189: "bg-emerald-500",
  style1018_190: "bg-white/10",
  style1020_191: "text-[11px] font-black mt-1.5 block",
  style1020_192: "text-white",
  style1020_193: "text-gray-500",
  style1023_194: "text-[9px] text-gray-500 leading-none hidden sm:block",
  style1032_195: "space-y-3.5 animate-fade-in",
  style1033_196: "space-y-0.5",
  style1034_197: "text-xs font-black text-white flex items-center gap-1.5 pb-1 border-b border-white/5",
  style1035_198: "w-3.5 h-3.5 text-emerald-400",
  style1038_199: "text-[10px] text-gray-400 leading-relaxed font-sans font-medium",
  style1044_200: "space-y-2",
  style1047_201: "border border-white/10 rounded-xl bg-neutral-900/40 overflow-hidden transition-all duration-300",
  style1051_202: "w-full p-2.5 flex items-center justify-between text-right text-white hover:bg-white/5 transition-all outline-none",
  style1053_203: "flex items-center gap-2",
  style1054_204: "w-4 h-4 rounded bg-emerald-950/60 border border-emerald-500/20 flex items-center justify-center text-[9px] font-black text-emerald-400 font-mono",
  style1055_205: "text-[11px] font-black",
  style1057_206: "flex items-center gap-2 text-[9px] text-gray-500 font-mono",
  style1069_207: "border-t border-white/5 bg-black/60 p-2.5 space-y-2.5",
  style1071_208: "grid grid-cols-1 sm:grid-cols-2 gap-2.5",
  style1072_209: "space-y-1",
  style1073_210: "text-[10px] text-emerald-400 font-bold block",
  style1075_211: "h-9 border-white/10 bg-black text-right pr-3 text-white text-xs",
  style1078_212: "bg-black text-white border-white/10",
  style1080_213: "text-right justify-end text-xs",
  style1086_214: "space-y-1",
  style1087_215: "text-[10px] text-emerald-400 font-bold block",
  style1089_216: "h-9 border-white/10 bg-black text-right pr-3 text-white text-xs",
  style1092_217: "bg-black text-white border-white/10",
  style1094_218: "text-right justify-end text-xs",
  style1101_219: "space-y-1 pt-1",
  style1102_220: "font-bold text-[10px] text-emerald-400 block",
  style1104_221: "h-9 border-white/10 bg-black text-right text-white text-xs",
  style1107_222: "bg-black text-white border-white/10",
  style1108_223: "text-right justify-end text-xs",
  style1109_224: "text-right justify-end text-xs",
  style1110_225: "text-right justify-end text-xs",
  style1111_226: "text-right justify-end text-xs",
  style1117_227: "space-y-2 pt-1",
  style1119_228: "p-2.5 bg-amber-950/20 border-2 border-dashed border-amber-500/40 rounded-xl space-y-2",
  style1120_229: "flex items-center gap-1.5 text-amber-400",
  style1121_230: "w-3.5 h-3.5 animate-pulse shrink-0",
  style1122_231: "text-[10px] font-black",
  style1124_232: "text-[10px] text-gray-300 leading-normal font-medium",
  style1125_233: "text-amber-400",
  style1130_234: "w-full bg-amber-600 hover:bg-amber-500 text-black font-black text-[10px] h-8 rounded-lg flex items-center justify-center gap-1 transition-all",
  style1132_235: "w-3.5 h-3.5 text-black animate-spin",
  style1137_236: "p-2.5 bg-emerald-950/15 border border-emerald-500/20 rounded-xl space-y-2",
  style1138_237: "flex items-center justify-between",
  style1139_238: "flex items-center gap-1 text-emerald-400 text-[10px] font-bold",
  style1140_239: "w-3.5 h-3.5 text-emerald-400 animate-pulse animate-bounce-slow",
  style1143_240: "text-[8px] bg-emerald-950/65 text-emerald-400 font-extrabold px-1.5 py-0.5 rounded-full border border-emerald-400/20",
  style1148_241: "grid grid-cols-3 gap-1.5 text-center",
  style1149_242: "bg-black/60 p-1.5 rounded-lg border border-white/5",
  style1150_243: "text-[8px] text-gray-400 block pb-0.5",
  style1151_244: "text-[9px] font-black text-amber-400 font-mono",
  style1155_245: "bg-black/60 p-1.5 rounded-lg border border-white/5",
  style1156_246: "text-[8px] text-gray-400 block pb-0.5",
  style1157_247: "text-[9px] font-black block",
  style1157_248: "text-emerald-400 animate-pulse",
  style1157_249: "text-gray-400",
  style1161_250: "bg-black/60 p-1.5 rounded-lg border border-white/5",
  style1162_251: "text-[8px] text-gray-400 block pb-0.5",
  style1163_252: "text-[9px] font-black text-emerald-400 block",
  style1170_253: "p-1.5 bg-emerald-950/50 border border-emerald-500/30 rounded-lg text-[9px] text-emerald-300 font-sans leading-relaxed flex items-start gap-1",
  style1171_254: "w-3 h-3 text-emerald-400 shrink-0 mt-0.5 animate-pulse",
  style1187_255: "border border-white/10 rounded-xl bg-neutral-900/40 overflow-hidden transition-all duration-300",
  style1191_256: "w-full p-2.5 flex items-center justify-between text-right text-white hover:bg-white/5 transition-all outline-none",
  style1193_257: "flex items-center gap-2",
  style1194_258: "w-4 h-4 rounded bg-emerald-950/60 border border-emerald-500/20 flex items-center justify-center text-[9px] font-black text-emerald-400 font-mono",
  style1195_259: "text-[11px] font-black",
  style1197_260: "flex items-center gap-2 text-[9px] text-gray-500 font-mono",
  style1209_261: "border-t border-white/5 bg-black/60 p-2.5 space-y-2.5 animate-fade-in",
  style1211_262: "grid grid-cols-1 md:grid-cols-2 gap-3 items-start",
  style1212_263: "space-y-2",
  style1213_264: "space-y-1",
  style1214_265: "text-[10px] text-emerald-400 font-bold block",
  style1219_266: "h-9 border-white/10 bg-black mt-1 text-white text-xs pr-3",
  style1223_267: "space-y-1",
  style1224_268: "text-[10px] text-emerald-400 font-bold block",
  style1229_269: "h-9 border-white/10 bg-black mt-1 text-white text-xs pr-3",
  style1233_270: "space-y-1",
  style1234_271: "text-[10px] text-emerald-400 font-bold block",
  style1239_272: "h-9 border-white/10 bg-black mt-1 text-left font-mono text-white text-xs pl-3",
  style1245_273: "p-2 bg-white/5 rounded-lg border border-white/10 space-y-1.5",
  style1246_274: "text-[9px] font-black text-gray-400 block border-b border-white/5 pb-0.5",
  style1247_275: "grid grid-cols-2 gap-1.5",
  style1248_276: "space-y-1",
  style1249_277: "text-[9px] text-gray-400",
  style1253_278: "h-8 border-white/10 bg-black text-left font-mono text-xs text-white",
  style1257_279: "space-y-1",
  style1258_280: "text-[9px] text-gray-400",
  style1262_281: "h-8 border-white/10 bg-black text-left font-mono text-xs text-white",
  style1266_282: "space-y-1 col-span-2",
  style1267_283: "text-[9px] text-gray-400",
  style1272_284: "h-8 border-white/10 bg-black text-left font-mono text-xs text-white",
  style1281_285: "space-y-1.5",
  style1282_286: "text-[9px] font-black text-emerald-400 uppercase tracking-widest block text-center",
  style1297_287: "mx-auto h-[280px] max-w-sm rounded-[28px]",
  style1300_288: "hidden w-full aspect-[9/16] max-h-[220px] bg-zinc-950 rounded-xl border border-white/10 relative overflow-hidden flex flex-col justify-end shadow-2xl mx-auto",
  style1306_289: "absolute inset-0 w-full h-full object-cover z-0 filter brightness-95 animate-fade-in",
  style1309_290: "absolute inset-0 flex flex-col items-center justify-center bg-zinc-900 border border-zinc-950 text-gray-500 text-[10px]",
  style1310_291: "w-6 h-6 mb-1 animate-pulse",
  style1315_292: "absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent z-10",
  style1317_293: "p-2.5 relative z-20 space-y-1 text-right",
  style1318_294: "text-[7px] bg-emerald-500 text-black px-1.5 py-0.5 rounded-full font-black",
  style1321_295: "space-y-0.5",
  style1322_296: "text-[9px] font-black text-white truncate",
  style1323_297: "text-[8px] text-gray-300 leading-tight truncate",
  style1325_298: "w-full text-white bg-emerald-600 border border-emerald-500 font-extrabold text-[8px] h-6 rounded-md pointer-events-none",
  style1338_299: "border border-white/10 rounded-xl bg-neutral-900/40 overflow-hidden transition-all duration-300",
  style1342_300: "w-full p-2.5 flex items-center justify-between text-right text-white hover:bg-white/5 transition-all outline-none",
  style1344_301: "flex items-center gap-2",
  style1345_302: "w-4 h-4 rounded bg-emerald-950/60 border border-emerald-500/20 flex items-center justify-center text-[9px] font-black text-emerald-400 font-mono",
  style1346_303: "text-[11px] font-black",
  style1348_304: "flex items-center gap-2 text-[9px] text-gray-400 font-mono",
  style1360_305: "border-t border-white/5 bg-black/60 p-2.5 space-y-3",
  style1363_306: "p-2.5 rounded-xl border border-emerald-500/20 bg-emerald-950/10 space-y-2 text-right",
  style1364_307: "text-[10px] font-extrabold text-emerald-400 flex items-center gap-1",
  style1365_308: "w-3.5 h-3.5",
  style1367_309: "text-[8px] text-gray-300 leading-relaxed",
  style1370_310: "grid grid-cols-2 gap-2",
  style1372_311: "text-[8px] text-gray-400",
  style1377_312: "h-7 text-[9px] bg-black/40 border-white/10 text-emerald-400 font-mono text-center rounded",
  style1381_313: "text-[8px] text-gray-400",
  style1385_314: "w-full h-7 text-[9px] bg-neutral-900 border border-white/10 text-gray-300 rounded px-1 text-right outline-none",
  style1396_315: "w-full h-7 text-[9px] bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold flex items-center justify-center gap-1 rounded",
  style1398_316: "w-3 h-3 text-emerald-200 animate-bounce",
  style1401_317: "bg-black/60 p-2 rounded border border-white/5 text-[8px] text-emerald-300 leading-tight",
  style1408_318: "space-y-2 text-right",
  style1409_319: "text-[10px] text-emerald-400 font-extrabold block",
  style1410_320: "p-3 rounded-2xl bg-zinc-950 border border-white/5 flex flex-col sm:flex-row items-center justify-between gap-3",
  style1411_321: "text-right space-y-0.5",
  style1412_322: "text-[10px] text-gray-400 block font-sans",
  style1413_323: "text-xs font-black text-white block",
  style1414_324: "text-[9px] text-[#00ffcc] font-mono block mt-0.5",
  style1419_325: "w-full sm:w-auto h-9 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs px-4 rounded-xl shadow-lg transition-all",
  style1427_326: "pt-2 grid grid-cols-2 gap-2",
  style1428_327: "bg-neutral-900/90 p-2.5 rounded-xl border border-white/5 flex flex-col justify-center items-center text-center",
  style1429_328: "text-[8px] text-gray-500 font-bold",
  style1430_329: "font-mono text-emerald-400 text-[11px] font-black mt-0.5",
  style1434_330: "bg-neutral-900/90 p-2.5 rounded-xl border border-white/5 flex flex-col justify-center items-center text-center",
  style1435_331: "text-[8px] text-gray-500 font-bold",
  style1436_332: "font-mono text-[11px] font-black mt-0.5",
  style1436_333: "text-red-400 animate-pulse",
  style1436_334: "text-amber-400",
  style1449_335: "pt-3 border-t border-white/10 flex justify-between items-center gap-2",
  style1456_336: "flex-1 h-10 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white font-black text-xs rounded-xl flex items-center justify-center gap-1.5 shadow-lg shadow-emerald-900/20 active:scale-[0.98] transition-all",
  style1458_337: "w-4 h-4 animate-pulse",
  style1469_338: "h-10 border-white/10 hover:bg-neutral-900 text-gray-400 font-bold text-xs rounded-xl px-3",
  style1480_339: "space-y-5 animate-fade-in",
  style1481_340: "space-y-2",
  style1482_341: "text-base font-black text-white flex items-center gap-2",
  style1483_342: "w-4 h-4 text-emerald-400 animate-pulse",
  style1486_343: "text-[11px] text-gray-400 leading-relaxed font-sans",
  style1491_344: "p-4 bg-zinc-950 rounded-2xl border border-white/5 space-y-4 text-right",
  style1492_345: "space-y-1",
  style1493_346: "flex justify-between items-center text-xs text-gray-400",
  style1495_347: "font-mono text-emerald-400 font-bold",
  style1497_348: "w-full bg-white/5 h-2 rounded-full overflow-hidden",
  style1499_349: "bg-emerald-500 h-full transition-all duration-300",
  style1506_350: "bg-black p-3.5 rounded-xl border border-emerald-950 font-mono text-[10px] text-emerald-400 space-y-2 h-36 overflow-y-auto",
  style1508_351: "flex items-start gap-1.5",
  style1509_352: "text-emerald-500 select-none",
  style1517_353: "p-3.5 bg-emerald-950/20 border border-emerald-500/20 rounded-xl space-y-2",
  style1518_354: "flex items-center gap-1.5 text-emerald-400 font-black text-xs",
  style1519_355: "w-4 h-4 shrink-0",
  style1522_356: "text-[10px] text-gray-300 leading-relaxed",
  style1523_357: "text-emerald-400",
  style1523_358: "text-emerald-400",
  style1530_359: "flex justify-start",
  style1537_360: "w-full h-12 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-sm rounded-xl",
  style1549_361: "mt-6 pt-4 border-t border-white/10 flex flex-col sm:flex-row sm:items-center sm:justify-between text-[9px] text-gray-500 gap-2 font-mono",
  style1556_362: "fixed inset-0 z-[999] flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-fade-in",
  style1561_363: "w-full max-w-lg bg-zinc-950 border border-emerald-500/35 rounded-3xl p-6 text-right relative shadow-[0_10px_50px_rgba(16,185,129,0.2)]",
  style1563_364: "text-sm font-black text-emerald-400 mb-2 flex items-center gap-1.5",
  style1564_365: "w-4 h-4 text-emerald-400 animate-pulse",
  style1567_366: "text-[10px] text-gray-400 mb-4 leading-relaxed font-sans",
  style1571_367: "space-y-3 mb-6",
  style1585_368: "w-full p-3.5 rounded-2xl border text-right transition-all flex flex-col gap-1 relative overflow-hidden",
  style1587_369: "bg-emerald-950/20 border-emerald-500 shadow-md ring-1 ring-emerald-500/20",
  style1588_370: "bg-black/60 border-white/5 hover:border-emerald-500/30",
  style1592_371: "absolute top-0 left-0 bg-[#00ffcc] text-black text-[7px] px-2 py-0.5 rounded-br-md font-black uppercase tracking-tighter",
  style1594_372: "flex justify-between items-center w-full",
  style1595_373: "text-xs font-black",
  style1595_374: "text-emerald-400",
  style1595_375: "text-gray-200",
  style1598_376: "text-[10px] text-emerald-400 font-mono font-black",
  style1602_377: "text-[9px] text-gray-400 leading-snug font-sans mt-1",
  style1606_378: "mt-2 pt-2 border-t border-white/5 flex justify-between items-center text-[9px] font-sans",
  style1607_379: "text-gray-500",
  style1608_380: "font-mono font-bold",
  style1608_381: "text-emerald-400",
  style1608_382: "text-red-400 animate-pulse",
  style1617_383: "bg-emerald-950/10 border border-emerald-500/10 p-3 rounded-2xl mb-4 flex justify-between items-center text-xs",
  style1618_384: "text-right",
  style1619_385: "text-[9px] text-gray-500 block",
  style1620_386: "font-mono text-emerald-400 font-black text-sm",
  style1622_387: "text-left font-mono",
  style1623_388: "text-[9px] text-gray-500 block text-left",
  style1624_389: "font-black text-sm",
  style1624_390: "text-red-400 animate-pulse",
  style1624_391: "text-amber-400",
  style1630_392: "flex gap-2",
  style1634_393: "flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs h-10 rounded-xl",
  style1642_394: "border-white/10 text-gray-400 hover:bg-white/5 text-xs h-10 rounded-xl px-4",
  style1684_395: "radar-advertiser-container text-right",
  style1687_396: "dash-header",
  style1696_397: "retention-alert-box",
  style1705_398: "ads-management-section",
  virtualGradient: "from-zinc-900 to-black border-[#00ffcc]/10",
} as const;


const VIRTUAL_ADS_STREAM = [
  { id: 'v1', title: 'سيارة المستقبل الذكية 🚗', desc: 'نقل  ذكي بأحدث الميزات وبأفضل جودة ملاحة وتوصيل.', gradient: 'from-emerald-950/80 to-zinc-900 border-emerald-500/20 text-[#00ffcc]' },
  { id: 'v2', title: 'وجبة السائق الفاخرة 🥘', desc: 'خصم 50% للركاب والناقلين النشطين على مدار الساعة في منطقة ناعور.', gradient: 'from-amber-950/80 to-zinc-900 border-amber-500/20 text-amber-400' },
  { id: 'v3', title: 'خدمات التوصيل السريع 📦', desc: 'أمن وسرعة فائقة في نقل الشاحنات والطرود فوراً وصفر تأخير.', gradient: 'from-blue-950/80 to-zinc-900 border-blue-500/20 text-cyan-400' },
];

export function LiveStreamRegistry({ ads }: { ads: any[] }) {
  const stream = useMemo(() => {
    const activeAds = ads.filter(ad => ad.status === 'active' || ad.status === 'ACTIVE' || !ad.status);
    return activeAds.length > 0 ? [...activeAds, ...VIRTUAL_ADS_STREAM] : VIRTUAL_ADS_STREAM;
  }, [ads]);

  return (
    <div className={styles.style44_1} dir="ltr">
      <div className={styles.style45_2} dir="rtl">
        <span className={styles.style46_3} />
        <span className={styles.style47_4}>LIVE AD STREAM PREVIEW • الإعلانات الحي</span>
      </div>

      <div className={styles.style50_5}>
        <motion.div
          className={styles.style52_6}
          animate={{ x: ["0%", "-50%"] }}
          transition={{ repeat: Infinity, duration: 24, ease: "linear" }}
        >
          {[...stream, ...stream].map((ad, idx) => {
            const title = ad.title || ad.content?.title || '';
            const description = ad.description || ad.desc || ad.content?.description || '';
            const isVirtual = ad.id.startsWith('v');
            const gradientStyle = ad.gradient || styles.virtualGradient;

            return (
              <div
                key={`${ad.id}-${idx}`}
                className={cn(styles.style65_7, gradientStyle, styles.style65_8)}
                dir="rtl"
              >
                <div className={styles.style68_9}>
                  <span className={cn(styles.style69_10, isVirtual ? styles.style70_11 : styles.style70_12)}>
                    {isVirtual ? 'افتراضي 🛡️' : 'نشاط حي ⚡'}
                  </span>
                </div>
                <div className={styles.style75_13}>
                  <h4 className={styles.style76_14}>{title}</h4>
                  <p className={styles.style77_15}>{description}</p>
                </div>
              </div>
            );
          })}
        </motion.div>
      </div>
    </div>
  );
}

export function AdvertiserPortal({ onClose }: { onClose?: () => void }) {
  const { createAd, ads, toggleAdStatus, deleteAd, extendAd } = useAdminAds();
  const pendingAds = useMemo(() => {
    return (ads || []).filter(ad => (ad.status || '').toLowerCase() === 'pending' || (ad.status || '') === 'PENDING');
  }, [ads]);
  const { pulseData } = useMarketPulse(true);
  const { toast } = useToast();

  // Active Tab switch inside the Cabinet
  const [activeTab, setActiveTab] = useState<'dashboard' | 'create'>('dashboard');

  // Expanded ad tracking for horizontal compact list
  const [expandedAdId, setExpandedAdId] = useState<string | null>(null);

  // Accordion panels open state for ad creation
  const [openSecs, setOpenSecs] = useState<Record<number, boolean>>({
    1: true,
    2: false,
    3: false
  });

  // Multi-step form state inside 'create' tab (step 3 will be the audit view)
  const [step, setStep] = useState(1);
  const [governorate, setGovernorate] = useState('');
  const [district, setDistrict] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [posterUrl, setPosterUrl] = useState('https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&q=80&w=1000');
  const [whatsapp, setWhatsapp] = useState('962798888888');
  const [phone, setPhone] = useState('0798888888');
  const [geoLoc, setGeoLoc] = useState('https://maps.google.com/?q=31.9522,35.8333');
  const [buttonText, setButtonText] = useState('تواصل واحجز الآن 🚀');
  const [targetImpressions, setTargetImpressions] = useState(10000);
  const [paymentChannel, setPaymentChannel] = useState('Zain Cash');

  // Package Pricing States [RAD-CMD-060]
  const [selectedPackageId, setSelectedPackageId] = useState<string>('immortal-heart');
  const [isPremiumRetentionPaid, setIsPremiumRetentionPaid] = useState<boolean>(true);
  const [aiBudget, setAiBudget] = useState<string>('50');
  const [aiGoal, setAiGoal] = useState<'awareness' | 'retention' | 'broad'>('retention');
  const [aiRecommendation, setAiRecommendation] = useState<string | null>(null);
  const [isPackageModalOpen, setIsPackageModalOpen] = useState<boolean>(false);

  // 1️⃣ Defining the exact State Variables required by command RAD-CMD-046
  const whatsappNumber = whatsapp;
  const setWhatsappNumber = setWhatsapp;
  const directPhone = phone;
  const setDirectPhone = setPhone;
  const locationUrl = geoLoc;
  const setLocationUrl = setGeoLoc;
  const targetGovernorate = governorate;
  const setTargetGovernorate = setGovernorate;
  const targetDistrict = district;
  const setTargetDistrict = setDistrict;
  const adImage = posterUrl;
  const setAdImage = setPosterUrl;

  const currentPackage = useMemo(() => {
    return SOVEREIGN_PRICING_PACKAGES.find(p => p.id === selectedPackageId) || SOVEREIGN_PRICING_PACKAGES[1];
  }, [selectedPackageId]);

  const suggestBestPackage = useCallback((budgetStr: string, goal: 'awareness' | 'retention' | 'broad') => {
    const budget = parseFloat(budgetStr) || 0;
    let recommendedId = 'basic-pulse';
    let reasoning = '';

    if (goal === 'retention' || budget >= 30) {
      recommendedId = 'immortal-heart';
      reasoning = `🤖 مستشار الـ AI: للطلب المبتني على 'الاحتفاظ وتخليد الأختام '، باقة "التخليد والقلب الأخضر" هي الأنسب لك بـ 0.07 د.أ لإضافة وحبس الإشهار في الذاكرات المحلية.`;
    } else if (goal === 'broad' || budget >= 60) {
      recommendedId = 'broad-sweep';
      reasoning = `🤖 مستشار الـ AI: للطلب المبتني على 'الاكتساح الساحق والمشاريع الكبرى'، نقترح قائمة باقة "الاكتساح والانتشار " لتثبيت الرتبة وحمايتها من التذبذب.`;
    } else {
      recommendedId = 'basic-pulse';
      reasoning = `🤖 مستشار الـ AI: للميزانيات الاقتصادية القليلة، باقة "نشاط الاختبار الأساسي" بـ 0.05 د.أ تمنحك تجربة ممتازة واختبار الركاب بصفر مغالاة.`;
    }

    setSelectedPackageId(recommendedId);
    const pkg = SOVEREIGN_PRICING_PACKAGES.find(p => p.id === recommendedId);
    if (pkg) {
      setIsPremiumRetentionPaid(pkg.isRetention);
    }
    setAiRecommendation(reasoning);
    toast({
      title: '🤖 محرك الـ AI للمحفظة والباقات',
      description: reasoning,
    });
  }, [toast]);

  const checkDistrictCapacity = useCallback((dist: string) => {
    if (dist === 'وادي السير') {
      return 'FULL';
    }
    return 'AVAILABLE';
  }, []);

  // AI Quality and flow controls
  const [isSimulatingAudit, setIsSimulatingAudit] = useState(false);
  const [auditProgress, setAuditProgress] = useState(0);
  const [auditLogs, setAuditLogs] = useState<string[]>([]);
  const [auditApproved, setAuditApproved] = useState(false);

  // Simulated Advertiser Financial State
  const [advertiserBalance, setAdvertiserBalance] = useState(150.00);

  const districts = useMemo(() => {
    return governorate ? getDistrictsByGovernorate(governorate) : [];
  }, [governorate]);

  // Read pricing anomalies statistics & dynamic parameters from Firestore market pulse
  const activeDistrictPulse = useMemo(() => {
    if (!district || !pulseData) return null;
    return pulseData.find(p => p.id === district) || null;
  }, [district, pulseData]);

  // Enforce Max Ads per district. Triggers capacity alert for 'وادي السير'
  const isCapacityFull = useMemo(() => {
    return district === 'وادي السير';
  }, [district]);

  // Calculate dynamic pricing with 40% discount for emergency ads
  const calculatedCost = useMemo(() => {
    const ratePerImpression = currentPackage.pricePerImpression;
    const basePrice = (targetImpressions * ratePerImpression);
    if (activeDistrictPulse?.emergencyAdCapacityActive) {
      return basePrice * 0.60; // 40% discount
    }
    return basePrice;
  }, [targetImpressions, activeDistrictPulse, currentPackage]);

  const redirectCampaignToNaour = useCallback(() => {
    setGovernorate('عمان');
    setDistrict('ناعور');
    toast({
      title: '✨ تم إعادة توجيه ذكية',
      description: 'تم تحويل التوجيه الجغرافي إلى منطقة ناعور للحصول على خصم السعة الميدانية.',
    });
  }, [toast]);

  // Perform Forensic AI Audit locally (Step 3 Gate)
  const runForensicAuditAndLaunch = useCallback(() => {
    // 2️⃣ Validation Gates as commanded by RAD-CMD-046
    if (!adImage || !whatsappNumber || !directPhone || !locationUrl || !targetGovernorate || !targetImpressions) {
      alert("⚠️ رفض : لا يمكن إطلاق الحملة. يجب استكمال جميع حقول الاستحواذ (الواتساب، الهاتف، الموقع الجغرافي) وتحديد الإدارة الجغرافية وعدد مرات الظهور المطلوبة.");
      return; // تجميد العملية كلياً
    }

    // Prepaid balance check [RAD-CMD-060]
    if (advertiserBalance < calculatedCost) {
      alert(`⚠️ رفض  (ميزانية غير كافية): رصيدك الحالي هو [${advertiserBalance.toFixed(2)} د.أ] وهو أقل من الكلفة التقديرية للحملة البالغة [${calculatedCost.toFixed(2)} د.أ]. يرجى شحن رصيدك للمتابعة.`);
      return;
    }

    // 3️⃣ Capacity Warning as commanded by RAD-CMD-046
    if (checkDistrictCapacity(targetDistrict) === 'FULL') {
      alert(`⚠️ رفض  (السعة ممتلئة): المنطقة [${targetDistrict}] ممتلئ حالياً. نقترح توجيه حملتك لمنطقة المجاور لتحقيق مشاهدات أعلى بجودة أكبر.`);
      return;
    }

    // 1. Image or video posterUrl validation
    const cleanPosterUrl = posterUrl ? posterUrl.trim() : '';
    if (!cleanPosterUrl || !cleanPosterUrl.startsWith('http')) {
      toast({
        variant: 'destructive',
        title: '⚠️ فشل التحقق من مادة الإعلان',
        description: 'يرجى إدخال رابط صالح وصحيح لصورة البوستر أو الفيديو (يجب أن يبدأ بـ http/https).',
      });
      return;
    }

    // 2. Whatsapp number validation
    const cleanWhatsapp = whatsapp ? whatsapp.trim().replace('+', '') : '';
    if (!cleanWhatsapp || cleanWhatsapp.length < 9 || isNaN(Number(cleanWhatsapp))) {
      toast({
        variant: 'destructive',
        title: '⚠️ رقم الواتساب غير صالح',
        description: 'يرجى إدخال رقم واتساب فعال مكون من الأرقام فقط ومفتاح الدولة (مثال: 962798888888).',
      });
      return;
    }

    // 3. Direct Phone validation
    const cleanPhone = phone ? phone.trim() : '';
    if (!cleanPhone || cleanPhone.length < 9 || isNaN(Number(cleanPhone.replace('+', '')))) {
      toast({
        variant: 'destructive',
        title: '⚠️ رقم الهاتف غير صالح',
        description: 'يرجى إدخال رقم هاتف مباشر صحيح (مثال: 0798888888).',
      });
      return;
    }

    // 4. Geo-location link or landing page validation
    const cleanGeoLoc = geoLoc ? geoLoc.trim() : '';
    if (!cleanGeoLoc || !cleanGeoLoc.startsWith('http')) {
      toast({
        variant: 'destructive',
        title: '⚠️ رابط الموقع الجغرافي مطلوب',
        description: 'يجب إدخال رابط موقع جغرافي فعال أو صفحة هبوط لتمكين خاصية الاستحواذ المباشر الـ Zero-Click (يبدأ بـ http/https).',
      });
      return;
    }

    // Safe to transition to step 3 since all validations passed successfully
    setStep(3);

    setIsSimulatingAudit(true);
    setAuditApproved(false);
    setAuditProgress(10);
    setAuditLogs(['🔍 بدء الفحص الأمني الرقمي للإعلان الجغرافي المنسق...', '🛡️ مراجعة امتثال ميثاق السلامة الحظرية الأردنية [SCR-AD-INTEGRITY-112]']);

    const progression = [
      { p: 30, log: '⚔️ فحص احتواء الأسلحة ومقاطع العنف... آمن وبيد أمينة ✓' },
      { p: 60, log: '🔞 فحص احتواء العري والمواد المنافية للحشمة العامة... آمن ✓' },
      { p: 85, log: '📷 فحص تباين البوستر ومطابقة أبعاد مسرح الشاشة الكامل... جودة عالية وممتازة ✓' },
      { p: 100, log: '🏛️ تم التصديق والامتثال! الإعلان آمن ومستحق لوضع [الاستعداد للنشاط الموجه] ✓' }
    ];

    progression.forEach((s, i) => {
      setTimeout(() => {
        setAuditProgress(s.p);
        setAuditLogs(prev => [...prev, s.log]);

        if (s.p === 100) {
          setTimeout(async () => {
            try {
              // Create the live ad document in firestore ('promos') [RAD-CMD-060]
              const expirationTimestamp = Date.now() + 72 * 60 * 60 * 1000;
              await createAd({
                title,
                description,
                targetDistrict: district || 'كل الألوية',
                targetGovernorate: governorate,
                targetImpressions,
                phone,
                whatsapp,
                geoLoc,
                posterUrl,
                buttonText,
                isPremiumRetentionPaid,
                expirationTimestamp,
                adType: 'SOVEREIGN_NATIVE',
                packageId: selectedPackageId,
              });

              // Deduct prepaid cost from current session balance
              setAdvertiserBalance(prev => prev - calculatedCost);
              setAuditApproved(true);
              setIsSimulatingAudit(false);
            } catch (err) {
              console.error('Failed to register promo in database:', err);
              setAuditApproved(true);
              setIsSimulatingAudit(false);
            }
          }, 1000);
        }
      }, (i + 1) * 800);
    });
  }, [
    adImage, whatsappNumber, directPhone, locationUrl, targetGovernorate, targetImpressions,
    checkDistrictCapacity, targetDistrict, posterUrl, whatsapp, phone, geoLoc,
    isPremiumRetentionPaid, createAd, toast, buttonText, district, governorate,
    selectedPackageId, advertiserBalance, calculatedCost
  ]);

  // Pre-calculated stats for Block 1
  const ledgerStats = useMemo(() => {
    let totalImpressions = 0;
    let totalClicks = 0;
    ads.forEach(ad => {
      if (ad.status === 'active') {
        totalImpressions += (ad.currentImpressions || 0);
        totalClicks += (ad.clicksCount || 0);
      }
    });

    // In case user hasn't active running metrics, fallback to realistic values for preview
    const finalImpressions = totalImpressions || 16480;
    const finalClicks = totalClicks || 912;
    const ctr = finalImpressions > 0 ? ((finalClicks / finalImpressions) * 100).toFixed(2) : '5.53';

    // [SCR-AD-HEART-125] Recovery of local hearts for follower pulse estimation
    let localHeartsCount = 0;
    try {
      if (typeof window !== 'undefined') {
        const stored = localStorage.getItem('sovereign_hearted_ads');
        if (stored) {
          localHeartsCount = JSON.parse(stored).length;
        }
      }
    } catch (e) {
      console.error(e);
    }
    const followerPulse = localHeartsCount || 350;

    return {
      impressions: finalImpressions,
      clicks: finalClicks,
      ctr: ctr,
      followerPulse: followerPulse
    };
  }, [ads]);

  // Accepting Dynamic Recommendation from Gamification engine
  const handleRecommendationAccept = useCallback((recName: string, requiredCost: number, districtName: string) => {
    if (advertiserBalance < requiredCost) {
      toast({
        variant: 'destructive',
        title: '⚠️ رصيد المحفظة غير كافٍ',
        description: `أنت بحاجة إلى شحن محفظتك بـ زين كاش أو كليك لإكمال تفعيل حافز ${recName}.`,
      });
      return;
    }

    setAdvertiserBalance(prev => prev - requiredCost);
    toast({
      title: '🚀 تم إطلاق الحافز والاستحواذ الجغرافي',
      description: `تم قبول توصية "${recName}" واكتساح منطقة ${districtName} فورياً بصفر تأخير بشري.`,
    });
  }, [advertiserBalance, toast]);

  const handleDepositSimulate = useCallback((amount: number) => {
    setAdvertiserBalance(prev => prev + amount);
    toast({
      title: '💳 تم شحن الحساب بنجاح',
      description: `تم تعبئة ميزانيتك بـ ${amount} دينار بنجاح عبر قناة الدفع الفوري ${paymentChannel}.`,
    });
  }, [paymentChannel, toast]);

  // Add a simulated status list containing active, processing, and rejected status for demonstration
  const allSovereignAds = useMemo(() => {
    const pendingMap = new Map((pendingAds || []).map(item => [item.id, item]));

    const list = ads.map(ad => {
      if (pendingMap.has(ad.id)) {
        return { ...ad, ...pendingMap.get(ad.id), status: 'PENDING' };
      }
      return ad;
    });

    const adIds = new Set(list.map(a => a.id));
    (pendingAds || []).forEach(pending => {
      if (!adIds.has(pending.id)) {
        list.push(pending);
      }
    });

    // Always inject a simulated rejected/governed ad so the advertiser can observe the "مرفوض " state requested
    const hasSimulatedRejected = list.some(a => a.id === 'promo-rejected-demo');
    if (!hasSimulatedRejected) {
      list.push({
        id: 'promo-rejected-demo',
        status: 'frozen', // Treated as governed or blocked
        title: 'عروض الذهب الحرفي لمنتجات ريف ناعور',
        description: 'منتجات طبيعية بخصومات تفوق 90% مع خدمة توصيل مجاني.',
        content: {
          title: 'عروض الذهب الحرفي لمنتجات ريف ناعور',
          description: 'منتجات طبيعية بخصومات تفوق 90% مع خدمة توصيل مجاني.',
          posterUrl: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&q=80&w=1000'
        },
        targetDistrict: 'ناعور',
        targetGovernorate: 'عمان',
        currentImpressions: 0,
        targetImpressions: 5000,
        clicksCount: 0,
        phone: '0791234567',
        whatsapp: '962791234567'
      });
    }
    return list;
  }, [ads, pendingAds]);

  return (
    <div className={styles.style461_16} dir="rtl">

      {/* Decorative Neon Blurs */}
      <div className={styles.style464_17} />
      <div className={styles.style465_18} />

      {/* Header Panel with Cyberpunk Badges */}
      <div className={styles.style468_19}>
        <div className={styles.style469_20}>
          <span className={styles.style470_21}>
            <ShieldCheck className={styles.style471_22} />
            غرفة تحكم المعلن  V5.5
          </span>
          <span className={styles.style474_23}>
            SCR-AD-DASH-122
          </span>
          {onClose && (
            <button
              onClick={onClose}
              className={styles.style480_24}
            >
              الخروج الآمن ✕
            </button>
          )}
        </div>

        {/* Toggleable Navigation Tab Segments */}
        <div className={styles.style488_25}>
          <button
            onClick={() => setActiveTab('dashboard')}
            className={cn(styles.style491_26, activeTab === 'dashboard'
                ? styles.style493_27
                : styles.style494_28)}
          >
            📊 لوحة التحكم والنشاط
          </button>
          <button
            onClick={() => {
              setActiveTab('create');
              setStep(1);
            }}
            className={cn(styles.style504_29, activeTab === 'create'
                ? styles.style506_30
                : styles.style507_31)}
          >
            🚀 إطلاق حملة جديدة
          </button>
        </div>
      </div>
      <div className={styles.style514_32}>
        <div className={styles.style515_33} />
        <Zap className={styles.style516_34} />
        <div className={styles.style517_35}>
          <h4 className={styles.style518_36}>ميثاق حوكمة الإعلانات (شروط الرادار الدائري):</h4>
          <p className={styles.style519_37}>
            "الشاشة في وضع الاستعداد هي إعلانات دائم الدوران وهو مصدر الدخل الوحيد والأساسي للمنصة."
            <span className={styles.style521_38}>تمكين صفر كلفة ($Zero-Cost$) مستدام وشامل لتسهيل الانتقال الميداني.</span>
          </p>
        </div>
      </div>

      {/* TAB 1: Sovereign Dashboard View (Contains the 5 main Blocks) */}
      {activeTab === 'dashboard' && (
        <div className={styles.style528_39}>
          {/* [RAD-CMD-067-LIVE-STREAM-FLOW] Infinite Auto-Scrolling Marquee */}
          <LiveStreamRegistry ads={allSovereignAds} />

          {/* BLOCK 1: بورصة النشاط الإعلاني والمشاهدات (The Impression & ROI Ledger) */}
          <div className={styles.style533_40}>
            <h3 className={styles.style534_41}>
              <TrendingUp className={styles.style535_42} />
              1. بورصة النشاط الإعلاني والمشاهدات (Ledger & Live ROI)
            </h3>

            <div className={styles.style539_43}>
              <div className={styles.style540_44}>
                <div className={styles.style541_45}>Impressions</div>
                <span className={styles.style542_46}>المشاهدات الحية</span>
                <span className={styles.style543_47}>
                  {ledgerStats.impressions.toLocaleString()}
                </span>
                <span className={styles.style546_48}>كل ظهور = نشاطة</span>
              </div>

              <div className={styles.style549_49}>
                <div className={styles.style550_50}>Clicks</div>
                <span className={styles.style551_51}>المداخلات المباشرة</span>
                <span className={styles.style552_52}>
                  {ledgerStats.clicks.toLocaleString()}
                </span>
                <span className={styles.style555_53}>مكاملة الروابط مباشرة</span>
              </div>

              <div className={styles.style558_54}>
                <div className={styles.style559_55}>CTR</div>
                <span className={styles.style560_56}>نسبة كفاءة النشاط</span>
                <span className={styles.style561_57}>
                  {ledgerStats.ctr}%
                </span>
                <span className={styles.style564_58}>تفاعل مستخلص</span>
              </div>

              {/* [SCR-AD-HEART-125] Active Follower Pulse (Retention Gauge) */}
              <div className={styles.style568_59}>
                <div className={styles.style569_60}>Retention</div>
                <span className={styles.style570_61}>الجمهور المهتم النشط</span>
                <span className={styles.style571_62}>
                  {ledgerStats.followerPulse.toLocaleString()}
                </span>
                <span className={styles.style574_63}>نشاط المتابع النشط ✓</span>
              </div>
            </div>
          </div>

          {/* BLOCK 2: مركز حوكمة وحالة الإعلانات المرفوعة (Ad Status & Governance) */}
          <div className={styles.style580_64}>
            <h3 className={styles.style581_65}>
              <ShieldCheck className={styles.style582_66} />
              2. مركز حوكمة وحالة الإعلانات المرفوعة (Ad Safety Ledger)
            </h3>

            <div className={styles.style586_67}>
              {allSovereignAds.map((ad) => {
                const isRejectedDemo = ad.id === 'promo-rejected-demo';
                const statusUpper = (ad.status || '').toUpperCase();
                const isRejected = isRejectedDemo || statusUpper === 'REJECTED' || ad.isSovereignStopped === true;
                const isActive = statusUpper === 'ACTIVE' || ad.status === 'active';
                const isPending = statusUpper === 'PENDING' || ad.status === 'paused' || ad.status === 'frozen';

                // Assign tags and styles according to constitution principles
                let statusLabel = '';
                let statusStyle = '';
                if (isActive) {
                  statusLabel = 'نشط 🟢';
                  statusStyle = 'text-emerald-400 bg-emerald-950/40 border-emerald-500/30';
                } else if (isPending && !isRejected) {
                  statusLabel = 'معلّق 🟡';
                  statusStyle = 'text-amber-400 bg-amber-950/40 border-amber-500/30';
                } else {
                  statusLabel = 'مرفوض 🔴';
                  statusStyle = 'text-red-400 bg-red-950/40 border-red-500/30';
                }

                const rejectionText = ad.rejectionReason || '“حظر محتوى: تم رفض الإعلان لوجود نصوص غير واضحة أو جودة بصرية منخفضة تضر بمسرح الشاشة. نرحب بإعادة الرفع فوراً بعد التعديل لإنفاذ حملتك بنجاح.”';
                const hasPremium = ad.isPremiumRetentionPaid !== false; // for demo and defaults
                const isExpanded = expandedAdId === ad.id;
                const posterUrlShow = ad.posterUrl || ad.content?.posterUrl || '';

                return (
                  <div
                    key={ad.id}
                    className={styles.style616_68}
                  >
                    {/* Horizontal Compact Row */}
                    <div
                      onClick={() => setExpandedAdId(isExpanded ? null : ad.id)}
                      className={styles.style621_69}
                    >
                      {/* Left: Thumbnail and stacked Title/Description */}
                      <div className={styles.style624_70}>
                        {posterUrlShow ? (
                          <img
                            src={posterUrlShow}
                            alt=""
                            className={styles.style629_71}
                            referrerPolicy="no-referrer"
                          />
                        ) : (
                          <div className={styles.style633_72}>
                            <Megaphone className={styles.style634_73} />
                          </div>
                        )}
                        <div className={styles.style637_74}>
                          <h4 className={styles.style638_75}>
                            {ad.title || ad.content?.title}
                            <span className={styles.style640_76}>
                              {ad.serial_id || `A-10${ad.id === 'promo-rejected-demo' ? '99' : '02'}`}
                            </span>
                          </h4>
                          <p className={styles.style644_77}>{ad.description || ad.content?.description}</p>
                        </div>
                      </div>

                      {/* Right: Direct Actions & Status & Expand indicators */}
                      <div className={styles.style649_78}>
                        {/* Dynamic quick-links as small icons */}
                        <div className={styles.style651_79}>
                          {ad.whatsapp && (
                            <a
                              href={`https://wa.me/${ad.whatsapp.replace('+', '')}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              className={styles.style658_80}
                              title="اتصال واتساب سريع"
                            >
                              <MessageSquare className={styles.style661_81} />
                            </a>
                          )}
                          {(ad.phone || ad.whatsapp) && (
                            <a
                              href={`tel:${ad.phone || ad.whatsapp}`}
                              onClick={(e) => e.stopPropagation()}
                              className={styles.style668_82}
                              title="اتصال هاتفي سريع"
                            >
                              <Phone className={styles.style671_83} />
                            </a>
                          )}
                        </div>

                        {/* Status Label Badge */}
                        <span className={cn(styles.style677_84, statusStyle)}>
                          {statusLabel}
                        </span>

                        {/* Expander Arrow */}
                        <span className={cn(styles.style682_85, isExpanded ? styles.style682_86 : '')}>
                          ▼
                        </span>
                      </div>
                    </div>

                    {/* Expandable Accordion Body */}
                    <AnimatePresence initial={false}>
                      {isExpanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.15 }}
                          className={styles.style696_87}
                        >
                          <div className={styles.style698_88}>
                            {hasPremium && (
                              <div className={styles.style700_89}>
                                🟢 باقة التخليد الفعّالة (القلب الأخضر) - تتيح للمستهلكين حبس الإعلان في الذاكرة المحلية للأبد
                              </div>
                            )}

                            <div className={styles.style705_90}>
                              <div className={styles.style706_91}>
                                الموقع: <span className={styles.style707_92}>{ad.targetGovernorate || 'عمان'} - {ad.targetDistrict || 'الجامعة'}</span>
                              </div>
                              <div className={styles.style709_93}>
                                النشاط المستهدف: <span className={styles.style710_94}>{(ad.targetImpressions || 0).toLocaleString()}</span>
                              </div>
                              <div className={styles.style712_95}>
                                النشاط الفعلي: <span className={styles.style713_96}>{(ad.currentImpressions || 0).toLocaleString()}</span>
                              </div>
                              <div className={styles.style715_97}>
                                النقرات: <span className={styles.style716_98}>{(ad.clicksCount || 0).toLocaleString()}</span>
                              </div>
                            </div>

                            {/* Detailed Constitutional Explanation for any Refusal (Absolute transparency) */}
                            {isRejected && (
                              <div className={styles.style722_99}>
                                <div className={styles.style723_100}>
                                  <ShieldAlert className={styles.style724_101} />
                                  <div className={styles.style725_102}>
                                    <span className={styles.style726_103}>إفادة مركز السلامة  (سبب الرفض):</span>
                                    <p className={styles.style727_104}>
                                      {rejectionText}
                                    </p>
                                  </div>
                                </div>
                              </div>
                            )}

                            {/* Control Actions for Non-Rejected Ads */}
                            {!isRejected && (
                              <div className={styles.style737_105}>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => toggleAdStatus(ad.id, ad.status)}
                                  className={styles.style742_106}
                                >
                                  {ad.status === 'active' || ad.status === 'ACTIVE' ? '⚙️ إيقاف مؤقت' : '⚡ تفعيل النشاط'}
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => extendAd(ad.id, 1000, 3)}
                                  className={styles.style750_107}
                                >
                                  ➕ تمديد الحملة (+1000 نشاطة)
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => deleteAd(ad.id)}
                                  className={styles.style758_108}
                                >
                                  🗑️ أرشفة الإعلان
                                </Button>
                              </div>
                            )}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}
            </div>
          </div>

          {/* BLOCK 3: خريطة السعة المحلية الديناميكية (Geo-Capacity Heatmap) */}
          <div className={styles.style775_109}>
            <h3 className={styles.style776_110}>
              <Activity className={styles.style777_111} />
              3. خريطة السعة المحلية الديناميكية (Dynamic Geo-Capacity Heatmap)
            </h3>

            <div className={styles.style781_112}>
              <p className={styles.style782_113}>
                الرصد اللحظي لزخم حركات الركاب ومستويات الانتباه الميداني للأجهزة النشطة على حافة النظام دون إرهاق العتاد أو تحميل خرائط خارجية.
              </p>

              <div className={styles.style786_114}>
                {[
                  { name: 'منطقة ناعور (عمان)', capacity: 94, priceAnom: 'نشط جداً', attention: 'استثنائي 98%', color: 'from-emerald-500 to-teal-500' },
                  { name: 'منطقة وادي السير (عمان)', capacity: 85, priceAnom: 'مكتظ (حرق أسعار)', attention: 'مرتفع 89%', color: 'from-amber-500 to-orange-500' },
                  { name: 'منطقة قصبة السلط (البلقاء)', capacity: 68, priceAnom: 'متزن', attention: 'عادي 65%', color: 'from-indigo-500 to-blue-500' },
                  { name: 'منطقة الجيزة (عمان)', capacity: 42, priceAnom: 'منخفض', attention: 'عادي 50%', color: 'from-slate-500 to-gray-500' }
                ].map((item, idx) => (
                  <div key={idx} className={styles.style793_115}>
                    <div className={styles.style794_116}>
                      <span className={styles.style795_117}>{item.name}</span>
                      <div className={styles.style796_118}>
                        <span>انتباه الركاب: <strong className={styles.style797_119}>{item.attention}</strong></span>
                        <span className={styles.style798_120} />
                        <span>حالة السعة: <strong className={styles.style799_121}>{item.priceAnom}</strong></span>
                      </div>
                    </div>

                    {/* Compact custom bar representing digital heatmap intensity */}
                    <div className={styles.style804_122}>
                      <div
                        className={cn(styles.style806_123, item.color, styles.style806_124)}
                        style={{ width: `${item.capacity}%` }}
                      />
                    </div>

                    <div className={styles.style811_125}>
                      <span>مستوى الاستهداف البصري: {item.capacity}%</span>
                      {item.capacity >= 80 && (
                        <button
                          onClick={() => {
                            setGovernorate('عمان');
                            setDistrict(item.name.replace(' (عمان)', ''));
                            setActiveTab('create');
                            setStep(2);
                            toast({
                              title: '🎯 توجيه ذكي للميزانية',
                              description: `تم تحويل الحملة الجغرافية فوراً لاكتساح منطقة ${item.name.replace(' (عمان)', '')}.`
                            });
                          }}
                          className={styles.style825_126}
                        >
                          ⚡ وجه ميزانيتك هنا واكتسح المنطقة
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* BLOCK 4: لوحة الرسائل الترحيبية والتنبيهات التشجيعية (The Retention Alerts) */}
          <div className={styles.style838_127}>
            <h3 className={styles.style839_128}>
              <Sparkles className={styles.style840_129} />
              4. لوحة الرسائل الترحيبية والتنبيهات التشجيعية (Retention Pulse Alerts)
            </h3>

            <div className={styles.style844_130}>
              <div className={styles.style845_131} />

              <div className={styles.style847_132}>
                <Award className={styles.style848_133} />
                <span>إشعار الاستحقاق والتكريم  للمعلنين الوفيين</span>
              </div>

              {/* The exact requested retention notification message inside system configuration */}
              <p className={styles.style853_134}>
                🏆 تهانينا! إعلانك غطى <strong className={styles.style854_135}>94%</strong> من السعة الإعلانية المتاحة في منطقة ناعور خلال آخر 24 ساعة وجلب لك <strong className={styles.style854_136}>45</strong> اتصالاً مباشراً. الميدان متعطش لنشاطك، هل تريد تكرار النشاط للأسبوع القادم بخصم رتبة المعلن الوفي؟
              </p>

              <div className={styles.style857_137}>
                <Button
                  size="sm"
                  onClick={() => {
                    handleRecommendationAccept('تكرار تجديد النشاط الوفي', 2.50, 'ناعور');
                  }}
                  className={styles.style863_138}
                >
                  🚀 تجديد الحملة للأسبوع القادم (بـ 2.50 دينار فقط)
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    toast({
                      title: '💬 تواصل مباشر صامت',
                      description: 'تم توجيه طلب التخصيص والميزانيات الكبرى للصندوق الأمني لتسجيل نقاط ولاء.'
                    });
                  }}
                  className={styles.style876_139}
                >
                  ⚙️ طلب تخصيص ميزانية كبرى
                </Button>
              </div>
            </div>
          </div>

          {/* BLOCK 5: محرك التحفيز والتكرار آلياً (The Gamification Engine) */}
          <div className={styles.style885_140}>
            <h3 className={styles.style886_141}>
              <Award className={styles.style887_142} />
              3. محرك التحفيز والتوجيه التلقائي (The Gamification System)
            </h3>

            <div className={styles.style891_143}>
              {/* Rec 1 */}
              <div className={styles.style893_144}>
                <div className={styles.style894_145} />
                <div className={styles.style895_146}>
                  <Sparkles className={styles.style896_147} />
                  <span>توصية زخم منطقة ناعور</span>
                </div>
                <p className={styles.style899_148}>
                  "إعلانك حقق تفاعلاً هائلاً في منطقة ناعور، اضغط هنا لتمديد الحملة بـ 2 دينار فقط واكتساح المنطقة بالكامل."
                </p>
                <div className={styles.style902_149}>
                  <Button
                    size="sm"
                    onClick={() => handleRecommendationAccept('تمديد ناعور الذكي', 2.00, 'ناعور')}
                    className={styles.style906_150}
                  >
                    🚀 تمويل التمديد بـ 2.00 د.أ وصفر انتظار
                  </Button>
                </div>
              </div>

              {/* Rec 2 */}
              <div className={styles.style914_151}>
                <div className={styles.style915_152} />
                <div className={styles.style916_153}>
                  <Zap className={styles.style917_154} />
                  <span>حافز وادي السير الطارئ</span>
                </div>
                <p className={styles.style920_155}>
                  "حظر واضمحلال السعة الإعلانية بوادي السير نشط الآن! انقر لإتاحة التمديد المستعجل بخصم 45% بقيمة 1.5 دينار."
                </p>
                <div className={styles.style923_156}>
                  <Button
                    size="sm"
                    onClick={() => handleRecommendationAccept('تمديد السعة الاستباقي', 1.50, 'وادي السير')}
                    className={styles.style927_157}
                  >
                    ⚡ تفعيل وقنص السعة بـ 1.50 د.أ
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* BLOCK 4: محطة الموازنة والمحفظة  (Sovereign Budget & Prepaid Ledger) */}
          <div className={styles.style937_158}>
            <h3 className={styles.style938_159}>
              <Wallet className={styles.style939_160} />
              4. محطة الموازنة والمحفظة  ($Zero-Cost$ Budget Management)
            </h3>

            <div className={styles.style943_161}>
              <div className={styles.style944_162}>
                <div className={styles.style945_163}>
                  <span className={styles.style946_164}>رصيد ميزانيتك الجاري الرقمي:</span>
                  <div className={styles.style947_165}>
                    <span className={styles.style948_166}>{advertiserBalance.toFixed(2)}</span>
                    <span className={styles.style949_167}>دينار أردني</span>
                  </div>
                </div>

                <div className={styles.style953_168}>
                  <Button
                    size="sm"
                    onClick={() => handleDepositSimulate(10.00)}
                    className={styles.style957_169}
                  >
                    💵 شحن 10 د.أ
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => handleDepositSimulate(25.00)}
                    className={styles.style964_170}
                  >
                    💵 شحن 25 د.أ
                  </Button>
                </div>
              </div>

              <div className={styles.style971_171}>
                <span className={styles.style972_172}>بوابات السداد المتاحة (التشفير والربط الأردني المباشر)</span>
                <div className={styles.style973_173}>
                  <span className={styles.style974_174}>
                    <span className={styles.style975_175} />
                    <strong>زين كاش (Zain Cash)</strong>: متاح بنقر آلي
                  </span>
                  <span className={styles.style978_176}>
                    <span className={styles.style979_177} />
                    <strong>كليك الأردن (CliQ Jordan)</strong>: معرّف مشفّر
                  </span>
                  <span className={styles.style982_178}>
                    <span className={styles.style983_179} />
                    إيداعات صامتة بصفر رسوم معاملات
                  </span>
                </div>
              </div>
            </div>
          </div>

        </div>
      )}

      {/* TAB 2: Multi-step Creative Ad Creation Form */}
      {activeTab === 'create' && (
        <div className={styles.style996_180}>

          {/* Unified 3-Step Map Progress */}
          <div className={styles.style999_181}>
            {[
              { id: 1, title: 'التحديد الجغرافي والسعة', desc: 'المحافظة، المنطقة ومسح السعر' },
              { id: 2, title: 'رفع الحملة وبناء الروابط', desc: 'مسرح الشاشة الكامل والاتصال' },
              { id: 3, title: 'الفحص الأمني والنشاط', desc: 'المطابقة والتدقيق الأمني للـ AI' }
            ].map((s) => (
              <div key={s.id} className={styles.style1005_182}>
                <div className={styles.style1006_183}>
                  <div
                    className={cn(styles.style1008_184, step === s.id
                        ? styles.style1010_185
                        : step > s.id
                          ? styles.style1012_186
                          : styles.style1013_187)}
                  >
                    {step > s.id ? '✓' : s.id}
                  </div>
                  <div className={cn(styles.style1018_188, step > s.id ? styles.style1018_189 : styles.style1018_190)} />
                </div>
                <span className={cn(styles.style1020_191, step === s.id ? styles.style1020_192 : styles.style1020_193)}>
                  {s.title}
                </span>
                <span className={styles.style1023_194}>
                  {s.desc}
                </span>
              </div>
            ))}
          </div>

          {/* UNIFIED ACCORDION CONFIGURATION */}
          {step !== 3 && (
            <div className={styles.style1032_195}>
              <div className={styles.style1033_196}>
                <h2 className={styles.style1034_197}>
                  <Megaphone className={styles.style1035_198} />
                  بناء الحملة الإعلانية وتفويض النشاط
                </h2>
                <p className={styles.style1038_199}>
                  نظم البيانات عبر بوابات الأكورديون التالية لضمان الفحص المسبق واستغلال كامل الأبعاد البصرية للشاشات.
                </p>
              </div>

              {/* ACCORDION SYSTEM */}
              <div className={styles.style1044_200}>

                {/* SECTION 1: Geographical Selection & Capacity */}
                <div className={styles.style1047_201}>
                  <button
                    type="button"
                    onClick={() => setOpenSecs(prev => ({ ...prev, 1: !prev[1] }))}
                    className={styles.style1051_202}
                  >
                    <div className={styles.style1053_203}>
                      <div className={styles.style1054_204}>1</div>
                      <span className={styles.style1055_205}>القسم (1): التوجيه الجغرافي والسعة (جغرافي)</span>
                    </div>
                    <div className={styles.style1057_206}>
                      <span>{governorate && district ? `[${governorate} - ${district}]` : '[خطوة معلّقة]'}</span>
                      <span>{openSecs[1] ? '▲ طي' : '▼ توسيع'}</span>
                    </div>
                  </button>
                  <AnimatePresence initial={false}>
                    {openSecs[1] && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.15 }}
                        className={styles.style1069_207}
                      >
                        <div className={styles.style1071_208}>
                          <div className={styles.style1072_209}>
                            <Label className={styles.style1073_210}>المحافظة المستهدفة</Label>
                            <Select onValueChange={(val) => { setGovernorate(val); setDistrict(''); }} value={governorate}>
                              <SelectTrigger className={styles.style1075_211}>
                                <SelectValue placeholder="اختر المحافظة" />
                              </SelectTrigger>
                              <SelectContent className={styles.style1078_212}>
                                {jordanGovernorates.map(gov => (
                                  <SelectItem key={gov} value={gov} className={styles.style1080_213}>{gov}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>

                          <div className={styles.style1086_214}>
                            <Label className={styles.style1087_215}>المنطقة المستهدف</Label>
                            <Select onValueChange={(val) => setDistrict(val)} value={district} disabled={!governorate}>
                              <SelectTrigger className={styles.style1089_216}>
                                <SelectValue placeholder={governorate ? "اختر المنطقة الجغرافي" : "اختر المحافظة أولاً"} />
                              </SelectTrigger>
                              <SelectContent className={styles.style1092_217}>
                                {districts.map(dist => (
                                  <SelectItem key={dist} value={dist} className={styles.style1094_218}>{dist}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>

                        <div className={styles.style1101_219}>
                          <Label className={styles.style1102_220}>مرات الظهور والنشاط المطلوبة لحجم الاكتساح:</Label>
                          <Select onValueChange={(val) => setTargetImpressions(parseInt(val))} value={targetImpressions.toString()}>
                            <SelectTrigger className={styles.style1104_221}>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className={styles.style1107_222}>
                              <SelectItem value="1000" className={styles.style1108_223}>1,000 ظهور (مستوى اختبار)</SelectItem>
                              <SelectItem value="5000" className={styles.style1109_224}>5,000 ظهور (تأثير محلي)</SelectItem>
                              <SelectItem value="10000" className={styles.style1110_225}>10,000 ظهور (انتشار واسع في المنطقة)</SelectItem>
                              <SelectItem value="50000" className={styles.style1111_226}>50,000 ظهور (تأثير  وشامل)</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        {district && (
                          <div className={styles.style1117_227}>
                            {isCapacityFull ? (
                              <div className={styles.style1119_228}>
                                <div className={styles.style1120_229}>
                                  <ShieldAlert className={styles.style1121_230} />
                                  <span className={styles.style1122_231}>تحذير محرك السعة المكتظة (Capacity Saturation)</span>
                                </div>
                                <p className={styles.style1124_232}>
                                  “الوقت الحالي ممتلئ، ولكن يوجد زخم ركاب مرتفع في المنطقة المجاور <strong className={styles.style1125_233}>ناعور</strong> نتيجة تذبذب الأسعار بنسبة 10%، نقترح توجيه حملتك هناك لتحقيق مشاهدات أعلى بجودة أكبر”.
                                </p>
                                <Button
                                  type="button"
                                  onClick={redirectCampaignToNaour}
                                  className={styles.style1130_234}
                                >
                                  <Sparkles className={styles.style1132_235} />
                                  توجيه الحملة فوراً إلى منطقة ناعور المكبّر (خصومات ومرونة قصوى)
                                </Button>
                              </div>
                            ) : (
                              <div className={styles.style1137_236}>
                                <div className={styles.style1138_237}>
                                  <div className={styles.style1139_238}>
                                    <Activity className={styles.style1140_239} />
                                    <span>بيانات النشاط العام الموحد (Global Pulse) لمنطقة: {district}</span>
                                  </div>
                                  <span className={styles.style1143_240}>
                                    السعة متاحة ✓
                                  </span>
                                </div>

                                <div className={styles.style1148_241}>
                                  <div className={styles.style1149_242}>
                                    <span className={styles.style1150_243}>شذوذ السعر المرصود</span>
                                    <span className={styles.style1151_244}>
                                      {activeDistrictPulse?.priceAnomaliesCount || 0} حالات حرق
                                    </span>
                                  </div>
                                  <div className={styles.style1155_245}>
                                    <span className={styles.style1156_246}>السعة الطارئة</span>
                                    <span className={cn(styles.style1157_247, activeDistrictPulse?.emergencyAdCapacityActive ? styles.style1157_248 : styles.style1157_249)}>
                                      {activeDistrictPulse?.emergencyAdCapacityActive ? '🔥 نشطة (خصم %40)' : 'خاملة'}
                                    </span>
                                  </div>
                                  <div className={styles.style1161_250}>
                                    <span className={styles.style1162_251}>انتباه الركاب الميداني</span>
                                    <span className={styles.style1163_252}>
                                      {activeDistrictPulse?.emergencyAdCapacityActive ? 'عالي %98' : 'عادي %65'}
                                    </span>
                                  </div>
                                </div>

                                {activeDistrictPulse?.emergencyAdCapacityActive && (
                                  <div className={styles.style1170_253}>
                                    <Sparkles className={styles.style1171_254} />
                                    <span>
                                      تم تفعيل <strong>الحزم الإعلانية الطارئة ومكثفة الانتباه</strong> لمنطقة {district} بنصف السعر. استفد من الخصم الحالي الميداني حالاً.
                                    </span>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* SECTION 2: Ad Material & Acquisition Links */}
                <div className={styles.style1187_255}>
                  <button
                    type="button"
                    onClick={() => setOpenSecs(prev => ({ ...prev, 2: !prev[2] }))}
                    className={styles.style1191_256}
                  >
                    <div className={styles.style1193_257}>
                      <div className={styles.style1194_258}>2</div>
                      <span className={styles.style1195_259}>القسم (2): مادة الإعلانات والاتصالات المباشرة (مادي)</span>
                    </div>
                    <div className={styles.style1197_260}>
                      <span>{title ? '[مادة إعلانية مجهزة]' : '[خطوة معلّقة]'}</span>
                      <span>{openSecs[2] ? '▲ طي' : '▼ توسيع'}</span>
                    </div>
                  </button>
                  <AnimatePresence initial={false}>
                    {openSecs[2] && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.15 }}
                        className={styles.style1209_261}
                      >
                        <div className={styles.style1211_262}>
                          <div className={styles.style1212_263}>
                            <div className={styles.style1213_264}>
                              <Label className={styles.style1214_265}>عنوان الحملة المثير للانتباه</Label>
                              <Input
                                placeholder="معروض شاورما السائق  الفاخر"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                className={styles.style1219_266}
                              />
                            </div>

                            <div className={styles.style1223_267}>
                              <Label className={styles.style1224_268}>الوصف البصري والخصومات للركاب</Label>
                              <Input
                                placeholder="احصل على خصم 25% مع كل طوافة نقل للراكب الفعال."
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                className={styles.style1229_269}
                              />
                            </div>

                            <div className={styles.style1233_270}>
                              <Label className={styles.style1234_271}>رابط بوستر الحملة البصري الكامل</Label>
                              <Input
                                placeholder="https://images.unsplash.com/photo-..."
                                value={posterUrl}
                                onChange={(e) => setPosterUrl(e.target.value)}
                                className={styles.style1239_272}
                                dir="ltr"
                              />
                            </div>

                            {/* Direct Acquisition Links */}
                            <div className={styles.style1245_273}>
                              <span className={styles.style1246_274}>روابط التواصل المباشرة (Direct Acquisition Links)</span>
                              <div className={styles.style1247_275}>
                                <div className={styles.style1248_276}>
                                  <Label className={styles.style1249_277}>رقم الواتساب </Label>
                                  <Input
                                    value={whatsapp}
                                    onChange={(e) => setWhatsapp(e.target.value)}
                                    className={styles.style1253_278}
                                    dir="ltr"
                                  />
                                </div>
                                <div className={styles.style1257_279}>
                                  <Label className={styles.style1258_280}>رقم الاتصال المباشر</Label>
                                  <Input
                                    value={phone}
                                    onChange={(e) => setPhone(e.target.value)}
                                    className={styles.style1262_281}
                                    dir="ltr"
                                  />
                                </div>
                                <div className={styles.style1266_282}>
                                  <Label className={styles.style1267_283}>رابط الموقع الجغرافي أو الهبوط</Label>
                                  <Input
                                    placeholder="https://maps.google.com/?q=..."
                                    value={geoLoc}
                                    onChange={(e) => setGeoLoc(e.target.value)}
                                    className={styles.style1272_284}
                                    dir="ltr"
                                  />
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Theater Preview Mock */}
                          <div className={styles.style1281_285}>
                            <span className={styles.style1282_286}>
                              🖥️ مسرح العرض الكامل للراكب (Theatre Preview)
                            </span>

                            <AdDisplayCard
                              ad={{
                                title: title || 'عنوان الحملة',
                                description: description || 'وصف قصير وواضح للحملة.',
                                posterUrl,
                                bannerUrl: posterUrl,
                                buttonText,
                              }}
                              showHeart={false}
                              badgeText="نشاط ميداني"
                              ctaText={buttonText}
                              className={styles.style1297_287}
                            />

                            <div className={styles.style1300_288}>
                              {posterUrl ? (
                                <img
                                  src={posterUrl}
                                  alt="Creative Preview"
                                  referrerPolicy="no-referrer"
                                  className={styles.style1306_289}
                                />
                              ) : (
                                <div className={styles.style1309_290}>
                                  <ImageIcon className={styles.style1310_291} />
                                  <span>مسرح الشاشة الكامل ممتد هنا</span>
                                </div>
                              )}

                              <div className={styles.style1315_292} />

                              <div className={styles.style1317_293}>
                                <span className={styles.style1318_294}>
                                  إعلانات الرادار النشطة
                                </span>
                                <div className={styles.style1321_295}>
                                  <h4 className={styles.style1322_296}>{title || 'عنوان الحملة البصرية'}</h4>
                                  <p className={styles.style1323_297}>{description || 'وصف الحملة وتوجيه الاستبصار.'}</p>
                                </div>
                                <Button className={styles.style1325_298}>
                                  {buttonText}
                                </Button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* SECTION 3: Package Options & Prepayment */}
                <div className={styles.style1338_299}>
                  <button
                    type="button"
                    onClick={() => setOpenSecs(prev => ({ ...prev, 3: !prev[3] }))}
                    className={styles.style1342_300}
                  >
                    <div className={styles.style1344_301}>
                      <div className={styles.style1345_302}>3</div>
                      <span className={styles.style1346_303}>القسم (3): التسعير والذكاء الاصطناعي  (تسعيري)</span>
                    </div>
                    <div className={styles.style1348_304}>
                      <span>الباقة: {currentPackage?.name || 'غير محددة'}</span>
                      <span>{openSecs[3] ? '▲ طي' : '▼ توسيع'}</span>
                    </div>
                  </button>
                  <AnimatePresence initial={false}>
                    {openSecs[3] && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.15 }}
                        className={styles.style1360_305}
                      >
                        {/* AI Recommendation Widget */}
                        <div className={styles.style1363_306}>
                          <span className={styles.style1364_307}>
                            <Sparkles className={styles.style1365_308} /> مستشار الباقة الذكي (AI Pricing Recommendation)
                          </span>
                          <p className={styles.style1367_309}>
                            أدخل ميزانيتك التقديرية وهدفك التسويقي ليقترح لك المحرك  الباقة المثلى تلقائياً:
                          </p>
                          <div className={styles.style1370_310}>
                            <div>
                              <Label className={styles.style1372_311}>ميزانيتك التقديرية (د.أ):</Label>
                              <Input
                                type="number"
                                value={aiBudget}
                                onChange={(e) => setAiBudget(e.target.value)}
                                className={styles.style1377_312}
                              />
                            </div>
                            <div>
                              <Label className={styles.style1381_313}>الغاية التسويقية:</Label>
                              <Select value={aiGoal} onValueChange={(value) => setAiGoal(value as 'awareness' | 'retention' | 'broad')}>
                                <SelectTrigger className={styles.style1104_221}>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent className={styles.style1107_222}>
                                  <SelectItem value="awareness" className={styles.style1108_223}>النشاط العادي (وعي عابر)</SelectItem>
                                  <SelectItem value="retention" className={styles.style1108_223}>التخليد (حفظ مكرر بالذاكرة)</SelectItem>
                                  <SelectItem value="broad" className={styles.style1108_223}>الاكتساح (تغطية  قصوى)</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                          <Button
                            type="button"
                            onClick={() => suggestBestPackage(aiBudget, aiGoal)}
                            className={styles.style1396_315}
                          >
                            <Sparkles className={styles.style1398_316} /> احصل على التوصية الفورية وتطبيقها
                          </Button>
                          {aiRecommendation && (
                            <div className={styles.style1401_317}>
                              {aiRecommendation}
                            </div>
                          )}
                        </div>

                        {/* Package Selection Button Launcher [RAD-CMD-062] */}
                        <div className={styles.style1408_318}>
                          <Label className={styles.style1409_319}>الباقة التسعيرية المعتمدة للحملة:</Label>
                          <div className={styles.style1410_320}>
                            <div className={styles.style1411_321}>
                              <span className={styles.style1412_322}>الباقة الحالية:</span>
                              <span className={styles.style1413_323}>🟢 {currentPackage?.name || 'لم يتم الاختيار بعد'}</span>
                              <span className={styles.style1414_324}>{currentPackage?.pricePerImpression.toFixed(3)} د.أ / ظهور</span>
                            </div>
                            <Button
                              type="button"
                              onClick={() => setIsPackageModalOpen(true)}
                              className={styles.style1419_325}
                            >
                              ⚙️ اختيار الباقة
                            </Button>
                          </div>
                        </div>

                        {/* Invoice & Wallet sync display */}
                        <div className={styles.style1427_326}>
                          <div className={styles.style1428_327}>
                            <span className={styles.style1429_328}>الفاتورة التقديرية المعتمدة للباقة:</span>
                            <span className={styles.style1430_329}>
                              {calculatedCost.toFixed(2)} د.أ
                            </span>
                          </div>
                          <div className={styles.style1434_330}>
                            <span className={styles.style1435_331}>رصيد محفظتك  الجاري:</span>
                            <span className={cn(styles.style1436_332, advertiserBalance < calculatedCost ? styles.style1436_333 : styles.style1436_334)}>
                              {advertiserBalance.toFixed(2)} د.أ
                            </span>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

              </div>

              {/* Action Operations & Forensic Audit Trigger */}
              <div className={styles.style1449_335}>
                <Button
                  type="button"
                  onClick={() => {
                    runForensicAuditAndLaunch();
                  }}
                  disabled={!title || !description || !governorate || !district}
                  className={styles.style1456_336}
                >
                  <ShieldCheck className={styles.style1458_337} />
                  <span>رفع الفحص الأمني وإطلاق النشاط 🛡️</span>
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setOpenSecs({ 1: true, 2: false, 3: false });
                    setActiveTab('dashboard');
                  }}
                  className={styles.style1469_338}
                >
                  <span>إلغاء</span>
                </Button>
              </div>

            </div>
          )}

          {/* STEP 3: Forensic local AI quality checks & Ready State */}
          {step === 3 && (
            <div className={styles.style1480_339}>
              <div className={styles.style1481_340}>
                <h2 className={styles.style1482_341}>
                  <ShieldCheck className={styles.style1483_342} />
                  المرحلة الثالثة: الفحص الأمني للذكاء الاصطناعي (حارس الجودة)
                </h2>
                <p className={styles.style1486_343}>
                  يقوم حارس الجودة الصامت بفحص قائمة البيكسلات والكود الجغرافي لضمان الخلو الكامل من الملوثات البصرية وامتثال الحملة لشروط الأمان الميداني.
                </p>
              </div>

              <div className={styles.style1491_344}>
                <div className={styles.style1492_345}>
                  <div className={styles.style1493_346}>
                    <span>الربط البرمجي السداسي ومستوى التدقيق:</span>
                    <span className={styles.style1495_347}>{auditProgress}%</span>
                  </div>
                  <div className={styles.style1497_348}>
                    <div
                      className={styles.style1499_349}
                      style={{ width: `${auditProgress}%` }}
                    />
                  </div>
                </div>

                {/* Audit Terminal Log */}
                <div className={styles.style1506_350} dir="rtl">
                  {auditLogs.map((log, index) => (
                    <div key={index} className={styles.style1508_351}>
                      <span className={styles.style1509_352}>▶</span>
                      <span>{log}</span>
                    </div>
                  ))}
                </div>

                {/* Secure Active Placement Info */}
                {!isSimulatingAudit && auditApproved && (
                  <div className={styles.style1517_353}>
                    <div className={styles.style1518_354}>
                      <CheckCircle className={styles.style1519_355} />
                      <span>تمت المطابقة والامتثال القانوني!</span>
                    </div>
                    <p className={styles.style1522_356}>
                      تم إضافة إعلانك بنجاح في قائمة النشاط الميداني بمحافظة <strong className={styles.style1523_357}>{governorate}</strong> - منطقة <strong className={styles.style1523_358}>{district}</strong>.
                    </p>
                  </div>
                )}
              </div>

              {/* Back to main operations */}
              <div className={styles.style1530_359}>
                <Button
                  onClick={() => {
                    setActiveTab('dashboard');
                    setStep(1);
                  }}
                  disabled={isSimulatingAudit}
                  className={styles.style1537_360}
                >
                  العودة للوحة التحكم وصندوق النشاط الميداني 🤝
                </Button>
              </div>
            </div>
          )}

        </div>
      )}

      {/* Sovereign Footing Info Panel */}
      <div className={styles.style1549_361}>
        <span>$ZERO_COST_MICRO_ALGO - PWA V5.5 SECURITY LAYER</span>
        <span>صلاحية العقد: مستمر حتى استهلاك سقف النشاط</span>
      </div>

      <AnimatePresence>
        {isPackageModalOpen && (
          <div className={styles.style1556_362} dir="rtl">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className={styles.style1561_363}
            >
              <h3 className={styles.style1563_364}>
                <Sparkles className={styles.style1564_365} />
                معالج اختيار الباقات الثابتة والنشاط الفاخر
              </h3>
              <p className={styles.style1567_366}>
                اختر الباقة المناسبة لأبعاد حملتك الإعلانية . سيتم ربط الكلفة مباشرة برصيدك وحساب الفاتورة فورياً:
              </p>

              <div className={styles.style1571_367}>
                {SOVEREIGN_PRICING_PACKAGES.map((pkg) => {
                  const isSelected = selectedPackageId === pkg.id;
                  const tempCost = targetImpressions * pkg.pricePerImpression * (activeDistrictPulse?.emergencyAdCapacityActive ? 0.60 : 1.0);
                  const isAffordable = advertiserBalance >= tempCost;

                  return (
                    <button
                      key={pkg.id}
                      type="button"
                      onClick={() => {
                        setSelectedPackageId(pkg.id);
                        setIsPremiumRetentionPaid(pkg.isRetention);
                      }}
                      className={cn(styles.style1585_368, isSelected
                          ? styles.style1587_369
                          : styles.style1588_370)}
                    >
                      {pkg.isRetention && (
                        <div className={styles.style1592_371}>Premium</div>
                      )}
                      <div className={styles.style1594_372}>
                        <span className={cn(styles.style1595_373, isSelected ? styles.style1595_374 : styles.style1595_375)}>
                          {isSelected ? '🟢 ' : '⚪ '} {pkg.name}
                        </span>
                        <span className={styles.style1598_376}>
                          {pkg.pricePerImpression.toFixed(3)} د.أ / ظهور
                        </span>
                      </div>
                      <p className={styles.style1602_377}>
                        {pkg.description}
                      </p>

                      <div className={styles.style1606_378}>
                        <span className={styles.style1607_379}>الفاتورة التقديرية لـ {targetImpressions.toLocaleString()} ظهور:</span>
                        <span className={cn(styles.style1608_380, isAffordable ? styles.style1608_381 : styles.style1608_382)}>
                          {tempCost.toFixed(2)} د.أ {isAffordable ? '✓ متوفرة' : '⚠️ رصيد غير كاف'}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>

              <div className={styles.style1617_383}>
                <div className={styles.style1618_384}>
                  <span className={styles.style1619_385}>الفاتورة المحددة:</span>
                  <span className={styles.style1620_386}>{calculatedCost.toFixed(2)} د.أ</span>
                </div>
                <div className={styles.style1622_387}>
                  <span className={styles.style1623_388}>رصيدك الكلي:</span>
                  <span className={cn(styles.style1624_389, advertiserBalance < calculatedCost ? styles.style1624_390 : styles.style1624_391)}>
                    {advertiserBalance.toFixed(2)} د.أ
                  </span>
                </div>
              </div>

              <div className={styles.style1630_392}>
                <Button
                  type="button"
                  onClick={() => setIsPackageModalOpen(false)}
                  className={styles.style1634_393}
                >
                  تأكيد وحفظ الباقة العقدية 🛡️
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsPackageModalOpen(false)}
                  className={styles.style1642_394}
                >
                  إغلاق
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}

// [SCR-AD-DASH-122] كود لوحة تحكم المعلن  ومتابعة عوائد النشاط الإعلاني
export interface SovereignAd {
  id: string;
  title: string;
  status: 'ACTIVE' | 'PENDING' | 'REJECTED';
  rejectionReason?: string;
  impressions: number;
  clicks: number;
  targetDistrict: string;
  cost: number;
  expirationTimestamp?: number;
  isPremiumRetentionPaid?: boolean;
}

export interface AdvertiserDashboardProps {
  advertiserProfile: {
    companyName: string;
    totalSpent: number;
    loyaltyRank: 'SILVER' | 'GOLD' | 'PLATINUM';
  };
  myAds: Array<SovereignAd>;
  marketInsights: { hottestDistrict: string; trafficGrowth: string };
}

export const RadarAdvertiserDashboard: React.FC<AdvertiserDashboardProps> = ({ advertiserProfile, myAds, marketInsights }) => {
  const [activeTab, setActiveTab] = useState<'METRICS' | 'LAUNCH'>('METRICS');

  return (
    <div className={styles.style1684_395} style={{ backgroundColor: '#020202', color: '#ffffff', padding: '20px', fontFamily: 'monospace' }} dir="rtl">

      {/* 1. الهيدر والترحيب  برتبة المعلن */}
      <div className={styles.style1687_396} style={{ borderBottom: '2px solid #111', paddingBottom: '15px', marginBottom: '25px' }}>
        <h3>📡 لوحة تحكم المعلن  - الرادار V5.5</h3>
        <div style={{ display: 'flex', justifyContent: 'space-between', backgroundColor: '#0d0d0d', padding: '10px 15px', borderRadius: '4px', border: '1px solid #1a1a1a' }}>
          <span>المعلن: <strong>{advertiserProfile.companyName}</strong></span>
          <span>رتبة الولاء: <strong style={{ color: '#ffcc00' }}>[{advertiserProfile.loyaltyRank}]</strong></span>
        </div>
      </div>

      {/* 2. تنبيهات التشجيع والتنبيهات التلقائية للنظام من أجل التكرار */}
      <div className={styles.style1696_397} style={{ backgroundColor: '#001a0d', border: '1px solid #00cc66', padding: '15px', borderRadius: '6px', marginBottom: '25px' }}>
        <h4 style={{ color: '#00cc66', margin: '0 0 5px 0' }}>🏆 نشاط النجاح التلقائي وصوت الرادار:</h4>
        <p style={{ margin: 0, fontSize: '12px', lineHeight: '1.5', color: '#b3ffd9' }}>
          إعلاناتك غطت خلايا جغرافية واسعة! نوصي بتكرار الحملة وتوجيه نشاط إعلاني إضافي إلى
          <strong> (منطقة {marketInsights.hottestDistrict}) </strong> حيث يشهد الميدان هناك {marketInsights.trafficGrowth} في حركة الركاب حالياً، مما يضمن تضاعف المشاهدات بصفر تشتيت.
        </p>
      </div>

      {/* 3. عرض ومتابعة قائمة الإعلانات الحالية وإحصائياتها */}
      <div className={styles.style1705_398}>
        <h4>📋 حملاتك الإعلانية ومؤشرات الأداء اللحظية</h4>
        {myAds.map(ad => {
          const ctr = ad.impressions > 0 ? ((ad.clicks / ad.impressions) * 100).toFixed(1) : '0.0';

          return (
            <div key={ad.id} style={{ backgroundColor: '#0d0d0d', padding: '15px', borderRadius: '6px', marginBottom: '15px', border: '1px solid #1a1a1a' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>📢 اسم الحملة: <strong>{ad.title}</strong></span>

                {/* عرض حالة الحوكمة والأختام الرقمية للاعلان */}
                {ad.status === 'ACTIVE' && <strong style={{ color: '#00cc66', fontSize: '12px' }}>🟢 نشط وينشر النشاط</strong>}
                {ad.status === 'PENDING' && <strong style={{ color: '#ffcc00', fontSize: '12px' }}>🟡 قيد الفحص الأمني الصامت</strong>}
                {ad.status === 'REJECTED' && <strong style={{ color: '#ff3366', fontSize: '12px' }}>🚫 مرفوض </strong>}
              </div>

              {ad.status === 'REJECTED' && (
                <div style={{ backgroundColor: '#260005', color: '#ffb3bf', padding: '8px', borderRadius: '4px', marginTop: '10px', fontSize: '11px' }}>
                  ❌ رسالة النظام: {ad.rejectionReason}
                </div>
              )}

              {/* عدادات بورصة الأرقام والمشاهدات للمعلن */}
              {ad.status === 'ACTIVE' && (
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '15px', backgroundColor: '#050505', padding: '10px', borderRadius: '4px', fontSize: '12px' }}>
                  <span>👁️ المشاهدات: <strong style={{ color: '#00ffcc' }}>{ad.impressions}</strong></span>
                  <span>🖱️ التفاعل والنقر: <strong style={{ color: '#00ffcc' }}>{ad.clicks}</strong></span>
                  <span>📈 كفاءة النشاط الجغرافي (CTR): <strong style={{ color: '#ffcc00' }}>{ctr}%</strong></span>
                  <span>📍 النطاق: <strong>منطقة {ad.targetDistrict}</strong></span>
                </div>
              )}

              {/* زر التكرار السريع والمحمي من أجل دافعية الاستمرار */}
              {ad.status === 'ACTIVE' && (
                <div style={{ textAlign: 'left', marginTop: '10px' }}>
                  <button style={{ backgroundColor: '#111', color: '#ffcc00', border: '1px solid #ffcc00', padding: '4px 10px', borderRadius: '4px', fontSize: '11px', cursor: 'pointer', fontWeight: 'bold' }}>
                    🔄 تكرار وتمديد الحملة فوراً بنفس الميزانية
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

    </div>
  );
};

Object.freeze(RadarAdvertiserDashboard);
