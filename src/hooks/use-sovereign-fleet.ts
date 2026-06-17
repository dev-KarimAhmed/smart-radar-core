import { useState, useEffect } from 'react';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { db, auth } from '@/lib/firebase';
import type { User } from '@/core/types';
import { useAuth } from './use-auth';

export function useSovereignFleet() {
  const [drivers, setDrivers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    // Only subscribe if there's a loaded session user (indicating auth module is hydrated/bypassed)
    if (!auth.currentUser && !user) {
      setLoading(true);
      return;
    }

    const q = query(collection(db, 'users'), where('role', '==', 'driver'));

    const unsubscribe = onSnapshot(q, 
      (snapshot) => {
        const driversList = snapshot.docs.map(doc => ({
          uid: doc.id,
          ...doc.data()
        } as User));
        setDrivers(driversList);
        setError(null);
        setLoading(false);
      },
      (err) => {
        console.error('Error listening to sovereign fleet:', err);
        setError(err.message);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user]);

  return { drivers, loading, error };
}
