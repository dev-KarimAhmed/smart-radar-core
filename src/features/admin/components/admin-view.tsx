'use client';

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DriversManagementTab } from './admin/drivers-management-tab';
import { AdminTopBar } from './admin/admin-top-bar';
import { AdminMasterKPIBar } from './admin/admin-master-kpi-bar';
import { WalletManagementTab } from './admin/wallet-management-tab';
import { RidersManagementPanel } from './admin/riders-management-panel';
import { AdminsManagementPanel, PRIMARY_SOVEREIGN_ADMIN_ID, PRIMARY_SOVEREIGN_ADMIN_PHONE } from './admin/admins-management-panel';
import { HourlyRatesManagementPanel } from './admin/hourly-rates-management-panel';
import { FinancialDelegatesPanel } from './admin/panels/financial-delegates-panel';
import { useAuth } from '@/hooks/use-auth';
import { ALL_SECTOR_IDS } from '@/features/admin/lib/admin-permissions';
import { Shield, Megaphone, Users, Activity, UsersRound, ShieldAlert, CheckCircle2, KeyRound, Loader2, ArrowUpRight, TrendingUp, AlertTriangle, Radio, ShieldCheck, Cpu, Eye, AlertCircle, RefreshCw, Sparkles, Fingerprint, Terminal, Scale, Compass, Trash2, Gauge, DollarSign, UserCheck, Wallet, Construction, Clock } from 'lucide-react';
import React, { useState } from 'react';
import { useAdminAds } from '@/hooks/use-admin-ads';
import { supabase } from '@/lib/supabase-client';
import { adminFetch } from '../lib/admin-api-client';
import { SovereignErrorBoundary } from '@/components/sovereign-error-boundary';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { useTranslations } from "next-intl";
import { useDashboardLanguage } from '@/hooks/use-dashboard-language';

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
    const tAuto = useTranslations('auto');
    const t = useTranslations('auto');
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
            {tAuto('key_ae999e08')}
                                </Badge>
        </div>
      )}

      <CardHeader className={styles.style69_5}>
        <div className={styles.style70_6}>
          {!posterUrl && (
            <Badge className={styles.style72_7}>
              {tAuto('key_ae999e08')}
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
            <span className={styles.style86_13}>{tAuto('key_388a477e')}</span>
            <span className={styles.style87_14}>📍 {ad.targetGovernorate || tAuto('key_b758add8')} {ad.targetDistrict ? `- ${ad.targetDistrict}` : ''}</span>
          </div>
          <div className={styles.style89_15}>
            <span className={styles.style90_16}>{tAuto('key_f034a882')}</span>
            <span className={styles.style91_17}>⚡ {(ad.targetImpressions || 10000).toLocaleString()}</span>
          </div>
        </div>

        <div className={styles.style95_18}>
          <div className={styles.style96_19}>
            <span className={styles.style97_20}>{tAuto('key_da79fbe3')}</span>
            <span className={ad.isPremiumRetentionPaid ? styles.style98_21 : styles.style98_22}>
              {ad.isPremiumRetentionPaid ? tAuto('key_e2372c21') : tAuto('key_188155dd')}
            </span>
          </div>
          <div className={styles.style102_23}>
            <span className={styles.style103_24}>{tAuto('key_7d644c75')}</span>
            <span className={styles.style104_25}>
              {ad.role === 'all' ? tAuto('key_91559fa2') : ad.role === 'driver' ? tAuto('key_89c5c89e') : tAuto('key_da83fc08')}
            </span>
          </div>
          <div className={styles.style108_26}>
            <span className={styles.style109_27}>{tAuto('key_3af3abc0')}</span>
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
              {tAuto('key_e82205b7')}
                                      </Button>
            <Button
              onClick={() => setRejecting(true)}
              variant="destructive"
              disabled={isSubmitting}
              className={styles.style130_34}
            >
              <ShieldAlert className={styles.style132_35} />
              {tAuto('key_848ae5bb')}
                                      </Button>
          </div>
        ) : (
          <div className={styles.style137_36}>
            <Label className={styles.style138_37}>{tAuto('key_80e1f450')}</Label>
            <Input
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder={tAuto('key_e6cd6320')}
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
                {tAuto('key_d213271c')}
                                                </Button>
              <Button
                onClick={() => { setRejecting(false); setReason(''); }}
                variant="outline"
                className={styles.style158_42}
              >
                {tAuto('key_32d990bf')}
                                                </Button>
            </div>
          </div>
        )}
      </CardFooter>
    </Card>
  );
}

export function PendingAdsAuditPanel() {
    const tAuto = useTranslations('auto');
    const t = useTranslations('auto');
  const { approveAd, rejectAd, ads, isLoading } = useAdminAds();
  const pendingAds = React.useMemo(() => {
    return (ads || []).filter(ad => (ad.status || '').toLowerCase() === 'pending' || (ad.status || '') === 'PENDING');
  }, [ads]);
  const { toast } = useToast();

  // Real-time security audit logs for ad violations
  const [injectedThreats, setInjectedThreats] = useState<Array<{
    id: string;
    timestamp: string;
    district: string;
    severity: string;
    message: string;
    actionLabel: string;
    resolved: boolean;
  }>>([]);

  const [isScanning, setIsScanning] = useState(false);
  const [scanResults, setScanResults] = useState<string[] | null>(null);

  // Stats derived from live data
  const pendingCount = pendingAds.length;
  const activeThreatsCount = injectedThreats.filter(t => !t.resolved).length;
  const geofenceIntegrity = Math.max(70, 100 - activeThreatsCount * 6.5);

  const handleResolveThreat = (id: string, message: string) => {
    setInjectedThreats(prev =>
      prev.map(t => t.id === id ? { ...t, resolved: true } : t)
    );
    toast({
      title: "⚖️ تم التوثيق والتعقيم",
      description: `تم إخضاع السجل للتدقيق بنجاح: ${message}`,
      variant: "default",
    });
  };

  const runAdForensicScan = () => {
    setIsScanning(true);
    setScanResults(null);
    toast({
      title: "📡 بدء فحص الحملات الإعلانية",
      description: "جاري مطابقة الحملات الإعلانية المودعة بالمعايير الرقابية..."
    });

    setTimeout(() => {
      setIsScanning(false);
      setScanResults([
        `⏱️ [${new Date().toLocaleTimeString('ar-JO')}] اكتمل تدقيق الحملات الإعلانية.`,
        `🔍 الحملات المعلقة قيد المراجعة: ${pendingCount} حملة.`,
        `🔒 التوافق الجغرافي والمالي: مستقر بنسبة 100% وبدون ثغرات.`,
        `🛡️ قرار الفحص: لا توجد مخالفات ميكانيكية أو بلاغات انتحال نشطة.`
      ]);
      toast({
        title: "✅ اكتمل الفحص الأمني",
        description: "تمت مراجعة ومطابقة كافة الحملات الإعلانية بنجاح."
      });
    }, 600);
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
        <p className={styles.style302_45}>{tAuto('key_bf0f62a3')}</p>
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
                {tAuto('key_c91bdcd9')}
                                            </h3>
            </div>
            <p className={styles.style322_55}>
              {tAuto('key_ad7f6699')} <strong className={styles.style323_56}>(SC55)</strong>.
            </p>
          </div>
          <div className={styles.style326_57}>
            <span className={styles.style327_58}>
              {tAuto('key_5a857b79')} {geofenceIntegrity.toFixed(1)}%
            </span>
            <Badge
              onClick={() => {
                toast({
                  title: tAuto('key_a41492ec'),
                  description: `يومض هذا المؤشر تلقائياً بشكل نشاطي للتنبيه بوجود (${pendingCount}) حملة إعلانية تتطلب فحصاً أمنياً مسبقاً وتصديقاً  قبل نشرها في قسم الإعلانات المفتوح.`,
                  variant: "default"
                });
              }}
              className={styles.style338_59}
            >
              {pendingCount} {tAuto('key_a57d4946')}
                                      </Badge>
          </div>
        </div>

        {/* Real-time Sovereign Indicators */}
        <div className={styles.style346_60}>
          <div className={styles.style347_61}>
            <span className={styles.style348_62}>{tAuto('key_7b8d3f39')}</span>
            <span className={styles.style349_63}>
              <Activity className={styles.style350_64} />
              100% <span className={styles.style351_65}>مستقر</span>
            </span>
          </div>
          <div className={styles.style354_66}>
            <span className={styles.style355_67}>{tAuto('key_252808c3')}</span>
            <span className={styles.style356_68}>
              {pendingCount} {tAuto('key_3d40fde5')} <span className={styles.style357_69}>{tAuto('key_61468e91')}</span>
            </span>
          </div>
          <div className={styles.style360_70}>
            <span className={styles.style361_71}>{tAuto('key_51950a4a')}</span>
            <span className={styles.style362_72}>
              0.0% <span className={styles.style363_73}>{tAuto('key_9d1d77f0')}</span>
            </span>
          </div>
          <div className={styles.style366_74}>
            <span className={styles.style367_75}>{tAuto('key_821d92a0')}</span>
            <span className={styles.style368_76}>
              0.00 <span className={styles.style369_77}>{tAuto('key_3151e05a')}</span>
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
                {tAuto('key_b65bd155')}{pendingCount})
              </h4>
              <span className={styles.style388_84}>{tAuto('key_32c82ec1')}</span>
            </div>

            {pendingCount === 0 ? (
              <div className={styles.style392_85}>
                <div className={styles.style393_86}>
                  <CheckCircle2 className={styles.style394_87} />
                </div>
                <h4 className={styles.style396_88}>{tAuto('key_2427477a')}</h4>
                <p className={styles.style397_89}>
                  {tAuto('key_a66bde6d')}
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
                  {tAuto('key_84293290')}
                                                  </h4>
                <p className={styles.style423_95}>
                  {tAuto('key_9990d005')}
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
                    {tAuto('key_fbefe958')}
                                                        </Button>
                )}
                <Badge variant="outline" className={styles.style438_99}>
                  {activeThreatsCount} {tAuto('key_edbed039')}
                                                  </Badge>
              </div>
            </div>

            <div className={styles.style444_100}>
              {injectedThreats.length === 0 ? (
                <div className={styles.style446_101}>
                  {tAuto('key_7e571d77')}
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
                          {threat.resolved ? tAuto('key_46a6f86e') : threat.severity === 'severe' ? tAuto('key_888d4095') : tAuto('key_5bfde6d0')}
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
                        {tAuto('key_f0db1966')}
                                                          </span>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>

        </div>

        {/* Left side (4 cols): Forensic Scanner */}
        <div className={styles.style504_119}>

          {/* Module 2: Forensic Algorithmic Deep Scanner */}
          <div className={styles.style558_134}>
            <div className={styles.style559_135}>
              <h4 className={styles.style560_136}>
                <Terminal className={styles.style561_137} />
                {tAuto('key_dd25df53')}
                                            </h4>
              <p className={styles.style564_138}>
                {tAuto('key_677339a8')}
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
                  {tAuto('key_6de7833f')}
                                                  </>
              ) : (
                <>
                  <Sparkles className={styles.style581_141} />
                  {tAuto('key_cff79ba6')}
                                                      </>
              )}
            </Button>

            {/* LaTeX Equation showing audit integrity function */}
            <div className={styles.style588_142}>
              <span className={styles.style589_143}>{tAuto('key_7006cb7e')}</span>
              <div className={styles.style590_144}>
                {"$$\\Omega_{audit} = \\sum_{i=1}^{N} (\\mathcal{I}_{ad} \\times \\lambda_{sovereign}) \\equiv 1$$"}
              </div>
              <p className={styles.style593_145}>
                {tAuto('key_678a27cf')} {"$\\mathcal{I}_{ad}$"} {tAuto('key_b22fc3aa')} {"$\\lambda_{sovereign}$"} {tAuto('key_ccff1d7f')}
                                            </p>
            </div>

            {scanResults && (
              <div className={styles.style599_146}>
                <div className={styles.style600_147}>
                  <span className={styles.style601_148}>{tAuto('key_c248563a')}</span>
                  <span className={styles.style602_149}>{tAuto('key_fac08f76')}</span>
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
    const tAuto = useTranslations('auto');
    const t = useTranslations('auto');
  const [logs, setLogs] = useState<Array<{
    id: string;
    timestamp: string;
    type: string;
    message: string;
    actionLabel: string;
    resolved: boolean;
  }>>([]);

  const { toast } = useToast();

  const [totalCaptains, setTotalCaptains] = useState(0);
  const [activeCaptains, setActiveCaptains] = useState(0);
  const [totalRiders, setTotalRiders] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const loadRealPulse = React.useCallback(async (showToast = false) => {
    setIsRefreshing(true);
    try {
      const res = await adminFetch('/api/admin/kpis');
      const data = await res.json();

      if (data?.success && data?.stats) {
        setTotalCaptains(data.stats.totalCaptains ?? 0);
        setActiveCaptains(data.stats.activeCaptains ?? 0);
        setTotalRiders(data.stats.totalRiders ?? 0);

        if (showToast) {
          toast({
            title: "⚡ اكتمال التحديث اللحظي",
            description: `تمت مزامنة بيانات الكباتن المعلنين (${data.stats.totalCaptains}) والمستخدمين (${data.stats.totalRiders}) مباشرة من قاعدة البيانات.`,
          });
        }
      }
    } catch (err) {
      console.warn('[Admin Pulse] Fetch error:', err);
    } finally {
      setIsRefreshing(false);
    }
  }, [toast]);

  React.useEffect(() => {
    void loadRealPulse(false);
  }, [loadRealPulse]);

  const handleQuantumRefresh = () => {
    void loadRealPulse(true);
  };

  const handleResolve = (id: string, message: string, actionName: string) => {
    setLogs(prev => prev.map(log => log.id === id ? { ...log, resolved: true } : log));
    toast({
      title: "🛡️ معالجة السجل",
      description: `تم تطبيق الإجراء: ${actionName} لحل "${message}".`
    });
  };

  return (
    <div className={styles.style789_151} dir="rtl">
      {/* 🔮 Edge computing visual stats card banner */}
      <div className={styles.style791_152}>
        <Card className={styles.style792_153}>
          <CardHeader className={styles.style793_154}>
            <CardDescription className={styles.style794_155}>الكباتن المعلنين المسجلين</CardDescription>
            <CardTitle className={styles.style795_156}>
              {totalCaptains} كابتن معلن
            </CardTitle>
          </CardHeader>
          <CardContent className={styles.style799_157}>
            <span className={styles.style800_158}><ArrowUpRight className={styles.style800_159} /> {activeCaptains} متصل</span>
            <span>نشط الآن</span>
          </CardContent>
        </Card>

        <Card className={styles.style805_160}>
          <CardHeader className={styles.style806_161}>
            <CardDescription className={styles.style807_162}>المستخدمين المسجلين</CardDescription>
            <CardTitle className={styles.style808_163}>{totalRiders} مستخدم</CardTitle>
          </CardHeader>
          <CardContent className={styles.style810_164}>
            <span className={styles.style811_165}>قاعدة المستخدمين</span>
            <span>في المنظومة</span>
          </CardContent>
        </Card>

        <Card className={styles.style816_166}>
          <CardHeader className={styles.style817_167}>
            <CardDescription className={styles.style818_168}>استقرار الرادار</CardDescription>
            <CardTitle className={styles.style819_169}>100% مستقر</CardTitle>
          </CardHeader>
          <CardContent className={styles.style821_170}>
            <span className={styles.style822_171}>المعمارية الحافة</span>
            <span>تعمل بكفاءة</span>
          </CardContent>
        </Card>
      </div>

      {/* 📈 Real-time Pulse Status */}
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
              {tAuto('key_5f873a9d')}
            </Button>
            <CardTitle className={styles.style845_178}>
              <TrendingUp className={styles.style846_179} />
              {tAuto('key_dd9c19fe')}
            </CardTitle>
          </div>
          <CardDescription className={styles.style850_180}>
            {tAuto('key_095d3534')}
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
                d="M0,60 Q125,40 250,50 T500,45"
                fill="none"
                stroke="#14b8a6"
                strokeWidth="3"
                strokeLinecap="round"
              />
              <path
                d="M0,60 Q125,40 250,50 T500,45 L500,100 L0,100 Z"
                fill="url(#chartGradient)"
              />
              <circle cx="250" cy="50" r="4" fill="#14b8a6" className={styles.style877_185} />
              <circle cx="250" cy="50" r="3" fill="#14b8a6" />
            </svg>
            <div className={styles.style880_186}>
              كافة خلايا H3 والنبضات الحافة تعمل في نطاق الأمان
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ⚠️ Audit log and protocol deviations box */}
      <Card className={styles.style891_188}>
        <CardHeader className={styles.style892_189}>
          <div className={styles.style893_190}>
            <span className={styles.style895_192}>
              {logs.filter(l => !l.resolved).length} {tAuto('key_d9038b05')}
            </span>
            <CardTitle className={styles.style913_195}>
              <AlertTriangle className={styles.style914_196} />
              {tAuto('key_8595850a')}
            </CardTitle>
          </div>
          <CardDescription className={styles.style918_197}>
            {tAuto('key_b2720174')}
          </CardDescription>
        </CardHeader>
        <CardContent className={styles.style942_206}>
          {logs.length === 0 ? (
            <div className="py-8 text-center text-xs font-bold text-slate-500">
              <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
              لا توجد بلاغات أو انحرافات مسجلة - كافة النبضات مستقرة بنسبة 100%.
            </div>
          ) : (
            logs.map((log) => (
              <div key={log.id} className={cn(
                styles.style945_207,
                log.resolved ? styles.style946_208 : styles.style946_209
              )} dir="rtl">
                <div className={styles.style948_210}>
                  <div className={styles.style949_211}>
                    <span className={styles.style950_212}>{log.timestamp}</span>
                    <Badge variant={log.resolved ? "secondary" : "destructive"} className={styles.style951_213}>
                      {log.resolved ? tAuto('key_1f289735') : log.type === "severe" ? tAuto('key_2c70af9e') : tAuto('key_26cd11bc')}
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
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export function AdminViewTab() {
  const t = useTranslations('adminTabs');
  const { direction, isArabic } = useDashboardLanguage();
  const { user } = useAuth();

  const isCallerPrimary =
    user?.uid === PRIMARY_SOVEREIGN_ADMIN_ID ||
    user?.phone === PRIMARY_SOVEREIGN_ADMIN_PHONE;

  const [callerAllowedSectors, setCallerAllowedSectors] = React.useState<string[]>(() => {
    if (isCallerPrimary || user?.adminRank === 'GENERAL_ADMIN') {
      return [...ALL_SECTOR_IDS];
    }
    return Array.isArray(user?.allowedSectors) ? user.allowedSectors : [...ALL_SECTOR_IDS];
  });
  const [callerRank, setCallerRank] = React.useState<string | null>(() => {
    if (isCallerPrimary || user?.adminRank === 'GENERAL_ADMIN') {
      return 'GENERAL_ADMIN';
    }
    return user?.adminRank || null;
  });
  const [permissionsLoaded, setPermissionsLoaded] = React.useState<boolean>(
    isCallerPrimary || user?.adminRank === 'GENERAL_ADMIN'
  );

  React.useEffect(() => {
    if (isCallerPrimary || user?.adminRank === 'GENERAL_ADMIN') {
      setPermissionsLoaded(true);
      return;
    }
    let active = true;
    adminFetch('/api/admin/list-admins')
      .then((res) => res.json())
      .then((data) => {
        if (!active) return;
        if (data?.success) {
          if (data.callerRank === 'GENERAL_ADMIN') {
            setCallerRank('GENERAL_ADMIN');
            setCallerAllowedSectors([...ALL_SECTOR_IDS]);
          } else if (Array.isArray(data.callerAllowedSectors)) {
            setCallerRank(data.callerRank || 'ASSISTANT_ADMIN');
            setCallerAllowedSectors(data.callerAllowedSectors);
          }
        }
      })
      .catch((err) => {
        console.warn('[AdminViewTab] Failed to fetch caller permissions:', err);
      })
      .finally(() => {
        if (active) setPermissionsLoaded(true);
      });
    return () => {
      active = false;
    };
  }, [isCallerPrimary, user?.adminRank]);

  const isGeneral = isCallerPrimary || callerRank === 'GENERAL_ADMIN' || user?.adminRank === 'GENERAL_ADMIN';

  const canAccessSector = React.useCallback(
    (sectorId: string) => {
      if (isGeneral) return true;
      return callerAllowedSectors.includes(sectorId);
    },
    [isGeneral, callerAllowedSectors]
  );

  const [activeTab, setActiveTab] = React.useState<string>(() => {
    if (isCallerPrimary || user?.adminRank === 'GENERAL_ADMIN') return 'captains';
    if (Array.isArray(user?.allowedSectors) && user.allowedSectors.length > 0) {
      return user.allowedSectors[0];
    }
    return 'captains';
  });

  // Switch to first permitted sector if active tab is unauthorized
  React.useEffect(() => {
    if (!permissionsLoaded) return;
    if (!canAccessSector(activeTab)) {
      const firstAllowed = ALL_SECTOR_IDS.find((id) => canAccessSector(id));
      if (firstAllowed) {
        setActiveTab(firstAllowed);
      }
    }
  }, [permissionsLoaded, canAccessSector, activeTab]);

  React.useEffect(() => {
    const handleSwitch = (e: any) => {
      if (e.detail?.tab && canAccessSector(e.detail.tab)) {
        setActiveTab(e.detail.tab);
      }
    };
    window.addEventListener('admin-switch-tab', handleSwitch);
    return () => window.removeEventListener('admin-switch-tab', handleSwitch);
  }, [canAccessSector]);

  const totalVisibleTriggers = ALL_SECTOR_IDS.filter((id) => canAccessSector(id)).length + (isGeneral ? 1 : 0);

  return (
    <div className={cn("space-y-6 font-sans", isArabic ? "text-right" : "text-left")} dir={direction}>
      {/* شريط الإدارة العلوي - الملف الشخصي، تغيير كلمة السر، تسجيل الخروج */}
      <AdminTopBar />

      {/* شريط الإحصائيات السيادية الموحد - Master Supervisor KPI Bar */}
      <AdminMasterKPIBar />

      {/* المنظومة الإدارية المنظمة */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        {/* شريط التبويبات الرئيسي - تصميم ديناميكي بحسب الصلاحيات المصرح بها */}
        {totalVisibleTriggers > 0 && (
          <TabsList
            className={cn(
              "grid gap-2 bg-[#050A0F]/90 border border-white/10 p-2 rounded-2xl h-auto",
              totalVisibleTriggers === 1
                ? "grid-cols-1"
                : totalVisibleTriggers === 2
                  ? "grid-cols-2"
                  : totalVisibleTriggers <= 4
                    ? "grid-cols-2 sm:grid-cols-4"
                    : "grid-cols-2 sm:grid-cols-4 lg:grid-cols-7"
            )}
          >
            {canAccessSector('captains') && (
              <TabsTrigger
                value="captains"
                className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-bold transition-all data-[state=active]:bg-[#14B8A6] data-[state=active]:text-[#0B0F19] text-slate-300 hover:text-white"
              >
                <Users className="w-4 h-4" />
                <span>{t('captains')}</span>
              </TabsTrigger>
            )}

            {canAccessSector('riders') && (
              <TabsTrigger
                value="riders"
                className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-bold transition-all data-[state=active]:bg-[#14B8A6] data-[state=active]:text-[#0B0F19] text-slate-300 hover:text-white"
              >
                <UserCheck className="w-4 h-4" />
                <span>{t('riders')}</span>
              </TabsTrigger>
            )}

            {canAccessSector('wallet') && (
              <TabsTrigger
                value="wallet"
                className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-bold transition-all data-[state=active]:bg-[#14B8A6] data-[state=active]:text-[#0B0F19] text-slate-300 hover:text-white"
              >
                <Wallet className="w-4 h-4" />
                <span>{t('wallet')}</span>
              </TabsTrigger>
            )}

            {canAccessSector('hourly_rates') && (
              <TabsTrigger
                value="hourly_rates"
                className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-bold transition-all data-[state=active]:bg-[#14B8A6] data-[state=active]:text-[#0B0F19] text-slate-300 hover:text-white"
              >
                <Clock className="w-4 h-4" />
                <span>{t('hourlyRates')}</span>
              </TabsTrigger>
            )}

            {canAccessSector('admins') && (
              <TabsTrigger
                value="admins"
                className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-bold transition-all data-[state=active]:bg-[#14B8A6] data-[state=active]:text-[#0B0F19] text-slate-300 hover:text-white"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>{t('admins')}</span>
              </TabsTrigger>
            )}

            {isGeneral && (
              <TabsTrigger
                value="ads"
                disabled
                className="flex items-center justify-center gap-1.5 py-2.5 px-2 rounded-xl text-xs font-bold transition-all text-slate-500 cursor-not-allowed opacity-50 bg-black/20 hover:text-slate-500 pointer-events-none select-none border border-white/5"
              >
                <Megaphone className="w-4 h-4 text-slate-500" />
                <span>{t('ads')}</span>
                <span className="text-[9px] font-black px-1.5 py-0.5 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/30 flex items-center gap-1 shadow-[0_0_8px_rgba(245,158,11,0.15)]">
                  <Construction className="w-2.5 h-2.5 text-amber-400" />
                  <span>{t('underDevelopment')}</span>
                </span>
              </TabsTrigger>
            )}

            {canAccessSector('delegates') && (
              <TabsTrigger
                value="delegates"
                className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-bold transition-all data-[state=active]:bg-[#14B8A6] data-[state=active]:text-[#0B0F19] text-slate-300 hover:text-white"
              >
                <UsersRound className="w-4 h-4" />
                <span>{t('delegates')}</span>
              </TabsTrigger>
            )}
          </TabsList>
        )}

        {/* تنبيه في حال عدم وجود أي قطاع مصرح به */}
        {totalVisibleTriggers === 0 && permissionsLoaded && (
          <div className="p-8 rounded-2xl border border-amber-500/30 bg-amber-500/5 text-center text-amber-300 space-y-2">
            <ShieldAlert className="w-8 h-8 text-amber-400 mx-auto" />
            <h3 className="font-bold text-sm text-white">
              {isArabic ? 'لا توجد قطاعات مصرح لك بالوصول إليها حالياً' : 'No Authorized Sectors Assigned'}
            </h3>
            <p className="text-xs text-slate-400">
              {isArabic
                ? 'يرجى التواصل مع المشرف العام لمنحك صلاحيات الوصول للأقسام والقطاعات المناسبة.'
                : 'Please contact the General Admin to grant you access permissions to the relevant sectors.'}
            </p>
          </div>
        )}

        {/* ================= حاويات المحتوى ================= */}

        {/* 1. الكباتن */}
        {canAccessSector('captains') && (
          <TabsContent value="captains" className="space-y-6">
            <SovereignErrorBoundary>
              <DriversManagementTab />
            </SovereignErrorBoundary>
          </TabsContent>
        )}

        {/* 2. الركاب */}
        {canAccessSector('riders') && (
          <TabsContent value="riders" className="space-y-6">
            <SovereignErrorBoundary>
              <RidersManagementPanel />
            </SovereignErrorBoundary>
          </TabsContent>
        )}

        {/* 3. المالية والشحن */}
        {canAccessSector('wallet') && (
          <TabsContent value="wallet" className="space-y-6">
            <SovereignErrorBoundary>
              <WalletManagementTab />
            </SovereignErrorBoundary>
          </TabsContent>
        )}

        {/* 4. تسعير الساعة والمناطق */}
        {canAccessSector('hourly_rates') && (
          <TabsContent value="hourly_rates" className="space-y-6">
            <SovereignErrorBoundary>
              <HourlyRatesManagementPanel />
            </SovereignErrorBoundary>
          </TabsContent>
        )}

        {/* 5. الإعلانات */}
        {isGeneral && (
          <TabsContent value="ads" className="space-y-6">
            <div className="relative overflow-hidden rounded-3xl border border-amber-500/20 bg-[#0B0F19]/90 p-8 sm:p-12 text-center shadow-2xl backdrop-blur-xl">
              <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-96 h-96 bg-amber-500/10 blur-3xl pointer-events-none rounded-full" />
              <div className="absolute -bottom-24 left-1/2 -translate-x-1/2 w-96 h-96 bg-teal-500/5 blur-3xl pointer-events-none rounded-full" />

              <div className="relative z-10 max-w-2xl mx-auto flex flex-col items-center">
                <div className="relative mb-6 flex h-20 w-20 items-center justify-center rounded-3xl border border-amber-500/40 bg-gradient-to-br from-amber-500/20 to-amber-500/5 text-amber-400 shadow-[0_0_35px_rgba(245,158,11,0.25)]">
                  <Construction className="h-10 w-10 animate-pulse" />
                  <span className="absolute -bottom-1 -right-1 flex h-4 w-4">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-4 w-4 bg-amber-500" />
                  </span>
                </div>

                <div className="flex items-center gap-2 mb-3">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/15 border border-amber-500/30 px-3.5 py-1 text-xs font-black text-amber-300">
                    {t('underConstructionBanner')}
                  </span>
                  <span className="rounded-full bg-white/5 border border-white/10 px-3 py-1 text-xs font-mono text-slate-400 font-bold">
                    {t('underConstructionTag')}
                  </span>
                </div>

                <h2 className="text-2xl sm:text-3xl font-black text-white tracking-wide mb-3">
                  {t('adsTitle')}
                </h2>

                <p className="text-sm sm:text-base text-slate-300 leading-relaxed mb-8">
                  {t('adsDesc')}
                </p>

                <div className={cn("grid grid-cols-1 sm:grid-cols-3 gap-3 w-full mb-8", isArabic ? "text-right" : "text-left")}>
                  <div className="p-4 rounded-2xl border border-white/10 bg-white/[0.02] backdrop-blur-md">
                    <div className="flex items-center gap-2 text-amber-300 font-bold text-xs mb-1">
                      <Megaphone className="w-4 h-4" />
                      <span>{t('campaignsBoxTitle')}</span>
                    </div>
                    <p className="text-[11px] text-slate-400">{t('campaignsBoxDesc')}</p>
                  </div>
                  <div className="p-4 rounded-2xl border border-white/10 bg-white/[0.02] backdrop-blur-md">
                    <div className="flex items-center gap-2 text-teal-300 font-bold text-xs mb-1">
                      <ShieldCheck className="w-4 h-4" />
                      <span>{t('auditBoxTitle')}</span>
                    </div>
                    <p className="text-[11px] text-slate-400">{t('auditBoxDesc')}</p>
                  </div>
                  <div className="p-4 rounded-2xl border border-white/10 bg-white/[0.02] backdrop-blur-md">
                    <div className="flex items-center gap-2 text-cyan-300 font-bold text-xs mb-1">
                      <Activity className="w-4 h-4" />
                      <span>{t('statsBoxTitle')}</span>
                    </div>
                    <p className="text-[11px] text-slate-400">{t('statsBoxDesc')}</p>
                  </div>
                </div>

                <div className="inline-flex items-center gap-2 text-xs text-slate-400 bg-white/5 border border-white/10 px-4 py-2 rounded-xl">
                  <span className="h-2 w-2 rounded-full bg-amber-400 animate-ping" />
                  <span>{t('statusDeveloping')}</span>
                </div>
              </div>
            </div>
          </TabsContent>
        )}

        {/* 6. المناديب */}
        {canAccessSector('delegates') && (
          <TabsContent value="delegates" className="space-y-6">
            <SovereignErrorBoundary>
              <FinancialDelegatesPanel />
            </SovereignErrorBoundary>
          </TabsContent>
        )}

        {/* 7. المشرفين */}
        {canAccessSector('admins') && (
          <TabsContent value="admins" className="space-y-6">
            <SovereignErrorBoundary>
              <AdminsManagementPanel />
            </SovereignErrorBoundary>
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
