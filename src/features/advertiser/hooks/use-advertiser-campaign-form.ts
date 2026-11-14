'use client';

import { useState, useMemo, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { SOVEREIGN_PRICING_PACKAGES } from '@/lib/constants';
import { getDistrictsByGovernorate } from '@/lib/data';

export function useAdvertiserCampaignForm(pulseData: any[] | null) {
  const { toast } = useToast();

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

  return {
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
    checkDistrictCapacity,
    calculatedCost,
    isCapacityFull,
    redirectCampaignToNaour,
  };
}
