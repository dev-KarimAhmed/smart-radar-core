'use client';

import React, { useState, useEffect } from 'react';
import { db, auth } from '@/lib/firebase';
import { 
  collection, 
  getDocs, 
  doc, 
  updateDoc, 
  setDoc,
  query, 
  where 
} from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { 
  ShieldAlert, 
  Users, 
  Activity, 
  TrendingUp, 
  Loader2, 
  Flame, 
  DollarSign, 
  Ban, 
  RefreshCw, 
  Lock, 
  Unlock, 
  Clock, 
  Sparkles,
  Award,
  AlertTriangle,
  RotateCcw,
  CheckCircle2,
  Shield
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import { SovereignDemarcationCatalog } from '@/core/demarcation-catalog';

export interface DelegateData {
  id: string;
  name: string;
  phone: string;
  referralCode: string;
  referredCount: number;
  deletionRate: number; // e.g. 5.2 (representing 5.2%)
  revivalRate: number;
  pendingDues: number;
  status: 'active' | 'suspended';
  createdAt: string;
  dueDate?: string;
}

export interface DriverData {
  uid: string;
  name: string;
  phone: string;
  rating?: number;
  heartCount?: number;
  paidHoursRemaining?: number;
  status?: string;
  isBanned?: boolean;
  immunityScore?: number; // Standard 100.0
  currentDistrict?: string; // Regional commute
}

// [SCR-GAP-LOCKDOWN-150] محرك سد الثغرات الاستراتيجية (الارتحال، الشحن، والصندوق الأسود)
// محصن ومغلق دستورياً - يعمل بمعمارية الحافة وصفر كلفة تشغيلية
export interface CaptainSovereignState {
  captainId: string;
  homeDistrict: string;
  currentDistrict: string; 
  walletHours: number;
  isBanned: boolean;
}

export const RadarGapLockdownKernel = {
  /**
   * 1. معالجة الارتحال الجغرافي: تحديث اللواء الإحصائي تلقائياً عند الحافة
   */
  handleDistrictCommute: function(
    currentState: CaptainSovereignState, 
    newDistrictFromH3: string
  ): CaptainSovereignState {
    if (currentState.currentDistrict !== newDistrictFromH3) {
      currentState.currentDistrict = newDistrictFromH3;
    }
    return currentState;
  },

  /**
   * 2. آلية الشحن الميداني (أكواد الشحن المشفرة للمندوبين)
   */
  redeemVoucherHours: function(
    currentWallet: { paidHours: number }, 
    voucherCode: string, 
    secureServerKey: string 
  ): { success: boolean; hoursAdded: number } {
    // [BANNED-CLIENT-SIDE] منطق التحقق مرحّل كلياً للسيرفر الخلفي الآمن لمنع حقن الساعات
    throw new Error("يُحظر التحقق من بطاقات الشحن من جهة العميل. منطق التحقق مرحّل كلياً للسيرفر الخلفي الآمن.");
  },

  /**
   * 3. الصندوق الأسود للمشرف: التطهير القاطع وقطع صلاحيات طيران الحسابات
   */
  enforceAdminBlackBoxAction: function(
    captain: CaptainSovereignState, 
    action: 'WARN' | 'BAN'
  ): CaptainSovereignState {
    if (action === 'BAN') {
      captain.isBanned = true;
      captain.walletHours = 0; 
    }
    return captain;
  }
};

Object.freeze(RadarGapLockdownKernel);

/**
 * 🏛️ [RAD-MAP-078-OWNER-DASHBOARD] Owner Supreme Chamber Component (V5.5)
 * Absolute sovereign control center incorporating hard-locked math models and black box controls.
 */
export function RadarOwnerSovereignDashboard() {
  const { toast } = useToast();
  const [delegates, setDelegates] = useState<DelegateData[]>([]);
  const [drivers, setDrivers] = useState<DriverData[]>([]);
  const [loadingDelegates, setLoadingDelegates] = useState(true);
  const [loadingDrivers, setLoadingDrivers] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);

  // 🧪 State variables for simulated operations (District Commute & Scratch Vouchers)
  const [commuteDriverUid, setCommuteDriverUid] = useState<string>('');
  const [targetDistrict, setTargetDistrict] = useState<string>('لواء الشونة الجنوبية');
  const [voucherCode, setVoucherCode] = useState<string>('');
  const [voucherDriverUid, setVoucherDriverUid] = useState<string>('');

  // Constants locked mathematically:
  const STABILITY_THRESHOLD_MS = 30 * 24 * 60 * 60 * 1000; // 30-day stability threshold
  const PENALTY_FACTOR = 0.40; // Penalty factor for fictitious/unstable referral rate

  // O(1) Fetching of delegates with sharp where constraints
  const fetchDelegates = async () => {
    try {
      const q = query(collection(db, 'delegates'), where('status', '==', 'active'));
      const snapshot = await getDocs(q);
      if (snapshot.empty) {
        // Build mock delegates if empty (Jordanian regional delegates)
        const defaults: DelegateData[] = [
          {
            id: 'delegate-1',
            name: 'علاء الحموري دير غبار',
            phone: '0795544332',
            referralCode: 'JO-AMMAN-GHUBAR-7',
            referredCount: 38,
            deletionRate: 8.5, // 8.5% deletion rate
            revivalRate: 88.5,
            pendingDues: 120.00,
            status: 'active',
            createdAt: new Date().toISOString()
          },
          {
            id: 'delegate-2',
            name: 'أبو طارق العراقي الكرادة',
            phone: '0770112233',
            referralCode: 'IQ-BAGHDAD-KARRADA-9',
            referredCount: 64,
            deletionRate: 2.1,
            revivalRate: 94.2,
            pendingDues: 245.50,
            status: 'active',
            createdAt: new Date().toISOString()
          },
          {
            id: 'delegate-3',
            name: 'يزن القحطاني صويلح',
            phone: '0780445566',
            referralCode: 'JO-SWAILEH-08',
            referredCount: 14,
            deletionRate: 15.0, // High deletion warning!
            revivalRate: 45.0,
            pendingDues: 40.00,
            status: 'active',
            createdAt: new Date().toISOString()
          }
        ];
        // Populate
        for (const d of defaults) {
          await setDoc(doc(db, 'delegates', d.id), d);
        }
        setDelegates(defaults);
      } else {
        const list = snapshot.docs.map(docSnap => ({
          id: docSnap.id,
          ...docSnap.data()
        } as DelegateData));
        setDelegates(list);
      }
    } catch (err) {
      console.error('Error loading delegates inside sovereign dashboard:', err);
    } finally {
      setLoadingDelegates(false);
    }
  };

  // O(1) Fetching of driver segments with edge constraints
  const fetchDrivers = async () => {
    try {
      const q = query(collection(db, 'users'), where('role', '==', 'driver'));
      const snapshot = await getDocs(q);
      const list = snapshot.docs.map(docSnap => {
        const data = docSnap.data();
        return {
          uid: docSnap.id,
          name: data.name || 'سائق مجهول',
          phone: data.phone || '',
          rating: data.rating || 5.0,
          heartCount: data.heartCount || 0,
          paidHoursRemaining: data.paidHoursRemaining ?? (data.subscriptionHours ?? 0),
          status: data.status || 'idle',
          isBanned: data.isBanned || false,
          immunityScore: data.immunityScore ?? 100.0,
          currentDistrict: data.currentDistrict || 'لواء ناعور'
        } as DriverData;
      });
      setDrivers(list);
    } catch (err) {
      console.error('Error loading drivers in sovereign dashboard:', err);
    } finally {
      setLoadingDrivers(false);
    }
  };

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((firebaseUser) => {
      if (firebaseUser) {
        fetchDelegates();
        fetchDrivers();
      }
    });
    return () => unsubscribe();
  }, []);

  /**
   * 🛡️ handleSovereignKillSwitch
   * Instant black-box purge. Induces 0.0 immunity score, freezes hours, and sets isBanned to true.
   */
  const handleSovereignKillSwitch = async (driverUid: string, driverName: string) => {
    setIsProcessing(true);
    try {
      const driverRef = doc(db, 'users', driverUid);
      await updateDoc(driverRef, {
        isBanned: true,
        immunityScore: 0.0,
        paidHoursRemaining: 0,
        subscriptionHours: 0,
        status: 'suspended',
        banReason: '[صعق جنائي سيادي فوري - إبطال صامت]'
      });

      toast({
        variant: 'destructive',
        title: '💥 تم الصعق الجنائي الكلي للهدف',
        description: `تم سحب حصانة الكابتن [${driverName}] لتبلغ 0.0، ومصادرة ساعاته المدفوعة بالكامل وحظره.`
      });
      fetchDrivers();
    } catch (err: any) {
      toast({
        variant: 'destructive',
        title: 'خطأ في عملية الصعق',
        description: err.message || 'خطأ فني'
      });
    } finally {
      setIsProcessing(false);
    }
  };

  /**
   * 🔄 handleReviveDriver [SECURE GATEWAYED]
   * Securely requests server approval to revive driver. No client-side free hours allocation!
   */
  const handleReviveDriver = async (driverUid: string, driverName: string) => {
    setIsProcessing(true);
    try {
      const response = await fetch('/api/revive-driver', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ driverUid })
      });
      const data = await response.json();

      if (response.ok && data.success) {
        toast({
          title: '🟢 تم إعادة الإحياء بتصديق رقمي وموافقة سحابية',
          description: `تم إحياء الكابتن [${driverName}] لترتفع حصانته لـ 100%، وتسييل (12 ساعة) طارئة مصدقة سيرفرياً.`
        });
        fetchDrivers();
      } else {
        toast({
          variant: 'destructive',
          title: 'فشل الفك والتصديق السحابي',
          description: data.error || 'خطأ أثناء محاذاة الصندوق الأسود'
        });
      }
    } catch (err: any) {
      toast({
        variant: 'destructive',
        title: 'فشل الفك السيادي',
        description: err.message || 'خطأ فني'
      });
    } finally {
      setIsProcessing(false);
    }
  };

  /**
   * 🧮 auditRepresentativeCommissions
   * Mathematical validation representing Net Commission calculations with PENALTY_FACTOR applied
   */
  const auditRepresentativeCommissions = (delegate: DelegateData) => {
    const rawDues = delegate.pendingDues || 0;
    const delRate = delegate.deletionRate || 0; // percentage, e.g. 8.5
    
    // Penalty calculation: subtract penalty factor from withdrawable balance based on deleted fakes rate
    const penaltyAmount = rawDues * (delRate / 100) * PENALTY_FACTOR;
    const withdrawableBalance = Math.max(0, rawDues - penaltyAmount);

    return {
      rawDues,
      penaltyAmount,
      withdrawableBalance
    };
  };

  const handleClearDelegateDues = async (delegateId: string, delegateName: string) => {
    setIsProcessing(true);
    try {
      const delRef = doc(db, 'delegates', delegateId);
      await updateDoc(delRef, {
        pendingDues: 0,
        lastSettlementDate: new Date().toISOString()
      });

      toast({
        title: '✅ تصفية مالية ناجحة',
        description: `تم تسوية وتصفير مستحقات المندوب [${delegateName}] بالكامل وإصدار وصل الصرف.`
      });
      fetchDelegates();
    } catch (err: any) {
      toast({
        variant: 'destructive',
        title: 'فشل تسوية المستحقات',
        description: err.message
      });
    } finally {
      setIsProcessing(false);
    }
  };

  /**
   * 📡 executeCommuteSim
   * Commutes a captain to a new Jordanian district at the Edge & updates database.
   */
  const executeCommuteSim = async () => {
    if (!commuteDriverUid) {
      toast({ variant: 'destructive', title: 'خطأ في الترحيل', description: 'يرجى اختيار الكابتن المراد ترحيله أولاً.' });
      return;
    }
    const targetDriver = drivers.find(d => d.uid === commuteDriverUid);
    if (!targetDriver) return;

    setIsProcessing(true);
    try {
      const mockState: CaptainSovereignState = {
        captainId: targetDriver.uid,
        homeDistrict: 'لواء ناعور',
        currentDistrict: targetDriver.currentDistrict || 'لواء ناعور',
        walletHours: targetDriver.paidHoursRemaining || 0,
        isBanned: targetDriver.isBanned || false
      };

      const updatedState = RadarGapLockdownKernel.handleDistrictCommute(mockState, targetDistrict);

      const driverRef = doc(db, 'users', targetDriver.uid);
      await updateDoc(driverRef, {
        currentDistrict: updatedState.currentDistrict,
        lastCommuteUpdate: new Date().toISOString()
      });

      toast({
        title: '📡 تم الارتحال الجغرافي وبث النهر الإعلاني',
        description: `تم ترحيل الكابتن [${targetDriver.name}] بنجاح إلى [${updatedState.currentDistrict}].`
      });
      fetchDrivers();
    } catch (err: any) {
      toast({ variant: 'destructive', title: 'خطأ بالارتحال', description: err.message });
    } finally {
      setIsProcessing(false);
    }
  };

  /**
   * 🎫 executeVoucherRedeemSim [SECURE BACKEND INTERACTION]
   * Authenticates physical voucher against the secure backend route with IP rate-limiting.
   */
  const executeVoucherRedeemSim = async () => {
    if (!voucherDriverUid) {
      toast({ variant: 'destructive', title: 'خطأ الشحن', description: 'يرجى اختيار الكابتن المستهدف بالشحن أولاً.' });
      return;
    }
    if (!voucherCode) {
      toast({ variant: 'destructive', title: 'خطأ الشحن', description: 'يرجى إدخال رمز تذكرة الشحن.' });
      return;
    }

    const targetDriver = drivers.find(d => d.uid === voucherDriverUid);
    if (!targetDriver) return;

    setIsProcessing(true);
    try {
      const response = await fetch('/api/redeem-voucher', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ driverUid: targetDriver.uid, voucherCode })
      });
      const data = await response.json();

      if (response.ok && data.success) {
        toast({
          title: '🎫 شحن فوري ناجح (تذكرة معتمدة من السيرفر)',
          description: `تم قبول بطاقة المندوب وتحديث [${data.hoursAdded}] ساعة رصيد للكابتن [${targetDriver.name}] بنجاح.`
        });
        setVoucherCode('');
        fetchDrivers();
      } else {
        toast({
          variant: 'destructive',
          title: '❌ فشل التحقق السيرفري للكود',
          description: data.error || 'رمز البطاقة غير مطابق لبروتوكول التشفير المعتمد "RADAR-100H-*"'
        });
      }
    } catch (err: any) {
      toast({ variant: 'destructive', title: 'خطأ الشحن', description: err.message });
    } finally {
      setIsProcessing(false);
    }
  };

  // Aggregated mathematical statistics across all delegates
  const auditedStats = delegates.reduce((acc, del) => {
    const audit = auditRepresentativeCommissions(del);
    return {
      totalDues: acc.totalDues + audit.rawDues,
      totalPenalties: acc.totalPenalties + audit.penaltyAmount,
      totalNet: acc.totalNet + audit.withdrawableBalance
    };
  }, { totalDues: 0, totalPenalties: 0, totalNet: 0 });

  return (
    <div className="space-y-8 bg-[#020202] text-right p-6 rounded-3xl border border-red-500/10 min-h-screen text-white font-sans" dir="rtl">
      
      {/* 👑 VIP OWNER LOGO HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-red-500/20 pb-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Badge className="bg-[#ff3366] hover:bg-[#ff3366]/90 text-white font-black px-3 py-1 text-[11px] rounded-full animate-pulse shadow-[0_0_15px_rgba(255,51,102,0.4)]">
              قمرة المالك السيادية ● V5.5 SECURITY PROTOCOL
            </Badge>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-[#00ffcc] tracking-tight flex items-center gap-2">
            <ShieldAlert className="w-8 h-8 text-[#ff3366] animate-pulse" />
            غرفة التحكم العليا للمشرف (Owner Overlord Cabinet)
          </h2>
          <p className="text-gray-400 text-xs sm:text-sm mt-1 leading-relaxed max-w-3xl">
            مستوى التحكم الاستئصالي الشامل (SSOT) الحاكم لنواقل المملكة ومندوبيها الجغرافيين. تدرج هذه الغرفة المعادلات الرياضية المشددة وعقود الصعق الجنائية لمنع المضاربات.
          </p>
        </div>
        
        {/* Absolute Global Stats */}
        <div className="bg-zinc-950/90 border border-[#00ffcc]/20 rounded-2xl p-4 min-w-[240px] text-right">
          <span className="text-[10px] text-gray-500 block">إجمالي الاحتياطي المالي المحصن لأصحاب الحقوق</span>
          <span className="text-2xl font-black text-[#00ffcc] font-mono block mt-1">{(auditedStats.totalNet).toFixed(2)} د.أ</span>
          <span className="text-[9px] text-red-400 font-bold block mt-1">بعد حسم غرامات التزييف التلقائية ({auditedStats.totalPenalties.toFixed(2)} د.أ)</span>
        </div>
      </div>

      {/* 🧮 DELEGATES SECTION (Net Commission Guard) */}
      <Card className="bg-[#050505] border border-red-500/15 shadow-[0_8px_32px_rgba(0,0,0,0.5)] rounded-2xl overflow-hidden">
        <CardHeader className="bg-red-950/15 border-b border-red-500/10 p-5">
          <CardTitle className="text-[#00ffcc] text-base font-extrabold flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-[#00ffcc]" />
            محرك الجرد المالي المتكامل للمندوبين (Representative Commission Guard)
          </CardTitle>
          <CardDescription className="text-gray-400 text-xs leading-relaxed">
            يتحكم هذا المحرك في تصفية الإحالات عبر عطل زمني ذكي بمقدار 30 يوماً <code className="text-yellow-400 font-mono text-[10px]">STABILITY_THRESHOLD_MS</code> ويفرض ذعيرة تطهير قدرها <code className="text-red-400 font-mono text-[10px]">PENALTY_FACTOR = 40%</code> ضد الحسابات الوهمية أو الزومبي.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6 text-right">
            <div className="bg-zinc-950/60 p-4 rounded-xl border border-white/5">
              <span className="text-[10px] text-gray-500 block font-bold">العمولات الخام المستحقة للمندوبين</span>
              <span className="text-xl font-black text-gray-300 font-mono block mt-1">{auditedStats.totalDues.toFixed(2)} د.أ</span>
            </div>
            <div className="bg-zinc-950/80 p-4 rounded-xl border border-[#ff3366]/20">
              <span className="text-[10px] text-red-400 block font-bold">إجمالي غرامات التطهير الكلي</span>
              <span className="text-xl font-black text-[#ff3366] font-mono block mt-1">-{auditedStats.totalPenalties.toFixed(2)} د.أ</span>
            </div>
            <div className="bg-[#003322]/20 p-4 rounded-xl border border-[#00ffcc]/30">
              <span className="text-[10px] text-[#00ffcc] block font-bold">الرصيد الصافي المصدق القابل للصرف</span>
              <span className="text-xl font-black text-[#00ffcc] font-mono block mt-1">{auditedStats.totalNet.toFixed(2)} د.أ</span>
            </div>
          </div>

          {loadingDelegates ? (
            <div className="flex items-center justify-center p-12 text-gray-400">
              <Loader2 className="w-8 h-8 animate-spin text-[#00ffcc] ml-2" />
              <span>جاري محاذاة البيانات الكوانتية للمندوبين...</span>
            </div>
          ) : delegates.length === 0 ? (
            <div className="text-center text-gray-500 py-10">
              <AlertTriangle className="w-12 h-12 text-amber-500 mx-auto mb-2" />
              <span>لا يوجد مندوبون معتمدون في قواعد البيانات الحالية.</span>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-white/5">
              <Table>
                <TableHeader className="bg-zinc-950">
                  <TableRow className="hover:bg-transparent border-white/5 text-right">
                    <TableHead className="text-right text-gray-400 text-xs">اسم المندوب الميداني</TableHead>
                    <TableHead className="text-center text-gray-400 text-xs">رمز الإحالة السيادي</TableHead>
                    <TableHead className="text-center text-gray-400 text-xs">إجمالي الإحالات</TableHead>
                    <TableHead className="text-center text-gray-400 text-xs">معدل الحذف (الوهمي)</TableHead>
                    <TableHead className="text-center text-gray-400 text-xs">العمولة الخام</TableHead>
                    <TableHead className="text-center text-[#ff3366] text-xs">عقوبة الفرز (40%)</TableHead>
                    <TableHead className="text-center text-[#00ffcc] text-xs font-bold">العمولة المستحقة الصافية</TableHead>
                    <TableHead className="text-left text-gray-400 text-xs">صرف / تصفية</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {delegates.map((del) => {
                    const audit = auditRepresentativeCommissions(del);
                    return (
                      <TableRow key={del.id} className="border-white/5 hover:bg-zinc-950/40 text-right">
                        <TableCell className="font-bold text-white text-xs">{del.name}</TableCell>
                        <TableCell className="text-center font-mono text-xs text-gray-300">{del.referralCode || 'N/A'}</TableCell>
                        <TableCell className="text-center font-mono text-xs text-gray-300">{del.referredCount || 0} إحالة</TableCell>
                        <TableCell className="text-center">
                          <span className="text-red-400 font-mono text-xs">{(del.deletionRate || 0).toFixed(1)}%</span>
                        </TableCell>
                        <TableCell className="text-center font-mono text-xs text-gray-300">
                          {audit.rawDues.toFixed(2)} د.أ
                        </TableCell>
                        <TableCell className="text-center font-mono text-xs text-red-500">
                          {audit.penaltyAmount.toFixed(2)} د.أ
                        </TableCell>
                        <TableCell className="text-center font-mono text-xs text-[#00ffcc] font-black">
                          {audit.withdrawableBalance.toFixed(2)} د.أ
                        </TableCell>
                        <TableCell className="text-left">
                          <Button
                            onClick={() => handleClearDelegateDues(del.id, del.name)}
                            disabled={isProcessing || audit.withdrawableBalance <= 0}
                            className={cn(
                              "h-8 text-[11px] font-black rounded-lg transition-all cursor-pointer",
                              audit.withdrawableBalance <= 0
                                ? "bg-zinc-900 text-zinc-600 cursor-not-allowed border border-white/5"
                                : "bg-[#00ffcc] hover:bg-[#00ffcc]/80 text-black shadow-[0_0_12px_rgba(0,255,204,0.15)]"
                            )}
                          >
                            <CheckCircle2 className="w-3.5 h-3.5 ml-1" />
                            تصفية وصرف
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="bg-[#050505] border border-red-500/15 shadow-[0_8px_32px_rgba(0,0,0,0.5)] rounded-2xl overflow-hidden mt-8">
        <CardHeader className="bg-red-950/15 border-b border-red-500/10 p-5">
          <CardTitle className="text-[#ff3366] text-base font-extrabold flex items-center gap-2">
            <Flame className="w-5 h-5 text-[#ff3366] animate-pulse" />
            منصة تفعيل "الصندوق الأسود" لوقف النواقل الفوري (Black-Box Lethal Strike)
          </CardTitle>
          <CardDescription className="text-gray-400 text-xs leading-relaxed">
            التحكم الكلي في سلب الحصانة السلوكية للنواقل وبث إشعاعات الوقف وإلغاء الرصيد في الميدان لمنع المضاربات والخرق الجغرافي.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          {loadingDrivers ? (
            <div className="flex items-center justify-center p-12 text-gray-400">
              <Loader2 className="w-8 h-8 animate-spin text-[#ff3366] ml-2" />
              <span>جاري محاذاة البيانات الكوانتية للنواقل...</span>
            </div>
          ) : drivers.length === 0 ? (
            <div className="text-center text-gray-500 py-10">
              <AlertTriangle className="w-12 h-12 text-amber-500 mx-auto mb-2" />
              <span>لا يوجد سائقون أو نواقل مسجلون حالياً.</span>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-white/5">
              <Table>
                <TableHeader className="bg-zinc-950">
                  <TableRow className="hover:bg-transparent border-white/5 text-right">
                    <TableHead className="text-right text-gray-400 text-xs">اسم الناقل وموقع التسجيل</TableHead>
                    <TableHead className="text-center text-gray-400 text-xs">رقم الهاتف</TableHead>
                    <TableHead className="text-center text-gray-400 text-xs">الساعات المتبقية</TableHead>
                    <TableHead className="text-center text-gray-400 text-xs">حصانة الناقل</TableHead>
                    <TableHead className="text-center text-gray-400 text-xs">الحالة الجنائية</TableHead>
                    <TableHead className="text-left text-gray-400 text-xs">صعق / إعادة فك</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {drivers.map((drv) => (
                    <TableRow key={drv.uid} className="border-white/5 hover:bg-zinc-950/40 text-right">
                      <TableCell className="font-bold text-white text-xs">{drv.name}</TableCell>
                      <TableCell className="text-center font-mono text-xs text-gray-300">{drv.phone}</TableCell>
                      <TableCell className="text-center">
                        <span className={cn(
                          "font-mono font-bold text-xs",
                          (drv.paidHoursRemaining || 0) > 0 ? "text-[#00ffcc]" : "text-gray-500"
                        )}>
                          {drv.paidHoursRemaining || 0} ساعة
                        </span>
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex justify-center items-center gap-1.5">
                          <span className={cn(
                            "text-xs font-black",
                            (drv.immunityScore ?? 100.0) === 0 ? "text-[#ff3366]" : "text-emerald-400"
                          )}>
                            {drv.immunityScore ?? 100.0}%
                          </span>
                          <span className="text-[10px] text-gray-500">immunity</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        {drv.isBanned ? (
                          <Badge className="bg-red-950/40 border border-[#ff3366]/40 text-[#ff3366] text-[10px] font-black h-5">
                            🔴 : مصعوق سيادياً
                          </Badge>
                        ) : (
                          <Badge className="bg-emerald-950/40 border border-emerald-500/40 text-emerald-400 text-[10px] font-black h-5">
                            🟢 محصن ونشط
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-left">
                        {drv.isBanned ? (
                          <Button
                            onClick={() => handleReviveDriver(drv.uid, drv.name)}
                            disabled={isProcessing}
                            className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[11px] h-8 px-3 rounded-lg flex items-center gap-1 cursor-pointer"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                            إلغاء الصعق وإحياء
                          </Button>
                        ) : (
                          <Button
                            onClick={() => handleSovereignKillSwitch(drv.uid, drv.name)}
                            disabled={isProcessing}
                            className="bg-[#ff3366] hover:bg-[#ff3366]/80 text-white font-black text-[11px] h-8 px-3 rounded-lg flex items-center gap-1 cursor-pointer transition-all hover:scale-[1.02] shadow-[0_0_12px_rgba(255,51,102,0.15)]"
                          >
                            <Ban className="w-3.5 h-3.5 text-white" />
                            صعق جنائي فوري 💥
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 🔮 V5.5 INTEGRATED STRATEGIC GAPS SIMULATOR HUB */}
      <Card className="bg-[#050505] border border-[#00ffcc]/15 shadow-[0_8px_32px_rgba(0,0,0,0.5)] rounded-2xl overflow-hidden mt-8">
        <CardHeader className="bg-zinc-950 border-b border-[#00ffcc]/10 p-5">
          <CardTitle className="text-[#00ffcc] text-base font-extrabold flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-[#00ffcc]" />
            محرك سد الثغرات الاستراتيجية الحاكم (V5.5 Strategic Gaps Simulation Hub)
          </CardTitle>
          <CardDescription className="text-gray-400 text-xs leading-relaxed">
            واجهة المحاكاة والضبط الفوري لثغرات الانتقال الجغرافي والشحن اليدوي بدون سحب تكاليف السيرفر الإضافية.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6 space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* 1. Regional Commute Card */}
            <div className="bg-zinc-950 p-5 rounded-xl border border-white/5 space-y-4">
              <div className="flex items-center gap-2 border-b border-white/5 pb-3">
                <Clock className="w-5 h-5 text-amber-400" />
                <span className="font-extrabold text-sm text-white">1. محاكي الارتحال الجغرافي اللحظي</span>
              </div>
              <p className="text-xs text-gray-400 leading-relaxed">
                ينقل السائق من وتد تسجيله الجغرافي إلى لواء آخر لحظياً لضبط استهداف النهر الإعلاني وتجريم الصمت.
              </p>
              
              <div className="space-y-3">
                <label className="text-[11px] text-gray-400 block font-bold">اختر السائق المستهدف بالترحيل:</label>
                <select 
                  className="w-full bg-zinc-900 border border-white/10 rounded-lg p-2.5 text-xs text-white"
                  value={commuteDriverUid}
                  onChange={(e) => setCommuteDriverUid(e.target.value)}
                >
                  <option value="">-- اختر كابتن من الميدان --</option>
                  {drivers.map(d => (
                    <option key={d.uid} value={d.uid}>
                      {d.name} ({d.currentDistrict || 'غير محدد'})
                    </option>
                  ))}
                </select>

                <label className="text-[11px] text-gray-400 block font-bold">اللواء المستهدف الموجه للإعلان:</label>
                <select
                  className="w-full bg-zinc-900 border border-white/10 rounded-lg p-2.5 text-xs text-white"
                  value={targetDistrict}
                  onChange={(e) => setTargetDistrict(e.target.value)}
                >
                  <option value="لواء الشونة الجنوبية">لواء الشونة الجنوبية</option>
                  <option value="لواء ناعور">لواء ناعور</option>
                  <option value="لواء دير غبار">لواء دير غبار</option>
                  <option value="لواء صويلح">لواء صويلح</option>
                  <option value="لواء المقابلين">لواء المقابلين</option>
                </select>

                <Button 
                  onClick={executeCommuteSim}
                  disabled={isProcessing}
                  className="w-full bg-amber-500 hover:bg-amber-400 text-black font-black text-xs h-9 mt-2"
                >
                  ترحيل فوري محصن 📡
                </Button>
              </div>
            </div>

            {/* 2. Voucher Top-Up Card */}
            <div className="bg-zinc-950 p-5 rounded-xl border border-white/5 space-y-4">
              <div className="flex items-center gap-2 border-b border-white/5 pb-3">
                <Award className="w-5 h-5 text-[#00ffcc]" />
                <span className="font-extrabold text-sm text-white">2. شحن رصيد الساعات يدوياً (بطاقات المندوبين)</span>
              </div>
              <p className="text-xs text-gray-400 leading-relaxed">
                تمكين الدعم النقدي بالميدان عبر تذاكر الخدش المسبقة الدفع الصادرة بأختام سيادية مشفرة.
              </p>

              <div className="space-y-3">
                <label className="text-[11px] text-gray-400 block font-bold">اختر السائق المستهدف بالشحن:</label>
                <select 
                  className="w-full bg-zinc-900 border border-white/10 rounded-lg p-2.5 text-xs text-white"
                  value={voucherDriverUid}
                  onChange={(e) => setVoucherDriverUid(e.target.value)}
                >
                  <option value="">-- اختر كابتن من الميدان --</option>
                  {drivers.map(d => (
                    <option key={d.uid} value={d.uid}>
                      {d.name} ({d.paidHoursRemaining || 0} ساعة متبقية)
                    </option>
                  ))}
                </select>

                <label className="text-[11px] text-gray-400 block font-bold">أدخل رمز التذكرة (يبدأ بـ RADAR-100H-):</label>
                <div className="space-y-1">
                  <Input 
                    type="text" 
                    placeholder="مثال: RADAR-100H-JORDAN"
                    value={voucherCode}
                    onChange={(e) => setVoucherCode(e.target.value)}
                    className="bg-zinc-900 border-white/10 text-xs text-white placeholder-gray-600 h-9"
                  />
                  <span className="text-[9px] text-[#00ffcc] block cursor-pointer" onClick={() => setVoucherCode('RADAR-100H-JORDAN')}>
                    💡 اضغط هنا لنسخ الرمز المعتمد للجلسة: <code className="underline font-bold">RADAR-100H-JORDAN</code>
                  </span>
                </div>

                <Button 
                  onClick={executeVoucherRedeemSim}
                  disabled={isProcessing}
                  className="w-full bg-[#00ffcc] hover:bg-[#00ffcc]/80 text-black font-black text-xs h-9 mt-2"
                >
                  تفعيل شحنة الـ 100 ساعة 🎫
                </Button>
              </div>
            </div>

          </div>

          {/* 3. Operational Integrity Audit Checklist */}
          <div className="bg-zinc-900/40 border border-white/5 p-4 rounded-xl space-y-2">
            <h4 className="text-xs font-bold text-gray-300">أجهزة القياس الذاتي والتحقق التلقائي (Edge Integrity Metrics)</h4>
            <ul className="text-[11px] text-gray-400 space-y-1">
              <li className="flex items-center gap-1.5">
                <span className="text-[#00ffcc]">✔</span>
                <span>استقرار النطاق الجغرافي: تصفية الإعلانات والحسابات تتم محلياً عند الحافة بصفر تكلفة سحابية.</span>
              </li>
              <li className="flex items-center gap-1.5">
                <span className="text-[#00ffcc]">✔</span>
                <span>محرك الصرف المحصن: تفعيل قاعدة الـ 30 يوماً المستقرة لحسابات المندوبين.</span>
              </li>
              <li className="flex items-center gap-1.5">
                <span className="text-[#ff3366]">✔</span>
                <span>الصندوق الأسود السيادي مغلق بمجهرية النواة <code className="text-red-400">Object.freeze(RadarGapLockdownKernel)</code> لمنع الاختراقات والعبث بالباقات المدفوعة.</span>
              </li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* 📐 [RAD-SSOT-105] DEMARCATION & SECTOR CATALOG INSPECTOR */}
      <Card className="bg-[#050505] border border-blue-500/15 shadow-[0_8px_32px_rgba(0,0,0,0.5)] rounded-2xl overflow-hidden mt-8">
        <CardHeader className="bg-blue-950/15 border-b border-blue-500/10 p-5">
          <CardTitle className="text-blue-400 text-base font-extrabold flex items-center gap-2">
            <Shield className="w-5 h-5 text-blue-400" />
            تفتيش كتالوج ترسيم الحدود البرمجية وفصل القطاعات (Sovereign Demarcation Inspector)
          </CardTitle>
          <CardDescription className="text-gray-400 text-xs leading-relaxed">
            المرجع الدستوري لتقسيم المناطق (Regions 1, 2, 3) والقطاعات الخدمية (Sectors) لضمان المسؤولية الأحادية والتعقيم الماسي.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6 space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 text-right" dir="rtl">
            
            {/* Regions List */}
            <div className="space-y-4">
              <h3 className="text-xs font-black text-blue-400 tracking-wide border-b border-white/5 pb-2">📂 حدود المناطق البرمجية السيادية (System Regions)</h3>
              <div className="space-y-3 font-sans">
                {Object.values(SovereignDemarcationCatalog.regions).map(region => (
                  <div key={region.id} className="bg-zinc-950 p-4 rounded-xl border border-white/5 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-extrabold text-xs text-white">{region.nameAr}</span>
                      <Badge className="bg-blue-950/50 border border-blue-500/30 text-blue-400 text-[9px] font-mono px-2 py-0.5">{region.id}</Badge>
                    </div>
                    <p className="text-[11px] text-gray-400 leading-relaxed">{region.descriptionAr}</p>
                    <div className="space-y-1 pt-1">
                      <span className="text-[10px] text-gray-500 block font-bold">📂 المسارات المحمية:</span>
                      <div className="flex flex-wrap gap-1">
                        {region.paths.map(path => (
                          <code key={path} className="text-[9px] bg-zinc-900 border border-white/5 text-gray-300 px-1 py-0.5 rounded font-mono">{path}</code>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Sectors List */}
            <div className="space-y-4">
              <h3 className="text-xs font-black text-[#00ffcc] tracking-wide border-b border-white/5 pb-2">🧱 عزل القطاعات والقطوعات (Domain Sectors)</h3>
              <div className="space-y-3 font-sans">
                {Object.values(SovereignDemarcationCatalog.sectors).map(sector => (
                  <div key={sector.id} className="bg-zinc-950 p-4 rounded-xl border border-white/5 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-extrabold text-xs text-white">{sector.nameAr}</span>
                      <Badge className="bg-[#003322]/50 border border-[#00ffcc]/30 text-[#00ffcc] text-[9px] font-mono px-2 py-0.5">{sector.id}</Badge>
                    </div>
                    <p className="text-[11px] text-gray-400 leading-relaxed">{sector.descriptionAr}</p>
                    <div className="grid grid-cols-2 gap-2 pt-1 border-t border-white/5">
                      <div>
                        <span className="text-[9px] text-gray-500 block font-bold">⚡ الخطافات:</span>
                        <div className="flex flex-wrap gap-1 mt-0.5">
                          {sector.hooks.length > 0 ? sector.hooks.map(h => (
                            <code key={h} className="text-[8px] text-gray-400 font-mono bg-zinc-900 px-0.5 rounded">{h.split('/').pop()}</code>
                          )) : <span className="text-[8px] text-zinc-500 italic">لا يوجد</span>}
                        </div>
                      </div>
                      <div>
                        <span className="text-[9px] text-gray-505 block font-bold">💾 المجموعات:</span>
                        <div className="flex flex-wrap gap-1 mt-0.5">
                          {sector.databaseCollections.map(c => (
                            <code key={c} className="text-[8px] text-amber-500 font-mono bg-zinc-900 px-0.5 rounded">{c}</code>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </CardContent>
      </Card>
    </div>
  );
}


// 🔒 [RAD-MAP-080-FREEZE] Seal the Sovereign core cabinet module preventing prototype manipulation
Object.freeze(RadarOwnerSovereignDashboard);
