'use client';

import { useState, useEffect } from 'react';
import { collection, onSnapshot, query } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { trackSovereignError } from '@/lib/error-tracker';
import { useTranslations } from 'next-intl';
import type { MarketPulse } from '@/core/types';

export function useMarketPulse(enabled = true) {
  const tAuto = useTranslations();
  const [pulseData, setPulseData] = useState<MarketPulse[]>([]);
  const [isLoading, setIsLoading] = useState(enabled);

  useEffect(() => {
    if (!enabled) {
      setPulseData([]);
      setIsLoading(false);
      return;
    }
    
    let isMounted = true;
    const q = query(collection(db, 'market_pulse'));

    const unsubscribe = onSnapshot(q, 
      (snapshot) => {
        if (!isMounted) return;
        
        if (snapshot.empty) {
          setPulseData([]);
        } else {
          setPulseData(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as MarketPulse)));
        }
        setIsLoading(false);
      }, 
      (err) => {
        if (!isMounted) return;
        trackSovereignError(err, { context: 'MarketPulseListener' });
        setPulseData([]);
        setIsLoading(false);
      }
    );

    return () => {
      isMounted = false;
      setTimeout(() => unsubscribe(), 0);
    };
  }, [enabled, tAuto]);

  return { pulseData, loadingPulse: isLoading };
}
