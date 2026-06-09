import { useState, useEffect } from 'react';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { User } from '@/core/types';

export function useSovereignFleet() {
  const [drivers, setDrivers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const q = query(collection(db, 'users'), where('role', '==', 'driver'));

    const unsubscribe = onSnapshot(q, 
      (snapshot) => {
        const driversList = snapshot.docs.map(doc => ({
          uid: doc.id,
          ...doc.data()
        } as User));
        setDrivers(driversList);
        setLoading(false);
      },
      (err) => {
        console.error('Error listening to sovereign fleet:', err);
        setError(err.message);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  return { drivers, loading, error };
}
