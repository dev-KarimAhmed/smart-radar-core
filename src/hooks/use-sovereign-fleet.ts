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
    let unsubscribeQuery: (() => void) | null = null;

    // Track the Firebase Auth state change so we only query once actual credentials exist
    const unsubscribeAuth = auth.onAuthStateChanged((firebaseUser) => {
      // Clear out any stale subscription
      if (unsubscribeQuery) {
        unsubscribeQuery();
        unsubscribeQuery = null;
      }

      if (!firebaseUser && !user) {
        setLoading(true);
        return;
      }

      // If bypassing with mock but Firebase Auth isn't signed in yet, hold on
      if (!firebaseUser) {
        return;
      }

      const q = query(collection(db, 'users'), where('role', '==', 'driver'));

      unsubscribeQuery = onSnapshot(q, 
        (snapshot) => {
          const driversList = snapshot.docs.map(docSnap => ({
            uid: docSnap.id,
            ...docSnap.data()
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
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeQuery) {
        unsubscribeQuery();
      }
    };
  }, [user]);

  return { drivers, loading, error };
}
