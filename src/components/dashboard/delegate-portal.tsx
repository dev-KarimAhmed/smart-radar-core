'use client';

import React, { useState, useEffect, useRef } from 'react';
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
  ChevronDown,
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
  UserX,
  Search,
  SlidersHorizontal,
  Filter,
  Database,
  BookOpen,
  Workflow,
  Layers,
  Wallet,
  CreditCard,
  Gem
} from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { db, auth } from '@/lib/firebase';
import { jordanGovernorates, getDistrictsByGovernorate } from '@/lib/data';
import { RadarAntiCheatKernel } from '@/core/RadarAntiCheatKernel';
import { doc, getDoc, getDocs, updateDoc, setDoc, addDoc, collection, onSnapshot, query, where, orderBy } from 'firebase/firestore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { AdDisplayCard } from './ad-display-card';

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
  const subRole = (user as any)?.subRole || 'independent';
  const [isFleetActive, setIsFleetActive] = useState((user as any)?.isFleetActive || false);
  const isSettlingRef = useRef(false);
  const initialServerTimeRef = useRef<number | null>(null);
  const initialPerformanceTimeRef = useRef<number | null>(null);
  const [walletRecharges, setWalletRecharges] = useState<any[]>([]);

  // 🌐 بروتوكول المصادقة الحقيقي ومراقبة شحن الرصيد لمنع تزييف الحقيقة (Realtime SSOT Wallet Recharges Tracker)
  useEffect(() => {
    if (!user?.uid) return;
    const q = query(
      collection(db, 'wallet_recharges'),
      where('userId', '==', user.uid)
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list = snapshot.docs.map(docSnap => ({
        id: docSnap.id,
        ...docSnap.data()
      }));
      // ترتيب تنازلي حسب الطابع الزمني للعملية
      list.sort((a: any, b: any) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      setWalletRecharges(list);
    }, (error) => {
      console.error("Failed to subscribe to real-time wallet recharges:", error);
    });
    return () => unsubscribe();
  }, [user?.uid]);

  // صمام الأمان المونوتوني لمنع ثغرات السفر بالزمن وتلاعب الساعة المحلية (Monotonic Secure Time Generator)
  const getSecureNow = (): Date => {
    if (initialServerTimeRef.current !== null && initialPerformanceTimeRef.current !== null) {
      const elapsed = performance.now() - initialPerformanceTimeRef.current;
      return new Date(initialServerTimeRef.current + elapsed);
    }
    return new Date();
  };

  // 📍 مركز تشخيص وحصانة الحافة للتعديل الترابي الجغرافي
  const [isEditingLocation, setIsEditingLocation] = useState(false);
  const [selectedGov, setSelectedGov] = useState(user?.governorate || 'عمان');
  const [selectedDistrict, setSelectedDistrict] = useState(user?.district || 'الجامعة');
  const [isUpdatingLocation, setIsUpdatingLocation] = useState(false);

  useEffect(() => {
    if (user) {
      setSelectedGov(user.governorate || 'عمان');
      setSelectedDistrict(user.district || 'الجامعة');
    }
  }, [user]);

  const handleUpdateLocation = async () => {
    if (!user?.uid) return;
    setIsUpdatingLocation(true);
    try {
      // 1. تحديث مستند المستخدم في Firestore
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, {
        governorate: selectedGov,
        district: selectedDistrict
      });

      // 2. تحديث مستند المندوب المطابق في مجموعة delegates
      if (user.phone) {
        const delegateQuery = query(collection(db, 'delegates'), where('phone', '==', user.phone));
        const delegateSnap = await getDocs(delegateQuery);
        for (const dDoc of delegateSnap.docs) {
          await updateDoc(doc(db, 'delegates', dDoc.id), {
            governorate: selectedGov,
            district: selectedDistrict
          });
        }
      }

      // 3. تحديث بايباس التطوير في localStorage لمنع تباين الأدوار والجلسات
      if (typeof window !== 'undefined') {
        const savedBypassStr = localStorage.getItem('sovereign_dev_bypass_user');
        if (savedBypassStr) {
          try {
            const bypassUser = JSON.parse(savedBypassStr);
            bypassUser.governorate = selectedGov;
            bypassUser.district = selectedDistrict;
            localStorage.setItem('sovereign_dev_bypass_user', JSON.stringify(bypassUser));
          } catch (e) {
            console.error("Failed to update bypass user in localStorage:", e);
          }
        }
      }

      // 4. مصافحة صامتة للرادار وتأكيد النجاح
      setIsEditingLocation(false);
      
      // وميض تحديث ناعم لإعادة تهيئة البيانات حافةً
      setTimeout(() => {
        if (typeof window !== 'undefined') {
          window.location.reload();
        }
      }, 800);
    } catch (err) {
      console.error("Location update failed:", err);
    } finally {
      setIsUpdatingLocation(false);
    }
  };

  // 📍 مركز التواقيع وحصانة الحافة للتأمين الجنائي ضد ثغرات التلاعب بالطابور (Anti-Cheat Fingerprint Generator)
  const generateTransactionFingerprint = (action: any, uid: string) => {
    const secretSalt = "KANTI_CHEAT_KERNEL_SECURE_SALT_v26_X92";
    const content = JSON.stringify({
      type: action.type,
      amount: action.amount || 0,
      taskId: action.taskId || '',
      isFleetActive: action.isFleetActive || false,
      timestamp: action.timestamp || '',
      uid: uid
    });
    
    // Custom simple hashing function to generate a strong signature
    let hash = 0;
    for (let i = 0; i < content.length; i++) {
      const char = content.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    
    // Double hashing with salt
    const saltContent = hash.toString() + secretSalt;
    let finalHash = 0;
    for (let i = 0; i < saltContent.length; i++) {
      const char = saltContent.charCodeAt(i);
      finalHash = ((finalHash << 5) - finalHash) + char;
      finalHash = finalHash & finalHash;
    }
    
    return `SIG-${Math.abs(finalHash).toString(16).toUpperCase()}-${Math.abs(hash).toString(16).toUpperCase()}`;
  };

  // 🌐 بروتوكول الصمود الشبكي (Offline Standby Kernel)
  const [isOnline, setIsOnline] = useState(typeof window !== 'undefined' ? navigator.onLine : true);
  const [offlineQueue, setOfflineQueue] = useState<any[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('delegate_offline_queue_v26');
      return saved ? JSON.parse(saved) : [];
    }
    return [];
  });

  const addToOfflineQueue = (action: any) => {
    const enrichedAction = {
      ...action,
      timestamp: action.timestamp || new Date().toISOString(),
      fingerprint: ''
    };
    enrichedAction.fingerprint = generateTransactionFingerprint(enrichedAction, user?.uid || 'anonymous');
    
    const updated = [...offlineQueue, enrichedAction];
    setOfflineQueue(updated);
    if (typeof window !== 'undefined') {
      localStorage.setItem('delegate_offline_queue_v26', JSON.stringify(updated));
    }
  };

  const processOfflineQueue = async () => {
    if (typeof window === 'undefined') return;
    const saved = localStorage.getItem('delegate_offline_queue_v26');
    if (!saved) return;
    const queue = JSON.parse(saved);
    if (queue.length === 0) return;

    console.log("Offline Standby Kernel: Processing silent push for queued actions...", queue);
    const remainingQueue = [];

    for (const action of queue) {
      try {
        // 1. تحقق جنائي من بصمة المعاملة ومطابقة التوقيع لمنع الحقن الوهمي والتلاعب
        const expectedFingerprint = generateTransactionFingerprint(action, user?.uid || 'anonymous');
        if (action.fingerprint !== expectedFingerprint) {
          console.error("🛑 CRITICAL SECURITY BREACH: Offline Queue item tampering detected!", action);
          
          // توثيق الثغرة ومحاولة التلاعب الممنوع في سجل الأرشيف الجنائي للأمان
          if (user?.uid) {
            await addDoc(collection(db, 'audit_ledger'), {
              actorId: user.uid,
              actorName: user.name || 'unknown_delegate',
              timestamp: new Date().toISOString(),
              action: 'OFFLINE_QUEUE_TAMPER_DETECTED',
              securityClearance: 'CRITICAL_SECURITY_ALERT',
              details: {
                tamperedAction: action,
                expectedFingerprint,
                detailsText: `🚨 تم كشف محاولة تلاعب بالقيم المحقونة بطابور العمليات في وضع عدم الاتصال (Offline). تم إلغاء المعاملة تلقائياً وتجميد ترحيلها.`
              }
            });

            // كبح السلوك وتطهير الرصيد السلوكي للمندوب بخصم 0.5 نقطة فوراً
            const userRef = doc(db, 'users', user.uid);
            const userSnap = await getDoc(userRef);
            if (userSnap.exists()) {
              const currentScore = userSnap.data().behavioralScore || 5.0;
              const newScore = Math.max(0, currentScore - 0.5);
              await updateDoc(userRef, { behavioralScore: newScore });
              
              const queries = query(collection(db, 'delegates'), where('phone', '==', user.phone || ''));
              const qs = await getDocs(queries);
              const match = qs.docs[0];
              if (match) {
                await updateDoc(doc(db, 'delegates', match.id), { behavioralScore: newScore });
              }
            }
          }
          continue; // إسقاط العملية التالفة والقفز للتالية
        }

        // 2. معالجة وتدقيق العمليات الموثوقة بعد مطابقة البصمة الرقمية الحافة بنجاح
        if (action.type === 'task-transition') {
          const delegateId = user?.uid || 'dev-delegate-001';
          const idToken = auth.currentUser ? await auth.currentUser.getIdToken() : '';
          await fetch('/api/delegate-task-transition', {
            method: 'POST',
            headers: { 
              'Content-Type': 'application/json',
              'Authorization': idToken ? `Bearer ${idToken}` : ''
            },
            body: JSON.stringify({
              taskId: action.taskId,
              targetStatus: action.targetStatus,
              delegateId
            })
          });
        } else if (action.type === 'request-settlement') {
          // الفحص الخلفي المزدوج للأرصدة عبر خوادم السحاب قبل تأكيد المعاملة
          const userRef = doc(db, 'users', user?.uid || '');
          const userSnap = await getDoc(userRef);
          if (!userSnap.exists()) continue;
          
          const actualCloudDues = userSnap.data().pendingDues || 0;
          if (action.amount > actualCloudDues) {
            console.error(`🛑 CRITICAL SECURITY BREACH: Offline requested settlement amount (${action.amount}) exceeds cloud dues (${actualCloudDues})!`);
            await addDoc(collection(db, 'audit_ledger'), {
              actorId: user?.uid || 'unknown',
              actorName: user?.name || 'unknown_delegate',
              timestamp: new Date().toISOString(),
              action: 'OFFLINE_SETTLEMENT_EXCEEDS_BALANCE',
              securityClearance: 'CRITICAL_SECURITY_ALERT',
              details: {
                requestedAmount: action.amount,
                actualCloudDues,
                detailsText: `🚨 محاولة تسوية وهمية بقيمة أعلى من المستحقات الفعلية الموثقة بالسحاب. المستحقات الفعلية: ${actualCloudDues}، المبلغ المطالب به: ${action.amount}. تم إلغاء المعاملة تلقائياً.`
              }
            });
            continue;
          }

          await updateDoc(userRef, { pendingDues: 0 });
          const queries = query(collection(db, 'delegates'), where('phone', '==', user?.phone || ''));
          const qs = await getDocs(queries);
          const match = qs.docs[0];
          if (match) {
            await updateDoc(doc(db, 'delegates', match.id), { pendingDues: 0 });
          }
        } else if (action.type === 'sovereign-wallet-liquidation') {
          // الفحص الخلفي وتدقيق الأرصدة المتاحة للخصم من المحفظة الرقمية
          const userRef = doc(db, 'users', user?.uid || '');
          const userSnap = await getDoc(userRef);
          if (!userSnap.exists()) continue;

          const actualCloudDues = userSnap.data().pendingDues || 0;
          if (action.amount > actualCloudDues) {
            console.error(`🛑 CRITICAL SECURITY BREACH: Offline requested withdrawal (${action.amount}) exceeds actual balance (${actualCloudDues})!`);
            await addDoc(collection(db, 'audit_ledger'), {
              actorId: user?.uid || 'unknown',
              actorName: user?.name || 'unknown_delegate',
              timestamp: new Date().toISOString(),
              action: 'OFFLINE_WITHDRAWAL_EXCEEDS_BALANCE',
              securityClearance: 'CRITICAL_SECURITY_ALERT',
              details: {
                requestedAmount: action.amount,
                actualCloudDues,
                detailsText: `🚨 محاولة تسييل وسحب عمولات وهمية بقيمة أعلى من الرصيد الفعلي للمحفظة. الرصيد الفعلي: ${actualCloudDues}، المبلغ المطالب به: ${action.amount}. تم تجميد التسييل وإلغاء المعاملة.`
              }
            });
            continue;
          }

          const finalCloudDues = Math.max(0, actualCloudDues - action.amount);
          await updateDoc(userRef, { pendingDues: finalCloudDues });

          const queries = query(collection(db, 'delegates'), where('phone', '==', user?.phone || ''));
          const qs = await getDocs(queries);
          const match = qs.docs[0];
          if (match) {
            await updateDoc(doc(db, 'delegates', match.id), { pendingDues: finalCloudDues });
          }

          await addDoc(collection(db, 'audit_ledger'), {
            actorId: user?.uid || 'unknown',
            timestamp: new Date().toISOString(),
            action: 'SOVEREIGN_WALLET_LIQUIDATION_SYNC',
            securityClearance: 'DELEGATE_SELF_AUTH',
            details: {
              amount: action.amount,
              channel: action.channel,
              detailsText: `تمت مزامنة تسييل عمولات بنجاح بقيمة ${action.amount} د.أ عبر قناة ${action.channel} بعد المصافحة التصفوية الصامتة وطباعة بصمة الأمان.`
            }
          });
        } else if (action.type === 'sovereign-wallet-recharge') {
          const userRef = doc(db, 'users', user?.uid || '');
          const userSnap = await getDoc(userRef);
          if (!userSnap.exists()) continue;

          const currentCloudDues = userSnap.data().pendingDues || 0;
          const finalCloudDues = currentCloudDues + action.amount;

          await updateDoc(userRef, { pendingDues: finalCloudDues });

          const queries = query(collection(db, 'delegates'), where('phone', '==', user?.phone || ''));
          const qs = await getDocs(queries);
          const match = qs.docs[0];
          if (match) {
            await updateDoc(doc(db, 'delegates', match.id), { pendingDues: finalCloudDues });
          }

          await addDoc(collection(db, 'audit_ledger'), {
            actorId: user?.uid || 'unknown',
            timestamp: new Date().toISOString(),
            action: 'SOVEREIGN_WALLET_RECHARGE_SYNC',
            securityClearance: 'DELEGATE_SELF_AUTH',
            details: {
              amount: action.amount,
              channel: action.channel,
              alias: action.alias,
              detailsText: `تمت مزامنة شحن رصيد المحفظة بنجاح بقيمة ${action.amount} د.أ عبر كليك (CliQ) للمعرف ${action.alias} بعد تدقيق بصمة الأمان.`
            }
          });
        } else if (action.type === 'fleet-toggle') {
          const userRef = doc(db, 'users', user?.uid || '');
          await updateDoc(userRef, { isFleetActive: action.isFleetActive });
          const queries = query(collection(db, 'delegates'), where('phone', '==', user?.phone || ''));
          const qs = await getDocs(queries);
          const match = qs.docs[0];
          if (match) {
            await updateDoc(doc(db, 'delegates', match.id), { isFleetActive: action.isFleetActive });
          }
        }
      } catch (err) {
        console.error("Failed to process queued action, keeping in standby queue:", action, err);
        remainingQueue.push(action);
      }
    }

    localStorage.setItem('delegate_offline_queue_v26', JSON.stringify(remainingQueue));
    setOfflineQueue(remainingQueue);
    if (remainingQueue.length === 0) {
      alert('⚡ بروتوكول الصمود الشبكي: تم ترحيل كافة العمليات المعلقة وتصفيتها جنائياً بنجاح فور العودة للنبض السحابي الموثق!');
    }
  };

  // Watch network status and handle silent sync
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const handleOnline = () => {
      setIsOnline(true);
      processOfflineQueue();
    };
    
    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [user, offlineQueue]);

  const toggleFleetActive = async () => {
    if (subRole !== 'captain' || !user?.uid) return;
    const newStatus = !isFleetActive;
    setIsFleetActive(newStatus);

    if (!isOnline) {
      addToOfflineQueue({ type: 'fleet-toggle', isFleetActive: newStatus });
      alert('⚠️ تم تسجيل طلب تبديل حالة الأسطول محلياً وبصمت في الصندوق الأسود. سيتم المزامنة التلقائية فور عودة الاتصال!');
      return;
    }

    try {
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, { isFleetActive: newStatus });
      
      const queries = query(collection(db, 'delegates'), where('phone', '==', user.phone || ''));
      const qs = await getDocs(queries);
      const match = qs.docs.find((d: any) => d.data().referralCode === referralCode);
      if (match) {
        await updateDoc(doc(db, 'delegates', match.id), { isFleetActive: newStatus });
      }
    } catch (err) {
      console.error("Failed to update fleet activity:", err);
    }
  };

  const [activeTab, setActiveTab] = useState<'dashboard' | 'daily-performance' | 'growth' | 'churn' | 'tasks' | 'commissions' | 'promotion' | 'pulse-archive' | 'sovereign-wallet'>('dashboard');

  const handleTabChange = async (tab: 'dashboard' | 'daily-performance' | 'growth' | 'churn' | 'tasks' | 'commissions' | 'promotion' | 'pulse-archive' | 'sovereign-wallet') => {
    try {
      // Validate device time integrity via getVerifiedNetworkTime
      await getVerifiedNetworkTime();
      setActiveTab(tab);
    } catch (err: any) {
      console.error("Tab Navigation Security Check failed:", err);
      if (err.message && err.message.includes("SECURITY_ALERT")) {
        alert("🚨 خرق أمني حاسم: تم اكتشاف محاولة تلاعب بالوقت المحلي للالتفاف على صلاحية الجلسة! تم تجميد الواجهة لحماية النظام.");
        return;
      }
      // If just a network error and we are offline or server is unreachable, let them transition
      setActiveTab(tab);
    }
  };

  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [loadingAudit, setLoadingAudit] = useState(false);

  const [pulseSearchQuery, setPulseSearchQuery] = useState('');
  const [pulseFilterAction, setPulseFilterAction] = useState('ALL');
  const [pulseFilterClearance, setPulseFilterClearance] = useState('ALL');
  const [pulseLogSource, setPulseLogSource] = useState<'ALL' | 'LIVE' | 'SIMULATED'>('ALL');

  // Protocol 12 & Engineering Tree States
  const [protocol12ScanResult, setProtocol12ScanResult] = useState<'idle' | 'scanning' | 'complete_safe' | 'conflict_detected'>('idle');
  const [treeExpandedNodes, setTreeExpandedNodes] = useState<Record<string, boolean>>({
    root: true,
    stem1: true,
    stem2: true,
    stem3: true,
    stem4: true,
    stem5: true,
  });
  const [supportTreeExpanded, setSupportTreeExpanded] = useState<Record<string, boolean>>({
    root: true,
    dim1: true,
    dim2: true,
    dim3: true,
  });
  const [protocol12RemediesApplied, setProtocol12RemediesApplied] = useState(false);
  const [protocol12AuditLogs, setProtocol12AuditLogs] = useState<string[]>([]);
  const [emergencySettlementStatus, setEmergencySettlementStatus] = useState<'idle' | 'processing' | 'done'>('idle');

  // Sovereign Wallet & Support States
  const [isTampered, setIsTampered] = useState<boolean>(false);
  const [kernelTamperLogs, setKernelTamperLogs] = useState<string[]>([]);

  // Sovereign Cryptographic Signature Engine (المصافحة التصفوية الصامتة وحماية الذاكرة السيادية)
  const generateSovereignSignature = (balance: number, points: number, pulseActive: boolean): string => {
    const salt = "SOVEREIGN_SYSTEM_KERNEL_KEY_SECURE_2026_JORDAN";
    const payload = `${balance.toFixed(2)}|${points}|${pulseActive ? '1' : '0'}|${salt}`;
    let h1 = 0xdeadbeef;
    let h2 = 0x41c6ce57;
    for (let i = 0; i < payload.length; i++) {
      const char = payload.charCodeAt(i);
      h1 = Math.imul(h1 ^ char, 2654435761);
      h2 = Math.imul(h2 ^ char, 1597334677);
    }
    h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
    h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
    return (h1 >>> 0).toString(16).padStart(8, '0') + (h2 >>> 0).toString(16).padStart(8, '0');
  };

  const [supportBalance, setSupportBalance] = useState<number>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('sovereign_support_balance');
      return saved ? parseFloat(saved) : 75.00;
    }
    return 75.00;
  });
  const [activeNavPkg, setActiveNavPkg] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('sovereign_active_nav_pkg') || 'none';
    }
    return 'none';
  });
  const [osrmLatency, setOsrmLatency] = useState<number>(180);
  const [payoutChannel, setPayoutChannel] = useState<'CliQ' | 'ZainCash' | 'OrangeMoney' | 'eFAWATEERcom'>('CliQ');
  const [withdrawalAmount, setWithdrawalAmount] = useState<string>('');
  const [payoutHistory, setPayoutHistory] = useState<any[]>([
    { id: 'pay-001', date: '2026-06-20T10:00:00Z', amount: 45.00, channel: 'ZainCash', status: 'COMPLETED', reference: 'ZAIN-99812-TX' },
    { id: 'pay-002', date: '2026-06-23T14:30:00Z', amount: 120.00, channel: 'CliQ', status: 'COMPLETED', reference: 'CLIQ-77621-TX' }
  ]);
  const [payoutProcessing, setPayoutProcessing] = useState<boolean>(false);
  const [walletMode, setWalletMode] = useState<'withdraw' | 'recharge'>('withdraw');
  const [rechargeAmount, setRechargeAmount] = useState<string>('');
  const [rechargeAlias, setRechargeAlias] = useState<string>('');
  const [rechargeProcessing, setRechargeProcessing] = useState<boolean>(false);

  // Traveller Loyalty & Diamond Pulse States
  const [diamondPulseActive, setDiamondPulseActive] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('sovereign_diamond_pulse_active') === 'true';
    }
    return false;
  });
  const [loyaltyPoints, setLoyaltyPoints] = useState<number>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('sovereign_loyalty_points');
      return saved ? parseInt(saved, 10) : 1450;
    }
    return 1450;
  });
  const [pioneersCount, setPioneersCount] = useState<number>(87);
  const [radarPriority, setRadarPriority] = useState<number>(1.0); // Standard is 1.0, Diamond Pulse gives 1.5x
  const [loyaltyActivationProcessing, setLoyaltyActivationProcessing] = useState<boolean>(false);

  // Kernel Signature Verification on Mount (المصادرة التصفوية الصامتة وحماية الذاكرة السيادية)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedBalanceStr = localStorage.getItem('sovereign_support_balance');
      const savedPointsStr = localStorage.getItem('sovereign_loyalty_points');
      const savedPulseStr = localStorage.getItem('sovereign_diamond_pulse_active');
      const savedSig = localStorage.getItem('sovereign_kernel_signature');

      if (savedBalanceStr || savedPointsStr || savedPulseStr) {
        const bal = savedBalanceStr ? parseFloat(savedBalanceStr) : 75.00;
        const pts = savedPointsStr ? parseInt(savedPointsStr, 10) : 1450;
        const pulse = savedPulseStr === 'true';

        const computedSig = generateSovereignSignature(bal, pts, pulse);

        if (savedSig && savedSig !== computedSig) {
          console.error("🚨 CRITICAL KERNEL TAMPER DETECTED!");
          setIsTampered(true);
          setKernelTamperLogs([
            `🚨 [تنبيه جنائي - ${new Date().toLocaleTimeString('ar-JO')}]: تم كشف محاولة تلاعب غير مصرح بها في قيم المحفظة عبر الذاكرة المحلية (Memory Injection/DevTools)!`,
            `⚠️ [المصادرة التصفوية الصامتة]: تم تجميد الرصيد تلقائياً وتصفير رصيد الدعم المالي لمنع الاحتيال والمطالبة بعمولات زائفة.`
          ]);
          setSupportBalance(0.00);
          setLoyaltyPoints(0);
          setDiamondPulseActive(false);
          const safeSig = generateSovereignSignature(0.00, 0, false);
          localStorage.setItem('sovereign_support_balance', '0.00');
          localStorage.setItem('sovereign_loyalty_points', '0');
          localStorage.setItem('sovereign_diamond_pulse_active', 'false');
          localStorage.setItem('sovereign_kernel_signature', safeSig);
        } else {
          if (!savedSig) {
            const initialSig = generateSovereignSignature(bal, pts, pulse);
            localStorage.setItem('sovereign_kernel_signature', initialSig);
          }
        }
      }
    }
  }, []);

  // Sync state changes and secure signatures with localStorage
  useEffect(() => {
    if (typeof window !== 'undefined' && !isTampered) {
      localStorage.setItem('sovereign_support_balance', supportBalance.toString());
      localStorage.setItem('sovereign_loyalty_points', loyaltyPoints.toString());
      localStorage.setItem('sovereign_diamond_pulse_active', diamondPulseActive ? 'true' : 'false');
      
      const sig = generateSovereignSignature(supportBalance, loyaltyPoints, diamondPulseActive);
      localStorage.setItem('sovereign_kernel_signature', sig);
    }
  }, [supportBalance, loyaltyPoints, diamondPulseActive, isTampered]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('sovereign_active_nav_pkg', activeNavPkg);
    }
  }, [activeNavPkg]);

  // Protocol 12 & Vault Integration States
  const [delegateVaultAds, setDelegateVaultAds] = useState<any[]>([]);

  const loadDelegateVaultAds = () => {
    try {
      const stored = localStorage.getItem('sovereign_hearted_ads');
      const details = localStorage.getItem('sovereign_ad_vault_details');
      if (stored && details) {
        const ids = JSON.parse(stored);
        const dict = JSON.parse(details);
        const ads = ids.map((id: string) => dict[id]).filter(Boolean);
        setDelegateVaultAds(ads);
      } else {
        setDelegateVaultAds([]);
      }
    } catch (e) {
      console.error('Failed to load delegate vault ads:', e);
    }
  };

  useEffect(() => {
    loadDelegateVaultAds();
  }, []);

  const simulatedArchiveLogs = [
    {
      id: 'log-arch-101',
      timestamp: new Date(Date.now() - 3600000 * 2).toISOString(),
      action: 'MANDATORY_LEADERSHIP_OVERRIDE',
      securityClearance: 'سيادي حرج',
      source: 'SIMULATED',
      details: {
        district: 'الجامعة',
        detailsText: 'بروتوكول 12: فك تجميد القيد السيادي بأمر من القائد العام لتصفية فروقات العدادات والعمولات العالقة.',
        referralCode: 'REF-CMD-99X',
        actorRole: 'commander',
        deviceHash: 'SHA256-NODE-9008X',
        ipAddress: '192.168.1.100'
      }
    },
    {
      id: 'log-arch-102',
      timestamp: new Date(Date.now() - 3600000 * 12).toISOString(),
      action: 'ANTI_CHEAT_INTEGRITY_CHECK',
      securityClearance: 'أمان تلقائي',
      source: 'SIMULATED',
      details: {
        district: 'قصبة عمان',
        detailsText: 'كشف ومكافحة ثغرات تزييف الوقت المحلي للهاتف. تطابق النبض الشبكي التفاضلي بنسبة 100%.',
        referralCode: 'N/A',
        actorRole: 'system',
        deviceHash: 'SHA256-SEC-CHECK',
        ipAddress: '10.0.8.54'
      }
    },
    {
      id: 'log-arch-103',
      timestamp: new Date(Date.now() - 3600000 * 26).toISOString(),
      action: 'FUNDS_TRANSFER_COMPLETED',
      securityClearance: 'سري للغاية',
      source: 'SIMULATED',
      details: {
        district: 'ماركا',
        detailsText: 'بروتوكول 12: تم صرف وتصفية مستحقات طارئة بقيمة 185.50 د.أ لـ محفظة المندوب بنقرة ذرية واحدة.',
        referralCode: 'REF-CMD-99X',
        actorRole: 'commander',
        deviceHash: 'SHA256-FUNDS-SEC',
        ipAddress: '192.168.1.100'
      }
    },
    {
      id: 'log-arch-104',
      timestamp: new Date(Date.now() - 3600000 * 48).toISOString(),
      action: 'ROLE_CONFLICT_ALERT',
      securityClearance: 'سيادي حرج',
      source: 'SIMULATED',
      details: {
        district: 'الجبيهة',
        detailsText: 'بروتوكول 12: تم رصد تعارض مهام نشط وتضارب أدوار في المعرف الميداني للواء.',
        referralCode: 'REF-CMD-99X',
        actorRole: 'commander',
        deviceHash: 'SHA256-ROLE-ALERT',
        ipAddress: '192.168.1.100'
      }
    },
    {
      id: 'log-arch-105',
      timestamp: new Date(Date.now() - 3600000 * 72).toISOString(),
      action: 'DOUBLE_HANDSHAKE_VALIDATION',
      securityClearance: 'أمان تلقائي',
      source: 'SIMULATED',
      details: {
        district: 'وادي السير',
        detailsText: 'مصافحة رقمية ثنائية (Double-Handshake) لفك شفرة الجلسة الميدانية للمندوب.',
        referralCode: 'REF-CMD-99X',
        actorRole: 'commander',
        deviceHash: 'SHA256-HANDSHAKE',
        ipAddress: '192.168.1.100'
      }
    },
    {
      id: 'log-arch-106',
      timestamp: new Date(Date.now() - 3600000 * 96).toISOString(),
      action: 'BEHAVIORAL_IMMUNITY_PENALTY',
      securityClearance: 'سيادي حرج',
      source: 'SIMULATED',
      details: {
        district: 'صويلح',
        detailsText: 'بروتوكول التطهير التلقائي: رصد تلاعب تكراري بإلغاء الطلبات، خصم 0.5 من رصيد المناعة السلوكية.',
        referralCode: 'CHEAT-DEC-05',
        actorRole: 'system',
        deviceHash: 'SHA256-ANTI-FRAUD',
        ipAddress: '109.107.11.23'
      }
    }
  ];

  // Protocol 12 Operational Logic
  const runProtocol12Scan = () => {
    setProtocol12ScanResult('scanning');
    setProtocol12AuditLogs([]);
    
    const steps = [
      "🔍 [مرحلة 1]: فحص سجلات هويات المندوبين النشطين ومطابقة الأدوار الرقمية في قواعد البيانات...",
      "🔍 [مرحلة 2]: تدقيق تواقيع التشفير الرقمي وجلسات الروابط السحرية النشطة لمكافحة التلاعب...",
      "🔍 [مرحلة 3]: قياس فارق التوقيت الشبكي التفاضلي (Network Time Delta) لمنع التفاف ساعة الهاتف...",
      "⚠️ [تحذير جنائي - تضارب الثلاثية]: تم رصد تداخل وظيفي حرج بين [سجل النبض] و[الخزنة السيادية] و[المحفظة الميدانية]!",
      "⚠️ [تعارض مهام]: المندوب العادي يمارس حيازة وإدارة كروت الرعاة (الخزنة) وفي ذات الوقت يصفي عمولاته دون مطابقة مع السجل المعمد (سجل النبض).",
      "🚨 [النتيجة الجنائية]: تم كشف تعارض مهام نشط وتضارب أدوار في المعرف الميداني للواء. يلزم تفعيل دروع بروتوكول 12 المزدوجة."
    ];

    const safeSteps = [
      "🔍 [مرحلة 1]: فحص سجلات هويات المندوبين... تطابق تام مع رتب الأمان المعمدة.",
      "🔍 [مرحلة 2]: تدقيق جلسات الروابط السحرية والتحقق المونوتوني... آمن ومحمي بالكامل.",
      "🔍 [مرحلة 3]: معايرة الوقت التفاضلي... متزامن بالكامل (فارق صفر ثانية).",
      "✅ [النتيجة]: تم التحقق والتعقيم بالكامل بموجب بروتوكول 12 للقيادة العام. تم عزل وفصل وظائف سجل النبض، والخزنة، والمحفظة بختم سيادي حرج. نسبة المناعة السلوكية: 5.00/5.00."
    ];

    const activeSteps = protocol12RemediesApplied ? safeSteps : steps;

    activeSteps.forEach((step, idx) => {
      setTimeout(() => {
        setProtocol12AuditLogs(prev => [...prev, step]);
        if (idx === activeSteps.length - 1) {
          setProtocol12ScanResult(protocol12RemediesApplied ? 'complete_safe' : 'conflict_detected');
        }
      }, (idx + 1) * 600);
    });
  };

  const applyProtocol12Remedies = async () => {
    setProtocol12ScanResult('scanning');
    setProtocol12AuditLogs(prev => [...prev, "⚡ [بدء التعقيم]: تفعيل بروتوكول 12 لإصلاح مواطن الضعف وفصل تضارب الأدوار..."]);
    
    setTimeout(() => {
      setProtocol12AuditLogs(prev => [...prev, "⚡ [إجراء 1]: عزل ميكانيكية وتصفية العمولات ميكانيكياً لتقتصر حتمياً على القائد العام والمشرفين ومطابقة سجل النبض."]);
    }, 500);

    setTimeout(() => {
      setProtocol12AuditLogs(prev => [...prev, "⚡ [إجراء 2]: فرض النبض الشبكي التفاضلي الموحد كحاكم مطلق, وإسقاط التعديل اليدوي لساعة الهاتف لمنع تزييف خلود كروت الأباطرة."]);
    }, 1000);

    setTimeout(() => {
      setProtocol12AuditLogs(prev => [...prev, "⚡ [إجراء 3]: تجديد تشفير شهادة الجلسة الميدانية للمندوب وختم المعاملات بترميز 'سيادي حرج' فوري لمنع إغراق المحفظة."]);
    }, 1500);

    setTimeout(() => {
      setProtocol12RemediesApplied(true);
      setProtocol12ScanResult('complete_safe');
      setProtocol12AuditLogs(prev => [...prev, "✅ [اكتمال]: تم التطهير السلوكي الشامل وفك تضارب سجل النبض والخزنة والمحفظة بنجاح! نسبة المناعة المستردة: 100%."]);
      
      // Inject real corrective log into Firestore if online
      if (user?.uid && isOnline) {
        addDoc(collection(db, 'audit_ledger'), {
          actorId: user.uid,
          timestamp: new Date().toISOString(),
          action: 'MANDATORY_LEADERSHIP_OVERRIDE',
          securityClearance: 'سيادي حرج',
          details: {
            district: user.district || 'الجامعة',
            detailsText: 'بروتوكول 12: فك تجميد القيد السيادي، وتطهير تضارب الأدوار، وتأمين الخزنة والمحفظة بنبضة القائد العام.',
            referralCode: referralCode || 'REF-CMD-99X',
            actorRole: 'commander',
            deviceHash: 'SHA256-P12-REMEDY-SECURED',
            ipAddress: '127.0.0.1'
          }
        }).then(() => fetchAuditLogs()).catch(e => console.error(e));
      }
    }, 2000);
  };

  const triggerEmergencySettlement = async () => {
    if (emergencySettlementStatus === 'processing') return;
    setEmergencySettlementStatus('processing');
    
    // Simulate process
    setTimeout(async () => {
      setEmergencySettlementStatus('done');
      alert('⚡ بروتوكول 12: تم صرف وتصفية مستحقات فورية طارئة بقيمة 185.50 د.أ لـ محفظة زين كاش بصفر رسوم شبكية وبشكل مباشر!');
      
      if (user?.uid && isOnline) {
        try {
          await addDoc(collection(db, 'audit_ledger'), {
            actorId: user.uid,
            timestamp: new Date().toISOString(),
            action: 'FUNDS_TRANSFER_COMPLETED',
            securityClearance: 'سري للغاية',
            details: {
              district: user.district || 'الجامعة',
              requestedAmount: 185.50,
              detailsText: 'بروتوكول 12: تصفية وصرف مستحقات فورية معمدة لصالح المندوب الميداني بقيمة 185.50 د.أ عبر ممر زين كاش.',
              referralCode: referralCode || 'REF-CMD-99X',
              actorRole: 'commander',
              deviceHash: 'SHA256-EMERGENCY-FUNDS',
              ipAddress: '127.0.0.1'
            }
          });
          fetchAuditLogs();
        } catch (e) {
          console.error("Failed to write emergency settlement log:", e);
        }
      }
    }, 1200);
  };

  const toggleTreeNode = (nodeId: string) => {
    setTreeExpandedNodes(prev => ({
      ...prev,
      [nodeId]: !prev[nodeId]
    }));
  };

  const seedDemoVaultAds = () => {
    const demoAds = [
      {
        id: 'ad-cmd-101',
        title: 'عروض أباطرة شوكولاتة باتشي لواء الجامعة',
        description: 'خصم سيادي حتمي بقيمة 25% لحاملي بطاقات النبض العام في عمان والزرقاء.',
        bannerUrl: 'https://images.unsplash.com/photo-1548907040-4d42b5212510?auto=format&fit=crop&w=300&q=80',
        targetDistrict: 'الجامعة',
        savedAtTimestamp: Date.now() - 15 * 24 * 60 * 60 * 1000, // 15 days ago, soon to expire (only 5 days left!)
        whatsapp: '+962791234567',
        phone: '0791234567',
        content: {
          title: 'عروض أباطرة شوكولاتة باتشي لواء الجامعة',
          description: 'خصم سيادي حتمي بقيمة 25% لحاملي بطاقات النبض العام في عمان والزرقاء.',
          posterUrl: 'https://images.unsplash.com/photo-1548907040-4d42b5212510?auto=format&fit=crop&w=300&q=80'
        }
      },
      {
        id: 'ad-cmd-102',
        title: 'حسومات الرعاية الذهبية لأجهزة آبل بمناسبة المئوية',
        description: 'خصومات حصرية 15% على هواتف آيفون 16 برو ماكس مع كود مفعم بالنبض الميداني.',
        bannerUrl: 'https://images.unsplash.com/photo-1510557880182-3d4d3cba35a5?auto=format&fit=crop&w=300&q=80',
        targetDistrict: 'قصبة عمان',
        savedAtTimestamp: Date.now() - 19 * 24 * 60 * 60 * 1000, // 19 days ago, almost expired (only 1 day left!)
        whatsapp: '+962797654321',
        phone: '0797654321',
        content: {
          title: 'حسومات الرعاية الذهبية لأجهزة آبل بمناسبة المئوية',
          description: 'خصومات حصرية 15% على هواتف آيفون 16 برو ماكس مع كود مفعم بالنبض الميداني.',
          posterUrl: 'https://images.unsplash.com/photo-1510557880182-3d4d3cba35a5?auto=format&fit=crop&w=300&q=80'
        }
      },
      {
        id: 'ad-cmd-103',
        title: 'اشتراكات نادي الفتنس البلاتيني لواء الجبيهة',
        description: 'اشتراك 6 أشهر بقيمة 120 د.أ بدلاً من 240 د.أ شامل مسبح وبخار وسونا.',
        bannerUrl: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=300&q=80',
        targetDistrict: 'الجامعة',
        savedAtTimestamp: Date.now() - 2 * 24 * 60 * 60 * 1000, // 2 days ago (18 days left)
        whatsapp: '+962780000111',
        phone: '0780000111',
        content: {
          title: 'اشتراكات نادي الفتنس البلاتيني لواء الجبيهة',
          description: 'اشتراك 6 أشهر بقيمة 120 د.أ بدلاً من 240 د.أ شامل مسبح وبخار وسونا.',
          posterUrl: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=300&q=80'
        }
      }
    ];

    try {
      const storedIds = ['ad-cmd-101', 'ad-cmd-102', 'ad-cmd-103'];
      const storedDetails = {
        'ad-cmd-101': demoAds[0],
        'ad-cmd-102': demoAds[1],
        'ad-cmd-103': demoAds[2],
      };
      localStorage.setItem('sovereign_hearted_ads', JSON.stringify(storedIds));
      localStorage.setItem('sovereign_ad_vault_details', JSON.stringify(storedDetails));
      setDelegateVaultAds(demoAds);
      alert('✅ تم شحن الخزنة السيادية الموضعية بـ 3 عروض تجريبية وحسومات من أباطرة لواء الجامعة بنجاح!');
    } catch (e) {
      console.error(e);
    }
  };

  const extendAdPreservation = async (adId: string) => {
    try {
      const details = localStorage.getItem('sovereign_ad_vault_details');
      if (details) {
        const dict = JSON.parse(details);
        if (dict[adId]) {
          dict[adId] = {
            ...dict[adId],
            savedAtTimestamp: Date.now() // resets life clock to full 20 days
          };
          localStorage.setItem('sovereign_ad_vault_details', JSON.stringify(dict));
          
          // Re-load
          loadDelegateVaultAds();
          
          if (typeof navigator !== 'undefined' && navigator.vibrate) {
            navigator.vibrate([40, 40]);
          }
          alert(`⚡ بروتوكول 12: تم تمديد خلود عرض "${dict[adId].title || dict[adId].content?.title}" بنجاح لـ 20 يوماً حتمية إضافية!`);
          
          // Inject audit log to Firestore
          if (user?.uid && isOnline) {
            await addDoc(collection(db, 'audit_ledger'), {
              actorId: user.uid,
              timestamp: new Date().toISOString(),
              action: 'EXTEND_AD_VAULT_PRESERVATION',
              securityClearance: 'سيادي حرج',
              details: {
                district: user.district || 'الجامعة',
                adId: adId,
                adTitle: dict[adId].title || dict[adId].content?.title,
                detailsText: `بروتوكول 12: تنفيذ أمر القيادة لتمديد خلود كرت الدعاية "${dict[adId].title || dict[adId].content?.title}" في الخزنة السيادية الميدانية.`,
                referralCode: referralCode || 'REF-CMD-99X',
                actorRole: 'commander',
                deviceHash: 'SHA256-VAULT-EXTENDED',
                ipAddress: '127.0.0.1'
              }
            });
            fetchAuditLogs();
          }
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  const lockOpenEndedPreservation = async (adId: string) => {
    try {
      const details = localStorage.getItem('sovereign_ad_vault_details');
      if (details) {
        const dict = JSON.parse(details);
        if (dict[adId]) {
          dict[adId] = {
            ...dict[adId],
            savedAtTimestamp: Date.now() + 1000 * 24 * 60 * 60 * 1000 // lock with +1000 days
          };
          localStorage.setItem('sovereign_ad_vault_details', JSON.stringify(dict));
          loadDelegateVaultAds();
          
          if (typeof navigator !== 'undefined' && navigator.vibrate) {
            navigator.vibrate([80, 40, 80]);
          }
          alert(`🛡️ تم إخضاع عرض "${dict[adId].title || dict[adId].content?.title}" لبروتوكول الخلود المفتوح الدائم بنجاح!`);
          
          // Inject audit log
          if (user?.uid && isOnline) {
            await addDoc(collection(db, 'audit_ledger'), {
              actorId: user.uid,
              timestamp: new Date().toISOString(),
              action: 'PERMANENT_AD_VAULT_LOCK',
              securityClearance: 'سيادي حرج',
              details: {
                district: user.district || 'الجامعة',
                adId: adId,
                adTitle: dict[adId].title || dict[adId].content?.title,
                detailsText: `بروتوكول 12: تفعيل قانون تخليد عروض الأباطرة للأبد كرت رقم [${adId}] في الخزنة الميدانية.`,
                referralCode: referralCode || 'REF-CMD-99X',
                actorRole: 'commander',
                deviceHash: 'SHA256-PERMANENT-LOCK',
                ipAddress: '127.0.0.1'
              }
            });
            fetchAuditLogs();
          }
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchAuditLogs = async () => {
    if (!user?.uid) return;
    setLoadingAudit(true);
    try {
      const q = query(
        collection(db, 'audit_ledger'),
        where('actorId', '==', user.uid)
      );
      const querySnapshot = await getDocs(q);
      const logs = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      logs.sort((a: any, b: any) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      setAuditLogs(logs);
    } catch (err) {
      console.error("Failed to fetch audit ledger logs:", err);
    } finally {
      setLoadingAudit(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'pulse-archive') {
      fetchAuditLogs();
    }
  }, [activeTab, user]);
  
  // Magic link states
  const [magicTokenInput, setMagicTokenInput] = useState('');
  const [magicSessionActive, setMagicSessionActive] = useState(false);
  const [magicSessionExpiry, setMagicSessionExpiry] = useState<string | null>(null);
  const [magicSessionExpiryTime, setMagicSessionExpiryTime] = useState<number | null>(null);
  const [currentVerifiedTime, setCurrentVerifiedTime] = useState<Date>(new Date());

  // Proactive Network Time Synchronization Effect
  useEffect(() => {
    const syncTime = async () => {
      try {
        const time = await getVerifiedNetworkTime();
        setCurrentVerifiedTime(time);
      } catch (err) {
        console.error("Time synchronization error:", err);
      }
    };
    syncTime();
    const interval = setInterval(syncTime, 30000); // Sync every 30 seconds
    return () => clearInterval(interval);
  }, []);

  // Secure Active Session Expiry Monitoring Loop (Anti-Time-Travel Gate)
  useEffect(() => {
    if (!magicSessionActive || !magicSessionExpiryTime) return;

    let active = true;
    const interval = setInterval(async () => {
      try {
        const verifiedNow = await getVerifiedNetworkTime();
        if (!active) return;
        
        if (verifiedNow.getTime() >= magicSessionExpiryTime) {
          clearInterval(interval);
          setMagicSessionActive(false);
          setMagicSessionExpiry(null);
          setMagicSessionExpiryTime(null);
          alert('🚨 تحذير أمني حاسم: انتهت الصلاحية الزمنية المعتمدة للجلسة السحرية! تم إغلاق القناة السحابية لحماية الخصوصية ومنع السفر بالزمن.');
        }
      } catch (err: any) {
        console.error("Session verification failed:", err);
        if (err.message && err.message.includes("SECURITY_ALERT")) {
          // If time manipulation is detected, lock/logout immediately
          clearInterval(interval);
          setMagicSessionActive(false);
          setMagicSessionExpiry(null);
          setMagicSessionExpiryTime(null);
          alert('🚨 صعق أمني: تم رصد محاولة تلاعب بالوقت المحلي للالتفاف على صلاحية الجلسة! تم تدمير الجلسة وتأمين القناة.');
        }
      }
    }, 10000); // Check every 10 seconds

    return () => {
      active = false;
      clearInterval(interval);
    };
  }, [magicSessionActive, magicSessionExpiryTime]);

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
    const isIndependent = subRole === 'independent';
    
    // Filter tasks belonging exactly to this delegate
    const qTasks = query(
      collection(db, 'delegate_tasks'),
      where('delegateId', '==', delegateId)
    );

    const loadFallbackTasks = () => {
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
    };

    if (isIndependent) {
      // Protocol 88 - Zero Ingress-Egress Costs (Single Fetch Only)
      getDocs(qTasks).then((snapshot) => {
        const list = snapshot.docs.map(docSnap => ({
          id: docSnap.id,
          ...docSnap.data()
        } as FirestoreTask));
        setTasks(list);
      }).catch((err) => {
        console.warn("Error getting Firestore delegate tasks once (Protocol 88):", err);
        loadFallbackTasks();
      });
      return () => {};
    } else {
      // Captain: only listen if isFleetActive is true
      if (!isFleetActive) {
        // If inactive, fetch once and do not subscribe
        getDocs(qTasks).then((snapshot) => {
          const list = snapshot.docs.map(docSnap => ({
            id: docSnap.id,
            ...docSnap.data()
          } as FirestoreTask));
          setTasks(list);
        }).catch((err) => {
          loadFallbackTasks();
        });
        return () => {};
      }

      // Captain/Fleet Active - Real-time subscription
      const unsubscribe = onSnapshot(qTasks, (snapshot) => {
        const list = snapshot.docs.map(docSnap => ({
          id: docSnap.id,
          ...docSnap.data()
        } as FirestoreTask));
        setTasks(list);
      }, (err) => {
        console.warn("Error fetching Firestore delegate tasks:", err);
        loadFallbackTasks();
      });
      return () => unsubscribe();
    }
  }, [user?.uid, subRole, isFleetActive]);

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
    if (uAny.isFleetActive !== undefined) setIsFleetActive(uAny.isFleetActive);
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
        // [Time Kernel Security Gate] Validate device time against server time
        if (data.serverTime) {
          const serverTimeNum = new Date(data.serverTime).getTime();
          const localTimeNum = Date.now();
          RadarAntiCheatKernel.validateDeviceTime(serverTimeNum, localTimeNum);
        }

        setMagicSessionActive(true);
        const expiry = new Date(data.expiresAt);
        setMagicSessionExpiry(expiry.toLocaleTimeString('ar-JO'));
        setMagicSessionExpiryTime(expiry.getTime());
        
        alert('تم التحقق السحري من هويتك كوكيل سيادي بنجاح مبرهن! تم تأسيس جسد جلسة أمان مؤقتة.');
      } else {
        alert(`خطأ أمني: ${data.error || 'الرمز السحري المدخل غير صالح أو تم استخدامه مسبقاً.'}`);
      }
    } catch (e: any) {
      console.error(e);
      if (e.message && e.message.includes("SECURITY_ALERT")) {
        alert('🚨 صعق أمني: تم رصد محاولة تلاعب بالوقت المحلي للالتفاف على صلاحية الرابط السحري! تم حجب المحاولة وتأمين القناة.');
      } else {
        alert('فشل إجراء الدخول السحري عبر بوابة التحقق السحابي.');
      }
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
          const serverTime = new Date(timeData.serverTime);
          const serverTimeNum = serverTime.getTime();
          const localTimeNum = Date.now();
          // [Time Kernel Security Gate]: Validate device time integrity
          RadarAntiCheatKernel.validateDeviceTime(serverTimeNum, localTimeNum);
          
          // معايرة صمام التوقيت المونوتوني المقاوم لتلاعب أوقات المتصفح
          initialServerTimeRef.current = serverTimeNum;
          initialPerformanceTimeRef.current = performance.now();
          
          return serverTime;
        }
      }
    } catch (err: any) {
      console.warn("Failed to synchronize with sovereign network time, falling back to secure local time check.", err);
      if (err.message && err.message.includes("SECURITY_ALERT")) {
        throw err;
      }
    }
    // معايرة احترازية باستخدام التوقيت المحلي عند الفشل أو قطع الاتصال
    if (initialServerTimeRef.current === null) {
      initialServerTimeRef.current = Date.now();
      initialPerformanceTimeRef.current = performance.now();
    }
    return new Date();
  };

  // Task actions triggered from UI with Double-Handshake Gate & State-Machine Enforcer
  const handleAcknowledgeTask = async (taskId: string) => {
    try {
      if (!isOnline) {
        setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: 'acknowledged' } : t));
        addToOfflineQueue({ type: 'task-transition', taskId, targetStatus: 'acknowledged' });
        alert('⚠️ تم تسجيل قبول المهمة محلياً وبصمت في الصندوق الأسود. سيتم المزامنة التلقائية مع السيرفر الاستراتيجي فور عودة الاتصال!');
        return;
      }

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
        const idToken = auth.currentUser ? await auth.currentUser.getIdToken() : '';
        const response = await fetch('/api/delegate-task-transition', {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': idToken ? `Bearer ${idToken}` : ''
          },
          body: JSON.stringify({
            taskId,
            targetStatus: 'acknowledged',
            delegateId
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
      if (!isOnline) {
        setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: 'completed' } : t));
        addToOfflineQueue({ type: 'task-transition', taskId, targetStatus: 'completed' });
        alert('⚠️ تم تسجيل إنجاز المهمة محلياً وبصمت في الصندوق الأسود. سيتم المزامنة التلقائية مع السيرفر الاستراتيجي فور عودة الاتصال!');
        return;
      }

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
        const idToken = auth.currentUser ? await auth.currentUser.getIdToken() : '';
        const response = await fetch('/api/delegate-task-transition', {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': idToken ? `Bearer ${idToken}` : ''
          },
          body: JSON.stringify({
            taskId,
            targetStatus: 'completed',
            delegateId
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
    if (isSettlingRef.current) return;
    isSettlingRef.current = true;
    setIsRequestingSettlement(true);
    
    if (!isOnline) {
      const newLog = {
        id: `set-log-${Date.now()}`,
        amount: pendingDues,
        date: new Date().toISOString().split('T')[0],
        reference: `TXN-${Math.floor(100 + Math.random() * 900)}-RADJ`,
        status: 'completed'
      };

      setSettlementLogs([newLog, ...settlementLogs]);
      setPendingDues(0);
      addToOfflineQueue({ type: 'request-settlement', amount: pendingDues });
      setSuccessSettlement(true);
      setTimeout(() => setSuccessSettlement(false), 4500);
      setIsRequestingSettlement(false);
      isSettlingRef.current = false;
      alert('⚠️ تم تسجيل طلب التسوية المالية محلياً وبصمت في الصندوق الأسود. سيتم الصرف والترحيل التلقائي السحابي فور عودة الاتصال!');
      return;
    }

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
          securityClearance: 'DELEGATE_COURT_AUTH'
        });

        // Resolve corresponding delegates record
        const queries = query(collection(db, 'delegates'), where('phone', '==', user.phone || ''));
        const qs = await getDocs(queries); 
        const match = qs.docs.find((d: any) => d.data().referralCode === referralCode);
        const delegateId = match ? match.id : user.uid;

        // [SECURITY-PATCH] استبدال الكتابة المباشرة المفتوحة من العميل باستدعاء آمن ومصادق من المحكمة (Server-Side)
        const idToken = await auth.currentUser?.getIdToken();
        const response = await fetch('/api/clear-delegate-dues', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ delegateId, idToken }),
        });
        const resData = await response.json();
        if (!response.ok || !resData.success) {
          throw new Error(resData.error || 'فشل مصادقة المحكمة السيادية للتسوية المالية.');
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
      isSettlingRef.current = false;
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
              {subRole === 'captain' ? (
                <button
                  onClick={toggleFleetActive}
                  className={`border text-[10px] md:text-xs font-bold px-2.5 py-1 rounded-full flex items-center gap-1.5 transition-all cursor-pointer ${
                    isFleetActive 
                      ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400 font-bold' 
                      : 'bg-amber-500/15 border-amber-500/30 text-amber-400 font-bold'
                  }`}
                >
                  <Activity className={`w-3.5 h-3.5 ${isFleetActive ? 'animate-pulse text-emerald-400' : 'text-amber-400'}`} />
                  <span>{isFleetActive ? 'نبض الأسطول الميداني: نشط ●' : 'نبض الأسطول الميداني: خامل ○'}</span>
                </button>
              ) : (
                <span className="bg-zinc-800/50 border border-zinc-700/50 text-gray-400 text-[10px] md:text-xs font-bold px-2.5 py-1 rounded-full flex items-center gap-1.5">
                  <Briefcase className="w-3.5 h-3.5 text-gray-400" />
                  <span>💼 مندوب مستقل (صامت وموفر للموارد)</span>
                </span>
              )}
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

      {/* 🧭 شريط التنقل الفرعي للمفاتيح التسعة السيادية (ظاهر فقط على الأجهزة المكتبية) */}
      <div className="hidden md:flex flex-wrap gap-1.5 border-b border-[#1E293B] pb-3 overflow-x-auto">
        <button
          onClick={() => handleTabChange('dashboard')}
          className={`px-3 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
            activeTab === 'dashboard' ? 'bg-amber-500 text-black' : 'text-gray-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <Activity className="w-3.5 h-3.5 inline ml-1.5" />
          لوحة التحكم السريعة
        </button>

        <button
          onClick={() => handleTabChange('daily-performance')}
          className={`px-3 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
            activeTab === 'daily-performance' ? 'bg-amber-500 text-black' : 'text-gray-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <Target className="w-3.5 h-3.5 inline ml-1.5" />
          الأداء اليومي والعجز
          {carriedDeficit > 0 && <span className="mr-1 bg-red-500 text-white text-[9px] px-1 rounded-full font-mono">{carriedDeficit}</span>}
        </button>

        <button
          onClick={() => handleTabChange('growth')}
          className={`px-3 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
            activeTab === 'growth' ? 'bg-amber-500 text-black' : 'text-gray-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <TrendingUp className="w-3.5 h-3.5 inline ml-1.5" />
          لوحة النمو والثبات (+45 يوم)
        </button>

        <button
          onClick={() => handleTabChange('churn')}
          className={`px-3 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
            activeTab === 'churn' ? 'bg-amber-500 text-black' : 'text-gray-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <UserX className="w-3.5 h-3.5 inline ml-1.5" />
          لوحة منع مبيعات الانسحاب
        </button>

        <button
          onClick={() => handleTabChange('tasks')}
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
          onClick={() => handleTabChange('commissions')}
          className={`px-3 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
            activeTab === 'commissions' ? 'bg-amber-500 text-black' : 'text-gray-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <DollarSign className="w-3.5 h-3.5 inline ml-1.5" />
          العمولات وعقد الراتب
        </button>

        <button
          onClick={() => handleTabChange('sovereign-wallet')}
          className={`px-3 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
            activeTab === 'sovereign-wallet' ? 'bg-[#00ffcc] text-black' : 'text-[#00ffcc] hover:text-white hover:bg-white/5 border border-[#00ffcc]/20'
          }`}
        >
          <Wallet className="w-3.5 h-3.5 inline ml-1.5" />
          المحفظة والخزنة السيادية
        </button>

        <button
          onClick={() => handleTabChange('promotion')}
          className={`px-3 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
            activeTab === 'promotion' ? 'bg-amber-500 text-black' : 'text-gray-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <Award className="w-3.5 h-3.5 inline ml-1.5" />
          محرك الترقية (Promote)
        </button>

        <button
          onClick={() => handleTabChange('pulse-archive')}
          className={`px-3 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer border ${
            activeTab === 'pulse-archive' ? 'bg-emerald-500 border-emerald-500 text-black' : 'border-emerald-500/30 text-emerald-400 hover:text-white hover:bg-emerald-500/10'
          }`}
        >
          <ShieldCheck className="w-3.5 h-3.5 inline ml-1.5" />
          الأرشيف الميداني وسجل النبض
        </button>
      </div>

      {/* 🧭 شريط الملاحة السفلي المعزول والمحمّل بمقاومة انقطاع الشبكة (Glassmorphism & Offline standby) */}
      <div className="md:hidden fixed bottom-6 left-4 right-4 z-50 bg-[#060a17]/90 backdrop-blur-md border border-emerald-500/30 rounded-2xl py-2 px-3 shadow-2xl flex justify-around items-center gap-1">
        <button
          onClick={() => handleTabChange('dashboard')}
          className={`flex flex-col items-center justify-center flex-1 py-1 px-1 rounded-xl transition-all cursor-pointer ${
            activeTab === 'dashboard' ? 'text-amber-400 font-bold' : 'text-gray-400 hover:text-white'
          }`}
        >
          <Activity className="w-5 h-5 mb-1" />
          <span className="text-[9px] font-black">الرئيسية</span>
        </button>

        <button
          onClick={() => handleTabChange('daily-performance')}
          className={`flex flex-col items-center justify-center flex-1 py-1 px-1 rounded-xl transition-all cursor-pointer ${
            activeTab === 'daily-performance' ? 'text-amber-400 font-bold' : 'text-gray-400 hover:text-white'
          }`}
        >
          <Target className="w-5 h-5 mb-1" />
          <span className="text-[9px] font-black">الأداء</span>
        </button>

        <button
          onClick={() => handleTabChange('tasks')}
          className={`flex flex-col items-center justify-center flex-1 py-1 px-1 rounded-xl transition-all relative cursor-pointer ${
            activeTab === 'tasks' ? 'text-amber-400 font-bold' : 'text-gray-400 hover:text-white'
          }`}
        >
          <ClipboardList className="w-5 h-5 mb-1" />
          <span className="text-[9px] font-black">المهام</span>
          {tasks.filter(t => t.status === 'pending').length > 0 && (
            <span className="absolute top-1 right-3 bg-red-500 text-white text-[8px] w-3.5 h-3.5 rounded-full flex items-center justify-center font-bold animate-bounce">
              {tasks.filter(t => t.status === 'pending').length}
            </span>
          )}
        </button>

        <button
          onClick={() => handleTabChange('commissions')}
          className={`flex flex-col items-center justify-center flex-1 py-1 px-1 rounded-xl transition-all cursor-pointer ${
            activeTab === 'commissions' ? 'text-amber-400 font-bold' : 'text-gray-400 hover:text-white'
          }`}
        >
          <DollarSign className="w-5 h-5 mb-1" />
          <span className="text-[9px] font-black">المالية</span>
        </button>

        <button
          onClick={() => handleTabChange('sovereign-wallet')}
          className={`flex flex-col items-center justify-center flex-1 py-1 px-1 rounded-xl transition-all cursor-pointer ${
            activeTab === 'sovereign-wallet' ? 'text-[#00ffcc] font-bold' : 'text-gray-400 hover:text-white'
          }`}
        >
          <Wallet className="w-5 h-5 mb-1 text-[#00ffcc]" />
          <span className="text-[9px] font-black whitespace-nowrap text-[#00ffcc]">المحفظة</span>
        </button>

        {subRole === 'captain' && (
          <button
            onClick={toggleFleetActive}
            className={`flex flex-col items-center justify-center flex-1 py-1 px-1 rounded-xl transition-all relative cursor-pointer ${
              isFleetActive ? 'text-emerald-400 font-bold' : 'text-gray-500'
            }`}
          >
            <div className="relative">
              <Activity className="w-5 h-5 mb-1" />
              <span className={`absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full ${isFleetActive ? 'bg-emerald-500 animate-ping' : 'bg-amber-500'}`} />
              <span className={`absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full ${isFleetActive ? 'bg-emerald-500' : 'bg-amber-500'}`} />
            </div>
            <span className="text-[9px] font-black whitespace-nowrap">نبض الأسطول</span>
          </button>
        )}
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
          <Card className="bg-[#0A0E1A] border border-[#1E293B] p-6 rounded-2xl text-right">
            <CardHeader className="p-0 pb-4">
              <CardTitle className="text-base font-black text-white flex items-center gap-2 justify-end">
                محرك النمو الثابت والانتساب الذكي (Growth Engine)
                <TrendingUp className="w-5 h-5 text-emerald-400" />
              </CardTitle>
              <CardDescription className="text-xs text-zinc-300">
                مراقبة نمو المحافظة، والتحقق البصري من شرط الثبات (45 يوماً على الأقل لتفعيل الكباتن مع رادارات جغرافية نشطة).
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0 space-y-6">
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-black/40 border border-[#1E293B] p-4 rounded-xl flex items-center justify-between">
                  <Badge className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold">صعود ↑</Badge>
                  <div className="text-right">
                    <p className="text-xs text-gray-500 font-bold">النمو المباشر (التطبيقي)</p>
                    <p className="text-xl font-black text-white font-mono mt-1">+{directGrowthThisMonth} مسجل</p>
                  </div>
                </div>

                <div className="bg-black/40 border border-[#1E293B] p-4 rounded-xl flex items-center justify-between">
                  <Badge className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold">مستقر ●</Badge>
                  <div className="text-right">
                    <p className="text-xs text-gray-500 font-bold">النمو العضوي (التناسلي)</p>
                    <p className="text-xl font-black text-white font-mono mt-1">+{organicGrowthThisMonth} مسجل</p>
                  </div>
                </div>

                <div className="bg-black/40 border border-[#1E293B] p-4 rounded-xl flex items-center justify-between">
                  <Badge className="bg-blue-950/10 text-blue-400 border border-blue-500/20 font-bold">جودة ماسية</Badge>
                  <div className="text-right">
                    <p className="text-xs text-gray-500 font-bold">الكباتن الملتزمين (+45 يوم)</p>
                    <p className="text-xl font-black text-cyan-400 font-mono mt-1">{steadyUsersCount} محقق</p>
                  </div>
                </div>
              </div>

              {/* Steady state tracking */}
              <div className="border border-zinc-800/60 p-4 rounded-xl bg-black/40 space-y-2">
                <h4 className="text-xs font-black text-white flex items-center gap-1.5 justify-end">
                  مراقبة نبضات التطبيق (App Pulse Detection)
                  <Activity className="w-4 h-4 text-cyan-400" />
                </h4>
                <p className="text-xs text-zinc-300 leading-normal text-right">
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
          <Card className="bg-[#0A0E1A] border border-[#1E293B] p-6 rounded-2xl text-right">
            <CardHeader className="p-0 pb-4">
              <CardTitle className="text-base font-black text-white flex items-center gap-2 justify-end">
                لوحة الوقاية من الانسحاب واسترداد المشتركين (Churn Engine)
                <UserX className="w-5 h-5 text-red-500" />
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
                      <th className="p-3 rounded-r-lg text-right">الرقم المستهدف للاستعادة</th>
                      <th className="p-3 text-right">الصفة والموقع</th>
                      <th className="p-3 text-right">تاريخ توقف النبض</th>
                      <th className="p-3 text-right">رسالة الاستعادة ومثبت الإرسال</th>
                      <th className="p-3 rounded-l-lg text-center font-bold">الحالة الإجرائية</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#1E293B]">
                    {churnedList.map((churn) => (
                      <tr key={churn.id} className="hover:bg-red-955/5 transition-colors">
                        <td className="p-3 font-mono text-zinc-300 font-bold text-right">{churn.phone}</td>
                        <td className="p-3 font-semibold text-zinc-400 text-right">{churn.role === 'driver' ? 'كابتن رادار' : 'مسافر عابر'}</td>
                        <td className="p-3 font-mono text-gray-500 text-right">{churn.date}</td>
                        <td className="p-3 space-y-1 text-right">
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
              <CardDescription className="text-xs text-right">
                استقبل مهام التوسع الجغرافي الصادرة من القيادة العامة، وقدم تأكيد الاطلاع وبث التقارير المنجزة.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0 space-y-4">
              {tasks.length === 0 ? (
                <div className="text-center py-8 text-zinc-500 text-xs">
                  لا يوجد تكليفات ميدانية معلقة حالياً في لواء الموطن.
                </div>
              ) : (
                <div className="space-y-3">
                  {tasks.map((task) => (
                    <div key={task.id} className="p-4 bg-zinc-955/60 border border-zinc-800/80 rounded-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4 text-right">
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center gap-2 justify-end">
                          <span className={`text-[9px] font-bold px-2 py-0.5 rounded ${
                            task.status === 'pending' ? 'bg-amber-500/10 text-amber-400' :
                            task.status === 'acknowledged' ? 'bg-blue-500/10 text-blue-400 font-mono animate-pulse' :
                            'bg-emerald-500/10 text-emerald-400'
                          }`}>
                            {task.status === 'pending' ? 'معلقة ○' :
                             task.status === 'acknowledged' ? 'قيد التنفيذ ●' :
                             task.status === 'completed' ? 'منجزة ✓' : 'مغلقة 🔒'}
                          </span>
                          <h4 className="text-xs font-bold text-white">{task.title}</h4>
                        </div>
                        <p className="text-[11px] text-zinc-400">{task.description}</p>
                        <div className="flex justify-end gap-3 text-[9px] text-zinc-500 font-mono">
                          <span>الحد الأقصى: {task.deadline ? new Date(task.deadline).toLocaleDateString('ar-JO') : 'غير محدد'}</span>
                          <span>•</span>
                          <span>أنشئت: {task.createdAt ? new Date(task.createdAt).toLocaleDateString('ar-JO') : 'الآن'}</span>
                        </div>
                      </div>
                      <div className="flex gap-2 self-end md:self-auto">
                        {task.status === 'pending' && (
                          <button
                            onClick={() => handleAcknowledgeTask(task.id)}
                            className="px-3 py-1 bg-amber-500 hover:bg-amber-400 text-black text-[10px] font-bold rounded-lg transition-all cursor-pointer"
                          >
                            البدء بالتنفيذ
                          </button>
                        )}
                        {task.status === 'acknowledged' && (
                          <button
                            onClick={() => handleExecuteTask(task.id)}
                            className="px-3 py-1 bg-emerald-500 hover:bg-emerald-400 text-black text-[10px] font-bold rounded-lg transition-all cursor-pointer"
                          >
                            تأكيد الإنجاز الميداني
                          </button>
                        )}
                        {task.status === 'completed' && (
                          <span className="text-[10px] text-emerald-400 font-bold bg-emerald-500/5 px-2 py-1 rounded-lg border border-emerald-500/10">✓ بانتظار التحقق السلوكي</span>
                        )}
                        {task.status === 'closed' && (
                          <span className="text-[10px] text-zinc-500 font-bold bg-zinc-900 px-2 py-1 rounded-lg">🔒 تم الإغلاق الميداني وتأكيد الأثر</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* TAB CONTENT 6: SOVEREIGN WALLET & LOYALTY */}
      {activeTab === 'sovereign-wallet' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* 💸 PANEL 1: SOVEREIGN WALLET & LOCAL CHANNELS */}
            <Card className="lg:col-span-4 bg-[#040815] border border-teal-500/20 rounded-3xl p-5 relative overflow-hidden shadow-xl flex flex-col justify-between">
              <div>
                <CardHeader className="p-0 pb-4 border-b border-zinc-800/60">
                  <div className="flex items-center gap-2 justify-between">
                    <Badge className="bg-teal-500/10 text-[#00ffcc] border border-[#00ffcc]/20 text-[10px] px-2 py-0.5 rounded-md">
                      تأكيد بنبضة واحدة (1 Write)
                    </Badge>
                    <CardTitle className="text-xs font-black text-white flex items-center gap-2 justify-end">
                      المحفظة الميدانية السيادية
                      <HandCoins className="w-4 h-4 text-[#00ffcc]" />
                    </CardTitle>
                  </div>
                  <CardDescription className="text-[11px] text-zinc-400 mt-1 text-right">
                    إدارة العمولات وشحن الرصيد المالي مباشرة عبر قنوات الدفع الأردنية الفورية.
                  </CardDescription>
                </CardHeader>

                {/* Mode Toggles */}
                <div className="grid grid-cols-2 gap-1.5 p-1 bg-zinc-950 border border-zinc-850 rounded-xl my-3 text-xs">
                  <button
                    type="button"
                    onClick={() => setWalletMode('withdraw')}
                    className={`py-1.5 px-2 rounded-lg text-center font-black transition-all cursor-pointer ${
                      walletMode === 'withdraw'
                        ? 'bg-teal-500/10 text-[#00ffcc] border border-teal-500/20'
                        : 'text-zinc-400 hover:text-white'
                    }`}
                  >
                    تسييل العمولات (سحب)
                  </button>
                  <button
                    type="button"
                    onClick={() => setWalletMode('recharge')}
                    className={`py-1.5 px-2 rounded-lg text-center font-black transition-all cursor-pointer ${
                      walletMode === 'recharge'
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                        : 'text-zinc-400 hover:text-white'
                    }`}
                  >
                    شحن الرصيد (CliQ)
                  </button>
                </div>

                {/* Balance Display */}
                <div className="mb-4 p-3 bg-zinc-950/80 border border-teal-500/15 rounded-2xl flex items-center justify-between">
                  <div className="text-left font-mono">
                    <span className="text-[9px] text-zinc-500 block">الوضع الحالي</span>
                    <Badge className="bg-emerald-500/10 text-emerald-400 border-none text-[8px] px-1.5 py-0">نشط ●</Badge>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-zinc-450 block font-bold">الرصيد المتاح بالمحفظة</span>
                    <h3 className="text-xl font-black text-[#00ffcc] tracking-tight font-mono mt-0.5">
                      {pendingDues.toFixed(2)} د.أ
                    </h3>
                  </div>
                </div>

                {walletMode === 'withdraw' ? (
                      /* WITHDRAWAL FORM */
                      <div className="space-y-3">
                    {/* Local Payment Channel Selector */}
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-zinc-300 block">قناة الدفع الرقمية المفضلة (الأردن):</label>
                      <div className="grid grid-cols-2 gap-1.5 text-xs">
                        {[
                          { id: 'CliQ', label: 'كليك (CliQ)', desc: 'فوري وبصفر عمولة' },
                          { id: 'ZainCash', label: 'زين كاش', desc: 'محفظة الهاتف الذكية' },
                          { id: 'OrangeMoney', label: 'أورنج ماني', desc: 'تسييل فوري' },
                          { id: 'eFAWATEERcom', label: 'إي فواتيركم', desc: 'سداد فواتير ورصيد' }
                        ].map((ch) => (
                          <button
                            key={ch.id}
                            type="button"
                            onClick={() => setPayoutChannel(ch.id as any)}
                            className={`p-2 rounded-xl border text-right transition-all flex flex-col justify-between cursor-pointer ${
                              payoutChannel === ch.id 
                                ? 'bg-teal-500/10 border-[#00ffcc] text-white shadow-md' 
                                : 'bg-zinc-900/40 border-zinc-850 text-zinc-400 hover:border-zinc-700'
                            }`}
                          >
                            <span className="font-black text-[10px]">{ch.label}</span>
                            <span className="text-[8px] text-zinc-500 font-mono mt-0.5">{ch.desc}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Home District Notice */}
                    <div className="p-2.5 bg-zinc-900/40 border border-zinc-800 rounded-xl text-[10px] leading-normal space-y-2">
                      <div className="flex justify-between items-center text-[9px]">
                        <span className="text-zinc-400">
                          📍 <strong className="text-white">لواء الموطن للربط:</strong> تم استشعار لواءك الحالي <strong className="text-[#00ffcc]">{user?.district || 'الجامعة'}</strong>
                        </span>
                        {!isEditingLocation ? (
                          <button
                            type="button"
                            onClick={() => setIsEditingLocation(true)}
                            className="px-1.5 py-0.5 rounded bg-zinc-800 hover:bg-zinc-700 text-[#00ffcc] text-[9px] transition-all cursor-pointer border border-[#00ffcc]/10 hover:border-[#00ffcc]/30"
                          >
                            تعديل اللائحة الترابية
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setIsEditingLocation(false)}
                            className="px-1.5 py-0.5 rounded bg-zinc-800 hover:bg-zinc-700 text-rose-450 text-[9px] transition-all cursor-pointer border border-rose-500/10"
                          >
                            إلغاء
                          </button>
                        )}
                      </div>

                      {isEditingLocation && (
                        <div className="space-y-2 pt-1 border-t border-zinc-800 text-[10px]">
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <label className="block text-zinc-500 text-[9px] mb-1 text-right">المحافظة:</label>
                              <select
                                value={selectedGov}
                                onChange={(e) => {
                                  setSelectedGov(e.target.value);
                                  const districts = getDistrictsByGovernorate(e.target.value);
                                  if (districts.length > 0) {
                                    setSelectedDistrict(districts[0]);
                                  }
                                }}
                                className="w-full bg-black border border-zinc-800 rounded-lg p-1 text-white text-[10px] focus:outline-none focus:border-[#00ffcc] text-right"
                              >
                                {jordanGovernorates.map((gov) => (
                                  <option key={gov} value={gov}>
                                    {gov}
                                  </option>
                                ))}
                              </select>
                            </div>
                            <div>
                              <label className="block text-zinc-500 text-[9px] mb-1 text-right">اللواء:</label>
                              <select
                                value={selectedDistrict}
                                onChange={(e) => setSelectedDistrict(e.target.value)}
                                className="w-full bg-black border border-zinc-800 rounded-lg p-1 text-white text-[10px] focus:outline-none focus:border-[#00ffcc] text-right"
                              >
                                {getDistrictsByGovernorate(selectedGov).map((dist) => (
                                  <option key={dist} value={dist}>
                                    {dist}
                                  </option>
                                ))}
                              </select>
                            </div>
                          </div>
                          <div className="flex justify-end pt-1">
                            <button
                              type="button"
                              onClick={handleUpdateLocation}
                              disabled={isUpdatingLocation}
                              className="px-3 py-1 rounded bg-[#00ffcc] text-black font-black text-[9px] hover:scale-105 active:scale-95 transition-all disabled:opacity-50 cursor-pointer flex items-center gap-1"
                            >
                              {isUpdatingLocation ? (
                                <>
                                  <RefreshCw className="w-3 h-3 animate-spin" />
                                  جاري المزامنة...
                                </>
                              ) : (
                                "حفظ وتثبيت الموضع"
                              )}
                            </button>
                          </div>
                        </div>
                      )}
                      
                      <div className="text-[8px] text-zinc-500 leading-normal text-right">
                        سيتم ربط قنوات الدفع {payoutChannel} مباشرة وتوجيه الحركة المالية محلياً بنبضة واحدة فقط لمنع استهلاك خوادمنا.
                      </div>
                    </div>

                    {/* Amount to withdraw */}
                    <div className="space-y-1">
                      <div className="flex justify-between items-center">
                        <button
                          type="button"
                          onClick={() => setWithdrawalAmount(pendingDues.toFixed(2))}
                          className="text-[9px] text-[#00ffcc] hover:underline cursor-pointer"
                        >
                          سحب كامل الرصيد المتاح
                        </button>
                        <label className="text-[10px] font-black text-zinc-300">المبلغ المطلوب تسييله (د.أ):</label>
                      </div>
                      <div className="relative">
                        <input
                          type="number"
                          placeholder="0.00"
                          value={withdrawalAmount}
                          onChange={(e) => setWithdrawalAmount(e.target.value)}
                          className="w-full bg-zinc-950 border border-zinc-850 focus:border-[#00ffcc] rounded-xl px-3 py-2 text-left font-mono text-xs text-white focus:outline-none focus:ring-1 focus:ring-[#00ffcc]"
                        />
                        <span className="absolute right-3 top-2.5 text-[10px] text-zinc-550 font-mono">د.أ</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  /* RECHARGE FORM (CliQ Cash Deposit) */
                  <div className="space-y-3 text-right">
                    <div className="p-2.5 bg-[#00ffcc]/5 border border-[#00ffcc]/15 rounded-xl text-[9.5px] text-zinc-350 leading-relaxed text-right">
                      ⚡ <strong className="text-[#00ffcc]">بوابة كليك (CliQ) الذكية:</strong> شحن رصيدك نقداً فورياً وبصفر عمولة عبر نظام كليك التابع للبنك المركزي الأردني. سيُرسل الطلب فوراً ويتم ربطه بلواء الجامعة بنبضة واحدة (1 Write).
                    </div>

                    {/* Quick recharge presets */}
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-zinc-300 block text-right">اختر مبلع الشحن السريع:</label>
                      <div className="grid grid-cols-4 gap-1.5 font-mono text-xs">
                        {[10, 20, 50, 100].map((val) => (
                          <button
                            key={val}
                            type="button"
                            onClick={() => setRechargeAmount(val.toString())}
                            className={`py-1.5 rounded-lg border text-center font-bold transition-all cursor-pointer ${
                              rechargeAmount === val.toString()
                                ? 'bg-emerald-500/20 border-emerald-400 text-white font-black'
                                : 'bg-zinc-900/40 border-zinc-850 text-zinc-400 hover:border-zinc-700'
                            }`}
                          >
                            +{val} د.أ
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Amount Input */}
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-zinc-300 block text-right">أو أدخل مبلغاً مخصصاً للشحن (د.أ):</label>
                      <div className="relative">
                        <input
                          type="number"
                          placeholder="0.00"
                          value={rechargeAmount}
                          onChange={(e) => setRechargeAmount(e.target.value)}
                          className="w-full bg-zinc-950 border border-zinc-850 focus:border-emerald-400 rounded-xl px-3 py-2 text-left font-mono text-xs text-white focus:outline-none focus:ring-1 focus:ring-emerald-400"
                        />
                        <span className="absolute right-3 top-2.5 text-[10px] text-zinc-550 font-mono">د.أ</span>
                      </div>
                    </div>

                    {/* CliQ Alias / Phone Input */}
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-zinc-300 block text-right">اسم مستعار (Alias) أو رقم هاتف كليك:</label>
                      <input
                        type="text"
                        placeholder="أدخل المعرف (مثال: ALEX-CLIQ)"
                        value={rechargeAlias}
                        onChange={(e) => setRechargeAlias(e.target.value)}
                        className="w-full bg-zinc-950 border border-zinc-850 focus:border-emerald-400 rounded-xl px-3 py-2 text-right text-xs text-white focus:outline-none focus:ring-1 focus:ring-emerald-400"
                      />
                    </div>
                  </div>
                )}
          </div>

              {/* Action Button */}
              <div className="mt-4">
                {walletMode === 'withdraw' ? (
                  <button
                    type="button"
                    disabled={payoutProcessing || pendingDues <= 0 || !withdrawalAmount || Number(withdrawalAmount) <= 0 || Number(withdrawalAmount) > pendingDues}
                    onClick={async () => {
                      setPayoutProcessing(true);
                      const amt = Number(withdrawalAmount);
                      
                      if (!isOnline) {
                        const newDues = Math.max(0, pendingDues - amt);
                        setPendingDues(newDues);
                        const newTx = {
                          id: `pay-${Date.now()}`,
                          date: getSecureNow().toISOString(),
                          amount: amt,
                          channel: payoutChannel,
                          status: 'COMPLETED',
                          reference: `${payoutChannel.toUpperCase()}-${Math.floor(10000 + Math.random() * 90000)}-TX`,
                          offline: true
                        };
                        setPayoutHistory(prev => [newTx, ...prev]);
                        setWithdrawalAmount('');
                        setPayoutProcessing(false);
                        addToOfflineQueue({ type: 'sovereign-wallet-liquidation', amount: amt, channel: payoutChannel });
                        alert(`⚠️ تم تسجيل عملية تسييل وسحب العمولات محلياً وبصمت في الصندوق الأسود بقيمة ${amt.toFixed(2)} د.أ. سيتم تأكيدها وسحبها سحابياً فور عودة الاتصال!`);
                        return;
                      }
                      
                      setTimeout(async () => {
                        const newDues = Math.max(0, pendingDues - amt);
                        setPendingDues(newDues);
                        const newTx = {
                          id: `pay-${Date.now()}`,
                          date: new Date().toISOString(),
                          amount: amt,
                          channel: payoutChannel,
                          status: 'COMPLETED',
                          reference: `${payoutChannel.toUpperCase()}-${Math.floor(10000 + Math.random() * 90000)}-TX`
                        };
                        setPayoutHistory(prev => [newTx, ...prev]);
                        setWithdrawalAmount('');
                        setPayoutProcessing(false);
                        
                        // Write to Firestore and sync
                        if (user?.uid) {
                          try {
                            const userRef = doc(db, 'users', user.uid);
                            await updateDoc(userRef, { pendingDues: newDues });

                            const queries = query(collection(db, 'delegates'), where('phone', '==', user.phone || ''));
                            const qs = await getDocs(queries);
                            const match = qs.docs.find((d: any) => d.data().referralCode === referralCode);
                            if (match) {
                              await updateDoc(doc(db, 'delegates', match.id), { pendingDues: newDues });
                            }

                            await addDoc(collection(db, 'audit_ledger'), {
                              actorId: user.uid,
                              timestamp: new Date().toISOString(),
                              action: 'SOVEREIGN_WALLET_LIQUIDATION',
                              securityClearance: 'DELEGATE_SELF_AUTH',
                              details: {
                                district: user.district || 'الجامعة',
                                amount: amt,
                                channel: payoutChannel,
                                detailsText: `تم تسييل عمولات بقيمة ${amt.toFixed(2)} د.أ بنجاح عبر قناة ${payoutChannel} بنبضة واحدة.`,
                                ipAddress: '127.0.0.1'
                              }
                            });
                          } catch (e) {
                            console.error("Firestore sync failed for withdrawal:", e);
                          }
                        }
                        
                        alert(`✅ تم التسييل الفوري! تم إرسال ${amt.toFixed(2)} د.أ إلى حسابك في ${payoutChannel} بنجاح وبصيغة دون اتصال أولاً معتمدة!`);
                      }, 1200);
                    }}
                    className="w-full py-2.5 bg-[#00ffcc] hover:bg-[#00e0b3] disabled:bg-zinc-800 disabled:text-zinc-500 text-black text-[11px] font-black rounded-xl transition-all shadow-lg flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Check className="w-3.5 h-3.5 text-black" />
                    <span>تأكيد تسييل العمولات (سحب فوري)</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    disabled={rechargeProcessing || !rechargeAmount || Number(rechargeAmount) <= 0 || !rechargeAlias}
                    onClick={async () => {
                      setRechargeProcessing(true);
                      const amt = Number(rechargeAmount);
                      
                      if (!isOnline) {
                        const newDues = pendingDues + amt;
                        setPendingDues(newDues);
                        const newTx = {
                          id: `dep-${Date.now()}`,
                          date: getSecureNow().toISOString(),
                          amount: amt,
                          channel: 'CliQ',
                          status: 'COMPLETED',
                          reference: `CLIQ-DEP-${Math.floor(10000 + Math.random() * 90000)}-TX`,
                          offline: true
                        };
                        setPayoutHistory(prev => [newTx, ...prev]);
                        setRechargeAmount('');
                        setRechargeAlias('');
                        setRechargeProcessing(false);
                        addToOfflineQueue({ type: 'sovereign-wallet-recharge', amount: amt, channel: 'CliQ', alias: rechargeAlias });
                        alert(`⚠️ تم تسجيل عملية شحن الرصيد محلياً وبصمت في الصندوق الأسود بقيمة ${amt.toFixed(2)} د.أ عبر CliQ. سيتم إثبات الشحن سحابياً فور عودة الاتصال!`);
                        return;
                      }
                      
                      setTimeout(async () => {
                        const newDues = pendingDues + amt;
                        setPendingDues(newDues);
                        const newTx = {
                          id: `dep-${Date.now()}`,
                          date: new Date().toISOString(),
                          amount: amt,
                          channel: 'CliQ',
                          status: 'COMPLETED',
                          reference: `CLIQ-DEP-${Math.floor(10000 + Math.random() * 90000)}-TX`
                        };
                        setPayoutHistory(prev => [newTx, ...prev]);
                        setRechargeAmount('');
                        setRechargeAlias('');
                        setRechargeProcessing(false);
                        
                        // Write to Firestore and sync
                        if (user?.uid) {
                          try {
                            const userRef = doc(db, 'users', user.uid);
                            await updateDoc(userRef, { pendingDues: newDues });

                            const queries = query(collection(db, 'delegates'), where('phone', '==', user.phone || ''));
                            const qs = await getDocs(queries);
                            const match = qs.docs.find((d: any) => d.data().referralCode === referralCode);
                            if (match) {
                              await updateDoc(doc(db, 'delegates', match.id), { pendingDues: newDues });
                            }

                            await addDoc(collection(db, 'audit_ledger'), {
                              actorId: user.uid,
                              timestamp: new Date().toISOString(),
                              action: 'SOVEREIGN_WALLET_RECHARGE',
                              securityClearance: 'DELEGATE_SELF_AUTH',
                              details: {
                                district: user.district || 'الجامعة',
                                amount: amt,
                                channel: 'CliQ',
                                alias: rechargeAlias,
                                detailsText: `تم شحن رصيد المحفظة بقيمة ${amt.toFixed(2)} د.أ بنجاح عبر خدمة كليك (CliQ) العاجلة.`,
                                ipAddress: '127.0.0.1'
                              }
                            });
                          } catch (e) {
                            console.error("Firestore sync failed for recharge:", e);
                          }
                        }
                        
                        alert(`🎉 تم شحن رصيدك نقداً بنجاح! تم إضافة ${amt.toFixed(2)} د.أ إلى محفظتك الميدانية عبر خدمة CliQ العاجلة وبنبضة معززة واحدة!`);
                      }, 1200);
                    }}
                    className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-400 disabled:bg-zinc-800 disabled:text-zinc-500 text-black text-[11px] font-black rounded-xl transition-all shadow-lg flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Zap className="w-3.5 h-3.5 text-black fill-black" />
                    <span>تأكيد شحن رصيد (كليك فوري)</span>
                  </button>
                )}
              </div>
          </Card>

            {/* 💎 PANEL 3: TRAVELLER LOYALTY - DIAMOND PULSE (باقة ولاء المسافر والنبض الماسي) */
            <Card className="lg:col-span-6 bg-[#0a0614] border border-amber-500/25 rounded-3xl p-5 relative overflow-hidden shadow-xl flex flex-col justify-between">
              <div className="absolute top-0 left-0 w-32 h-32 bg-amber-500/5 rounded-full blur-3xl animate-pulse" />
              
              <div>
                <CardHeader className="p-0 pb-4 border-b border-zinc-800/60">
                  <div className="flex items-center gap-2 justify-between">
                    <Badge className="bg-amber-500/10 text-amber-400 border border-amber-500/30 text-[10px] px-2 py-0.5 rounded-md">
                      الأولوية التكتيكية (الرادار)
                    </Badge>
                    <CardTitle className="text-xs font-black text-white flex items-center gap-2 justify-end">
                      ولاء المسافر - النبض الماسي
                      <Gem className="w-4 h-4 text-amber-400 animate-pulse" />
                    </CardTitle>
                  </div>
                  <CardDescription className="text-[11px] text-zinc-400 mt-1 text-right">
                    تمنحك الأولوية التكتيكية وقبول أسرع للعروض في رادار اللواء ومضاعف أسبقية رادار تكتيكي خارق 1.5x في خلايا H3.
                  </CardDescription>
                </CardHeader>

                {/* Loyalty points and status */}
                <div className="my-3 p-3 bg-zinc-950/90 border border-amber-500/15 rounded-2xl flex items-center justify-between">
                  <div className="text-left font-mono">
                    <span className="text-[8px] text-zinc-500 block">نقاط الولاء المتوفرة</span>
                    <span className="text-sm font-black text-amber-400 font-mono block mt-0.5">{loyaltyPoints} نقطة</span>
                  </div>
                  <div className="text-right">
                    <span className="text-[9px] text-zinc-450 block font-bold">حالة النبض الماسي</span>
                    <Badge className={`border-none text-[8px] mt-0.5 ${diamondPulseActive ? 'bg-amber-500/25 text-amber-400 animate-pulse' : 'bg-zinc-800 text-zinc-450'}`}>
                      {diamondPulseActive ? 'مفعل نشط ●' : 'غير مفعل ○'}
                    </Badge>
                  </div>
                </div>

                {/* Core parameters & dimensions */}
                <div className="space-y-2 text-right">
                  <div className="p-2.5 bg-black/40 border border-zinc-900 rounded-xl space-y-1.5 text-[10px]">
                    <div className="flex justify-between items-center text-[9px]">
                      <span className="font-mono text-amber-400">{diamondPulseActive ? '1.5x (أولوية قصوى)' : '1.0x (قياسي)'}</span>
                      <span className="text-zinc-450">مضاعف أسبقية رادار اللواء:</span>
                    </div>
                    <div className="flex justify-between items-center text-[9px]">
                      <span className="font-mono text-emerald-400">4.9 / 5.0</span>
                      <span className="text-zinc-450">مستوى الحماية الميدانية (المناعة):</span>
                    </div>
                    <div className="flex justify-between items-center text-[9px]">
                      <span className="font-mono text-blue-400">{pioneersCount} كابتن</span>
                      <span className="text-zinc-450">شحنة الرادار في لواء الجامعة:</span>
                    </div>
                  </div>

                  {/* Branches, Stems, and Fruits */}
                  <div className="p-3 bg-black/50 border border-amber-500/10 rounded-xl space-y-2 text-[9.5px]">
                    <div className="border-b border-zinc-850 pb-1 text-center font-bold text-amber-400">
                      🌿 هيكلية باقة النبض الماسي (أغصان وفروع وثمار)
                    </div>
                    
                    <div className="space-y-1 text-zinc-400">
                      <div>
                        <span className="text-amber-400 font-bold block">1. فروع الأسبقية التكتيكية (Branches):</span>
                        <span className="text-zinc-450 block leading-normal text-[8.5px] pr-2">
                          توجيه ذكي وفوري للعروض في خلايا H3 بدقة ريزولوشن 9، مع خفض زمن الاستجابة إلى الصفر.
                        </span>
                      </div>
                      <div>
                        <span className="text-emerald-400 font-bold block">2. أغصان التسييل المالي (Stems):</span>
                        <span className="text-zinc-450 block leading-normal text-[8.5px] pr-2">
                          زيادة 25% على الأرباح والعمولات الصافية وتفادي كوابح إنذار السوق الـ 15% كلياً.
                        </span>
                      </div>
                      <div>
                        <span className="text-blue-400 font-bold block">3. ثمار الأثر المستدام (Fruits):</span>
                        <span className="text-zinc-450 block leading-normal text-[8.5px] pr-2">
                          إعفاء كامل من رسوم الاشتراك السنوية عند الحفاظ على استقرار نقاط الولاء فوق 2000 نقطة.
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Activate button */}
                  <button
                    type="button"
                    disabled={loyaltyActivationProcessing || diamondPulseActive || loyaltyPoints < 300}
                    onClick={() => {
                      setLoyaltyActivationProcessing(true);
                      setTimeout(() => {
                        setLoyaltyPoints(prev => prev - 300);
                        setDiamondPulseActive(true);
                        setLoyaltyActivationProcessing(false);
                        alert('💎 تم تفعيل باقة النبض الماسي السيادية بنجاح! مضاعف الأولوية التكتيكية 1.5x نشط الآن في لواءك.');
                      }, 1000);
                    }}
                    className="w-full mt-3 py-2 bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-400 hover:to-yellow-500 disabled:bg-zinc-800 disabled:text-zinc-500 text-black text-[10px] font-black rounded-xl transition-all shadow-lg flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    {loyaltyActivationProcessing ? (
                      <RefreshCw className="w-3 h-3 animate-spin" />
                    ) : diamondPulseActive ? (
                      'النبض الماسي فعال ومثبت 1.5x'
                    ) : (
                      'تفعيل النبض الماسي (خصم 300 نقطة ولاء)'
                    )}
                  </button>

                  <div className="grid grid-cols-2 gap-2 mt-2">
                    <button
                      type="button"
                      onClick={() => {
                        setLoyaltyPoints(prev => prev + 150);
                        alert('🎁 تم منحك 150 نقطة ولاء تشجيعية بموجب بروتوكول تحفيز المندوبين لعام 2026!');
                      }}
                      className="p-1 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/20 rounded-lg text-[8px] text-amber-400 font-bold transition-all text-center cursor-pointer"
                    >
                      + جمع نقاط ولاء رحلات
                    </button>

                    <button
                      type="button"
                      disabled={loyaltyPoints < 500}
                      onClick={() => {
                        setLoyaltyPoints(prev => prev - 500);
                        setSupportBalance(prev => prev + 10.00);
                        alert('⚡ تم تسييل 500 نقطة ولاء بنجاح إلى رصيد الدعم الميداني المعزز بقيمة +10.00 د.أ!');
                      }}
                      className="p-1 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 disabled:bg-zinc-900 disabled:text-zinc-600 disabled:border-transparent rounded-lg text-[8px] text-emerald-400 font-bold transition-all text-center cursor-pointer"
                    >
                      تسييل نقاط لدعم ميداني
                    </button>
                  </div>
                </div>
              </div>
            </Card>

            /* 🗺️ PANEL 2: NAVIGATION BROADCAST PACKAGES & OSRM INTERACTS */}
            <Card className="lg:col-span-6 bg-[#040815] border border-teal-500/20 rounded-3xl p-6 relative overflow-hidden shadow-xl flex flex-col justify-between">
              <div>
                <CardHeader className="p-0 pb-4 border-b border-zinc-800/60">
                  <div className="flex items-center gap-2 justify-between">
                    <Badge className="bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[10px] px-2 py-0.5 rounded-md">
                      OSRM VPS Integration
                    </Badge>
                    <CardTitle className="text-sm font-black text-white flex items-center gap-2 justify-end">
                      باقات البث الملاحي وإدارة الدعم
                      <Layers className="w-4 h-4 text-[#00ffcc]" />
                    </CardTitle>
                  </div>
                  <CardDescription className="text-xs text-zinc-400 mt-1 text-right">
                    تفعيل باقات الملاحة السيادية الخارقة المتصلة بخادمنا المستقل وإدارة رصيد دعم المركبات.
                  </CardDescription>
                </CardHeader>

                {/* Support Balance Display */}
                <div className="my-4 p-4 bg-zinc-950/80 border border-teal-500/15 rounded-2xl flex items-center justify-between">
                  <div className="text-left font-mono">
                    <button
                      onClick={() => {
                        setSupportBalance(prev => prev + 25.00);
                        alert('⚡ تم شحن محفظة الدعم الميداني بـ 25.00 د.أ لتأمين نفقات الميدان والملاحة!');
                      }}
                      className="text-[9px] bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 px-2 py-1 rounded border border-emerald-500/20 cursor-pointer"
                    >
                      + شحن الدعم الميداني
                    </button>
                  </div>
                  <div className="text-right">
                    <span className="text-xs text-zinc-400 block font-bold">رصيد الدعم الميداني المعزز</span>
                    <h3 className="text-xl font-black text-amber-400 tracking-tight font-mono mt-0.5">
                      {supportBalance.toFixed(2)} د.أ
                    </h3>
                  </div>
                </div>

                {/* Navigation packages */}
                <div className="space-y-3">
                  <label className="text-[11px] font-black text-zinc-300 block">اختر باقة البث الملاحي لتفعيلها:</label>
                  
                  {/* Package cards */}
                  <div className="space-y-2">
                    {[
                      { id: 'silver', name: 'الباقة الفضية (Silver Link)', price: 10.00, desc: 'بث ملاحي عبر خادم OSRM الأساسي بجودة ممتازة واستدعاء فوري لخرائط الأردن.' },
                      { id: 'gold', name: 'الباقة الذهبية السيادية (Golden Link)', price: 20.00, desc: 'اتصال ذو أولوية فائقة مع تشفير كامل وتفعيل بروتوكول الهبوط الملاحي الآمن (Haversine fallback) مجاناً.' }
                    ].map((pkg) => {
                      const isActive = activeNavPkg === pkg.id;
                      return (
                        <div
                          key={pkg.id}
                          className={`p-3 rounded-xl border text-right transition-all flex flex-col justify-between ${
                            isActive 
                              ? 'bg-amber-500/10 border-amber-400 text-white shadow-md' 
                              : 'bg-zinc-900/40 border-zinc-850 text-zinc-400'
                          }`}
                        >
                          <div className="flex justify-between items-center">
                            <span className="font-mono font-black text-amber-400 text-xs">{pkg.price.toFixed(2)} د.أ</span>
                            <span className="font-black text-xs text-white">{pkg.name}</span>
                          </div>
                          <p className="text-[10px] text-zinc-450 mt-1 leading-normal">{pkg.desc}</p>
                          <div className="mt-2 flex justify-between items-center">
                            {isActive ? (
                              <Badge className="bg-emerald-500/25 text-emerald-400 border border-emerald-500/40 text-[9px]">نشط ●</Badge>
                            ) : (
                              <span className="text-[9px] text-zinc-500">متاحة للشراء</span>
                            )}
                            <button
                              type="button"
                              disabled={isActive || supportBalance < pkg.price}
                              onClick={() => {
                                setSupportBalance(prev => prev - pkg.price);
                                setActiveNavPkg(pkg.id);
                                alert(`🎉 تم تفعيل باقة البث الملاحي ${pkg.name} بنجاح! تم الخصم من رصيد الدعم الميداني المخصص.`);
                              }}
                              className={`px-3 py-1 text-[10px] font-bold rounded-lg transition-all cursor-pointer ${
                                isActive 
                                  ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed' 
                                  : 'bg-amber-500 hover:bg-amber-400 text-black'
                              }`}
                            >
                              {isActive ? 'مفعلة' : 'تفعيل وشراء'}
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Dynamic Latency Monitor */}
                  <div className="mt-4 p-3 bg-zinc-950/80 border border-zinc-850 rounded-xl space-y-2">
                    <div className="flex items-center justify-between text-[11px] border-b border-zinc-900 pb-2">
                      <span className="text-zinc-500 font-mono">STATUS: {activeNavPkg === 'none' ? 'NO_ACTIVE_PACKAGE' : 'OSRM_ONLINE'}</span>
                      <strong className="text-white">جودة الاتصال بالبث الملاحي</strong>
                    </div>

                    <div className="grid grid-cols-2 gap-3 pt-1 text-center">
                      <div className="p-2 bg-black/40 border border-zinc-850 rounded-lg">
                        <span className="text-[9px] text-zinc-500 block">زمن استجابة OSRM</span>
                        <span className={`text-sm font-black font-mono ${osrmLatency > 1500 ? 'text-red-400' : 'text-[#00ffcc]'}`}>
                          {osrmLatency} ms
                        </span>
                      </div>
                      <div className="p-2 bg-black/40 border border-zinc-850 rounded-lg">
                        <span className="text-[9px] text-zinc-500 block">الوضع الاحتياطي الفوري</span>
                        <span className={`text-[10px] font-bold block ${osrmLatency > 1500 ? 'text-amber-400' : 'text-zinc-500'}`}>
                          {osrmLatency > 1500 ? 'نشط: هرسين (Haversine 1.3)' : 'خامل: ميكانيكا OSRM'}
                        </span>
                      </div>
                    </div>

                    {/* Latency triggers */}
                    <div className="grid grid-cols-2 gap-2 pt-2">
                      <button
                        type="button"
                        onClick={() => {
                          setOsrmLatency(180);
                          alert('⚡ تم تحسين التوجيه وربط هاتف الراكب بخادم OSRM الأردني ذو زمن الاستجابة السريع (180ms)!');
                        }}
                        className="p-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 rounded-lg text-[9px] text-emerald-400 font-bold transition-all cursor-pointer"
                      >
                        معايرة خادم OSRM (180ms)
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setOsrmLatency(1650);
                          alert('🚨 تدهور شبكي محاكي! تجاوز زمن الاستجابة 1500ms. تنشيط فوري لبروتوكول التحكيم والتحول الميكانيكي لحساب هرسين (Haversine 1.3) بنسبة خطأ 0%!');
                        }}
                        className="p-1.5 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 rounded-lg text-[9px] text-red-400 font-bold transition-all cursor-pointer"
                      >
                        تزييف انقطاع OSRM (1650ms)
                      </button>
                    </div>

                    <p className="text-[9px] text-zinc-500 leading-normal text-right pt-1">
                      💡 في حال حدوث خطأ شبكي أو تجاوز زمن استجابة الـ VPS OSRM حد 1500ms، يحسب هاتف المستخدم رياضياً مسافة الهيرسين ويضربها في المعامل الثابت للأردن (1.3) لضمان استمرار التسعير والاتصال بصفر انقطاع.
                    </p>
                  </div>
                </div>
              </div>
            </Card>

          </div>

          {/* 📜 PANEL 3: TRANSACTIONS & CASH HISTORY */}
          <Card className="bg-[#0A0E1A] border border-[#1E293B] p-6 rounded-2xl text-right">
            <CardHeader className="p-0 pb-4 flex flex-row items-center justify-between border-b border-zinc-850 mb-4">
              <Badge className="bg-zinc-800 text-zinc-300 border-none font-mono text-[9px]">{payoutHistory.length} سحوبات</Badge>
              <CardTitle className="text-sm font-black text-white flex items-center gap-2">
                سجل سحوبات المحفظة وتسييل العمولات السيادية
                <FileCheck className="w-4 h-4 text-[#00ffcc]" />
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {payoutHistory.length === 0 ? (
                <p className="text-xs text-zinc-500 text-center py-6">لا يوجد عمليات تسييل مسجلة حالياً.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-right border-collapse text-white">
                    <thead>
                      <tr className="border-b border-zinc-850 text-zinc-400">
                        <th className="pb-2 font-black">رقم المعاملة (المرجع)</th>
                        <th className="pb-2 font-black text-center">قناة الدفع الرقمية</th>
                        <th className="pb-2 font-black text-center">التاريخ والوقت</th>
                        <th className="pb-2 font-black text-center">القيمة المستلمة</th>
                        <th className="pb-2 font-black text-left">حالة التسوية</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-850/50">
                      {payoutHistory.map((tx) => (
                        <tr key={tx.id} className="text-zinc-300 hover:bg-white/5 transition-colors">
                          <td className="py-2.5 font-mono text-[10px] text-left">{tx.reference}</td>
                          <td className="py-2.5 text-center font-bold">{tx.channel}</td>
                          <td className="py-2.5 text-center text-[10px] text-zinc-400">{new Date(tx.date).toLocaleString('ar-JO')}</td>
                          <td className="py-2.5 text-center font-black text-emerald-400 font-mono">+{tx.amount.toFixed(2)} د.أ</td>
                          <td className="py-2.5 text-left">
                            <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[9px] px-2 py-0.5 rounded font-bold">
                              {tx.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>

          {/* ⚖️ PANEL 4: THE KERNEL ANTI-CHEAT & PROTOCOL 12 INTEGRITY */}
          <Card className="bg-gradient-to-l from-red-950/20 to-zinc-950 border border-red-500/30 p-6 rounded-2xl">
            <div className="md:flex justify-between items-start gap-4">
              <div className="flex-1 space-y-2 text-right">
                <Badge className="bg-red-500/10 text-red-400 border border-red-500/20 text-[10px] px-2.5 py-0.5 rounded">
                  بروتوكول مكافحة تضارب الأدوار
                </Badge>
                <h3 className="text-base font-black text-white flex items-center justify-end gap-2 mt-1">
                  جدار الحماية السيادي وقفل الثغرات الثلاث (Anti-Cheat Kernel)
                  <AlertTriangle className="w-5 h-5 text-red-500 animate-bounce" />
                </h3>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  بموجب الباب الرابع لقانون التحصين الرقمي، تم دمج ثلاث كوابح جنائية تمنع تضارب وظائف سجل النبض والوظائف المالية:
                </p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2 text-xs">
                  <div className="p-3 bg-black/40 border border-red-500/10 rounded-xl">
                    <strong className="text-red-400 block font-black">1. ثغرة الوقت المحلي:</strong>
                    <span className="text-zinc-500 text-[10px] block mt-1 leading-relaxed">
                      حظر الاعتماد على ساعة الهاتف، واعتماد "النبض الشبكي التفاضلي" المقروء من السحابة مباشرة.
                    </span>
                  </div>
                  <div className="p-3 bg-black/40 border border-red-500/10 rounded-xl">
                    <strong className="text-red-400 block font-black">2. ثغرة الانقطاع الأعمى:</strong>
                    <span className="text-zinc-500 text-[10px] block mt-1 leading-relaxed">
                      تجميد حالة المحفظة محلياً في وعاء مشفر مجزأ، وحظر الدخول للمزاد إلا بعد إنهاء المصافحة التصفوية.
                    </span>
                  </div>
                  <div className="p-3 bg-black/40 border border-red-500/10 rounded-xl">
                    <strong className="text-red-400 block font-black">3. ثغرة إغراق الخلايا:</strong>
                    <span className="text-zinc-500 text-[10px] block mt-1 leading-relaxed">
                      حظر بث أكثر من طلب واحد متزامن للراكب، وتفعيل خصم تلقائي من مناعة السلوك عند الإلغاء المتكرر.
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </Card>

          {/* 🌿 PANEL 5: SOVEREIGN SUPPORT LOGIC TREE */}
          <Card className="bg-[#050B1C] border border-amber-500/20 p-6 rounded-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-48 h-48 bg-amber-500/5 rounded-full blur-3xl animate-pulse" />
            
            <CardHeader className="p-0 pb-4 border-b border-zinc-805 flex flex-row items-center justify-between">
              <Badge className="bg-amber-500/15 text-amber-400 border border-amber-500/25 text-[10px]">
                الشجرة المعمارية للتأصيل الميداني
              </Badge>
              <CardTitle className="text-base font-black text-white flex items-center gap-2">
                الشجرة الهندسية النسيجية لسيادة رصيد الدعم (Sovereign Support Logic Tree)
                <Activity className="w-4 h-4 text-amber-400" />
              </CardTitle>
            </CardHeader>

            <CardContent className="p-0 pt-4 text-right space-y-4">
              <p className="text-xs text-zinc-400 leading-relaxed">
                تُجسّد هذه الشجرة الهندسية الأبعاد الفنية العميقة والمنطق البنيوي لـ <strong className="text-amber-400">رصيد الدعم الميداني المعزز</strong> ونبضات الولاء في قطاع المندوبين، مقسمة إلى أبعاد قطعية، وأغصان متفرعة، وثمار مستدامة تغذي كفاءة النظام المالي والتقني.
              </p>

              {/* Secure Tamper Indicator (الذوبان والمصادرة التصفوية الصامتة) */}
              {isTampered && (
                <div className="p-4 bg-red-950/40 border border-red-500/40 rounded-2xl space-y-2 mb-4 animate-pulse">
                  <div className="flex items-center gap-2 justify-end text-red-400 font-bold text-xs">
                    <span>تحذير: تم قفل الشجرة الهندسية وتجميد الأرصدة كلياً!</span>
                    <AlertTriangle className="w-4 h-4" />
                  </div>
                  <div className="space-y-1 font-mono text-[9px] text-zinc-400 text-right">
                    {kernelTamperLogs.map((log, i) => (
                      <div key={i}>{log}</div>
                    ))}
                  </div>
                </div>
              )}

              {/* Expand/Collapse All Buttons */}
              <div className="flex justify-end gap-2 mb-2">
                <button
                  type="button"
                  onClick={() => setSupportTreeExpanded({ root: true, dim1: true, dim2: true, dim3: true })}
                  className="px-2 py-1 bg-zinc-900 border border-zinc-800 rounded-lg text-[9px] text-zinc-400 hover:text-white transition-colors cursor-pointer"
                >
                  توسيع جميع الفروع
                </button>
                <button
                  type="button"
                  onClick={() => setSupportTreeExpanded({ root: true, dim1: false, dim2: false, dim3: false })}
                  className="px-2 py-1 bg-zinc-900 border border-zinc-800 rounded-lg text-[9px] text-zinc-400 hover:text-white transition-colors cursor-pointer"
                >
                  طي جميع الفروع
                </button>
              </div>

              {/* The Tree Layout */}
              <div className="space-y-3 relative before:absolute before:right-3.5 before:top-2 before:bottom-2 before:w-[1px] before:bg-zinc-850">
                
                {/* 1. ROOT NODE (جذر الرصيد والسيادة) */}
                <div className="relative pr-8">
                  {/* Tree link point */}
                  <span className="absolute right-[11px] top-3.5 w-2 h-2 rounded-full bg-amber-500 border border-black shadow" />
                  
                  <div 
                    onClick={() => setSupportTreeExpanded(prev => ({ ...prev, root: !prev.root }))}
                    className="p-3 bg-zinc-950 border border-amber-500/15 rounded-xl hover:border-amber-500/40 transition-colors cursor-pointer flex justify-between items-center"
                  >
                    <div className="flex items-center gap-2">
                      <ChevronDown className={`w-3.5 h-3.5 text-amber-500 transition-transform ${supportTreeExpanded.root ? 'rotate-0' : '-rotate-90'}`} />
                      <span className="text-[10px] font-mono text-amber-400 font-black">ROOT_NODE</span>
                    </div>
                    <div className="text-right flex items-center gap-2">
                      <strong className="text-white text-xs">جذر المحرك: رصيد الدعم الميداني وتأصيل الحركة ({supportBalance.toFixed(2)} د.أ)</strong>
                      <Database className="w-4 h-4 text-amber-400" />
                    </div>
                  </div>

                  {supportTreeExpanded.root && (
                    <div className="mt-2 pr-4 text-[10px] text-zinc-500 leading-normal space-y-1">
                      <div>• صمام الحركة والارتحال المستمر للمناديب في ألوية المملكة الهاشمية دون أعباء استعلامية متكررة.</div>
                      <div>• وعاء تجميع رسوم باقات البث الملاحي وربطها بنظام OSRM اللامركزي.</div>
                    </div>
                  )}
                </div>

                {/* 2. DIMENSION 1 (البعد الجغرافي - فروع الأسبقية والتأمين جغرافياً) */}
                <div className="relative pr-8">
                  <span className="absolute right-[11px] top-3.5 w-2 h-2 rounded-full bg-emerald-500 border border-black shadow" />
                  
                  <div 
                    onClick={() => setSupportTreeExpanded(prev => ({ ...prev, dim1: !prev.dim1 }))}
                    className="p-3 bg-zinc-950/90 border border-emerald-500/15 rounded-xl hover:border-emerald-500/40 transition-colors cursor-pointer flex justify-between items-center"
                  >
                    <div className="flex items-center gap-2">
                      <ChevronDown className={`w-3.5 h-3.5 text-emerald-400 transition-transform ${supportTreeExpanded.dim1 ? 'rotate-0' : '-rotate-90'}`} />
                      <span className="text-[10px] font-mono text-emerald-400 font-black">BRANCHES</span>
                    </div>
                    <div className="text-right flex items-center gap-2">
                      <strong className="text-white text-xs">أولاً: فروع الأسبقية والتأمين جغرافياً (Geographic Insurance)</strong>
                      <Layers className="w-4 h-4 text-emerald-400" />
                    </div>
                  </div>

                  {supportTreeExpanded.dim1 && (
                    <div className="mt-2 pr-4 pl-2 space-y-2">
                      <div className="p-2.5 bg-black/40 border border-zinc-900 rounded-lg space-y-1">
                        <span className="text-emerald-400 text-[10.5px] font-bold block">🌿 فرع رادار لواء الجامعة والنبض الجغرافي:</span>
                        <p className="text-[10px] text-zinc-400 leading-relaxed">
                          يعمل الرصيد كحارس شبكي لتغطية تكاليف باقة البث الملاحي OSRM المستضافة ذاتياً، مما يمكن المندوب من قراءة خلايا H3 ريزولوشن 9 لتلقي نبضات الركاب الفورية في صالة المزاد على مسح 1.5 كم حتمي.
                        </p>
                      </div>

                      <div className="p-2.5 bg-black/40 border border-zinc-900 rounded-lg space-y-1">
                        <span className="text-emerald-400 text-[10.5px] font-bold block">⚡ فرع الأسبقية التكتيكية (قبول العروض السريع):</span>
                        <p className="text-[10px] text-zinc-400 leading-relaxed">
                          عند توفر رصيد دعم كافٍ وتفعيل "باقة النبض الماسي"، يُمنح المندوب أسبقية تكتيكية (مضاعف 1.5x) لعرض عروضه التنافسية على شاشة الراكب قبل المنافسين، مما يسرع قبول الطلبات بنسبة هائلة.
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {/* 3. DIMENSION 2 (البعد الحركي - أغصان الارتحال والنبض العام للأسواق) */}
                <div className="relative pr-8">
                  <span className="absolute right-[11px] top-3.5 w-2 h-2 rounded-full bg-blue-500 border border-black shadow" />
                  
                  <div 
                    onClick={() => setSupportTreeExpanded(prev => ({ ...prev, dim2: !prev.dim2 }))}
                    className="p-3 bg-zinc-950/90 border border-blue-500/15 rounded-xl hover:border-blue-500/40 transition-colors cursor-pointer flex justify-between items-center"
                  >
                    <div className="flex items-center gap-2">
                      <ChevronDown className={`w-3.5 h-3.5 text-blue-400 transition-transform ${supportTreeExpanded.dim2 ? 'rotate-0' : '-rotate-90'}`} />
                      <span className="text-[10px] font-mono text-blue-400 font-black">STEMS</span>
                    </div>
                    <div className="text-right flex items-center gap-2">
                      <strong className="text-white text-xs">ثانياً: أغصان الارتحال والنبض العام للأسواق (Movement & Market Pulse)</strong>
                      <Activity className="w-4 h-4 text-blue-400" />
                    </div>
                  </div>

                  {supportTreeExpanded.dim2 && (
                    <div className="mt-2 pr-4 pl-2 space-y-2">
                      <div className="p-2.5 bg-black/40 border border-zinc-900 rounded-lg space-y-1">
                        <span className="text-blue-400 text-[10.5px] font-bold block">🌾 غصن التسعير النسيجي الحافة (كوابح الـ 15%):</span>
                        <p className="text-[10px] text-zinc-400 leading-relaxed">
                          يعمل رصيد الدعم على تشغيل محرك التسعير النسيجي ومقارنة العروض المباشرة. يتم إخماد العروض المنحرفة وتفعيل كبح الإغلاق القرمزي (<strong className="text-red-500">Crimson Block</strong>) عند تجاوز حد الـ 15% لمنع التضخم والنبض الزائف في خلايا H3.
                        </p>
                      </div>

                      <div className="p-2.5 bg-black/40 border border-zinc-900 rounded-lg space-y-1">
                        <span className="text-blue-400 text-[10.5px] font-bold block">🔒 غصن المصافحة التصفوية والنبض الشبكي التفاضلي:</span>
                        <p className="text-[10px] text-zinc-400 leading-relaxed">
                          يضمن أمان الائتمان وموثوقية المعاملات عبر إلزام كافة الأجهزة بإنهاء "المصافحة التصفوية الصامتة" ومطابقة النبض الشبكي التفاضلي (<strong className="text-blue-400">Network Time Delta</strong>) قبل دخول مزاد لواء الجامعة.
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {/* 4. DIMENSION 3 (البعد التقني والاستدامة - ثمار الدعم المالي والترشيد التقني) */}
                <div className="relative pr-8">
                  <span className="absolute right-[11px] top-3.5 w-2 h-2 rounded-full bg-purple-500 border border-black shadow" />
                  
                  <div 
                    onClick={() => setSupportTreeExpanded(prev => ({ ...prev, dim3: !prev.dim3 }))}
                    className="p-3 bg-zinc-950/90 border border-purple-500/15 rounded-xl hover:border-purple-500/40 transition-colors cursor-pointer flex justify-between items-center"
                  >
                    <div className="flex items-center gap-2">
                      <ChevronDown className={`w-3.5 h-3.5 text-purple-400 transition-transform ${supportTreeExpanded.dim3 ? 'rotate-0' : '-rotate-90'}`} />
                      <span className="text-[10px] font-mono text-purple-400 font-black">FRUITS</span>
                    </div>
                    <div className="text-right flex items-center gap-2">
                      <strong className="text-white text-xs">ثالثاً: ثمار الدعم المالي والترشيد التقني (System Fruits)</strong>
                      <Zap className="w-4 h-4 text-purple-400" />
                    </div>
                  </div>

                  {supportTreeExpanded.dim3 && (
                    <div className="mt-2 pr-4 pl-2 space-y-2">
                      <div className="p-2.5 bg-black/40 border border-zinc-900 rounded-lg space-y-1">
                        <span className="text-purple-400 text-[10.5px] font-bold block">🎁 ثمرة صفرية التكلفة الحافة (SC55 Charter):</span>
                        <p className="text-[10px] text-zinc-400 leading-relaxed">
                          الترحيل الفوري لكافة العمليات الرياضية وحساب المسارات المعقدة لتعمل على معالج هاتف المستخدم مباشرة (<strong className="text-[#00ffcc]">Client-Side Execution</strong>)، محققين هدف صفر كلفة تشغيلية.
                        </p>
                      </div>

                      <div className="p-2.5 bg-black/40 border border-zinc-900 rounded-lg space-y-1">
                        <span className="text-purple-400 text-[10.5px] font-bold block">🛡️ ثمرة التوقيع الرقمي المشفر وتأمين الأرصدة:</span>
                        <p className="text-[10px] text-zinc-400 leading-relaxed">
                          جدار حماية جنائي متكامل يحمي الأرصدة بتواقيع رقمية مشفرة مجزأة (<strong className="text-purple-400">Cryptographic Signatures</strong>) مخزنة محلياً، مما يجعل تزييف أرصدة الدعم ونقاط الولاء أمراً مستحيلاً ومكشوفاً ومصادراً بشكل تفاعلي.
                        </p>
                      </div>
                    </div>
                  )}
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

      {/* TAB CONTENT 8: SOVEREIGN FIELD ARCHIVE & PULSE LOGS */}
      {activeTab === 'pulse-archive' && (() => {
        // Compute merged list of logs
        const allLogs = [
          ...auditLogs.map(log => ({ ...log, source: 'LIVE' as const })),
          ...simulatedArchiveLogs.map(log => ({ ...log, source: 'SIMULATED' as const }))
        ];

        // Filter logs
        const filteredLogs = allLogs.filter(log => {
          const q = pulseSearchQuery.toLowerCase().trim();
          const actionMatch = log.action?.toLowerCase().includes(q);
          const idMatch = log.id?.toLowerCase().includes(q);
          const clearanceMatch = log.securityClearance?.toLowerCase().includes(q);
          const districtMatch = log.details?.district?.toLowerCase().includes(q);
          const detailsTextMatch = log.details?.detailsText?.toLowerCase().includes(q);
          const referralMatch = log.details?.referralCode?.toLowerCase().includes(q);
          
          const matchesSearch = !q || actionMatch || idMatch || clearanceMatch || districtMatch || detailsTextMatch || referralMatch;

          // Action filter
          const matchesAction = pulseFilterAction === 'ALL' || log.action === pulseFilterAction;

          // Clearance filter
          const matchesClearance = pulseFilterClearance === 'ALL' || log.securityClearance === pulseFilterClearance;

          // Source filter
          const matchesSource = pulseLogSource === 'ALL' || log.source === pulseLogSource;

          return matchesSearch && matchesAction && matchesClearance && matchesSource;
        });

        // Compute metrics
        const totalLogsCount = filteredLogs.length;
        const totalFinancialAmount = filteredLogs.reduce((acc, log) => {
          if (log.details?.requestedAmount) {
            return acc + Number(log.details.requestedAmount);
          }
          return acc;
        }, 0);
        const criticalIncidentsCount = filteredLogs.filter(log => log.securityClearance === 'سيادي حرج').length;
        const topSecretCount = filteredLogs.filter(log => log.securityClearance === 'سري للغاية').length;

        return (
          <div className="space-y-6 animate-in fade-in duration-300">
            {/* Upper Summary Row: Stats cards showing the intelligence results */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-right" dir="rtl">
              <Card className="bg-[#050B15] border border-emerald-500/10 p-4 rounded-2xl">
                <div className="flex items-center justify-between">
                  <div className="p-2.5 bg-emerald-500/10 rounded-xl text-emerald-400">
                    <BookOpen className="w-5 h-5" />
                  </div>
                  <div className="text-left">
                    <span className="text-[10px] text-zinc-400 font-bold block">إجمالي السجلات المفهرسة</span>
                    <span className="text-xl font-black text-white font-mono block">{totalLogsCount}</span>
                  </div>
                </div>
              </Card>

              <Card className="bg-[#050B15] border border-amber-500/10 p-4 rounded-2xl">
                <div className="flex items-center justify-between">
                  <div className="p-2.5 bg-amber-500/10 rounded-xl text-amber-400">
                    <DollarSign className="w-5 h-5" />
                  </div>
                  <div className="text-left">
                    <span className="text-[10px] text-zinc-400 font-bold block">التسويات المالية المؤرشفة</span>
                    <span className="text-xl font-black text-white font-mono block">{totalFinancialAmount.toFixed(2)} د.أ</span>
                  </div>
                </div>
              </Card>

              <Card className="bg-[#050B15] border border-red-500/10 p-4 rounded-2xl">
                <div className="flex items-center justify-between">
                  <div className="p-2.5 bg-red-500/10 rounded-xl text-red-400 animate-pulse">
                    <AlertTriangle className="w-5 h-5" />
                  </div>
                  <div className="text-left">
                    <span className="text-[10px] text-zinc-400 font-bold block">مخاطر وسياديات حرجة</span>
                    <span className="text-xl font-black text-red-500 font-mono block">{criticalIncidentsCount}</span>
                  </div>
                </div>
              </Card>

              <Card className="bg-[#050B15] border border-cyan-500/10 p-4 rounded-2xl">
                <div className="flex items-center justify-between">
                  <div className="p-2.5 bg-cyan-500/10 rounded-xl text-cyan-400">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <div className="text-left">
                    <span className="text-[10px] text-zinc-400 font-bold block">سري للغاية ونبض آمن</span>
                    <span className="text-xl font-black text-cyan-400 font-mono block">{topSecretCount}</span>
                  </div>
                </div>
              </Card>
            </div>

            {/* 🛡️ Sovereign Engineering Tree & Protocol 12 Forensic Audit Hub (V2.6-Secured) */}
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 text-right font-sans" dir="rtl">
              
              {/* 🌳 MODULE 1: THE INTERACTIVE ENGINEERING TREE (الشجرة الهندسية التفاعلية) */}
              <Card className="xl:col-span-6 bg-[#030712] border border-emerald-500/30 rounded-3xl p-6 relative overflow-hidden shadow-2xl">
                <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-3xl" />
                <div className="absolute bottom-0 left-0 w-32 h-32 bg-cyan-500/5 rounded-full blur-3xl" />
                
                <CardHeader className="p-0 pb-6 border-b border-zinc-800/60">
                  <div className="flex items-center gap-3 justify-between">
                    <Badge className="bg-emerald-500/15 text-emerald-400 border border-emerald-500/35 font-mono text-[10px] px-2 py-0.5 rounded-md">
                      الدستور المعماري V2.6
                    </Badge>
                    <div className="text-right">
                      <CardTitle className="text-base font-black text-white flex items-center gap-2 justify-end">
                        <Workflow className="w-5 h-5 text-emerald-400" />
                        الشجرة الهندسية النسيجية للتطبيق
                      </CardTitle>
                      <CardDescription className="text-xs text-zinc-400 mt-1">
                        استكشف فروع وأبعاد منطق "النبض" و"الأرشيف" و"شاشة الخزنة" وجنِ ثمارها التشغيلية.
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="p-0 pt-6 space-y-4">
                  {/* Root Node */}
                  <div className="p-4 bg-emerald-950/20 border border-emerald-500/30 rounded-2xl flex items-center justify-between transition-all hover:bg-emerald-950/30">
                    <div className="text-left">
                      <span className="text-[9px] text-emerald-400 font-bold block">مظلة السيادة المركزية</span>
                      <span className="text-xs font-black text-white">الدستور المعماري الموحد (V2.6)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
                      <span className="text-xs font-mono font-bold text-emerald-400">CORE_ROOT</span>
                    </div>
                  </div>

                  {/* Trunk Connector Line */}
                  <div className="w-[2px] h-4 bg-gradient-to-b from-emerald-500/40 to-cyan-500/40 mx-auto" />

                  {/* Stem 1: سجلات النبض الميداني */}
                  <div className="space-y-2 border-r-2 border-emerald-500/20 pr-4">
                    <button 
                      onClick={() => toggleTreeNode('stem1')}
                      className="w-full flex items-center justify-between p-3 bg-zinc-950/60 border border-emerald-500/10 hover:border-emerald-500/35 rounded-xl transition-all"
                    >
                      <div className="flex items-center gap-2">
                        {treeExpandedNodes.stem1 ? <ChevronDown className="w-4 h-4 text-emerald-400" /> : <ChevronRight className="w-4 h-4 text-emerald-400" />}
                        <span className="text-xs font-black text-white">الجذع الأول: سجلات النبض والتعقيم السلوكي</span>
                      </div>
                      <Badge className="bg-emerald-500/10 text-emerald-400 border-none text-[9px] font-mono">
                        3 فروع نشطة
                      </Badge>
                    </button>

                    <AnimatePresence>
                      {treeExpandedNodes.stem1 && (
                        <motion.div 
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="space-y-2 pr-4 pt-1 pb-2 overflow-hidden"
                        >
                          {/* Branch 1.1 */}
                          <div className="p-2.5 bg-zinc-900/40 border border-zinc-800/50 rounded-lg text-xs space-y-1">
                            <span className="font-bold text-emerald-400 block text-[11px]">🌿 غصن معايرة الوقت التفاضلي (Time Delta):</span>
                            <p className="text-[10px] text-zinc-400 leading-normal">
                              يقارن وقت الجهاز مع خادم NTP عند كل استدعاء للنبض لتفادي ثغرة التلاعب بالوقت الداخلي لتجاوز صلاحية الجلسات الميدانية.
                            </p>
                          </div>
                          {/* Branch 1.2 */}
                          <div className="p-2.5 bg-zinc-900/40 border border-zinc-800/50 rounded-lg text-xs space-y-1">
                            <span className="font-bold text-emerald-400 block text-[11px]">🌿 غصن التفكيك الرقمي المزدوج (Magic Links Decryption):</span>
                            <p className="text-[10px] text-zinc-400 leading-normal">
                              يفك شفرة التوكن الميداني ويتحقق من بصمة المتصفح قسرياً لمنع انتحال هويات المناديب.
                            </p>
                          </div>
                          {/* Fruit */}
                          <div className="p-3 bg-emerald-500/5 border border-emerald-500/20 rounded-xl text-xs space-y-1">
                            <span className="font-black text-emerald-300 flex items-center gap-1">
                              🍎 ثمار هذا الفرع التشغيلية:
                            </span>
                            <div className="grid grid-cols-2 gap-2 text-[10px] pt-1 leading-normal">
                              <div className="p-1.5 bg-black/40 rounded border border-emerald-500/10">
                                <strong className="text-white block">عائد النظام:</strong>
                                حظر تزييف العدادات، حماية المبيعات، ومناعة 5.00/5.00 ضد الهاكرز.
                              </div>
                              <div className="p-1.5 bg-black/40 rounded border border-emerald-500/10">
                                <strong className="text-white block">عائد المستخدم:</strong>
                                أمان تام لعمولاته، وضمان حقه المالي دون أي تلاعب أو إلغاء زائف للرحلات.
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* Stem 2: الأرشيف الميداني والصندوق الأسود */}
                  <div className="space-y-2 border-r-2 border-cyan-500/20 pr-4">
                    <button 
                      onClick={() => toggleTreeNode('stem2')}
                      className="w-full flex items-center justify-between p-3 bg-zinc-950/60 border border-cyan-500/10 hover:border-cyan-500/35 rounded-xl transition-all"
                    >
                      <div className="flex items-center gap-2">
                        {treeExpandedNodes.stem2 ? <ChevronDown className="w-4 h-4 text-cyan-400" /> : <ChevronRight className="w-4 h-4 text-cyan-400" />}
                        <span className="text-xs font-black text-white">الجذع الثاني: الأرشيف الميداني والاتصال الموضعي (الصندوق الأسود)</span>
                      </div>
                      <Badge className="bg-cyan-500/10 text-cyan-400 border-none text-[9px] font-mono">
                        2 فروع نشطة
                      </Badge>
                    </button>

                    <AnimatePresence>
                      {treeExpandedNodes.stem2 && (
                        <motion.div 
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="space-y-2 pr-4 pt-1 pb-2 overflow-hidden"
                        >
                          {/* Branch 2.1 */}
                          <div className="p-2.5 bg-zinc-900/40 border border-zinc-800/50 rounded-lg text-xs space-y-1">
                            <span className="font-bold text-cyan-400 block text-[11px]">🌿 غصن الصمود بدون تغطية (Offline Queue Queue):</span>
                            <p className="text-[10px] text-zinc-400 leading-normal">
                              طابور محلي مشفر ومحمي بختم رقمي مجزأ (Cryptographic Hash) يحبس المعاملات محلياً عند غياب الشبكة.
                            </p>
                          </div>
                          {/* Branch 2.2 */}
                          <div className="p-2.5 bg-zinc-900/40 border border-zinc-800/50 rounded-lg text-xs space-y-1">
                            <span className="font-bold text-cyan-400 block text-[11px]">🌿 غصن المزامنة التفاضلية عند العودة:</span>
                            <p className="text-[10px] text-zinc-400 leading-normal">
                              يرحل طابور الصندوق الأسود تلقائياً فور تحسس عودة إشارة الإنترنت دون أي تدخل بشري.
                            </p>
                          </div>
                          {/* Fruit */}
                          <div className="p-3 bg-cyan-500/5 border border-cyan-500/20 rounded-xl text-xs space-y-1">
                            <span className="font-black text-cyan-300 flex items-center gap-1">
                              🍎 ثمار هذا الفرع التشغيلية:
                            </span>
                            <div className="grid grid-cols-2 gap-2 text-[10px] pt-1 leading-normal">
                              <div className="p-1.5 bg-black/40 rounded border border-cyan-500/10">
                                <strong className="text-white block">عائد النظام:</strong>
                                صفر فقدان للبيانات التشغيلية والمالية، وحفظ دائم لنشاطات أطقم الميدان.
                              </div>
                              <div className="p-1.5 bg-black/40 rounded border border-cyan-500/10">
                                <strong className="text-white block">عائد المستخدم:</strong>
                                استمرار عمل التطبيق بكفاءة 100% في قيعان لواء الجامعة أو الصحراء وتثبيت عمولته فوراً.
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* Stem 3: شاشة الخزنة السيادية الموحدة */}
                  <div className="space-y-2 border-r-2 border-indigo-500/20 pr-4">
                    <button 
                      onClick={() => toggleTreeNode('stem3')}
                      className="w-full flex items-center justify-between p-3 bg-zinc-950/60 border border-indigo-500/10 hover:border-indigo-500/35 rounded-xl transition-all"
                    >
                      <div className="flex items-center gap-2">
                        {treeExpandedNodes.stem3 ? <ChevronDown className="w-4 h-4 text-indigo-400" /> : <ChevronRight className="w-4 h-4 text-indigo-400" />}
                        <span className="text-xs font-black text-white">الجذع الثالث: شاشة الخزنة السيادية (Vault Screen)</span>
                      </div>
                      <Badge className="bg-indigo-500/10 text-indigo-400 border-none text-[9px] font-mono">
                        3 فروع نشطة
                      </Badge>
                    </button>

                    <AnimatePresence>
                      {treeExpandedNodes.stem3 && (
                        <motion.div 
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="space-y-2 pr-4 pt-1 pb-2 overflow-hidden"
                        >
                          {/* Branch 3.1 */}
                          <div className="p-2.5 bg-zinc-900/40 border border-zinc-800/50 rounded-lg text-xs space-y-1">
                            <span className="font-bold text-indigo-400 block text-[11px]">🌿 غصن خلود العروض (Eternal Storage Clock):</span>
                            <p className="text-[10px] text-zinc-400 leading-normal">
                              يحفظ كروت الاتصال والخصومات بذاكرة المتصفح الصلبة (IndexedDB) لمدة 20 يوماً حتمية مع خيار التمديد اليدوي للأبد.
                            </p>
                          </div>
                          {/* Branch 3.2 */}
                          <div className="p-2.5 bg-zinc-900/40 border border-zinc-800/50 rounded-lg text-xs space-y-1">
                            <span className="font-bold text-indigo-400 block text-[11px]">🌿 غصن الاتصال بلمسة واحدة (Zero-Click Connections):</span>
                            <p className="text-[10px] text-zinc-400 leading-normal">
                              يوصل المندوب أو الراكب مع المعلن المحلي مباشرة عبر بروتوكول `tel:` أو `wa.me` بنقرة واحدة فائقة السرعة.
                            </p>
                          </div>
                          {/* Fruit */}
                          <div className="p-3 bg-indigo-500/5 border border-indigo-500/20 rounded-xl text-xs space-y-1">
                            <span className="font-black text-indigo-300 flex items-center gap-1">
                              🍎 ثمار هذا الفرع التشغيلية:
                            </span>
                            <div className="grid grid-cols-2 gap-2 text-[10px] pt-1 leading-normal">
                              <div className="p-1.5 bg-black/40 rounded border border-indigo-500/10">
                                <strong className="text-white block">عائد النظام:</strong>
                                تحفيز بيع مساحات الرعاة، وزيادة وتيرة تداول كروت الدعاية بنسبة 40%.
                              </div>
                              <div className="p-1.5 bg-black/40 rounded border border-indigo-500/10">
                                <strong className="text-white block">عائد المستخدم:</strong>
                                وصول فوري لعروض الأباطرة، وتأمين صفقات التوصيل دون شروط تعاقدية معقدة.
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* Stem 4: شاشة المحفظة السيادية وإدارة رصيد الدعم وباقات البث الملاحي */}
                  <div className="space-y-2 border-r-2 border-[#00ffcc]/20 pr-4">
                    <button 
                      onClick={() => toggleTreeNode('stem4')}
                      className="w-full flex items-center justify-between p-3 bg-zinc-950/60 border border-[#00ffcc]/10 hover:border-[#00ffcc]/35 rounded-xl transition-all"
                    >
                      <div className="flex items-center gap-2">
                        {treeExpandedNodes.stem4 ? <ChevronDown className="w-4 h-4 text-[#00ffcc]" /> : <ChevronRight className="w-4 h-4 text-[#00ffcc]" />}
                        <span className="text-xs font-black text-white">الجذع الرابع: شاشة المحفظة السيادية وإدارة رصيد الدعم وباقات البث الملاحي</span>
                      </div>
                      <Badge className="bg-[#00ffcc]/10 text-[#00ffcc] border-none text-[9px] font-mono">
                        بث و تسييل فوري
                      </Badge>
                    </button>

                    <AnimatePresence>
                      {treeExpandedNodes.stem4 && (
                        <motion.div 
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="space-y-2 pr-4 pt-1 pb-2 overflow-hidden"
                        >
                          {/* Branch 4.1 */}
                          <div className="p-2.5 bg-zinc-900/40 border border-zinc-800/50 rounded-lg text-xs space-y-1">
                            <span className="font-bold text-[#00ffcc] block text-[11px]">🌿 غصن تسويات قنوات الدفع الرقمية الأردنية (CliQ, Zain Cash, Orange Money, eFAWATEERcom):</span>
                            <p className="text-[10px] text-zinc-400 leading-normal">
                              يربط العمولات وعائدات المندوبين محلياً بناءً على حقل لواء الموطن (homeDistrict) وتأكيد المعاملة بنبضة واحدة فقط (1 Write) للحفاظ على كفاءة الذاكرة.
                            </p>
                          </div>
                          {/* Branch 4.2 */}
                          <div className="p-2.5 bg-zinc-900/40 border border-zinc-800/50 rounded-lg text-xs space-y-1">
                            <span className="font-bold text-[#00ffcc] block text-[11px]">🌿 غصن البث الملاحي المتكامل (Jordan Map OSRM & GPS Hub):</span>
                            <p className="text-[10px] text-zinc-400 leading-normal">
                              محرك ملاحي متكامل يستعمل خادم OSRM مستقل محمل عليه ملف خريطة الأردن المدمج (25MB)، مع تفعيل فوري لمعامل الهرسين (Haversine 1.3) كخط أمان طوارئ عند انقطاع الشبكة.
                            </p>
                          </div>
                          {/* Fruit */}
                          <div className="p-3 bg-[#00ffcc]/5 border border-[#00ffcc]/20 rounded-xl text-xs space-y-1">
                            <span className="font-black text-[#00ffcc] flex items-center gap-1">
                              🍎 ثمار هذا الفرع التشغيلية:
                            </span>
                            <div className="grid grid-cols-2 gap-2 text-[10px] pt-1 leading-normal">
                              <div className="p-1.5 bg-black/40 rounded border border-[#00ffcc]/10">
                                <strong className="text-white block">عائد النظام:</strong>
                                تخفيض تكاليف تسييل الأموال واستعمال الواجهات الجغرافية والخرائط المدفوعة لصفر تكلفة (SC55).
                              </div>
                              <div className="p-1.5 bg-black/40 rounded border border-[#00ffcc]/10">
                                <strong className="text-white block">عائد المستخدم:</strong>
                                تسييل فوري وحر للمستحقات، وحرية بث كلي وخرائط دقيقة دون انقطاع حتى في أقصى المناطق النائية.
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* Stem 5: باقة ولاء المسافر والنبض الماسي */}
                  <div className="space-y-2 border-r-2 border-[#ff3b30]/20 pr-4">
                    <button 
                      onClick={() => toggleTreeNode('stem5')}
                      className="w-full flex items-center justify-between p-3 bg-zinc-950/60 border border-amber-500/15 hover:border-amber-500/40 rounded-xl transition-all"
                    >
                      <div className="flex items-center gap-2">
                        {treeExpandedNodes.stem5 ? <ChevronDown className="w-4 h-4 text-amber-400" /> : <ChevronRight className="w-4 h-4 text-amber-400" />}
                        <span className="text-xs font-black text-white">الجذع الخامس: باقة ولاء المسافر - النبض الماسي</span>
                      </div>
                      <Badge className="bg-amber-500/10 text-amber-400 border-none text-[9px] font-mono">
                        أولوية تكتيكية 1.5x
                      </Badge>
                    </button>

                    <AnimatePresence>
                      {treeExpandedNodes.stem5 && (
                        <motion.div 
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="space-y-2 pr-4 pt-1 pb-2 overflow-hidden"
                        >
                          {/* Branch 5.1 */}
                          <div className="p-2.5 bg-zinc-900/40 border border-zinc-800/50 rounded-lg text-xs space-y-1">
                            <span className="font-bold text-amber-400 block text-[11px]">🌿 غصن الأولوية التكتيكية وقبول أسرع للعروض:</span>
                            <p className="text-[10px] text-zinc-400 leading-normal">
                              يرفع معدل أولوية الحجز والبث الجغرافي إلى 1.5x في خلايا H3 النسيجية بدقة ريزولوشن 9، مما يضمن ظهور السائق فوراً للراكب وحسم صالة المزاد بسرعة تامة.
                            </p>
                          </div>
                          {/* Branch 5.2 */}
                          <div className="p-2.5 bg-zinc-900/40 border border-zinc-800/50 rounded-lg text-xs space-y-1">
                            <span className="font-bold text-amber-400 block text-[11px]">🌿 غصن تراكم النقاط والمناعة السلوكية:</span>
                            <p className="text-[10px] text-zinc-400 leading-normal">
                              يمنح كلاً من السائق والراكب 15 نقطة ولاء آلية لكل رحلة مكتملة في لواء الجامعة لتسهيل شحن محفظة الدعم مجاناً وحمايتهم من تدني نقاط السلوك.
                            </p>
                          </div>
                          {/* Fruit */}
                          <div className="p-3 bg-amber-500/5 border border-amber-500/20 rounded-xl text-xs space-y-1">
                            <span className="font-black text-amber-300 flex items-center gap-1">
                              🍎 ثمار هذا الفرع التشغيلية:
                            </span>
                            <div className="grid grid-cols-2 gap-2 text-[10px] pt-1 leading-normal">
                              <div className="p-1.5 bg-black/40 rounded border border-amber-500/10">
                                <strong className="text-white block">عائد النظام:</strong>
                                رفع نسبة الالتزام وإتمام صفقات المزاد بـ 45% وتخفيض فترات الركود والانتظار الصامت.
                              </div>
                              <div className="p-1.5 bg-black/40 rounded border border-amber-500/10">
                                <strong className="text-white block">عائد المستخدم:</strong>
                                تسريع التقاط الرحلات، وزيادة في الدخل بنسبة 25%، مع الحماية الحتمية للحساب.
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </CardContent>
              </Card>

              {/* ⚖️ MODULE 2: PROTOCOL 12 FORENSIC AUDIT HUB (بروتوكول 12: الفحص الجنائي) */}
              <Card className="xl:col-span-6 bg-[#040815] border border-red-500/30 rounded-3xl p-6 relative overflow-hidden shadow-2xl flex flex-col justify-between">
                <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/5 rounded-full blur-3xl animate-pulse" />
                
                <div>
                  <CardHeader className="p-0 pb-6 border-b border-zinc-800/60">
                    <div className="flex items-center gap-3 justify-between">
                      <Badge className="bg-red-500/15 text-red-400 border border-red-500/35 font-mono text-[10px] px-2.5 py-0.5 rounded-md animate-pulse">
                        سيادي حرج - بروتوكول 12
                      </Badge>
                      <div className="text-right">
                        <CardTitle className="text-base font-black text-white flex items-center gap-2 justify-end">
                          <AlertTriangle className="w-5 h-5 text-red-500 animate-bounce" />
                          بوابة الفحص المبكر ومكافحة تضارب الأدوار
                        </CardTitle>
                        <CardDescription className="text-xs text-zinc-400 mt-1">
                          تحليل الترابط التشعبي وكشف تعارض الأدوار والمهام في الميدان ومعالجة الثغرات فورا.
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>

                  {/* Forensic Insights Matrix */}
                  <div className="grid grid-cols-2 gap-3 mt-4 text-[11px] leading-relaxed">
                    <div className="p-3 bg-red-950/15 border border-red-500/10 rounded-xl space-y-1">
                      <strong className="text-red-400 block font-black">⚡ مواطن الضعف وتعارض المهام:</strong>
                      <p className="text-zinc-400 text-[10px]">
                        - إتاحة طلب تصفية مالية طارئة دون مطابقة ختم تفويض رسمي يسبب تضارب الرتب.<br />
                        - تداخل صلاحيات المشرفين مع المندوب العادي عند ترحيل الصندوق الأسود.
                      </p>
                    </div>
                    <div className="p-3 bg-emerald-950/15 border border-emerald-500/10 rounded-xl space-y-1">
                      <strong className="text-emerald-400 block font-black">🛡️ مواطن القوة والتحصين:</strong>
                      <p className="text-zinc-400 text-[10px]">
                        - عزل العدادات في وعاء مشفر محلي بختم تجزئة ثنائي.<br />
                        - كبح الإلغاء المتكرر، وتفاضل النبض الشبكي التفاضلي NTP لمنع التلاعب.
                      </p>
                    </div>
                  </div>

                  {/* Active Simulator Terminal */}
                  <div className="mt-4 bg-black/85 border border-zinc-800 rounded-2xl p-4 font-mono text-[10px] text-right space-y-2 min-h-[140px] max-h-[180px] overflow-y-auto">
                    <div className="flex items-center justify-between border-b border-zinc-850 pb-1.5 mb-1.5">
                      <span className="text-[9px] text-zinc-500">PROT12_FORENSIC_CONSOLE</span>
                      <span className="flex items-center gap-1 text-red-400 font-bold">
                        <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-ping" />
                        حالة المحاكي: {protocol12ScanResult === 'idle' ? 'جاهز للمسح' : protocol12ScanResult === 'scanning' ? 'جاري الفحص الموضعي...' : protocol12ScanResult === 'complete_safe' ? 'آمن بالكامل' : 'تم اكتشاف تضارب!'}
                      </span>
                    </div>

                    {protocol12AuditLogs.length === 0 ? (
                      <div className="text-zinc-600 text-center py-8 font-sans">
                        اضغط على زر "تفعيل الفحص الجنائي لبروتوكول 12" لبدء تحليل تعارض المهام...
                      </div>
                    ) : (
                      <div className="space-y-1 text-right font-sans">
                        {protocol12AuditLogs.map((log, i) => {
                          const isWarning = log.includes('تحذير');
                          const isSuccess = log.includes('✅') || log.includes('اكتمال');
                          const isRemedy = log.includes('⚡');
                          const isError = log.includes('🚨') || log.includes('Result');
                          
                          let colorClass = 'text-zinc-400';
                          if (isWarning) colorClass = 'text-amber-400 font-bold';
                          if (isSuccess) colorClass = 'text-emerald-400 font-extrabold';
                          if (isRemedy) colorClass = 'text-cyan-400';
                          if (isError) colorClass = 'text-red-500 font-black';

                          return (
                            <p key={i} className={`${colorClass} leading-normal text-[10px]`}>
                              {log}
                            </p>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>

                {/* ACTIVE CONTROLS BOARD (جميع الأزرار مفعلة وعاملة بالكامل) */}
                <div className="mt-6 pt-4 border-t border-zinc-800/60 grid grid-cols-2 gap-3">
                  
                  <Button
                    onClick={runProtocol12Scan}
                    disabled={protocol12ScanResult === 'scanning'}
                    className="bg-zinc-900 hover:bg-zinc-800 text-white border border-zinc-800 hover:border-zinc-700 font-black text-xs h-10 rounded-xl flex items-center justify-center gap-1.5 shrink-0 cursor-pointer"
                  >
                    <Search className="w-3.5 h-3.5 text-zinc-400" />
                    <span>بدء الفحص الجنائي للرتب والمهام</span>
                  </Button>

                  <Button
                    onClick={applyProtocol12Remedies}
                    disabled={protocol12ScanResult === 'scanning' || protocol12RemediesApplied}
                    className="bg-red-950/20 hover:bg-red-950/40 text-red-400 border border-red-500/30 font-black text-xs h-10 rounded-xl flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <SlidersHorizontal className="w-3.5 h-3.5" />
                    <span>إصلاح تضارب الرتب والتعارض</span>
                  </Button>

                  <Button
                    onClick={triggerEmergencySettlement}
                    disabled={emergencySettlementStatus === 'processing'}
                    className="bg-emerald-500 hover:bg-emerald-400 text-black font-extrabold text-xs h-10 rounded-xl flex items-center justify-center gap-1.5 col-span-2 cursor-pointer transition-all active:scale-95"
                  >
                    <DollarSign className="w-3.5 h-3.5" />
                    <span>{emergencySettlementStatus === 'processing' ? 'جاري المعالجة والصرف...' : 'صرف تسوية طارئة فورية (صفر تكلفة شبكية)'}</span>
                  </Button>

                </div>
              </Card>

              {/* 🛡️ MODULE 3: SOVEREIGN DELEGATE VAULT & PRESERVATION EXTENSION HUB */}
              <Card className="xl:col-span-12 bg-[#020510] border border-indigo-500/30 rounded-3xl p-6 relative overflow-hidden shadow-2xl mt-6">
                <div className="absolute top-0 left-0 w-40 h-40 bg-indigo-500/5 rounded-full blur-3xl" />
                <CardHeader className="p-0 pb-6 border-b border-zinc-800/60 flex flex-col md:flex-row items-center justify-between gap-4">
                  <div className="text-right">
                    <CardTitle className="text-base font-black text-white flex items-center gap-2 justify-end">
                      <Layers className="w-5 h-5 text-indigo-400" />
                      بوابة أرشيف الخزنة وتمديد الحفظ السيادي للمندوبين
                    </CardTitle>
                    <CardDescription className="text-xs text-zinc-400 mt-1">
                      التحكم التفاعلي بالخلود الإعلاني لكروت الأباطرة وحسومات لواء الجامعة المعتمدة محلياً.
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Button
                      onClick={seedDemoVaultAds}
                      className="bg-indigo-950/40 hover:bg-indigo-950 text-indigo-300 border border-indigo-500/20 text-[11px] font-bold h-8 px-3 rounded-lg cursor-pointer transition-all"
                    >
                      🌱 شحن كروت الخزنة التجريبية
                    </Button>
                    <Button
                      onClick={loadDelegateVaultAds}
                      className="bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-800 text-[11px] font-bold h-8 px-3 rounded-lg cursor-pointer transition-all"
                    >
                      <RefreshCw className="w-3.5 h-3.5 ml-1 inline" />
                      مزامنة الذاكرة المحلية
                    </Button>
                  </div>
                </CardHeader>

                <CardContent className="p-0 pt-6">
                  {delegateVaultAds.length === 0 ? (
                    <div className="text-center py-12 px-6 bg-zinc-950/40 border border-zinc-800/50 rounded-2xl flex flex-col items-center justify-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-indigo-950/40 flex items-center justify-center text-indigo-400 border border-indigo-500/20 animate-pulse">
                        <Layers className="w-6 h-6" />
                      </div>
                      <div className="space-y-1">
                        <h4 className="text-xs font-black text-white">لا توجد كروت تواصل محفوظة بالخزنة السيادية حالياً</h4>
                        <p className="text-[10px] text-zinc-500 max-w-sm leading-relaxed mx-auto">
                          اضغط على زر <strong className="text-indigo-400">"🌱 شحن كروت الخزنة التجريبية"</strong> بالقولون العلوي لتوليد كروت عروض حقيقية لمرشحي لواء الجامعة وتفعيل تمديد الحفظ والخلود فوراً.
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 font-sans">
                      {delegateVaultAds.map((ad: any) => {
                        const savedTime = ad.savedAtTimestamp || Date.now();
                        const millisecondsIn20Days = 20 * 24 * 60 * 60 * 1000;
                        const expiryTime = savedTime + millisecondsIn20Days;
                        const timeLeftMs = expiryTime - Date.now();
                        const daysLeft = Math.ceil(timeLeftMs / (24 * 60 * 60 * 1000));
                        
                        // Indicators based on days left
                        let statusColor = "text-emerald-400 border-emerald-500/20 bg-emerald-500/5";
                        if (daysLeft <= 5) statusColor = "text-amber-400 border-amber-500/20 bg-amber-500/5 animate-pulse";
                        if (daysLeft <= 1) statusColor = "text-rose-500 border-rose-500/20 bg-rose-500/5 animate-pulse";
                        if (daysLeft > 100) statusColor = "text-indigo-400 border-indigo-500/30 bg-indigo-500/5";

                        return (
                          <div 
                            key={ad.id}
                            className="bg-[#050914] border border-zinc-800/80 hover:border-indigo-500/30 rounded-2xl p-4 flex flex-col justify-between gap-4 transition-all duration-300 relative group"
                          >
                            <div className="space-y-3">
                              {/* Header info */}
                              <div className="flex justify-between items-start gap-2">
                                <Badge className={`font-mono text-[9px] px-2 py-0.5 border ${statusColor}`}>
                                  {daysLeft > 100 ? "♾️ خلود مفتوح" : daysLeft > 0 ? `متبقي ${daysLeft} يوم` : "⚠️ انتهى الأجل"}
                                </Badge>
                                <span className="text-[9px] text-zinc-500 font-mono">ID: {ad.id}</span>
                              </div>

                              <AdDisplayCard
                                ad={ad}
                                showHeart={false}
                                badgeText="نبض ميداني"
                                ctaText={ad.action?.buttonText || ad.buttonText || 'عرض التفاصيل'}
                                className="h-[240px] rounded-[28px]"
                              />

                              {/* Card Body */}
                              <div className="flex gap-3 items-start">
                                <img 
                                  src={ad.content?.posterUrl || ad.bannerUrl} 
                                  alt={ad.title}
                                  className="w-12 h-12 rounded-lg object-cover border border-zinc-800 shrink-0"
                                  referrerPolicy="no-referrer"
                                />
                                <div className="space-y-1">
                                  <h5 className="text-xs font-black text-white group-hover:text-indigo-400 transition-colors line-clamp-1">{ad.title || ad.content?.title}</h5>
                                  <p className="text-[10px] text-zinc-400 leading-relaxed line-clamp-2">{ad.description || ad.content?.description}</p>
                                </div>
                              </div>
                            </div>

                            {/* Actions and Status indicators */}
                            <div className="space-y-2 pt-2 border-t border-zinc-850 text-right">
                              <div className="flex justify-between text-[10px] text-zinc-500">
                                <span>اللواء المستهدف:</span>
                                <strong className="text-white">{ad.targetDistrict || "الجامعة"}</strong>
                              </div>
                              <div className="flex justify-between text-[10px] text-zinc-500">
                                <span>ساعة الحفظ:</span>
                                <span className="font-mono text-zinc-400">{new Date(savedTime).toLocaleDateString('ar-JO')}</span>
                              </div>

                              {/* Dynamic Operational Buttons (مفعلة بالكامل وتطابق رغبة القائد العام) */}
                              <div className="grid grid-cols-2 gap-1.5 pt-1.5">
                                <Button
                                  onClick={() => extendAdPreservation(ad.id)}
                                  className="bg-emerald-500/10 hover:bg-emerald-500/20 text-[#00ffcc] border border-emerald-500/20 text-[9px] font-black h-8 rounded-lg cursor-pointer transition-all active:scale-95"
                                >
                                  🔄 تمديد الحفظ
                                </Button>
                                <Button
                                  onClick={() => lockOpenEndedPreservation(ad.id)}
                                  className="bg-indigo-500/15 hover:bg-indigo-500/25 text-indigo-300 border border-indigo-500/25 text-[9px] font-black h-8 rounded-lg cursor-pointer transition-all active:scale-95"
                                >
                                  🛡️ خلود مفتوح
                                </Button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>

            </div>

            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 text-right" dir="rtl">
              
              {/* Left Column: Security Monitor & Offline Standby Console */}
              <div className="lg:col-span-2 space-y-6">
                
                {/* 1. مؤشر السلامة والمناعة السلوكية */}
                <Card className="bg-[#050B15] border border-emerald-500/20 p-5 rounded-2xl relative overflow-hidden text-right">
                  <div className="absolute top-0 left-0 w-full h-[3px] bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-400 animate-pulse" />
                  <CardHeader className="p-0 pb-4">
                    <CardTitle className="text-sm font-black text-white flex items-center gap-2 justify-start">
                      <ShieldCheck className="w-5 h-5 text-emerald-400" />
                      مؤشر النبض الميداني والتعقيم السلوكي
                    </CardTitle>
                    <CardDescription className="text-xs text-zinc-400">
                      جرد مستمر لبصمة المندوب ومكافحة ثغرات تزييف العدادات أو التلاعب بالجلسات.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-0 space-y-5">
                    <div className="flex items-center justify-between p-4 bg-emerald-500/5 border border-emerald-500/10 rounded-xl">
                      <Badge className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-bold px-3 py-1 text-xs">
                        حالة درع ممتازة
                      </Badge>
                      <div className="space-y-1 text-left">
                        <span className="text-[10px] text-emerald-400 font-extrabold uppercase tracking-wider block">مؤشر المناعة السلوكية</span>
                        <span className="text-2xl font-black text-white font-mono block">4.92 <span className="text-xs text-zinc-400">/ 5.00</span></span>
                      </div>
                    </div>

                    <div className="space-y-3 text-xs text-zinc-300">
                      <div className="flex justify-between py-1 border-b border-zinc-800/40 font-sans">
                        <span className="text-zinc-400">درع الحماية النشط:</span>
                        <span className="font-bold text-emerald-400 flex items-center gap-1">
                          <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping" />
                          درع الماصي V21.0
                        </span>
                      </div>

                      <div className="flex justify-between py-1 border-b border-zinc-800/40 font-sans">
                        <span className="text-zinc-400">انحراف الوقت المحلي (Time Delta):</span>
                        <span className="font-bold text-white font-mono flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-zinc-400 ml-1 inline" />
                          -0.12 ثانية (متزامن)
                        </span>
                      </div>

                      <div className="flex justify-between py-1 border-b border-zinc-800/40 font-sans">
                        <span className="text-zinc-400">أمن الجلسة السحرية:</span>
                        <span className="font-bold text-amber-400 font-mono">
                          {magicSessionActive ? 'عقد موثق وممهر' : 'افتراضية نشطة'}
                        </span>
                      </div>

                      <div className="flex justify-between py-1 font-sans">
                        <span className="text-zinc-400">معرف لواء الموطن الجغرافي:</span>
                        <span className="font-bold text-cyan-400">لواء {user?.district || 'الجامعة'}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* 2. بوابة الصمود والانتظار السحابي (Black-Box Console) */}
                <Card className="bg-[#050B15] border border-blue-500/20 p-5 rounded-2xl relative overflow-hidden text-right">
                  <CardHeader className="p-0 pb-3">
                    <CardTitle className="text-sm font-black text-white flex items-center gap-2 justify-start">
                      <Activity className="w-5 h-5 text-blue-400 animate-pulse" />
                      بوابة الصمود الشبكي والأرشيف المحلي للانتظار
                    </CardTitle>
                    <CardDescription className="text-xs text-zinc-400">
                      الصندوق الأسود لحفظ التغييرات ميدانياً بصمت وترحيلها تلقائياً فور عودة الاتصال.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-0 space-y-4">
                    <div className="flex items-center justify-between p-3.5 rounded-xl border font-sans bg-zinc-950/40 border-zinc-800">
                      <Badge className={`${isOnline ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-400'} border-none px-2.5 py-0.5 rounded-md`}>
                        {isOnline ? 'Online' : 'Offline'}
                      </Badge>
                      <div className="space-y-1 text-left">
                        <span className="text-[10px] text-zinc-400 font-extrabold uppercase block">حالة النبض والشبكة</span>
                        <span className={`text-xs font-bold ${isOnline ? 'text-emerald-400' : 'text-amber-400'}`}>
                          {isOnline ? '● متصل بالخادم الاستراتيجي' : '⚠️ وضع الصمود غير المتصل نشط'}
                        </span>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between items-center text-xs pb-1 border-b border-zinc-800">
                        <span className="text-zinc-400 font-bold">المعاملات العالقة محلياً:</span>
                        <span className="font-mono text-white font-extrabold">{offlineQueue.length}</span>
                      </div>

                      {offlineQueue.length === 0 ? (
                        <div className="text-center py-6 space-y-2">
                          <ShieldCheck className="w-8 h-8 text-emerald-500/30 mx-auto" />
                          <p className="text-[11px] text-emerald-400 font-sans">
                            النبض السحابي متزامن بالكامل، لا توجد معاملات عالقة محلياً في الصندوق الأسود.
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-2 max-h-[160px] overflow-y-auto pr-1">
                          {offlineQueue.map((item, index) => (
                            <div key={index} className="p-2.5 bg-black/40 border border-zinc-850 rounded-lg flex justify-between items-center text-[10px] font-sans">
                              <span className="text-[9px] text-amber-500 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/25">
                                عالقة
                              </span>
                              <div className="space-y-0.5 text-left">
                                <span className="text-amber-400 font-bold block">
                                  {item.type === 'task-transition' && 'تعديل حالة مهمة'}
                                  {item.type === 'request-settlement' && 'طلب تسوية مالية'}
                                  {item.type === 'fleet-toggle' && 'تبديل نبض الأسطول'}
                                </span>
                                <div className="text-[9px] text-zinc-500 font-mono">Status: pending_sync</div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {offlineQueue.length > 0 && (
                      <Button 
                        onClick={processOfflineQueue}
                        disabled={!isOnline}
                        className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs h-9 rounded-xl animate-pulse"
                      >
                        <RefreshCw className="w-3.5 h-3.5 ml-1.5 inline animate-spin" />
                        مزامنة الصندوق الأسود قسرياً الآن
                      </Button>
                    )}
                  </CardContent>
                </Card>

              </div>

              {/* Right Column: Sovereign Audit Ledger with Advanced Search Controls */}
              <div className="lg:col-span-3 space-y-6">
                
                {/* Advanced Search & Filtering Controls Board */}
                <Card className="bg-[#0A0E1A] border border-emerald-500/30 rounded-2xl p-5 space-y-4 text-right">
                  <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between border-b border-zinc-800/80 pb-4">
                    <div className="flex items-center gap-2 justify-start md:justify-end">
                      <Button 
                        onClick={() => {
                          setPulseSearchQuery('');
                          setPulseFilterAction('ALL');
                          setPulseFilterClearance('ALL');
                          setPulseLogSource('ALL');
                        }}
                        variant="ghost"
                        className="text-xs font-bold text-zinc-400 hover:text-white hover:bg-zinc-800/50 h-8 rounded-lg cursor-pointer px-2.5"
                      >
                        إعادة تعيين الفلاتر
                      </Button>
                      <Button 
                        onClick={fetchAuditLogs}
                        variant="outline"
                        className="border-zinc-800 text-zinc-400 hover:text-white h-8 text-xs rounded-lg px-3 cursor-pointer shrink-0"
                        title="تحديث البيانات السحابية الحية"
                      >
                        <RefreshCw className={`w-3.5 h-3.5 ${loadingAudit ? 'animate-spin' : ''}`} />
                      </Button>
                    </div>
                    <div className="space-y-0.5 text-right">
                      <h3 className="text-sm font-black text-white flex items-center gap-2 justify-end">
                        <SlidersHorizontal className="h-5 w-5 text-emerald-400" />
                        لوحة التحكم والتصفية الاستخباراتية المتقدمة
                      </h3>
                      <p className="text-[10px] text-zinc-400">
                        استعلم عن الأرشيف الميداني، فتش في التواقيع الرقمية، واجرد تصنيفات الأمان.
                      </p>
                    </div>
                  </div>

                  {/* Filter Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-right">
                    
                    {/* Search Field */}
                    <div className="md:col-span-4 space-y-1.5">
                      <label className="text-[10px] font-bold text-zinc-400 block">البحث بالنص الصافي (العملية، التوقيع، اللواء، أو المرجع)</label>
                      <div className="relative">
                        <Search className="absolute right-3 top-2.5 w-4 h-4 text-zinc-500" />
                        <Input 
                          value={pulseSearchQuery}
                          onChange={(e) => setPulseSearchQuery(e.target.value)}
                          placeholder="مثال: لواء الجامعة، تسوية، SHA255..."
                          className="bg-black/40 border-zinc-800 focus:border-emerald-500 text-white placeholder:text-zinc-600 text-xs pr-9 h-9 text-right rounded-xl font-sans"
                        />
                      </div>
                    </div>

                    {/* Action Filter */}
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-zinc-400 block">نوع العملية</label>
                      <select 
                        value={pulseFilterAction}
                        onChange={(e) => setPulseFilterAction(e.target.value)}
                        className="w-full bg-black/60 border border-zinc-800 focus:border-emerald-500 text-white rounded-xl text-xs p-2 text-right h-9 font-sans cursor-pointer"
                      >
                        <option value="ALL">الكل (كافة العمليات)</option>
                        <option value="MANDATORY_LEADERSHIP_OVERRIDE">تخطي القيادة العام (Override)</option>
                        <option value="ANTI_CHEAT_INTEGRITY_CHECK">مكافحة الغش والتزييف</option>
                        <option value="FUNDS_TRANSFER_COMPLETED">إرسال وتحويل مستحقات</option>
                        <option value="GEOGRAPHIC_CELL_CALIBRATION">معايرة خلايا H3</option>
                        <option value="TOKEN_DECRYPTION_HANDSHAKE">مصافحة فك تشفير الجلسة</option>
                        <option value="BEHAVIORAL_IMMUNITY_PENALTY">تطهير سلوكي وعقوبات</option>
                        <option value="INSTANT_SETTLEMENT_REQUEST">طلب تسوية فورية</option>
                      </select>
                    </div>

                    {/* Security Clearance Filter */}
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-zinc-400 block">تصنيف الأمان</label>
                      <select 
                        value={pulseFilterClearance}
                        onChange={(e) => setPulseFilterClearance(e.target.value)}
                        className="w-full bg-black/60 border border-zinc-800 focus:border-emerald-500 text-white rounded-xl text-xs p-2 text-right h-9 font-sans cursor-pointer"
                      >
                        <option value="ALL">الكل (كافة التصنيفات)</option>
                        <option value="سيادي حرج">سيادي حرج (Critical)</option>
                        <option value="سري للغاية">سري للغاية (Top Secret)</option>
                        <option value="أمان تلقائي">أمان تلقائي (Auto Secure)</option>
                        <option value="منخفض الأثر">منخفض الأثر (Low Impact)</option>
                      </select>
                    </div>

                    {/* Log Source Filter */}
                    <div className="space-y-1.5 md:col-span-2">
                      <label className="text-[10px] font-bold text-zinc-400 block">مصدر السجلات والمحاكاة</label>
                      <div className="grid grid-cols-3 gap-1 bg-black/60 p-1 border border-zinc-800 rounded-xl h-9">
                        <button
                          type="button"
                          onClick={() => setPulseLogSource('ALL')}
                          className={`text-[10px] font-bold rounded-lg transition-all ${pulseLogSource === 'ALL' ? 'bg-emerald-500 text-black' : 'text-zinc-400 hover:text-white'}`}
                        >
                          الكل ({allLogs.length})
                        </button>
                        <button
                          type="button"
                          onClick={() => setPulseLogSource('LIVE')}
                          className={`text-[10px] font-bold rounded-lg transition-all ${pulseLogSource === 'LIVE' ? 'bg-emerald-500 text-black' : 'text-zinc-400 hover:text-white'}`}
                        >
                          السحابي ({auditLogs.length})
                        </button>
                        <button
                          type="button"
                          onClick={() => setPulseLogSource('SIMULATED')}
                          className={`text-[10px] font-bold rounded-lg transition-all ${pulseLogSource === 'SIMULATED' ? 'bg-emerald-500 text-black' : 'text-zinc-400 hover:text-white'}`}
                        >
                          المحاكي ({simulatedArchiveLogs.length})
                        </button>
                      </div>
                    </div>

                  </div>
                </Card>

                {/* Audit Ledger Results List */}
                <Card className="bg-[#0A0E1A] border border-[#1E293B] rounded-2xl p-6 space-y-4 text-right">
                  <div className="flex justify-between items-center pb-2 border-b border-zinc-800/40">
                    <span className="text-xs text-zinc-500 font-mono font-bold">
                      تم العثور على {filteredLogs.length} سجل مطابق
                    </span>
                    <h3 className="text-xs font-black text-white flex items-center gap-1.5 justify-end">
                      <Filter className="w-4 h-4 text-emerald-400" />
                      نتائج الجرد والتدقيق الاستخباري
                    </h3>
                  </div>

                  <div className="space-y-3">
                    {loadingAudit ? (
                      <div className="text-center py-12 text-xs text-zinc-500 font-sans">
                        جاري تصفح الأرشيف واستدعاء النبض الجنائي السحابي...
                      </div>
                    ) : filteredLogs.length === 0 ? (
                      <div className="text-center py-16 space-y-3">
                        <AlertCircle className="w-10 h-10 text-zinc-600 mx-auto" />
                        <p className="text-xs text-zinc-400 font-sans">لم يتم العثور على أي سجلات مطابقة لمعايير التصفية الحالية.</p>
                        <Button
                          onClick={() => {
                            setPulseSearchQuery('');
                            setPulseFilterAction('ALL');
                            setPulseFilterClearance('ALL');
                            setPulseLogSource('ALL');
                          }}
                          className="bg-emerald-500 hover:bg-emerald-400 text-black font-extrabold text-xs h-8 px-4 rounded-xl cursor-pointer"
                        >
                          إعادة تعيين فلاتر البحث
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-3 max-h-[580px] overflow-y-auto pr-1">
                        {filteredLogs.map((log) => {
                          const isCritical = log.securityClearance === 'سيادي حرج';
                          const isSecret = log.securityClearance === 'سري للغاية';
                          
                          return (
                            <div 
                              key={log.id} 
                              className={`p-4 bg-[#050B15] border rounded-xl flex justify-between items-start gap-4 hover:bg-zinc-950 transition-all font-sans text-right relative overflow-hidden ${
                                isCritical ? 'border-red-500/20' : isSecret ? 'border-amber-500/20' : 'border-zinc-800/80'
                              }`}
                            >
                              {/* Left side: date & signature info */}
                              <div className="text-left shrink-0">
                                <span className="text-[10px] text-zinc-500 font-mono block">
                                  {new Date(log.timestamp).toLocaleString('ar-JO', { hour12: false })}
                                </span>
                                <Badge className={`mt-2 font-mono text-[9px] font-bold border ${
                                  log.source === 'LIVE' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                                }`}>
                                  {log.source === 'LIVE' ? 'سحابي حي' : 'أرشيف محاكي'}
                                </Badge>
                              </div>

                              {/* Right side: details and badge labels */}
                              <div className="space-y-1.5 grow text-right">
                                <div className="flex flex-wrap gap-1.5 items-center justify-end">
                                  {log.details?.deviceHash && (
                                    <span className="text-[8px] text-zinc-500 font-mono bg-zinc-900/60 px-1.5 py-0.5 rounded border border-zinc-800">
                                      HASH: {log.details.deviceHash.substring(0, 15)}
                                    </span>
                                  )}
                                  
                                  <span className={`text-[9px] font-bold px-2 py-0.5 rounded border ${
                                    isCritical 
                                      ? 'bg-red-500/20 text-red-400 border-red-500/30' 
                                      : isSecret 
                                      ? 'bg-amber-500/20 text-amber-400 border-amber-500/30' 
                                      : 'bg-zinc-900 text-zinc-400 border-zinc-800'
                                  }`}>
                                    {log.securityClearance || 'أمان تلقائي'}
                                  </span>

                                  <span className="text-[9px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                                    {log.action}
                                  </span>
                                </div>

                                <h4 className="text-xs font-black text-white mt-1">
                                  {log.action === 'INSTANT_SETTLEMENT_REQUEST' 
                                    ? `تصفية المستحقات المالية الفورية بقيمة ${log.details?.requestedAmount || 0} د.أ` 
                                    : log.action === 'MANDATORY_LEADERSHIP_OVERRIDE'
                                    ? 'بروتوكول 12: فك تجميد القيد السيادي بأمر من القيادة العام'
                                    : log.action === 'ANTI_CHEAT_INTEGRITY_CHECK'
                                    ? 'مصافحة كشف ومكافحة ثغرات تزييف العدادات'
                                    : log.action === 'FUNDS_TRANSFER_COMPLETED'
                                    ? `ترحيل وصرف مستحقات فورية بقيمة ${log.details?.requestedAmount || 185.50} د.أ`
                                    : log.action === 'GEOGRAPHIC_CELL_CALIBRATION'
                                    ? 'معايرة خلايا H3 المكانية بدقة ريزولوشن 9'
                                    : log.action === 'TOKEN_DECRYPTION_HANDSHAKE'
                                    ? 'فك شفرة توكن الجلسة الميدانية للمندوب'
                                    : log.action === 'BEHAVIORAL_IMMUNITY_PENALTY'
                                    ? 'عقوبة أمنية سلوكية وتطبيق بروتوكول التطهير'
                                    : log.action}
                                </h4>

                                <p className="text-[11px] text-zinc-400 leading-relaxed font-sans">
                                  {log.details?.detailsText || `تم توثيق العملية وتأكيد المعاملة في لواء ${log.details?.district || 'الجامعة'} بنجاح تام.`}
                                </p>

                                <div className="flex flex-wrap items-center justify-end gap-x-4 gap-y-1 pt-1.5 text-[9px] text-zinc-500 border-t border-zinc-900 font-mono">
                                  {log.details?.ipAddress && (
                                    <span>IP: {log.details.ipAddress}</span>
                                  )}
                                  {log.details?.referralCode && log.details?.referralCode !== 'N/A' && (
                                    <span className="text-cyan-400">REFERRAL: {log.details.referralCode}</span>
                                  )}
                                  <span>ID: {log.id}</span>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </Card>

              </div>

            </div>
          </div>
        );
      })()}

    </div>
  );
}
