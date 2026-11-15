import { useState, useEffect, useCallback, useMemo } from 'react';
import { collection, onSnapshot, query } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { trackSovereignError } from '@/lib/error-tracker';
import { SovereignAd } from './admin-ads-types';

export function useAdminAdsData() {
  const [localPromos, setLocalPromos] = useState<SovereignAd[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const cached = localStorage.getItem('sovereign_local_promos');
        return cached ? JSON.parse(cached) : [];
      } catch (e) {
        console.error('Failed loading cached local promos:', e);
      }
    }
    return [];
  });

  const [dbPromos, setDbPromos] = useState<SovereignAd[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const updateLocalPromos = useCallback((updater: (prev: SovereignAd[]) => SovereignAd[]) => {
    setLocalPromos((prev) => {
      const next = updater(prev);
      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem('sovereign_local_promos', JSON.stringify(next));
        } catch (e) {
          console.error('Failed caching local promos:', e);
        }
      }
      return next;
    });
  }, []);

  const ads = useMemo(() => {
    const merged = [...localPromos];
    dbPromos.forEach((dbAd) => {
      if (!merged.some((l) => l.id === dbAd.id)) {
        merged.push(dbAd);
      }
    });
    return merged;
  }, [dbPromos, localPromos]);

  useEffect(() => {
    setIsLoading(true);
    const promosQuery = query(collection(db, 'promos'));

    const unsubscribe = onSnapshot(
      promosQuery,
      (snapshot) => {
        if (snapshot.empty) {
          setDbPromos([]);
        } else {
          const fetchedPromos = snapshot.docs.map((docSnap) => {
            const data = docSnap.data();
            return {
              id: docSnap.id,
              status: data.status || 'active',
              content: {
                title: data.content?.title || data.title || '',
                description: data.content?.description || data.description || '',
                posterUrl: data.content?.posterUrl || data.posterUrl || '',
              },
              phone: data.phone || '0790000000',
              whatsapp: data.whatsapp || '962790000000',
              targetDistrict: data.targetDistrict,
              targetGovernorate: data.targetGovernorate || 'عمان',
              currentImpressions: data.currentImpressions || 0,
              targetImpressions: data.targetImpressions || 10000,
              clicksCount: data.clicksCount || 0,
              role: data.role || 'all',
              endDate: data.endDate || '2026-12-31',
              ...data,
            } as SovereignAd;
          });
          setDbPromos(fetchedPromos);
        }
        setIsLoading(false);
      },
      (error) => {
        trackSovereignError(error, { context: 'FetchPromos_Admin' });
        setIsLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  return {
    ads,
    localPromos,
    dbPromos,
    isLoading,
    updateLocalPromos,
  };
}
