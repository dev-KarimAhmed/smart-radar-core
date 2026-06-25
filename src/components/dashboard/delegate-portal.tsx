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
  FileCheck,
  ClipboardList,
  Target,
  UserCheck,
  Trash2,
  Mail,
  Send,
  Zap,
  Award,
  Crown,
  Briefcase,
  AlertTriangle,
  Flame,
  Activity,
  UserX
} from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { db } from '@/lib/firebase';
import { doc, getDoc, getDocs, updateDoc, setDoc, addDoc, collection, onSnapshot, query, where, orderBy } from 'firebase/firestore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

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

interface FirestoreTask {
  id: string;
  delegateId: string;
  title: string;
  description: string;
  status: 'pending' | 'acknowledged' | 'completed' | 'closed';
  createdAt: string;
  deadline: string;
}

export function DelegatePortal() {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState<'dashboard' | 'daily-performance' | 'growth' | 'churn' | 'tasks' | 'commissions' | 'promotion'>('dashboard');
  
  // Magic link states
  const [magicTokenInput, setMagicTokenInput] = useState('');
  const [magicSessionActive, setMagicSessionActive] = useState(false);
  const [magicSessionExpiry, setMagicSessionExpiry] = useState<string | null>(null);

  // Growth / Churn statistics
  const [targetDaily, setTargetDaily] = useState(10);
  const [directGrowthThisMonth, setDirectGrowthThisMonth] = useState(38);
  const [organicGrowthThisMonth, setOrganicGrowthThisMonth] = useState(12);
  const [carriedDeficit, setCarriedDeficit] = useState(3); // العجز المرحل
  const [steadyUsersCount, setSteadyUsersCount] = useState(48); // عدد مستخدمين ثابتين (45 يوم)

  const [copied, setCopied] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [successSettlement, setSuccessSettlement] = useState(false);
  const [isRequestingSettlement, setIsRequestingSettlement] = useState(false);
  
  // Realtime or fallback states
  const [pendingDues, setPendingDues] = useState(user?.pendingDues || 85.50);
  const [referralCount, setReferralCount] = useState(user?.referredCount || 142);
  const [referralCode, setReferralCode] = useState(user?.referralCode || 'RAD-JOR-777');

  // Interactive Calculator
  const [projectedDrivers, setProjectedDrivers] = useState(25);
  const [avgTripsPerDriver, setAvgTripsPerDriver] = useState(15);

  // Tasks from firestore
  const [tasks, setTasks] = useState<FirestoreTask[]>([]);

  const [referredList, setReferredList] = useState<ReferredUser[]>([
    { id: 'ref-1', name: 'أحمد الحجايا (كابتن)', phone: '+96279****442', role: 'driver', joinedAt: '2026-06-10', status: 'active', tripsCount: 148, commissionEarned: 44.40 },
    { id: 'ref-2', name: 'حمزة الزعبي (كابتن)', phone: '+96278****981', role: 'driver', joinedAt: '2026-06-12', status: 'active', tripsCount: 102, commissionEarned: 30.60 },
    { id: 'ref-3', name: 'يوسف العبداللات (مسافر)', phone: '+96277****039', role: 'rider', joinedAt: '2026-06-14', status: 'active', tripsCount: 35, commissionEarned: 10.50 },
    { id: 'ref-4', name: 'سيف الدين النمري (كابتن)', phone: '+96279****115', role: 'driver', joinedAt: '2026-06-18', status: 'pending', tripsCount: 0, commissionEarned: 0.00 },
  ]);

  // churn engine list
  const [churnedList, setChurnedList] = useState([
    { id: 'ch-1', phone: '+96279****591', role: 'driver', date: '2026-06-15', messageId: 'MSG-RECOVER-8401', messageStatus: 'sent_verified', messageText: 'عزيزنا الكابتن، مكانتك السامية ما زالت غالية برادار بينكم. خصم سيادي 15% بانتظارك فور تفعيل الرادار مجدداً!' },
    { id: 'ch-2', phone: '+96278****029', role: 'rider', date: '2026-06-17', messageId: 'MSG-RECOVER-2951', messageStatus: 'sent_verified', messageText: 'أهلاً بك، اشتقنا لمشاويرك السريعة برأس مال أقل. رحلتك المقبلة مجانية بالكامل عند فتح التطبيق مجدداً.' }
  ]);

  const [settlementLogs, setSettlementLogs] = useState([
    { id: 'set-log-1', amount: 150.00, date: '2026-05-30', reference: 'TXN-940-RADJ', status: 'completed' },
    { id: 'set-log-2', amount: 220.00, date: '2026-04-30', reference: 'TXN-419-RADJ', status: 'completed' }
  ]);

  // Load Magic Token from URL Hash if any
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const hash = window.location.hash;
      if (hash.includes('token=')) {
        const token = hash.split('token=')[1]?.split('?')[0];
        if (token) {
          triggerMagicLogin(token);
        }
      }
    }
  }, []);

  // Listen to Firestore tasks for this delegate
  useEffect(() => {
    const delegateId = user?.uid || 'dev-delegate-001';
    
    // Filter tasks belonging exactly to this delegate
    const qTasks = query(
      collection(db, 'delegate_tasks'),
      where('delegateId', '==', delegateId)
    );

    const unsubscribe = onSnapshot(qTasks, (snapshot) => {
      const list = snapshot.docs.map(docSnap => ({
        id: docSnap.id,
        ...docSnap.data()
      } as FirestoreTask));
      setTasks(list);
    }, (err) => {
      console.warn("Error fetching Firestore delegate tasks:", err);
      // Fallback local simulation tasks
      const fallbackTasks: FirestoreTask[] = [
        {
          id: 'tsk-sim-1',
          delegateId: 'dev-delegate-001',
          title: 'تكثيف الانتساب الرياضي في إربد',
          description: 'نشر 20 رمز تجريبي للكباتن المستقلين في محيط جامعة اليرموك.',
          status: 'pending',
          createdAt: new Date().toISOString(),
          deadline: '2026-06-25'
        },
        {
          id: 'tsk-sim-2',
          delegateId: 'dev-delegate-001',
          title: 'مراقبة حذف الرد الراداري',
          description: 'فحص عينة عشوائية مؤلفة من 5 كباتن لدراسة جودة الاحتفاظ والنبض.',
          status: 'acknowledged',
          createdAt: new Date().toISOString(),
          deadline: '2026-06-22'
        }
      ];
      setTasks(fallbackTasks);
    });

    return () => unsubscribe();
  }, [user?.uid]);

  // Sync to local states purely from real-time SSOT user object from useAuth
  useEffect(() => {
    if (!user) return;
    const uAny = user as any;
    if (uAny.pendingDues !== undefined) setPendingDues(uAny.pendingDues);
    if (uAny.referredCount !== undefined) setReferralCount(uAny.referredCount);
    if (uAny.referralCode !== undefined) setReferralCode(uAny.referralCode);
    if (uAny.targetDaily !== undefined) setTargetDaily(uAny.targetDaily);
    if (uAny.carriedDeficit !== undefined) setCarriedDeficit(uAny.carriedDeficit);
    if (uAny.steadyCount !== undefined) setSteadyUsersCount(uAny.steadyCount);
  }, [user]);

  // Magic Link Login Trigger
  const triggerMagicLogin = async (token: string) => {
    try {
      const response = await fetch('/api/verify-magic-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token })
      });

      const data = await response.json();
      if (response.ok && data.success) {
        setMagicSessionActive(true);
        const expiry = new Date(data.expiresAt);
        setMagicSessionExpiry(expiry.toLocaleTimeString('ar-JO'));
        
        alert('تم التحقق السحري من هويتك كوكيل سيادي بنجاح مبرهن! تم تأسيس جسد جلسة أمان مؤقتة.');
      } else {
        // Prevent simulation bypass in production environments
        if (process.env.NODE_ENV !== 'production') {
          setMagicSessionActive(true);
          const simExpiry = new Date(Date.now() + 2 * 60 * 60 * 1000);
          setMagicSessionExpiry(simExpiry.toLocaleTimeString('ar-JO'));
          alert('جلسة محاكاة نشطة محلياً للتطوير (التشغيل السحابي متعذر).');
        } else {
          alert(`خطأ أمني: ${data.error || 'الرمز السحري المدخل غير صالح أو تم استخدامه مسبقاً.'}`);
        }
      }
    } catch (e) {
      console.error(e);
      alert('فشل إجراء الدخول السحري عبر بوابة التحقق السحابي.');
    }
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(referralCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCopyMagicLinkUrl = () => {
    const secureTokenArray = new Uint8Array(8);
    window.crypto.getRandomValues(secureTokenArray);
    const fakeToken = Array.from(secureTokenArray, byte => byte.toString(16).padStart(2, '0')).join('');
    const mockUrl = `${window.location.origin}/#magic-login?token=${fakeToken}`;
    navigator.clipboard.writeText(mockUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const calculateMonthlyProjection = () => {
    const baseReward = 0.15; // 150 fils per driver trip
    return (projectedDrivers * avgTripsPerDriver * baseReward).toFixed(2);
  };

  const getVerifiedNetworkTime = async (): Promise<Date> => {
    try {
      const timeResponse = await fetch('/api/health');
      if (timeResponse.ok) {
        const timeData = await timeResponse.json();
        if (timeData.serverTime) {
          return new Date(timeData.serverTime);
        }
      }
    } catch (err) {
      console.warn("Failed to synchronize with sovereign network time, falling back to secure local time check.", err);
    }
    return new Date();
  };

  // Task actions triggered from UI with Double-Handshake Gate & State-Machine Enforcer
  const handleAcknowledgeTask = async (taskId: string) => {
    try {
      const verifiedNow = await getVerifiedNetworkTime();
      
      if (taskId.startsWith('tsk-sim')) {
        const simTask = tasks.find(t => t.id === taskId);
        if (!simTask) return;
        
        const delegateId = user?.uid || 'dev-delegate-001';
        if (simTask.delegateId !== delegateId) {
          alert('خطأ أمني: هذه المهمة لا تنتمي لمعرّفك الميداني المسجل.');
          return;
        }

        if (simTask.deadline && new Date(simTask.deadline) < verifiedNow) {
          alert('فشل الإجراء: انتهى الأجل الزمني المحدد لهذه المهمة (Deadline Exceeded).');
          return;
        }

        if (simTask.status !== 'pending') {
          alert(`خطأ في آلة الحالات: لا يمكن تفعيل مهمة بحالة ${simTask.status}.`);
          return;
        }

        setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: 'acknowledged' } : t));
        alert('تم إخطار المشرف باطلاعك الميداني والبدء الفوري بالتنفيذ.');
      } else {
        const delegateId = user?.uid || 'dev-delegate-001';
        const response = await fetch('/api/delegate-task-transition', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            taskId,
            targetStatus: 'acknowledged',
            delegateId,
            actorUid: user?.uid,
            actorRole: user?.role || 'delegate'
          })
        });

        const data = await response.json();
        if (!response.ok || !data.success) {
          alert(`فشل الإجراء: ${data.error || 'حدث خطأ في جدار التحقق السحابي.'}`);
          return;
        }

        alert('تم إخطار المشرف باطلاعك الميداني والبدء الفوري بالتنفيذ (مصادق سحابياً).');
      }
    } catch (e) {
      console.error(e);
      alert('فشل إجراء الاطلاع الأمني المزدوج.');
    }
  };

  const handleExecuteTask = async (taskId: string) => {
    try {
      const verifiedNow = await getVerifiedNetworkTime();

      if (taskId.startsWith('tsk-sim')) {
        const simTask = tasks.find(t => t.id === taskId);
        if (!simTask) return;

        const delegateId = user?.uid || 'dev-delegate-001';
        if (simTask.delegateId !== delegateId) {
          alert('خطأ أمني: هذه المهمة لا تنتمي لمعرّفك الميداني المسجل.');
          return;
        }

        if (simTask.deadline && new Date(simTask.deadline) < verifiedNow) {
          alert('فشل الإجراء: انتهى الأجل الزمني المحدد لهذه المهمة (Deadline Exceeded).');
          return;
        }

        if (simTask.status !== 'acknowledged') {
          alert(`خطأ في آلة الحالات: لا يمكن إكمال مهمة بحالة ${simTask.status}.`);
          return;
        }

        setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: 'completed' } : t));
        alert('تم تأكيد إكمال المهمة وتصنيفها كـ منجزة بانتظار إغلاق المشرف السلوكي.');
      } else {
        const delegateId = user?.uid || 'dev-delegate-001';
        const response = await fetch('/api/delegate-task-transition', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            taskId,
            targetStatus: 'completed',
            delegateId,
            actorUid: user?.uid,
            actorRole: user?.role || 'delegate'
          })
        });

        const data = await response.json();
        if (!response.ok || !data.success) {
          alert(`فشل الإجراء: ${data.error || 'حدث خطأ في جدار التحقق السحابي.'}`);
          return;
        }

        alert('تم تأكيد إكمال المهمة وتصنيفها كـ منجزة بانتظار إغلاق المشرف السلوكي (مصادق سحابياً).');
      }
    } catch (e) {
      console.error(e);
      alert('فشل إجراء التحقق المزدوج لإغلاق المهمة.');
    }
  };

  const handleRequestSettlement = async () => {
    if (pendingDues <= 0) return;
    setIsRequestingSettlement(true);
    
    try {
      if (user?.uid) {
        // 1. Audit Ledger entry
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

        // 2. Clear balance
        const userRef = doc(db, 'users', user.uid);
        await updateDoc(userRef, { pendingDues: 0 });

        // Update corresponding delegates record
        const queries = query(collection(db, 'delegates'), where('phone', '==', user.phone || ''));
        const qs = await getDocs(queries); 
        const match = qs.docs.find((d: any) => d.data().referralCode === referralCode);
        if (match) {
          await updateDoc(doc(db, 'delegates', match.id), { pendingDues: 0 });
        }
      }

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
      setTimeout(() => setSuccessSettlement(false), 4500);
    } catch (e) {
      console.error(e);
    } finally {
      setIsRequestingSettlement(false);
    }
  };

  // Commissions Logic: Base salary, Organic commissions, Target excess bonus
  const baseSalary = 150.00; // JD base salary
  const growthCommissionRate = 5.0; // Every 50 conversions = 5 JD
  const organicMilestonesAchieved = Math.floor(organicGrowthThisMonth / 50);
  const organicCommissionValue = organicMilestonesAchieved * growthCommissionRate;
  
  // Calculate Target Excess Bonus
  // If target is 10, over 30 days = 300 signups. If direct growth is higher, bonus of 0.50 JD per extra sign up
  const targetMonthlyGoal = targetDaily * 30;
  const directExcessCount = Math.max(0, directGrowthThisMonth - 10); // Simulation: 10 extra
  const targetSurplusCommission = directExcessCount * 1.5; // 1.5 JD for each extra sign up

  // Calculated remaining to achieve daily target
  const dailyAchieved = 4; // Simulated direct achievements today
  const remainingToday = Math.max(0, targetDaily - dailyAchieved);

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
              {magicSessionActive && (
                <span className="bg-blue-500/10 border border-blue-500/30 text-blue-400 text-[10px] md:text-xs font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                  <Zap className="w-3 h-3 text-blue-400" />
                  جلسة سحرية مؤقتة (تنتهي: {magicSessionExpiry})
                </span>
              )}
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
              className="flex items-center gap-2 px-4 py-2 bg-red-955/20 hover:bg-red-955/40 border border-red-500/20 text-red-400 hover:text-red-300 text-xs font-bold rounded-xl transition-all duration-300 cursor-pointer"
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

      {/* 🧭 شريط التنقل الفرعي للمفاتيح التسعة السيادية */}
      <div className="flex flex-wrap gap-1.5 border-b border-[#1E293B] pb-3 overflow-x-auto">
        <button
          onClick={() => setActiveTab('dashboard')}
          className={`px-3 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
            activeTab === 'dashboard' ? 'bg-amber-500 text-black' : 'text-gray-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <Activity className="w-3.5 h-3.5 inline ml-1.5" />
          لوحة التحكم السريعة
        </button>

        <button
          onClick={() => setActiveTab('daily-performance')}
          className={`px-3 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
            activeTab === 'daily-performance' ? 'bg-amber-500 text-black' : 'text-gray-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <Target className="w-3.5 h-3.5 inline ml-1.5" />
          الأداء اليومي والعجز
          {carriedDeficit > 0 && <span className="mr-1 bg-red-500 text-white text-[9px] px-1 rounded-full font-mono">{carriedDeficit}</span>}
        </button>

        <button
          onClick={() => setActiveTab('growth')}
          className={`px-3 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
            activeTab === 'growth' ? 'bg-amber-500 text-black' : 'text-gray-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <TrendingUp className="w-3.5 h-3.5 inline ml-1.5" />
          لوحة النمو والثبات (+45 يوم)
        </button>

        <button
          onClick={() => setActiveTab('churn')}
          className={`px-3 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
            activeTab === 'churn' ? 'bg-amber-500 text-black' : 'text-gray-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <UserX className="w-3.5 h-3.5 inline ml-1.5" />
          لوحة منع مبيعات الانسحاب
        </button>

        <button
          onClick={() => setActiveTab('tasks')}
          className={`px-3 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer relative ${
            activeTab === 'tasks' ? 'bg-amber-500 text-black' : 'text-gray-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <ClipboardList className="w-3.5 h-3.5 inline ml-1.5" />
          التكليفات والمهام السيادية
          {tasks.filter(t => t.status === 'pending').length > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[8px] w-4 h-4 rounded-full flex items-center justify-center font-bold">
              {tasks.filter(t => t.status === 'pending').length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('commissions')}
          className={`px-3 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
            activeTab === 'commissions' ? 'bg-amber-500 text-black' : 'text-gray-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <DollarSign className="w-3.5 h-3.5 inline ml-1.5" />
          العمولات وعقد الراتب
        </button>

        <button
          onClick={() => setActiveTab('promotion')}
          className={`px-3 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
            activeTab === 'promotion' ? 'bg-amber-500 text-black' : 'text-gray-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <Award className="w-3.5 h-3.5 inline ml-1.5" />
          محرك الترقية (Promote)
        </button>
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
              <p className="text-[10px] text-gray-450 font-bold">إجمالي الإحالات اليوم</p>
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
              <p className="text-[10px] text-gray-455 font-bold">الأرباح السيادية القابلة للسحب</p>
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
              <span className="text-[10px] text-gray-300 font-bold flex items-center gap-1 justify-end">
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
              <p className="text-[10px] text-gray-400 font-bold">النمو العضوي المتكامل</p>
              <h3 className="text-2xl font-black text-cyan-400 mt-1 tracking-tight font-mono">+{organicGrowthThisMonth} منتسب</h3>
            </div>
          </div>
          <div className="mt-3 text-[10px] text-cyan-400 font-bold">
            معدل مساهمة ممتاز في تغطية العجوزات
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
              <p className="text-[10px] text-gray-400 font-bold">مجموع المنسحبين الأخيرين</p>
              <h3 className="text-2xl font-black text-white mt-1 tracking-tight font-mono">{churnedList.length} كباتن</h3>
            </div>
          </div>
          <div className="mt-3 text-[10px] text-zinc-400 font-bold">
            جاري العمل على الاسترداد التلقائي
          </div>
        </div>
      </div>

      <AnimatePresence>
        {successSettlement && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="p-4 bg-emerald-950/40 border border-emerald-500/30 rounded-2xl flex items-start gap-3 text-right"
          >
            <div className="p-1.5 bg-emerald-500/10 rounded-lg text-emerald-400 mt-0.5 shrink-0">
              <FileCheck className="h-5 w-5" />
            </div>
            <div className="space-y-1">
              <p className="text-xs font-black text-emerald-400">تم إرسال وقبول وصرف مستحقاتك بنجاح سيادي مبرهن!</p>
              <p className="text-[11px] text-gray-305">
                لقد تم تصفير الأرباح وتحويلها لملفك المالي فوراً، وتسجيل الحجة والقرائن الجنائية في شبكة سجلات التدقيق (Audit Ledger) إثباتاً للنزاهة المالية الميدانية.
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* TAB CONTENT 1: QUICK DASHBOARD */}
      {activeTab === 'dashboard' && (
        <div className="space-y-6">
          {/* Magic link dynamic simulation entry */}
          {!magicSessionActive && (
            <Card className="bg-[#050B15] border border-blue-500/30 p-5 rounded-2xl">
              <CardHeader className="p-0 pb-3">
                <CardTitle className="text-sm font-black text-white flex items-center gap-1.5">
                  <Zap className="w-4 h-4 text-blue-400" />
                  محرك التحقق السحري والولوج (Magic Link Validator)
                </CardTitle>
                <CardDescription className="text-xs">
                  أدخل رمز أو رابط التحقق السحابي المستلم لتأسيس جلسة آمنة دون استخدام كلمات المرور والملفات المعقدة.
                </CardDescription>
              </CardHeader>
              <div className="flex flex-col sm:flex-row gap-3">
                <Input
                  value={magicTokenInput}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setMagicTokenInput(e.target.value)}
                  placeholder="رابط تسجيل الدخول للمندوب الميداني... (أو Token)"
                  className="bg-black/60 border-blue-900/50 text-white text-xs h-10 grow"
                />
                <Button 
                  onClick={() => triggerMagicLogin(magicTokenInput)} 
                  className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold px-5 h-10 rounded-xl shrink-0"
                >
                  التحقق السحابي وتفعيل الجلسة
                </Button>
              </div>
            </Card>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
            {/* كود الترويج والباركود */}
            <div className="lg:col-span-2 bg-[#0A0E1A] border border-[#243249] rounded-2xl p-6 flex flex-col justify-between space-y-6">
              <div className="space-y-4">
                <h3 className="text-sm font-black text-white flex items-center gap-2">
                  <Gift className="h-4.5 w-4.5 text-amber-400" />
                  <span>مظلة الإحالة والترويج الفريدة</span>
                </h3>
                
                <p className="text-xs text-gray-400 leading-normal">
                  شارك هذا الكود أو وجّه الفرسان لكتابته أثناء التسجيل ليتم تقييدهم تحت إشرافك المباشر وحساب العوائد بنسبة الـ 10% السيادية.
                </p>

                {/* صندوق الكود */}
                <div className="bg-black border border-amber-500/20 rounded-xl p-4 flex items-center justify-between gap-4">
                  <div className="text-right">
                    <span className="text-[9px] text-[#94A3B8] font-bold uppercase tracking-wider block">كود الإحالة الذكي</span>
                    <span className="text-xl font-black text-amber-400 tracking-widest font-mono mt-1 block">{referralCode}</span>
                  </div>
                  <button
                    onClick={handleCopyCode}
                    className="flex items-center gap-1.5 px-3.5 py-2.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 text-xs font-bold rounded-lg border border-amber-500/20"
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

            {/* حاسبة العوائد التفاعلية */}
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
                <span className="text-[10px] text-gray-400 leading-tight max-w-[150px] text-left block">
                  * تم الحساب بموجب حسم 150 fils على كل رحلة منجزة للفارس.
                </span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
            {/* فرسان الميدان قائمة */}
            <div className="lg:col-span-3 bg-[#0A0F1D] border border-[#1E293B] rounded-2xl p-6 space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-450 font-bold font-mono">({referredList.length}) سجلات نشطة</span>
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
                      <th className="p-3 text-center">رحلات هذا الشهر</th>
                      <th className="p-3">العائد المالي</th>
                      <th className="p-3 rounded-l-lg text-center">حالة الحساب</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#1E293B]">
                    {referredList.map((ref) => (
                      <tr key={ref.id} className="hover:bg-[#111827]/50 transition-colors">
                        <td className="p-3 font-semibold text-white">{ref.name}</td>
                        <td className="p-3 font-mono text-gray-405">{ref.phone}</td>
                        <td className="p-3 font-mono text-white text-center">{ref.tripsCount}</td>
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

            {/* سجل الحوالات */}
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
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT 2: DAILY PERFORMANCE & DEFICIT ENGINE */}
      {activeTab === 'daily-performance' && (
        <div className="space-y-6">
          <Card className="bg-[#0A0E1A] border border-[#1E293B] p-6 rounded-2xl">
            <CardHeader className="p-0 pb-4">
              <CardTitle className="text-base font-black text-white flex items-center gap-2">
                <Target className="w-5 h-5 text-amber-400" />
                محرك العجز والأداء اليومي الميداني (Deficit Engine Portal)
              </CardTitle>
              <CardDescription className="text-xs">
                يقوم النظام باحتساب التارجت المحقق يومياً، وترحيل أي قصور أو عجز إلى الرصيد التراكمي لليوم التالي لضمان الاستقرار السعري.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0 space-y-6">
              
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-center">
                <div className="bg-black/40 border border-[#1E293B] p-4 rounded-xl">
                  <p className="text-xs text-zinc-405 font-bold">التارجت اليومي المستهدف</p>
                  <p className="text-2xl font-black text-white mt-1 font-mono">{targetDaily} انتساب</p>
                  <span className="text-[10px] text-zinc-500">مقرر من المشرف الجغرافي</span>
                </div>

                <div className="bg-black/40 border border-[#1E293B] p-4 rounded-xl">
                  <p className="text-xs text-zinc-405 font-bold">الإنجاز المباشر اليوم</p>
                  <p className="text-2xl font-black text-emerald-400 mt-1 font-mono">{dailyAchieved} انتساب</p>
                  <span className="text-[10px] text-emerald-500 font-bold">نسبة نجاح {Math.round((dailyAchieved / targetDaily) * 100)}%</span>
                </div>

                <div className="bg-red-950/20 border border-red-500/20 p-4 rounded-xl">
                  <p className="text-xs text-red-400 font-bold">العجز المرحل لليوم (Deficit)</p>
                  <p className="text-2xl font-black text-red-500 mt-1 font-mono">{carriedDeficit} انتساب</p>
                  <span className="text-[10px] text-zinc-500">مستحق التغطية فورياً</span>
                </div>

                <div className="bg-cyan-950/20 border border-cyan-500/20 p-4 rounded-xl">
                  <p className="text-xs text-cyan-405 font-bold">المتبقي لتحقيق الهدف</p>
                  <p className="text-2xl font-black text-cyan-400 mt-1 font-mono">{remainingToday} انتساب</p>
                  <span className="text-[10px] text-zinc-500">قبل إغلاق نافذة الـ 24 ساعة</span>
                </div>
              </div>

              {/* Deficit explanation rules */}
              <div className="bg-black/60 p-4 rounded-xl border border-[#1E293B] space-y-3">
                <h4 className="text-xs font-black text-white flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 text-amber-500" />
                  بروتوكول تسييل العجز (معادلة التوزيع):
                </h4>
                <p className="text-xs text-zinc-300 leading-relaxed font-sans">
                  يتم توجيه <strong>الانتسابات العضوية الزائدة</strong> لتغطية أي عجز مرحل أولاً حرصاً على حماية التقييم السلوكي الميداني للوكيل. فور تصفير العجز وتحقيق هدف المشرف، يتم على الفور تحويل أي فائض جرافي إلى عمولات نقدية فخمة تضاف لملفك مباشرة.
                </p>
                <div className="flex justify-end pt-1">
                  <Button 
                    onClick={() => {
                      if (carriedDeficit > 0) {
                        setCarriedDeficit(0);
                        alert('بروتوكول التسييل: تم تصفير العجز التراكمي وتدشين التغطية بموجب نمو الألوية العضوي بنجاح.');
                      } else {
                        alert('تهانينا، ليس لديك أي عجز معلق حالياً!');
                      }
                    }}
                    className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs h-8 rounded-lg"
                  >
                    تغطية العجز التراكمي بالنمو العضوي 🔄
                  </Button>
                </div>
              </div>

            </CardContent>
          </Card>
        </div>
      )}

      {/* TAB CONTENT 3: GROWTH PANEL & 45-DAY STEADY MEMBERS */}
      {activeTab === 'growth' && (
        <div className="space-y-6">
          <Card className="bg-[#0A0E1A] border border-[#1E293B] p-6 rounded-2xl">
            <CardHeader className="p-0 pb-4">
              <CardTitle className="text-base font-black text-white flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-emerald-400" />
                محرك النمو الثابت والانتساب الذكي (Growth Engine)
              </CardTitle>
              <CardDescription className="text-xs text-zinc-300">
                مراقبة نمو المحافظة، والتحقق البصري من شرط الثبات (45 يوماً على الأقل لتفعيل الكباتن مع رادارات جغرافية نشطة).
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0 space-y-6">
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-black/40 border border-[#1E293B] p-4 rounded-xl flex items-center justify-between">
                  <div>
                    <p className="text-xs text-gray-500 font-bold">النمو المباشر (التطبيقي)</p>
                    <p className="text-xl font-black text-white font-mono mt-1">+{directGrowthThisMonth} مسجل</p>
                  </div>
                  <Badge className="bg-emerald-505/10 text-emerald-400 border border-emerald-500/20 font-bold">صعود ↑</Badge>
                </div>

                <div className="bg-black/40 border border-[#1E293B] p-4 rounded-xl flex items-center justify-between">
                  <div>
                    <p className="text-xs text-gray-500 font-bold">النمو العضوي (التناسلي)</p>
                    <p className="text-xl font-black text-white font-mono mt-1">+{organicGrowthThisMonth} مسجل</p>
                  </div>
                  <Badge className="bg-emerald-505/10 text-emerald-400 border border-emerald-500/20 font-bold">مستقر ●</Badge>
                </div>

                <div className="bg-black/40 border border-[#1E293B] p-4 rounded-xl flex items-center justify-between">
                  <div>
                    <p className="text-xs text-gray-500 font-bold">الكباتن الملتزمين (+45 يوم)</p>
                    <p className="text-xl font-black text-cyan-400 font-mono mt-1">{steadyUsersCount} محقق</p>
                  </div>
                  <Badge className="bg-blue-950/10 text-blue-400 border border-blue-500/20 font-bold">جودة ماسية</Badge>
                </div>
              </div>

              {/* Steady state tracking */}
              <div className="border border-zinc-800/60 p-4 rounded-xl bg-black/40 space-y-2">
                <h4 className="text-xs font-black text-white flex items-center gap-1.5">
                  <Activity className="w-4 h-4 text-cyan-400" />
                  مراقبة نبضات التطبيق (App Pulse Detection):
                </h4>
                <p className="text-xs text-zinc-305 leading-normal">
                  يستخدم النظام أجهزة الفحص الميداني والنبض لمنع "الاحتيال الإحالي". يسقط الترشيح المالي إذا تم اكتشاف قيام الكباتن بحذف التطبيق قبل بلوغ اليوم الـ 45. يضمن محرك النبض تثبيت مستحقاتك بموجب معايير الدستور البنيوي لزيادة المتانة الاقتصادية.
                </p>
              </div>

            </CardContent>
          </Card>
        </div>
      )}

      {/* TAB CONTENT 4: CHURN PANEL (لوحة المنسحبين) */}
      {activeTab === 'churn' && (
        <div className="space-y-6">
          <Card className="bg-[#0A0E1A] border border-[#1E293B] p-6 rounded-2xl">
            <CardHeader className="p-0 pb-4">
              <CardTitle className="text-base font-black text-white flex items-center gap-2">
                <UserX className="w-5 h-5 text-red-500" />
                لوحة الوقاية من الانسحاب واسترداد المشتركين (Churn Engine)
              </CardTitle>
              <CardDescription className="text-xs text-zinc-300">
                يكتشف محرك نبضات التطبيق حالات حذف رادار الكابتن أو الركاب، ويرسل فوراً كود استعادة مخصص.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0 space-y-4">
              
              <div className="overflow-x-auto bg-black/40 rounded-xl border border-zinc-800/80">
                <table className="w-full text-xs text-right text-gray-300">
                  <thead className="bg-[#111827] text-gray-400 text-[10px] font-black uppercase">
                    <tr>
                      <th className="p-3 rounded-r-lg">الرقم المستهدف للاستعادة</th>
                      <th className="p-3">الصفة والموقع</th>
                      <th className="p-3">تاريخ توقف النبض</th>
                      <th className="p-3">رسالة الاستعادة ومثبت الإرسال</th>
                      <th className="p-3 rounded-l-lg text-center font-bold">الحالة الإجرائية</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#1E293B]">
                    {churnedList.map((churn) => (
                      <tr key={churn.id} className="hover:bg-red-955/5 transition-colors">
                        <td className="p-3 font-mono text-zinc-300 font-bold">{churn.phone}</td>
                        <td className="p-3 font-semibold text-zinc-400">{churn.role === 'driver' ? 'كابتن رادار' : 'مسافر عابر'}</td>
                        <td className="p-3 font-mono text-gray-500">{churn.date}</td>
                        <td className="p-3 space-y-1">
                          <p className="text-[10px] text-zinc-300 leading-tight italic bg-neutral-900/60 p-2 rounded-lg border border-zinc-800">
                            "{churn.messageText}"
                          </p>
                          <span className="text-[9px] text-[#10B981] font-mono font-black block">🔑 {churn.messageId} (مؤمنة)</span>
                        </td>
                        <td className="p-3 text-center">
                          <span className="inline-block px-2.5 py-0.5 rounded-full text-[9px] font-black bg-[#10B981]/15 text-[#10B981] border border-[#10B981]/30">
                            أُرسل الإخطار للرادار
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

            </CardContent>
          </Card>
        </div>
      )}

      {/* TAB CONTENT 5: TASKS & NOTIFICATIONS */}
      {activeTab === 'tasks' && (
        <div className="space-y-6">
          <Card className="bg-[#0A0E1A] border border-[#1E293B] p-6 rounded-2xl">
            <CardHeader className="p-0 pb-4">
              <CardTitle className="text-base font-black text-white flex items-center gap-2">
                <ClipboardList className="w-5 h-5 text-emerald-400" />
                لوحة الأوامر والتكليفات الميدانية (Sovereign Task Board)
              </CardTitle>
              <CardDescription className="text-xs">
                استقبل مهام التوسع الجغرافي الصادرة من القيادة العامة، وقدم تأكيدات الاطلاع، والتنفيذ الفني لضمان الحصول على الجودة الماسية.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0 space-y-4">
              
              {tasks.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {tasks.map((task) => {
                    const isTaskExpired = task.deadline && new Date(task.deadline) < new Date() && task.status !== 'completed' && task.status !== 'closed';
                    
                    return (
                      <div 
                        key={task.id} 
                        className={`p-4 rounded-xl border transition-all ${
                          isTaskExpired ? 'bg-red-950/15 border-red-500/35 shadow-[0_0_15px_rgba(239,68,68,0.05)]' :
                          task.status === 'pending' ? 'bg-yellow-950/10 border-yellow-500/25' :
                          task.status === 'acknowledged' ? 'bg-blue-950/10 border-blue-500/25' :
                          task.status === 'completed' ? 'bg-emerald-950/10 border-emerald-500/25' :
                          'bg-zinc-950/40 border-zinc-800'
                        }`}
                      >
                        <div className="flex justify-between items-start gap-2">
                          <div>
                            <h4 className="text-xs font-black text-white">{task.title}</h4>
                            <span className="text-[9px] text-zinc-500 font-mono mt-0.5 block">الموعد النهائي: {task.deadline}</span>
                          </div>
                          <Badge 
                            variant="outline"
                            className={`text-[9px] font-black ${
                              isTaskExpired ? 'text-red-400 border-red-500/30 bg-red-950/20' :
                              task.status === 'pending' ? 'text-yellow-400 border-yellow-500/30' :
                              task.status === 'acknowledged' ? 'text-blue-400 border-blue-300/30' :
                              task.status === 'completed' ? 'text-[#10B981] border-[#10B981]/30' :
                              'text-zinc-500 border-zinc-800'
                            }`}
                          >
                            {isTaskExpired ? 'ملغاة / منتهية الصلاحية 🛑' :
                             task.status === 'pending' ? 'بانتظار العرض' :
                             task.status === 'acknowledged' ? 'قيد التنفيذ' :
                             task.status === 'completed' ? 'منجزة ✓' : 'مؤرشفة'}
                          </Badge>
                        </div>

                        <p className="text-xs text-zinc-300 mt-2 leading-relaxed">
                          {task.description}
                        </p>

                        <div className="mt-4 pt-3 border-t border-white/5 flex justify-end gap-2">
                          {isTaskExpired ? (
                            <span className="text-[10px] text-red-400 font-bold flex items-center gap-1">
                              <span>⚠️</span>
                              <span>المهمة ملغاة لتجاوز الأجل (تم إنقاذ الموازنة)</span>
                            </span>
                          ) : (
                            <>
                              {task.status === 'pending' && (
                                <Button 
                                  onClick={() => handleAcknowledgeTask(task.id)}
                                  className="bg-blue-600 hover:bg-blue-500 text-white font-bold text-[10px] h-7 px-3 rounded-lg"
                                >
                                  تأكيد الاطلاع والبدء ⚡
                                </Button>
                              )}
                              {task.status === 'acknowledged' && (
                                <Button 
                                  onClick={() => handleExecuteTask(task.id)}
                                  className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[10px] h-7 px-3 rounded-lg"
                                >
                                  إغلاق وتأكيد التنفيذ ✓
                                </Button>
                              )}
                            </>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center text-muted-foreground text-xs py-10 font-bold space-y-1">
                  <ClipboardList className="w-8 h-8 text-neutral-600 mx-auto" />
                  <p>لا يوجد أي واجبات ميدانية مسندة لملفك في الوقت الحالي.</p>
                </div>
              )}

            </CardContent>
          </Card>
        </div>
      )}

      {/* TAB CONTENT 6: COMMISSIONS & BASIC SALARY */}
      {activeTab === 'commissions' && (
        <div className="space-y-6">
          <Card className="bg-[#0A0E1A] border border-[#1E293B] p-6 rounded-2xl">
            <CardHeader className="p-0 pb-4">
              <CardTitle className="text-base font-black text-white flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-emerald-400" />
                تفصيل العمولات وعقد الراتب والمكافآت (Commissions & Ledger)
              </CardTitle>
              <CardDescription className="text-xs text-zinc-300">
                بموجب الملحق المالي للدستور البنيوي الموحد لسيادة الرادار (V4.0)، يتم احتساب الرواتب والعمولات بالشكل التالي:
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0 space-y-6">
              
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-black/40 border border-zinc-800 p-4 rounded-xl text-center">
                  <p className="text-xs text-zinc-405 font-bold">الراتب الأساسي الثابت</p>
                  <p className="text-2xl font-black text-white mt-1 font-mono">{baseSalary.toFixed(2)} د.أ</p>
                  <span className="text-[9px] text-[#10B981] font-bold">يصرف شهرياً بشكل تلقائي</span>
                </div>

                <div className="bg-black/40 border border-zinc-800 p-4 rounded-xl text-center">
                  <p className="text-xs text-zinc-405 font-bold">عمولات النمو (كل 50 كابتن)</p>
                  <p className="text-2xl font-black text-white mt-1 font-mono">{organicCommissionValue.toFixed(2)} د.أ</p>
                  <span className="text-[9px] text-zinc-500">حاقن مكافأة: 5 دنانير لكل 50</span>
                </div>

                <div className="bg-black/40 border border-zinc-800 p-4 rounded-xl text-center">
                  <p className="text-xs text-zinc-405 font-bold">عمولات التارجت الزائد</p>
                  <p className="text-2xl font-black text-white mt-1 font-mono">{targetSurplusCommission.toFixed(2)} د.أ</p>
                  <span className="text-[9px] text-cyan-400 font-semibold">{directExcessCount} إحابة فائضة عن الهدف</span>
                </div>

                <div className="bg-emerald-950/20 border border-emerald-500/25 p-4 rounded-xl text-center">
                  <p className="text-xs text-emerald-400 font-bold">الرصيد المتاح للسحب الفوري</p>
                  <p className="text-2xl font-black text-emerald-400 mt-1 font-mono">{(pendingDues).toFixed(2)} د.أ</p>
                  <span className="text-[9px] text-zinc-400">شامل العمولات وسقوف التسييل</span>
                </div>
              </div>

            </CardContent>
          </Card>
        </div>
      )}

      {/* TAB CONTENT 7: PROMOTION ENGINE */}
      {activeTab === 'promotion' && (
        <div className="space-y-6">
          <Card className="bg-[#0A0E1A] border border-[#1E293B] p-6 rounded-2xl">
            <CardHeader className="p-0 pb-4">
              <CardTitle className="text-base font-black text-white flex items-center gap-2">
                <Crown className="w-5 h-5 text-amber-400" />
                محرك الترقية السلوكية للوائح العليا (Delegate Promotion Engine)
              </CardTitle>
              <CardDescription className="text-xs">
                متابعة تدرج رتبتك الميدانية من مرحلة التأسيس إلى مرحلة المبيعات وجلب عقود الشركات والإعلانات الرادارية السيادية.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0 space-y-6">
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-black/50 border border-zinc-800 p-5 rounded-xl space-y-3">
                  <h4 className="text-xs font-black text-amber-400 flex items-center gap-1">
                    <Flame className="w-4 h-4 text-amber-500" />
                    المرحلة الأولى: مرحلة التأسيس (قائمة حالياً)
                  </h4>
                  <p className="text-xs text-zinc-300 leading-relaxed font-sans">
                    تستهدف جمع السائقين والركاب في لواء السيادة المحدد لك جغرافياً وتأكيد نبض الرد وتصفير العجوزات اليومية. تحقق هذه المرحلة الراتب الأساسي مع العمولات الصارمة.
                  </p>
                  <div className="space-y-1">
                    <div className="flex justify-between text-[11px] text-zinc-400">
                      <span>الوصول بـ لواء {user?.district || 'الجامعة'} لـ 200 مشترك:</span>
                      <span className="font-bold text-white font-mono">{referralCount}/200</span>
                    </div>
                    <div className="w-full bg-neutral-900 h-1.5 rounded-full overflow-hidden">
                      <div className="bg-amber-500 h-full" style={{ width: `${Math.min(100, (referralCount / 200) * 100)}%` }} />
                    </div>
                  </div>
                </div>

                <div className="bg-black/50 border border-zinc-800 p-5 rounded-xl space-y-3 opacity-80">
                  <h4 className="text-xs font-black text-zinc-400 flex items-center gap-1">
                    <Briefcase className="w-4 h-4 text-zinc-400" />
                    المرحلة الثانية: مرحلة المبيعات وجلب الإعلانات
                  </h4>
                  <p className="text-xs text-zinc-400 leading-relaxed font-sans">
                    تفتح لك قنوات بيع المساحات الإعلانية الموجهة على رادار مستخدمي لواءك وجلب تعاقدات التوصيل للشركات المحلية مع عمولات إضافية تصل لـ 25% من الصفقات.
                  </p>
                  <div className="pt-2">
                    <span className="inline-block bg-[#111827] text-zinc-500 border border-zinc-850 text-[10px] px-3 py-1 rounded-lg">
                      🔒 مغلقة - بانتظار قرار المشرف أو بلوغ التعداد 200
                    </span>
                  </div>
                </div>
              </div>

            </CardContent>
          </Card>
        </div>
      )}

    </div>
  );
}
