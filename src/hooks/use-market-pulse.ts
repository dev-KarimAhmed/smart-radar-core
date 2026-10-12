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
          // 🚩 [SCR-MOCK-MARKET] Fallback mock data if the collection is empty
            setPulseData([
              { id: tAuto('wadiSeer'), trend: 'balanced', demand: 5, supply: 5 },
              { id: tAuto('university'), trend: 'high_demand', demand: 8, supply: 2 },
              { id: tAuto('ammanQasaba'), trend: 'high_supply', demand: 2, supply: 8 },
              { id: tAuto('marka'), trend: 'balanced', demand: 4, supply: 4 },
              { id: tAuto('naour'), trend: 'balanced', demand: 5, supply: 5 },
              { id: tAuto('irbidQasaba'), trend: 'high_demand', demand: 9, supply: 3 },
              { id: tAuto('ramtha'), trend: 'balanced', demand: 6, supply: 6 },
              { id: tAuto('zarqaQasaba'), trend: 'high_supply', demand: 3, supply: 7 }
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
          { id: tAuto('wadiSeer'), trend: 'balanced', demand: 5, supply: 5 },
          { id: tAuto('university'), trend: 'high_demand', demand: 8, supply: 2 },
          { id: tAuto('ammanQasaba'), trend: 'high_supply', demand: 2, supply: 8 },
          { id: tAuto('marka'), trend: 'balanced', demand: 4, supply: 4 },
          { id: tAuto('naour'), trend: 'balanced', demand: 5, supply: 5 },
          { id: tAuto('irbidQasaba'), trend: 'high_demand', demand: 9, supply: 3 },
          { id: tAuto('ramtha'), trend: 'balanced', demand: 6, supply: 6 },
          { id: tAuto('zarqaQasaba'), trend: 'high_supply', demand: 3, supply: 7 }
        ]);
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
