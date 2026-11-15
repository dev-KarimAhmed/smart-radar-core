import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { db, handleFirestoreError, OperationType } from '@/lib/firebase';
import { supabase } from '@/lib/supabase-client';
import { collection, onSnapshot, query, limit } from 'firebase/firestore';
import { Delegate, MagicLink, DelegateTask } from './delegates-shared';

export function useDelegatesData() {
  const { user, loading: authLoading } = useAuth();

  const [delegates, setDelegates] = useState<Delegate[]>([]);
  const [verifiedSignatures, setVerifiedSignatures] = useState<Record<string, boolean>>({});
  const [magicLinks, setMagicLinks] = useState<MagicLink[]>([]);
  const [tasks, setTasks] = useState<DelegateTask[]>([]);
  const [drivers, setDrivers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const lastVerifiedKey = useRef<string>('');

  // Signature validation via backend-proxy (Hash-guarded to prevent duplicate network calls)
  useEffect(() => {
    if (delegates.length === 0) return;
    const currentKey = delegates.map(d => `${d.id}:${d.integritySignature || ''}:${d.referredCount || 0}`).join('|');
    if (currentKey === lastVerifiedKey.current) return;
    lastVerifiedKey.current = currentKey;

    let active = true;
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
        if (active && response.ok && data.success) {
          setVerifiedSignatures(data.results);
        }
      } catch (err) {
        if (process.env.NODE_ENV !== 'production') console.warn("Backend proxy signature check skipped:", err);
      }
    };
    void verifyAll();
    return () => { active = false; };
  }, [delegates]);

  // Load real-time data from Firestore
  useEffect(() => {
    let unsubDelegates: (() => void) | null = null;
    let unsubLinks: (() => void) | null = null;
    let unsubTasks: (() => void) | null = null;

    if (!authLoading && user && (user.role === 'admin' || (user as any).role === 'ADMIN')) {
      setLoading(true);

      void supabase.from('profiles').select('*').eq('role', 'CAPTAIN').then(({ data }) => {
        if (data) {
          setDrivers(data.map(d => ({ uid: d.id, ...d, name: d.full_name })));
        }
      });

      unsubDelegates = onSnapshot(query(collection(db, 'delegates'), limit(100)), (snapshot) => {
        if (snapshot.empty) {
          setDelegates([]);
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

      unsubLinks = onSnapshot(query(collection(db, 'delegate_links'), limit(100)), (snapshot) => {
        const list = snapshot.docs.map(docSnap => ({
          id: docSnap.id,
          ...docSnap.data()
        } as MagicLink));
        setMagicLinks(list);
      }, (err) => {
        console.error("Firestore error loading delegate_links:", err);
        handleFirestoreError(err, OperationType.LIST, 'delegate_links');
      });

      unsubTasks = onSnapshot(query(collection(db, 'delegate_tasks'), limit(100)), (snapshot) => {
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
    };
  }, [user, authLoading]);

  return {
    delegates,
    setDelegates,
    verifiedSignatures,
    magicLinks,
    tasks,
    drivers,
    loading,
    setLoading
  };
}
