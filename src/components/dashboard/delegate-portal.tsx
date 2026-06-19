'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Users, 
  Gift, 
  TrendingUp, 
  DollarSign, 
  Copy, 
  Check, 
  Clock, 
  ShieldCheck, 
  AlertCircle, 
  Calculator, 
  LogOut,
  QrCode,
  ArrowRightLeft,
  ChevronRight,
  HandCoins,
  RefreshCw,
  FileCheck
} from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { db } from '@/lib/firebase';
import { doc, getDoc, getDocs, updateDoc, setDoc, addDoc, collection, onSnapshot, query, where, orderBy } from 'firebase/firestore';

interface ReferredUser {
  id: string;
  name: string;
  phone: string;
  role: 'driver' | 'rider';
  joinedAt: string;
  status: 'active' | 'inactive' | 'pending';
  tripsCount: number;
  commissionEarned: number;
}

export function DelegatePortal() {
  const { user, logout } = useAuth();
  const [copied, setCopied] = useState(false);
  const [successSettlement, setSuccessSettlement] = useState(false);
  const [isRequestingSettlement, setIsRequestingSettlement] = useState(false);
  
  // Commission Calculator States
  const [projectedDrivers, setProjectedDrivers] = useState(25);
  const [avgTripsPerDriver, setAvgTripsPerDriver] = useState(15);
  
  // Realtime or simulation states
  const [pendingDues, setPendingDues] = useState(user?.pendingDues || 85.50);
  const [referralCount, setReferralCount] = useState(user?.referredCount || 142);
  const [referralCode, setReferralCode] = useState(user?.referralCode || 'RAD-JOR-777');

  const [referredList, setReferredList] = useState<ReferredUser[]>([
    { id: 'ref-1', name: 'أحمد الحجايا (كابتن)', phone: '+96279****442', role: 'driver', joinedAt: '2026-06-10', status: 'active', tripsCount: 148, commissionEarned: 44.40 },
    { id: 'ref-2', name: 'حمزة الزعبي (كابتن)', phone: '+96278****981', role: 'driver', joinedAt: '2026-06-12', status: 'active', tripsCount: 102, commissionEarned: 30.60 },
    { id: 'ref-3', name: 'يوسف العبداللات (مسافر)', phone: '+96277****039', role: 'rider', joinedAt: '2026-06-14', status: 'active', tripsCount: 35, commissionEarned: 10.50 },
    { id: 'ref-4', name: 'سيف الدين النمري (كابتن)', phone: '+96279****115', role: 'driver', joinedAt: '2026-06-18', status: 'pending', tripsCount: 0, commissionEarned: 0.00 },
  ]);

  const [settlementLogs, setSettlementLogs] = useState([
    { id: 'set-log-1', amount: 150.00, date: '2026-05-30', reference: 'TXN-940-RADJ', status: 'completed' },
    { id: 'set-log-2', amount: 220.00, date: '2026-04-30', reference: 'TXN-419-RADJ', status: 'completed' }
  ]);

  // Sync to firestore if properties are updated in background
  useEffect(() => {
    if (!user?.uid) return;
    const userRef = doc(db, 'users', user.uid);
    const unsubscribe = onSnapshot(userRef, (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        if (data.pendingDues !== undefined) setPendingDues(data.pendingDues);
        if (data.referredCount !== undefined) setReferralCount(data.referredCount);
        if (data.referralCode !== undefined) setReferralCode(data.referralCode);
      }
    });

    return () => unsubscribe();
  }, [user?.uid]);

  const handleCopyCode = () => {
    navigator.clipboard.writeText(referralCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const calculateMonthlyProjection = () => {
    // Each driver subscription is assumed to be 10 JD per hour or similar base
    // Let's assume on average, each referred driver makes the system 0.50 JD commission to the delegate per active day
    // Or 10% of their base commission which is around 3.0 JD monthly per driver active day
    const baseReward = 0.15; // 150 fils per driver trip
    return (projectedDrivers * avgTripsPerDriver * baseReward).toFixed(2);
  };

  const handleRequestSettlement = async () => {
    if (pendingDues <= 0) return;
    setIsRequestingSettlement(true);
    
    try {
      // 1. Log forensic trail to audit ledger in Firestore
      if (user?.uid) {
        const auditLogRef = collection(db, 'audit_ledger');
        await addDoc(auditLogRef, {
          timestamp: new Date().toISOString(),
          actorId: user.uid,
          actorName: user.name,
          actorRole: 'delegate',
          action: 'INSTANT_SETTLEMENT_REQUEST',
          details: {
            requestedAmount: pendingDues,
            referralCode: referralCode,
            district: user.district || 'وادي السير'
          },
          securityClearance: 'DELEGATE_SELF_AUTH'
        });

        // 2. Reduce the pending dues in the owner's users document
        const userRef = doc(db, 'users', user.uid);
        await updateDoc(userRef, {
          pendingDues: 0
        });

        // Also update standard "delegates" collection if this delegate is registered there
        // Find if they exist
        const queries = query(collection(db, 'delegates'), where('phone', '==', user.phone || ''));
        const qs = await getDocs(queries); 
        const match = qs.docs.find((d: any) => d.data().referralCode === referralCode);
        if (match) {
          await updateDoc(doc(db, 'delegates', match.id), {
            pendingDues: 0
          });
        }
      }

      // Add a settlement log dynamically
      const newLog = {
        id: `set-log-${Date.now()}`,
        amount: pendingDues,
        date: new Date().toISOString().split('T')[0],
        reference: `TXN-${Math.floor(100 + Math.random() * 900)}-RADJ`,
        status: 'completed'
      };

      setSettlementLogs([newLog, ...settlementLogs]);
      setPendingDues(0);
      setSuccessSettlement(true);
      setTimeout(() => setSuccessSettlement(false), 4000);
    } catch (e) {
      console.error(e);
    } finally {
      setIsRequestingSettlement(false);
    }
  };

  return (
    <div className="w-full max-w-5xl mx-auto space-y-6 font-sans text-right" dir="rtl">
      
      {/* 👑 ترويسة الهوية السيادية الفخمة */}
      <div className="relative overflow-hidden bg-gradient-to-l from-[#0D1527] via-[#0F1E36] to-[#0A101D] border border-amber-500/20 rounded-3xl p-6 md:p-8 shadow-2xl">
        <div className="absolute top-0 left-0 w-32 h-32 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-48 h-48 bg-[#00ffcc]/5 rounded-full blur-3xl pointer-events-none" />

        <div className="md:flex md:items-center md:justify-between gap-6 relative z-10">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="bg-amber-500/10 border border-amber-500/30 text-amber-400 text-[10px] md:text-xs font-black px-3 py-1 rounded-full tracking-wider animate-pulse">
                🛡️ قمرة السفير الميداني (بروتوكول الوكلاء v5.5)
              </span>
              <span className="bg-[#10B981]/15 border border-[#10B981]/30 text-emerald-400 text-[10px] md:text-xs font-bold px-2.5 py-1 rounded-full">
                نشط ميدانياً ●
              </span>
            </div>
            
            <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight leading-tight">
              أهلاً بك، <span className="text-amber-300 font-extrabold">{user?.name || 'سفير بينكم'}</span>
            </h1>
            <p className="text-xs md:text-sm text-[#94A3B8] leading-relaxed max-w-2xl">
              أنت جزء لا يتجزأ من شريان التمويل والتوسّع الجغرافي لرادار بينكم. تساهم إحالاتك في بناء شبكة فرسان الميدان الأكثر التزاماً في المملكة.
            </p>
          </div>

          <div className="mt-4 md:mt-0 flex gap-2">
            <button
              onClick={logout}
              className="flex items-center gap-2 px-4 py-2 bg-red-950/20 hover:bg-red-950/40 border border-red-500/20 text-red-400 hover:text-red-300 text-xs font-bold rounded-xl transition-all duration-300 cursor-pointer"
            >
              <LogOut className="h-4 w-4" />
              <span>تسجيل الخروج المبرهن</span>
            </button>
          </div>
        </div>

        {/* معلومات تفصيلية عن المندوب */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 pt-6 border-t border-[#1E293B]/70 text-right">
          <div>
            <p className="text-[10px] text-gray-400 uppercase font-bold">الرقم السيادي للوكيل</p>
            <p className="text-xs font-mono text-white mt-1">#REP-{user?.uid?.substring(0, 8).toUpperCase() || 'DEL-777'}</p>
          </div>
          <div>
            <p className="text-[10px] text-gray-400 uppercase font-bold">الموقع الميداني للتغطية</p>
            <p className="text-xs font-bold text-white mt-1">{user?.governorate || 'عمان'} - {user?.district || 'الجامعة'}</p>
          </div>
          <div>
            <p className="text-[10px] text-gray-400 uppercase font-bold">تاريخ الانضمام والاعتماد</p>
            <p className="text-xs font-bold text-white mt-1">19 حزيران 2026</p>
          </div>
          <div>
            <p className="text-[10px] text-gray-400 uppercase font-bold">حالة رخصة الامتياز</p>
            <p className="text-xs font-bold text-emerald-400 mt-1 flex items-center justify-end gap-1">
              <ShieldCheck className="h-3.5 w-3.5" />
              <span>مرخصة بصورة سيادية</span>
            </p>
          </div>
        </div>
      </div>

      {/* 📊 بطاقات المؤشرات الأربعة الكبرى للسيادة */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* إجمالي الإحالات */}
        <div className="bg-[#0A0F1D] border border-amber-500/10 hover:border-amber-500/20 rounded-2xl p-5 text-right relative overflow-hidden transition-all shadow-md group">
          <div className="absolute top-0 left-0 w-2 h-full bg-amber-500/30" />
          <div className="flex justify-between items-start">
            <div className="p-2.5 bg-amber-500/10 rounded-xl text-amber-400 group-hover:scale-110 transition-transform">
              <Users className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[10px] text-gray-400 font-bold">إجمالي الإحالات المعتمدة</p>
              <h3 className="text-2xl font-black text-white mt-1 tracking-tight font-mono">{referralCount}</h3>
            </div>
          </div>
          <div className="mt-3 text-[10px] text-[#10B981] font-bold">
            +18 إحالة جديدة هذا الأسبوع ↑
          </div>
        </div>

        {/* المظلة المالية المتبقية */}
        <div className="bg-[#0A0F1D] border border-emerald-500/10 hover:border-emerald-500/20 rounded-2xl p-5 text-right relative overflow-hidden transition-all shadow-md group">
          <div className="absolute top-0 left-0 w-2 h-full bg-emerald-500/30" />
          <div className="flex justify-between items-start">
            <div className="p-2.5 bg-emerald-500/10 rounded-xl text-emerald-400 group-hover:scale-110 transition-transform">
              <DollarSign className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[10px] text-gray-400 font-bold">الأرباح السيادية المعلقة</p>
              <h3 className="text-2xl font-black text-white mt-1 tracking-tight font-mono">{Number(pendingDues).toFixed(2)} د.أ</h3>
            </div>
          </div>
          <div className="mt-3">
            {pendingDues > 0 ? (
              <button 
                onClick={handleRequestSettlement}
                disabled={isRequestingSettlement}
                className="w-full flex items-center justify-center gap-1.5 py-1 px-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:bg-[#1E293B] disabled:text-gray-400 text-white font-black text-[10px] rounded-lg transition-all active:scale-95 cursor-pointer shadow-lg shadow-emerald-900/10"
              >
                {isRequestingSettlement ? (
                  <>
                    <RefreshCw className="h-3 w-3 animate-spin" />
                    <span>جرى الصرف الفوري...</span>
                  </>
                ) : (
                  <>
                    <HandCoins className="h-3 w-3" />
                    <span>تسوية وصرف مالي فوري ⚡</span>
                  </>
                )}
              </button>
            ) : (
              <span className="text-[10px] text-gray-400 font-bold flex items-center gap-1 justify-end">
                <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
                <span>تمت تصفية كامل المستحقات</span>
              </span>
            )}
          </div>
        </div>

        {/* نسبة النشاط في الميدان */}
        <div className="bg-[#0A0F1D] border border-cyan-500/10 hover:border-cyan-500/20 rounded-2xl p-5 text-right relative overflow-hidden transition-all shadow-md group">
          <div className="absolute top-0 left-0 w-2 h-full bg-cyan-500/30" />
          <div className="flex justify-between items-start">
            <div className="p-2.5 bg-cyan-500/10 rounded-xl text-cyan-400 group-hover:scale-110 transition-transform">
              <TrendingUp className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[10px] text-gray-400 font-bold">نسبة الاحتفاظ بالمرجع</p>
              <h3 className="text-2xl font-black text-white mt-1 tracking-tight font-mono">94.5%</h3>
            </div>
          </div>
          <div className="mt-3 text-[10px] text-cyan-400 font-bold">
            تصنيف جودة مستقر وقوي جداً
          </div>
        </div>

        {/* نسبة إلغاء الإحالة */}
        <div className="bg-[#0A0F1D] border border-red-500/10 hover:border-red-500/20 rounded-2xl p-5 text-right relative overflow-hidden transition-all shadow-md group">
          <div className="absolute top-0 left-0 w-2 h-full bg-red-500/30" />
          <div className="flex justify-between items-start">
            <div className="p-2.5 bg-red-500/10 rounded-xl text-red-400 group-hover:scale-110 transition-transform">
              <AlertCircle className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[10px] text-gray-400 font-bold">نسبة إلغاء الإحالة (الهضم)</p>
              <h3 className="text-2xl font-black text-white mt-1 tracking-tight font-mono">4.2%</h3>
            </div>
          </div>
          <div className="mt-3 text-[10px] text-emerald-400 font-bold">
            أقل من الحد الأقصى المسموح (10%)
          </div>
        </div>

      </div>

      <AnimatePresence>
        {successSettlement && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="p-4 bg-emerald-950/40 border border-emerald-500/30 rounded-2xl flex items-start gap-3"
          >
            <div className="p-1.5 bg-emerald-500/10 rounded-lg text-emerald-400 mt-0.5">
              <FileCheck className="h-5 w-5" />
            </div>
            <div className="text-right space-y-1">
              <p className="text-xs font-black text-emerald-400">تم إرسال وقبول وصرف مستحقاتك بنجاح سيادي مبرهن!</p>
              <p className="text-[11px] text-gray-300">
                لقد تم تصفير الأرباح وتحويلها لملفك المالي فوراً، وتسجيل الحجة والقرائن الجنائية في شبكة سجلات التدقيق (Audit Ledger) إثباتاً للنزاهة المالية.
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 🤝 الرابط الذكي وحاسبة الإحالات */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        
        {/* كود الترويج والبطاقة السيادية */}
        <div className="lg:col-span-2 bg-gradient-to-br from-[#0D1525] to-[#0A0E1A] border border-[#243249] rounded-2xl p-6 relative overflow-hidden flex flex-col justify-between space-y-6">
          <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/5 rounded-full blur-2xl pointer-events-none" />
          
          <div className="space-y-4">
            <h3 className="text-sm font-black text-white flex items-center gap-2">
              <Gift className="h-4.5 w-4.5 text-amber-400" />
              <span>مظلة الإحالة والترويج الفريدة</span>
            </h3>
            
            <p className="text-xs text-gray-400 leading-relaxed">
              شارك هذا الكود أو وجّه الفرسان لكتابته أثناء التسجيل ليتم تقييدهم تحت إشرافك المباشر وحساب العوائد بنسبة الـ 10% السيادية.
            </p>

            {/* صندوق الكود */}
            <div className="bg-[#050A15] border border-amber-500/20 rounded-xl p-4 flex items-center justify-between gap-4">
              <div className="text-right">
                <span className="text-[9px] text-[#94A3B8] font-bold uppercase tracking-wider block">كود الإحالة الذكي</span>
                <span className="text-xl font-black text-amber-400 tracking-widest font-mono mt-1 block">{referralCode}</span>
              </div>
              <button
                onClick={handleCopyCode}
                className="flex items-center gap-1.5 px-3.5 py-2.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 text-xs font-bold rounded-lg transition-all active:scale-95 cursor-pointer border border-amber-500/20"
              >
                {copied ? (
                  <>
                    <Check className="h-4 w-4 text-emerald-400" />
                    <span className="text-emerald-400">تم النسخ</span>
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4" />
                    <span>نسخ الكود</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* الباركود المتخيل */}
          <div className="pt-4 border-t border-[#1E293B] flex items-center justify-between gap-4">
            <div className="text-right space-y-1">
              <p className="text-xs font-bold text-white">بطاقة الهوية السريعة (QR Code)</p>
              <p className="text-[10px] text-gray-400 leading-normal">
                اجعل الكباتن يمسحون هذا الرمز في الميدان لتسجيل الانضمام الفوري مع مرجعيتك الفنية.
              </p>
            </div>
            <div className="bg-white p-2 rounded-xl shrink-0 border border-amber-500/20">
              <QrCode className="h-12 w-12 text-slate-900" />
            </div>
          </div>

        </div>

        {/* 🧮 حاسبة العوائد التفاعلية */}
        <div className="lg:col-span-3 bg-[#0A0F1D] border border-[#1E293B] rounded-2xl p-6 flex flex-col justify-between space-y-6">
          <div className="space-y-4">
            <h3 className="text-sm font-black text-white flex items-center gap-2">
              <Calculator className="h-4.5 w-4.5 text-cyan-400" />
              <span>محاكي العوائد السيادية المبتكر</span>
            </h3>
            
            <p className="text-xs text-gray-400 leading-normal">
              اسحب مؤشرات الأداء الحرة لتوقّع أرباحك وعوائدك الشهرية استناداً إلى نشاط فرسان الميدان المحالين بمعرفتك المباشرة.
            </p>

            <div className="space-y-5 py-2">
              {/* المؤشر الأول: عدد الكباتن */}
              <div className="space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-extrabold text-white font-mono">{projectedDrivers} فارس</span>
                  <span className="text-gray-400 font-bold">عدد الكباتن النشطين المحالين:</span>
                </div>
                <input 
                  type="range" 
                  min="5" 
                  max="100" 
                  value={projectedDrivers}
                  onChange={(e) => setProjectedDrivers(parseInt(e.target.value))}
                  className="w-full h-1.5 bg-[#1E293B] rounded-lg appearance-none cursor-pointer accent-cyan-400"
                />
              </div>

              {/* المؤشر الثاني: متوسط الرحلات */}
              <div className="space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-extrabold text-white font-mono">{avgTripsPerDriver} رحلة</span>
                  <span className="text-gray-400 font-bold">متوسط الرحلات اليومية لكل كابتن:</span>
                </div>
                <input 
                  type="range" 
                  min="5" 
                  max="40" 
                  value={avgTripsPerDriver}
                  onChange={(e) => setAvgTripsPerDriver(parseInt(e.target.value))}
                  className="w-full h-1.5 bg-[#1E293B] rounded-lg appearance-none cursor-pointer accent-cyan-400"
                />
              </div>
            </div>
          </div>

          {/* العائد المتوقع */}
          <div className="p-4 bg-cyan-950/20 border border-cyan-500/10 rounded-xl flex items-center justify-between">
            <div className="text-right">
              <span className="text-[10px] text-cyan-400 font-bold uppercase tracking-wider block">العائد المالي المتوقع شهرياً</span>
              <span className="text-xl font-black text-white font-mono mt-0.5 block">
                {calculateMonthlyProjection()} د.أ
              </span>
            </div>
            <span className="text-[10px] text-gray-400 leading-tight max-w-[130px] text-left block">
              * تم الحساب بموجب حسم 150 fils على كل رحلة منجزة للفارس.
            </span>
          </div>

        </div>

      </div>

      {/* 📋 جدول الإحالات المحالة وجدول سجلات الصرف */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        
        {/* قائمة السجلات */}
        <div className="lg:col-span-3 bg-[#0A0F1D] border border-[#1E293B] rounded-2xl p-6 space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-xs text-gray-400 font-bold font-mono">({referredList.length}) سجلات نشطة</span>
            <h3 className="text-sm font-black text-white flex items-center gap-1.5">
              <Users className="h-4.5 w-4.5 text-emerald-400" />
              <span>فرسان الميدان والمسافرين المعتمدين</span>
            </h3>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-right text-gray-300">
              <thead className="bg-[#111827] text-gray-400 text-[10px] font-bold uppercase">
                <tr>
                  <th className="p-3 rounded-r-lg">الاسم والصفة</th>
                  <th className="p-3">الهاتف</th>
                  <th className="p-3">رحلات هذا الشهر</th>
                  <th className="p-3">العائد المالي</th>
                  <th className="p-3 rounded-l-lg text-center">حالة الحساب</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1E293B]">
                {referredList.map((ref) => (
                  <tr key={ref.id} className="hover:bg-[#111827]/50 transition-colors">
                    <td className="p-3 font-semibold text-white">{ref.name}</td>
                    <td className="p-3 font-mono text-gray-400">{ref.phone}</td>
                    <td className="p-3 font-mono text-white text-center md:text-right">{ref.tripsCount}</td>
                    <td className="p-3 font-mono text-emerald-400 font-bold">{(ref.commissionEarned).toFixed(2)} د.أ</td>
                    <td className="p-3 text-center">
                      <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                        ref.status === 'active' 
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                          : ref.status === 'pending'
                          ? 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20'
                          : 'bg-red-500/10 text-red-500 border border-red-500/20'
                      }`}>
                        {ref.status === 'active' ? 'أتم التسجيل' : ref.status === 'pending' ? 'بانتظار الموافقة' : 'غير نشط'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* سجلات الحوالات والتسويات الصادرة */}
        <div className="lg:col-span-2 bg-[#0A0F1D] border border-[#1E293B] rounded-2xl p-6 space-y-4">
          <h3 className="text-sm font-black text-white flex items-center gap-1.5">
            <ArrowRightLeft className="h-4.5 w-4.5 text-amber-500" />
            <span>سجل الحوالات والوصليات الفنية</span>
          </h3>

          <div className="space-y-3">
            {settlementLogs.map((log) => (
              <div key={log.id} className="p-3 bg-[#111827]/40 border border-[#1E293B] rounded-xl flex justify-between items-center gap-4 hover:bg-[#111827]/80 transition-colors">
                <div className="text-right space-y-1">
                  <span className="text-[10px] font-black text-[#10B981] bg-[#10B981]/10 px-2 py-0.5 rounded-md border border-[#10B981]/20">
                    تم الصرف مبرهناً
                  </span>
                  <div className="text-[10px] text-gray-400 mt-1">تاريخ التحويل: <span className="text-gray-300 font-mono">{log.date}</span></div>
                  <div className="text-[9px] text-gray-500">رقم البصمة: <span className="font-mono">{log.reference}</span></div>
                </div>
                <div className="text-left shrink-0">
                  <span className="text-sm font-black text-white font-mono">{log.amount.toFixed(2)} د.أ</span>
                </div>
              </div>
            ))}
          </div>

          <div className="pt-2 flex items-center justify-center text-[10px] text-gray-400 gap-1 bg-[#111827]/20 p-2.5 rounded-lg border border-[#1E293B]">
            <Clock className="h-3.5 w-3.5 text-amber-400 shrink-0" />
            <span>تتم تسوية الحسابات بصورة سيادية فورية وفقاً لدستور رادار بينكم الدولي.</span>
          </div>
        </div>

      </div>

    </div>
  );
}
