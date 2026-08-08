'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import {
  Users,
  Trash2,
  RefreshCw,
  DollarSign,
  PlusCircle,
  Copy,
  Check,
  AlertTriangle,
  ShieldCheck,
  Loader2,
  TrendingUp,
  UserPlus,
  Search,
  Filter,
  Link as LinkIcon,
  Calendar,
  Layers,
  Sparkles,
  ClipboardList,
  CheckCircle2,
  XCircle,
  TrendingDown,
  Info
} from 'lucide-react';
import { db, auth, handleFirestoreError, OperationType } from '@/lib/firebase';
import { collection, onSnapshot, addDoc, doc, updateDoc, deleteDoc, getDocs, setDoc, query, where, runTransaction } from 'firebase/firestore';
import { useAuth } from '@/hooks/use-auth';

const styles = {
  style588_1: "space-y-6 text-right",
  style591_2: "flex flex-col md:flex-row justify-between items-start md:items-center gap-4",
  style593_3: "text-2xl font-black text-white flex items-center gap-2",
  style594_4: "w-6 h-6 text-emerald-400",
  style597_5: "text-xs text-muted-foreground mt-0.5 font-sans",
  style601_6: "flex gap-2",
  style604_7: "bg-emerald-600 hover:bg-emerald-500 text-white font-bold gap-1 text-xs h-9 rounded-xl pointer-events-auto",
  style612_8: "flex flex-wrap gap-2 border-b border-white/5 pb-3",
  style617_9: "text-xs px-4 py-2 font-black rounded-lg h-9",
  style618_10: "bg-emerald-600 hover:bg-emerald-500 text-white",
  style618_11: "text-zinc-400",
  style621_12: "w-4 h-4 ml-1.5 shrink-0",
  style629_13: "text-xs px-4 py-2 font-black rounded-lg h-9",
  style630_14: "bg-emerald-600 hover:bg-emerald-500 text-white",
  style630_15: "text-zinc-400",
  style633_16: "w-4 h-4 ml-1.5 shrink-0",
  style636_17: "mr-1 bg-amber-500 text-black text-[9px] font-black",
  style644_18: "text-xs px-4 py-2 font-black rounded-lg h-9",
  style645_19: "bg-emerald-600 hover:bg-emerald-500 text-white",
  style645_20: "text-zinc-400",
  style648_21: "w-4 h-4 ml-1.5 shrink-0",
  style651_22: "mr-1 bg-red-500 text-white text-[9px] font-black",
  style659_23: "text-xs px-4 py-2 font-black rounded-lg h-9",
  style660_24: "bg-emerald-600 hover:bg-emerald-500 text-white",
  style660_25: "text-zinc-400",
  style663_26: "w-4 h-4 ml-1.5 shrink-0",
  style670_27: "bg-[#000d00]/90 border-emerald-500/30 p-5 mt-4 animate-in slide-in-from-top duration-300",
  style671_28: "p-0 pb-3",
  style672_29: "text-base font-black text-white flex items-center gap-2",
  style673_30: "w-5 h-5 text-emerald-400",
  style676_31: "text-xs text-zinc-400",
  style680_32: "space-y-4",
  style681_33: "grid md:grid-cols-4 gap-4",
  style682_34: "space-y-1",
  style683_35: "text-xs text-zinc-300",
  style689_36: "bg-black/80 border-emerald-950/50 text-white text-xs h-9",
  style694_37: "space-y-1",
  style695_38: "text-xs text-zinc-300",
  style701_39: "bg-black/80 border-emerald-950/50 text-white text-xs h-9",
  style706_40: "space-y-1",
  style707_41: "text-xs text-zinc-300",
  style712_42: "w-full h-9 mt-1 rounded bg-black border border-emerald-900 text-white px-2 focus:outline-none focus:border-emerald-500 text-xs",
  customSelectContent: "border-emerald-900 bg-black text-white shadow-2xl shadow-black/40",
  customSelectItem: "cursor-pointer rounded-lg py-2.5 text-xs font-semibold text-slate-200 focus:bg-emerald-500/15 focus:text-emerald-300 data-[state=checked]:bg-emerald-500/10 data-[state=checked]:text-emerald-300",
  style721_43: "space-y-1",
  style722_44: "text-xs text-zinc-300 font-bold",
  style729_45: "bg-black/80 border-emerald-950/50 text-white text-xs h-9",
  style734_46: "space-y-1",
  style735_47: "text-xs text-zinc-300",
  style740_48: "w-full h-9 mt-1 rounded bg-black border border-emerald-900 text-white px-2 focus:outline-none focus:border-emerald-500 text-xs",
  style748_49: "space-y-1 font-mono",
  style749_50: "text-xs text-zinc-300",
  style755_51: "bg-black/80 border-emerald-950/50 text-white text-xs h-9",
  style759_52: "space-y-1",
  style760_53: "text-xs text-zinc-300 font-bold",
  style765_54: "w-full h-9 mt-1 rounded bg-black border border-emerald-900 text-white px-2 focus:outline-none focus:border-emerald-500 text-xs",
  style773_55: "space-y-1 flex flex-col justify-end",
  style774_56: "text-xs text-zinc-300 pb-2",
  style775_57: "flex items-center gap-2",
  style781_58: "w-4 h-4 accent-emerald-500",
  style783_59: "text-[11px] text-emerald-400 font-bold",
  style789_60: "flex justify-end gap-2 pt-2",
  style790_61: "h-9 hover:bg-white/5 text-xs text-neutral-400",
  style791_62: "bg-emerald-600 hover:bg-emerald-500 text-white font-bold h-9 text-xs rounded-xl",
  style799_63: "bg-[#091B09]/20 border-emerald-950/30",
  style800_64: "pb-3 border-b border-emerald-950/20",
  style801_65: "text-base font-black text-white",
  style802_66: "text-xs text-zinc-400",
  style806_67: "p-0",
  style808_68: "overflow-x-auto",
  style810_69: "bg-black/40 border-b border-emerald-950/30",
  style812_70: "text-right text-gray-400 text-xs py-3",
  style813_71: "text-right text-gray-400 text-xs",
  style814_72: "text-right text-gray-400 text-xs",
  style815_73: "text-right text-gray-400 text-xs",
  style816_74: "text-right text-gray-400 text-xs",
  style817_75: "text-right text-gray-400 text-xs",
  style818_76: "text-right text-gray-400 text-xs",
  style819_77: "text-left text-gray-400 text-xs p-3",
  style825_78: "border-b border-white/5 hover:bg-white/5 transition-colors",
  style826_79: "align-middle py-3",
  style827_80: "flex items-center gap-3",
  style828_81: "w-8 h-8 rounded-full border border-emerald-500/20 bg-emerald-950/40 shrink-0",
  style829_82: "text-emerald-400 font-bold text-xs",
  style834_83: "text-xs font-black text-white leading-tight",
  style835_84: "text-[10px] text-emerald-500 font-mono font-bold",
  style836_85: "flex gap-1.5 mt-1",
  style837_86: "text-[8px] px-1 py-0 bg-zinc-900 border-zinc-700 text-gray-300 font-sans",
  style842_87: "text-[8px] px-1 py-0 font-sans",
  style844_88: "bg-emerald-950 text-emerald-400 border-emerald-500/20",
  style845_89: "bg-amber-950 text-amber-400 border-amber-500/20",
  style855_90: "align-middle animate-fade-in",
  style856_91: "flex items-center gap-1",
  style857_92: "font-mono text-[10px] bg-black/60 border-emerald-800 text-white p-1",
  style864_93: "w-6 h-6 hover:bg-neutral-800",
  style866_94: "w-3.5 h-3.5 text-green-400",
  style866_95: "w-3.5 h-3.5 text-gray-400",
  style871_96: "align-middle font-black text-xs text-zinc-300 font-mono",
  style875_97: "align-middle font-bold text-xs font-mono text-zinc-300",
  style889_98: "space-y-1 mt-1.5 text-[9px] font-sans",
  style891_99: "text-[8px] bg-emerald-950/25 text-emerald-400 border-emerald-500/30 py-0.5 px-1 font-bold block w-fit",
  style895_100: "text-[8px] bg-red-950/25 text-red-400 border-red-500/30 py-0.5 px-1 font-bold block w-fit",
  style901_101: "text-red-400 font-bold flex items-center gap-1",
  style905_102: "text-emerald-400 font-bold flex items-center gap-1 text-[8px]",
  style915_103: "h-5 px-1.5 bg-amber-500/10 hover:bg-amber-500/20 text-[8px] font-bold text-amber-400 rounded border border-amber-500/20 block",
  style926_104: "align-middle font-semibold text-xs font-mono text-emerald-400",
  style930_105: "align-middle font-mono",
  style931_106: "text-[10px] text-amber-400 border-amber-500/30 bg-amber-950/20",
  style936_107: "align-middle",
  style940_108: "text-[10px]",
  style942_109: "text-emerald-400 border-emerald-500 bg-emerald-950/20",
  style943_110: "text-amber-500 border-amber-500 bg-amber-950/20",
  style950_111: "align-middle text-left p-3",
  style951_112: "flex items-center justify-end gap-1.5",
  style956_113: "h-7 border-teal-500/30 hover:bg-teal-950/40 text-[10px] font-bold text-teal-400 rounded-lg",
  style958_114: "w-3 h-3 ml-1",
  style966_115: "h-7 border-[#1e293b] hover:bg-neutral-800 text-[10px] rounded-lg text-neutral-300",
  style979_116: "text-center text-muted-foreground text-xs py-10 font-bold",
  style987_117: "space-y-6",
  style988_118: "bg-[#091B09]/20 border-emerald-950/30",
  style989_119: "pb-3 border-b border-emerald-950/20",
  style990_120: "text-base font-black text-white flex items-center gap-1.5",
  style991_121: "h-4.5 w-4.5 text-amber-400",
  style994_122: "text-xs text-zinc-400",
  style998_123: "p-0",
  style1000_124: "overflow-x-auto",
  style1002_125: "bg-black/40 border-b border-[#1e293b]",
  style1004_126: "text-right text-gray-405 text-xs py-3",
  style1005_127: "text-right text-gray-405 text-xs",
  style1006_128: "text-right text-gray-405 text-xs",
  style1007_129: "text-right text-gray-405 text-xs",
  style1008_130: "text-left text-gray-405 text-xs p-3",
  style1017_131: "border-b border-white/5 hover:bg-white/5 transition-colors",
  style1018_132: "align-middle py-3",
  style1019_133: "text-xs font-black text-white block",
  style1020_134: "text-[10px] text-zinc-500 font-mono",
  style1023_135: "align-middle",
  style1024_136: "flex items-center gap-1",
  style1025_137: "font-mono text-[9px] bg-black text-zinc-300 p-1 select-all cursor-pointer hover:bg-neutral-900 border-zinc-800",
  style1035_138: "w-6 h-6 hover:bg-neutral-800",
  style1037_139: "w-3.5 h-3.5 text-gray-400",
  style1042_140: "align-middle font-mono text-xs",
  style1046_141: "align-middle",
  style1050_142: "text-[10px]",
  style1051_143: "text-emerald-400 border-emerald-500 bg-emerald-950/20",
  style1051_144: "text-zinc-500 border-zinc-800 bg-black/40",
  style1058_145: "align-middle text-left p-3",
  style1064_146: "h-7 border-red-500/20 hover:bg-red-950/30 text-[10px] font-bold text-red-400 rounded-lg",
  style1066_147: "w-3 h-3 ml-1",
  style1078_148: "text-center text-muted-foreground text-xs py-10 font-bold space-y-2 flex flex-col items-center",
  style1079_149: "w-8 h-8 text-amber-500",
  style1090_150: "grid grid-cols-1 lg:grid-cols-5 gap-6",
  style1092_151: "lg:col-span-3 bg-[#091B09]/20 border-emerald-950/30",
  style1093_152: "pb-3 border-b border-emerald-950/20 flex justify-between items-center",
  style1094_153: "text-base font-black text-white flex items-center gap-1.5",
  style1095_154: "h-4.5 w-4.5 text-emerald-400",
  style1099_155: "p-0",
  style1101_156: "overflow-x-auto",
  style1103_157: "bg-black/40 border-b border-[#1e293b]",
  style1105_158: "text-right text-gray-400 text-xs py-3",
  style1106_159: "text-right text-gray-400 text-xs",
  style1107_160: "text-right text-gray-400 text-xs",
  style1108_161: "text-right text-gray-400 text-xs",
  style1109_162: "text-left text-gray-400 text-xs p-3",
  style1115_163: "border-b border-white/5 hover:bg-white/5 transition-colors",
  style1116_164: "align-middle py-3",
  style1117_165: "text-xs font-black text-white block",
  style1118_166: "text-[10px] text-zinc-400 block font-bold text-emerald-400",
  style1121_167: "align-middle text-xs text-zinc-300 max-w-[200px] truncate",
  style1125_168: "align-middle font-mono text-xs",
  style1129_169: "align-middle",
  style1133_170: "text-[10px]",
  style1134_171: "text-yellow-400 border-yellow-500/30 bg-yellow-950/20",
  style1135_172: "text-blue-400 border-blue-500/30 bg-blue-950/20",
  style1136_173: "text-emerald-400 border-emerald-500/30 bg-emerald-950/20",
  style1137_174: "text-zinc-500 border-zinc-800 bg-black/40",
  style1146_175: "align-middle text-left p-3",
  style1152_176: "h-7 border-zinc-800 hover:bg-neutral-800 text-[10px] font-bold text-zinc-300 rounded-lg",
  style1165_177: "text-center text-muted-foreground text-xs py-12 font-bold space-y-2 flex flex-col items-center",
  style1166_178: "w-8 h-8 text-neutral-600",
  style1174_179: "lg:col-span-2 bg-[#0A0E1A] border-[#1e293b]",
  style1176_180: "text-sm font-black text-white flex items-center gap-1.5",
  style1177_181: "w-4.5 h-4.5 text-emerald-400",
  style1180_182: "text-xs",
  style1185_183: "space-y-4",
  style1186_184: "space-y-1",
  style1187_185: "text-xs text-zinc-400",
  style1191_186: "w-full h-10 rounded bg-black border border-[#1e293b] text-white px-2 focus:outline-none text-xs",
  style1201_187: "space-y-1",
  style1202_188: "text-xs text-zinc-400",
  style1207_189: "bg-black border-[#1e293b] text-xs h-10",
  style1212_190: "space-y-1",
  style1213_191: "text-xs text-zinc-400",
  style1218_192: "w-full min-h-[80px] bg-black border border-[#1e293b] rounded-md p-2 text-white focus:outline-none text-xs",
  style1223_193: "space-y-1",
  style1224_194: "text-xs text-zinc-400",
  style1229_195: "bg-black border-[#1e293b] text-xs h-10",
  style1234_196: "w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold h-10 text-xs rounded-xl",
  style1245_197: "space-y-6",
  style1246_198: "grid grid-cols-2 lg:grid-cols-4 gap-4",
  style1247_199: "bg-[#091B09]/40 border-emerald-950/40 p-4",
  style1248_200: "p-0 pb-1",
  style1249_201: "text-[10px] text-zinc-400 font-bold",
  style1251_202: "p-0",
  style1252_203: "text-2xl font-black text-amber-500 font-mono",
  style1253_204: "flex items-center gap-1 text-[9px] text-[#10B981] font-bold mt-1",
  style1254_205: "w-3.5 h-3.5",
  style1260_206: "bg-[#091B09]/40 border-emerald-950/40 p-4",
  style1261_207: "p-0 pb-1",
  style1262_208: "text-[10px] text-zinc-400 font-bold",
  style1264_209: "p-0",
  style1265_210: "text-2xl font-black text-emerald-400 font-mono",
  style1266_211: "flex items-center gap-1 text-[9px] text-[#10B981] font-bold mt-1",
  style1272_212: "bg-[#091B09]/40 border-emerald-950/40 p-4",
  style1273_213: "p-0 pb-1",
  style1274_214: "text-[10px] text-zinc-400 font-bold",
  style1276_215: "p-0",
  style1277_216: "text-2xl font-black text-red-400 font-mono",
  style1278_217: "flex items-center gap-1 text-[9px] text-red-400 font-semibold mt-1",
  style1279_218: "w-3.5 h-3.5",
  style1285_219: "bg-[#091B09]/40 border-emerald-950/40 p-4",
  style1286_220: "p-0 pb-1",
  style1287_221: "text-[10px] text-zinc-400 font-bold",
  style1289_222: "p-0",
  style1290_223: "text-2xl font-black text-blue-400 font-mono",
  style1291_224: "text-[9px] text-zinc-500 font-bold block mt-1",
  style1298_225: "bg-[#0A0F1D] border-[#1e293b]",
  style1300_226: "text-sm font-black text-white flex items-center gap-1.5",
  style1301_227: "w-4 h-4 text-emerald-400",
  style1304_228: "text-xs",
  style1309_229: "space-y-4 font-sans text-xs",
  style1314_230: "space-y-1.5 bg-black/40 p-3 rounded-lg border border-[#1e293b]",
  style1315_231: "flex justify-between items-center text-xs",
  style1316_232: "text-zinc-400",
  style1316_233: "font-bold text-white",
  style1317_234: "flex items-center gap-1.5",
  style1319_235: "text-[9px] text-emerald-400 font-bold bg-emerald-950/20 px-1 border border-emerald-500/20 rounded",
  style1321_236: "text-[9px] text-red-400 font-bold bg-red-950/20 px-1 border border-red-500/20 rounded",
  style1323_237: "font-bold text-emerald-400",
  style1326_238: "w-full bg-neutral-900 h-2 rounded-full overflow-hidden",
  style1328_239: "bg-emerald-500 h-full rounded-full transition-all duration-505",
  style1332_240: "flex justify-between items-center text-[10px] text-zinc-500",
} as const;


export interface Delegate {
  id: string;
  name: string;
  phone: string;
  district: string;
  referralCode: string;
  referredCount: number;
  organicCount: number;
  churnCount: number;
  steadyCount: number;
  targetDaily: number;
  carriedDeficit: number;
  linkExpiryHours: number;
  status: 'active' | 'suspended';
  createdAt: string;
  integritySignature?: string;
  subRole?: 'independent' | 'captain';
  isFleetActive?: boolean;
}

export interface MagicLink {
  id: string;
  delegateId: string;
  delegateName: string;
  token: string;
  expiresAt: string;
  expiryHours: number;
  status: 'active' | 'revoked' | 'used';
  url: string;
}

export interface DelegateTask {
  id: string;
  delegateId: string;
  delegateName: string;
  title: string;
  description: string;
  status: 'pending' | 'acknowledged' | 'completed' | 'closed';
  createdAt: string;
  deadline: string;
}

export function DelegatesManagementTab() {
  const [delegates, setDelegates] = useState<Delegate[]>([]);
  const [verifiedSignatures, setVerifiedSignatures] = useState<Record<string, boolean>>({});
  const [magicLinks, setMagicLinks] = useState<MagicLink[]>([]);
  const [tasks, setTasks] = useState<DelegateTask[]>([]);
  const [drivers, setDrivers] = useState<any[]>([]);

  const [loading, setLoading] = useState(true);
  const [activeSubTab, setActiveSubTab] = useState<'delegates' | 'magic-links' | 'tasks' | 'performance'>('delegates');
  const [isAdding, setIsAdding] = useState(false);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const { toast } = useToast();
  const { user, loading: authLoading } = useAuth();

  // Signature validation via backend-proxy (Sovereign V2.6-Secured protocol)
  useEffect(() => {
    if (delegates.length === 0) return;
    const verifyAll = async () => {
      try {
        const response = await fetch('/api/verify-signatures', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            delegates: delegates.map(d => ({
              id: d.id,
              referredCount: d.referredCount || 0,
              referralCode: d.referralCode || '',
              integritySignature: d.integritySignature || '',
              homeDistrict: (d as any).homeDistrict || (d as any).district || 'وادي السير',
              currentH3Cell: (d as any).currentH3Cell || '892db3c2a4fffff'
            }))
          })
        });
        const data = await response.json();
        if (response.ok && data.success) {
          setVerifiedSignatures(data.results);
        }
      } catch (err) {
        console.error("Failed to verify signatures via backend proxy:", err);
      }
    };
    verifyAll();
  }, [delegates]);

  // Form states (Delegate)
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [district, setDistrict] = useState('وادي السير');
  const [targetDaily, setTargetDaily] = useState('10');
  const [linkExpiryHours, setLinkExpiryHours] = useState('24');
  const [referralCountInit, setReferralCountInit] = useState('0');
  const [subRole, setSubRole] = useState<'independent' | 'captain'>('independent');
  const [isFleetActive, setIsFleetActive] = useState(false);

  // Form states (Task)
  const [selectedDelegateId, setSelectedDelegateId] = useState('');
  const [taskTitle, setTaskTitle] = useState('');
  const [taskDescription, setTaskDescription] = useState('');
  const [taskDeadline, setTaskDeadline] = useState('');

  // Load real-time data from Firestore
  useEffect(() => {
    let unsubDelegates: (() => void) | null = null;
    let unsubLinks: (() => void) | null = null;
    let unsubTasks: (() => void) | null = null;
    let unsubDrivers: (() => void) | null = null;

    if (!authLoading && user && user.role === 'admin') {
      setLoading(true);

      // 0. Drivers listener for cross-validation
      unsubDrivers = onSnapshot(query(collection(db, 'users'), where('role', '==', 'driver')), (snapshot) => {
        const list = snapshot.docs.map(docSnap => ({
          uid: docSnap.id,
          ...docSnap.data()
        }));
        setDrivers(list);
      }, (err) => {
        console.error("Firestore error loading drivers for cross-validation:", err);
      });

      // 1. Delegates listener
      unsubDelegates = onSnapshot(collection(db, 'delegates'), (snapshot) => {
        if (snapshot.empty) {
          // Seed defaults
          const defaultDelegates: Delegate[] = [
            {
              id: 'delegate-1',
              name: 'علاء الحموري - دير غبار',
              phone: '0795544332',
              district: 'وادي السير',
              referralCode: 'JO-AMMAN-GHUBAR-7',
              referredCount: 38,
              organicCount: 12,
              churnCount: 2,
              steadyCount: 48,
              targetDaily: 10,
              carriedDeficit: 3,
              linkExpiryHours: 24,
              status: 'active',
              createdAt: new Date().toISOString()
            },
            {
              id: 'delegate-2',
              name: 'أبو طارق العراقي - الكرادة',
              phone: '0770112233',
              district: 'الكرادة',
              referralCode: 'IQ-BAGHDAD-KARRADA-9',
              referredCount: 64,
              organicCount: 28,
              churnCount: 1,
              steadyCount: 91,
              targetDaily: 15,
              carriedDeficit: 0,
              linkExpiryHours: 48,
              status: 'active',
              createdAt: new Date().toISOString()
            },
            {
              id: 'delegate-3',
              name: 'يزن القحطاني - صويلح',
              phone: '0780445566',
              district: 'الجامعة',
              referralCode: 'JO-SWAILEH-08',
              referredCount: 14,
              organicCount: 4,
              churnCount: 3,
              steadyCount: 15,
              targetDaily: 8,
              carriedDeficit: 5,
              linkExpiryHours: 72,
              status: 'active',
              createdAt: new Date().toISOString()
            }
          ];
          setDelegates(defaultDelegates);
          // Write them to database to ensure persistence for security policies
          defaultDelegates.forEach(async (d) => {
            try {
              await setDoc(doc(db, 'delegates', d.id), d);
            } catch (e) {
              console.error("Self-healing background delegation seeding error:", e);
            }
          });
        } else {
          const list = snapshot.docs.map(docSnap => ({
            id: docSnap.id,
            ...docSnap.data()
          } as Delegate));
          setDelegates(list);
        }
        setLoading(false);
      }, (err) => {
        console.error("Firestore error loading delegates:", err);
        setLoading(false);
        handleFirestoreError(err, OperationType.LIST, 'delegates');
      });

      // 2. Magic links listener
      unsubLinks = onSnapshot(collection(db, 'delegate_links'), (snapshot) => {
        const list = snapshot.docs.map(docSnap => ({
          id: docSnap.id,
          ...docSnap.data()
        } as MagicLink));
        setMagicLinks(list);
      }, (err) => {
        console.error("Firestore error loading delegate_links:", err);
        handleFirestoreError(err, OperationType.LIST, 'delegate_links');
      });

      // 3. Tasks listener
      unsubTasks = onSnapshot(collection(db, 'delegate_tasks'), (snapshot) => {
        const list = snapshot.docs.map(docSnap => ({
          id: docSnap.id,
          ...docSnap.data()
        } as DelegateTask));
        setTasks(list);
      }, (err) => {
        console.error("Firestore error loading delegate_tasks:", err);
        handleFirestoreError(err, OperationType.LIST, 'delegate_tasks');
      });
    }

    return () => {
      if (unsubDelegates) unsubDelegates();
      if (unsubLinks) unsubLinks();
      if (unsubTasks) unsubTasks();
      if (unsubDrivers) unsubDrivers();
    };
  }, [user, authLoading]);

  const handleCopy = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    toast({
      title: 'تم النسخ ',
      description: `تم كود إحالة المندوب الأصلي (${code}) إلى الحافظة بنجاح.`
    });
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const handleAddDelegate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !phone) return;

    try {
      // [Security Check] Check phone uniqueness to prevent duplicate registrations (Race Condition Check)
      const qPhone = query(collection(db, 'delegates'), where('phone', '==', phone));
      const qSnap = await getDocs(qPhone);
      if (!qSnap.empty) {
        toast({
          variant: 'destructive',
          title: 'تنبيه أمني: تكرار الهاتف الميداني',
          description: `المندوب المسجل بالفعل يحمل نفس رقم الهاتف (${phone}). يرجى استخدام رقم هاتف فريد.`
        });
        return;
      }

      const districtCode = district === 'وادي السير' ? 'GHUBAR' : district === 'الجامعة' ? 'UNIV' : district === 'الكرادة' ? 'KARR' : 'AMMAN';
      const randomSuffix = Math.floor(Math.random() * 90) + 10;
      const generatedCode = `JO-${districtCode}-${name.split(' ')[0].toUpperCase()}-${randomSuffix}`;

      const newDelegate: Omit<Delegate, 'id'> = {
        name,
        phone,
        district,
        referralCode: generatedCode,
        referredCount: parseInt(referralCountInit) || 0,
        organicCount: 0,
        churnCount: 0,
        steadyCount: 0,
        targetDaily: parseInt(targetDaily) || 10,
        carriedDeficit: 0,
        linkExpiryHours: parseInt(linkExpiryHours) || 24,
        status: 'active',
        createdAt: new Date().toISOString(),
        subRole,
        isFleetActive: subRole === 'captain' ? isFleetActive : false
      };

      const delegateId = `del-${Date.now()}`;
      const finalDelegate = { ...newDelegate, id: delegateId, serial_id: '' };

      await runTransaction(db, async (transaction) => {
        const districtKey = (district || 'global').replace(/\s+/g, '_');
        const counterRef = doc(db, 'system_counters', `${districtKey}_delegate_serial`);
        const counterSnap = await transaction.get(counterRef);
        let nextCount = 1001;
        if (counterSnap.exists()) {
          nextCount = (counterSnap.data().current_count || 1000) + 1;
        }
        const serial_id = `M-${nextCount}`;
        finalDelegate.serial_id = serial_id;

        transaction.set(counterRef, { current_count: nextCount }, { merge: true });
        transaction.set(doc(db, 'delegates', delegateId), finalDelegate);
      });
      toast({
        title: 'تم إضافة المندوب الميداني',
        description: `تم ربط المندوب "${name}" بكود إحالة وتارجت يومي يبلغ ${targetDaily} بنجاح.`
      });
      setName('');
      setPhone('');
      setReferralCountInit('0');
      setTargetDaily('10');
      setIsAdding(false);
    } catch (e) {
      console.error("Failed to add delegate:", e);
      toast({
        variant: 'destructive',
        title: 'فشل الفعالية السحابية',
        description: 'حدث خطأ أثناء الاتصال ونقل ملف المندوب.'
      });
    }
  };

  // Generate real Magic Link
  const handleGenerateMagicLink = async (delegate: Delegate) => {
    try {
      const hours = delegate.linkExpiryHours || 24;
      const response = await fetch('/api/generate-magic-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          delegateId: delegate.id,
          delegateName: delegate.name,
          expiryHours: hours,
          actorRole: 'admin'
        })
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        toast({
          variant: 'destructive',
          title: 'فشل إنشاء الرابط السحابي',
          description: data.error || 'حدث خطأ في الخادم أثناء توليد الرابط.'
        });
        return;
      }

      toast({
        title: 'تم توليد الرابط السحري',
        description: `تم ربط المندوب "${delegate.name}" برابط دخول مؤقت ومحمي لـ ${hours} ساعة.`
      });
    } catch (e) {
      console.error("Error generating magic link:", e);
      toast({
        variant: 'destructive',
        title: 'فشل إنشاء الرابط السحابي',
        description: 'حدث خطأ غير متوقع أثناء معالجة الطلب السحري.'
      });
    }
  };

  // Revoke Link
  const handleRevokeLink = async (linkId: string) => {
    try {
      await updateDoc(doc(db, 'delegate_links', linkId), { status: 'revoked' });
      toast({
        title: 'تم إبطال الرابط بنجاح',
        description: 'تم حرق ترخيص الرابط السحري ومنع أي محاولة ولوج مستقبلية عبره.'
      });
    } catch (e) {
      console.error("Error revoking link:", e);
    }
  };

  // Add a task
  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDelegateId || !taskTitle || !taskDescription || !taskDeadline) {
      toast({
        variant: 'destructive',
        title: 'بروتوكول المهام ناقص',
        description: 'يرجى تعيين المندوب وعنوان المهام والسقف الزمني قبل الإضافة.'
      });
      return;
    }

    const target = delegates.find(d => d.id === selectedDelegateId);
    if (!target) return;

    const newTask: Omit<DelegateTask, 'id'> = {
      delegateId: selectedDelegateId,
      delegateName: target.name,
      title: taskTitle,
      description: taskDescription,
      status: 'pending',
      createdAt: new Date().toISOString(),
      deadline: taskDeadline
    };

    try {
      await addDoc(collection(db, 'delegate_tasks'), newTask);
      toast({
        title: 'تم إضافة المهمة ',
        description: `تم إسناد مهمة "${taskTitle}" للمنتسب الميداني ${target.name}.`
      });
      setTaskTitle('');
      setTaskDescription('');
      setTaskDeadline('');
    } catch (e) {
      console.error("Error adding task:", e);
    }
  };

  // Close Task
  const handleCloseTask = async (taskId: string) => {
    try {
      const response = await fetch('/api/delegate-task-transition', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          taskId,
          targetStatus: 'closed',
          delegateId: selectedDelegateId,
          actorUid: user?.uid,
          actorRole: 'admin'
        })
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        toast({
          variant: 'destructive',
          title: 'فشل إغلاق المهمة',
          description: data.error || 'فشل جدار الحماية السحابي في معالجة الإجراء.'
        });
        return;
      }

      toast({
        title: 'تم إغلاق المهمة وأرشفتها',
        description: 'تم تحويل حالة المهمة الميدانية إلى مغلقة بنجاح ومصادقتها سحابياً.'
      });
    } catch (e) {
      console.error("Error closing task:", e);
    }
  };

  const toggleStatus = async (id: string, currentStatus: 'active' | 'suspended') => {
    const newStatus = currentStatus === 'active' ? 'suspended' : 'active';
    try {
      await updateDoc(doc(db, 'delegates', id), { status: newStatus });
      toast({
        title: 'تغيير رتبة الاعتماد الميداني',
        description: `المندوب الآن في حالة: ${newStatus === 'active' ? 'معتمد ومفعّل ●' : 'مجمّد وموقوف !'}`
      });
    } catch (e) {
      console.error(e);
      // Fallback for mocked memory state
      setDelegates(prev => prev.map(d => d.id === id ? { ...d, status: newStatus } : d));
    }
  };

  const processPayout = async (id: string, amount: number) => {
    try {
      const targetDelegate = delegates.find(d => d.id === id);
      if (!targetDelegate) return;

      const adminIdentity = auth.currentUser ? (auth.currentUser.email || auth.currentUser.uid) : 'SYSTEM_SOVEREIGN_ADMIN';

      // 1. Audit ledger record
      await addDoc(collection(db, 'audit_ledger'), {
        action: 'DELEGATE_PAYOUT_SETTLEMENT',
        amountPaid: amount,
        delegateId: id,
        delegateName: targetDelegate.name,
        referralCode: targetDelegate.referralCode,
        actor: adminIdentity,
        timestamp: new Date().toISOString(),
        verified: true,
        protocol: 'RAD-CMD-083'
      });

      // 2. Reset pending dues
      await updateDoc(doc(db, 'delegates', id), { pendingDues: 0 });

      // If uid is assigned we can also reset the corresponding user document dues
      toast({
        title: 'براءة ذمة مالية ',
        description: `تم توثيق الفعالية وتصفير مستحقات المندوب بقيمة ${amount} د.أ بنسخة محاسبية مؤمنة بنجاح.`
      });
    } catch (e) {
      console.error(e);
      // Fallback update
      setDelegates(prev => prev.map(d => d.id === id ? { ...d, pendingDues: 0 } : d));
    }
  };

  const handleReconcileAndSign = async (id: string) => {
    try {
      const targetDelegate = delegates.find(d => d.id === id);
      if (!targetDelegate) return;

      const adminIdentity = auth.currentUser ? (auth.currentUser.email || auth.currentUser.uid) : 'SYSTEM_SOVEREIGN_ADMIN';
      const idToken = await auth.currentUser?.getIdToken();

      const response = await fetch('/api/reconcile-and-sign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          delegateId: id,
          actorRole: 'admin',
          actorUid: adminIdentity,
          idToken
        })
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        toast({
          variant: 'destructive',
          title: 'فشل بروتوكول التوقيع',
          description: data.error || 'حدث خطأ في الخادر أثناء معالجة المصادقة والتحقق.'
        });
        return;
      }

      toast({
        title: 'تمت المصادقة الثنائية بنجاح ✓',
        description: `تمت مزامنة وإغلاق عدادات المندوب (${targetDelegate.name}) بالبكسل التاريخي وتوقيعه بالختم الرقمي  من خلال الخادم الأمني.`
      });
    } catch (err) {
      console.error("Failed to reconcile and sign delegate:", err);
      toast({
        variant: 'destructive',
        title: 'فشل بروتوكول التوقيع',
        description: 'حدث خطأ غير متوقع أثناء معالجة المصادقة الرقمية.'
      });
    }
  };

  // Calculations for Performance Tab
  const totalReferred = delegates.reduce((acc, d) => acc + (d.referredCount || 0), 0);
  const totalOrganic = delegates.reduce((acc, d) => acc + (d.organicCount || 0), 0);
  const totalChurn = delegates.reduce((acc, d) => acc + (d.churnCount || 0), 0);
  const totalSteady = delegates.reduce((acc, d) => acc + (d.steadyCount || 0), 0);

  const churnRateAvg = totalReferred > 0 ? Number(((totalChurn / (totalReferred + totalChurn)) * 100).toFixed(1)) : 0;
  const growthIndex = totalReferred > 0 ? Number(((totalOrganic / totalReferred) * 100).toFixed(1)) : 0;

  return (
    <div className={styles.style588_1} dir="rtl">

      {/* Header Panel */}
      <div className={styles.style591_2}>
        <div>
          <h2 className={styles.style593_3}>
            <Users className={styles.style594_4} />
            فيلق جيش المندوبين  (Delegates Army Command)
          </h2>
          <p className={styles.style597_5}>
            بوابة المشرف الموحدة للتحكم بالمناديب، ومراقبة تمديد الروابط السحرية، وإحالات الأقاليم الأردنية والعراقية.
          </p>
        </div>
        <div className={styles.style601_6}>
          <Button
            onClick={() => setIsAdding(!isAdding)}
            className={styles.style604_7}
          >
            {isAdding ? 'إغلاق نافذة التسجيل' : 'تجنيد مندوب ميداني +'}
          </Button>
        </div>
      </div>

      {/* Sub-navigation Controls */}
      <div className={styles.style612_8}>
        <Button
          variant={activeSubTab === 'delegates' ? 'default' : 'ghost'}
          onClick={() => setActiveSubTab('delegates')}
          className={cn(
            styles.style617_9,
            activeSubTab === 'delegates' ? styles.style618_10 : styles.style618_11
          )}
        >
          <Users className={styles.style621_12} />
          إدارة المندوبين والاعتماد
        </Button>

        <Button
          variant={activeSubTab === 'magic-links' ? 'default' : 'ghost'}
          onClick={() => setActiveSubTab('magic-links')}
          className={cn(
            styles.style629_13,
            activeSubTab === 'magic-links' ? styles.style630_14 : styles.style630_15
          )}
        >
          <LinkIcon className={styles.style633_16} />
          الروابط السحرية (Magic Links)
          {magicLinks.filter(l => l.status === 'active').length > 0 && (
            <Badge className={styles.style636_17}>{magicLinks.filter(l => l.status === 'active').length}</Badge>
          )}
        </Button>

        <Button
          variant={activeSubTab === 'tasks' ? 'default' : 'ghost'}
          onClick={() => setActiveSubTab('tasks')}
          className={cn(
            styles.style644_18,
            activeSubTab === 'tasks' ? styles.style645_19 : styles.style645_20
          )}
        >
          <ClipboardList className={styles.style648_21} />
          متابعة وإسناد المهام
          {tasks.filter(t => t.status === 'pending').length > 0 && (
            <Badge className={styles.style651_22}>{tasks.filter(t => t.status === 'pending').length}</Badge>
          )}
        </Button>

        <Button
          variant={activeSubTab === 'performance' ? 'default' : 'ghost'}
          onClick={() => setActiveSubTab('performance')}
          className={cn(
            styles.style659_23,
            activeSubTab === 'performance' ? styles.style660_24 : styles.style660_25
          )}
        >
          <TrendingUp className={styles.style663_26} />
          محرك الأداء والإحصائيات د.ط
        </Button>
      </div>

      {/* Add New Delegate Panel */}
      {isAdding && (
        <Card className={styles.style670_27}>
          <CardHeader className={styles.style671_28}>
            <CardTitle className={styles.style672_29}>
              <UserPlus className={styles.style673_30} />
              صياغة عقد تجنيد جديد لقوات الانتشار الميداني
            </CardTitle>
            <CardDescription className={styles.style676_31}>
              سيتم تخصيص كود إحالة عسكري متين، وتارجت يومي ثابت لتتبع معادلة الكسب والعجز.
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleAddDelegate} className={styles.style680_32}>
            <div className={styles.style681_33}>
              <div className={styles.style682_34}>
                <Label htmlFor="del-name" className={styles.style683_35}>اسم المندوب المعتمد</Label>
                <Input
                  id="del-name"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="مثال: يوسف مأمون بني ملحم"
                  className={styles.style689_36}
                  required
                />
              </div>

              <div className={styles.style694_37}>
                <Label htmlFor="del-phone" className={styles.style695_38}>رقم الهاتف النشط</Label>
                <Input
                  id="del-phone"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  placeholder="مثال: 0797744111"
                  className={styles.style701_39}
                  required
                />
              </div>

              <div className={styles.style706_40}>
                <Label htmlFor="del-region" className={styles.style707_41}>محافظة ومنطقة الإدارة جغرافياً</Label>
                <Select value={district} onValueChange={setDistrict}>
                  <SelectTrigger id="del-region" className={styles.style712_42}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className={styles.customSelectContent}>
                    <SelectItem value="وادي السير" className={styles.customSelectItem}>وادي السير (عمان)</SelectItem>
                    <SelectItem value="الجامعة" className={styles.customSelectItem}>منطقة الجامعة (عمان)</SelectItem>
                    <SelectItem value="قصبة عمان" className={styles.customSelectItem}>قصبة عمان (عمان)</SelectItem>
                    <SelectItem value="الكرادة" className={styles.customSelectItem}>الكرادة (بغداد - العراق)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className={styles.style721_43}>
                <Label htmlFor="del-target" className={styles.style722_44}>التارجت اليومي الملتزم به</Label>
                <Input
                  id="del-target"
                  type="number"
                  value={targetDaily}
                  onChange={e => setTargetDaily(e.target.value)}
                  placeholder="مثال: 10"
                  className={styles.style729_45}
                  required
                />
              </div>

              <div className={styles.style734_46}>
                <Label htmlFor="del-expiry" className={styles.style735_47}>مدة صلاحية الروابط السحرية</Label>
                <Select value={linkExpiryHours} onValueChange={setLinkExpiryHours}>
                  <SelectTrigger id="del-expiry" className={styles.style740_48}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className={styles.customSelectContent}>
                    <SelectItem value="24" className={styles.customSelectItem}>24 ساعة (يوم كامل)</SelectItem>
                    <SelectItem value="48" className={styles.customSelectItem}>48 ساعة (يومين)</SelectItem>
                    <SelectItem value="72" className={styles.customSelectItem}>72 ساعة (ثلاثة أيام)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className={styles.style748_49}>
                <Label htmlFor="del-count" className={styles.style749_50}>أرقام مقيدة مسبقاً</Label>
                <Input
                  id="del-count"
                  type="number"
                  value={referralCountInit}
                  onChange={e => setReferralCountInit(e.target.value)}
                  className={styles.style755_51}
                />
              </div>

              <div className={styles.style759_52}>
                <Label htmlFor="del-subrole" className={styles.style760_53}>نوع الصلاحيات الميدانية</Label>
                <Select value={subRole} onValueChange={(value) => setSubRole(value as 'independent' | 'captain')}>
                  <SelectTrigger id="del-subrole" className={styles.style765_54}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className={styles.customSelectContent}>
                    <SelectItem value="independent" className={styles.customSelectItem}>مندوب مستقل (صامت وموفر للموارد)</SelectItem>
                    <SelectItem value="captain" className={styles.customSelectItem}>مندوب سائق (نشط بالنشاط الميداني والـ GPS)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {subRole === 'captain' && (
                <div className={styles.style773_55}>
                  <Label htmlFor="del-fleet-active" className={styles.style774_56}>حالة النشاط الميداني الفوري</Label>
                  <div className={styles.style775_57}>
                    <input
                      type="checkbox"
                      id="del-fleet-active"
                      checked={isFleetActive}
                      onChange={e => setIsFleetActive(e.target.checked)}
                      className={styles.style781_58}
                    />
                    <span className={styles.style783_59}>تفعيل الـ GPS ومستشعر الحركة</span>
                  </div>
                </div>
              )}
            </div>

            <div className={styles.style789_60}>
              <Button type="button" variant="ghost" onClick={() => setIsAdding(false)} className={styles.style790_61}>إلغاء الأمر</Button>
              <Button type="submit" className={styles.style791_62}>إنشاء العقد وتجهيز الكود 🔒</Button>
            </div>
          </form>
        </Card>
      )}

      {/* Main Container based on Sub-tabs */}
      {activeSubTab === 'delegates' && (
        <Card className={styles.style799_63}>
          <CardHeader className={styles.style800_64}>
            <CardTitle className={styles.style801_65}>منتسبي جيش الميدان ومنطقة التنسيق الجغرافي</CardTitle>
            <CardDescription className={styles.style802_66}>
              تتبع رموز إحالة المندوبين، تعيين التارجت، حظر الأمان التلقائي، وتنسيق تسييل العوائد.
            </CardDescription>
          </CardHeader>
          <CardContent className={styles.style806_67}>
            {delegates.length > 0 ? (
              <div className={styles.style808_68}>
                <Table>
                  <TableHeader className={styles.style810_69}>
                    <TableRow>
                      <TableHead className={styles.style812_70}>المندوب والإقليم</TableHead>
                      <TableHead className={styles.style813_71}>كود الإحالة</TableHead>
                      <TableHead className={styles.style814_72}>التارجت اليومي</TableHead>
                      <TableHead className={styles.style815_73}>السائقون المسجلين</TableHead>
                      <TableHead className={styles.style816_74}>انتساب عضوي</TableHead>
                      <TableHead className={styles.style817_75}>سقوف الروابط</TableHead>
                      <TableHead className={styles.style818_76}>حالة الاعتماد</TableHead>
                      <TableHead className={styles.style819_77}>التحكم السحابي</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {delegates.map((del) => {
                      return (
                        <TableRow key={del.id} className={styles.style825_78}>
                          <TableCell className={styles.style826_79}>
                            <div className={styles.style827_80}>
                              <Avatar className={styles.style828_81}>
                                <AvatarFallback className={styles.style829_82}>
                                  {del.name.substring(0, 2)}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <p className={styles.style834_83}>{del.name}</p>
                                <span className={styles.style835_84}>{del.district} ● {del.phone}</span>
                                <div className={styles.style836_85}>
                                  <Badge className={styles.style837_86}>
                                    {del.subRole === 'captain' ? '🎖️ مندوب سائق' : '💼 مندوب مستقل'}
                                  </Badge>
                                  {del.subRole === 'captain' && (
                                    <Badge className={cn(
                                      styles.style842_87,
                                      del.isFleetActive
                                        ? styles.style844_88
                                        : styles.style845_89
                                    )}>
                                      {del.isFleetActive ? '● نشط ميدانياً' : '○ خامل'}
                                    </Badge>
                                  )}
                                </div>
                              </div>
                            </div>
                          </TableCell>

                          <TableCell className={styles.style855_90}>
                            <div className={styles.style856_91}>
                              <Badge variant="outline" className={styles.style857_92}>
                                {del.referralCode}
                              </Badge>
                              <Button
                                size="icon"
                                variant="ghost"
                                onClick={() => handleCopy(del.referralCode)}
                                className={styles.style864_93}
                              >
                                {copiedCode === del.referralCode ? <Check className={styles.style866_94} /> : <Copy className={styles.style866_95} />}
                              </Button>
                            </div>
                          </TableCell>

                          <TableCell className={styles.style871_96}>
                            {del.targetDaily || 10} حاقن/يوم
                          </TableCell>

                          <TableCell className={styles.style875_97}>
                            <div>
                              <div>{del.referredCount || 0} سائق</div>
                              {(() => {
                                const actualCount = drivers.filter(dr =>
                                  dr.referralCode === del.referralCode ||
                                  dr.referredByCode === del.referralCode ||
                                  dr.usedReferralCode === del.referralCode
                                ).length;

                                const isSigValid = !!verifiedSignatures[del.id];
                                const hasDiscrepancy = actualCount > 0 && actualCount !== del.referredCount;

                                return (
                                  <div className={styles.style889_98}>
                                    {isSigValid ? (
                                      <Badge variant="outline" className={styles.style891_99}>
                                        ✓ توقيع رقمي معتمد
                                      </Badge>
                                    ) : (
                                      <Badge variant="outline" className={styles.style895_100}>
                                        ⚠️ تالف أو غير موقّع
                                      </Badge>
                                    )}

                                    {hasDiscrepancy ? (
                                      <div className={styles.style901_101}>
                                        <span>⚠️ تضارب: الفعلي ({actualCount})</span>
                                      </div>
                                    ) : actualCount > 0 ? (
                                      <div className={styles.style905_102}>
                                        <span>✓ تطابق مبرهن ({actualCount})</span>
                                      </div>
                                    ) : null}

                                    {(!isSigValid || hasDiscrepancy) && (
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => handleReconcileAndSign(del.id)}
                                        className={styles.style915_103}
                                      >
                                        مصادقة وتوقيع تشفيري ⚡
                                      </Button>
                                    )}
                                  </div>
                                );
                              })()}
                            </div>
                          </TableCell>

                          <TableCell className={styles.style926_104}>
                            +{del.organicCount || 0} نمو عضوي
                          </TableCell>

                          <TableCell className={styles.style930_105}>
                            <Badge variant="outline" className={styles.style931_106}>
                              ⏱️ {del.linkExpiryHours || 24} ساعة
                            </Badge>
                          </TableCell>

                          <TableCell className={styles.style936_107}>
                            <Badge
                              variant="outline"
                              className={cn(
                                styles.style940_108,
                                del.status === 'active'
                                  ? styles.style942_109
                                  : styles.style943_110
                              )}
                            >
                              {del.status === 'active' ? 'مفعّل ونشط ●' : 'مجمّد مؤقتاً ||'}
                            </Badge>
                          </TableCell>

                          <TableCell className={styles.style950_111}>
                            <div className={styles.style951_112}>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleGenerateMagicLink(del)}
                                className={styles.style956_113}
                              >
                                <LinkIcon className={styles.style958_114} />
                                توليد رابط سحري
                              </Button>

                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => toggleStatus(del.id, del.status)}
                                className={styles.style966_115}
                              >
                                {del.status === 'active' ? 'تجميد المندوب' : 'تنشيط المندوب'}
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <p className={styles.style979_116}>لا يوجد مندوبين معتمدين مسجلين في النظام بعد.</p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Magic Links Sub-tab */}
      {activeSubTab === 'magic-links' && (
        <div className={styles.style987_117}>
          <Card className={styles.style988_118}>
            <CardHeader className={styles.style989_119}>
              <CardTitle className={styles.style990_120}>
                <LinkIcon className={styles.style991_121} />
                محرك الروابط السحرية والولوج الفوري
              </CardTitle>
              <CardDescription className={styles.style994_122}>
                قائمة الروابط الصادرة لحسابات المندوبين مع تتبع الأمان والحدود الزمنية لإنهاء الصلاحية تلافياً لأي تسلل.
              </CardDescription>
            </CardHeader>
            <CardContent className={styles.style998_123}>
              {magicLinks.length > 0 ? (
                <div className={styles.style1000_124}>
                  <Table>
                    <TableHeader className={styles.style1002_125}>
                      <TableRow>
                        <TableHead className={styles.style1004_126}>المندوب المستفيد</TableHead>
                        <TableHead className={styles.style1005_127}>رابط الدخول المشفر</TableHead>
                        <TableHead className={styles.style1006_128}>الانتهاء الزمني</TableHead>
                        <TableHead className={styles.style1007_129}>الصلاحية لمرة واحدة</TableHead>
                        <TableHead className={styles.style1008_130}>إجراء </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {magicLinks.map((link) => {
                        const expired = new Date(link.expiresAt) < new Date();
                        const isActive = link.status === 'active' && !expired;

                        return (
                          <TableRow key={link.id} className={styles.style1017_131}>
                            <TableCell className={styles.style1018_132}>
                              <span className={styles.style1019_133}>{link.delegateName}</span>
                              <span className={styles.style1020_134}>#Link-{link.id.substring(0,6)}</span>
                            </TableCell>

                            <TableCell className={styles.style1023_135}>
                              <div className={styles.style1024_136}>
                                <Badge variant="outline" className={styles.style1025_137}>
                                  {link.url}
                                </Badge>
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  onClick={() => {
                                    navigator.clipboard.writeText(link.url);
                                    toast({ title: 'تم نسخ الرابط السحري', description: 'يمكنك إرساله للمندوب للدخول بنقرة واحدة.' });
                                  }}
                                  className={styles.style1035_138}
                                >
                                  <Copy className={styles.style1037_139} />
                                </Button>
                              </div>
                            </TableCell>

                            <TableCell className={styles.style1042_140}>
                              {new Date(link.expiresAt).toLocaleString('ar-JO')}
                            </TableCell>

                            <TableCell className={styles.style1046_141}>
                              <Badge
                                variant="outline"
                                className={cn(
                                  styles.style1050_142,
                                  isActive ? styles.style1051_143 : styles.style1051_144
                                )}
                              >
                                {link.status === 'used' ? 'تم الاستهلاك' : link.status === 'revoked' ? 'أبطل بالكامل' : expired ? 'منتهي الصلاحية' : 'صالح ونشط'}
                              </Badge>
                            </TableCell>

                            <TableCell className={styles.style1058_145}>
                              {isActive && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleRevokeLink(link.id)}
                                  className={styles.style1064_146}
                                >
                                  <XCircle className={styles.style1066_147} />
                                  إبطال وحرق الرابط
                                </Button>
                              )}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className={styles.style1078_148}>
                  <Info className={styles.style1079_149} />
                  <span>لا يوجد أي روابط سحرية نشطة حالياً. يمكنك توليد رابط بجانب اسم المندوب في الأعلى.</span>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Tasks sub-tab */}
      {activeSubTab === 'tasks' && (
        <div className={styles.style1090_150}>
          {/* List of Tasks */}
          <Card className={styles.style1092_151}>
            <CardHeader className={styles.style1093_152}>
              <CardTitle className={styles.style1094_153}>
                <ClipboardList className={styles.style1095_154} />
                متابعة حالة المهام الميدانية المفتوحة
              </CardTitle>
            </CardHeader>
            <CardContent className={styles.style1099_155}>
              {tasks.length > 0 ? (
                <div className={styles.style1101_156}>
                  <Table>
                    <TableHeader className={styles.style1103_157}>
                      <TableRow>
                        <TableHead className={styles.style1105_158}>المهمة والمندوب</TableHead>
                        <TableHead className={styles.style1106_159}>التفاصيل والتكليف</TableHead>
                        <TableHead className={styles.style1107_160}>السقف الزمني</TableHead>
                        <TableHead className={styles.style1108_161}>حالة المهمة</TableHead>
                        <TableHead className={styles.style1109_162}>الإجراء السلوكي</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {tasks.map((task) => {
                        return (
                          <TableRow key={task.id} className={styles.style1115_163}>
                            <TableCell className={styles.style1116_164}>
                              <span className={styles.style1117_165}>{task.title}</span>
                              <span className={styles.style1118_166}>للمندوب: {task.delegateName}</span>
                            </TableCell>

                            <TableCell className={styles.style1121_167}>
                              {task.description}
                            </TableCell>

                            <TableCell className={styles.style1125_168}>
                              {task.deadline}
                            </TableCell>

                            <TableCell className={styles.style1129_169}>
                              <Badge
                                variant="outline"
                                className={cn(
                                  styles.style1133_170,
                                  task.status === 'pending' ? styles.style1134_171 :
                                  task.status === 'acknowledged' ? styles.style1135_172 :
                                  task.status === 'completed' ? styles.style1136_173 :
                                  styles.style1137_174
                                )}
                              >
                                {task.status === 'pending' ? 'بانتظار العرض' :
                                 task.status === 'acknowledged' ? 'اطّلع المندوب' :
                                 task.status === 'completed' ? 'أُنجزت ✓' : 'مغلقة ومؤرشفة'}
                              </Badge>
                            </TableCell>

                            <TableCell className={styles.style1146_175}>
                              {task.status !== 'closed' && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleCloseTask(task.id)}
                                  className={styles.style1152_176}
                                >
                                  إغلاق وأرشفة
                                </Button>
                              )}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className={styles.style1165_177}>
                  <ClipboardList className={styles.style1166_178} />
                  <span>لا يوجد مهام ميدانية جارية مسندة حالياً. استخدم اللوحة الجانبية لإنشاء أول مهمة للجيش الميدني.</span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Create Task Form */}
          <Card className={styles.style1174_179}>
            <CardHeader>
              <CardTitle className={styles.style1176_180}>
                <Sparkles className={styles.style1177_181} />
                صياغة أمر عسكري ميداني (مهمة)
              </CardTitle>
              <CardDescription className={styles.style1180_182}>
                سيصل إشعار فوري للمندوب في لوحته لإلزامه بالتنفيذ والرد بالنتائج الجغرافية.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleAddTask} className={styles.style1185_183}>
                <div className={styles.style1186_184}>
                  <Label className={styles.style1187_185}>اختر المندوب المستهدف</Label>
                  <Select value={selectedDelegateId} onValueChange={setSelectedDelegateId}>
                    <SelectTrigger className={styles.style1191_186}>
                      <SelectValue placeholder="-- اسم المندوب الرباعي --" />
                    </SelectTrigger>
                    <SelectContent className={styles.customSelectContent}>
                      {delegates.filter(d => d.status === 'active').map(d => (
                        <SelectItem key={d.id} value={d.id} className={styles.customSelectItem}>{d.name} ({d.district})</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className={styles.style1201_187}>
                  <Label className={styles.style1202_188}>عنوان التكليف</Label>
                  <Input
                    value={taskTitle}
                    onChange={e => setTaskTitle(e.target.value)}
                    placeholder="مثال: غرز 15 سائق في منطقة صويلح"
                    className={styles.style1207_189}
                    required
                  />
                </div>

                <div className={styles.style1212_190}>
                  <Label className={styles.style1213_191}>مضمون الإجراء السلوكي والمحفزات</Label>
                  <textarea
                    value={taskDescription}
                    onChange={e => setTaskDescription(e.target.value)}
                    placeholder="يرجى توزيع الملصقات وكتابة رمز الإحالة JO-SWAILEH.. ومساعدة السائقون في تخطي عقبة الفحص الأولي للسيارات."
                    className={styles.style1218_192}
                    required
                  />
                </div>

                <div className={styles.style1223_193}>
                  <Label className={styles.style1224_194}>مستهدف السقف الزمني</Label>
                  <Input
                    type="date"
                    value={taskDeadline}
                    onChange={e => setTaskDeadline(e.target.value)}
                    className={styles.style1229_195}
                    required
                  />
                </div>

                <Button type="submit" className={styles.style1234_196}>
                  إرسال وإسناد الأمر الميداني فورا ⚡
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Analytics Performance Tab */}
      {activeSubTab === 'performance' && (
        <div className={styles.style1245_197}>
          <div className={styles.style1246_198}>
            <Card className={styles.style1247_199}>
              <CardHeader className={styles.style1248_200}>
                <CardDescription className={styles.style1249_201}>عواصف النمو المباشر</CardDescription>
              </CardHeader>
              <CardContent className={styles.style1251_202}>
                <p className={styles.style1252_203}>{totalReferred} سائق</p>
                <div className={styles.style1253_204}>
                  <TrendingUp className={styles.style1254_205} />
                  <span>توسّع إيجابي وقدرة تجنيدية صارمة</span>
                </div>
              </CardContent>
            </Card>

            <Card className={styles.style1260_206}>
              <CardHeader className={styles.style1261_207}>
                <CardDescription className={styles.style1262_208}>إجمالي الانتساب العضوي (الألوية)</CardDescription>
              </CardHeader>
              <CardContent className={styles.style1264_209}>
                <p className={styles.style1265_210}>+{totalOrganic} منتسب</p>
                <div className={styles.style1266_211}>
                  <span>معدل نمو عضوي بنسبة {growthIndex}%</span>
                </div>
              </CardContent>
            </Card>

            <Card className={styles.style1272_212}>
              <CardHeader className={styles.style1273_213}>
                <CardDescription className={styles.style1274_214}>نسبة الانسحاب والخسارة</CardDescription>
              </CardHeader>
              <CardContent className={styles.style1276_215}>
                <p className={styles.style1277_216}>{churnRateAvg}%</p>
                <div className={styles.style1278_217}>
                  <TrendingDown className={styles.style1279_218} />
                  <span>إجمالي حذف التطبيق: {totalChurn} سائقين</span>
                </div>
              </CardContent>
            </Card>

            <Card className={styles.style1285_219}>
              <CardHeader className={styles.style1286_220}>
                <CardDescription className={styles.style1287_221}>السائقون الثابتين (+45 يوم)</CardDescription>
              </CardHeader>
              <CardContent className={styles.style1289_222}>
                <p className={styles.style1290_223}>{totalSteady} سائق</p>
                <span className={styles.style1291_224}>
                  معدل التزام مبرهن بصمامات قوية
                </span>
              </CardContent>
            </Card>
          </div>

          <Card className={styles.style1298_225}>
            <CardHeader>
              <CardTitle className={styles.style1300_226}>
                <Layers className={styles.style1301_227} />
                مقارنة كفوءة لألوية الاقتدار والإدارة
              </CardTitle>
              <CardDescription className={styles.style1304_228}>
                مخطط الكفاءة والنمو شهرياً بموجب تتبع الحالات الميدانية وحماية الروابط.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className={styles.style1309_229}>
                {delegates.map(d => {
                  const percentage = totalReferred > 0 ? Math.round(((d.referredCount || 0) / totalReferred) * 100) : 0;
                  const isSigValid = !!verifiedSignatures[d.id];
                  return (
                    <div key={d.id} className={styles.style1314_230}>
                      <div className={styles.style1315_231}>
                        <span className={styles.style1316_232}>الإقليم: <span className={styles.style1316_233}>{d.district} ({d.name})</span></span>
                        <div className={styles.style1317_234}>
                          {isSigValid ? (
                            <span className={styles.style1319_235}>✓ موثق تشفيرياً</span>
                          ) : (
                            <span className={styles.style1321_236}>⚠️ غير موثق</span>
                          )}
                          <span className={styles.style1323_237}>{d.referredCount} سائق ({percentage}%)</span>
                        </div>
                      </div>
                      <div className={styles.style1326_238}>
                        <div
                          className={styles.style1328_239}
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                      <div className={styles.style1332_240}>
                        <span>النمو العضوي المتمدد: +{d.organicCount}</span>
                        <span>تنبيهات الثبات (45 يوم): {d.steadyCount} سائق ملتزم</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

    </div>
  );
}
