import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import { db, auth, handleFirestoreError, OperationType } from '@/lib/firebase';
import { supabase } from '@/lib/supabase-client';
import { collection, onSnapshot, addDoc, doc, updateDoc, deleteDoc, getDocs, setDoc, query, where, runTransaction } from 'firebase/firestore';
import { Delegate, MagicLink, DelegateTask } from './delegates-shared';

export function useDelegatesState() {
  const t = useTranslations('adminTab.delegatesManagement');
  const { toast } = useToast();
  const { user, loading: authLoading } = useAuth();

  const [delegates, setDelegates] = useState<Delegate[]>([]);
  const [verifiedSignatures, setVerifiedSignatures] = useState<Record<string, boolean>>({});
  const [magicLinks, setMagicLinks] = useState<MagicLink[]>([]);
  const [tasks, setTasks] = useState<DelegateTask[]>([]);
  const [drivers, setDrivers] = useState<any[]>([]);

  const [loading, setLoading] = useState(true);
  const [activeSubTab, setActiveSubTab] = useState<'delegates' | 'magic-links' | 'tasks' | 'performance'>('delegates');
  const [isAdding, setIsAdding] = useState(false);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

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

  // Signature validation via backend-proxy
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

  // Load real-time data from Firestore
  useEffect(() => {
    let unsubDelegates: (() => void) | null = null;
    let unsubLinks: (() => void) | null = null;
    let unsubTasks: (() => void) | null = null;
    let unsubDrivers: (() => void) | null = null;

    if (!authLoading && user && user.role === 'admin') {
      setLoading(true);

      unsubDrivers = onSnapshot(query(collection(db, 'users'), where('role', '==', 'driver')), (snapshot) => {
        const list = snapshot.docs.map(docSnap => ({
          uid: docSnap.id,
          ...docSnap.data()
        }));
        setDrivers(list);
      }, (err) => {
        console.error("Firestore error loading drivers for cross-validation:", err);
      });

      unsubDelegates = onSnapshot(collection(db, 'delegates'), (snapshot) => {
        if (snapshot.empty) {
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
      const qPhone = query(collection(db, 'delegates'), where('phone', '==', phone));
      const qSnap = await getDocs(qPhone);
      if (!qSnap.empty) {
        toast({
          variant: 'destructive',
          title: t('toasts.duplicatePhoneTitle'),
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
        title: t('toasts.addSuccessTitle'),
        description: t('toasts.addSuccessDesc', { name, target: targetDaily })
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
        title: t('toasts.addErrorTitle'),
        description: t('toasts.addErrorDesc')
      });
    }
  };

  const handleGenerateMagicLink = async (delegate: Delegate) => {
    try {
      const hours = delegate.linkExpiryHours || 24;
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        toast({
          variant: 'destructive',
          title: t('toasts.linkErrorTitle'),
          description: t('toasts.linkErrorDescSession')
        });
        return;
      }

      const response = await fetch('/api/generate-magic-link', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          delegateId: delegate.id,
          delegateName: delegate.name,
          expiryHours: hours
        })
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        toast({
          variant: 'destructive',
          title: t('toasts.linkErrorTitle'),
          description: data.error || t('toasts.linkErrorDescServer')
        });
        return;
      }

      toast({
        title: t('toasts.linkSuccessTitle'),
        description: t('toasts.linkSuccessDesc', { name: delegate.name, hours })
      });
    } catch (e) {
      console.error("Error generating magic link:", e);
      toast({
        variant: 'destructive',
        title: t('toasts.linkErrorTitle'),
        description: t('toasts.linkErrorDescUnknown')
      });
    }
  };

  const handleRevokeLink = async (linkId: string) => {
    try {
      await updateDoc(doc(db, 'delegate_links', linkId), { status: 'revoked' });
      toast({
        title: t('toasts.revokeSuccessTitle'),
        description: t('toasts.revokeSuccessDesc')
      });
    } catch (e) {
      console.error("Error revoking link:", e);
    }
  };

  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDelegateId || !taskTitle || !taskDescription || !taskDeadline) {
      toast({
        variant: 'destructive',
        title: t('toasts.taskMissingTitle'),
        description: t('toasts.taskMissingDesc')
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
        title: t('toasts.taskAddSuccessTitle'),
        description: t('toasts.taskAddSuccessDesc', { title: taskTitle, name: target.name })
      });
      setTaskTitle('');
      setTaskDescription('');
      setTaskDeadline('');
    } catch (e) {
      console.error("Error adding task:", e);
    }
  };

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
          title: t('toasts.taskCloseErrorTitle'),
          description: data.error || t('toasts.taskCloseErrorDesc')
        });
        return;
      }

      toast({
        title: t('toasts.taskCloseSuccessTitle'),
        description: t('toasts.taskCloseSuccessDesc')
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
        title: t('toasts.statusChangeTitle'),
        description: newStatus === 'active' ? t('toasts.statusChangeDescActive') : t('toasts.statusChangeDescSuspended')
      });
    } catch (e) {
      console.error(e);
      setDelegates(prev => prev.map(d => d.id === id ? { ...d, status: newStatus } : d));
    }
  };

  const processPayout = async (id: string, amount: number) => {
    try {
      const targetDelegate = delegates.find(d => d.id === id);
      if (!targetDelegate) return;

      const adminIdentity = auth.currentUser ? (auth.currentUser.email || auth.currentUser.uid) : 'SYSTEM_SOVEREIGN_ADMIN';

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

      await updateDoc(doc(db, 'delegates', id), { pendingDues: 0 });

      toast({
        title: t('toasts.payoutSuccessTitle'),
        description: t('toasts.payoutSuccessDesc', { amount })
      });
    } catch (e) {
      console.error(e);
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
          title: t('toasts.signErrorTitle'),
          description: data.error || t('toasts.signErrorDescServer')
        });
        return;
      }

      toast({
        title: t('toasts.signSuccessTitle'),
        description: t('toasts.signSuccessDesc', { name: targetDelegate.name })
      });
    } catch (err) {
      console.error("Failed to reconcile and sign delegate:", err);
      toast({
        variant: 'destructive',
        title: t('toasts.signErrorTitle'),
        description: t('toasts.signErrorDescUnknown')
      });
    }
  };

  return {
    t,
    delegates,
    verifiedSignatures,
    magicLinks,
    tasks,
    drivers,
    loading,
    activeSubTab,
    setActiveSubTab,
    isAdding,
    setIsAdding,
    copiedCode,
    
    // Delegate Form
    name, setName,
    phone, setPhone,
    district, setDistrict,
    targetDaily, setTargetDaily,
    linkExpiryHours, setLinkExpiryHours,
    referralCountInit, setReferralCountInit,
    subRole, setSubRole,
    isFleetActive, setIsFleetActive,
    handleAddDelegate,
    
    // Task Form
    selectedDelegateId, setSelectedDelegateId,
    taskTitle, setTaskTitle,
    taskDescription, setTaskDescription,
    taskDeadline, setTaskDeadline,
    handleAddTask,

    // Actions
    handleCopy,
    handleGenerateMagicLink,
    handleRevokeLink,
    handleCloseTask,
    toggleStatus,
    processPayout,
    handleReconcileAndSign
  };
}
