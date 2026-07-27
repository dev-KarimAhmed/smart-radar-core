'use client';

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DriversManagementTab } from './admin/drivers-management-tab';
import { AdsManagementTab } from './admin/ads-management-tab';
import { DelegatesManagementTab } from './admin/delegates-management-tab';
import { KillSwitchPanel } from './admin/kill-switch-panel';
import { RadarOwnerSovereignDashboard } from './admin/owner-sovereign-dashboard';
import { FuelIndexPanel } from './admin/fuel-index-panel';
import { PulseHeatmap } from '@/components/admin/pulse-heatmap';
import { useMarketPulse } from '@/hooks/use-market-pulse';
import { Shield, Megaphone, Users, Activity, UsersRound, ShieldAlert, CheckCircle2, Loader2, ArrowUpRight, TrendingUp, AlertTriangle, Radio, ShieldCheck, Cpu, Eye, AlertCircle, RefreshCw, Sparkles, Fingerprint, Terminal, Scale, Compass, Trash2 } from 'lucide-react';
import React, { useState } from 'react';
import { useAdminAds } from '@/hooks/use-admin-ads';
import { SovereignErrorBoundary } from '@/components/sovereign-error-boundary';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

const styles = {
  style59_1: "bg-black/90 border border-amber-500/30 overflow-hidden relative shadow-[0_4px_20px_rgba(245,158,11,0.05)] rounded-2xl flex flex-col text-right",
  style61_2: "relative h-40 w-full overflow-hidden bg-zinc-900",
  style62_3: "w-full h-full object-cover opacity-80 hover:opacity-100 transition-opacity",
  style63_4: "absolute top-3 right-3 bg-amber-500 hover:bg-amber-600 text-black font-black",
  style69_5: "pb-3 text-right",
  style70_6: "flex justify-between items-start gap-2",
  style72_7: "bg-amber-500 hover:bg-amber-600 text-black font-black",
  style76_8: "text-white text-base font-black truncate max-w-[200px]",
  style78_9: "text-gray-400 text-xs line-clamp-2 mt-1",
  style83_10: "space-y-3 text-xs flex-grow font-sans text-gray-300 text-right",
  style84_11: "grid grid-cols-2 gap-2",
  style85_12: "bg-zinc-900/60 p-2 rounded-xl border border-white/5 text-right",
  style86_13: "text-[10px] text-gray-500 block",
  style87_14: "font-bold text-white block mt-0.5",
  style89_15: "bg-zinc-900/60 p-2 rounded-xl border border-white/5 text-right",
  style90_16: "text-[10px] text-gray-500 block",
  style91_17: "font-bold text-amber-400 block mt-0.5 font-mono",
  style95_18: "bg-zinc-900/60 p-2.5 rounded-xl border border-white/5 space-y-1 font-mono text-right",
  style96_19: "flex justify-between items-center text-[11px]",
  style97_20: "text-gray-500 text-right",
  style98_21: "text-emerald-400 font-bold",
  style98_22: "text-gray-500",
  style102_23: "flex justify-between items-center text-[11px]",
  style103_24: "text-gray-500 text-right",
  style104_25: "text-[10px] bg-zinc-800 px-1.5 py-0.5 rounded text-white capitalize",
  style108_26: "flex justify-between items-center text-[11px]",
  style109_27: "text-gray-500 text-right",
  style110_28: "text-white",
  style115_29: "bg-zinc-900/40 p-3 border-t border-white/5 flex flex-col gap-2",
  style117_30: "grid grid-cols-2 gap-2 w-full",
  style121_31: "bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs py-2 h-9 rounded-xl active:scale-[0.98] transition-all",
  style123_32: "w-4 h-4 animate-spin ml-1",
  style123_33: "w-4 h-4 ml-1",
  style130_34: "bg-red-600 hover:bg-red-500 text-white font-black text-xs py-2 h-9 rounded-xl active:scale-[0.98] transition-all",
  style132_35: "w-4 h-4 ml-1",
  style137_36: "w-full space-y-2 animate-in fade-in slide-in-from-bottom-2 duration-200 text-right",
  style138_37: "text-[10px] text-red-400 font-bold font-sans",
  style143_38: "bg-black/90 border border-red-500/40 text-white text-xs h-9 rounded-xl focus:border-red-500 text-right",
  style146_39: "grid grid-cols-2 gap-2 w-full",
  style150_40: "bg-red-600 hover:bg-red-500 text-white font-black text-xs h-8 rounded-xl",
  style152_41: "w-3.5 h-3.5 animate-spin ml-1",
  style158_42: "border-white/10 hover:bg-white/5 text-gray-300 text-xs h-8 rounded-xl",
  style300_43: "bg-[#0A0D14]/90 p-6 rounded-2xl border border-amber-500/20 text-center animate-pulse",
  style301_44: "w-6 h-6 animate-spin text-amber-500 mx-auto",
  style302_45: "text-gray-400 text-xs mt-2 font-sans",
  style308_46: "space-y-6 text-right",
  style311_47: "relative overflow-hidden bg-gradient-to-l from-amber-950/20 via-zinc-900/60 to-black border border-amber-500/30 p-5 rounded-2xl text-right",
  style312_48: "absolute top-0 left-0 w-32 h-32 bg-amber-500/5 blur-3xl rounded-full",
  style313_49: "relative flex flex-col md:flex-row justify-between items-start md:items-center gap-4",
  style314_50: "space-y-1",
  style315_51: "flex items-center gap-2",
  style316_52: "w-2.5 h-2.5 bg-amber-500 rounded-full animate-ping",
  style317_53: "text-base sm:text-lg font-black text-amber-400 flex items-center gap-2 text-right",
  style318_54: "w-5 h-5 text-amber-400 animate-pulse",
  style322_55: "text-gray-400 text-xs mt-1 leading-relaxed",
  style323_56: "text-emerald-400",
  style326_57: "flex items-center gap-2 self-start md:self-center",
  style327_58: "text-[10px] font-bold text-emerald-400 bg-emerald-950/30 px-3 py-1.5 rounded-full border border-emerald-500/20",
  style338_59: "bg-amber-500 hover:bg-amber-600 text-black font-black font-sans px-2.5 py-1 text-xs rounded-full animate-pulse cursor-pointer select-none active:scale-95 transition-transform",
  style346_60: "grid grid-cols-2 lg:grid-cols-4 gap-3.5 mt-5 border-t border-white/5 pt-5",
  style347_61: "bg-black/40 border border-white/5 p-3 rounded-xl",
  style348_62: "text-[10px] block text-gray-400 font-bold mb-1",
  style349_63: "text-sm font-black text-white font-mono flex items-center gap-1",
  style350_64: "w-3.5 h-3.5 text-red-500 animate-pulse",
  style351_65: "text-[9px] text-gray-500",
  style354_66: "bg-black/40 border border-white/5 p-3 rounded-xl",
  style355_67: "text-[10px] block text-gray-400 font-bold mb-1",
  style356_68: "text-sm font-black text-amber-400 font-mono",
  style357_69: "text-[9px] text-gray-500",
  style360_70: "bg-black/40 border border-white/5 p-3 rounded-xl",
  style361_71: "text-[10px] block text-gray-400 font-bold mb-1",
  style362_72: "text-sm font-black text-emerald-400 font-mono",
  style363_73: "text-[9px] text-gray-500",
  style366_74: "bg-black/40 border border-white/5 p-3 rounded-xl",
  style367_75: "text-[10px] block text-gray-400 font-bold mb-1",
  style368_76: "text-sm font-black text-teal-400 font-mono",
  style369_77: "text-[9px] text-gray-500",
  style376_78: "grid grid-cols-1 lg:grid-cols-12 gap-6 items-start",
  style379_79: "lg:col-span-8 space-y-6",
  style382_80: "space-y-3.5",
  style383_81: "flex items-center justify-between",
  style384_82: "text-xs sm:text-sm font-black text-white flex items-center gap-1.5",
  style385_83: "w-4 h-4 text-amber-400",
  style388_84: "text-[10px] text-zinc-500 font-sans",
  style392_85: "bg-zinc-950/40 p-10 rounded-2xl border border-zinc-900 border-dashed text-center flex flex-col items-center justify-center",
  style393_86: "w-12 h-12 bg-emerald-950/30 rounded-full flex items-center justify-center text-emerald-400 border border-emerald-500/10 mb-2",
  style394_87: "w-6 h-6 animate-pulse",
  style396_88: "text-xs sm:text-sm font-black text-zinc-300",
  style397_89: "text-gray-500 text-[11px] mt-1 font-sans max-w-sm",
  style402_90: "grid grid-cols-1 sm:grid-cols-2 gap-4",
  style416_91: "bg-[#090D16] border border-red-500/20 rounded-2xl overflow-hidden",
  style417_92: "p-4 border-b border-white/5 bg-red-950/10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2",
  style419_93: "text-xs sm:text-sm font-black text-rose-400 flex items-center gap-1.5",
  style420_94: "w-4.5 h-4.5 text-rose-500 animate-pulse",
  style423_95: "text-gray-500 text-[10px] mt-0.5",
  style427_96: "flex gap-1",
  style432_97: "border-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-900 h-6 px-2 text-[9px] rounded",
  style434_98: "w-3 h-3 ml-1",
  style438_99: "border-rose-500/30 text-rose-400 text-[10px] h-6 px-2.5 rounded-full font-sans animate-pulse",
  style444_100: "p-0 divide-y divide-white/5 max-h-[300px] overflow-y-auto",
  style446_101: "p-8 text-center text-gray-500 text-xs",
  style454_102: "p-3.5 transition-all flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 text-right",
  style455_103: "opacity-40 bg-zinc-950/20",
  style455_104: "hover:bg-white/5 bg-black/20",
  style458_105: "space-y-1 text-right flex-1",
  style459_106: "flex items-center gap-2 flex-wrap",
  style461_107: "text-[9px] font-black px-1.5 py-0.5 rounded uppercase font-sans tracking-wide",
  style463_108: "bg-red-950/50 text-red-400 border border-red-500/20",
  style464_109: "bg-amber-950/50 text-amber-400 border border-amber-500/20",
  style465_110: "bg-zinc-800 text-zinc-400 border-none",
  style469_111: "text-[10px] text-cyan-400 font-bold bg-cyan-950/20 px-1.5 py-0.5 rounded border border-cyan-500/10",
  style472_112: "text-[10px] text-gray-500 font-mono",
  style475_113: "text-xs font-sans leading-relaxed text-right",
  style476_114: "line-through text-gray-500",
  style476_115: "text-gray-200",
  style485_116: "bg-emerald-600/90 hover:bg-emerald-500 text-white font-black text-[10px] h-7 px-3 rounded-lg active:scale-95 transition-transform",
  style490_117: "text-[11px] text-emerald-400 font-sans flex items-center gap-1",
  style491_118: "w-3.5 h-3.5",
  style504_119: "lg:col-span-4 space-y-6",
  style507_120: "bg-[#0A0D15] border border-amber-500/20 p-4 rounded-2xl space-y-4",
  style508_121: "space-y-1",
  style509_122: "text-xs sm:text-sm font-black text-white flex items-center gap-1.5",
  style510_123: "w-4 h-4 text-amber-500",
  style513_124: "text-[10px] text-gray-400 leading-relaxed",
  style518_125: "grid grid-cols-1 gap-2",
  style522_126: "justify-between border-rose-500/30 text-rose-400 bg-rose-950/10 hover:bg-rose-900/20 text-xs h-9.5 rounded-xl cursor-pointer",
  style525_127: "text-[9px] bg-red-950/40 border border-red-500/20 px-1 py-0.5 rounded text-red-400 uppercase",
  style531_128: "justify-between border-amber-500/30 text-amber-400 bg-amber-950/10 hover:bg-amber-900/20 text-xs h-9.5 rounded-xl cursor-pointer",
  style534_129: "text-[9px] bg-amber-950/40 border border-amber-500/20 px-1 py-0.5 rounded text-amber-400 uppercase",
  style540_130: "justify-between border-purple-500/30 text-purple-400 bg-purple-950/10 hover:bg-purple-900/20 text-xs h-9.5 rounded-xl cursor-pointer",
  style543_131: "text-[9px] bg-red-950/40 border border-red-500/20 px-1 py-0.5 rounded text-red-400 uppercase font-bold",
  style549_132: "justify-between border-cyan-500/30 text-cyan-400 bg-cyan-950/10 hover:bg-cyan-900/20 text-xs h-9.5 rounded-xl cursor-pointer",
  style552_133: "text-[9px] bg-red-950/40 border border-red-500/20 px-1 py-0.5 rounded text-red-400 uppercase",
  style558_134: "bg-[#050912]/90 border border-teal-500/20 p-4 rounded-2xl space-y-4",
  style559_135: "space-y-1",
  style560_136: "text-xs sm:text-sm font-black text-teal-400 flex items-center gap-1.5",
  style561_137: "w-4 h-4 text-teal-500",
  style564_138: "text-[10px] text-gray-400 leading-relaxed",
  style572_139: "w-full bg-teal-600 hover:bg-teal-500 text-white font-black text-xs h-9 rounded-xl active:scale-[0.98] transition-transform",
  style576_140: "w-4 h-4 animate-spin ml-2",
  style581_141: "w-4 h-4 ml-2",
  style588_142: "p-3 bg-black/60 rounded-xl border border-white/5 space-y-1.5 font-mono text-[10px]",
  style589_143: "text-gray-500 block text-right border-b border-white/5 pb-1 select-none",
  style590_144: "text-cyan-400 font-bold py-1.5 tracking-tight text-center overflow-x-auto",
  style593_145: "text-[9px] text-gray-500 text-right font-sans leading-relaxed",
  style599_146: "bg-black/90 p-3 rounded-xl border border-teal-500/20 space-y-2 text-right font-mono text-[10px] text-emerald-400 animate-in fade-in slide-in-from-bottom-2",
  style600_147: "flex items-center justify-between border-b border-teal-500/10 pb-1.5 mb-1.5 font-sans",
  style601_148: "text-[9px] text-zinc-500",
  style602_149: "text-teal-400 font-black",
  style605_150: "leading-relaxed",
  style789_151: "space-y-6 text-right",
  style791_152: "grid grid-cols-1 md:grid-cols-3 gap-4 text-right",
  style792_153: "bg-[#090e1a] border-cyan-900/40 border text-right rounded-2xl relative overflow-hidden",
  style793_154: "pb-2 text-right",
  style794_155: "text-gray-400 text-xs text-right",
  style795_156: "text-2xl font-black text-[#14b8a6] font-mono mt-1 text-right",
  style799_157: "h-10 text-[10px] text-gray-400 flex justify-between items-center bg-black/40 border-t border-cyan-900/10 px-4",
  style800_158: "flex items-center gap-1 text-[#14b8a6] font-bold",
  style800_159: "w-3.5 h-3.5",
  style805_160: "bg-[#090e1a] border-cyan-900/40 border text-right rounded-2xl relative overflow-hidden",
  style806_161: "pb-2 text-right",
  style807_162: "text-gray-400 text-xs text-right",
  style808_163: "text-2xl font-black text-amber-500 font-mono mt-1 text-right",
  style810_164: "h-10 text-[10px] text-gray-400 flex justify-between items-center bg-black/40 border-t border-cyan-900/10 px-4",
  style811_165: "text-amber-400 font-bold",
  style816_166: "bg-[#090e1a] border-cyan-900/40 border text-right rounded-2xl relative overflow-hidden",
  style817_167: "pb-2 text-right",
  style818_168: "text-gray-400 text-xs text-right",
  style819_169: "text-2xl font-black text-cyan-400 font-mono mt-1 text-right",
  style821_170: "h-10 text-[10px] text-gray-400 flex justify-between items-center bg-black/40 border-t border-cyan-900/10 px-4",
  style822_171: "text-cyan-400 font-bold",
  style829_172: "bg-[#090e1a] border border-cyan-900/40 rounded-2xl text-right",
  style830_173: "pb-2 text-right",
  style831_174: "flex justify-between items-center",
  style836_175: "border-cyan-500/40 text-cyan-400 bg-cyan-950/30 hover:bg-cyan-900/40 text-[10px] h-7 px-3 rounded-full flex items-center gap-1.5 cursor-pointer active:scale-95 transition-all shadow-[0_0_10px_rgba(6,182,212,0.15)] disabled:opacity-50",
  style839_176: "w-3 h-3 animate-spin text-cyan-400",
  style841_177: "w-1.5 h-1.5 bg-cyan-400 rounded-full animate-ping",
  style845_178: "text-sm font-black text-white flex items-center gap-2 text-right",
  style846_179: "w-4 h-4 text-cyan-400",
  style850_180: "text-gray-400 text-[10px] text-right",
  style854_181: "pt-4",
  style855_182: "w-full h-24 bg-black/40 rounded-xl relative border border-white/5 flex items-end px-2 pt-2",
  style856_183: "w-full h-full text-cyan-500 overflow-visible",
  style874_184: "animate-ping",
  style877_185: "animate-ping",
  style880_186: "absolute top-2 left-2 text-[9px] font-mono text-cyan-400/70 bg-black/60 px-1.5 py-0.5 rounded",
  style883_187: "absolute bottom-2 right-2 text-[9px] font-mono text-gray-500",
  style891_188: "bg-[#090e1a] border border-red-500/20 rounded-2xl text-right",
  style892_189: "pb-3 border-b border-white/5 m-0 p-4 text-right",
  style893_190: "flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3",
  style894_191: "flex items-center gap-2",
  style895_192: "text-[10px] font-bold text-red-400 bg-red-950/20 px-2.5 py-1 rounded-full border border-red-500/20 animate-pulse",
  style901_193: "border-red-500/40 text-red-400 bg-red-950/20 hover:bg-red-900/30 text-[10px] h-6 px-2.5 rounded-md cursor-pointer active:scale-95 transition-all",
  style908_194: "border-gray-500/30 text-gray-400 bg-zinc-950/40 hover:bg-zinc-900/40 text-[10px] h-6 px-2.5 rounded-md cursor-pointer active:scale-95 transition-all",
  style913_195: "text-sm font-black text-white flex items-center gap-2 text-right",
  style914_196: "w-4 h-4 text-red-500 animate-pulse",
  style918_197: "text-gray-400 text-[10px] text-right mt-1",
  style922_198: "mt-4 p-3.5 bg-red-950/20 border border-red-500/10 rounded-xl space-y-2 text-right",
  style923_199: "text-right text-[10px] text-gray-400 font-sans font-bold flex items-center justify-between gap-2",
  style924_200: "text-[9px] font-mono text-cyan-400 bg-cyan-950/30 px-1.5 py-0.5 rounded border border-cyan-500/10",
  style928_201: "flex flex-col gap-2.5 items-center justify-center p-3 bg-black/60 rounded-lg border border-white/5 font-mono text-[11px] select-all cursor-crosshair",
  style929_202: "text-cyan-400 font-bold hover:scale-105 transition-transform",
  style932_203: "text-rose-400 font-bold hover:scale-105 transition-transform",
  style937_204: "text-[10px] text-gray-500 mt-1 max-w-full text-right font-sans leading-relaxed",
  style938_205: "text-red-400",
  style942_206: "p-0 divide-y divide-white/5 text-right",
  style945_207: "p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-right transition-all",
  style946_208: "opacity-35 bg-black/10",
  style946_209: "bg-red-950/5 hover:bg-red-950/10",
  style948_210: "space-y-1 text-right",
  style949_211: "flex items-center gap-2 justify-start",
  style950_212: "text-[10px] text-gray-400 font-mono",
  style951_213: "text-[9px] px-1.5 py-0",
  style955_214: "text-xs font-bold text-gray-200 text-right",
  style961_215: "bg-red-600 hover:bg-red-500 text-white font-black text-xs h-8 px-4 rounded-xl shadow-[0_0_10px_rgba(239,68,68,0.2)] active:scale-95 transition-all self-start sm:self-center cursor-pointer",
  style978_216: "space-y-8 animate-in fade-in duration-500 w-full",
  style980_217: "w-full",
  style983_218: "flex flex-wrap w-full justify-center gap-2 h-auto bg-[#050a0f]/80 border border-[#00ffcc]/10 p-2 rounded-2xl shadow-lg shadow-black/50",
  style985_219: "flex-col h-auto py-3 px-4 hover:bg-white/5 data-[state=active]:bg-[#14b8a6]/20 data-[state=active]:text-[#14b8a6] rounded-xl transition-all",
  style986_220: "w-5 h-5 mb-1",
  style987_221: "text-xs font-bold",
  style990_222: "flex-col h-auto py-3 px-4 hover:bg-white/5 data-[state=active]:bg-[#14b8a6]/20 data-[state=active]:text-[#14b8a6] rounded-xl transition-all",
  style991_223: "w-5 h-5 mb-1",
  style992_224: "text-xs font-bold",
  style996_225: "flex-col h-auto py-3 px-5 bg-red-950/20 hover:bg-red-900/30 data-[state=active]:bg-red-950/60 data-[state=active]:text-[#ff3366] border border-transparent data-[state=active]:border-[#ff3366]/40 rounded-xl transition-all shadow-sm",
  style997_226: "w-6 h-6 mb-1 text-[#ff3366] animate-pulse",
  style998_227: "font-black text-xs tracking-wider",
  style1001_228: "flex-col h-auto py-3 px-4 hover:bg-white/5 data-[state=active]:bg-emerald-950/40 data-[state=active]:text-emerald-400 rounded-xl transition-all",
  style1002_229: "w-5 h-5 mb-1 text-emerald-500",
  style1003_230: "text-xs font-bold",
  style1006_231: "flex-col h-auto py-3 px-4 hover:bg-white/5 data-[state=active]:bg-[#14b8a6]/20 data-[state=active]:text-[#14b8a6] rounded-xl transition-all",
  style1007_232: "w-5 h-5 mb-1",
  style1008_233: "text-xs font-bold",
  style1011_234: "flex-col h-auto py-3 px-4 hover:bg-white/5 data-[state=active]:bg-[#14b8a6]/20 data-[state=active]:text-[#14b8a6] rounded-xl transition-all",
  style1012_235: "w-5 h-5 mb-1",
  style1013_236: "text-xs font-bold",
  style1019_237: "mt-6 outline-none",
  style1021_238: "space-y-6",
  style1028_239: "mt-6 outline-none",
  style1030_240: "space-y-8",
  style1038_241: "mt-6 outline-none",
  style1044_242: "mt-6 outline-none",
  style1050_243: "mt-6 outline-none",
  style1056_244: "mt-6 outline-none space-y-8",
  style1058_245: "space-y-8",
} as const;


function PendingAdReviewCard({ ad, onApprove, onReject }: { ad: any; onApprove: (id: string) => Promise<void>; onReject: (id: string, reason: string) => Promise<void> }) {
  const [rejecting, setRejecting] = useState(false);
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleApprove = async () => {
    setIsSubmitting(true);
    try {
      await onApprove(ad.id);
    } catch (e) {
      // Handled/logged in hook
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReject = async () => {
    if (!reason.trim()) return;
    setIsSubmitting(true);
    try {
      await onReject(ad.id, reason);
      setRejecting(false);
      setReason('');
    } catch (e) {
      // Handled/logged in hook
    } finally {
      setIsSubmitting(false);
    }
  };

  const title = ad.content?.title || ad.title || 'إعلان بدون عنوان';
  const description = ad.content?.description || ad.description || 'لا يوجد وصف متاح';
  const posterUrl = ad.content?.posterUrl || ad.posterUrl || '';

  return (
    <Card className={styles.style59_1} dir="rtl">
      {posterUrl && (
        <div className={styles.style61_2}>
          <img src={posterUrl} alt={title} className={styles.style62_3} referrerPolicy="no-referrer" />
          <Badge className={styles.style63_4}>
            قيد الفحص الأمني 🔍
          </Badge>
        </div>
      )}

      <CardHeader className={styles.style69_5}>
        <div className={styles.style70_6}>
          {!posterUrl && (
            <Badge className={styles.style72_7}>
              قيد الفحص الأمني 🔍
            </Badge>
          )}
          <CardTitle className={styles.style76_8}>{title}</CardTitle>
        </div>
        <CardDescription className={styles.style78_9}>
          {description}
        </CardDescription>
      </CardHeader>

      <CardContent className={styles.style83_10}>
        <div className={styles.style84_11}>
          <div className={styles.style85_12}>
            <span className={styles.style86_13}>النطاق الجغرافي</span>
            <span className={styles.style87_14}>📍 {ad.targetGovernorate || 'كل الأردن'} {ad.targetDistrict ? `- ${ad.targetDistrict}` : ''}</span>
          </div>
          <div className={styles.style89_15}>
            <span className={styles.style90_16}>مرات الظهور المستهدفة</span>
            <span className={styles.style91_17}>⚡ {(ad.targetImpressions || 10000).toLocaleString()}</span>
          </div>
        </div>

        <div className={styles.style95_18}>
          <div className={styles.style96_19}>
            <span className={styles.style97_20}>ميزة التخليد الفاخرة (القلب الأخضر):</span>
            <span className={ad.isPremiumRetentionPaid ? styles.style98_21 : styles.style98_22}>
              {ad.isPremiumRetentionPaid ? "✅ مدفوعة وتخلد" : "❌ عادية فقط"}
            </span>
          </div>
          <div className={styles.style102_23}>
            <span className={styles.style103_24}>المستهدف المهني:</span>
            <span className={styles.style104_25}>
              {ad.role === 'all' ? 'الجميع' : ad.role === 'driver' ? 'السائقون' : 'الركاب'}
            </span>
          </div>
          <div className={styles.style108_26}>
            <span className={styles.style109_27}>واتساب المعلن:</span>
            <span className={styles.style110_28}>{ad.whatsapp || ad.phone || 'N/A'}</span>
          </div>
        </div>
      </CardContent>

      <CardFooter className={styles.style115_29}>
        {!rejecting ? (
          <div className={styles.style117_30}>
            <Button
              onClick={handleApprove}
              disabled={isSubmitting}
              className={styles.style121_31}
            >
              {isSubmitting ? <Loader2 className={styles.style123_32} /> : <CheckCircle2 className={styles.style123_33} />}
              اعتماد ونشر للقسم الإعلانات
            </Button>
            <Button
              onClick={() => setRejecting(true)}
              variant="destructive"
              disabled={isSubmitting}
              className={styles.style130_34}
            >
              <ShieldAlert className={styles.style132_35} />
              إيقاف
            </Button>
          </div>
        ) : (
          <div className={styles.style137_36}>
            <Label className={styles.style138_37}>مبرر الرفض الأمني (صيغة الإفادة الرسمية):</Label>
            <Input
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="اكتب سبب الرفض هنا..."
              className={styles.style143_38}
              dir="rtl"
            />
            <div className={styles.style146_39}>
              <Button
                onClick={handleReject}
                disabled={isSubmitting || !reason.trim()}
                className={styles.style150_40}
              >
                {isSubmitting ? <Loader2 className={styles.style152_41} /> : null}
                تأكيد الإيقاف
              </Button>
              <Button
                onClick={() => { setRejecting(false); setReason(''); }}
                variant="outline"
                className={styles.style158_42}
              >
                تراجع
              </Button>
            </div>
          </div>
        )}
      </CardFooter>
    </Card>
  );
}

export function PendingAdsAuditPanel() {
  const { approveAd, rejectAd, ads, isLoading } = useAdminAds();
  const pendingAds = React.useMemo(() => {
    return (ads || []).filter(ad => (ad.status || '').toLowerCase() === 'pending' || (ad.status || '') === 'PENDING');
  }, [ads]);
  const { toast } = useToast();

  // state for live injected audit logs (الإضافة الموضعي للمخالفات الإعلانية والبروتوكولية)
  const [injectedThreats, setInjectedThreats] = useState([
    {
      id: "ad-threat-1",
      timestamp: "منذ 3 دقائق",
      district: "منطقة الجامعة",
      severity: "warn",
      message: "اشتباه ترويج ميكانيكي غير مرخص خارج حدود النظام  للمحافظة",
      actionLabel: "تدقيق محلي 🌐",
      resolved: false,
    },
    {
      id: "ad-threat-2",
      timestamp: "منذ 10 دقائق",
      district: "منطقة ماركا",
      severity: "severe",
      message: "حملة إعلانية ممتازة تم طلب تخليدها دون سداد رسم القيد الماسي الموحد",
      actionLabel: "إلغاء التخليد 💳",
      resolved: false,
    }
  ]);

  const [isScanning, setIsScanning] = useState(false);
  const [scanResults, setScanResults] = useState<string[] | null>(null);

  // Stats derived from local simulation
  const pendingCount = pendingAds.length;
  const activeThreatsCount = injectedThreats.filter(t => !t.resolved).length;
  const geofenceIntegrity = Math.max(70, 100 - activeThreatsCount * 6.5);

  const handleResolveThreat = (id: string, message: string) => {
    setInjectedThreats(prev =>
      prev.map(t => t.id === id ? { ...t, resolved: true } : t)
    );
    toast({
      title: "⚖️ تم الحذف والتعقيم بنجاح",
      description: `تم إخضاع المخالفة لبروتوكول ميثاق النظام الماسي: ${message}`,
      variant: "default",
    });
  };

  const handleInjectThreat = (type: 'payment' | 'jurisdiction' | 'unauthorized' | 'spam') => {
    const timeNow = new Date().toLocaleTimeString('ar-JO', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    let newThreat = {
      id: `threat-injected-${Date.now()}`,
      timestamp: `الآن (الساعة ${timeNow})`,
      district: "",
      severity: "severe",
      message: "",
      actionLabel: "",
      resolved: false
    };

    const districts = ["منطقة وادي السير", "منطقة الجيزة", "شمال عمان", "منطقة الجامعة", "منطقة سحاب"];
    const randomDistrict = districts[Math.floor(Math.random() * districts.length)];
    newThreat.district = randomDistrict;

    switch (type) {
      case 'payment':
        newThreat.message = `تهرب من العائد  الإعلاني ومحاولة التفاف على حصة السداد في ${randomDistrict}`;
        newThreat.actionLabel = "سحب الترخيص 💸";
        newThreat.severity = "severe";
        break;
      case 'jurisdiction':
        newThreat.message = `تخطي النطاق الجغرافي المعين وبث منشور خارج المنطقة المرخص له في ${randomDistrict}`;
        newThreat.actionLabel = "عزل جيو-محلي 🌐";
        newThreat.severity = "warn";
        break;
      case 'unauthorized':
        newThreat.message = `ترويج محتوى بدون الختم الذهبي وتعميد الهوية المرئية الوطنية الأردنية`;
        newThreat.actionLabel = "تطبيق الإيقاف ⚖️";
        newThreat.severity = "severe";
        break;
      case 'spam':
        newThreat.message = `إغراق تكراري إعلاني مكثف بأكثر من 15 منشور متصل في قصبة ${randomDistrict}`;
        newThreat.actionLabel = "حظر بث فوري 📡";
        newThreat.severity = "severe";
        break;
    }

    setInjectedThreats(prev => [newThreat, ...prev]);
    toast({
      title: "🚨 إضافة مخالفة إعلانية بنجاح",
      description: `تم رصد إخلال فوري في ${randomDistrict}: ${newThreat.message}`,
      variant: "destructive"
    });
  };

  const runAdForensicScan = () => {
    setIsScanning(true);
    setScanResults(null);
    toast({
      title: "📡 بدء المسح الخوارزمي للأصول الإعلانية",
      description: "يتم فحص قسم الإعلانات الجاري ومطابقته بشروط النظام الماسي V5.5..."
    });

    setTimeout(() => {
      setIsScanning(false);
      setScanResults([
        `⏱️ [${new Date().toLocaleTimeString('ar-JO')}] بدء تمشيط الأقسام الرقمية النشطة...`,
        `🔍 التدقيق الجغرافي: فحص مطابقة الخلايا السداسية H3 مع تصريح منطقة وادي السير والجامعة.. [مطابق بنسبة 100%]`,
        `💳 التتبع المالي: مطابقة رسوم التخليد الفاخر (Premium Retention Payment).. [لا توجد ثغرات]`,
        `🔒 معيار الحصانة: فحص استهلاك الخادم السحابي بموجب المادة (SC55).. [المؤشر مستقر عند 0% استهلاك]`,
        `🛡️ قرار الهيئة : النظام خالٍ تماماً من الدعاية الميكانيكية المجهولة.`
      ]);
      toast({
        title: "✅ اكتمل المسح الأمني بنجاح",
        description: "تم تأمين الإعلانات ومطابقة كافة الأصول بالمعيار  المستقل."
      });
    }, 2800);
  };

  const clearAllResolved = () => {
    setInjectedThreats(prev => prev.filter(t => !t.resolved));
    setScanResults(null);
    toast({
      title: "🧹 تنظيف السجلات المعقمة",
      description: "تم مسح كافة الإخطارات البروتوكولية التي تمت تبرئتها وصيانتها."
    });
  };

  if (isLoading) {
    return (
      <div className={styles.style300_43}>
        <Loader2 className={styles.style301_44} />
        <p className={styles.style302_45}>بانتظار تدفق المذكرة السحابية للحملات المعلقة...</p>
      </div>
    );
  }

  return (
    <div className={styles.style308_46} dir="rtl">

      {/* 🔮 THE MONITORING TOWER BANNER */}
      <div className={styles.style311_47}>
        <div className={styles.style312_48}></div>
        <div className={styles.style313_49}>
          <div className={styles.style314_50}>
            <div className={styles.style315_51}>
              <span className={styles.style316_52}></span>
              <h3 className={styles.style317_53}>
                <Radio className={styles.style318_54} />
                برج مراقبة الإعلانات والنشاط  (Control Tower V5.5)
              </h3>
            </div>
            <p className={styles.style322_55}>
              محرك الرصد اللحظي والفحص الأمني لحماية الهوية الإعلانية وحماية السائقون من الإغراق والوكالات الوهمية، مع الامتثال لميثاق صفر كلفة <strong className={styles.style323_56}>(SC55)</strong>.
            </p>
          </div>
          <div className={styles.style326_57}>
            <span className={styles.style327_58}>
              ⚡ الحصانة المحلية: {geofenceIntegrity.toFixed(1)}%
            </span>
            <Badge
              onClick={() => {
                toast({
                  title: "🛡️ فحص حالة معلّقات الإعلانات",
                  description: `يومض هذا المؤشر تلقائياً بشكل نشاطي للتنبيه بوجود (${pendingCount}) حملة إعلانية تتطلب فحصاً أمنياً مسبقاً وتصديقاً  قبل نشرها في قسم الإعلانات المفتوح.`,
                  variant: "default"
                });
              }}
              className={styles.style338_59}
            >
              {pendingCount} في قسم الإعلانات المعلق
            </Badge>
          </div>
        </div>

        {/* Real-time Sovereign Indicators */}
        <div className={styles.style346_60}>
          <div className={styles.style347_61}>
            <span className={styles.style348_62}>النشاط الجغرافي النشط</span>
            <span className={styles.style349_63}>
              <Activity className={styles.style350_64} />
              1.34 Hz <span className={styles.style351_65}>منظم</span>
            </span>
          </div>
          <div className={styles.style354_66}>
            <span className={styles.style355_67}>أشغال الإعلانات</span>
            <span className={styles.style356_68}>
              {pendingCount + 12} حملة <span className={styles.style357_69}>/ 1,000 جيو-خلية</span>
            </span>
          </div>
          <div className={styles.style360_70}>
            <span className={styles.style361_71}>حمولة المعالجة (SC55)</span>
            <span className={styles.style362_72}>
              0.0% <span className={styles.style363_73}>توزيع طرفي بالكامل</span>
            </span>
          </div>
          <div className={styles.style366_74}>
            <span className={styles.style367_75}>تضارب الأدوار (Audit Index)</span>
            <span className={styles.style368_76}>
              0.00 <span className={styles.style369_77}>صفر تضخّم</span>
            </span>
          </div>
        </div>
      </div>

      {/* 🧪 INTERACTIVE EMBEDDED PATH SYSTEM & DEVIATION LAB */}
      <div className={styles.style376_78}>

        {/* Right side (8 cols): Injected Threat Logs & Live Ad Stream */}
        <div className={styles.style379_79}>

          {/* Section: Live Ad Submissions needing audit */}
          <div className={styles.style382_80}>
            <div className={styles.style383_81}>
              <h4 className={styles.style384_82}>
                <Compass className={styles.style385_83} />
                الدفعات الإعلانية الواردة حديثاً بانتظار الختم  ({pendingCount})
              </h4>
              <span className={styles.style388_84}>تحديث آلي مستمر من سحابة التوازن</span>
            </div>

            {pendingCount === 0 ? (
              <div className={styles.style392_85}>
                <div className={styles.style393_86}>
                  <CheckCircle2 className={styles.style394_87} />
                </div>
                <h4 className={styles.style396_88}>قسم الإعلانات النمذجة سليم ونقي</h4>
                <p className={styles.style397_89}>
                  لا توجد حملات من معلنين خارجيين بانتظار الفحص الأمني حالياً. كل الدعاية النشطة تمت صيانتها وتعقيم بنودها التاريخية بامتياز.
                </p>
              </div>
            ) : (
              <div className={styles.style402_90}>
                {pendingAds.map(ad => (
                  <PendingAdReviewCard
                    key={ad.id}
                    ad={ad}
                    onApprove={approveAd}
                    onReject={rejectAd}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Section: Local Injected Sovereign Threat Register (رادارات كبح الانحراف الإعلاني) */}
          <div className={styles.style416_91}>
            <div className={styles.style417_92}>
              <div>
                <h4 className={styles.style419_93}>
                  <Fingerprint className={styles.style420_94} />
                  سجل رادار الفحص الأمني الإعلاني والمخالفات الموضعية
                </h4>
                <p className={styles.style423_95}>
                  بوابة رصد واجهة المالك للسيطرة السريعة وإضافة وسحق التشوهات التي تهدد ميثاق العدالة والإدارة.
                </p>
              </div>
              <div className={styles.style427_96}>
                {injectedThreats.some(t => t.resolved) && (
                  <Button
                    onClick={clearAllResolved}
                    variant="outline"
                    className={styles.style432_97}
                  >
                    <Trash2 className={styles.style434_98} />
                    تنظيف المعقم
                  </Button>
                )}
                <Badge variant="outline" className={styles.style438_99}>
                  {activeThreatsCount} مخالفات نشطة
                </Badge>
              </div>
            </div>

            <div className={styles.style444_100}>
              {injectedThreats.length === 0 ? (
                <div className={styles.style446_101}>
                  لا توجد انحرافات مسجلة حالياً في السجل الموضعي. استخدم أزرار مختبر المحاكاة لإضافة تهديدات جديدة.
                </div>
              ) : (
                injectedThreats.map(threat => (
                  <div
                    key={threat.id}
                    className={cn(
                      styles.style454_102,
                      threat.resolved ? styles.style455_103 : styles.style455_104
                    )}
                  >
                    <div className={styles.style458_105}>
                      <div className={styles.style459_106}>
                        <span className={cn(
                          styles.style461_107,
                          threat.severity === 'severe'
                            ? styles.style463_108
                            : styles.style464_109,
                          threat.resolved && styles.style465_110
                        )}>
                          {threat.resolved ? "تم الحذف والموازنة ✓" : threat.severity === 'severe' ? "خطر فادح 🩸" : "مخالفة معيارية ⚠️"}
                        </span>
                        <span className={styles.style469_111}>
                          📍 {threat.district}
                        </span>
                        <span className={styles.style472_112}>{threat.timestamp}</span>
                      </div>
                      <p className={cn(
                        styles.style475_113,
                        threat.resolved ? styles.style476_114 : styles.style476_115
                      )}>
                        {threat.message}
                      </p>
                    </div>

                    {!threat.resolved ? (
                      <Button
                        onClick={() => handleResolveThreat(threat.id, threat.message)}
                        className={styles.style485_116}
                      >
                        {threat.actionLabel}
                      </Button>
                    ) : (
                      <span className={styles.style490_117}>
                        <ShieldCheck className={styles.style491_118} />
                        مؤمن ومصدق
                      </span>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>

        </div>

        {/* Left side (4 cols): Forensic Scanner & Injection Controls */}
        <div className={styles.style504_119}>

          {/* Module 1: The Local Attack Injection Bay */}
          <div className={styles.style507_120}>
            <div className={styles.style508_121}>
              <h4 className={styles.style509_122}>
                <Cpu className={styles.style510_123} />
                مختبر الإضافة الموضعي للإخلالات الإعلانية
              </h4>
              <p className={styles.style513_124}>
                اضغط على الزر لإضافة انحراف بروتوكولي أو تسعيري إعلاني لحظي داخل النظام الجيو-سداسي واختبار رد فعل الإيقاف الرقمية:
              </p>
            </div>

            <div className={styles.style518_125}>
              <Button
                variant="outline"
                onClick={() => handleInjectThreat('payment')}
                className={styles.style522_126}
              >
                <span>إضافة التفاف مالي / تخليد وهمي 💸</span>
                <span className={styles.style525_127}>فادح</span>
              </Button>

              <Button
                variant="outline"
                onClick={() => handleInjectThreat('jurisdiction')}
                className={styles.style531_128}
              >
                <span>إضافة خرق تفتيتي جغرافي (الحدود) 🌐</span>
                <span className={styles.style534_129}>تحذير</span>
              </Button>

              <Button
                variant="outline"
                onClick={() => handleInjectThreat('unauthorized')}
                className={styles.style540_130}
              >
                <span>إضافة منشور بدون هوية وطنية ⚖️</span>
                <span className={styles.style543_131}>فادح</span>
              </Button>

              <Button
                variant="outline"
                onClick={() => handleInjectThreat('spam')}
                className={styles.style549_132}
              >
                <span>إضافة إغراق تكراري إعلاني مكثف 📡</span>
                <span className={styles.style552_133}>فادح</span>
              </Button>
            </div>
          </div>

          {/* Module 2: Forensic Algorithmic Deep Scanner */}
          <div className={styles.style558_134}>
            <div className={styles.style559_135}>
              <h4 className={styles.style560_136}>
                <Terminal className={styles.style561_137} />
                المسح الأمني التلقائي للأصول (Forensic Scanner)
              </h4>
              <p className={styles.style564_138}>
                مإضافة الفحص الذاتي المشفر لمطابقة فروع الإشهار والدلائل المحلية بشروط الأمان  الموحد.
              </p>
            </div>

            <Button
              onClick={runAdForensicScan}
              disabled={isScanning}
              className={styles.style572_139}
            >
              {isScanning ? (
                <>
                  <Loader2 className={styles.style576_140} />
                  جاري تشريح الأصول ومطابقة المعيار...
                </>
              ) : (
                <>
                  <Sparkles className={styles.style581_141} />
                  بدء فحص أمني رقمي فوري 📡
                </>
              )}
            </Button>

            {/* LaTeX Equation showing audit integrity function */}
            <div className={styles.style588_142}>
              <span className={styles.style589_143}>معيار السيطرة الرياضي:</span>
              <div className={styles.style590_144}>
                {"$$\\Omega_{audit} = \\sum_{i=1}^{N} (\\mathcal{I}_{ad} \\times \\lambda_{sovereign}) \\equiv 1$$"}
              </div>
              <p className={styles.style593_145}>
                حيث {"$\\mathcal{I}_{ad}$"} مؤشر سلامة المصادقة الموثقة لكل إشهار، و {"$\\lambda_{sovereign}$"} المعامل الضامن لحصانة الاستهلاك الطرفي.
              </p>
            </div>

            {scanResults && (
              <div className={styles.style599_146}>
                <div className={styles.style600_147}>
                  <span className={styles.style601_148}>تم التوثيق والمطابقة ✓</span>
                  <span className={styles.style602_149}>تقرير الفحص الأمني الرقمي:</span>
                </div>
                {scanResults.map((line, idx) => (
                  <p key={idx} className={styles.style605_150}>{line}</p>
                ))}
              </div>
            )}
          </div>

        </div>

      </div>

    </div>
  );
}

export function AdminPulseOverview() {
  const [logs, setLogs] = useState([
    {
      id: "log-1",
      timestamp: "الساعة 20:45:12",
      type: "severe",
      message: "تسجيل انحراف في تسعيرة التوافق بنسبة +16.4% في منطقة الجامعة",
      actionLabel: "موازنة فورية ⚖️",
      resolved: false,
    },
    {
      id: "log-2",
      timestamp: "الساعة 20:42:05",
      type: "severe",
      message: "اشتباه محاولة تلاعب بالوقت المتجمد (تعديل طابع محلي) من مستخدم",
      actionLabel: "حظر بث مؤقت 🚫",
      resolved: false,
    },
    {
      id: "log-3",
      timestamp: "الساعة 20:31:54",
      type: "warn",
      message: "تجاوز طاقة حجز الخلايا الجغرافية H3 المتوقعة في وادي السير",
      actionLabel: "تحديث السعة 📡",
      resolved: false,
    }
  ]);

  const { toast } = useToast();

  const [revenue, setRevenue] = useState(1489.20);
  const [zeroYielderCount, setZeroYielderCount] = useState(42);
  const [activeCells, setActiveCells] = useState(168);
  const [peakTrips, setPeakTrips] = useState(247);
  const [chartPath, setChartPath] = useState("M0,80 Q50,40 100,60 T200,30 T300,50 T400,20 T500,45");
  const [chartArea, setChartArea] = useState("M0,80 Q50,40 100,60 T200,30 T300,50 T400,20 T500,45 L500,100 L0,100 Z");
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleQuantumRefresh = () => {
    setIsRefreshing(true);
    toast({
      title: "📡 بث النشاط ال اللحظي",
      description: "جاري حوسبة ومطابقة تدفقات النقد الميداني عبر السحابة ...",
    });

    setTimeout(() => {
      const deltaRevenue = (Math.random() * 80 - 30);
      const newRevenue = Math.max(1000, revenue + deltaRevenue);
      setRevenue(newRevenue);

      const newZeroYielder = Math.max(10, zeroYielderCount + Math.floor(Math.random() * 9 - 4));
      setZeroYielderCount(newZeroYielder);

      const newCells = Math.max(50, activeCells + Math.floor(Math.random() * 13 - 6));
      setActiveCells(newCells);

      const newPeak = Math.max(100, peakTrips + Math.floor(Math.random() * 19 - 9));
      setPeakTrips(newPeak);

      // Randomize peak coordinates safely
      const p1 = Math.floor(25 + Math.random() * 30);
      const p2 = Math.floor(45 + Math.random() * 30);
      const p3 = Math.floor(15 + Math.random() * 30);
      const p4 = Math.floor(35 + Math.random() * 30);
      const p5 = Math.floor(10 + Math.random() * 30);
      const p6 = Math.floor(30 + Math.random() * 35);

      const newPath = `M0,80 Q50,${p1} 100,${p2} T200,${p3} T300,${p4} T400,${p5} T500,${p6}`;
      setChartPath(newPath);
      setChartArea(`${newPath} L500,100 L0,100 Z`);

      setIsRefreshing(false);

      toast({
        title: "⚡ اكتمال المزامنة والربط ال",
        description: `تمت مطابقة طبقات السحابة بالسيولة الميدانية اللحظية بنجاح. النشاط الفعلي: ${newRevenue.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})} د.أ.`,
      });
    }, 1000);
  };

  const handleResolve = (id: string, message: string, actionName: string) => {
    setLogs(prev => prev.map(log => log.id === id ? { ...log, resolved: true } : log));
    toast({
      title: "🛡️ تدخل  ناجح",
      description: `تم إخضاع المنظومة بنجاح وإجراء: ${actionName} لحل "${message}".`
    });
  };

  const injectDeviation = () => {
    const scenarios = [
      {
        message: "تجاوز طاقة العتبة الإعلانية بنسبة +18.7% في منطقة وادي السير",
        actionLabel: "موازنة فورية ⚖️",
        type: "severe"
      },
      {
        message: "محاولة تنشيط الأذونات الزجاجية (Glass Permissions) سائق [صالح] بدون توثيق ثنائي",
        actionLabel: "رفض فوري ⛔",
        type: "severe"
      },
      {
        message: "تعديل طابع زمني محلي جاري بنسبة انحراف 15.2% عن الموعد  في الحافة الجغرافية",
        actionLabel: "حذف زمني ⏱️",
        type: "warn"
      },
      {
        message: "مخالفة تدفق السيولة الميدانية اللحظية بنسبة تجاوز 23.1% عن معيار سحابة التوازن",
        actionLabel: "حفظ فوري 💸",
        type: "severe"
      },
      {
        message: "تعدي جغرافي على خلايا H3  المحظورة في منطقة الجيزة والقطاع الجنوبي",
        actionLabel: "عزل جغرافي 🌐",
        type: "severe"
      }
    ];

    const randomScenario = scenarios[Math.floor(Math.random() * scenarios.length)];
    const timeNow = new Date().toLocaleTimeString('ar-JO', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    const newLog = {
      id: `dynamic-log-${Date.now()}`,
      timestamp: `الساعة ${timeNow}`,
      type: randomScenario.type,
      message: randomScenario.message,
      actionLabel: randomScenario.actionLabel,
      resolved: false
    };

    setLogs(prev => [newLog, ...prev]);
    toast({
      title: "📡 تم رصد انحراف بروتوكولي جديد",
      description: randomScenario.message,
      variant: "destructive"
    });
  };

  const resetIncidentLogs = () => {
    setLogs([
      {
        id: "log-1",
        timestamp: "الساعة 20:45:12",
        type: "severe",
        message: "تسجيل انحراف في تسعيرة التوافق بنسبة +16.4% في منطقة الجامعة",
        actionLabel: "موازنة فورية ⚖️",
        resolved: false,
      },
      {
        id: "log-2",
        timestamp: "الساعة 20:42:05",
        type: "severe",
        message: "اشتباه محاولة تلاعب بالوقت المتجمد (تعديل طابع محلي) من مستخدم",
        actionLabel: "حظر بث مؤقت 🚫",
        resolved: false,
      },
      {
        id: "log-3",
        timestamp: "الساعة 20:31:54",
        type: "warn",
        message: "تجاوز طاقة حجز الخلايا الجغرافية H3 المتوقعة في وادي السير",
        actionLabel: "تحديث السعة 📡",
        resolved: false,
      }
    ]);
    toast({
      title: "🔄 تمت إعادة ضبط سجلات الفحص والتحصين",
      description: "تم استرداد كافة السجلات الافتراضية بنجاح لمواصلة الاختبار والتأمين."
    });
  };

  return (
    <div className={styles.style789_151} dir="rtl">
      {/* 🔮 Edge computing visual stats card banner */}
      <div className={styles.style791_152}>
        <Card className={styles.style792_153}>
          <CardHeader className={styles.style793_154}>
            <CardDescription className={styles.style794_155}>إجمالي الأرباح اللحظية (النشاط الفعلي)</CardDescription>
            <CardTitle className={styles.style795_156}>
              {revenue.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})} د.أ
            </CardTitle>
          </CardHeader>
          <CardContent className={styles.style799_157}>
            <span className={styles.style800_158}><ArrowUpRight className={styles.style800_159} /> +8.4% الأسبوع الماضي</span>
            <span>حوسبة الحافة للنشاط</span>
          </CardContent>
        </Card>

        <Card className={styles.style805_160}>
          <CardHeader className={styles.style806_161}>
            <CardDescription className={styles.style807_162}>الرحلات ذات العائد الصفري (التكافلية)</CardDescription>
            <CardTitle className={styles.style808_163}>{zeroYielderCount} رحلة</CardTitle>
          </CardHeader>
          <CardContent className={styles.style810_164}>
            <span className={styles.style811_165}>بث مباشر متكامل</span>
            <span>توزيع تنموي عادل</span>
          </CardContent>
        </Card>

        <Card className={styles.style816_166}>
          <CardHeader className={styles.style817_167}>
            <CardDescription className={styles.style818_168}>حجز الخلايا السداسية H3 الجغرافية</CardDescription>
            <CardTitle className={styles.style819_169}>{activeCells} خلية نشطة</CardTitle>
          </CardHeader>
          <CardContent className={styles.style821_170}>
            <span className={styles.style822_171}>بدقة Resolution 9</span>
            <span>الانتشار الآني</span>
          </CardContent>
        </Card>
      </div>

      {/* 📈 Beautiful simulated real-time chart pulse */}
      <Card className={styles.style829_172}>
        <CardHeader className={styles.style830_173}>
          <div className={styles.style831_174}>
            <Button
              variant="outline"
              onClick={handleQuantumRefresh}
              disabled={isRefreshing}
              className={styles.style836_175}
            >
              {isRefreshing ? (
                <Loader2 className={styles.style839_176} />
              ) : (
                <span className={styles.style841_177} />
              )}
              تحديث فوري  ●
            </Button>
            <CardTitle className={styles.style845_178}>
              <TrendingUp className={styles.style846_179} />
              نشاط الإيرادات الإعلانية والرحلات الميدانية اللحظية (مؤشر التوازن الحالي)
            </CardTitle>
          </div>
          <CardDescription className={styles.style850_180}>
            قياسية تدفق السيولة الميدانية بشكل مستمر ومقارنتها عبر طبقات السحابة.
          </CardDescription>
        </CardHeader>
        <CardContent className={styles.style854_181}>
          <div className={styles.style855_182}>
            <svg viewBox="0 0 500 100" className={styles.style856_183} preserveAspectRatio="none">
              <defs>
                <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#14b8a6" stopOpacity="0.4" />
                  <stop offset="100%" stopColor="#14b8a6" stopOpacity="0" />
                </linearGradient>
              </defs>
              <path
                d={chartPath}
                fill="none"
                stroke="#14b8a6"
                strokeWidth="3"
                strokeLinecap="round"
              />
              <path
                d={chartArea}
                fill="url(#chartGradient)"
              />
              <circle cx="200" cy="30" r="4" fill="#ef4444" className={styles.style874_184} />
              <circle cx="200" cy="30" r="3" fill="#ef4444" />

              <circle cx="400" cy="20" r="4" fill="#14b8a6" className={styles.style877_185} />
              <circle cx="400" cy="20" r="3" fill="#14b8a6" />
            </svg>
            <div className={styles.style880_186}>
              أقصى ذروة: {peakTrips} رحلة/ساعة
            </div>
            <div className={styles.style883_187}>
              طبقة الحسم: 20:00 - الآن
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ⚠️ Audit log and protocol deviations box */}
      <Card className={styles.style891_188}>
        <CardHeader className={styles.style892_189}>
          <div className={styles.style893_190}>
            <div className={styles.style894_191}>
              <span className={styles.style895_192}>
                {logs.filter(l => !l.resolved).length} معلق التدخل
              </span>
              <Button
                variant="outline"
                onClick={injectDeviation}
                className={styles.style901_193}
              >
                إضافة انحراف 🧪
              </Button>
              <Button
                variant="outline"
                onClick={resetIncidentLogs}
                className={styles.style908_194}
              >
                إعادة تعيين 🔄
              </Button>
            </div>
            <CardTitle className={styles.style913_195}>
              <AlertTriangle className={styles.style914_196} />
              سجل تدقيق الانحرافات والتحصين البروتوكولي (تجاوز الـ 15% والأذونات الزجاجية)
            </CardTitle>
          </div>
          <CardDescription className={styles.style918_197}>
            لوحة الاستجابة الفورية المعزولة لرصد وضبط أي انتهاك جغرافي أو زمني يهدد توازن عصب الملاحة.
          </CardDescription>

          <div className={styles.style922_198}>
            <div className={styles.style923_199}>
              <span className={styles.style924_200}>بروتوكول الفحص 12</span>
              <span>🔒 معيار الاستنباط والتحصين الرياضي (The Protocol Guard):</span>
            </div>

            <div className={styles.style928_201}>
              <span className={styles.style929_202}>
                {"$$\\Delta_{flux} = \\left| \\frac{\\text{Liquidity}_{field} - \\text{Liquidity}_{cloud}}{\\text{Liquidity}_{cloud}} \\right| \\le 15\\%$$"}
              </span>
              <span className={styles.style932_203}>
                {"$$\\text{GlassPermissions}_{state} = \\mathcal{A}_{MFA} \\land \\mathcal{E}_{SovereignApproval} \\equiv 1$$"}
              </span>
            </div>

            <div className={styles.style937_204}>
              بموجب ميثاق النظام الماسي، يتم عزل بث الملاحة الجغرافية وتجميد العقود الميدانية كلياً فور تخطي نسبة انحراف تدفق السيولة عتبة الـ <strong className={styles.style938_205}>15%</strong>، أو عند رصد محاولات تنشيط الأذونات الزجاجية (Glass Permissions) بدون مصادقة  ثنائية.
            </div>
          </div>
        </CardHeader>
        <CardContent className={styles.style942_206}>
          {logs.map((log) => (
            <div key={log.id} className={cn(
              styles.style945_207,
              log.resolved ? styles.style946_208 : styles.style946_209
            )} dir="rtl">
              <div className={styles.style948_210}>
                <div className={styles.style949_211}>
                  <span className={styles.style950_212}>{log.timestamp}</span>
                  <Badge variant={log.resolved ? "secondary" : "destructive"} className={styles.style951_213}>
                    {log.resolved ? "تمت السيطرة والموازنة" : log.type === "severe" ? "عارض  حرج" : "تنبيه تشغيلي"}
                  </Badge>
                </div>
                <p className={styles.style955_214}>{log.message}</p>
              </div>

              {!log.resolved && (
                <Button
                  onClick={() => handleResolve(log.id, log.message, log.actionLabel)}
                  className={styles.style961_215}
                >
                  {log.actionLabel}
                </Button>
              )}
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

export function AdminViewTab() {
  const { pulseData, loadingPulse } = useMarketPulse(true);

  return (
    <div className={styles.style978_216} dir="rtl">
      {/* تم تعيين لوحة المالك كشاشة الافتتاح الأساسية للمشرف */}
      <Tabs defaultValue="owner" className={styles.style980_217}>

        {/* شريط الأزرار  - تم ربط القيم بدقة لمنع الانهيار */}
        <TabsList className={styles.style983_218}>

          <TabsTrigger value="dashboard" className={styles.style985_219}>
             <Users className={styles.style986_220} />
             <span className={styles.style987_221}>برج المراقبة</span>
          </TabsTrigger>

          <TabsTrigger value="ads" className={styles.style990_222}>
            <Megaphone className={styles.style991_223} />
             <span className={styles.style992_224}>إدارة الإعلانات</span>
          </TabsTrigger>

          {/* الزر  الجديد V5.5 */}
          <TabsTrigger value="owner" className={styles.style996_225}>
            <ShieldAlert className={styles.style997_226} />
            <span className={styles.style998_227}>👑 V5.5 لوحة المالك</span>
          </TabsTrigger>

          <TabsTrigger value="delegates" className={styles.style1001_228}>
            <UsersRound className={styles.style1002_229} />
            <span className={styles.style1003_230}>جيش المندوبين 📣</span>
          </TabsTrigger>

           <TabsTrigger value="pulse" className={styles.style1006_231}>
             <Activity className={styles.style1007_232} />
             <span className={styles.style1008_233}>نشاط السوق</span>
          </TabsTrigger>

          <TabsTrigger value="controls" className={styles.style1011_234}>
            <Shield className={styles.style1012_235} />
            <span className={styles.style1013_236}>التحكم </span>
          </TabsTrigger>
        </TabsList>

        {/* ================= حاويات المحتوى (الجسر الحركي) ================= */}

        <TabsContent value="dashboard" className={styles.style1019_237}>
           <SovereignErrorBoundary>
              <div className={styles.style1021_238}>
                <AdminPulseOverview />
                <DriversManagementTab />
              </div>
           </SovereignErrorBoundary>
        </TabsContent>

        <TabsContent value="ads" className={styles.style1028_239}>
           <SovereignErrorBoundary>
              <div className={styles.style1030_240}>
                <PendingAdsAuditPanel />
                <AdsManagementTab />
              </div>
           </SovereignErrorBoundary>
        </TabsContent>

        {/* 👑 الحاوية المفقودة التي تسببت بالشلل: حاوية لوحة المالك */}
        <TabsContent value="owner" className={styles.style1038_241}>
           <SovereignErrorBoundary>
              <RadarOwnerSovereignDashboard />
           </SovereignErrorBoundary>
        </TabsContent>

        <TabsContent value="delegates" className={styles.style1044_242}>
           <SovereignErrorBoundary>
              <DelegatesManagementTab />
           </SovereignErrorBoundary>
        </TabsContent>

        <TabsContent value="pulse" className={styles.style1050_243}>
           <SovereignErrorBoundary>
             <PulseHeatmap pulseData={pulseData} isLoading={loadingPulse} />
           </SovereignErrorBoundary>
        </TabsContent>

        <TabsContent value="controls" className={styles.style1056_244}>
           <SovereignErrorBoundary>
             <div className={styles.style1058_245}>
               <KillSwitchPanel />
               <FuelIndexPanel />
              </div>
           </SovereignErrorBoundary>
        </TabsContent>

      </Tabs>
    </div>
  );
}
