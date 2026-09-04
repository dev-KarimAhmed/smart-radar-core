'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { dexieDb, type RiderTripLedgerEntry } from '@/lib/dexie-db';
import { fetchFavoriteCaptainIds, setFavoriteCaptain } from '../services/favorite-captains';
import { supabase } from '@/lib/supabase-client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Star, History, Award, BookOpen, Clock, Heart, Trash2, Phone, Sparkles, AlertCircle, FileText, Activity, Compass, ShieldCheck, Search, ShieldAlert, Lock, Coins, Megaphone, Sliders } from 'lucide-react';
import { SOVEREIGN_ERR_DICTIONARY } from '@/core/config/sovereign-errors';
import { useDashboardLanguage } from '@/hooks/use-dashboard-language';

import { cn } from '@/lib/utils';
const styles = {
  style361_1: "space-y-4 animate-pulse",
  style363_2: "bg-neutral-900/45 border border-white/5 p-4 rounded-xl space-y-3",
  style364_3: "flex justify-between items-start",
  style365_4: "space-y-2 w-2/3",
  style366_5: "h-4 bg-white/10 rounded w-3/4",
  style367_6: "h-3 bg-white/5 rounded w-1/2",
  style369_7: "h-6 bg-white/10 rounded w-16",
  style371_8: "pt-2 border-t border-white/5 flex gap-2",
  style372_9: "h-6 bg-white/5 rounded w-32",
  style830_10: "mt-3 rounded-xl border border-white/5 bg-white/[0.02] p-3 text-xs space-y-2 text-start",
  style831_11: "flex items-center gap-1.5 text-[#14F5D5] font-bold justify-start",
  style832_12: "h-3.5 w-3.5 fill-[#14F5D5] text-[#14F5D5]",
  style837_13: "flex flex-wrap gap-1 justify-start",
  style839_14: "inline-flex items-center bg-teal-500/10 text-teal-300 text-[10px] px-2 py-0.5 rounded border border-teal-500/10 font-bold",
  style847_15: "text-[11px] text-slate-300 italic border-r-2 border-emerald-500/40 pr-2 mt-1.5 leading-normal text-right",
  style857_16: "w-full max-w-xl mx-auto pb-24 text-start font-sans space-y-6 animate-in fade-in duration-500",
  style858_17: "bg-[#050505] border-emerald-950 text-white overflow-hidden shadow-2xl relative",
  style859_18: "absolute top-0 left-0 w-full h-1 bg-emerald-500 animate-pulse",
  style860_19: "p-6 space-y-2",
  style861_20: "text-lg font-black text-emerald-400 flex items-center gap-2",
  style862_21: "h-5 w-5 text-emerald-500",
  style865_22: "text-xs text-gray-400 leading-relaxed font-sans",
  style871_23: "bg-[#020502]/95 border border-emerald-950 shadow-xl",
  style872_24: "pb-3 border-b border-white/5 flex flex-row items-center justify-between",
  style874_25: "text-sm font-extrabold text-white flex items-center gap-1.5",
  style875_26: "h-4 w-4 text-emerald-500",
  style878_27: "text-[10px] text-gray-400 mt-1",
  style882_28: "text-[10px] border-emerald-500/20 text-emerald-400 bg-emerald-950/20 font-mono",
  style887_29: "p-4 space-y-3.5",
  style891_30: "p-8 text-center bg-black/40 border border-dashed border-white/5 rounded-xl",
  style892_31: "h-8 w-8 text-gray-600 mx-auto mb-2 animate-pulse",
  style893_32: "text-xs text-gray-400 font-medium",
  style903_33: "bg-black/40 border border-white/5 p-4 rounded-xl space-y-3 relative overflow-hidden group hover:border-emerald-500/20 transition-all",
  style907_34: "absolute top-4 right-4 p-1.5 rounded-lg bg-emerald-950/20 border border-emerald-500/10 text-rose-500 transition-all hover:scale-105 active:scale-95",
  style910_35: "h-4.5 w-4.5 transition-all",
  style910_36: "fill-[#00ffcc] text-[#00ffcc] drop-shadow-[0_0_8px_#00ffcc]",
  style910_37: "text-gray-400 hover:text-rose-400",
  style913_38: "flex justify-between items-start pr-8",
  style915_39: "font-extrabold text-sm text-white flex items-center gap-1.5",
  style917_40: "text-[9px] font-mono text-amber-400 bg-amber-950/20 border border-amber-500/10 px-1.5 py-0.5 rounded select-none",
  style921_41: "text-[11px] text-gray-400 font-sans mt-1",
  style923_42: "mt-1 inline-flex items-center gap-1 bg-[#011e15] text-[#00ffcc] text-[9px] font-mono px-1.5 py-0.5 rounded border border-emerald-500/20",
  style928_43: "text-right shrink-0",
  style929_44: "text-[12px] text-emerald-400 font-black font-mono block",
  style932_45: "text-[9px] text-gray-500 font-sans block mt-0.5",
  style941_46: "flex gap-2 pt-2 border-t border-white/5",
  style944_47: "px-3 py-1.5 bg-emerald-950/30 font-black text-[10px] text-emerald-400 border border-emerald-500/20 hover:bg-emerald-950/60 rounded-lg flex items-center gap-1 text-center select-none",
  style947_48: "h-3 w-3",
  style959_49: "bg-[#010301] border border-emerald-950 shadow-xl",
  style960_50: "pb-3 border-b border-white/5 flex flex-row items-center justify-between",
  style962_51: "text-sm font-extrabold text-[#00ffcc] flex items-center gap-1.5",
  style963_52: "h-4 w-4 text-emerald-400 animate-pulse",
  style966_53: "text-[10px] text-gray-400 mt-1",
  style970_54: "bg-emerald-950 text-emerald-400 text-[9px] border border-emerald-500/20",
  style974_55: "p-6 text-center text-gray-500 text-[11px]",
  style985_56: "w-full max-w-xl mx-auto pb-24 font-sans space-y-6 animate-in fade-in duration-500 text-start",
  style987_57: "bg-[#050505] border-emerald-950 text-white overflow-hidden shadow-2xl relative",
  style988_58: "absolute top-0 left-0 w-full h-1 bg-emerald-500 animate-pulse",
  style989_59: "p-6 space-y-2",
  style990_60: "text-lg font-black text-emerald-400 flex items-center gap-2",
  style991_61: "h-5 w-5 text-emerald-500",
  style994_62: "text-xs text-gray-400 leading-relaxed font-sans",
  style1002_63: "space-y-4",
  style1003_64: "bg-[#020502]/95 border border-emerald-950 shadow-xl",
  style1004_65: "pb-3 border-b border-white/5 flex flex-row items-center justify-between",
  style1006_66: "text-sm font-extrabold text-white flex items-center gap-1.5",
  style1007_67: "h-4 w-4 text-emerald-500",
  style1010_68: "text-[10px] text-gray-400 mt-1",
  style1014_69: "text-[10px] border-emerald-500/20 text-emerald-400 bg-emerald-950/20 font-mono",
  style1019_70: "p-4 space-y-3.5",
  style1023_71: "p-8 text-center bg-black/40 border border-dashed border-white/5 rounded-xl",
  style1024_72: "h-8 w-8 text-gray-600 mx-auto mb-2 animate-pulse",
  style1025_73: "text-xs text-gray-400 font-medium",
  style1035_74: "bg-black/40 border border-white/5 p-4 rounded-xl space-y-3 relative overflow-hidden group hover:border-emerald-500/20 transition-all",
  style1040_75: "absolute top-4 left-4 p-1.5 rounded-lg bg-emerald-950/20 border border-emerald-500/10 text-rose-500 transition-all hover:scale-105 active:scale-95",
  style1042_76: "h-4.5 w-4.5 transition-all",
  style1042_77: "fill-[#00ffcc] text-[#00ffcc] drop-shadow-[0_0_8px_#00ffcc]",
  style1042_78: "text-gray-400 hover:text-rose-400",
  style1045_79: "flex justify-between items-start pl-8",
  style1047_80: "font-extrabold text-sm text-white flex items-center gap-1.5",
  style1049_81: "text-[9px] font-mono text-amber-400 bg-amber-950/20 border border-amber-500/10 px-1.5 py-0.5 rounded select-none",
  style1053_82: "text-[11px] text-gray-400 font-sans mt-1",
  style1055_83: "mt-1 flex items-center",
  style1056_84: "inline-flex items-center gap-1 bg-[#011e15] text-[#00ffcc] text-[9px] font-mono px-1.5 py-0.5 rounded border border-emerald-500/20",
  style1062_85: "text-left shrink-0",
  style1063_86: "text-[12px] text-emerald-400 font-black font-mono block",
  style1066_87: "text-[9px] text-gray-500 font-sans block mt-0.5",
  style1074_88: "flex gap-2 pt-2 border-t border-white/5",
  style1077_89: "px-3 py-1.5 bg-emerald-950/30 font-black text-[10px] text-emerald-400 border border-emerald-500/20 hover:bg-emerald-950/60 rounded-lg flex items-center gap-1 text-center select-none",
  style1080_90: "h-3 w-3",
  style1092_91: "bg-[#010301] border border-emerald-950 shadow-xl",
  style1093_92: "pb-3 border-b border-white/5 flex flex-row items-center justify-between",
  style1095_93: "text-sm font-extrabold text-[#00ffcc] flex items-center gap-1.5",
  style1096_94: "h-4 w-4 text-emerald-400 animate-pulse",
  style1099_95: "text-[10px] text-gray-400 mt-1",
  style1103_96: "bg-emerald-950 text-emerald-400 text-[9px] border border-emerald-500/20",
  style1107_97: "p-4 space-y-3",
  style1109_98: "p-6 text-center text-gray-500 text-[11px]",
  style1111_99: "text-[#00ffcc]",
  style1113_100: "text-[#00ffcc]",
  style1117_101: "grid grid-cols-1 gap-2.5",
  style1121_102: "bg-[#060a06] border border-emerald-500/10 p-3 rounded-lg flex justify-between items-center",
  style1123_103: "space-y-0.5",
  style1124_104: "font-extrabold text-white text-[12px] flex items-center gap-1",
  style1126_105: "text-[8px] font-mono text-amber-500",
  style1128_106: "text-[10px] text-gray-400 leading-normal font-sans",
  style1131_107: "flex gap-1.5",
  style1134_108: "p-1 px-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-[10px] font-bold flex items-center gap-1 shrink-0",
  style1137_109: "h-3 w-3",
  style1143_110: "h-7 w-7 text-red-400 hover:bg-red-950/20 border border-transparent hover:border-red-500/20 rounded",
  style1145_111: "h-3.5 w-3.5",
  style1158_112: "space-y-6",
  style1159_113: "bg-[#020502]/95 border border-emerald-950 shadow-xl",
  style1160_114: "pb-3 border-b border-white/5 flex flex-row items-center justify-between",
  style1162_115: "text-sm font-extrabold text-white flex items-center gap-1.5",
  style1163_116: "h-4 w-4 text-emerald-500",
  style1166_117: "text-[10px] text-gray-400 mt-1 font-sans",
  style1170_118: "text-[10px] border-emerald-500/20 text-emerald-400 bg-emerald-950/20 font-mono",
  style1175_119: "p-4 space-y-3.5",
  style1179_120: "p-8 text-center bg-black/40 border border-dashed border-white/5 rounded-xl",
  style1180_121: "h-8 w-8 text-gray-600 mx-auto mb-2 animate-pulse",
  style1181_122: "text-xs text-gray-400 font-medium",
  style1190_123: "bg-black/40 border border-white/5 p-4 rounded-xl space-y-3 hover:border-emerald-500/20 transition-all font-mono",
  style1192_124: "flex justify-between items-start",
  style1194_125: "font-extrabold text-sm text-white flex items-center gap-1",
  style1197_126: "text-[11px] text-gray-400 font-sans mt-1",
  style1201_127: "mt-1 flex items-center",
  style1202_128: "inline-flex items-center gap-1 bg-[#011e15] text-[#00ffcc] text-[9px] font-mono px-1.5 py-0.5 rounded border border-emerald-500/20",
  style1208_129: "text-left shrink-0",
  style1209_130: "text-[12px] text-emerald-400 font-black block",
  style1212_131: "text-[9px] text-gray-500 font-sans block mt-0.5",
  style1225_132: "bg-[#020502]/95 border border-emerald-950/60 shadow-xl overflow-hidden relative text-right",
  style1226_133: "absolute top-0 left-0 w-full h-[3px] bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 animate-pulse",
  style1227_134: "pb-3 border-b border-white/5",
  style1228_135: "flex flex-row items-center justify-between",
  style1230_136: "text-sm font-black text-emerald-400 flex items-center gap-2",
  style1231_137: "h-5 w-5 text-emerald-500 animate-pulse",
  style1234_138: "text-[10px] text-gray-400 mt-1 font-sans",
  style1238_139: "text-[9px] border-emerald-500/30 text-emerald-300 bg-emerald-950/30 font-mono",
  style1243_140: "p-5 space-y-4",
  style1244_141: "p-4 bg-emerald-950/10 border border-emerald-500/10 rounded-xl space-y-3",
  style1245_142: "flex items-start gap-3",
  style1246_143: "p-2 bg-emerald-950/40 rounded-lg text-emerald-400 shrink-0 mt-0.5 border border-emerald-500/20",
  style1247_144: "h-4 w-4",
  style1249_145: "space-y-1",
  style1250_146: "text-xs font-bold text-white",
  style1251_147: "text-[11px] text-gray-400 leading-relaxed",
  style1257_148: "flex items-start gap-3 pt-3 border-t border-white/5",
  style1258_149: "p-2 bg-cyan-950/40 rounded-lg text-cyan-400 shrink-0 mt-0.5 border border-cyan-500/20",
  style1259_150: "h-4 w-4",
  style1261_151: "space-y-1",
  style1262_152: "text-xs font-bold text-white",
  style1263_153: "text-[11px] text-gray-400 leading-relaxed",
  style1269_154: "flex items-start gap-3 pt-3 border-t border-white/5",
  style1270_155: "p-2 bg-amber-950/40 rounded-lg text-amber-400 shrink-0 mt-0.5 border border-amber-500/20",
  style1271_156: "h-4 w-4",
  style1273_157: "space-y-1",
  style1274_158: "text-xs font-bold text-white",
  style1275_159: "text-[11px] text-gray-400 leading-relaxed",
  style1282_160: "flex items-center justify-between p-3 bg-black/40 border border-[#00ffcc]/10 rounded-lg",
  style1283_161: "flex items-center gap-2",
  style1284_162: "h-2 w-2 rounded-full bg-[#00ffcc] animate-ping",
  style1285_163: "text-[10px] text-gray-400 font-sans",
  style1286_164: "text-[10px] text-[#00ffcc] font-black font-mono",
  style1288_165: "text-[9px] text-gray-500 font-sans",
  style1294_166: "bg-[#020502]/95 border border-emerald-950 shadow-xl overflow-hidden relative text-right",
  style1295_167: "absolute top-0 left-0 w-full h-[2px] bg-cyan-500 animate-pulse",
  style1296_168: "pb-3 border-b border-white/5 flex flex-row items-center justify-between",
  style1298_169: "text-sm font-extrabold text-[#00ffcc] flex items-center gap-1.5",
  style1299_170: "h-4 w-4 text-[#00ffcc] animate-pulse",
  style1302_171: "text-[10px] text-gray-400 mt-1 font-sans",
  style1306_172: "flex items-center gap-2",
  style1312_173: "h-7 text-[10px] text-rose-400 hover:bg-rose-950/20 hover:text-rose-300 gap-1",
  style1314_174: "h-3 w-3",
  style1318_175: "text-[10px] border-cyan-500/20 text-cyan-400 bg-cyan-950/20 font-mono",
  style1324_176: "p-4 space-y-3",
  style1328_177: "p-8 text-center bg-black/40 border border-dashed border-white/5 rounded-xl space-y-2",
  style1329_178: "h-8 w-8 text-cyan-800 mx-auto animate-pulse",
  style1330_179: "text-xs text-gray-400 font-medium",
  style1331_180: "text-[10px] text-gray-500 leading-normal",
  style1336_181: "space-y-3 max-h-[400px] overflow-y-auto pr-1",
  style1351_182: "bg-black/40 border border-white/5 p-3 rounded-lg hover:border-cyan-500/10 transition-all font-sans space-y-1.5 text-right",
  style1353_183: "flex justify-between items-center",
  style1354_184: "text-[9px] font-bold px-2 py-0.5 rounded border",
  style1357_185: "text-[9px] text-gray-500 font-mono",
  style1361_186: "space-y-0.5",
  style1362_187: "text-[12px] font-black text-white",
  style1365_188: "text-[11px] text-gray-400 leading-normal",
  style1378_189: "bg-[#020502]/95 border border-[#00ffcc]/20 shadow-xl overflow-hidden relative text-right",
  style1379_190: "absolute top-0 left-0 w-full h-[2px] bg-[#00ffcc] animate-pulse",
  style1380_191: "pb-3 border-b border-white/5",
  style1381_192: "flex flex-row items-center justify-between",
  style1383_193: "text-sm font-extrabold text-[#00ffcc] flex items-center gap-1.5",
  style1384_194: "h-4 w-4 text-[#00ffcc] animate-pulse",
  style1387_195: "text-[10px] text-gray-400 mt-1 font-sans",
  style1391_196: "text-[10px] border-[#00ffcc]/20 text-[#00ffcc] bg-[#00ffcc]/5 font-mono",
  style1397_197: "mt-4 space-y-2.5",
  style1398_198: "relative",
  style1399_199: "absolute right-3 top-2.5 h-3.5 w-3.5 text-gray-500",
  style1405_200: "w-full bg-black/60 border border-white/5 rounded-lg py-2 pr-9 pl-3 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-[#00ffcc]/40 transition-all font-sans",
  style1409_201: "flex flex-wrap gap-1.5 justify-start",
  style1414_202: "h-7 text-[10px] font-bold px-2",
  style1414_203: "bg-[#00ffcc] text-black hover:bg-[#00ffcc]/80",
  style1414_204: "border-white/5 text-gray-400 hover:bg-white/5",
  style1422_205: "h-7 text-[10px] font-bold px-2",
  style1422_206: "bg-[#00ffcc] text-black hover:bg-[#00ffcc]/80",
  style1422_207: "border-white/5 text-gray-400 hover:bg-white/5",
  style1430_208: "h-7 text-[10px] font-bold px-2",
  style1430_209: "bg-[#00ffcc] text-black hover:bg-[#00ffcc]/80",
  style1430_210: "border-white/5 text-gray-400 hover:bg-white/5",
  style1438_211: "h-7 text-[10px] font-bold px-2",
  style1438_212: "bg-[#00ffcc] text-black hover:bg-[#00ffcc]/80",
  style1438_213: "border-white/5 text-gray-400 hover:bg-white/5",
  style1446_214: "h-7 text-[10px] font-bold px-2",
  style1446_215: "bg-[#00ffcc] text-black hover:bg-[#00ffcc]/80",
  style1446_216: "border-white/5 text-gray-400 hover:bg-white/5",
  style1454_217: "h-7 text-[10px] font-bold px-2",
  style1454_218: "bg-[#00ffcc] text-black hover:bg-[#00ffcc]/80",
  style1454_219: "border-white/5 text-gray-400 hover:bg-white/5",
  style1462_220: "p-4 space-y-3",
  style1464_221: "p-8 text-center bg-black/40 border border-dashed border-white/5 rounded-xl space-y-1.5",
  style1465_222: "h-6 w-6 text-gray-600 mx-auto",
  style1466_223: "text-xs text-gray-400",
  style1469_224: "grid grid-cols-1 gap-2 max-h-[400px] overflow-y-auto pr-1",
  style1472_225: "h-3.5 w-3.5 text-cyan-400",
  style1475_226: "h-3.5 w-3.5 text-emerald-400",
  style1478_227: "h-3.5 w-3.5 text-sky-400",
  style1481_228: "h-3.5 w-3.5 text-purple-400",
  style1484_229: "h-3.5 w-3.5 text-rose-400 animate-pulse",
  style1492_230: "border rounded-lg p-3 transition-all cursor-pointer text-right select-none",
  style1494_231: "bg-black/80 border-[#00ffcc]/40 shadow-[0_0_12px_rgba(0,255,204,0.08)]",
  style1495_232: "bg-black/40 border-white/5 hover:border-white/10",
  style1498_233: "flex justify-between items-center",
  style1499_234: "flex items-center gap-1.5",
  style1501_235: "text-[12px] font-black font-mono text-white",
  style1505_236: "text-[9px] text-gray-500 font-sans",
  style1510_237: "mt-1.5",
  style1511_238: "text-[12px] font-bold text-gray-200",
  style1517_239: "mt-3 pt-3 border-t border-white/5 space-y-2.5 animate-fadeIn text-right",
  style1518_240: "space-y-1",
  style1519_241: "text-[9px] text-gray-500 block",
  style1520_242: "text-[11px] text-gray-300 leading-normal",
  style1524_243: "bg-[#022a22]/30 border border-emerald-500/20 rounded p-2 space-y-1",
  style1525_244: "text-[9px] text-[#00ffcc] font-bold block",
  style1526_245: "text-[11px] text-emerald-300 leading-normal font-sans",
  logDefault: "border-cyan-500/10 text-cyan-400 bg-cyan-950/10",
  logSystem: "border-amber-500/10 text-amber-400 bg-amber-950/10",
  logDistrict: "border-rose-500/10 text-rose-400 bg-rose-950/10",
} as const;


interface HistoricalTrip {
  tripId: string;
  captainId?: string;
  serialId?: string;
  captainName: string;
  captainRank: 'PLATINUM' | 'GOLD' | 'SILVER' | 'BRONZE';
  captainPhone: string;
  vehicleInfo: string;
  finalPrice: number;
  timestamp: number;
}

const HISTORY_TTL_MS = 3 * 24 * 60 * 60 * 1000;
const UNAVAILABLE_AR = 'غير متاح';
const LOCAL_RIDER_AR = 'راكب';
const LOCAL_LOCATION_AR = 'موقعي الحالي';

function normalizeCaptainRank(value: unknown): HistoricalTrip['captainRank'] {
  const normalized = `${value || ''}`.toUpperCase();
  if (normalized.includes('PLATINUM')) return 'PLATINUM';
  if (normalized.includes('GOLD')) return 'GOLD';
  if (normalized.includes('SILVER')) return 'SILVER';
  return 'BRONZE';
}

function formatVehicleInfo(vehicle: any) {
  if (!vehicle || typeof vehicle !== 'object') return 'غير متاح';
  const parts = [
    vehicle.make,
    vehicle.vehicle_make,
    vehicle.brand,
    vehicle.vehicle_brand,
    vehicle.model,
    vehicle.vehicle_model,
    vehicle.color,
    vehicle.vehicle_color,
    vehicle.plate,
    vehicle.plate_number,
    vehicle.vehicle_plate,
  ].filter(Boolean);
  return parts.length > 0 ? parts.join(' - ') : 'غير متاح';
}

function isPlainRecord(value: unknown): value is Record<string, any> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function firstHistoryString(...values: unknown[]) {
  for (const value of values) {
    if (typeof value === 'string' && value.trim()) return value.trim();
    if (typeof value === 'number' && Number.isFinite(value)) return String(value);
  }
  return '';
}

function firstHistoryNumber(...values: unknown[]) {
  for (const value of values) {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return undefined;
}

function getCaptainIdFromTrip(trip: any) {
  return firstHistoryString(
    trip?.captain_id,
    trip?.accepted_captain_id,
    trip?.driver_id,
    trip?.captain?.id,
    trip?.captain_profile?.id,
    trip?.metadata?.captain_id,
    trip?.metadata?.captainId,
    trip?.acceptedOffer?.captain_id,
    trip?.acceptedOffer?.captain?.id,
    trip?.acceptedOffer?.driverId
  );
}

function getHistoryCaptainName(trip: any, acceptedOffer?: any) {
  return firstHistoryString(
    trip?.captain?.full_name,
    trip?.captain?.name,
    trip?.captain_profile?.full_name,
    trip?.metadata?.captain_name,
    trip?.metadata?.captainName,
    acceptedOffer?.driverName,
    acceptedOffer?.captain?.full_name,
    trip?.driver_name,
    trip?.captain_name,
    trip?.driverName
  ) || 'Captain';
}

function getHistoryCaptainPhone(trip: any, acceptedOffer?: any) {
  return firstHistoryString(
    trip?.captain?.phone,
    trip?.captain?.phone_number,
    trip?.captain_profile?.phone,
    trip?.metadata?.captain_phone,
    trip?.metadata?.captainPhone,
    acceptedOffer?.driverVehicle?.phone,
    acceptedOffer?.captain?.phone,
    trip?.driver_phone,
    trip?.captain_phone,
    trip?.driverPhone
  );
}

function getHistoryCaptainRank(trip: any, acceptedOffer?: any) {
  return normalizeCaptainRank(
    firstHistoryString(
      trip?.captain_rank,
      trip?.captainRank,
      trip?.captain?.rank,
      trip?.captain?.tier,
      trip?.captain_profile?.rank,
      trip?.captain_profile?.tier,
      trip?.captain_profile?.membership_tier,
      trip?.metadata?.captain_rank,
      trip?.metadata?.captainRank,
      acceptedOffer?.driverRank,
      acceptedOffer?.tier,
      trip?.driver_rank,
      trip?.driverRank
    ) || firstHistoryNumber(trip?.captain?.rating, trip?.captain?.trust_score, acceptedOffer?.driverRating, 5)
  );
}

function getHistoryVehicleInfo(trip: any, acceptedOffer?: any) {
  const metadata = isPlainRecord(trip?.metadata) ? trip.metadata : {};
  const vehicle = acceptedOffer?.driverVehicle || trip?.driver_vehicle || trip?.vehicle || {};
  const captainProfile = trip?.captain_profile || {};
  const captain = trip?.captain || {};
  const parts = [
    firstHistoryString(
      metadata.vehicle_make,
      metadata.vehicle_brand,
      captainProfile.vehicle_make,
      captainProfile.vehicle_brand,
      captain.vehicle_make,
      captain.vehicle_brand,
      vehicle.make,
      vehicle.vehicle_make,
      vehicle.brand,
      vehicle.vehicle_brand
    ),
    firstHistoryString(
      metadata.vehicle_model,
      captainProfile.vehicle_model,
      captain.vehicle_model,
      vehicle.model,
      vehicle.vehicle_model
    ),
    firstHistoryString(
      metadata.vehicle_color,
      captainProfile.vehicle_color,
      captain.vehicle_color,
      vehicle.color,
      vehicle.vehicle_color
    ),
    firstHistoryString(
      metadata.vehicle_year,
      captainProfile.vehicle_year,
      captain.vehicle_year,
      vehicle.year,
      vehicle.vehicle_year
    ),
    firstHistoryString(
      metadata.vehicle_plate,
      metadata.plate_number,
      captainProfile.vehicle_plate,
      captainProfile.plate_number,
      captain.vehicle_plate,
      captain.plate_number,
      vehicle.plate,
      vehicle.plate_number,
      vehicle.vehicle_plate
    ),
  ].filter(Boolean);

  return parts.length > 0
    ? parts.join(' - ')
    : firstHistoryString(metadata.vehicle_info, metadata.vehicleInfo, trip?.vehicleInfo, formatVehicleInfo(vehicle));
}

async function fetchRowsByIds(tableName: string, ids: string[]) {
  const uniqueIds = Array.from(new Set(ids.filter(Boolean)));
  if (uniqueIds.length === 0) return new Map<string, any>();

  try {
    const { data, error } = await supabase
      .from(tableName)
      .select('*')
      .in('id', uniqueIds);

    if (error || !data) {
      if (process.env.NODE_ENV !== 'production') console.warn(`[HistoryTab ${tableName} enrichment skipped]`, error);
      return new Map<string, any>();
    }

    return new Map(data.map((row: any) => [row.id, row]));
  } catch (error) {
    if (process.env.NODE_ENV !== 'production') console.warn(`[HistoryTab ${tableName} enrichment failed]`, error);
    return new Map<string, any>();
  }
}

async function enrichCaptainDetails(rows: any[]) {
  const captainIds = Array.from(new Set(rows.map(getCaptainIdFromTrip).filter(Boolean)));
  if (captainIds.length === 0) return rows;

  const [profileMap, captainProfileMap] = await Promise.all([
    fetchRowsByIds('profiles', captainIds),
    fetchRowsByIds('captain_profiles', captainIds),
  ]);

  return rows.map((row) => {
    const captainId = getCaptainIdFromTrip(row);
    const profile = captainId ? profileMap.get(captainId) : null;
    const captainProfile = captainId ? captainProfileMap.get(captainId) : null;
    const existingCaptain = isPlainRecord(row?.captain) ? row.captain : {};

    if (!profile && !captainProfile) return row;

    return {
      ...row,
      captain_id: row.captain_id || row.accepted_captain_id || captainId,
      captain: {
        ...existingCaptain,
        ...profile,
        ...(captainProfile ? {
          vehicle_type: captainProfile.vehicle_type,
          vehicle_brand: captainProfile.vehicle_brand,
          vehicle_model: captainProfile.vehicle_model,
          vehicle_year: captainProfile.vehicle_year,
          plate_number: captainProfile.plate_number,
          employment_type: captainProfile.employment_type,
          contact_page_url: captainProfile.contact_page_url,
          verification_status: captainProfile.verification_status,
        } : {}),
        id: captainId,
        full_name: firstHistoryString(profile?.full_name, existingCaptain.full_name, captainProfile?.full_name),
        phone: firstHistoryString(profile?.phone, existingCaptain.phone, captainProfile?.phone),
      },
      captain_profile: {
        ...(isPlainRecord(row?.captain_profile) ? row.captain_profile : {}),
        ...(captainProfile || {}),
      },
    };
  });
}

function parseTripTimestamp(trip: any) {
  const raw = trip.completed_at ?? trip.completedAt ?? trip.created_at ?? trip.createdAt ?? trip.timestamp;
  if (typeof raw === 'number') return raw;
  if (raw?.seconds) return raw.seconds * 1000;
  const parsed = Date.parse(String(raw || ''));
  return Number.isFinite(parsed) ? parsed : 0;
}

function getTripHistoryId(row: any) {
  return String(row?.id || row?.request_id || row?.tripId || '');
}

function appendUniqueTrips(existing: any[], incoming: any[]) {
  const seen = new Set(existing.map(getTripHistoryId).filter(Boolean));
  const merged = [...existing];

  for (const row of incoming) {
    const id = getTripHistoryId(row);
    if (!id || seen.has(id)) continue;
    merged.push(row);
    seen.add(id);
  }

  return merged;
}

function mapLedgerRowToTripShape(row: any, captain?: any, captainProfile?: any, rider?: any) {
  const metadata = row?.metadata && typeof row.metadata === 'object' ? row.metadata : {};
  const vehicleInfo =
    metadata.vehicle_info ||
    metadata.vehicleInfo ||
    metadata.vehicle ||
    [
      metadata.vehicle_make || captainProfile?.vehicle_brand || captain?.vehicle_make || captain?.vehicle_brand,
      metadata.vehicle_model || captainProfile?.vehicle_model || captain?.vehicle_model,
      metadata.vehicle_color || captainProfile?.vehicle_color || captain?.vehicle_color,
      metadata.vehicle_year || captainProfile?.vehicle_year || captain?.vehicle_year,
      metadata.vehicle_plate || metadata.plate_number || captainProfile?.plate_number || captain?.vehicle_plate || captain?.plate_number,
    ]
      .filter(Boolean)
      .join(' - ');

  return {
    id: row.request_id || row.id,
    request_id: row.request_id,
    status: row.status || 'COMPLETED',
    completed_at: row.completed_at,
    created_at: row.completed_at || row.created_at,
    final_fare: row.final_fare,
    captain_id: row.captain_id,
    rider_id: row.rider_id,
    rider: rider || (row.rider_id ? {
      id: row.rider_id,
      full_name: metadata.rider_name || metadata.riderName || '',
    } : null),
    captain: captain || {
      id: row.captain_id,
      full_name: metadata.captain_name || metadata.captainName || 'Captain',
      phone: metadata.captain_phone || metadata.captainPhone || '',
      rating: metadata.captain_rating || metadata.captainRating || 5,
    },
    captain_profile: captainProfile || null,
    captain_rank: metadata.captain_rank || metadata.captainRank || captainProfile?.tier || captainProfile?.rank || captain?.tier || captain?.rank,
    destination_address_ar: metadata.destination_address_ar || metadata.destinationAddressAr || metadata.destination || '',
    destination_address: metadata.destination_address || metadata.destinationAddress || metadata.destination || '',
    metadata: {
      ...metadata,
      vehicle_info: vehicleInfo || UNAVAILABLE_AR,
    },
  };
}

function tripShapeToRiderLedgerEntry(trip: any): RiderTripLedgerEntry | null {
  const tripId = getTripHistoryId(trip);
  const timestamp = parseTripTimestamp(trip);
  if (!tripId || !timestamp) return null;

  const acceptedOffer = trip.offers?.find((o: any) => o.driverId === trip.driverId) || trip.acceptedOffer;
  const vehicleInfo = getHistoryVehicleInfo(trip, acceptedOffer);

  return {
    tripId,
    captainId: getCaptainIdFromTrip(trip),
    captainName: getHistoryCaptainName(trip, acceptedOffer),
    captainRank: getHistoryCaptainRank(trip, acceptedOffer),
    captainPhone: getHistoryCaptainPhone(trip, acceptedOffer),
    vehicleInfo,
    finalPrice: Number(trip.final_fare ?? trip.settled_fare ?? trip.final_price ?? trip.offer_price ?? trip.server_estimated_fare ?? trip.offerPrice ?? 0),
    timestamp,
    purgeAt: timestamp + HISTORY_TTL_MS,
  };
}

function formatHistoryMoney(value: number, currencyLabel: string) {
  return currencyLabel ? `${Number(value).toFixed(2)} ${currencyLabel}` : Number(value).toFixed(2);
}

function HistorySkeleton() {
  return (
    <div className={styles.style361_1}>
      {[1, 2].map((i) => (
        <div key={i} className={styles.style363_2}>
          <div className={styles.style364_3}>
            <div className={styles.style365_4}>
              <div className={styles.style366_5} />
              <div className={styles.style367_6} />
            </div>
            <div className={styles.style369_7} />
          </div>
          <div className={styles.style371_8}>
            <div className={styles.style372_9} />
          </div>
        </div>
      ))}
    </div>
  );
}

const VEHICLE_CRITERIA_LABELS: Record<string, string> = {
  cleanliness: 'نظافة الصالون',
  ac: 'عمل التكييف بقوة',
  comfort: 'راحة المقاعد',
  quietness: 'هدوء المركبة',
  safety: 'سلامة السيارة وأحزمة الأمان',
};

const CAPTAIN_CRITERIA_LABELS: Record<string, string> = {
  behavior: 'الاحترام والأسلوب',
  driving: 'القيادة الآمنة والالتزام بالسرعة',
  punctuality: 'الالتزام بموقع الركوب والوقت',
  routing: 'اختيار مسار ذكي بدون زحام',
  communication: 'التجاوب والتواصل الاحترافي',
};

const VEHICLE_CRITERIA_LABELS_EN: Record<string, string> = {
  cleanliness: 'Clean salon',
  ac: 'Strong A/C',
  comfort: 'Comfortable seats',
  quietness: 'Quiet ride',
  safety: 'Safety & seatbelts',
};

const CAPTAIN_CRITERIA_LABELS_EN: Record<string, string> = {
  behavior: 'Respect & attitude',
  driving: 'Safe driving',
  punctuality: 'Punctual pickup',
  routing: 'Smart routing',
  communication: 'Professional communication',
};

export interface HistoryTabProps {
  // These "system/compliance" cards (Anti-Chattiness decree, captain activity
  // log, SSOT error explorer) live in this component but aren't trip records
  // — hide them on a screen meant to be trip history specifically.
  hideCaptainDiagnostics?: boolean;
}

export function HistoryTab({ hideCaptainDiagnostics = false }: HistoryTabProps = {}) {
  const { user, isCaptain, isPassenger } = useAuth();
  const { isArabic, language } = useDashboardLanguage();
  const copy = historyLanguageCopy[language];
  // NOT its own store any more. The ids come from the server (favoriteCaptainIds) and the
  // display details are read off the rider's own trips below, so there is exactly one place
  // that knows who is favourited. Keeping a second table of captain details was how the list
  // and the hearts drifted apart in the first place.
  // Captain ids, from the server. Keyed by captain so one favourite covers every trip with
  // them — the Dexie list above is keyed by trip and cannot answer that question.
  const [favoriteCaptainIds, setFavoriteCaptainIds] = useState<Set<string>>(new Set());
  const [sovereignLogs, setSovereignLogs] = useState<any[]>([]);
  const [realTrips, setRealTrips] = useState<any[]>([]);
  const [tripReviews, setTripReviews] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true); // مضاف خصيصاً لمنع انزياح CLS
  const { toast } = useToast();
  const currencyLabel = user?.currencyAr || user?.currencyEn || '';

  const [errorSearch, setErrorSearch] = useState('');
  const [errorCategory, setErrorCategory] = useState<string>('ALL');
  const [expandedErrorCode, setExpandedErrorCode] = useState<string | null>(null);

  const filteredErrors = useMemo(() => {
    const allErrors = Object.values(SOVEREIGN_ERR_DICTIONARY);
    return allErrors.filter((err) => {
      const matchesCategory = errorCategory === 'ALL' || err.code.startsWith(errorCategory);
      const matchesSearch =
        err.code.toLowerCase().includes(errorSearch.toLowerCase()) ||
        err.name.toLowerCase().includes(errorSearch.toLowerCase()) ||
        err.description.toLowerCase().includes(errorSearch.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [errorSearch, errorCategory]);

  const THREE_DAYS_MS = HISTORY_TTL_MS;
  const now = Date.now();

  /**
   * One source: fetchFavoriteCaptainIds. It reads the server, falls back to the
   * captain-keyed offline cache, and migrates any device-only legacy favourites on the way.
   * This screen no longer reads the per-trip Dexie table at all.
   */
  const loadFavorites = async () => {
    try {
      setFavoriteCaptainIds(await fetchFavoriteCaptainIds());
    } catch (e) {
      console.error('Failed to load favorites:', e);
    }
  };

  const loadSovereignLogs = async () => {
    if (!user?.uid || !isCaptain) return;
    try {
      const logs = await dexieDb.captainSovereignLogs
        .where('captainId')
        .equals(user.uid)
        .reverse()
        .sortBy('timestamp');
      setSovereignLogs(logs);
    } catch (e) {
      console.error("Failed to load captain sovereign logs from Dexie:", e);
    }
  };

  const clearSovereignLogs = async () => {
    if (!user?.uid) return;
    try {
      await dexieDb.captainSovereignLogs
        .where('captainId')
        .equals(user.uid)
        .delete();
      setSovereignLogs([]);
      toast({
        title: "🧹 تم تفريغ السجل المحلي",
        description: "تم مسح جميع سجلات الحركة والحالات المحلية من هاتفك بنجاح سائق."
      });
    } catch (err) {
      console.error("Failed to clear sovereign logs:", err);
    }
  };

  useEffect(() => {
    loadFavorites();
    if (isCaptain) {
      loadSovereignLogs();
    }

    const handleLogAdded = () => {
      if (isCaptain) {
        loadSovereignLogs();
      }
    };

    window.addEventListener('sovereign-log-added', handleLogAdded);
    return () => {
      window.removeEventListener('sovereign-log-added', handleLogAdded);
    };
  }, [user, isCaptain]);

  useEffect(() => {
    if (!user?.uid) {
      setRealTrips([]);
      setLoading(false);
      return;
    }

    let active = true;

    async function fetchTripHistory() {
      setLoading(true);
      try {
        const userColumn = isCaptain ? 'accepted_captain_id' : 'rider_id';
        let fetchedData: any[] = [];

        // 0. Primary history source: server ledger written by complete_ride_trip.
        // This keeps the screen correct even when ride_requests joins are unavailable.
        if (!isCaptain) {
          try {
            const { data: ledgerRows, error: ledgerError } = await supabase
              .from('trips_72h_ledger')
              .select('*')
              .eq('rider_id', user!.uid)
              .gt('purge_at', new Date().toISOString())
              .order('completed_at', { ascending: false });

            if (ledgerError) {
              if ((process.env.NODE_ENV !== 'production')) console.warn('[HistoryTab ledger fetch skipped]', ledgerError);
            } else if (ledgerRows && ledgerRows.length > 0) {
              const captainIds = Array.from(new Set(ledgerRows.map((row: any) => row.captain_id).filter(Boolean)));
              const [captainMap, captainProfileMap] = await Promise.all([
                fetchRowsByIds('profiles', captainIds),
                fetchRowsByIds('captain_profiles', captainIds),
              ]);

              const ledgerTrips = ledgerRows.map((row: any) => mapLedgerRowToTripShape(
                row,
                row.captain_id ? captainMap.get(row.captain_id) : null,
                row.captain_id ? captainProfileMap.get(row.captain_id) : null
              ));
              fetchedData = appendUniqueTrips(fetchedData, ledgerTrips);

              try {
                const cacheEntries = ledgerTrips
                  .map(tripShapeToRiderLedgerEntry)
                  .filter((entry): entry is RiderTripLedgerEntry => Boolean(entry));
                await Promise.all(cacheEntries.map((entry) => dexieDb.riderTripLedger.put(entry)));
              } catch (cacheError) {
                if ((process.env.NODE_ENV !== 'production')) console.warn('[HistoryTab ledger cache skipped]', cacheError);
              }
            }
          } catch (ledgerFetchError) {
            if ((process.env.NODE_ENV !== 'production')) console.warn('[HistoryTab ledger fetch failed]', ledgerFetchError);
          }
        } else {
          try {
            const { data: ledgerRows, error: ledgerError } = await supabase
              .from('trips_72h_ledger')
              .select('*')
              .eq('captain_id', user!.uid)
              .gt('purge_at', new Date().toISOString())
              .order('completed_at', { ascending: false });

            if (ledgerError) {
              if ((process.env.NODE_ENV !== 'production')) console.warn('[HistoryTab captain ledger fetch skipped]', ledgerError);
            } else if (ledgerRows && ledgerRows.length > 0) {
              const riderIds = Array.from(new Set(ledgerRows.map((row: any) => row.rider_id).filter(Boolean)));
              const riderMap = await fetchRowsByIds('profiles', riderIds);

              const ledgerTrips = ledgerRows.map((row: any) => mapLedgerRowToTripShape(
                row,
                undefined,
                undefined,
                row.rider_id ? riderMap.get(row.rider_id) : null,
              ));
              fetchedData = appendUniqueTrips(fetchedData, ledgerTrips);
            }
          } catch (ledgerFetchError) {
            if ((process.env.NODE_ENV !== 'production')) console.warn('[HistoryTab captain ledger fetch failed]', ledgerFetchError);
          }
        }

        // 1. Fetch from Supabase remote database
        try {
          const { data, error } = await supabase
            .from('ride_requests')
            .select(`
              *,
              rider:profiles!rider_id(id, full_name, phone, rating),
              captain:profiles!accepted_captain_id(id, full_name, phone, rating)
            `)
            .eq(userColumn, user!.uid)
            .eq('status', 'COMPLETED')
            .order('created_at', { ascending: false });

          if (error && error.code === 'PGRST200') {
            // Fallback: Query ride_requests and profiles separately to avoid foreign key relationship errors before migration runs
            const { data: rawRequests, error: reqError } = await supabase
              .from('ride_requests')
              .select(`
                *,
                rider:profiles!rider_id(id, full_name, phone, rating)
              `)
              .eq(userColumn, user!.uid)
              .eq('status', 'COMPLETED')
              .order('created_at', { ascending: false });

            if (reqError) throw reqError;

            if (rawRequests && rawRequests.length > 0) {
              const captainIds = Array.from(new Set(rawRequests.map(r => r.accepted_captain_id).filter(Boolean)));
              if (captainIds.length > 0) {
                const { data: captains, error: capError } = await supabase
                  .from('profiles')
                  .select('id, full_name, phone, rating')
                  .in('id', captainIds);
                
                if (!capError && captains) {
                  const captainMap = new Map(captains.map(c => [c.id, c]));
                  fetchedData = appendUniqueTrips(fetchedData, rawRequests.map(r => ({
                    ...r,
                    captain: r.accepted_captain_id ? captainMap.get(r.accepted_captain_id) : null
                  })));
                } else {
                  fetchedData = appendUniqueTrips(fetchedData, rawRequests);
                }
              } else {
                fetchedData = appendUniqueTrips(fetchedData, rawRequests);
              }
            }
          } else if (error) {
            throw error;
          } else {
            fetchedData = appendUniqueTrips(fetchedData, data || []);
          }
        } catch (supabaseError) {
          if ((process.env.NODE_ENV !== 'production')) console.warn('[HistoryTab Supabase Fetch Failed, falling back to local]', supabaseError);
        }

        if (fetchedData.length > 0) {
          fetchedData = await enrichCaptainDetails(fetchedData);
        }

        // 2. Fetch and merge from Dexie local database for offline-first compliance (SC55)
        try {
          if (isCaptain) {
            const localCaptainTrips = await dexieDb.captainLedger.toArray();
            const localMapped = localCaptainTrips.map(entry => ({
              id: entry.requestId,
              status: 'COMPLETED',
              completed_at: new Date(entry.completedAt).toISOString(),
              created_at: new Date(entry.completedAt).toISOString(),
              final_fare: entry.finalFare,
              rider: {
                full_name: 'راكب محلي',
                phone: '',
                rating: 5.0
              },
              destination_address_ar: entry.destination || 'غير متاح',
              destination_address: entry.destination || 'غير متاح',
              metadata: {
                pickup_address_ar: 'موقعي الحالي',
                destination_address_ar: entry.destination || 'غير متاح'
              }
            }));
            
            const seenIds = new Set(fetchedData.map(r => r.id));
            for (const item of localMapped) {
              if (!seenIds.has(item.id)) {
                fetchedData.push(item);
                seenIds.add(item.id);
              }
            }
          } else {
            const localRiderTrips = await dexieDb.riderTripLedger.toArray();
            const localMapped = localRiderTrips.map(entry => ({
              id: entry.tripId,
              captain_id: entry.captainId,
              status: 'COMPLETED',
              completed_at: new Date(entry.timestamp).toISOString(),
              created_at: new Date(entry.timestamp).toISOString(),
              final_fare: entry.finalPrice,
              captain: {
                id: entry.captainId,
                full_name: entry.captainName,
                phone: entry.captainPhone,
                rating: entry.captainRank === 'PLATINUM' ? 5.0 : entry.captainRank === 'GOLD' ? 4.5 : 4.0
              },
              metadata: {
                vehicle_info: entry.vehicleInfo
              }
            }));

            const seenIds = new Set(fetchedData.map(r => r.id));
            for (const item of localMapped) {
              if (!seenIds.has(item.id)) {
                fetchedData.push(item);
                seenIds.add(item.id);
              }
            }
          }
        } catch (dexieError) {
          if ((process.env.NODE_ENV !== 'production')) console.warn('[HistoryTab Dexie Merge Failed]', dexieError);
        }

        // 1.5 Fetch reviews for these trips to show detailed rating items
        try {
          const tripIds = fetchedData.map(r => r.id).filter(Boolean);
          if (tripIds.length > 0) {
            const { data: reviewsData, error: reviewsError } = await supabase
              .from('reviews')
              .select('*')
              .in('trip_id', tripIds);
            
            if (!reviewsError && reviewsData && active) {
              const reviewsMap: Record<string, any> = {};
              reviewsData.forEach(rev => {
                reviewsMap[rev.trip_id] = rev;
              });
              setTripReviews(reviewsMap);
            }
          }
        } catch (revErr) {
          if ((process.env.NODE_ENV !== 'production')) console.warn('[HistoryTab fetch reviews failed]', revErr);
        }

        if (active) setRealTrips(Array.isArray(fetchedData) ? fetchedData : []);
      } catch (error) {
        if (!active) return;
        if ((process.env.NODE_ENV !== 'production')) console.warn('[HistoryTab trips fetch]', error);
        setRealTrips([]);
      } finally {
        if (active) setLoading(false);
      }
    }

    void fetchTripHistory();

    return () => {
      active = false;
    };
  }, [user?.uid, isCaptain, toast]);

  const riderHistoricalTrips = useMemo<HistoricalTrip[]>(() => {
    const combinedReal = realTrips.map(trip => {
      const acceptedOffer = trip.offers?.find((o: any) => o.driverId === trip.driverId) || trip.acceptedOffer;
      return {
        tripId: trip.id,
        captainId: getCaptainIdFromTrip(trip),
        serialId: trip.serial_id || trip.serialId || ('T-' + trip.id.slice(0, 4).toUpperCase()),
        captainName: getHistoryCaptainName(trip, acceptedOffer),
        captainRank: getHistoryCaptainRank(trip, acceptedOffer),
        captainPhone: getHistoryCaptainPhone(trip, acceptedOffer),
        vehicleInfo: getHistoryVehicleInfo(trip, acceptedOffer),
        finalPrice: Number(trip.final_fare ?? trip.settled_fare ?? trip.final_price ?? trip.offer_price ?? trip.server_estimated_fare ?? trip.offerPrice ?? 0),
        timestamp: parseTripTimestamp(trip),
      };
    });

    const all = [...combinedReal];
    all.sort((a, b) => b.timestamp - a.timestamp);
    return all.filter(trip => (now - trip.timestamp) < THREE_DAYS_MS);
  }, [realTrips, now]);

  /**
   * The favourites list, derived rather than stored.
   *
   * One entry per favourited CAPTAIN, with the display details taken from the most recent
   * trip the rider took with them. Previously this rendered its own Dexie table of captain
   * details keyed by trip, so the same captain could appear several times in the list while
   * the hearts on the trips above disagreed with it.
   */
  const favoriteCaptains = useMemo(() => {
    const byCaptain = new Map<string, HistoricalTrip>();
    for (const trip of riderHistoricalTrips) {
      const captainId = String(trip.captainId || '');
      if (!captainId || !favoriteCaptainIds.has(captainId)) continue;
      // Trips are already newest-first, so the first one seen is the freshest snapshot of
      // this captain's name, vehicle and phone.
      if (!byCaptain.has(captainId)) byCaptain.set(captainId, trip);
    }

    // Spread the whole trip: the "remove" button in the list calls toggleFavorite, which
    // takes a HistoricalTrip. `id` is added because the list keys on it.
    return [...byCaptain.entries()].map(([captainId, trip]) => ({
      ...trip,
      id: captainId,
      captainId,
    }));
  }, [favoriteCaptainIds, riderHistoricalTrips]);

  const captainHistoricalTrips = useMemo(() => {
    const combinedReal = realTrips.map(trip => {
      return {
        tripId: trip.id,
        serialId: trip.serial_id || trip.serialId || ('T-' + trip.id.slice(0, 4).toUpperCase()),
        riderName: trip.rider?.full_name || trip.rider_name || trip.riderName || 'راكب',
        pickup: trip.metadata?.pickup_address_ar || trip.pickup_address_ar || trip.pickup || 'موقعي الحالي',
        dropoff: trip.destination_address_ar || trip.destination_address || trip.dropoff || 'غير متاح',
        earnedPrice: Number(trip.final_fare ?? trip.settled_fare ?? trip.final_price ?? trip.offer_price ?? trip.server_estimated_fare ?? trip.offerPrice ?? 0),
        timestamp: parseTripTimestamp(trip),
        status: trip.status || 'COMPLETED'
      };
    });

    const all = [...combinedReal];
    all.sort((a, b) => b.timestamp - a.timestamp);
    return all.filter(trip => (now - trip.timestamp) < THREE_DAYS_MS);
  }, [realTrips, now]);

  const toggleFavorite = async (trip: HistoricalTrip) => {
    // Decided per CAPTAIN, not per trip. Looking the existing record up by tripId is what
    // made the heart light up on one trip and stay empty on every other trip with the same
    // captain.
    const wasFavorite = trip.captainId ? favoriteCaptainIds.has(String(trip.captainId)) : false;

    // The server first, because this is the copy the CAPTAIN reads. The old code wrote only
    // Dexie and localStorage, so the captain's card never learned about it at all.
    if (trip.captainId) {
      try {
        await setFavoriteCaptain(String(trip.captainId), !wasFavorite);
        setFavoriteCaptainIds((current) => {
          const next = new Set(current);
          if (wasFavorite) next.delete(String(trip.captainId));
          else next.add(String(trip.captainId));
          return next;
        });
      } catch (error) {
        console.error('[Favorites] server write failed:', error);
        toast({
          variant: 'destructive',
          title: 'تعذر تحديث المفضلة',
          description: 'حاول تاني بعد شوية.',
        });
        return;
      }
    }

    // The per-trip Dexie row is gone. It was a second, differently-keyed copy of the same
    // fact — the row keyed by tripId, the localStorage key by captainId — so the two could
    // not agree with each other, let alone with the server. setFavoriteCaptain above owns
    // the write and keeps the captain-keyed offline cache.
    try {
      // Stale: an old build wrote this one keyed by TRIP. Cleared so it cannot linger.
      localStorage.removeItem(`radar_preferred_captain_${trip.tripId}`);

      if (trip.captainId) {
        if (wasFavorite) {
          localStorage.removeItem(`radar_preferred_captain_${trip.captainId}`);
        } else {
          // Kept: prioritizeRiderOffers reads these keys to float a preferred captain's
          // offer to the top of the auction.
          localStorage.setItem(`radar_preferred_captain_${trip.captainId}`, JSON.stringify({
            captainId: trip.captainId,
            fullName: trip.captainName,
            phoneNumber: trip.captainPhone,
            captainType: 'independent',
            vehicleSpecs: trip.vehicleInfo,
            savedTimestamp: Date.now(),
          }));
        }
      }
    } catch (err) {
      console.warn('Preferred-captain storage update failed:', err);
    }

    toast(wasFavorite
      ? {
          title: '💔 تم الإزالة من المفضلة',
          description: `تمت إزالة السائق ${trip.captainName} من قائمتك.`,
        }
      : {
          title: 'تم الحفظ بنجاح 🌟',
          description: 'تم إضافة السائق لمفضلتك — على كل رحلاتك معاه، وعلى أي جهاز.',
        });

    void loadFavorites();
  };

  const renderDetailedReview = (tripId: string) => {
    const review = tripReviews[tripId];
    if (!review) return null;

    const stars = review.detailed_stars || {};
    const captainObj = stars.captain || {};

    const activeCaptain = Object.keys(captainObj).filter(k => Number(captainObj[k]) === 1);

    if (activeCaptain.length === 0 && !review.comment) {
      return null;
    }

    const cLabels = isArabic ? CAPTAIN_CRITERIA_LABELS : CAPTAIN_CRITERIA_LABELS_EN;

    return (
      <div className={styles.style830_10}>
        <div className={styles.style831_11}>
          <Star className={styles.style832_12} />
          <span>{isArabic ? 'تقييمك المفصّل للكابتن:' : 'Your detailed feedback for captain:'}</span>
        </div>
        
        {activeCaptain.length > 0 && (
          <div className={styles.style837_13}>
            {activeCaptain.map(k => (
              <span key={k} className={styles.style839_14}>
                👤 {cLabels[k] || k}
              </span>
            ))}
          </div>
        )}

        {review.comment && (
          <p className={styles.style847_15}>
            &ldquo;{review.comment}&rdquo;
          </p>
        )}
      </div>
    );
  };

  if (language === 'en' && isPassenger) {
    return (
      <div className={styles.style857_16}>
        <Card className={styles.style858_17}>
          <div className={styles.style859_18} />
          <CardContent className={styles.style860_19}>
            <h2 className={styles.style861_20}>
              <History className={styles.style862_21} />
              My trips
            </h2>
            <p className={styles.style865_22}>
              Review your recent completed trips. Trips older than 72 hours are removed to protect your privacy.
            </p>
          </CardContent>
        </Card>

        <Card className={styles.style871_23}>
          <CardHeader className={styles.style872_24}>
            <div>
              <CardTitle className={styles.style874_25}>
                <FileText className={styles.style875_26} />
                Recent trips (last 3 days)
              </CardTitle>
              <CardDescription className={styles.style878_27}>
                Trips completed from your account
              </CardDescription>
            </div>
            <Badge variant="outline" className={styles.style882_28}>
              {riderHistoricalTrips.length} trips
            </Badge>
          </CardHeader>

          <CardContent className={styles.style887_29}>
            {loading ? (
              <HistorySkeleton />
            ) : riderHistoricalTrips.length === 0 ? (
              <div className={styles.style891_30}>
                <AlertCircle className={styles.style892_31} />
                <p className={styles.style893_32}>No completed trips in the last 72 hours.</p>
              </div>
            ) : (
              riderHistoricalTrips.map((trip) => {
                const isHearted = favoriteCaptainIds.has(String(trip.captainId));
                const timeAgo = Math.floor((now - trip.timestamp) / (1000 * 60 * 60));

                return (
                  <div
                    key={trip.tripId}
                    className={styles.style903_33}
                  >
                    <button
                      onClick={() => toggleFavorite(trip)}
                      className={styles.style907_34}
                      aria-label="Save captain"
                    >
                      <Heart className={cn(styles.style910_35, isHearted ? styles.style910_36 : styles.style910_37)} />
                    </button>

                    <div className={styles.style913_38}>
                      <div>
                        <h4 className={styles.style915_39}>
                          {trip.captainName}
                          <span className={styles.style917_40}>
                            [{trip.captainRank}]
                          </span>
                        </h4>
                        <p className={styles.style921_41}>{trip.vehicleInfo}</p>
                        {trip.serialId && (
                          <span className={styles.style923_42}>
                            {trip.serialId}
                          </span>
                        )}
                      </div>
                      <div className={styles.style928_43}>
                        <span className={styles.style929_44}>
                          {formatHistoryMoney(trip.finalPrice, currencyLabel)}
                        </span>
                        <span className={styles.style932_45}>
                          {timeAgo === 0 ? 'Less than 1 hour ago' : `${timeAgo} hours ago`}
                        </span>
                      </div>
                    </div>

                    {renderDetailedReview(trip.tripId)}

                    {trip.captainPhone && (
                      <div className={styles.style941_46}>
                        <a
                          href={`tel:${trip.captainPhone}`}
                          className={styles.style944_47}
                          style={{ textDecoration: 'none' }}
                        >
                          <Phone className={styles.style947_48} />
                          <span>Call captain about this trip</span>
                        </a>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>

        <Card className={styles.style959_49}>
          <CardHeader className={styles.style960_50}>
            <div>
              <CardTitle className={styles.style962_51}>
                <Sparkles className={styles.style963_52} />
                Favorite captains
              </CardTitle>
              <CardDescription className={styles.style966_53}>
                Captains you marked as favorites from previous trips
              </CardDescription>
            </div>
            <Badge className={styles.style970_54}>
              {favoriteCaptains.length} favorite
            </Badge>
          </CardHeader>
          <CardContent className={styles.style974_55}>
            {favoriteCaptains.length === 0
              ? 'Tap the heart on any completed trip to add the captain here.'
              : 'Your favorite captains are available from completed trip cards.'}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className={styles.style985_56}>
      {/* 1. Header Card */}
      <Card className={styles.style987_57}>
        <div className={styles.style988_58} />
        <CardContent className={styles.style989_59}>
          <h2 className={styles.style990_60}>
            <History className={styles.style991_61} />
            {copy.title}
          </h2>
          <p className={styles.style994_62}>
            {copy.subtitle}
          </p>
        </CardContent>
      </Card>

      {/* 2. Primary Listing */}
      {isPassenger && (
        <div className={styles.style1002_63}>
          <Card className={styles.style1003_64}>
            <CardHeader className={styles.style1004_65}>
              <div>
                <CardTitle className={styles.style1006_66}>
                  <FileText className={styles.style1007_67} />
                  {copy.recentTripsTitle}
                </CardTitle>
                <CardDescription className={styles.style1010_68}>
                  {copy.recentTripsDesc}
                </CardDescription>
              </div>
              <Badge variant="outline" className={styles.style1014_69}>
                {riderHistoricalTrips.length} {copy.tripCount}
              </Badge>
            </CardHeader>

            <CardContent className={styles.style1019_70}>
              {loading ? (
                <HistorySkeleton />
              ) : riderHistoricalTrips.length === 0 ? (
                <div className={styles.style1023_71}>
                  <AlertCircle className={styles.style1024_72} />
                  <p className={styles.style1025_73}>{copy.noTrips}</p>
                </div>
              ) : (
                riderHistoricalTrips.map((trip) => {
                  const isHearted = favoriteCaptainIds.has(String(trip.captainId));
                  const timeAgo = Math.floor((now - trip.timestamp) / (1000 * 60 * 60));

                  return (
                    <div
                      key={trip.tripId}
                      className={styles.style1035_74}
                    >
                      {/* Heart action */}
                      <button
                        onClick={() => toggleFavorite(trip)}
                        className={styles.style1040_75}
                      >
                        <Heart className={cn(styles.style1042_76, isHearted ? styles.style1042_77 : styles.style1042_78)} />
                      </button>

                      <div className={styles.style1045_79}>
                        <div>
                          <h4 className={styles.style1047_80}>
                            🚗 {trip.captainName}
                            <span className={styles.style1049_81}>
                              [{trip.captainRank}]
                            </span>
                          </h4>
                          <p className={styles.style1053_82}>{trip.vehicleInfo}</p>
                          {trip.serialId && (
                            <div className={styles.style1055_83}>
                              <span className={styles.style1056_84}>
                                🧬 {trip.serialId}
                              </span>
                            </div>
                          )}
                        </div>
                        <div className={styles.style1062_85}>
                          <span className={styles.style1063_86}>
                            {formatHistoryMoney(trip.finalPrice, currencyLabel)}
                          </span>
                          <span className={styles.style1066_87}>
                            {isArabic ? 'قبل' : ''} {timeAgo === 0 ? copy.lessThanHour : `${timeAgo} ${copy.hours}`} {isArabic ? '' : 'ago'}
                          </span>
                        </div>
                      </div>

                    {renderDetailedReview(trip.tripId)}

                    <div className={styles.style1074_88}>
                      <a
                        href={`tel:${trip.captainPhone}`}
                          className={styles.style1077_89}
                          style={{ textDecoration: 'none' }}
                        >
                          <Phone className={styles.style1080_90} />
                          <span>{copy.callCaptain}</span>
                        </a>
                      </div>
                    </div>
                  );
                })
              )}
            </CardContent>
          </Card>

          {/* Favorited Captains Quick Vault Section */}
          <Card className={styles.style1092_91}>
            <CardHeader className={styles.style1093_92}>
              <div>
                <CardTitle className={styles.style1095_93}>
                  <Sparkles className={styles.style1096_94} />
                  {copy.savedCaptainsTitle}
                </CardTitle>
                <CardDescription className={styles.style1099_95}>
                  {copy.savedCaptainsDesc}
                </CardDescription>
              </div>
              <Badge className={styles.style1103_96}>
                {favoriteCaptains.length} {isArabic ? 'سائق' : 'drivers'}
              </Badge>
            </CardHeader>
            <CardContent className={styles.style1107_97}>
              {favoriteCaptains.length === 0 ? (
                <div className={styles.style1109_98}>
                  {isArabic ? (
                    <>اضغط على أيقونة <strong className={styles.style1111_99}>القلب</strong> في أي رحلة مكتملة لإضافة السائق إلى المفضلة.</>
                  ) : (
                    <>Click the <strong className={styles.style1113_100}>heart</strong> icon on any completed trip to add the driver to your favorites.</>
                  )}
                </div>
              ) : (
                <div className={styles.style1117_101}>
                  {favoriteCaptains.map((captain) => (
                    <div
                      key={captain.id}
                      className={styles.style1121_102}
                    >
                      <div className={styles.style1123_103}>
                        <h5 className={styles.style1124_104}>
                          👤 {captain.captainName}
                          <span className={styles.style1126_105}>[{captain.captainRank || 'GOLD'}]</span>
                        </h5>
                        <p className={styles.style1128_106}>{captain.vehicleInfo}</p>
                      </div>

                      <div className={styles.style1131_107}>
                        <a
                          href={`tel:${captain.captainPhone}`}
                          className={styles.style1134_108}
                          style={{ textDecoration: 'none' }}
                        >
                          <Phone className={styles.style1137_109} /> {copy.call}
                        </a>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => toggleFavorite(captain)}
                          className={styles.style1143_110}
                        >
                          <Trash2 className={styles.style1145_111} />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {isCaptain && (
        <div className={styles.style1158_112}>
          <Card className={styles.style1159_113}>
            <CardHeader className={styles.style1160_114}>
              <div>
                <CardTitle className={styles.style1162_115}>
                  <FileText className={styles.style1163_116} />
                  {copy.captainSectionTitle}
                </CardTitle>
                <CardDescription className={styles.style1166_117}>
                  {copy.captainSectionDesc}
                </CardDescription>
              </div>
              <Badge variant="outline" className={styles.style1170_118}>
                {captainHistoricalTrips.length} {isArabic ? 'مهمة' : 'tasks'}
              </Badge>
            </CardHeader>

            <CardContent className={styles.style1175_119}>
              {loading ? (
                <HistorySkeleton />
              ) : captainHistoricalTrips.length === 0 ? (
                <div className={styles.style1179_120}>
                  <AlertCircle className={styles.style1180_121} />
                  <p className={styles.style1181_122}>{isArabic ? "لا توجد مهام ميدانية منجزة مسجلة لمنطقة حالياً." : "No completed field tasks recorded for this area currently."}</p>
                </div>
              ) : (
                captainHistoricalTrips.map((trip) => {
                  const timeAgo = Math.floor((now - trip.timestamp) / (1000 * 60 * 60));

                  return (
                    <div
                      key={trip.tripId}
                      className={styles.style1190_123}
                    >
                      <div className={styles.style1192_124}>
                        <div>
                          <h4 className={styles.style1194_125}>
                            👤 {isArabic ? 'الراكب' : 'Rider'}: {trip.riderName}
                          </h4>
                          <p className={styles.style1197_126}>
                            {isArabic ? 'من' : 'From'}: {trip.pickup} ➔ {isArabic ? 'إلى' : 'To'}: {trip.dropoff}
                          </p>
                          {trip.serialId && (
                            <div className={styles.style1201_127}>
                              <span className={styles.style1202_128}>
                                🧬 {trip.serialId}
                              </span>
                            </div>
                          )}
                        </div>
                        <div className={styles.style1208_129}>
                          <span className={styles.style1209_130}>
                            +{formatHistoryMoney(trip.earnedPrice, currencyLabel)}
                          </span>
                          <span className={styles.style1212_131}>
                            {isArabic ? 'قبل' : ''} {timeAgo} {copy.hours} {isArabic ? '' : 'ago'}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </CardContent>
          </Card>

          {hideCaptainDiagnostics ? null : (
          <>
          {/* براءة ذمة نقاء النظام الحافة من الثرثرة الشبكية وقنوات المساعدة */}
          <Card className={styles.style1225_132}>
            <div className={styles.style1226_133} />
            <CardHeader className={styles.style1227_134}>
              <div className={styles.style1228_135}>
                <div>
                  <CardTitle className={styles.style1230_136}>
                    <ShieldCheck className={styles.style1231_137} />
                    وثيقة براءة الذمة  ونقاء النظام (Anti-Chattiness & Zero-Chat Decree)
                  </CardTitle>
                  <CardDescription className={styles.style1234_138}>
                    شهادة هندسية معتمدة تثبت خلو النظام تماماً من أي بروتوكولات دردشة مساعدة أو استهلاك عشوائي للباقة
                  </CardDescription>
                </div>
                <Badge variant="outline" className={styles.style1238_139}>
                  SECURE-V2.6
                </Badge>
              </div>
            </CardHeader>
            <CardContent className={styles.style1243_140}>
              <div className={styles.style1244_141}>
                <div className={styles.style1245_142}>
                  <div className={styles.style1246_143}>
                    <Lock className={styles.style1247_144} />
                  </div>
                  <div className={styles.style1249_145}>
                    <h5 className={styles.style1250_146}>صفر تعقيد وصفر ثرثرة شبكية (Zero-Chat Mandate)</h5>
                    <p className={styles.style1251_147}>
                      لا توجد قنوات محادثة خلفية أو دردشة معقدة تستهلك باقة الإنترنت. التواصل يتم عبر روابط مباشرة لتقليل الضغط على الشبكة.
                    </p>
                  </div>
                </div>

                <div className={styles.style1257_148}>
                  <div className={styles.style1258_149}>
                    <Activity className={styles.style1259_150} />
                  </div>
                  <div className={styles.style1261_151}>
                    <h5 className={styles.style1262_152}>النشاط المالي والربط  المؤتمت</h5>
                    <p className={styles.style1263_153}>
                      يتم جلب النشاط والرحلات عند الحاجة المباشرة فقط (Event-Driven) دون ثرثرة شبكية مستمرة (No polling chat networks). تلتزم شاشة السجل بمبدأ المحكم الرقمي القطعي (SSOT) بنسبة 100%.
                    </p>
                  </div>
                </div>

                <div className={styles.style1269_154}>
                  <div className={styles.style1270_155}>
                    <Sliders className={styles.style1271_156} />
                  </div>
                  <div className={styles.style1273_157}>
                    <h5 className={styles.style1274_158}>تصفية السجلات المؤتمت (72-Hour Auto Purge)</h5>
                    <p className={styles.style1275_159}>
                      امتثالاً للمحدد الثالث في بنود المعمارية المحلية الحافة، يتم إيقاف ومسح جميع تفاصيل الحركة ميكانيكياً بعد مرور 72 ساعة ثابتة من هاتفك وخادم النظام لحماية خصوصيتك وصفرية التكلفة الحافة.
                    </p>
                  </div>
                </div>
              </div>

              <div className={styles.style1282_160}>
                <div className={styles.style1283_161}>
                  <div className={styles.style1284_162} />
                  <span className={styles.style1285_163}>حالة نقاء خطوط النقل الحالية:</span>
                  <span className={styles.style1286_164}>100% PURE & SECURE</span>
                </div>
                <span className={styles.style1288_165}>براءة ذمة معتمدة ومختومة رقمياً 🛡️</span>
              </div>
            </CardContent>
          </Card>

          {/* Dedicated Sovereign Logs (سجل خاص به ويكون مرجعًا له) */}
          <Card className={styles.style1294_166}>
            <div className={styles.style1295_167} />
            <CardHeader className={styles.style1296_168}>
              <div>
                <CardTitle className={styles.style1298_169}>
                  <Activity className={styles.style1299_170} />
                  سجل الفعاليات والحركة اللامركزية (الأرشيف )
                </CardTitle>
                <CardDescription className={styles.style1302_171}>
                  سجل قطاع الناقل الميداني الذاتي لمراقبة تبديل الحالة ومحيط المنطقة
                </CardDescription>
              </div>
              <div className={styles.style1306_172}>
                {sovereignLogs.length > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearSovereignLogs}
                    className={styles.style1312_173}
                  >
                    <Trash2 className={styles.style1314_174} />
                    مسح السجل
                  </Button>
                )}
                <Badge variant="outline" className={styles.style1318_175}>
                  {sovereignLogs.length} حركة
                </Badge>
              </div>
            </CardHeader>

            <CardContent className={styles.style1324_176}>
              {loading ? (
                <HistorySkeleton />
              ) : sovereignLogs.length === 0 ? (
                <div className={styles.style1328_177}>
                  <ShieldCheck className={styles.style1329_178} />
                  <p className={styles.style1330_179}>السجل خاوٍ حالياً سائق.</p>
                  <p className={styles.style1331_180}>
                    سيتم تلقائياً تخليد الحركات الميدانية مثل تبديل الحالة بين النشط والخامل، التعطيل التلقائي بسبب الخمول أو نفاد الباقة، وخروجك من محيط المنطقة هنا كمرجع  آمن وأمني لك.
                  </p>
                </div>
              ) : (
                <div className={styles.style1336_181}>
                  {sovereignLogs.map((log) => {
                    let badgeColor: string = styles.logDefault;
                    let iconEmoji = "🧭";
                    if (log.type === 'system_action') {
                      badgeColor = styles.logSystem;
                      iconEmoji = "🤖";
                    } else if (log.type === 'district_exit') {
                      badgeColor = styles.logDistrict;
                      iconEmoji = "🗺️";
                    }

                    return (
                      <div
                        key={log.id}
                        className={styles.style1351_182}
                      >
                        <div className={styles.style1353_183}>
                          <span className={cn(styles.style1354_184, badgeColor)}>
                            {iconEmoji} {log.type === 'status_change' ? 'تعديل الحالة' : log.type === 'system_action' ? 'إجراء النظام' : 'تخطي الحدود'}
                          </span>
                          <span className={styles.style1357_185}>
                            ⏱️ {log.timeString}
                          </span>
                        </div>
                        <div className={styles.style1361_186}>
                          <h5 className={styles.style1362_187}>
                            {log.event}
                          </h5>
                          <p className={styles.style1365_188}>
                            {log.details}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* كشاف القاموس  للأخطاء (SSOT Error Explorer) */}
          <Card id="ssot-error-explorer-card" className={styles.style1378_189}>
            <div className={styles.style1379_190} />
            <CardHeader className={styles.style1380_191}>
              <div className={styles.style1381_192}>
                <div>
                  <CardTitle className={styles.style1383_193}>
                    <ShieldAlert className={styles.style1384_194} />
                    كشاف القاموس  للأخطاء (SSOT Error Explorer)
                  </CardTitle>
                  <CardDescription className={styles.style1387_195}>
                    أداة فحص تفاعلية لرموز الأمان والمحكم الميداني الحافة
                  </CardDescription>
                </div>
                <Badge variant="outline" className={styles.style1391_196}>
                  V5.5-Secured
                </Badge>
              </div>

              {/* البحث و الفلترة */}
              <div className={styles.style1397_197}>
                <div className={styles.style1398_198}>
                  <Search className={styles.style1399_199} />
                  <input
                    type="text"
                    placeholder="ابحث بكود الخطأ، الاسم، أو الإجراء الوقائي..."
                    value={errorSearch}
                    onChange={(e) => setErrorSearch(e.target.value)}
                    className={styles.style1405_200}
                  />
                </div>

                <div className={styles.style1409_201}>
                  <Button
                    variant={errorCategory === 'ALL' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setErrorCategory('ALL')}
                    className={cn(styles.style1414_202, errorCategory === 'ALL' ? styles.style1414_203 : styles.style1414_204)}
                  >
                    الكل
                  </Button>
                  <Button
                    variant={errorCategory === 'ERR-SOV' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setErrorCategory('ERR-SOV')}
                    className={cn(styles.style1422_205, errorCategory === 'ERR-SOV' ? styles.style1422_206 : styles.style1422_207)}
                  >
                    🛡️ الإدارة
                  </Button>
                  <Button
                    variant={errorCategory === 'ERR-FIN' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setErrorCategory('ERR-FIN')}
                    className={cn(styles.style1430_208, errorCategory === 'ERR-FIN' ? styles.style1430_209 : styles.style1430_210)}
                  >
                    💸 النشاط المالي
                  </Button>
                  <Button
                    variant={errorCategory === 'ERR-MAP' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setErrorCategory('ERR-MAP')}
                    className={cn(styles.style1438_211, errorCategory === 'ERR-MAP' ? styles.style1438_212 : styles.style1438_213)}
                  >
                    🗺️ المحكم الرقمي
                  </Button>
                  <Button
                    variant={errorCategory === 'ERR-ADV' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setErrorCategory('ERR-ADV')}
                    className={cn(styles.style1446_214, errorCategory === 'ERR-ADV' ? styles.style1446_215 : styles.style1446_216)}
                  >
                    📢 الإعلانات
                  </Button>
                  <Button
                    variant={errorCategory === 'ERR-KNL' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setErrorCategory('ERR-KNL')}
                    className={cn(styles.style1454_217, errorCategory === 'ERR-KNL' ? styles.style1454_218 : styles.style1454_219)}
                  >
                    🎛️ الكوابح
                  </Button>
                </div>
              </div>
            </CardHeader>

            <CardContent className={styles.style1462_220}>
              {filteredErrors.length === 0 ? (
                <div className={styles.style1464_221}>
                  <AlertCircle className={styles.style1465_222} />
                  <p className={styles.style1466_223}>لا توجد رموز أخطاء تطابق بحثك حالياً.</p>
                </div>
              ) : (
                <div className={styles.style1469_224}>
                  {filteredErrors.map((err) => {
                    const isExpanded = expandedErrorCode === err.code;
                    let categoryIcon = <Lock className={styles.style1472_225} />;
                    let label = "إدارة وصلاحيات";
                    if (err.code.startsWith('ERR-FIN')) {
                      categoryIcon = <Coins className={styles.style1475_226} />;
                      label = "نشاط مالي ومحفظة";
                    } else if (err.code.startsWith('ERR-MAP')) {
                      categoryIcon = <Compass className={styles.style1478_227} />;
                      label = "محكم رقمي وخرائط";
                    } else if (err.code.startsWith('ERR-ADV')) {
                      categoryIcon = <Megaphone className={styles.style1481_228} />;
                      label = "حملات إعلانية";
                    } else if (err.code.startsWith('ERR-KNL')) {
                      categoryIcon = <Sliders className={styles.style1484_229} />;
                      label = "نواة السيطرة والكبح";
                    }

                    return (
                      <div
                        key={err.code}
                        onClick={() => setExpandedErrorCode(isExpanded ? null : err.code)}
                        className={cn(styles.style1492_230, isExpanded
                            ? styles.style1494_231
                            : styles.style1495_232)}
                      >
                        <div className={styles.style1498_233}>
                          <div className={styles.style1499_234}>
                            {categoryIcon}
                            <span className={styles.style1501_235}>
                              {err.code}
                            </span>
                          </div>
                          <span className={styles.style1505_236}>
                            {label}
                          </span>
                        </div>

                        <div className={styles.style1510_237}>
                          <h4 className={styles.style1511_238}>
                            {err.name}
                          </h4>
                        </div>

                        {isExpanded && (
                          <div className={styles.style1517_239}>
                            <div className={styles.style1518_240}>
                              <span className={styles.style1519_241}>الوصف الأمني للخلل:</span>
                              <p className={styles.style1520_242}>
                                {err.description}
                              </p>
                            </div>
                            <div className={styles.style1524_243}>
                              <span className={styles.style1525_244}>🛡️ الإجراء الوقائي الآلي الحافة:</span>
                              <p className={styles.style1526_245}>
                                {err.action}
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
          </>
          )}
        </div>
      )}
    </div>
  );
}


const historyLanguageCopy = {
  ar: {
    title: 'رحلاتي',
    subtitle: 'راجع رحلاتك الأخيرة. يتم حذف الرحلات التي مر عليها أكثر من 72 ساعة لحماية خصوصيتك.',
    recentTripsTitle: 'الرحلات الأخيرة (آخر 3 أيام)',
    recentTripsDesc: 'الرحلات التي اكتملت من حسابك',
    tripCount: 'رحلة',
    noTrips: 'لا توجد رحلات نشطة مسجلة في آخر 72 ساعة.',
    before: 'قبل',
    lessThanHour: 'أقل من ساعة',
    hours: 'ساعة',
    callCaptain: 'اتصال بالسائق بخصوص الرحلة',
    savedCaptainsTitle: 'السائقون المفضلون',
    savedCaptainsDesc: 'السائقون الذين حفظتهم من رحلاتك السابقة',
    call: 'اتصل',
    captainSectionTitle: 'سجل العوائد والمهام الميدانية المنجزة',
    captainSectionDesc: 'المهام المعتمدة الموثقة بمركز النشاط',
    commission: 'العمولة المستحقة',
    status: 'الحالة',
    active: 'نشط',
    pending: 'قيد الانتظار',
  },
  en: {
    title: 'My Trips',
    subtitle: 'Review your recent trips. Trips older than 72 hours are automatically deleted to protect your privacy.',
    recentTripsTitle: 'Recent Trips (Last 3 Days)',
    recentTripsDesc: 'Completed trips from your account',
    tripCount: 'trips',
    noTrips: 'No active trips recorded in the last 72 hours.',
    before: 'ago',
    lessThanHour: 'less than an hour',
    hours: 'hours',
    callCaptain: 'Call driver regarding this trip',
    savedCaptainsTitle: 'Favorite Drivers',
    savedCaptainsDesc: 'Drivers you marked as favorites from your previous trips',
    call: 'Call',
    captainSectionTitle: 'Earnings & Completed Tasks History',
    captainSectionDesc: 'Approved tasks documented at the activity center',
    commission: 'Commission due',
    status: 'Status',
    active: 'Active',
    pending: 'Pending',
  }
};
