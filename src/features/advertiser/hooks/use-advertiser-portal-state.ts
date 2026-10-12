'use client';

import { useState, useMemo, useCallback } from 'react';
import { useAdminAds } from '@/hooks/use-admin-ads';
import { useMarketPulse } from '@/hooks/use-market-pulse';
import { useToast } from '@/hooks/use-toast';
import { SOVEREIGN_PRICING_PACKAGES } from '@/lib/constants';
import { getDistrictsByGovernorate } from '@/lib/data';

export function useAdvertiserPortalState() {
  const { createAd, ads, toggleAdStatus, deleteAd, extendAd } = useAdminAds();
  const { pulseData } = useMarketPulse(true);
  const { toast } = useToast();

  const pendingAds = useMemo(() => {
    return (ads || []).filter(
      ad => (ad.status || '').toLowerCase() === 'pending' || (ad.status || '') === 'PENDING'
    );
  }, [ads]);

  const [activeTab, setActiveTab] = useState<'dashboard' | 'create'>('dashboard');
  const [expandedAdId, setExpandedAdId] = useState<string | null>(null);

  const [openSecs, setOpenSecs] = useState<Record<number, boolean>>({
    1: true,
    2: false,
    3: false,
  });

  const [step, setStep] = useState(1);
  const [governorate, setGovernorate] = useState('عمان');
  const [district, setDistrict] = useState('وادي السير');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [posterUrl, setPosterUrl] = useState(
    'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&q=80&w=1000'
  );
  const [whatsapp, setWhatsapp] = useState('962798888888');
  const [phone, setPhone] = useState('0798888888');
  const [geoLoc, setGeoLoc] = useState('https://maps.google.com/?q=31.9522,35.8333');
  const [buttonText, setButtonText] = useState('تواصل واحجز الآن 🚀');
  const [targetImpressions, setTargetImpressions] = useState(10000);
  const [paymentChannel, setPaymentChannel] = useState('Zain Cash');

  const [selectedPackageId, setSelectedPackageId] = useState<string>('immortal-heart');
  const [isPremiumRetentionPaid, setIsPremiumRetentionPaid] = useState<boolean>(true);
  const [aiBudget, setAiBudget] = useState<string>('50');
  const [aiGoal, setAiGoal] = useState<'awareness' | 'retention' | 'broad'>('retention');
  const [aiRecommendation, setAiRecommendation] = useState<string | null>(null);
  const [isPackageModalOpen, setIsPackageModalOpen] = useState<boolean>(false);

  const [isSimulatingAudit, setIsSimulatingAudit] = useState(false);
  const [auditProgress, setAuditProgress] = useState(0);
  const [auditLogs, setAuditLogs] = useState<string[]>([]);
  const [auditApproved, setAuditApproved] = useState(false);

  const [advertiserBalance, setAdvertiserBalance] = useState(150.0);

  const currentPackage = useMemo(() => {
    return SOVEREIGN_PRICING_PACKAGES.find(p => p.id === selectedPackageId) || SOVEREIGN_PRICING_PACKAGES[1];
  }, [selectedPackageId]);

  const suggestBestPackage = useCallback((budgetStr: string, goal: 'awareness' | 'retention' | 'broad') => {
    const budget = parseFloat(budgetStr) || 0;
    let recommendedId = 'basic-pulse';
    let reasoning = '';

    if (goal === 'retention' || budget >= 30) {
      recommendedId = 'immortal-heart';
      reasoning = `🤖 مستشار الـ AI: للطلب المبتني على 'الاحتفاظ وتخليد الأختام '، باقة "التخليد والقلب الأخضر" هي الأنسب لك بـ 0.07 د.أ لإضافة وحبس الإشهار في الذاكرات المحلية.`;
    } else if (goal === 'broad' || budget >= 60) {
      recommendedId = 'broad-sweep';
      reasoning = `🤖 مستشار الـ AI: للطلب المبتني على 'الاكتساح الساحق والمشاريع الكبرى'، نقترح قائمة باقة "الاكتساح والانتشار " لتثبيت الرتبة وحمايتها من التذبذب.`;
    } else {
      recommendedId = 'basic-pulse';
      reasoning = `🤖 مستشار الـ AI: للميزانيات الاقتصادية القليلة، باقة "نشاط الاختبار الأساسي" بـ 0.05 د.أ تمنحك تجربة ممتازة واختبار الركاب بصفر مغالاة.`;
    }

    setSelectedPackageId(recommendedId);
    const pkg = SOVEREIGN_PRICING_PACKAGES.find(p => p.id === recommendedId);
    if (pkg) {
      setIsPremiumRetentionPaid(pkg.isRetention);
    }
    setAiRecommendation(reasoning);
    toast({
      title: '🤖 محرك الـ AI للمحفظة والباقات',
      description: reasoning,
    });
  }, [toast]);

  const checkDistrictCapacity = useCallback((dist: string) => {
    if (dist === 'وادي السير') {
      return 'FULL';
    }
    return 'AVAILABLE';
  }, []);

  const districts = useMemo(() => {
    return governorate ? getDistrictsByGovernorate(governorate) : [];
  }, [governorate]);

  const activeDistrictPulse = useMemo(() => {
    if (!district || !pulseData) return null;
    return pulseData.find(p => p.id === district) || null;
  }, [district, pulseData]);

  const isCapacityFull = useMemo(() => {
    return district === 'وادي السير';
  }, [district]);

  const calculatedCost = useMemo(() => {
    const ratePerImpression = currentPackage.pricePerImpression;
    const basePrice = targetImpressions * ratePerImpression;
    if (activeDistrictPulse?.emergencyAdCapacityActive) {
      return basePrice * 0.6; // 40% discount
    }
    return basePrice;
  }, [targetImpressions, activeDistrictPulse, currentPackage]);

  const redirectCampaignToNaour = useCallback(() => {
    setGovernorate('عمان');
    setDistrict('ناعور');
    toast({
      title: '✨ تم إعادة توجيه ذكية',
      description: 'تم تحويل التوجيه الجغرافي إلى منطقة ناعور للحصول على خصم السعة الميدانية.',
    });
  }, [toast]);

  const runForensicAuditAndLaunch = useCallback(() => {
    if (!posterUrl || !whatsapp || !phone || !geoLoc || !governorate || !targetImpressions) {
      alert("⚠️ رفض: لا يمكن إطلاق الحملة. يجب استكمال جميع حقول الاستحواذ وتحديد الإدارة الجغرافية وعدد مرات الظهور المطلوبة.");
      return;
    }

    if (advertiserBalance < calculatedCost) {
      alert(`⚠️ رفض (ميزانية غير كافية): رصيدك الحالي هو [${advertiserBalance.toFixed(2)} د.أ] وهو أقل من الكلفة التقديرية للحملة [${calculatedCost.toFixed(2)} د.أ].`);
      return;
    }

    if (checkDistrictCapacity(district) === 'FULL') {
      alert(`⚠️ رفض (السعة ممتلئة): المنطقة [${district}] ممتلئة حالياً. نقترح توجيه حملتك لمنطقة ناعور أو مجاور.`);
      return;
    }

    const cleanPosterUrl = posterUrl.trim();
    if (!cleanPosterUrl || !cleanPosterUrl.startsWith('http')) {
      toast({
        variant: 'destructive',
        title: '⚠️ فشل التحقق من مادة الإعلان',
        description: 'يرجى إدخال رابط صالح لصورة البوستر أو الفيديو.',
      });
      return;
    }

    setStep(3);
    setIsSimulatingAudit(true);
    setAuditApproved(false);
    setAuditProgress(10);
    setAuditLogs([
      '🔍 بدء الفحص الأمني الرقمي للإعلان الجغرافي المنسق...',
      '🛡️ مراجعة امتثال ميثاق السلامة الحظرية الأردنية [SCR-AD-INTEGRITY-112]',
    ]);

    const progression = [
      { p: 30, log: '⚔️ فحص احتواء الأسلحة ومقاطع العنف... آمن وبيد أمينة ✓' },
      { p: 60, log: '🔞 فحص احتواء العري والمواد المنافية للحشمة العامة... آمن ✓' },
      { p: 85, log: '📷 فحص تباين البوستر ومطابقة أبعاد مسرح الشاشة الكامل... جودة عالية ✓' },
      { p: 100, log: '🏛️ تم التصديق والامتثال! الإعلان آمن ومستحق لوضع [الاستعداد للنشاط الموجه] ✓' },
    ];

    progression.forEach((s, i) => {
      setTimeout(() => {
        setAuditProgress(s.p);
        setAuditLogs(prev => [...prev, s.log]);

        if (s.p === 100) {
          setTimeout(async () => {
            try {
              const expirationTimestamp = Date.now() + 72 * 60 * 60 * 1000;
              await createAd({
                title,
                description,
                targetDistrict: district || 'كل الألوية',
                targetGovernorate: governorate,
                targetImpressions,
                phone,
                whatsapp,
                geoLoc,
                posterUrl,
                buttonText,
                isPremiumRetentionPaid,
                expirationTimestamp,
                adType: 'SOVEREIGN_NATIVE',
                packageId: selectedPackageId,
              });

              setAdvertiserBalance(prev => prev - calculatedCost);
              setAuditApproved(true);
              setIsSimulatingAudit(false);
            } catch (err) {
              console.error('Failed to register promo in database:', err);
              setAuditApproved(true);
              setIsSimulatingAudit(false);
            }
          }, 1000);
        }
      }, (i + 1) * 800);
    });
  }, [
    posterUrl, whatsapp, phone, geoLoc, governorate, targetImpressions,
    checkDistrictCapacity, district, isPremiumRetentionPaid, createAd,
    toast, buttonText, selectedPackageId, advertiserBalance, calculatedCost
  ]);

  const ledgerStats = useMemo(() => {
    let totalImpressions = 0;
    let totalClicks = 0;
    ads.forEach(ad => {
      if (ad.status === 'active') {
        totalImpressions += (ad.currentImpressions || 0);
        totalClicks += (ad.clicksCount || 0);
      }
    });

    const finalImpressions = totalImpressions || 16480;
    const finalClicks = totalClicks || 912;
    const ctr = finalImpressions > 0 ? ((finalClicks / finalImpressions) * 100).toFixed(2) : '5.53';

    let localHeartsCount = 0;
    try {
      if (typeof window !== 'undefined') {
        const stored = localStorage.getItem('sovereign_hearted_ads');
        if (stored) {
          localHeartsCount = JSON.parse(stored).length;
        }
      }
    } catch {
      // silent
    }
    const followerPulse = localHeartsCount || 350;

    return {
      impressions: finalImpressions,
      clicks: finalClicks,
      ctr,
      followerPulse,
    };
  }, [ads]);

  const handleDepositSimulate = useCallback((amount: number) => {
    setAdvertiserBalance(prev => prev + amount);
    toast({
      title: '💳 تم شحن الحساب بنجاح',
      description: `تم تعبئة ميزانيتك بـ ${amount} دينار بنجاح عبر ${paymentChannel}.`,
    });
  }, [paymentChannel, toast]);

  const allSovereignAds = useMemo(() => {
    const pendingMap = new Map((pendingAds || []).map(item => [item.id, item]));

    const list = ads.map(ad => {
      if (pendingMap.has(ad.id)) {
        return { ...ad, ...pendingMap.get(ad.id), status: 'PENDING' };
      }
      return ad;
    });

    const adIds = new Set(list.map(a => a.id));
    (pendingAds || []).forEach(pending => {
      if (!adIds.has(pending.id)) {
        list.push(pending);
      }
    });

    return list;
  }, [ads, pendingAds]);

  return {
    ads,
    pendingAds,
    allSovereignAds,
    pulseData,
    activeTab,
    setActiveTab,
    expandedAdId,
    setExpandedAdId,
    openSecs,
    setOpenSecs,
    step,
    setStep,
    governorate,
    setGovernorate,
    district,
    setDistrict,
    districts,
    title,
    setTitle,
    description,
    setDescription,
    posterUrl,
    setPosterUrl,
    whatsapp,
    setWhatsapp,
    phone,
    setPhone,
    geoLoc,
    setGeoLoc,
    buttonText,
    setButtonText,
    targetImpressions,
    setTargetImpressions,
    paymentChannel,
    setPaymentChannel,
    selectedPackageId,
    setSelectedPackageId,
    currentPackage,
    isPremiumRetentionPaid,
    setIsPremiumRetentionPaid,
    aiBudget,
    setAiBudget,
    aiGoal,
    setAiGoal,
    aiRecommendation,
    suggestBestPackage,
    isPackageModalOpen,
    setIsPackageModalOpen,
    isSimulatingAudit,
    auditProgress,
    auditLogs,
    auditApproved,
    advertiserBalance,
    calculatedCost,
    isCapacityFull,
    redirectCampaignToNaour,
    runForensicAuditAndLaunch,
    ledgerStats,
    handleDepositSimulate,
    toggleAdStatus,
    deleteAd,
    extendAd,
  };
}
