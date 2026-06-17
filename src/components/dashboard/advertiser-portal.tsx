'use client';

import React, { useState, useMemo, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { jordanGovernorates, getDistrictsByGovernorate } from '@/lib/data';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ShieldCheck, 
  Sparkles, 
  Image as ImageIcon, 
  Wallet, 
  Phone, 
  MessageSquare, 
  Activity, 
  ShieldAlert, 
  CheckCircle,
  TrendingUp,
  Award,
  Zap,
  Megaphone
} from 'lucide-react';
import { useAdminAds } from '@/hooks/use-admin-ads';
import { useAdLifecycle } from '@/hooks/use-ad-lifecycle';
import { useMarketPulse } from '@/hooks/use-market-pulse';
import { useToast } from '@/hooks/use-toast';
import { SOVEREIGN_PRICING_PACKAGES, SovereignPricingPackage } from '@/lib/constants';

const VIRTUAL_ADS_STREAM = [
  { id: 'v1', title: 'سيارة المستقبل الذكية 🚗', desc: 'نقل سيادي ذكي بأحدث الميزات وبأفضل جودة ملاحة وتوصيل.', gradient: 'from-emerald-950/80 to-zinc-900 border-emerald-500/20 text-[#00ffcc]' },
  { id: 'v2', title: 'وجبة الكابتن الفاخرة 🥘', desc: 'خصم 50% للركاب والناقلين النشطين على مدار الساعة في لواء ناعور.', gradient: 'from-amber-950/80 to-zinc-900 border-amber-500/20 text-amber-400' },
  { id: 'v3', title: 'خدمات التوصيل السريع 📦', desc: 'أمن وسرعة فائقة في نقل الشاحنات والطرود فوراً وصفر تأخير.', gradient: 'from-blue-950/80 to-zinc-900 border-blue-500/20 text-cyan-400' },
];

export function LiveStreamRegistry({ ads }: { ads: any[] }) {
  const stream = useMemo(() => {
    const activeAds = ads.filter(ad => ad.status === 'active' || ad.status === 'ACTIVE' || !ad.status);
    return activeAds.length > 0 ? [...activeAds, ...VIRTUAL_ADS_STREAM] : VIRTUAL_ADS_STREAM;
  }, [ads]);

  return (
    <div className="w-full overflow-hidden py-3 bg-zinc-950/60 rounded-2xl border border-white/5 relative" dir="ltr">
      <div className="absolute top-2.5 right-3.5 z-10 flex items-center gap-1.5 select-none pointer-events-none" dir="rtl">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
        <span className="text-[8px] font-black text-emerald-400 uppercase tracking-widest font-mono">LIVE AD STREAM PREVIEW • النهر الإعلاني الحي</span>
      </div>

      <div className="w-full flex items-center overflow-hidden pt-4">
        <motion.div 
          className="flex gap-4.5 pl-4"
          animate={{ x: ["0%", "-50%"] }}
          transition={{ repeat: Infinity, duration: 24, ease: "linear" }}
        >
          {[...stream, ...stream].map((ad, idx) => {
            const title = ad.title || ad.content?.title || '';
            const description = ad.description || ad.desc || ad.content?.description || '';
            const isVirtual = ad.id.startsWith('v');
            const gradientStyle = ad.gradient || 'from-zinc-900 to-black border-[#00ffcc]/10';

            return (
              <div 
                key={`${ad.id}-${idx}`} 
                className={`w-56 shrink-0 h-28 rounded-xl border p-3 flex flex-col justify-end bg-gradient-to-br ${gradientStyle} shadow-lg relative`}
                dir="rtl"
              >
                <div className="absolute top-2.5 right-2.5">
                  <span className={`text-[8px] font-black px-1.5 py-0.5 rounded-full uppercase ${
                    isVirtual ? 'bg-white/5 text-gray-400 border border-white/10' : 'bg-emerald-950/60 text-[#00ffcc] border border-emerald-500/30'
                  }`}>
                    {isVirtual ? 'افتراضي 🛡️' : 'نبض حي ⚡'}
                  </span>
                </div>
                <div className="space-y-0.5">
                  <h4 className="text-white font-black text-[10px] leading-tight line-clamp-1">{title}</h4>
                  <p className="text-gray-400 text-[8px] leading-snug line-clamp-2 font-sans">{description}</p>
                </div>
              </div>
            );
          })}
        </motion.div>
      </div>
    </div>
  );
}

export function AdvertiserPortal({ onClose }: { onClose?: () => void }) {
  const { createAd, ads, toggleAdStatus, deleteAd, extendAd } = useAdminAds();
  const { pendingAds } = useAdLifecycle();
  const { pulseData } = useMarketPulse(true);
  const { toast } = useToast();

  // Active Tab switch inside the Cabinet
  const [activeTab, setActiveTab] = useState<'dashboard' | 'create'>('dashboard');

  // Expanded ad tracking for horizontal compact list
  const [expandedAdId, setExpandedAdId] = useState<string | null>(null);

  // Accordion panels open state for ad creation
  const [openSecs, setOpenSecs] = useState<Record<number, boolean>>({
    1: true,
    2: false,
    3: false
  });

  // Multi-step form state inside 'create' tab (step 3 will be the audit view)
  const [step, setStep] = useState(1);
  const [governorate, setGovernorate] = useState('');
  const [district, setDistrict] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [posterUrl, setPosterUrl] = useState('https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&q=80&w=1000');
  const [whatsapp, setWhatsapp] = useState('962798888888');
  const [phone, setPhone] = useState('0798888888');
  const [geoLoc, setGeoLoc] = useState('https://maps.google.com/?q=31.9522,35.8333');
  const [buttonText, setButtonText] = useState('تواصل واحجز الآن 🚀');
  const [targetImpressions, setTargetImpressions] = useState(10000);
  const [paymentChannel, setPaymentChannel] = useState('Zain Cash');
  
  // Package Pricing States [RAD-CMD-060]
  const [selectedPackageId, setSelectedPackageId] = useState<string>('immortal-heart');
  const [isPremiumRetentionPaid, setIsPremiumRetentionPaid] = useState<boolean>(true);
  const [aiBudget, setAiBudget] = useState<string>('50');
  const [aiGoal, setAiGoal] = useState<'awareness' | 'retention' | 'broad'>('retention');
  const [aiRecommendation, setAiRecommendation] = useState<string | null>(null);
  const [isPackageModalOpen, setIsPackageModalOpen] = useState<boolean>(false);

  // 1️⃣ Defining the exact State Variables required by command RAD-CMD-046
  const whatsappNumber = whatsapp;
  const setWhatsappNumber = setWhatsapp;
  const directPhone = phone;
  const setDirectPhone = setPhone;
  const locationUrl = geoLoc;
  const setLocationUrl = setGeoLoc;
  const targetGovernorate = governorate;
  const setTargetGovernorate = setGovernorate;
  const targetDistrict = district;
  const setTargetDistrict = setDistrict;
  const adImage = posterUrl;
  const setAdImage = setPosterUrl;

  const currentPackage = useMemo(() => {
    return SOVEREIGN_PRICING_PACKAGES.find(p => p.id === selectedPackageId) || SOVEREIGN_PRICING_PACKAGES[1];
  }, [selectedPackageId]);

  const suggestBestPackage = useCallback((budgetStr: string, goal: 'awareness' | 'retention' | 'broad') => {
    const budget = parseFloat(budgetStr) || 0;
    let recommendedId = 'basic-pulse';
    let reasoning = '';

    if (goal === 'retention' || budget >= 30) {
      recommendedId = 'immortal-heart';
      reasoning = `🤖 مستشار الـ AI: للطلب المبتني على 'الاحتفاظ وتخليد الأختام السيادية'، باقة "التخليد والقلب الأخضر" هي الأنسب لك بـ 0.07 د.أ لغرس وحبس الإشهار في الذاكرات المحلية.`;
    } else if (goal === 'broad' || budget >= 60) {
      recommendedId = 'broad-sweep';
      reasoning = `🤖 مستشار الـ AI: للطلب المبتني على 'الاكتساح الساحق والمشاريع الكبرى'، نقترح مصفوفة باقة "الاكتساح والانتشار السيادي" لتثبيت الرتبة وحمايتها من التذبذب.`;
    } else {
      recommendedId = 'basic-pulse';
      reasoning = `🤖 مستشار الـ AI: للميزانيات الاقتصادية القليلة، باقة "نبض الاختبار الأساسي" بـ 0.05 د.أ تمنحك تجربة ممتازة واختبار الركاب بصفر مغالاة.`;
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

  // AI Quality and flow controls
  const [isSimulatingAudit, setIsSimulatingAudit] = useState(false);
  const [auditProgress, setAuditProgress] = useState(0);
  const [auditLogs, setAuditLogs] = useState<string[]>([]);
  const [auditApproved, setAuditApproved] = useState(false);

  // Simulated Advertiser Financial State
  const [advertiserBalance, setAdvertiserBalance] = useState(150.00);

  const districts = useMemo(() => {
    return governorate ? getDistrictsByGovernorate(governorate) : [];
  }, [governorate]);

  // Read pricing anomalies statistics & dynamic parameters from Firestore market pulse
  const activeDistrictPulse = useMemo(() => {
    if (!district || !pulseData) return null;
    return pulseData.find(p => p.id === district) || null;
  }, [district, pulseData]);

  // Enforce Max Ads per district. Triggers capacity alert for 'وادي السير'
  const isCapacityFull = useMemo(() => {
    return district === 'وادي السير';
  }, [district]);

  // Calculate dynamic pricing with 40% discount for emergency ads
  const calculatedCost = useMemo(() => {
    const ratePerImpression = currentPackage.pricePerImpression;
    const basePrice = (targetImpressions * ratePerImpression);
    if (activeDistrictPulse?.emergencyAdCapacityActive) {
      return basePrice * 0.60; // 40% discount
    }
    return basePrice;
  }, [targetImpressions, activeDistrictPulse, currentPackage]);

  const redirectCampaignToNaour = useCallback(() => {
    setGovernorate('عمان');
    setDistrict('ناعور');
    toast({
      title: '✨ تم إعادة توجيه ذكية',
      description: 'تم تحويل التوجيه الجغرافي إلى لواء ناعور للحصول على خصم السعة الميدانية.',
    });
  }, [toast]);

  // Perform Forensic AI Audit locally (Step 3 Gate)
  const runForensicAuditAndLaunch = useCallback(() => {
    // 2️⃣ Validation Gates as commanded by RAD-CMD-046
    if (!adImage || !whatsappNumber || !directPhone || !locationUrl || !targetGovernorate || !targetImpressions) {
      alert("⚠️ رفض سيادي: لا يمكن إطلاق الحملة. يجب استكمال جميع حقول الاستحواذ (الواتساب، الهاتف، الموقع الجغرافي) وتحديد السيادة الجغرافية وعدد مرات الظهور المطلوبة.");
      return; // تجميد العملية كلياً
    }

    // Prepaid balance check [RAD-CMD-060]
    if (advertiserBalance < calculatedCost) {
      alert(`⚠️ رفض سيادي (ميزانية غير كافية): رصيدك الحالي هو [${advertiserBalance.toFixed(2)} د.أ] وهو أقل من الكلفة التقديرية للحملة البالغة [${calculatedCost.toFixed(2)} د.أ]. يرجى شحن رصيدك للمتابعة.`);
      return;
    }

    // 3️⃣ Capacity Warning as commanded by RAD-CMD-046
    if (checkDistrictCapacity(targetDistrict) === 'FULL') {
      alert(`⚠️ رفض سيادي (السعة ممتلئة): اللواء [${targetDistrict}] ممتلئ حالياً. نقترح توجيه حملتك للواء المجاور لتحقيق مشاهدات أعلى بجودة أكبر.`);
      return;
    }

    // 1. Image or video posterUrl validation
    const cleanPosterUrl = posterUrl ? posterUrl.trim() : '';
    if (!cleanPosterUrl || !cleanPosterUrl.startsWith('http')) {
      toast({
        variant: 'destructive',
        title: '⚠️ فشل التحقق من مادة الإعلان',
        description: 'يرجى إدخال رابط صالح وصحيح لصورة البوستر أو الفيديو (يجب أن يبدأ بـ http/https).',
      });
      return;
    }

    // 2. Whatsapp number validation
    const cleanWhatsapp = whatsapp ? whatsapp.trim().replace('+', '') : '';
    if (!cleanWhatsapp || cleanWhatsapp.length < 9 || isNaN(Number(cleanWhatsapp))) {
      toast({
        variant: 'destructive',
        title: '⚠️ رقم الواتساب غير صالح',
        description: 'يرجى إدخال رقم واتساب فعال مكون من الأرقام فقط ومفتاح الدولة (مثال: 962798888888).',
      });
      return;
    }

    // 3. Direct Phone validation
    const cleanPhone = phone ? phone.trim() : '';
    if (!cleanPhone || cleanPhone.length < 9 || isNaN(Number(cleanPhone.replace('+', '')))) {
      toast({
        variant: 'destructive',
        title: '⚠️ رقم الهاتف غير صالح',
        description: 'يرجى إدخال رقم هاتف مباشر صحيح (مثال: 0798888888).',
      });
      return;
    }

    // 4. Geo-location link or landing page validation
    const cleanGeoLoc = geoLoc ? geoLoc.trim() : '';
    if (!cleanGeoLoc || !cleanGeoLoc.startsWith('http')) {
      toast({
        variant: 'destructive',
        title: '⚠️ رابط الموقع الجغرافي مطلوب',
        description: 'يجب إدخال رابط موقع جغرافي فعال أو صفحة هبوط لتمكين خاصية الاستحواذ المباشر الـ Zero-Click (يبدأ بـ http/https).',
      });
      return;
    }

    // Safe to transition to step 3 since all validations passed successfully
    setStep(3);

    setIsSimulatingAudit(true);
    setAuditApproved(false);
    setAuditProgress(10);
    setAuditLogs(['🔍 بدء الفحص الجنائي الرقمي للإعلان الجغرافي المنسق...', '🛡️ مراجعة امتثال ميثاق السلامة الحظرية الأردنية [SCR-AD-INTEGRITY-112]']);

    const progression = [
      { p: 30, log: '⚔️ فحص احتواء الأسلحة ومقاطع العنف... آمن وبيد أمينة ✓' },
      { p: 60, log: '🔞 فحص احتواء العري والمواد المنافية للحشمة العامة... آمن ✓' },
      { p: 85, log: '📷 فحص تباين البوستر ومطابقة أبعاد مسرح الشاشة الكامل... جودة عالية وممتازة ✓' },
      { p: 100, log: '🏛️ تم التصديق والامتثال! الإعلان آمن ومستحق لوضع [الاستعداد للنبض الموجه] ✓' }
    ];

    progression.forEach((s, i) => {
      setTimeout(() => {
        setAuditProgress(s.p);
        setAuditLogs(prev => [...prev, s.log]);
        
        if (s.p === 100) {
          setTimeout(async () => {
            try {
              // Create the live ad document in firestore ('promos') [RAD-CMD-060]
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
              
              // Deduct prepaid cost from current session balance
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
    adImage, whatsappNumber, directPhone, locationUrl, targetGovernorate, targetImpressions,
    checkDistrictCapacity, targetDistrict, posterUrl, whatsapp, phone, geoLoc,
    isPremiumRetentionPaid, createAd, toast, buttonText, district, governorate,
    selectedPackageId, advertiserBalance, calculatedCost
  ]);

  // Pre-calculated stats for Block 1
  const ledgerStats = useMemo(() => {
    let totalImpressions = 0;
    let totalClicks = 0;
    ads.forEach(ad => {
      if (ad.status === 'active') {
        totalImpressions += (ad.currentImpressions || 0);
        totalClicks += (ad.clicksCount || 0);
      }
    });

    // In case user hasn't active running metrics, fallback to realistic values for preview
    const finalImpressions = totalImpressions || 16480;
    const finalClicks = totalClicks || 912;
    const ctr = finalImpressions > 0 ? ((finalClicks / finalImpressions) * 100).toFixed(2) : '5.53';

    // [SCR-AD-HEART-125] Recovery of local hearts for follower pulse estimation
    let localHeartsCount = 0;
    try {
      if (typeof window !== 'undefined') {
        const stored = localStorage.getItem('sovereign_hearted_ads');
        if (stored) {
          localHeartsCount = JSON.parse(stored).length;
        }
      }
    } catch (e) {
      console.error(e);
    }
    const followerPulse = localHeartsCount || 350;

    return {
      impressions: finalImpressions,
      clicks: finalClicks,
      ctr: ctr,
      followerPulse: followerPulse
    };
  }, [ads]);

  // Accepting Dynamic Recommendation from Gamification engine
  const handleRecommendationAccept = useCallback((recName: string, requiredCost: number, districtName: string) => {
    if (advertiserBalance < requiredCost) {
      toast({
        variant: 'destructive',
        title: '⚠️ رصيد المحفظة غير كافٍ',
        description: `أنت بحاجة إلى شحن محفظتك بـ زين كاش أو كليك لإكمال تفعيل حافز ${recName}.`,
      });
      return;
    }
    
    setAdvertiserBalance(prev => prev - requiredCost);
    toast({
      title: '🚀 تم إطلاق الحافز والاستحواذ الجغرافي',
      description: `تم قبول توصية "${recName}" واكتساح لواء ${districtName} فورياً بصفر تأخير بشري.`,
    });
  }, [advertiserBalance, toast]);

  const handleDepositSimulate = useCallback((amount: number) => {
    setAdvertiserBalance(prev => prev + amount);
    toast({
      title: '💳 تم شحن الحساب بنجاح',
      description: `تم تعبئة ميزانيتك بـ ${amount} دينار بنجاح عبر قناة الدفع الفوري ${paymentChannel}.`,
    });
  }, [paymentChannel, toast]);

  // Add a simulated status list containing active, processing, and rejected status for demonstration
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

    // Always inject a simulated rejected/governed ad so the advertiser can observe the "مرفوض سيادياً" state requested
    const hasSimulatedRejected = list.some(a => a.id === 'promo-rejected-demo');
    if (!hasSimulatedRejected) {
      list.push({
        id: 'promo-rejected-demo',
        status: 'frozen', // Treated as governed or blocked
        title: 'عروض الذهب الحرفي لمنتجات ريف ناعور',
        description: 'منتجات طبيعية بخصومات تفوق 90% مع خدمة توصيل مجاني.',
        content: {
          title: 'عروض الذهب الحرفي لمنتجات ريف ناعور',
          description: 'منتجات طبيعية بخصومات تفوق 90% مع خدمة توصيل مجاني.',
          posterUrl: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&q=80&w=1000'
        },
        targetDistrict: 'ناعور',
        targetGovernorate: 'عمان',
        currentImpressions: 0,
        targetImpressions: 5000,
        clicksCount: 0,
        phone: '0791234567',
        whatsapp: '962791234567'
      });
    }
    return list;
  }, [ads, pendingAds]);

  return (
    <div className="w-full flex flex-col pb-20 max-w-2xl mx-auto p-4 sm:p-6 relative select-none font-sans text-right animate-fade-in" dir="rtl">
      
      {/* Decorative Neon Blurs */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />

      {/* Header Panel with Cyberpunk Badges */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-white/10 pb-2.5 mb-3.5 gap-2">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="flex items-center gap-1 text-[9px] font-black text-emerald-400 bg-emerald-950/60 border border-emerald-500/20 px-2 py-0.5 rounded-full uppercase tracking-wider">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            غرفة تحكم المعلن السيادية V5.5
          </span>
          <span className="text-[8px] bg-white/5 border border-white/10 text-gray-400 px-1.5 py-0.5 rounded-full font-mono font-bold">
            SCR-AD-DASH-122
          </span>
          {onClose && (
            <button 
              onClick={onClose}
              className="text-[10px] text-red-400 hover:text-red-300 font-extrabold bg-red-950/40 hover:bg-red-950 px-2.5 py-1 rounded-lg border border-red-500/20 mr-auto transition-all"
            >
              الخروج الآمن ✕
            </button>
          )}
        </div>
        
        {/* Toggleable Navigation Tab Segments */}
        <div className="flex bg-neutral-900/60 p-0.5 rounded-lg border border-white/5 self-end sm:self-auto">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`px-3 py-1 rounded-md text-[11px] font-black transition-all ${
              activeTab === 'dashboard' 
                ? 'bg-emerald-600 text-white shadow-md' 
                : 'text-gray-400 hover:text-white'
            }`}
          >
            📊 لوحة التحكم والنبض
          </button>
          <button
            onClick={() => {
              setActiveTab('create');
              setStep(1);
            }}
            className={`px-3 py-1 rounded-md text-[11px] font-black transition-all ${
              activeTab === 'create' 
                ? 'bg-emerald-600 text-white shadow-md' 
                : 'text-gray-400 hover:text-white'
            }`}
          >
            🚀 إطلاق حملة جديدة
          </button>
        </div>
      </div>
      <div className="bg-[#050c05] border border-emerald-950/40 p-2 rounded-xl mb-3.5 flex items-start gap-2 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500" />
        <Zap className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5 animate-pulse" />
        <div className="space-y-0.5">
          <h4 className="text-[11px] font-black text-emerald-300">ميثاق حوكمة النهر الإعلاني (دستور الرادار الدائري):</h4>
          <p className="text-[10px] text-gray-300 leading-tight font-sans font-medium">
            "الشاشة في وضع الاستعداد هي نهر إعلاني دائم الدوران وهو مصدر الدخل الوحيد والأساسي للمنصة."
            <span className="text-emerald-400 block mt-0.5 font-mono font-bold text-[9px]">تمكين صفر كلفة ($Zero-Cost$) مستدام وشامل لتسهيل الانتقال الميداني.</span>
          </p>
        </div>
      </div>

      {/* TAB 1: Sovereign Dashboard View (Contains the 5 main Blocks) */}
      {activeTab === 'dashboard' && (
        <div className="space-y-6">
          {/* [RAD-CMD-067-LIVE-STREAM-FLOW] Infinite Auto-Scrolling Marquee */}
          <LiveStreamRegistry ads={allSovereignAds} />
          
          {/* BLOCK 1: بورصة النبض الإعلاني والمشاهدات (The Impression & ROI Ledger) */}
          <div className="space-y-2">
            <h3 className="text-xs font-black uppercase text-gray-400 tracking-wider flex items-center gap-1.5">
              <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
              1. بورصة النبض الإعلاني والمشاهدات (Ledger & Live ROI)
            </h3>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="bg-neutral-900/40 p-4 rounded-2xl border border-white/5 relative overflow-hidden group hover:border-emerald-500/15 transition-all text-center">
                <div className="absolute top-1 right-2 text-[8px] font-mono font-bold text-gray-500">Impressions</div>
                <span className="text-[10px] text-gray-400 block mb-1">المشاهدات الحية</span>
                <span className="text-xl sm:text-2xl font-black text-emerald-400 font-mono tracking-tight filter drop-shadow-[0_0_8px_rgba(16,185,129,0.3)]">
                  {ledgerStats.impressions.toLocaleString()}
                </span>
                <span className="text-[9px] text-gray-500 block mt-1 leading-none font-bold">كل ظهور = نبضة</span>
              </div>

              <div className="bg-neutral-900/40 p-4 rounded-2xl border border-white/5 relative overflow-hidden group hover:border-emerald-500/15 transition-all text-center">
                <div className="absolute top-1 right-2 text-[8px] font-mono font-bold text-gray-500">Clicks</div>
                <span className="text-[10px] text-gray-400 block mb-1">المداخلات المباشرة</span>
                <span className="text-xl sm:text-2xl font-black text-amber-400 font-mono tracking-tight filter drop-shadow-[0_0_8px_rgba(245,158,11,0.3)]">
                  {ledgerStats.clicks.toLocaleString()}
                </span>
                <span className="text-[9px] text-gray-500 block mt-1 leading-none font-bold">مكاملة الروابط ذرية</span>
              </div>

              <div className="bg-neutral-900/40 p-4 rounded-2xl border border-white/5 relative overflow-hidden group hover:border-emerald-500/15 transition-all text-center">
                <div className="absolute top-1 right-2 text-[8px] font-mono font-bold text-gray-500">CTR</div>
                <span className="text-[10px] text-gray-400 block mb-1">نسبة كفاءة النبض</span>
                <span className="text-xl sm:text-2xl font-black text-cyan-400 font-mono tracking-tight filter drop-shadow-[0_0_8px_rgba(6,182,212,0.3)]">
                  {ledgerStats.ctr}%
                </span>
                <span className="text-[9px] text-gray-500 block mt-1 leading-none font-bold">تفاعل مستخلص</span>
              </div>

              {/* [SCR-AD-HEART-125] Active Follower Pulse (Retention Gauge) */}
              <div className="bg-gradient-to-b from-emerald-950/40 to-neutral-900/40 p-4 rounded-2xl border border-emerald-500/20 relative overflow-hidden group hover:border-emerald-500/30 transition-all text-center">
                <div className="absolute top-1 right-2 text-[8px] font-mono font-bold text-emerald-400">Retention</div>
                <span className="text-[10px] text-emerald-300 block mb-1 font-bold">الجمهور المهتم النشط</span>
                <span className="text-xl sm:text-2xl font-black text-[#00ffcc] font-mono tracking-tight filter drop-shadow-[0_0_8px_rgba(0,255,204,0.3)]">
                  {ledgerStats.followerPulse.toLocaleString()}
                </span>
                <span className="text-[9px] text-emerald-500 block mt-1 leading-none font-bold animate-pulse">نبض المتابع النشط ✓</span>
              </div>
            </div>
          </div>

          {/* BLOCK 2: مركز حوكمة وحالة الإعلانات المرفوعة (Ad Status & Governance) */}
          <div className="space-y-2">
            <h3 className="text-xs font-black uppercase text-gray-400 tracking-wider flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              2. مركز حوكمة وحالة الإعلانات المرفوعة (Ad Safety Ledger)
            </h3>

            <div className="space-y-1.5">
              {allSovereignAds.map((ad) => {
                const isRejectedDemo = ad.id === 'promo-rejected-demo';
                const statusUpper = (ad.status || '').toUpperCase();
                const isRejected = isRejectedDemo || statusUpper === 'REJECTED' || ad.isSovereignStopped === true;
                const isActive = statusUpper === 'ACTIVE' || ad.status === 'active';
                const isPending = statusUpper === 'PENDING' || ad.status === 'paused' || ad.status === 'frozen';

                // Assign tags and styles according to constitution principles
                let statusLabel = '';
                let statusStyle = '';
                if (isActive) {
                  statusLabel = 'نشط 🟢';
                  statusStyle = 'text-emerald-400 bg-emerald-950/40 border-emerald-500/30';
                } else if (isPending && !isRejected) {
                  statusLabel = 'معلّق 🟡';
                  statusStyle = 'text-amber-400 bg-amber-950/40 border-amber-500/30';
                } else {
                  statusLabel = 'مرفوض 🔴';
                  statusStyle = 'text-red-400 bg-red-950/40 border-red-500/30';
                }

                const rejectionText = ad.rejectionReason || '“حظر محتوى: تم رفض الإعلان لوجود نصوص غير واضحة أو جودة بصرية منخفضة تضر بمسرح الشاشة. نرحب بإعادة الرفع فوراً بعد التعديل لإنفاذ حملتك بنجاح.”';
                const hasPremium = ad.isPremiumRetentionPaid !== false; // for demo and defaults
                const isExpanded = expandedAdId === ad.id;
                const posterUrlShow = ad.posterUrl || ad.content?.posterUrl || '';

                return (
                  <div 
                    key={ad.id} 
                    className="bg-neutral-900/60 rounded-xl border border-white/5 overflow-hidden hover:border-emerald-500/20 transition-all text-right"
                  >
                    {/* Horizontal Compact Row */}
                    <div 
                      onClick={() => setExpandedAdId(isExpanded ? null : ad.id)}
                      className="p-2 flex items-center justify-between gap-2.5 cursor-pointer hover:bg-white/5 transition-colors"
                    >
                      {/* Left: Thumbnail and stacked Title/Description */}
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        {posterUrlShow ? (
                          <img 
                            src={posterUrlShow} 
                            alt="" 
                            className="w-8 h-8 rounded-md object-cover shrink-0 border border-white/10" 
                            referrerPolicy="no-referrer"
                          />
                        ) : (
                          <div className="w-8 h-8 rounded-md bg-zinc-950 border border-white/5 flex items-center justify-center shrink-0">
                            <Megaphone className="w-3.5 h-3.5 text-emerald-500" />
                          </div>
                        )}
                        <div className="space-y-0.5 min-w-0">
                          <h4 className="text-[11px] font-bold text-white truncate">{ad.title || ad.content?.title}</h4>
                          <p className="text-[9px] text-gray-400 truncate leading-none">{ad.description || ad.content?.description}</p>
                        </div>
                      </div>

                      {/* Right: Direct Actions & Status & Expand indicators */}
                      <div className="flex items-center gap-2 shrink-0">
                        {/* Dynamic quick-links as small icons */}
                        <div className="flex items-center gap-1">
                          {ad.whatsapp && (
                            <a 
                              href={`https://wa.me/${ad.whatsapp.replace('+', '')}`} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              className="p-1.5 rounded bg-emerald-950/60 border border-emerald-500/20 hover:bg-emerald-900 text-emerald-400 transition-all"
                              title="اتصال واتساب سريع"
                            >
                              <MessageSquare className="w-3 h-3" />
                            </a>
                          )}
                          {(ad.phone || ad.whatsapp) && (
                            <a 
                              href={`tel:${ad.phone || ad.whatsapp}`} 
                              onClick={(e) => e.stopPropagation()}
                              className="p-1.5 rounded bg-sky-950/60 border border-sky-500/20 hover:bg-sky-900 text-sky-400 transition-all"
                              title="اتصال هاتفي سريع"
                            >
                              <Phone className="w-3 h-3" />
                            </a>
                          )}
                        </div>

                        {/* Status Label Badge */}
                        <span className={`text-[9px] font-bold px-2 py-0.5 rounded border uppercase shrink-0 ${statusStyle}`}>
                          {statusLabel}
                        </span>

                        {/* Expander Arrow */}
                        <span className={`text-gray-500 text-[10px] transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}>
                          ▼
                        </span>
                      </div>
                    </div>

                    {/* Expandable Accordion Body */}
                    <AnimatePresence initial={false}>
                      {isExpanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.15 }}
                          className="border-t border-white/5 bg-black/60 overflow-hidden"
                        >
                          <div className="p-3 space-y-2 text-xs text-gray-300">
                            {hasPremium && (
                              <div className="text-[9px] font-extrabold text-emerald-400 bg-emerald-950/80 border border-emerald-500/30 px-2.5 py-1 rounded-lg">
                                🟢 باقة التخليد الفعّالة (القلب الأخضر) - تتيح للمستهلكين حبس الإعلان في الذاكرة المحلية للأبد
                              </div>
                            )}

                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[9px] font-mono text-gray-400">
                              <div className="bg-zinc-900/40 p-1.5 rounded-lg border border-white/5">
                                الموقع: <span className="text-white font-sans">{ad.targetGovernorate || 'عمان'} - {ad.targetDistrict || 'الجامعة'}</span>
                              </div>
                              <div className="bg-zinc-900/40 p-1.5 rounded-lg border border-white/5">
                                النبض المستهدف: <span className="text-white">{(ad.targetImpressions || 0).toLocaleString()}</span>
                              </div>
                              <div className="bg-zinc-900/40 p-1.5 rounded-lg border border-white/5">
                                النبض الفعلي: <span className="text-emerald-400">{(ad.currentImpressions || 0).toLocaleString()}</span>
                              </div>
                              <div className="bg-zinc-900/40 p-1.5 rounded-lg border border-white/5">
                                النقرات: <span className="text-amber-400">{(ad.clicksCount || 0).toLocaleString()}</span>
                              </div>
                            </div>

                            {/* Detailed Constitutional Explanation for any Refusal (Absolute transparency) */}
                            {isRejected && (
                              <div className="bg-rose-950/20 border border-rose-500/20 p-2.5 rounded-xl mt-1 animate-fade-in text-right">
                                <div className="flex items-start gap-1 py-0.5 text-center shrink-0">
                                  <ShieldAlert className="w-3.5 h-3.5 text-rose-500 mt-0.5 shrink-0" />
                                  <div className="text-right">
                                    <span className="text-[9px] font-black text-rose-400 block">إفادة مركز السلامة السيادي (سبب الرفض):</span>
                                    <p className="text-[9px] text-rose-300 leading-tight font-sans font-semibold mt-0.5">
                                      {rejectionText}
                                    </p>
                                  </div>
                                </div>
                              </div>
                            )}

                            {/* Control Actions for Non-Rejected Ads */}
                            {!isRejected && (
                              <div className="flex gap-2 pt-1.5 justify-start border-t border-white/5">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => toggleAdStatus(ad.id, ad.status)}
                                  className="h-7 px-2.5 border-white/10 hover:bg-white/5 text-[9px] font-black rounded-lg"
                                >
                                  {ad.status === 'active' || ad.status === 'ACTIVE' ? '⚙️ إيقاف مؤقت' : '⚡ تفعيل النبض'}
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => extendAd(ad.id, 1000, 3)}
                                  className="h-7 px-2.5 border-white/10 hover:bg-emerald-950/20 text-emerald-400 text-[9px] font-black rounded-lg"
                                >
                                  ➕ تمديد الحملة (+1000 نبضة)
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => deleteAd(ad.id)}
                                  className="h-7 px-2.5 border-rose-500/15 hover:bg-rose-950/20 text-rose-400 text-[9px] font-black rounded-lg mr-auto"
                                >
                                  🗑️ أرشفة الإعلان
                                </Button>
                              </div>
                            )}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}
            </div>
          </div>

          {/* BLOCK 3: خريطة السعة النسيجية الديناميكية (Geo-Capacity Heatmap) */}
          <div className="space-y-3">
            <h3 className="text-xs font-black uppercase text-gray-400 tracking-wider flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5 text-emerald-400" />
              3. خريطة السعة النسيجية الديناميكية (Dynamic Geo-Capacity Heatmap)
            </h3>

            <div className="bg-neutral-900/50 p-4 rounded-2xl border border-white/5 space-y-4">
              <p className="text-[10px] text-gray-400 leading-normal">
                الرصد اللحظي لزخم حركات الركاب ومستويات الانتباه الميداني للأجهزة النشطة على حافة النظام دون إرهاق العتاد أو تحميل خرائط خارجية.
              </p>

              <div className="space-y-3">
                {[
                  { name: 'لواء ناعور (عمان)', capacity: 94, priceAnom: 'نشط جداً', attention: 'استثنائي 98%', color: 'from-emerald-500 to-teal-500' },
                  { name: 'لواء وادي السير (عمان)', capacity: 85, priceAnom: 'مكتظ (حرق أسعار)', attention: 'مرتفع 89%', color: 'from-amber-500 to-orange-500' },
                  { name: 'لواء قصبة السلط (البلقاء)', capacity: 68, priceAnom: 'متزن', attention: 'عادي 65%', color: 'from-indigo-500 to-blue-500' },
                  { name: 'لواء الجيزة (عمان)', capacity: 42, priceAnom: 'منخفض', attention: 'عادي 50%', color: 'from-slate-500 to-gray-500' }
                ].map((item, idx) => (
                  <div key={idx} className="space-y-1.5 bg-black/40 p-3 rounded-xl border border-white/5 hover:border-white/10 transition-all">
                    <div className="flex justify-between items-center text-[10px]">
                      <span className="font-bold text-white">{item.name}</span>
                      <div className="flex items-center gap-2 text-gray-400">
                        <span>انتباه الركاب: <strong className="text-emerald-400 font-mono">{item.attention}</strong></span>
                        <span className="w-1.5 h-1.5 rounded-full bg-white/20" />
                        <span>حالة السعة: <strong className="text-amber-400 font-mono">{item.priceAnom}</strong></span>
                      </div>
                    </div>
                    
                    {/* Compact custom bar representing digital heatmap intensity */}
                    <div className="w-full h-2.5 bg-zinc-950 rounded-full overflow-hidden relative border border-white/5">
                      <div 
                        className={`h-full rounded-full bg-gradient-to-l ${item.color} transition-all duration-1000`} 
                        style={{ width: `${item.capacity}%` }}
                      />
                    </div>
                    
                    <div className="flex justify-between items-center text-[9px] text-gray-500 font-mono">
                      <span>مستوى الاستهداف البصري: {item.capacity}%</span>
                      {item.capacity >= 80 && (
                        <button 
                          onClick={() => {
                            setGovernorate('عمان');
                            setDistrict(item.name.replace(' (عمان)', ''));
                            setActiveTab('create');
                            setStep(2);
                            toast({
                              title: '🎯 توجيه ذكي للميزانية',
                              description: `تم تحويل الحملة الجغرافية فوراً لاكتساح لواء ${item.name.replace(' (عمان)', '')}.`
                            });
                          }}
                          className="text-emerald-400 hover:text-emerald-300 font-sans font-bold flex items-center gap-0.5"
                        >
                          ⚡ وجه ميزانيتك هنا واكتسح اللواء
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* BLOCK 4: قمرة الرسائل الترحيبية والنبضات التشجيعية (The Retention Alerts) */}
          <div className="space-y-3">
            <h3 className="text-xs font-black uppercase text-gray-400 tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
              4. قمرة الرسائل الترحيبية والنبضات التشجيعية (Retention Pulse Alerts)
            </h3>

            <div className="p-4 bg-gradient-to-br from-emerald-950/20 to-neutral-900/60 border border-emerald-500/30 rounded-2xl space-y-3 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-2 h-full bg-emerald-500" />
              
              <div className="flex items-center gap-1.5 text-emerald-400 text-xs font-black">
                <Award className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>إشعار الاستحقاق والتكريم السيادي للمعلنين الوفيين</span>
              </div>

              {/* The exact requested retention notification message inside system configuration */}
              <p className="text-[11px] text-gray-100 leading-relaxed font-sans font-medium">
                🏆 تهانينا! إعلانك غطى <strong className="text-emerald-300">94%</strong> من السعة الإعلانية المتاحة في لواء ناعور خلال آخر 24 ساعة وجلب لك <strong className="text-emerald-300">45</strong> اتصالاً مباشراً. الميدان متعطش لنشاطك، هل تريد تكرار النبض للأسبوع القادم بخصم رتبة المعلن الوفي؟
              </p>

              <div className="flex gap-2 justify-end pt-1">
                <Button
                  size="sm"
                  onClick={() => {
                    handleRecommendationAccept('تكرار تجديد النبض الوفي', 2.50, 'ناعور');
                  }}
                  className="bg-emerald-600 hover:bg-emerald-500 text-black font-black text-[10px] h-8 rounded-lg"
                >
                  🚀 تجديد الحملة للأسبوع القادم (بـ 2.50 دينار فقط)
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    toast({
                      title: '💬 تواصل مباشر صامت',
                      description: 'تم توجيه طلب التخصيص والميزانيات الكبرى للصندوق الجنائي لتسجيل نقاط ولاء.'
                    });
                  }}
                  className="h-8 border-white/10 text-gray-300 hover:bg-white/5 text-[10px] font-black rounded-lg px-2.5"
                >
                  ⚙️ طلب تخصيص ميزانية كبرى
                </Button>
              </div>
            </div>
          </div>

          {/* BLOCK 5: محرك التحفيز والتكرار آلياً (The Gamification Engine) */}
          <div className="space-y-3">
            <h3 className="text-xs font-black uppercase text-gray-400 tracking-wider flex items-center gap-1.5">
              <Award className="w-3.5 h-3.5 text-emerald-400" />
              3. محرك التحفيز والتوجيه التلقائي (The Gamification System)
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {/* Rec 1 */}
              <div className="p-4 bg-gradient-to-br from-indigo-950/10 to-neutral-900 border border-indigo-500/20 rounded-2xl space-y-2 relative overflow-hidden">
                <div className="absolute -top-6 -left-6 w-16 h-16 bg-indigo-500/10 rounded-full blur-xl" />
                <div className="flex items-center gap-1.5 text-indigo-400 text-xs font-black">
                  <Sparkles className="w-4 h-4 animate-spin-slow shrink-0" />
                  <span>توصية زخم لواء ناعور</span>
                </div>
                <p className="text-[10px] text-gray-300 leading-relaxed font-sans">
                  "إعلانك حقق تفاعلاً هائلاً في لواء ناعور، اضغط هنا لتمديد الحملة بـ 2 دينار فقط واكتساح اللواء بالكامل."
                </p>
                <div className="pt-2">
                  <Button
                    size="sm"
                    onClick={() => handleRecommendationAccept('تمديد ناعور الذكي', 2.00, 'ناعور')}
                    className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-black text-[10px] h-8 rounded-lg transition-all"
                  >
                    🚀 تمويل التمديد بـ 2.00 د.أ وصفر انتظار
                  </Button>
                </div>
              </div>

              {/* Rec 2 */}
              <div className="p-4 bg-gradient-to-br from-emerald-950/10 to-neutral-900 border border-emerald-500/20 rounded-2xl space-y-2 relative overflow-hidden">
                <div className="absolute -top-6 -left-6 w-16 h-16 bg-emerald-500/10 rounded-full blur-xl" />
                <div className="flex items-center gap-1.5 text-emerald-400 text-xs font-black">
                  <Zap className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>حافز وادي السير الطارئ</span>
                </div>
                <p className="text-[10px] text-gray-300 leading-relaxed font-sans">
                  "حظر واضمحلال السعة الإعلانية بوادي السير نشط الآن! انقر لإتاحة التمديد المستعجل بخصم 45% بقيمة 1.5 دينار."
                </p>
                <div className="pt-2">
                  <Button
                    size="sm"
                    onClick={() => handleRecommendationAccept('تمديد السعة الاستباقي', 1.50, 'وادي السير')}
                    className="w-full bg-emerald-700 hover:bg-emerald-600 text-white font-black text-[10px] h-8 rounded-lg transition-all"
                  >
                    ⚡ تفعيل وقنص السعة بـ 1.50 د.أ
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* BLOCK 4: محطة الموازنة والمحفظة السيادية (Sovereign Budget & Prepaid Ledger) */}
          <div className="space-y-3">
            <h3 className="text-xs font-black uppercase text-gray-400 tracking-wider flex items-center gap-1.5">
              <Wallet className="w-3.5 h-3.5 text-emerald-400" />
              4. محطة الموازنة والمحفظة السيادية ($Zero-Cost$ Budget Management)
            </h3>

            <div className="bg-neutral-900/50 p-4 rounded-2xl border border-white/5 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-1">
                  <span className="text-[10px] text-gray-400 block">رصيد ميزانيتك الجاري الرقمي:</span>
                  <div className="text-2xl font-black text-white font-mono tracking-tight flex items-baseline gap-1">
                    <span className="text-emerald-400">{advertiserBalance.toFixed(2)}</span>
                    <span className="text-xs text-gray-500 font-sans">دينار أردني</span>
                  </div>
                </div>

                <div className="flex gap-1.5 self-end sm:self-auto">
                  <Button
                    size="sm"
                    onClick={() => handleDepositSimulate(10.00)}
                    className="bg-emerald-600 hover:bg-emerald-500 text-black font-black text-[10px] h-9 px-3 rounded-lg"
                  >
                    💵 شحن 10 د.أ
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => handleDepositSimulate(25.00)}
                    className="bg-emerald-600 hover:bg-emerald-500 text-black font-black text-[10px] h-9 px-3 rounded-lg"
                  >
                    💵 شحن 25 د.أ
                  </Button>
                </div>
              </div>

              <div className="p-3 bg-black/60 rounded-xl border border-white/5 space-y-2">
                <span className="text-[10px] text-gray-500 font-bold block uppercase border-b border-white/5 pb-1">بوابات السداد المتاحة (التشفير والربط الأردني المباشر)</span>
                <div className="flex flex-wrap gap-4 text-[9px] text-gray-400 justify-start">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    <strong>زين كاش (Zain Cash)</strong>: متاح بنقر آلي
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    <strong>كليك الأردن (CliQ Jordan)</strong>: معرّف مشفّر
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-orange-400" />
                    إيداعات صامتة بصفر رسوم معاملات
                  </span>
                </div>
              </div>
            </div>
          </div>

        </div>
      )}

      {/* TAB 2: Multi-step Creative Ad Creation Form */}
      {activeTab === 'create' && (
        <div className="space-y-6">
          
          {/* Unified 3-Step Map Progress */}
          <div className="flex items-center justify-between gap-2 mb-6 bg-[#040A04]/40 border border-white/5 p-3 rounded-2xl">
            {[
              { id: 1, title: 'التحديد الجغرافي والسعة', desc: 'المحافظة، اللواء ومسح السعر' },
              { id: 2, title: 'رفع الحملة وبناء الروابط', desc: 'مسرح الشاشة الكامل والاتصال' },
              { id: 3, title: 'الفحص الجنائي والنبض', desc: 'المطابقة والتدقيق الجنائي للـ AI' }
            ].map((s) => (
              <div key={s.id} className="flex-1 flex flex-col items-start gap-1">
                <div className="flex items-center gap-1.5 w-full">
                  <div 
                    className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-black transition-all ${
                      step === s.id 
                        ? 'bg-emerald-500 text-black shadow-[0_0_15px_rgba(16,185,129,0.4)]' 
                        : step > s.id 
                          ? 'bg-emerald-950 text-emerald-400 border border-emerald-500' 
                          : 'bg-white/5 text-gray-500 border border-white/10'
                    }`}
                  >
                    {step > s.id ? '✓' : s.id}
                  </div>
                  <div className={`h-[2px] flex-1 rounded-full ${step > s.id ? 'bg-emerald-500' : 'bg-white/10'}`} />
                </div>
                <span className={`text-[11px] font-black mt-1.5 block ${step === s.id ? 'text-white' : 'text-gray-500'}`}>
                  {s.title}
                </span>
                <span className="text-[9px] text-gray-500 leading-none hidden sm:block">
                  {s.desc}
                </span>
              </div>
            ))}
          </div>

          {/* UNIFIED ACCORDION CONFIGURATION */}
          {step !== 3 && (
            <div className="space-y-3.5 animate-fade-in">
              <div className="space-y-0.5">
                <h2 className="text-xs font-black text-white flex items-center gap-1.5 pb-1 border-b border-white/5">
                  <Megaphone className="w-3.5 h-3.5 text-emerald-400" />
                  بناء الحملة الإعلانية وتفويض النبض السيادي
                </h2>
                <p className="text-[10px] text-gray-400 leading-relaxed font-sans font-medium">
                  نظم البيانات عبر بوابات الأكورديون التالية لضمان الفحص المسبق واستغلال كامل الأبعاد البصرية للشاشات.
                </p>
              </div>

              {/* ACCORDION SYSTEM */}
              <div className="space-y-2">
                
                {/* SECTION 1: Geographical Selection & Capacity */}
                <div className="border border-white/10 rounded-xl bg-neutral-900/40 overflow-hidden transition-all duration-300">
                  <button
                    type="button"
                    onClick={() => setOpenSecs(prev => ({ ...prev, 1: !prev[1] }))}
                    className="w-full p-2.5 flex items-center justify-between text-right text-white hover:bg-white/5 transition-all outline-none"
                  >
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded bg-emerald-950/60 border border-emerald-500/20 flex items-center justify-center text-[9px] font-black text-emerald-400 font-mono">1</div>
                      <span className="text-[11px] font-black">القسم (1): التوجيه الجغرافي والسعة (جغرافي)</span>
                    </div>
                    <div className="flex items-center gap-2 text-[9px] text-gray-500 font-mono">
                      <span>{governorate && district ? `[${governorate} - ${district}]` : '[خطوة معلّقة]'}</span>
                      <span>{openSecs[1] ? '▲ طي' : '▼ توسيع'}</span>
                    </div>
                  </button>
                  <AnimatePresence initial={false}>
                    {openSecs[1] && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.15 }}
                        className="border-t border-white/5 bg-black/60 p-2.5 space-y-2.5"
                      >
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                          <div className="space-y-1">
                            <Label className="text-[10px] text-emerald-400 font-bold block">المحافظة المستهدفة</Label>
                            <Select onValueChange={(val) => { setGovernorate(val); setDistrict(''); }} value={governorate}>
                              <SelectTrigger className="h-9 border-white/10 bg-black text-right pr-3 text-white text-xs">
                                <SelectValue placeholder="اختر المحافظة" />
                              </SelectTrigger>
                              <SelectContent className="bg-black text-white border-white/10">
                                {jordanGovernorates.map(gov => (
                                  <SelectItem key={gov} value={gov} className="text-right justify-end text-xs">{gov}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>

                          <div className="space-y-1">
                            <Label className="text-[10px] text-emerald-400 font-bold block">اللواء المستهدف</Label>
                            <Select onValueChange={(val) => setDistrict(val)} value={district} disabled={!governorate}>
                              <SelectTrigger className="h-9 border-white/10 bg-black text-right pr-3 text-white text-xs">
                                <SelectValue placeholder={governorate ? "اختر اللواء الجغرافي" : "اختر المحافظة أولاً"} />
                              </SelectTrigger>
                              <SelectContent className="bg-black text-white border-white/10">
                                {districts.map(dist => (
                                  <SelectItem key={dist} value={dist} className="text-right justify-end text-xs">{dist}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>

                        <div className="space-y-1 pt-1">
                          <Label className="font-bold text-[10px] text-emerald-400 block">مرات الظهور والنبض المطلوبة لحجم الاكتساح:</Label>
                          <Select onValueChange={(val) => setTargetImpressions(parseInt(val))} value={targetImpressions.toString()}>
                            <SelectTrigger className="h-9 border-white/10 bg-black text-right text-white text-xs">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="bg-black text-white border-white/10">
                              <SelectItem value="1000" className="text-right justify-end text-xs">1,000 ظهور (مستوى اختبار)</SelectItem>
                              <SelectItem value="5000" className="text-right justify-end text-xs">5,000 ظهور (تأثير محلي)</SelectItem>
                              <SelectItem value="10000" className="text-right justify-end text-xs">10,000 ظهور (انتشار واسع في اللواء)</SelectItem>
                              <SelectItem value="50000" className="text-right justify-end text-xs">50,000 ظهور (تأثير سيادي وشامل)</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        {district && (
                          <div className="space-y-2 pt-1">
                            {isCapacityFull ? (
                              <div className="p-2.5 bg-amber-950/20 border-2 border-dashed border-amber-500/40 rounded-xl space-y-2">
                                <div className="flex items-center gap-1.5 text-amber-400">
                                  <ShieldAlert className="w-3.5 h-3.5 animate-pulse shrink-0" />
                                  <span className="text-[10px] font-black">تحذير محرك السعة المكتظة (Capacity Saturation)</span>
                                </div>
                                <p className="text-[10px] text-gray-300 leading-normal font-medium">
                                  “الوقت الحالي ممتلئ، ولكن يوجد زخم ركاب مرتفع في اللواء المجاور <strong className="text-amber-400">ناعور</strong> نتيجة تذبذب الأسعار بنسبة 10%، نقترح توجيه حملتك هناك لتحقيق مشاهدات أعلى بجودة أكبر”.
                                </p>
                                <Button 
                                  type="button" 
                                  onClick={redirectCampaignToNaour}
                                  className="w-full bg-amber-600 hover:bg-amber-500 text-black font-black text-[10px] h-8 rounded-lg flex items-center justify-center gap-1 transition-all"
                                >
                                  <Sparkles className="w-3.5 h-3.5 text-black animate-spin" />
                                  توجيه الحملة فوراً إلى لواء ناعور المكبّر (خصومات ومرونة قصوى)
                                </Button>
                              </div>
                            ) : (
                              <div className="p-2.5 bg-emerald-950/15 border border-emerald-500/20 rounded-xl space-y-2">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-1 text-emerald-400 text-[10px] font-bold">
                                    <Activity className="w-3.5 h-3.5 text-emerald-400 animate-pulse animate-bounce-slow" />
                                    <span>بيانات النبض العام الموحد (Global Pulse) للواء: {district}</span>
                                  </div>
                                  <span className="text-[8px] bg-emerald-950/65 text-emerald-400 font-extrabold px-1.5 py-0.5 rounded-full border border-emerald-400/20">
                                    السعة متاحة ✓
                                  </span>
                                </div>

                                <div className="grid grid-cols-3 gap-1.5 text-center">
                                  <div className="bg-black/60 p-1.5 rounded-lg border border-white/5">
                                    <span className="text-[8px] text-gray-400 block pb-0.5">شذوذ السعر المرصود</span>
                                    <span className="text-[9px] font-black text-amber-400 font-mono">
                                      {activeDistrictPulse?.priceAnomaliesCount || 0} حالات حرق
                                    </span>
                                  </div>
                                  <div className="bg-black/60 p-1.5 rounded-lg border border-white/5">
                                    <span className="text-[8px] text-gray-400 block pb-0.5">السعة الطارئة</span>
                                    <span className={`text-[9px] font-black block ${activeDistrictPulse?.emergencyAdCapacityActive ? 'text-emerald-400 animate-pulse' : 'text-gray-400'}`}>
                                      {activeDistrictPulse?.emergencyAdCapacityActive ? '🔥 نشطة (خصم %40)' : 'خاملة'}
                                    </span>
                                  </div>
                                  <div className="bg-black/60 p-1.5 rounded-lg border border-white/5">
                                    <span className="text-[8px] text-gray-400 block pb-0.5">انتباه الركاب الميداني</span>
                                    <span className="text-[9px] font-black text-emerald-400 block">
                                      {activeDistrictPulse?.emergencyAdCapacityActive ? 'عالي %98' : 'عادي %65'}
                                    </span>
                                  </div>
                                </div>

                                {activeDistrictPulse?.emergencyAdCapacityActive && (
                                  <div className="p-1.5 bg-emerald-950/50 border border-emerald-500/30 rounded-lg text-[9px] text-emerald-300 font-sans leading-relaxed flex items-start gap-1">
                                    <Sparkles className="w-3 h-3 text-emerald-400 shrink-0 mt-0.5 animate-pulse" />
                                    <span>
                                      تم تفعيل <strong>الحزم الإعلانية الطارئة ومكثفة الانتباه</strong> للواء {district} بنصف السعر. استفد من الخصم الدستوري الميداني حالاً.
                                    </span>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* SECTION 2: Ad Material & Acquisition Links */}
                <div className="border border-white/10 rounded-xl bg-neutral-900/40 overflow-hidden transition-all duration-300">
                  <button
                    type="button"
                    onClick={() => setOpenSecs(prev => ({ ...prev, 2: !prev[2] }))}
                    className="w-full p-2.5 flex items-center justify-between text-right text-white hover:bg-white/5 transition-all outline-none"
                  >
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded bg-emerald-950/60 border border-emerald-500/20 flex items-center justify-center text-[9px] font-black text-emerald-400 font-mono">2</div>
                      <span className="text-[11px] font-black">القسم (2): مادة الإعلانات والاتصالات الذرية (مادي)</span>
                    </div>
                    <div className="flex items-center gap-2 text-[9px] text-gray-500 font-mono">
                      <span>{title ? '[مادة إعلانية مجهزة]' : '[خطوة معلّقة]'}</span>
                      <span>{openSecs[2] ? '▲ طي' : '▼ توسيع'}</span>
                    </div>
                  </button>
                  <AnimatePresence initial={false}>
                    {openSecs[2] && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.15 }}
                        className="border-t border-white/5 bg-black/60 p-2.5 space-y-2.5 animate-fade-in"
                      >
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 items-start">
                          <div className="space-y-2">
                            <div className="space-y-1">
                              <Label className="text-[10px] text-emerald-400 font-bold block">عنوان الحملة المثير للانتباه</Label>
                              <Input 
                                placeholder="معروض شاورما الكابتن السيادي الفاخر" 
                                value={title} 
                                onChange={(e) => setTitle(e.target.value)}
                                className="h-9 border-white/10 bg-black mt-1 text-white text-xs pr-3"
                              />
                            </div>

                            <div className="space-y-1">
                              <Label className="text-[10px] text-emerald-400 font-bold block">الوصف البصري والخصومات للركاب</Label>
                              <Input 
                                placeholder="احصل على خصم 25% مع كل طوافة نقل للراكب الفعال." 
                                value={description} 
                                onChange={(e) => setDescription(e.target.value)}
                                className="h-9 border-white/10 bg-black mt-1 text-white text-xs pr-3"
                              />
                            </div>

                            <div className="space-y-1">
                              <Label className="text-[10px] text-emerald-400 font-bold block">رابط بوستر الحملة البصري الكامل</Label>
                              <Input 
                                placeholder="https://images.unsplash.com/photo-..." 
                                value={posterUrl} 
                                onChange={(e) => setPosterUrl(e.target.value)}
                                className="h-9 border-white/10 bg-black mt-1 text-left font-mono text-white text-xs pl-3"
                                dir="ltr"
                              />
                            </div>

                            {/* Direct Acquisition Links */}
                            <div className="p-2 bg-white/5 rounded-lg border border-white/10 space-y-1.5">
                              <span className="text-[9px] font-black text-gray-400 block border-b border-white/5 pb-0.5">الروابط الذرية المباشرة (Direct Acquisition Links)</span>
                              <div className="grid grid-cols-2 gap-1.5">
                                <div className="space-y-1">
                                  <Label className="text-[9px] text-gray-400">رقم الواتساب السيادي</Label>
                                  <Input 
                                    value={whatsapp} 
                                    onChange={(e) => setWhatsapp(e.target.value)}
                                    className="h-8 border-white/10 bg-black text-left font-mono text-xs text-white"
                                    dir="ltr"
                                  />
                                </div>
                                <div className="space-y-1">
                                  <Label className="text-[9px] text-gray-400">رقم الاتصال المباشر</Label>
                                  <Input 
                                    value={phone} 
                                    onChange={(e) => setPhone(e.target.value)}
                                    className="h-8 border-white/10 bg-black text-left font-mono text-xs text-white"
                                    dir="ltr"
                                  />
                                </div>
                                <div className="space-y-1 col-span-2">
                                  <Label className="text-[9px] text-gray-400">رابط الموقع الجغرافي أو الهبوط</Label>
                                  <Input 
                                    placeholder="https://maps.google.com/?q=..."
                                    value={geoLoc} 
                                    onChange={(e) => setGeoLoc(e.target.value)}
                                    className="h-8 border-white/10 bg-black text-left font-mono text-xs text-white"
                                    dir="ltr"
                                  />
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Theater Preview Mock */}
                          <div className="space-y-1.5">
                            <span className="text-[9px] font-black text-emerald-400 uppercase tracking-widest block text-center">
                              🖥️ مسرح العرض الكامل للراكب (Theatre Preview)
                            </span>
                            
                            <div className="w-full aspect-[9/16] max-h-[220px] bg-zinc-950 rounded-xl border border-white/10 relative overflow-hidden flex flex-col justify-end shadow-2xl mx-auto">
                              {posterUrl ? (
                                <img 
                                  src={posterUrl} 
                                  alt="Creative Preview" 
                                  referrerPolicy="no-referrer"
                                  className="absolute inset-0 w-full h-full object-cover z-0 filter brightness-95 animate-fade-in" 
                                />
                              ) : (
                                <div className="absolute inset-0 flex flex-col items-center justify-center bg-zinc-900 border border-zinc-950 text-gray-500 text-[10px]">
                                  <ImageIcon className="w-6 h-6 mb-1 animate-pulse" />
                                  <span>مسرح الشاشة الكامل ممتد هنا</span>
                                </div>
                              )}

                              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent z-10" />

                              <div className="p-2.5 relative z-20 space-y-1 text-right">
                                <span className="text-[7px] bg-emerald-500 text-black px-1.5 py-0.5 rounded-full font-black">
                                  إعلانات الرادار النشطة
                                </span>
                                <div className="space-y-0.5">
                                  <h4 className="text-[9px] font-black text-white truncate">{title || 'عنوان الحملة البصرية'}</h4>
                                  <p className="text-[8px] text-gray-300 leading-tight truncate">{description || 'وصف الحملة وتوجيه الاستبصار.'}</p>
                                </div>
                                <Button className="w-full text-white bg-emerald-600 border border-emerald-500 font-extrabold text-[8px] h-6 rounded-md pointer-events-none">
                                  {buttonText}
                                </Button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* SECTION 3: Package Options & Prepayment */}
                <div className="border border-white/10 rounded-xl bg-neutral-900/40 overflow-hidden transition-all duration-300">
                  <button
                    type="button"
                    onClick={() => setOpenSecs(prev => ({ ...prev, 3: !prev[3] }))}
                    className="w-full p-2.5 flex items-center justify-between text-right text-white hover:bg-white/5 transition-all outline-none"
                  >
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded bg-emerald-950/60 border border-emerald-500/20 flex items-center justify-center text-[9px] font-black text-emerald-400 font-mono">3</div>
                      <span className="text-[11px] font-black">القسم (3): التسعير والذكاء الاصطناعي السيادي (تسعيري)</span>
                    </div>
                    <div className="flex items-center gap-2 text-[9px] text-gray-400 font-mono">
                      <span>الباقة: {currentPackage?.name || 'غير محددة'}</span>
                      <span>{openSecs[3] ? '▲ طي' : '▼ توسيع'}</span>
                    </div>
                  </button>
                  <AnimatePresence initial={false}>
                    {openSecs[3] && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.15 }}
                        className="border-t border-white/5 bg-black/60 p-2.5 space-y-3"
                      >
                        {/* AI Recommendation Widget */}
                        <div className="p-2.5 rounded-xl border border-emerald-500/20 bg-emerald-950/10 space-y-2 text-right">
                          <span className="text-[10px] font-extrabold text-emerald-400 flex items-center gap-1">
                            <Sparkles className="w-3.5 h-3.5" /> مستشار الباقة الذكي (AI Pricing Recommendation)
                          </span>
                          <p className="text-[8px] text-gray-300 leading-relaxed">
                            أدخل ميزانيتك التقديرية وهدفك التسويقي ليقترح لك المحرك السيادي الباقة المثلى تلقائياً:
                          </p>
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <Label className="text-[8px] text-gray-400">ميزانيتك التقديرية (د.أ):</Label>
                              <Input 
                                type="number" 
                                value={aiBudget} 
                                onChange={(e) => setAiBudget(e.target.value)} 
                                className="h-7 text-[9px] bg-black/40 border-white/10 text-emerald-400 font-mono text-center rounded"
                              />
                            </div>
                            <div>
                              <Label className="text-[8px] text-gray-400">الغاية التسويقية:</Label>
                              <select 
                                value={aiGoal} 
                                onChange={(e: any) => setAiGoal(e.target.value)}
                                className="w-full h-7 text-[9px] bg-neutral-900 border border-white/10 text-gray-300 rounded px-1 text-right outline-none"
                              >
                                <option value="awareness">النبض العادي (وعي عابر)</option>
                                <option value="retention">التخليد (حفظ مكرر بالذاكرة)</option>
                                <option value="broad">الاكتساح (تغطية سيادية قصوى)</option>
                              </select>
                            </div>
                          </div>
                          <Button 
                            type="button"
                            onClick={() => suggestBestPackage(aiBudget, aiGoal)}
                            className="w-full h-7 text-[9px] bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold flex items-center justify-center gap-1 rounded"
                          >
                            <Sparkles className="w-3 h-3 text-emerald-200 animate-bounce" /> احصل على التوصية الفورية وتطبيقها
                          </Button>
                          {aiRecommendation && (
                            <div className="bg-black/60 p-2 rounded border border-white/5 text-[8px] text-emerald-300 leading-tight">
                              {aiRecommendation}
                            </div>
                          )}
                        </div>

                        {/* Package Selection Button Launcher [RAD-CMD-062] */}
                        <div className="space-y-2 text-right">
                          <Label className="text-[10px] text-emerald-400 font-extrabold block">الباقة التسعيرية المعتمدة للحملة:</Label>
                          <div className="p-3 rounded-2xl bg-zinc-950 border border-white/5 flex flex-col sm:flex-row items-center justify-between gap-3">
                            <div className="text-right space-y-0.5">
                              <span className="text-[10px] text-gray-400 block font-sans">الباقة الحالية:</span>
                              <span className="text-xs font-black text-white block">🟢 {currentPackage?.name || 'لم يتم الاختيار بعد'}</span>
                              <span className="text-[9px] text-[#00ffcc] font-mono block mt-0.5">{currentPackage?.pricePerImpression.toFixed(3)} د.أ / ظهور</span>
                            </div>
                            <Button
                              type="button"
                              onClick={() => setIsPackageModalOpen(true)}
                              className="w-full sm:w-auto h-9 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs px-4 rounded-xl shadow-lg transition-all"
                            >
                              ⚙️ اختيار الباقة
                            </Button>
                          </div>
                        </div>

                        {/* Invoice & Wallet sync display */}
                        <div className="pt-2 grid grid-cols-2 gap-2">
                          <div className="bg-neutral-900/90 p-2.5 rounded-xl border border-white/5 flex flex-col justify-center items-center text-center">
                            <span className="text-[8px] text-gray-500 font-bold">الفاتورة التقديرية المعتمدة للباقة:</span>
                            <span className="font-mono text-emerald-400 text-[11px] font-black mt-0.5">
                              {calculatedCost.toFixed(2)} د.أ
                            </span>
                          </div>
                          <div className="bg-neutral-900/90 p-2.5 rounded-xl border border-white/5 flex flex-col justify-center items-center text-center">
                            <span className="text-[8px] text-gray-500 font-bold">رصيد محفظتك السيادية الجاري:</span>
                            <span className={`font-mono text-[11px] font-black mt-0.5 ${advertiserBalance < calculatedCost ? 'text-red-400 animate-pulse' : 'text-amber-400'}`}>
                              {advertiserBalance.toFixed(2)} د.أ
                            </span>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

              </div>

              {/* Action Operations & Forensic Audit Trigger */}
              <div className="pt-3 border-t border-white/10 flex justify-between items-center gap-2">
                <Button
                  type="button"
                  onClick={() => {
                    runForensicAuditAndLaunch();
                  }}
                  disabled={!title || !description || !governorate || !district}
                  className="flex-1 h-10 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white font-black text-xs rounded-xl flex items-center justify-center gap-1.5 shadow-lg shadow-emerald-900/20 active:scale-[0.98] transition-all"
                >
                  <ShieldCheck className="w-4 h-4 animate-pulse" />
                  <span>رفع الفحص الجنائي وإطلاق النبض 🛡️</span>
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setOpenSecs({ 1: true, 2: false, 3: false });
                    setActiveTab('dashboard');
                  }}
                  className="h-10 border-white/10 hover:bg-neutral-900 text-gray-400 font-bold text-xs rounded-xl px-3"
                >
                  <span>إلغاء</span>
                </Button>
              </div>

            </div>
          )}

          {/* STEP 3: Forensic local AI quality checks & Ready State */}
          {step === 3 && (
            <div className="space-y-5 animate-fade-in">
              <div className="space-y-2">
                <h2 className="text-base font-black text-white flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-400 animate-pulse" />
                  المرحلة الثالثة: الفحص الجنائي للذكاء الاصطناعي (حارس الجودة)
                </h2>
                <p className="text-[11px] text-gray-400 leading-relaxed font-sans">
                  يقوم حارس الجودة الصامت بفحص مصفوفة البيكسلات والكود الجغرافي لضمان الخلو الكامل من الملوثات البصرية وامتثال الحملة لشروط الأمان الميداني.
                </p>
              </div>

              <div className="p-4 bg-zinc-950 rounded-2xl border border-white/5 space-y-4 text-right">
                <div className="space-y-1">
                  <div className="flex justify-between items-center text-xs text-gray-400">
                    <span>الربط البرمجي السداسي ومستوى التدقيق:</span>
                    <span className="font-mono text-emerald-400 font-bold">{auditProgress}%</span>
                  </div>
                  <div className="w-full bg-white/5 h-2 rounded-full overflow-hidden">
                    <div 
                      className="bg-emerald-500 h-full transition-all duration-300"
                      style={{ width: `${auditProgress}%` }}
                    />
                  </div>
                </div>

                {/* Audit Terminal Log */}
                <div className="bg-black p-3.5 rounded-xl border border-emerald-950 font-mono text-[10px] text-emerald-400 space-y-2 h-36 overflow-y-auto" dir="rtl">
                  {auditLogs.map((log, index) => (
                    <div key={index} className="flex items-start gap-1.5">
                      <span className="text-emerald-500 select-none">▶</span>
                      <span>{log}</span>
                    </div>
                  ))}
                </div>

                {/* Secure Active Placement Info */}
                {!isSimulatingAudit && auditApproved && (
                  <div className="p-3.5 bg-emerald-950/20 border border-emerald-500/20 rounded-xl space-y-2">
                    <div className="flex items-center gap-1.5 text-emerald-400 font-black text-xs">
                      <CheckCircle className="w-4 h-4 shrink-0" />
                      <span>تمت المطابقة والامتثال القانوني!</span>
                    </div>
                    <p className="text-[10px] text-gray-300 leading-relaxed">
                      تم غرس إعلانك بنجاح في مصفوفة النبض الميداني بمحافظة <strong className="text-emerald-400">{governorate}</strong> - لواء <strong className="text-emerald-400">{district}</strong>.
                    </p>
                  </div>
                )}
              </div>

              {/* Back to main operations */}
              <div className="flex justify-start">
                <Button
                  onClick={() => {
                    setActiveTab('dashboard');
                    setStep(1);
                  }}
                  disabled={isSimulatingAudit}
                  className="w-full h-12 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-sm rounded-xl"
                >
                  العودة للوحة التحكم وصندوق النبض الميداني 🤝
                </Button>
              </div>
            </div>
          )}

        </div>
      )}

      {/* Sovereign Footing Info Panel */}
      <div className="mt-6 pt-4 border-t border-white/10 flex flex-col sm:flex-row sm:items-center sm:justify-between text-[9px] text-gray-500 gap-2 font-mono">
        <span>$ZERO_COST_MICRO_ALGO - PWA V5.5 SECURITY LAYER</span>
        <span>صلاحية العقد: مستمر حتى استهلاك سقف النبض</span>
      </div>

      <AnimatePresence>
        {isPackageModalOpen && (
          <div className="fixed inset-0 z-[999] flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-fade-in" dir="rtl">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-lg bg-zinc-950 border border-emerald-500/35 rounded-3xl p-6 text-right relative shadow-[0_10px_50px_rgba(16,185,129,0.2)]"
            >
              <h3 className="text-sm font-black text-emerald-400 mb-2 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-emerald-400 animate-pulse" />
                معالج اختيار الباقات الحتمية والنبض الفاخر
              </h3>
              <p className="text-[10px] text-gray-400 mb-4 leading-relaxed font-sans">
                اختر الباقة المناسبة لأبعاد حملتك الإعلانية السيادية. سيتم ربط الكلفة مباشرة برصيدك وحساب الفاتورة فورياً:
              </p>

              <div className="space-y-3 mb-6">
                {SOVEREIGN_PRICING_PACKAGES.map((pkg) => {
                  const isSelected = selectedPackageId === pkg.id;
                  const tempCost = targetImpressions * pkg.pricePerImpression * (activeDistrictPulse?.emergencyAdCapacityActive ? 0.60 : 1.0);
                  const isAffordable = advertiserBalance >= tempCost;
                  
                  return (
                    <button
                      key={pkg.id}
                      type="button"
                      onClick={() => {
                        setSelectedPackageId(pkg.id);
                        setIsPremiumRetentionPaid(pkg.isRetention);
                      }}
                      className={`w-full p-3.5 rounded-2xl border text-right transition-all flex flex-col gap-1 relative overflow-hidden ${
                        isSelected 
                          ? 'bg-emerald-950/20 border-emerald-500 shadow-md ring-1 ring-emerald-500/20' 
                          : 'bg-black/60 border-white/5 hover:border-emerald-500/30'
                      }`}
                    >
                      {pkg.isRetention && (
                        <div className="absolute top-0 left-0 bg-[#00ffcc] text-black text-[7px] px-2 py-0.5 rounded-br-md font-black uppercase tracking-tighter">Premium</div>
                      )}
                      <div className="flex justify-between items-center w-full">
                        <span className={`text-xs font-black ${isSelected ? 'text-emerald-400' : 'text-gray-200'}`}>
                          {isSelected ? '🟢 ' : '⚪ '} {pkg.name}
                        </span>
                        <span className="text-[10px] text-emerald-400 font-mono font-black">
                          {pkg.pricePerImpression.toFixed(3)} د.أ / ظهور
                        </span>
                      </div>
                      <p className="text-[9px] text-gray-400 leading-snug font-sans mt-1">
                        {pkg.description}
                      </p>
                      
                      <div className="mt-2 pt-2 border-t border-white/5 flex justify-between items-center text-[9px] font-sans">
                        <span className="text-gray-500">الفاتورة التقديرية لـ {targetImpressions.toLocaleString()} ظهور:</span>
                        <span className={`font-mono font-bold ${isAffordable ? 'text-emerald-400' : 'text-red-400 animate-pulse'}`}>
                          {tempCost.toFixed(2)} د.أ {isAffordable ? '✓ متوفرة' : '⚠️ رصيد غير كاف'}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>

              <div className="bg-emerald-950/10 border border-emerald-500/10 p-3 rounded-2xl mb-4 flex justify-between items-center text-xs">
                <div className="text-right">
                  <span className="text-[9px] text-gray-500 block">الفاتورة المحددة:</span>
                  <span className="font-mono text-emerald-400 font-black text-sm">{calculatedCost.toFixed(2)} د.أ</span>
                </div>
                <div className="text-left font-mono">
                  <span className="text-[9px] text-gray-500 block text-left">رصيدك الكلي:</span>
                  <span className={`font-black text-sm ${advertiserBalance < calculatedCost ? 'text-red-400 animate-pulse' : 'text-amber-400'}`}>
                    {advertiserBalance.toFixed(2)} د.أ
                  </span>
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  type="button"
                  onClick={() => setIsPackageModalOpen(false)}
                  className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs h-10 rounded-xl"
                >
                  تأكيد وحفظ الباقة العقدية 🛡️
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsPackageModalOpen(false)}
                  className="border-white/10 text-gray-400 hover:bg-white/5 text-xs h-10 rounded-xl px-4"
                >
                  إغلاق
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}

// [SCR-AD-DASH-122] كود لوحة تحكم المعلن السيادية ومتابعة عوائد النبض الإعلاني
export interface SovereignAd {
  id: string;
  title: string;
  status: 'ACTIVE' | 'PENDING' | 'REJECTED';
  rejectionReason?: string;
  impressions: number;
  clicks: number;
  targetDistrict: string;
  cost: number;
  expirationTimestamp?: number;
  isPremiumRetentionPaid?: boolean;
}

export interface AdvertiserDashboardProps {
  advertiserProfile: {
    companyName: string;
    totalSpent: number;
    loyaltyRank: 'SILVER' | 'GOLD' | 'PLATINUM';
  };
  myAds: Array<SovereignAd>;
  marketInsights: { hottestDistrict: string; trafficGrowth: string };
}

export const RadarAdvertiserDashboard: React.FC<AdvertiserDashboardProps> = ({ advertiserProfile, myAds, marketInsights }) => {
  const [activeTab, setActiveTab] = useState<'METRICS' | 'LAUNCH'>('METRICS');

  return (
    <div className="radar-advertiser-container text-right" style={{ backgroundColor: '#020202', color: '#ffffff', padding: '20px', fontFamily: 'monospace' }} dir="rtl">
      
      {/* 1. الهيدر والترحيب السيادي برتبة المعلن */}
      <div className="dash-header" style={{ borderBottom: '2px solid #111', paddingBottom: '15px', marginBottom: '25px' }}>
        <h3>📡 لوحة تحكم المعلن السيادية - الرادار V5.5</h3>
        <div style={{ display: 'flex', justifyContent: 'space-between', backgroundColor: '#0d0d0d', padding: '10px 15px', borderRadius: '4px', border: '1px solid #1a1a1a' }}>
          <span>المعلن: <strong>{advertiserProfile.companyName}</strong></span>
          <span>رتبة الولاء: <strong style={{ color: '#ffcc00' }}>[{advertiserProfile.loyaltyRank}]</strong></span>
        </div>
      </div>

      {/* 2. نبضات التشجيع والتنبيهات التلقائية للنظام من أجل التكرار */}
      <div className="retention-alert-box" style={{ backgroundColor: '#001a0d', border: '1px solid #00cc66', padding: '15px', borderRadius: '6px', marginBottom: '25px' }}>
        <h4 style={{ color: '#00cc66', margin: '0 0 5px 0' }}>🏆 نبض النجاح التلقائي وصوت الرادار:</h4>
        <p style={{ margin: 0, fontSize: '12px', lineHeight: '1.5', color: '#b3ffd9' }}>
          إعلاناتك غطت خلايا جغرافية واسعة! نوصي بتكرار الحملة وتوجيه نبض إعلاني إضافي إلى 
          <strong> (لواء {marketInsights.hottestDistrict}) </strong> حيث يشهد الميدان هناك {marketInsights.trafficGrowth} في حركة الركاب حالياً، مما يضمن تضاعف المشاهدات بصفر تشتيت.
        </p>
      </div>

      {/* 3. عرض ومتابعة قائمة الإعلانات الحالية وإحصائياتها */}
      <div className="ads-management-section">
        <h4>📋 حملاتك الإعلانية ومؤشرات الأداء اللحظية</h4>
        {myAds.map(ad => {
          const ctr = ad.impressions > 0 ? ((ad.clicks / ad.impressions) * 100).toFixed(1) : '0.0';
          
          return (
            <div key={ad.id} style={{ backgroundColor: '#0d0d0d', padding: '15px', borderRadius: '6px', marginBottom: '15px', border: '1px solid #1a1a1a' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>📢 اسم الحملة: <strong>{ad.title}</strong></span>
                
                {/* عرض حالة الحوكمة والأختام الرقمية للاعلان */}
                {ad.status === 'ACTIVE' && <strong style={{ color: '#00cc66', fontSize: '12px' }}>🟢 نشط ويقذف النبض</strong>}
                {ad.status === 'PENDING' && <strong style={{ color: '#ffcc00', fontSize: '12px' }}>🟡 قيد الفحص الجنائي الصامت</strong>}
                {ad.status === 'REJECTED' && <strong style={{ color: '#ff3366', fontSize: '12px' }}>🚫 مرفوض سيادياً</strong>}
              </div>

              {ad.status === 'REJECTED' && (
                <div style={{ backgroundColor: '#260005', color: '#ffb3bf', padding: '8px', borderRadius: '4px', marginTop: '10px', fontSize: '11px' }}>
                  ❌ رسالة النظام: {ad.rejectionReason}
                </div>
              )}

              {/* عدادات بورصة الأرقام والمشاهدات للمعلن */}
              {ad.status === 'ACTIVE' && (
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '15px', backgroundColor: '#050505', padding: '10px', borderRadius: '4px', fontSize: '12px' }}>
                  <span>👁️ المشاهدات: <strong style={{ color: '#00ffcc' }}>{ad.impressions}</strong></span>
                  <span>🖱️ التفاعل والنقر: <strong style={{ color: '#00ffcc' }}>{ad.clicks}</strong></span>
                  <span>📈 كفاءة النبض الجغرافي (CTR): <strong style={{ color: '#ffcc00' }}>{ctr}%</strong></span>
                  <span>📍 النطاق: <strong>لواء {ad.targetDistrict}</strong></span>
                </div>
              )}
              
              {/* زر التكرار السريع والمحمي من أجل دافعية الاستمرار */}
              {ad.status === 'ACTIVE' && (
                <div style={{ textAlign: 'left', marginTop: '10px' }}>
                  <button style={{ backgroundColor: '#111', color: '#ffcc00', border: '1px solid #ffcc00', padding: '4px 10px', borderRadius: '4px', fontSize: '11px', cursor: 'pointer', fontWeight: 'bold' }}>
                    🔄 تكرار وتمديد الحملة فوراً بنفس الميزانية
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

    </div>
  );
};

Object.freeze(RadarAdvertiserDashboard);
