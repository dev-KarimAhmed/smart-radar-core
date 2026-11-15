import { collection, addDoc, doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Delegate, DelegateTask } from './delegates-shared';

interface SettlementActionsProps {
  t: (key: string, values?: any) => string;
  toast: (options: any) => void;
  user: any;
  delegates: Delegate[];
  setDelegates: React.Dispatch<React.SetStateAction<Delegate[]>>;
  selectedDelegateId: string;
  taskTitle: string;
  setTaskTitle: (v: string) => void;
  taskDescription: string;
  setTaskDescription: (v: string) => void;
  taskDeadline: string;
  setTaskDeadline: (v: string) => void;
}

export function useDelegateTaskSettlementActions({
  t,
  toast,
  user,
  delegates,
  setDelegates,
  selectedDelegateId,
  taskTitle,
  setTaskTitle,
  taskDescription,
  setTaskDescription,
  taskDeadline,
  setTaskDeadline
}: SettlementActionsProps) {
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

      const adminIdentity = user?.uid || 'SYSTEM_SOVEREIGN_ADMIN';

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

      const adminIdentity = user?.uid || 'SYSTEM_SOVEREIGN_ADMIN';
      const idToken = (user as any)?.token || null;

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
    handleAddTask,
    handleCloseTask,
    toggleStatus,
    processPayout,
    handleReconcileAndSign
  };
}
