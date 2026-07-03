import { useState, useEffect } from 'react';
import { collection, onSnapshot, query, where, updateDoc, doc, increment, limit } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { SovereignAd } from '@/core/types';
import { recordLocalClick } from '@/lib/ad-cache-sentry';
import { trackSovereignError } from '@/lib/error-tracker';

export function usePromoStream(district?: string, governorate?: string) {
  const [activeAds, setActiveAds] = useState<SovereignAd[]>([]);

  useEffect(() => {
    // [SCR-AD-VAULT-128] Mada (1) Zero-Cost Hourly Offline-First Cache Loading with 30-Day Ultimate Purge
    const USER_VAULT_LIFETIME_MS = 30 * 24 * 60 * 60 * 1000;
    if (typeof window !== 'undefined') {
      try {
        const cachedRaw = localStorage.getItem('sovereign_local_ad_cache');
        if (cachedRaw) {
          const cached = JSON.parse(cachedRaw);
          const age = Date.now() - cached.timestamp;
          if (age >= USER_VAULT_LIFETIME_MS) {
            console.log("🛑 [قانون سقوط الأجل USER_VAULT_LIFETIME_MS]: Purging 30-day old browser advertisements.");
            localStorage.removeItem('sovereign_local_ad_cache');
            localStorage.removeItem('sovereign_local_ad_cache_history');
            localStorage.removeItem('sovereign_ad_vault_details');
            localStorage.removeItem('sovereign_hearted_ads');
          } else if (age < 3600000 && cached.ads && cached.ads.length > 0) { // 1 Hour Cache Lifetime
            console.log(`[بروتوكول الأرشيف الإعلاني] تم تدوير الإعلان محلياً 100% من الذاكرة الحافة (العمر: ${Math.round(age / 1000)} ثانية)`);
            setActiveAds(cached.ads);
            return; // Skip server subscription to conserve data and run locally 100%
          }
        }
      } catch (e) {
        console.error('Error reading local ad cache', e);
      }
    }

    const q = query(
      collection(db, 'promos'),
      where('status', '==', 'active'),
      limit(10)
    );

    // Beautiful default fallback ads with Geo-Grid tags for Jordanian & Iraqi districts
    const defaultPromos: SovereignAd[] = [
      {
        id: 'promo-rider-benefit-default',
        status: 'active',
        adType: 'RIDER_BENEFIT',
        content: {
          title: '🎁 كوبون المنفعة والتعويض للركاب الأحرار',
          description: 'بسبب حرق الأسعار، تفضل بخصم 50% على غسيل سيارتك أو وجبة شاورما مضاعفة في منطقة وادي السير فوراً!',
          posterUrl: 'https://images.unsplash.com/photo-1563206767-5b18f218e8de?auto=format&fit=crop&q=80&w=1200',
        },
        action: {
          buttonText: 'احصل على الكوبون المجاني',
          actionUrl: 'https://wa.me/962790000000',
        },
        targetDistrict: 'وادي السير',
        targetGovernorate: 'عمان',
        phone: '0790000000',
        whatsapp: '962790000000'
      },
      {
        id: 'promo-captain-professional-default',
        status: 'active',
        adType: 'CAPTAIN_PROFESSIONAL',
        content: {
          title: '🛠️ مركز تكنولوجيا الزيوت والصيانة المعتمد للناقلين',
          description: 'للقباطنة والناقلين الأحرار: وفر وقت غضبك واستفد من التجميد السعري! احصل على غيار زيت توتال بخصم 25% مجاناً وفحص كمبيوتر فوري لمركبتك.',
          posterUrl: 'https://images.unsplash.com/photo-1486006920555-c77dce18193b?auto=format&fit=crop&q=80&w=1200',
        },
        action: {
          buttonText: 'احجز دور صيانة سريع',
          actionUrl: 'https://wa.me/962790000000',
        },
        targetDistrict: 'وادي السير',
        targetGovernorate: 'عمان',
        phone: '0790000000',
        whatsapp: '962790000000'
      },
      {
        id: 'promo-wadi-seer',
        status: 'active',
        content: {
          title: 'مركز أعمال وادي السير الحرفي المطور',
          description: 'لأبناء منطقة وادي السير: احصل على تمويل تنموي للمشاريع الحرة بصفر فوائد واستدامة محلية.',
          posterUrl: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&q=80&w=1200',
        },
        action: {
          buttonText: 'تقديم طلب التمكين الميداني',
          actionUrl: 'tel:911',
        },
        targetDistrict: 'وادي السير',
        targetGovernorate: 'عمان'
      },
      {
        id: 'promo-university',
        status: 'active',
        content: {
          title: 'ملتقى تكنولوجيا الجامعة ',
          description: 'لرواد قطاع الجامعة: حلول الذكاء الاصطناعي كحارس أمين (AI Sentry) وحلول الحوسبة السحابية الحرة بميزانية صفرية.',
          posterUrl: 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&q=80&w=1200',
        },
        action: {
          buttonText: 'احجز مقعدك مجاناً',
          actionUrl: 'https://wa.me/962',
        },
        targetDistrict: 'الجامعة',
        targetGovernorate: 'عمان'
      },
      {
        id: 'promo-qasbah-amman',
        status: 'active',
        content: {
          title: 'مجمعات قصبة عمان للتبادل اللوجستي',
          description: 'لصناع النقل في قصبة عمان: مأوى آمن لسيارات الطاقة المستدامة ونقاط شحن مجانية بالكامل بدعم لوائي.',
          posterUrl: 'https://images.unsplash.com/photo-1519003722824-192d992a60b1?auto=format&fit=crop&q=80&w=1200',
        },
        action: {
          buttonText: 'عرض خريطة الشحن ',
          actionUrl: 'tel:911',
        },
        targetDistrict: 'قصبة عمان',
        targetGovernorate: 'عمان'
      },
      {
        id: 'promo-karkh-baghdad',
        status: 'active',
        content: {
          title: 'بوابة نشاط بغداد الكرخ الكبرى',
          description: 'لأهلنا في منطقة الكرخ: مبادرة النقل التعاوني بصفر عمولة لخدمة الجامعات والقطاعات الطبية الطارئة.',
          posterUrl: 'https://images.unsplash.com/photo-1549488344-1f9b8d2bd1f3?auto=format&fit=crop&q=80&w=1200',
        },
        action: {
          buttonText: 'تفاصيل الخدمة الإنسانية',
          actionUrl: 'https://wa.me/964',
        },
        targetDistrict: 'بغداد/الكرخ',
        targetGovernorate: 'بغداد'
      },
      {
        id: 'promo-global',
        status: 'active',
        content: {
          title: 'الربط  لمنظومة الرادار الذكي',
          description: 'انضم للأسطول  واجني أرباحاً ترقى لتطلعاتك مع تأمين شامل وحرية مطلقة بصفر عمولة للابد.',
          posterUrl: 'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?auto=format&fit=crop&q=80&w=1200',
        },
        action: {
          buttonText: 'تسجيل ناقل جديد',
          actionUrl: 'tel:911',
        }
      }
    ];

    const handleAdsPipeline = (rawDocs: any[]) => {
      let parsedAds = rawDocs.map(docSnap => {
        const data = docSnap.data();
        return {
          id: docSnap.id,
          status: data.status,
          content: {
            title: data.content?.title || data.title || '',
            description: data.content?.description || data.description || '',
            posterUrl: data.content?.posterUrl || data.posterUrl || '',
          },
          action: {
            buttonText: data.action?.buttonText || data.buttonText || '',
            actionUrl: data.action?.actionUrl || data.actionUrl || '',
          },
          targetDistrict: data.targetDistrict,
          targetGovernorate: data.targetGovernorate,
          ...data,
        } as SovereignAd;
      });

      if (parsedAds.length === 0) {
        parsedAds = defaultPromos;
      }

      // [عمارة الصفر كلفة - التجميع الجغرافي عند الحافة]
      // ترتيب الإعلانات لوضع الإعلانات التي تطابق قطاع المنطقة الحالي للمستخدم في المقدمة (الإدارة الجغرافية)
      const sorted = [...parsedAds].sort((a, b) => {
        const aMatchesDistrict = district && a.targetDistrict === district;
        const bMatchesDistrict = district && b.targetDistrict === district;
        if (aMatchesDistrict && !bMatchesDistrict) return -1;
        if (!aMatchesDistrict && bMatchesDistrict) return 1;

        const aMatchesGov = governorate && a.targetGovernorate === governorate;
        const bMatchesGov = governorate && b.targetGovernorate === governorate;
        if (aMatchesGov && !bMatchesGov) return -1;
        if (!aMatchesGov && bMatchesGov) return 1;

        return 0; // متساوية
      });

      // [SCR-AD-VAULT-128] Saving to local Cache and Purging Expired non-hearted ads
      if (typeof window !== 'undefined') {
        try {
          // Save to hourly cache
          localStorage.setItem('sovereign_local_ad_cache', JSON.stringify({
            timestamp: Date.now(),
            ads: sorted
          }));

          const previouslyCachedRaw = localStorage.getItem('sovereign_local_ad_cache_history');
          const previousAdsList: any[] = previouslyCachedRaw ? JSON.parse(previouslyCachedRaw) : [];

          const previousIds = previousAdsList.map(a => a.id);
          const freshIds = sorted.map(a => a.id);

          // Expired indices: were in former cache list, but now missing from active Firestore pipeline
          const expiredIds = previousIds.filter(id => !freshIds.includes(id));

          if (expiredIds.length > 0) {
            const heartedRaw = localStorage.getItem('sovereign_hearted_ads') || '[]';
            const heartedIds: string[] = JSON.parse(heartedRaw);

            const vaultDetailsRaw = localStorage.getItem('sovereign_ad_vault_details') || '{}';
            const vaultDetails = JSON.parse(vaultDetailsRaw);
            let detailsChanged = false;

            let heartedChanged = false;
            let heartedIdsCopy = [...heartedIds];

            expiredIds.forEach(expiredId => {
              const isHearted = heartedIdsCopy.includes(expiredId);
              const expiredAd = vaultDetails[expiredId];
              const isRegular = expiredAd && (expiredAd.packageId === 'basic-pulse' || expiredAd.isPremiumRetentionPaid === false);

              if (!isHearted || isRegular) {
                // State A: Transitory, not hearted OR a regular (non-retention) ad -> Purge fully from local storage
                if (vaultDetails[expiredId]) {
                  delete vaultDetails[expiredId];
                  detailsChanged = true;
                }
                if (isHearted) {
                  heartedIdsCopy = heartedIdsCopy.filter(id => id !== expiredId);
                  heartedChanged = true;
                }
                console.log(`[حذف وسقوط الأجل] تم مسح وإيقاف الإعلان العابر ${expiredId} لانتهاء صلاحيته على الخادم  أو لكونه يتبع الباقة العادية.`);
              } else {
                // State B: Hearted and Premium/Retention -> Mummified and preserved offline-first
                console.log(`[الإدارة التخليدية] تم تخليد الإعلان الفاخر ${expiredId} في خزنة الهاتف نظراً لإشارة القبضة الخضراء 💚`);
              }
            });

            if (detailsChanged) {
              localStorage.setItem('sovereign_ad_vault_details', JSON.stringify(vaultDetails));
            }
            if (heartedChanged) {
              localStorage.setItem('sovereign_hearted_ads', JSON.stringify(heartedIdsCopy));
            }
          }

          // Update cache history for future comparisons
          localStorage.setItem('sovereign_local_ad_cache_history', JSON.stringify(sorted));
        } catch (e) {
          console.error('[الأرشيف والطهير] فشل في تنفيذ دورة حياة الحذف الذاتي', e);
        }
      }

      setActiveAds(sorted);
    };

    const unsubscribe = onSnapshot(q, (snapshot) => {
      if (snapshot.empty) {
        handleAdsPipeline([]);
      } else {
        handleAdsPipeline(snapshot.docs);
      }
    }, (error) => {
      console.error('Error listening to promos:', error);
      // Fallback on permission/network error
      handleAdsPipeline([]);
    });

    return () => unsubscribe();
  }, [district, governorate]);

  const registerClick = async (adId: string, locationStr: string) => {
    try {
      recordLocalClick(adId);
      console.log(`[صفر كلفة] تم تسجيل النقرة محلياً للغلاف الإعلاني: ${adId}`);
    } catch (e) {
      trackSovereignError(e, { context: 'PromoStreamClick_Failed_Edge', adId });
    }
  };

  return { activeAds, registerClick };
}
export default usePromoStream;
