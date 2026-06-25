'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
import { collection, onSnapshot, addDoc, doc, updateDoc, deleteDoc, getDocs, setDoc, query, where } from 'firebase/firestore';
import { useAuth } from '@/hooks/use-auth';

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
              currentH3Cell: (d as any).currentH3Cell || '0x892f35ffffffff'
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
      title: 'تم النسخ السيادي',
      description: `تم كود إحالة المندوب الأصلي (${code}) إلى الحافظة بنجاح.`
    });
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const handleAddDelegate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !phone) return;

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
      createdAt: new Date().toISOString()
    };

    try {
      await addDoc(collection(db, 'delegates'), newDelegate);
      toast({
        title: 'تم غرس المندوب الميداني',
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
        description: 'يرجى تعيين المندوب وعنوان المهام والسقف الزمني قبل الغرس.'
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
        title: 'تم غرس المهمة السيادية',
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
        title: 'براءة ذمة مالية سيادية',
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

      const response = await fetch('/api/reconcile-and-sign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          delegateId: id,
          actorRole: 'admin',
          actorUid: adminIdentity
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
        description: `تمت مزامنة وإغلاق عدادات المندوب (${targetDelegate.name}) بالبكسل التاريخي وتوقيعه بالختم الرقمي السيادي من خلال الخادم الأمني.`
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
    <div className="space-y-6 text-right" dir="rtl">
      
      {/* Header Panel */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-black text-white flex items-center gap-2">
            <Users className="w-6 h-6 text-emerald-400" />
            فيلق جيش المندوبين السيادي (Delegates Army Command)
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5 font-sans">
            بوابة المشرف الموحدة للتحكم بالمناديب، ومراقبة تمديد الروابط السحرية، وإحالات الأقاليم الأردنية والعراقية.
          </p>
        </div>
        <div className="flex gap-2">
          <Button 
            onClick={() => setIsAdding(!isAdding)} 
            className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold gap-1 text-xs h-9 rounded-xl pointer-events-auto"
          >
            {isAdding ? 'إغلاق نافذة التسجيل' : 'تجنيد مندوب ميداني +'}
          </Button>
        </div>
      </div>

      {/* Sub-navigation Controls */}
      <div className="flex flex-wrap gap-2 border-b border-white/5 pb-3">
        <Button
          variant={activeSubTab === 'delegates' ? 'default' : 'ghost'}
          onClick={() => setActiveSubTab('delegates')}
          className={cn(
            "text-xs px-4 py-2 font-black rounded-lg h-9",
            activeSubTab === 'delegates' ? 'bg-emerald-600 hover:bg-emerald-500 text-white' : 'text-zinc-400'
          )}
        >
          <Users className="w-4 h-4 ml-1.5 shrink-0" />
          إدارة المندوبين والاعتماد
        </Button>

        <Button
          variant={activeSubTab === 'magic-links' ? 'default' : 'ghost'}
          onClick={() => setActiveSubTab('magic-links')}
          className={cn(
            "text-xs px-4 py-2 font-black rounded-lg h-9",
            activeSubTab === 'magic-links' ? 'bg-emerald-600 hover:bg-emerald-500 text-white' : 'text-zinc-400'
          )}
        >
          <LinkIcon className="w-4 h-4 ml-1.5 shrink-0" />
          الروابط السحرية (Magic Links)
          {magicLinks.filter(l => l.status === 'active').length > 0 && (
            <Badge className="mr-1 bg-amber-500 text-black text-[9px] font-black">{magicLinks.filter(l => l.status === 'active').length}</Badge>
          )}
        </Button>

        <Button
          variant={activeSubTab === 'tasks' ? 'default' : 'ghost'}
          onClick={() => setActiveSubTab('tasks')}
          className={cn(
            "text-xs px-4 py-2 font-black rounded-lg h-9",
            activeSubTab === 'tasks' ? 'bg-emerald-600 hover:bg-emerald-500 text-white' : 'text-zinc-400'
          )}
        >
          <ClipboardList className="w-4 h-4 ml-1.5 shrink-0" />
          متابعة وإسناد المهام
          {tasks.filter(t => t.status === 'pending').length > 0 && (
            <Badge className="mr-1 bg-red-500 text-white text-[9px] font-black">{tasks.filter(t => t.status === 'pending').length}</Badge>
          )}
        </Button>

        <Button
          variant={activeSubTab === 'performance' ? 'default' : 'ghost'}
          onClick={() => setActiveSubTab('performance')}
          className={cn(
            "text-xs px-4 py-2 font-black rounded-lg h-9",
            activeSubTab === 'performance' ? 'bg-emerald-600 hover:bg-emerald-500 text-white' : 'text-zinc-400'
          )}
        >
          <TrendingUp className="w-4 h-4 ml-1.5 shrink-0" />
          محرك الأداء والإحصائيات د.ط
        </Button>
      </div>

      {/* Add New Delegate Panel */}
      {isAdding && (
        <Card className="bg-[#000d00]/90 border-emerald-500/30 p-5 mt-4 animate-in slide-in-from-top duration-300">
          <CardHeader className="p-0 pb-3">
            <CardTitle className="text-base font-black text-white flex items-center gap-2">
              <UserPlus className="w-5 h-5 text-emerald-400" />
              صياغة عقد تجنيد جديد لقوات الانتشار الميداني
            </CardTitle>
            <CardDescription className="text-xs text-zinc-400">
              سيتم تخصيص كود إحالة عسكري متين، وتارجت يومي ثابت لتتبع معادلة الكسب والعجز.
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleAddDelegate} className="space-y-4">
            <div className="grid md:grid-cols-4 gap-4">
              <div className="space-y-1">
                <Label htmlFor="del-name" className="text-xs text-zinc-300">اسم المندوب المعتمد</Label>
                <Input 
                  id="del-name" 
                  value={name} 
                  onChange={e => setName(e.target.value)} 
                  placeholder="مثال: يوسف مأمون بني ملحم"
                  className="bg-black/80 border-emerald-950/50 text-white text-xs h-9"
                  required
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="del-phone" className="text-xs text-zinc-300">رقم الهاتف النشط</Label>
                <Input 
                  id="del-phone" 
                  value={phone} 
                  onChange={e => setPhone(e.target.value)} 
                  placeholder="مثال: 0797744111"
                  className="bg-black/80 border-emerald-950/50 text-white text-xs h-9"
                  required
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="del-region" className="text-xs text-zinc-300">محافظة ولواء السيادة جغرافياً</Label>
                <select 
                  id="del-region" 
                  value={district} 
                  onChange={e => setDistrict(e.target.value)} 
                  className="w-full h-9 mt-1 rounded bg-black border border-emerald-900 text-white px-2 focus:outline-none focus:border-emerald-500 text-xs"
                >
                  <option value="وادي السير">وادي السير (عمان)</option>
                  <option value="الجامعة">لواء الجامعة (عمان)</option>
                  <option value="قصبة عمان">قصبة عمان (عمان)</option>
                  <option value="الكرادة">الكرادة (بغداد - العراق)</option>
                </select>
              </div>

              <div className="space-y-1">
                <Label htmlFor="del-target" className="text-xs text-zinc-300 font-bold">التارجت اليومي الملتزم به</Label>
                <Input 
                  id="del-target" 
                  type="number"
                  value={targetDaily} 
                  onChange={e => setTargetDaily(e.target.value)} 
                  placeholder="مثال: 10"
                  className="bg-black/80 border-emerald-950/50 text-white text-xs h-9"
                  required
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="del-expiry" className="text-xs text-zinc-300">مدة صلاحية الروابط السحرية</Label>
                <select 
                  id="del-expiry" 
                  value={linkExpiryHours} 
                  onChange={e => setLinkExpiryHours(e.target.value)} 
                  className="w-full h-9 mt-1 rounded bg-black border border-emerald-900 text-white px-2 focus:outline-none focus:border-emerald-500 text-xs"
                >
                  <option value="24">24 ساعة (يوم كامل)</option>
                  <option value="48">48 ساعة (يومين)</option>
                  <option value="72">72 ساعة (ثلاثة أيام)</option>
                </select>
              </div>

              <div className="space-y-1 font-mono">
                <Label htmlFor="del-count" className="text-xs text-zinc-300">أرقام مقيدة مسبقاً</Label>
                <Input 
                  id="del-count" 
                  type="number" 
                  value={referralCountInit} 
                  onChange={e => setReferralCountInit(e.target.value)} 
                  className="bg-black/80 border-emerald-950/50 text-white text-xs h-9"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="ghost" onClick={() => setIsAdding(false)} className="h-9 hover:bg-white/5 text-xs text-neutral-400">إلغاء الأمر</Button>
              <Button type="submit" className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold h-9 text-xs rounded-xl">إنشاء العقد وتجهيز الكود 🔒</Button>
            </div>
          </form>
        </Card>
      )}

      {/* Main Container based on Sub-tabs */}
      {activeSubTab === 'delegates' && (
        <Card className="bg-[#091B09]/20 border-emerald-950/30">
          <CardHeader className="pb-3 border-b border-emerald-950/20">
            <CardTitle className="text-base font-black text-white">منتسبي جيش الميدان ولواء التنسيق الجغرافي</CardTitle>
            <CardDescription className="text-xs text-zinc-400">
              تتبع رموز إحالة المندوبين، تعيين التارجت، حظر الأمان التلقائي، وتنسيق تسييل العوائد.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {delegates.length > 0 ? (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader className="bg-black/40 border-b border-emerald-950/30">
                    <TableRow>
                      <TableHead className="text-right text-gray-400 text-xs py-3">المندوب والإقليم</TableHead>
                      <TableHead className="text-right text-gray-400 text-xs">كود الإحالة</TableHead>
                      <TableHead className="text-right text-gray-400 text-xs">التارجت اليومي</TableHead>
                      <TableHead className="text-right text-gray-400 text-xs">الكباتن المسجلين</TableHead>
                      <TableHead className="text-right text-gray-400 text-xs">انتساب عضوي</TableHead>
                      <TableHead className="text-right text-gray-400 text-xs">سقوف الروابط</TableHead>
                      <TableHead className="text-right text-gray-400 text-xs">حالة الاعتماد</TableHead>
                      <TableHead className="text-left text-gray-400 text-xs p-3">التحكم السحابي</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {delegates.map((del) => {
                      return (
                        <TableRow key={del.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                          <TableCell className="align-middle py-3">
                            <div className="flex items-center gap-3">
                              <Avatar className="w-8 h-8 rounded-full border border-emerald-500/20 bg-emerald-950/40 shrink-0">
                                <AvatarFallback className="text-emerald-400 font-bold text-xs">
                                  {del.name.substring(0, 2)}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="text-xs font-black text-white leading-tight">{del.name}</p>
                                <span className="text-[10px] text-emerald-500 font-mono font-bold">{del.district} ● {del.phone}</span>
                              </div>
                            </div>
                          </TableCell>

                          <TableCell className="align-middle animate-fade-in">
                            <div className="flex items-center gap-1">
                              <Badge variant="outline" className="font-mono text-[10px] bg-black/60 border-emerald-800 text-white p-1">
                                {del.referralCode}
                              </Badge>
                              <Button 
                                size="icon" 
                                variant="ghost" 
                                onClick={() => handleCopy(del.referralCode)} 
                                className="w-6 h-6 hover:bg-neutral-800"
                              >
                                {copiedCode === del.referralCode ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5 text-gray-400" />}
                              </Button>
                            </div>
                          </TableCell>

                          <TableCell className="align-middle font-black text-xs text-zinc-300 font-mono">
                            {del.targetDaily || 10} حاقن/يوم
                          </TableCell>

                          <TableCell className="align-middle font-bold text-xs font-mono text-zinc-300">
                            <div>
                              <div>{del.referredCount || 0} كابتن</div>
                              {(() => {
                                const actualCount = drivers.filter(dr => 
                                  dr.referralCode === del.referralCode || 
                                  dr.referredByCode === del.referralCode || 
                                  dr.usedReferralCode === del.referralCode
                                ).length;
                                
                                const isSigValid = !!verifiedSignatures[del.id];
                                const hasDiscrepancy = actualCount > 0 && actualCount !== del.referredCount;

                                return (
                                  <div className="space-y-1 mt-1.5 text-[9px] font-sans">
                                    {isSigValid ? (
                                      <Badge variant="outline" className="text-[8px] bg-emerald-950/25 text-emerald-400 border-emerald-500/30 py-0.5 px-1 font-bold block w-fit">
                                        ✓ توقيع رقمي معتمد
                                      </Badge>
                                    ) : (
                                      <Badge variant="outline" className="text-[8px] bg-red-950/25 text-red-400 border-red-500/30 py-0.5 px-1 font-bold block w-fit">
                                        ⚠️ تالف أو غير موقّع
                                      </Badge>
                                    )}

                                    {hasDiscrepancy ? (
                                      <div className="text-red-400 font-bold flex items-center gap-1">
                                        <span>⚠️ تضارب: الفعلي ({actualCount})</span>
                                      </div>
                                    ) : actualCount > 0 ? (
                                      <div className="text-emerald-400 font-bold flex items-center gap-1 text-[8px]">
                                        <span>✓ تطابق مبرهن ({actualCount})</span>
                                      </div>
                                    ) : null}

                                    {(!isSigValid || hasDiscrepancy) && (
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => handleReconcileAndSign(del.id)}
                                        className="h-5 px-1.5 bg-amber-500/10 hover:bg-amber-500/20 text-[8px] font-bold text-amber-400 rounded border border-amber-500/20 block"
                                      >
                                        مصادقة وتوقيع تشفيري ⚡
                                      </Button>
                                    )}
                                  </div>
                                );
                              })()}
                            </div>
                          </TableCell>

                          <TableCell className="align-middle font-semibold text-xs font-mono text-emerald-400">
                            +{del.organicCount || 0} نمو عضوي
                          </TableCell>

                          <TableCell className="align-middle font-mono">
                            <Badge variant="outline" className="text-[10px] text-amber-400 border-amber-500/30 bg-amber-950/20">
                              ⏱️ {del.linkExpiryHours || 24} ساعة
                            </Badge>
                          </TableCell>

                          <TableCell className="align-middle">
                            <Badge 
                              variant="outline" 
                              className={cn(
                                "text-[10px]", 
                                del.status === 'active' 
                                  ? "text-emerald-400 border-emerald-500 bg-emerald-950/20" 
                                  : "text-amber-500 border-amber-500 bg-amber-950/20"
                              )}
                            >
                              {del.status === 'active' ? 'مفعّل ونشط ●' : 'مجمّد مؤقتاً ||'}
                            </Badge>
                          </TableCell>

                          <TableCell className="align-middle text-left p-3">
                            <div className="flex items-center justify-end gap-1.5">
                              <Button 
                                size="sm" 
                                variant="outline" 
                                onClick={() => handleGenerateMagicLink(del)}
                                className="h-7 border-teal-500/30 hover:bg-teal-950/40 text-[10px] font-bold text-teal-400 rounded-lg"
                              >
                                <LinkIcon className="w-3 h-3 ml-1" />
                                توليد رابط سحري
                              </Button>

                              <Button 
                                size="sm" 
                                variant="outline" 
                                onClick={() => toggleStatus(del.id, del.status)}
                                className="h-7 border-[#1e293b] hover:bg-neutral-800 text-[10px] rounded-lg text-neutral-300"
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
              <p className="text-center text-muted-foreground text-xs py-10 font-bold">لا يوجد مندوبين معتمدين مسجلين في النظام بعد.</p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Magic Links Sub-tab */}
      {activeSubTab === 'magic-links' && (
        <div className="space-y-6">
          <Card className="bg-[#091B09]/20 border-emerald-950/30">
            <CardHeader className="pb-3 border-b border-emerald-950/20">
              <CardTitle className="text-base font-black text-white flex items-center gap-1.5">
                <LinkIcon className="h-4.5 w-4.5 text-amber-400" />
                محرك الروابط السحرية والولوج الفوري
              </CardTitle>
              <CardDescription className="text-xs text-zinc-400">
                قائمة الروابط الصادرة لحسابات المندوبين مع تتبع الأمان والحدود الزمنية لإنهاء الصلاحية تلافياً لأي تسلل.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              {magicLinks.length > 0 ? (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader className="bg-black/40 border-b border-[#1e293b]">
                      <TableRow>
                        <TableHead className="text-right text-gray-405 text-xs py-3">المندوب المستفيد</TableHead>
                        <TableHead className="text-right text-gray-405 text-xs">رابط الدخول المشفر</TableHead>
                        <TableHead className="text-right text-gray-405 text-xs">الانتهاء الزمني</TableHead>
                        <TableHead className="text-right text-gray-405 text-xs">الصلاحية لمرة واحدة</TableHead>
                        <TableHead className="text-left text-gray-405 text-xs p-3">إجراء سيادي</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {magicLinks.map((link) => {
                        const expired = new Date(link.expiresAt) < new Date();
                        const isActive = link.status === 'active' && !expired;

                        return (
                          <TableRow key={link.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                            <TableCell className="align-middle py-3">
                              <span className="text-xs font-black text-white block">{link.delegateName}</span>
                              <span className="text-[10px] text-zinc-500 font-mono">#Link-{link.id.substring(0,6)}</span>
                            </TableCell>

                            <TableCell className="align-middle">
                              <div className="flex items-center gap-1">
                                <Badge variant="outline" className="font-mono text-[9px] bg-black text-zinc-300 p-1 select-all cursor-pointer hover:bg-neutral-900 border-zinc-800">
                                  {link.url}
                                </Badge>
                                <Button 
                                  size="icon" 
                                  variant="ghost" 
                                  onClick={() => {
                                    navigator.clipboard.writeText(link.url);
                                    toast({ title: 'تم نسخ الرابط السحري', description: 'يمكنك إرساله للمندوب للدخول بنقرة واحدة.' });
                                  }} 
                                  className="w-6 h-6 hover:bg-neutral-800"
                                >
                                  <Copy className="w-3.5 h-3.5 text-gray-400" />
                                </Button>
                              </div>
                            </TableCell>

                            <TableCell className="align-middle font-mono text-xs">
                              {new Date(link.expiresAt).toLocaleString('ar-JO')}
                            </TableCell>

                            <TableCell className="align-middle">
                              <Badge 
                                variant="outline" 
                                className={cn(
                                  "text-[10px]",
                                  isActive ? "text-emerald-400 border-emerald-500 bg-emerald-950/20" : "text-zinc-500 border-zinc-800 bg-black/40"
                                )}
                              >
                                {link.status === 'used' ? 'تم الاستهلاك' : link.status === 'revoked' ? 'أبطل بالكامل' : expired ? 'منتهي الصلاحية' : 'صالح ونشط'}
                              </Badge>
                            </TableCell>

                            <TableCell className="align-middle text-left p-3">
                              {isActive && (
                                <Button 
                                  size="sm" 
                                  variant="outline" 
                                  onClick={() => handleRevokeLink(link.id)}
                                  className="h-7 border-red-500/20 hover:bg-red-950/30 text-[10px] font-bold text-red-400 rounded-lg"
                                >
                                  <XCircle className="w-3 h-3 ml-1" />
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
                <div className="text-center text-muted-foreground text-xs py-10 font-bold space-y-2 flex flex-col items-center">
                  <Info className="w-8 h-8 text-amber-500" />
                  <span>لا يوجد أي روابط سحرية نشطة حالياً. يمكنك توليد رابط بجانب اسم المندوب في الأعلى.</span>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Tasks sub-tab */}
      {activeSubTab === 'tasks' && (
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* List of Tasks */}
          <Card className="lg:col-span-3 bg-[#091B09]/20 border-emerald-950/30">
            <CardHeader className="pb-3 border-b border-emerald-950/20 flex justify-between items-center">
              <CardTitle className="text-base font-black text-white flex items-center gap-1.5">
                <ClipboardList className="h-4.5 w-4.5 text-emerald-400" />
                متابعة حالة المهام الميدانية المفتوحة
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {tasks.length > 0 ? (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader className="bg-black/40 border-b border-[#1e293b]">
                      <TableRow>
                        <TableHead className="text-right text-gray-400 text-xs py-3">المهمة والمندوب</TableHead>
                        <TableHead className="text-right text-gray-400 text-xs">التفاصيل والتكليف</TableHead>
                        <TableHead className="text-right text-gray-400 text-xs">السقف الزمني</TableHead>
                        <TableHead className="text-right text-gray-400 text-xs">حالة المهمة</TableHead>
                        <TableHead className="text-left text-gray-400 text-xs p-3">الإجراء السلوكي</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {tasks.map((task) => {
                        return (
                          <TableRow key={task.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                            <TableCell className="align-middle py-3">
                              <span className="text-xs font-black text-white block">{task.title}</span>
                              <span className="text-[10px] text-zinc-400 block font-bold text-emerald-400">للمندوب: {task.delegateName}</span>
                            </TableCell>

                            <TableCell className="align-middle text-xs text-zinc-300 max-w-[200px] truncate">
                              {task.description}
                            </TableCell>

                            <TableCell className="align-middle font-mono text-xs">
                              {task.deadline}
                            </TableCell>

                            <TableCell className="align-middle">
                              <Badge 
                                variant="outline" 
                                className={cn(
                                  "text-[10px]",
                                  task.status === 'pending' ? "text-yellow-400 border-yellow-500/30 bg-yellow-950/20" :
                                  task.status === 'acknowledged' ? "text-blue-400 border-blue-500/30 bg-blue-950/20" :
                                  task.status === 'completed' ? "text-emerald-400 border-emerald-500/30 bg-emerald-950/20" :
                                  "text-zinc-500 border-zinc-800 bg-black/40"
                                )}
                              >
                                {task.status === 'pending' ? 'بانتظار العرض' :
                                 task.status === 'acknowledged' ? 'اطّلع المندوب' :
                                 task.status === 'completed' ? 'أُنجزت ✓' : 'مغلقة ومؤرشفة'}
                              </Badge>
                            </TableCell>

                            <TableCell className="align-middle text-left p-3">
                              {task.status !== 'closed' && (
                                <Button 
                                  size="sm" 
                                  variant="outline" 
                                  onClick={() => handleCloseTask(task.id)}
                                  className="h-7 border-zinc-800 hover:bg-neutral-800 text-[10px] font-bold text-zinc-300 rounded-lg"
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
                <div className="text-center text-muted-foreground text-xs py-12 font-bold space-y-2 flex flex-col items-center">
                  <ClipboardList className="w-8 h-8 text-neutral-600" />
                  <span>لا يوجد مهام ميدانية جارية مسندة حالياً. استخدم اللوحة الجانبية لإنشاء أول مهمة للجيش الميدني.</span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Create Task Form */}
          <Card className="lg:col-span-2 bg-[#0A0E1A] border-[#1e293b]">
            <CardHeader>
              <CardTitle className="text-sm font-black text-white flex items-center gap-1.5">
                <Sparkles className="w-4.5 h-4.5 text-emerald-400" />
                صياغة أمر عسكري ميداني (مهمة)
              </CardTitle>
              <CardDescription className="text-xs">
                سيصل إشعار فوري للمندوب في لوحته لإلزامه بالتنفيذ والرد بالنتائج الجغرافية.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleAddTask} className="space-y-4">
                <div className="space-y-1">
                  <Label className="text-xs text-zinc-400">اختر المندوب المستهدف</Label>
                  <select 
                    value={selectedDelegateId} 
                    onChange={e => setSelectedDelegateId(e.target.value)} 
                    className="w-full h-10 rounded bg-black border border-[#1e293b] text-white px-2 focus:outline-none text-xs"
                    required
                  >
                    <option value="">-- اسم المندوب الرباعي --</option>
                    {delegates.filter(d => d.status === 'active').map(d => (
                      <option key={d.id} value={d.id}>{d.name} ({d.district})</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <Label className="text-xs text-zinc-400">عنوان التكليف</Label>
                  <Input 
                    value={taskTitle} 
                    onChange={e => setTaskTitle(e.target.value)} 
                    placeholder="مثال: غرز 15 سائق في لواء صويلح"
                    className="bg-black border-[#1e293b] text-xs h-10"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <Label className="text-xs text-zinc-400">مضمون الإجراء السلوكي والمحفزات</Label>
                  <textarea 
                    value={taskDescription} 
                    onChange={e => setTaskDescription(e.target.value)} 
                    placeholder="يرجى توزيع الملصقات وكتابة رمز الإحالة JO-SWAILEH.. ومساعدة الكباتن في تخطي عقبة الفحص الأولي للسيارات."
                    className="w-full min-h-[80px] bg-black border border-[#1e293b] rounded-md p-2 text-white focus:outline-none text-xs"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <Label className="text-xs text-zinc-400">مستهدف السقف الزمني</Label>
                  <Input 
                    type="date"
                    value={taskDeadline} 
                    onChange={e => setTaskDeadline(e.target.value)} 
                    className="bg-black border-[#1e293b] text-xs h-10"
                    required
                  />
                </div>

                <Button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold h-10 text-xs rounded-xl">
                  إرسال وإسناد الأمر الميداني فورا ⚡
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Analytics Performance Tab */}
      {activeSubTab === 'performance' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="bg-[#091B09]/40 border-emerald-950/40 p-4">
              <CardHeader className="p-0 pb-1">
                <CardDescription className="text-[10px] text-zinc-400 font-bold">عواصف النمو المباشر</CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <p className="text-2xl font-black text-amber-500 font-mono">{totalReferred} كابتن</p>
                <div className="flex items-center gap-1 text-[9px] text-[#10B981] font-bold mt-1">
                  <TrendingUp className="w-3.5 h-3.5" />
                  <span>توسّع إيجابي وقدرة تجنيدية صارمة</span>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-[#091B09]/40 border-emerald-950/40 p-4">
              <CardHeader className="p-0 pb-1">
                <CardDescription className="text-[10px] text-zinc-400 font-bold">إجمالي الانتساب العضوي (الألوية)</CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <p className="text-2xl font-black text-emerald-400 font-mono">+{totalOrganic} منتسب</p>
                <div className="flex items-center gap-1 text-[9px] text-[#10B981] font-bold mt-1">
                  <span>معدل نمو عضوي بنسبة {growthIndex}%</span>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-[#091B09]/40 border-emerald-950/40 p-4">
              <CardHeader className="p-0 pb-1">
                <CardDescription className="text-[10px] text-zinc-400 font-bold">نسبة الانسحاب والخسارة</CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <p className="text-2xl font-black text-red-400 font-mono">{churnRateAvg}%</p>
                <div className="flex items-center gap-1 text-[9px] text-red-400 font-semibold mt-1">
                  <TrendingDown className="w-3.5 h-3.5" />
                  <span>إجمالي حذف التطبيق: {totalChurn} كباتن</span>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-[#091B09]/40 border-emerald-950/40 p-4">
              <CardHeader className="p-0 pb-1">
                <CardDescription className="text-[10px] text-zinc-400 font-bold">الكباتن الثابتين (+45 يوم)</CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <p className="text-2xl font-black text-blue-400 font-mono">{totalSteady} كابتن</p>
                <span className="text-[9px] text-zinc-500 font-bold block mt-1">
                  معدل التزام مبرهن بصمامات قوية
                </span>
              </CardContent>
            </Card>
          </div>

          <Card className="bg-[#0A0F1D] border-[#1e293b]">
            <CardHeader>
              <CardTitle className="text-sm font-black text-white flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-emerald-400" />
                مقارنة كفوءة لألوية الاقتدار والسيادة
              </CardTitle>
              <CardDescription className="text-xs">
                مخطط الكفاءة والنمو شهرياً بموجب تتبع الحالات الميدانية وحماية الروابط.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 font-sans text-xs">
                {delegates.map(d => {
                  const percentage = totalReferred > 0 ? Math.round(((d.referredCount || 0) / totalReferred) * 100) : 0;
                  const isSigValid = !!verifiedSignatures[d.id];
                  return (
                    <div key={d.id} className="space-y-1.5 bg-black/40 p-3 rounded-lg border border-[#1e293b]">
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-zinc-400">الإقليم: <span className="font-bold text-white">{d.district} ({d.name})</span></span>
                        <div className="flex items-center gap-1.5">
                          {isSigValid ? (
                            <span className="text-[9px] text-emerald-400 font-bold bg-emerald-950/20 px-1 border border-emerald-500/20 rounded">✓ موثق تشفيرياً</span>
                          ) : (
                            <span className="text-[9px] text-red-400 font-bold bg-red-950/20 px-1 border border-red-500/20 rounded">⚠️ غير موثق</span>
                          )}
                          <span className="font-bold text-emerald-400">{d.referredCount} كابتن ({percentage}%)</span>
                        </div>
                      </div>
                      <div className="w-full bg-neutral-900 h-2 rounded-full overflow-hidden">
                        <div 
                          className="bg-emerald-500 h-full rounded-full transition-all duration-505" 
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                      <div className="flex justify-between items-center text-[10px] text-zinc-500">
                        <span>النمو العضوي المتمدد: +{d.organicCount}</span>
                        <span>نبضات الثبات (45 يوم): {d.steadyCount} كابتن ملتزم</span>
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
