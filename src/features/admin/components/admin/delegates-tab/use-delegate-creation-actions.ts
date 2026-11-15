import { collection, doc, updateDoc, getDocs, query, where, runTransaction } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { supabase } from '@/lib/supabase-client';
import { Delegate } from './delegates-shared';

interface CreationActionsProps {
  t: (key: string, values?: any) => string;
  toast: (options: any) => void;
  setCopiedCode: (code: string | null) => void;
  name: string;
  setName: (v: string) => void;
  phone: string;
  setPhone: (v: string) => void;
  district: string;
  targetDaily: string;
  setTargetDaily: (v: string) => void;
  linkExpiryHours: string;
  referralCountInit: string;
  setReferralCountInit: (v: string) => void;
  subRole: 'independent' | 'captain';
  isFleetActive: boolean;
  setIsAdding: (v: boolean) => void;
}

export function useDelegateCreationActions({
  t,
  toast,
  setCopiedCode,
  name,
  setName,
  phone,
  setPhone,
  district,
  targetDaily,
  setTargetDaily,
  linkExpiryHours,
  referralCountInit,
  setReferralCountInit,
  subRole,
  isFleetActive,
  setIsAdding,
}: CreationActionsProps) {
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

  return {
    handleCopy,
    handleAddDelegate,
    handleGenerateMagicLink,
    handleRevokeLink
  };
}
