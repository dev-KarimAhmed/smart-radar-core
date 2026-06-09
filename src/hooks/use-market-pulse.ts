'use client';

import { useState, useEffect } from 'react';
import { collection, onSnapshot, query } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { trackSovereignError } from '@/lib/error-tracker';
import type { MarketPulse } from '@/core/types';

export function useMarketPulse(enabled = true) {
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
          // 🚩 [SCR-MOCK-MARKET] Fallback mock data if the collection is empty
          setPulseData([
            { id: 'وادي السير', trend: 'balanced', demand: 5, supply: 5 },
            { id: 'الجامعة', trend: 'high_demand', demand: 8, supply: 2 },
            { id: 'قصبة عمان', trend: 'high_supply', demand: 2, supply: 8 },
            { id: 'ماركا', trend: 'balanced', demand: 4, supply: 4 },
            { id: 'ناعور', trend: 'balanced', demand: 5, supply: 5 },
            { id: 'قصبة إربد', trend: 'high_demand', demand: 9, supply: 3 },
            { id: 'الرمثا', trend: 'balanced', demand: 6, supply: 6 },
            { id: 'قصبة الزرقاء', trend: 'high_supply', demand: 3, supply: 7 }
          ]);
        } else {
          setPulseData(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as MarketPulse)));
        }
        setIsLoading(false);
      }, 
      (err) => {
        if (!isMounted) return;
        trackSovereignError(err, { context: 'MarketPulseListener' });
        
        // Fallback on permission/CORS error in preview
        setPulseData([
          { id: 'وادي السير', trend: 'balanced', demand: 5, supply: 5 },
          { id: 'الجامعة', trend: 'high_demand', demand: 8, supply: 2 },
          { id: 'قصبة عمان', trend: 'high_supply', demand: 2, supply: 8 },
          { id: 'ماركا', trend: 'balanced', demand: 4, supply: 4 },
          { id: 'ناعور', trend: 'balanced', demand: 5, supply: 5 },
          { id: 'قصبة إربد', trend: 'high_demand', demand: 9, supply: 3 },
          { id: 'الرمثا', trend: 'balanced', demand: 6, supply: 6 },
          { id: 'قصبة الزرقاء', trend: 'high_supply', demand: 3, supply: 7 }
        ]);
        setIsLoading(false);
      }
    );

    return () => {
      isMounted = false;
      setTimeout(() => unsubscribe(), 0);
    };
  }, [enabled]);

  return { pulseData, loadingPulse: isLoading };
}
