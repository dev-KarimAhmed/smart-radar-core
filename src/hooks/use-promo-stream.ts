import { useState, useEffect } from 'react';
import { collection, onSnapshot, query, where, updateDoc, doc, increment, limit } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { SovereignAd } from '@/core/types';

export function usePromoStream(district?: string, governorate?: string) {
  const [activeAds, setActiveAds] = useState<SovereignAd[]>([]);

  useEffect(() => {
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
          description: 'بسبب حرق الأسعار، تفضل بخصم 50% على غسيل سيارتك أو وجبة شاورما مضاعفة في لواء وادي السير فوراً!',
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
          description: 'لأبناء لواء وادي السير: احصل على تمويل تنموي للمشاريع الحرة بصفر فوائد واستدامة نسيجية.',
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
          title: 'ملتقى تكنولوجيا الجامعة السيادي',
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
          buttonText: 'عرض خريطة الشحن السيادي',
          actionUrl: 'tel:911',
        },
        targetDistrict: 'قصبة عمان',
        targetGovernorate: 'عمان'
      },
      {
        id: 'promo-karkh-baghdad',
        status: 'active',
        content: {
          title: 'بوابة نبض بغداد الكرخ الكبرى',
          description: 'لأهلنا في لواء الكرخ: مبادرة النقل التعاوني بصفر عمولة لخدمة الجامعات والقطاعات الطبية الطارئة.',
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
          title: 'الربط السيادي لمنظومة الرادار الذكي',
          description: 'انضم للأسطول السيادي واجني أرباحاً ترقى لتطلعاتك مع تأمين شامل وحرية مطلقة بصفر عمولة للابد.',
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
      // ترتيب الإعلانات لوضع الإعلانات التي تطابق قطاع اللواء الحالي للمستخدم في المقدمة (السيادة الجغرافية)
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
      const { recordLocalClick } = require('@/lib/ad-cache-sentry');
      recordLocalClick(adId);
      console.log(`[صفر كلفة] تم تسجيل النقرة محلياً للغلاف الإعلاني: ${adId}`);
    } catch (e) {
      const { trackSovereignError } = require('@/lib/error-tracker');
      trackSovereignError(e, { context: 'PromoStreamClick_Failed_Edge', adId });
    }
  };

  return { activeAds, registerClick };
}
export default usePromoStream;
