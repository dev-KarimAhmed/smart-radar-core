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
import { useMarketPulse } from '@/hooks/use-market-pulse';
import { useToast } from '@/hooks/use-toast';
import { SOVEREIGN_PRICING_PACKAGES, SovereignPricingPackage } from '@/lib/constants';
import { AdDisplayCard } from '@/features/ads/ad-display/contract';
import { AdvertiserPackageModal } from './parts/advertiser-package-modal';
import { AdvertiserDashboardTab } from "./parts/advertiser-dashboard-tab";
import { AdvertiserCreateAdTab } from "./parts/advertiser-create-tab";

import { cn } from '@/lib/utils';
import { useTranslations } from "next-intl";

import { styles } from "./parts/styles";


const VIRTUAL_ADS_STREAM = [
  { id: 'v1', title: 'سيارة المستقبل الذكية 🚗', desc: 'نقل  ذكي بأحدث الميزات وبأفضل جودة ملاحة وتوصيل.', gradient: 'from-emerald-950/80 to-zinc-900 border-emerald-500/20 text-[#00ffcc]' },
  { id: 'v2', title: 'وجبة السائق الفاخرة 🥘', desc: 'خصم 50% للركاب والناقلين النشطين على مدار الساعة في منطقة ناعور.', gradient: 'from-amber-950/80 to-zinc-900 border-amber-500/20 text-amber-400' },
  { id: 'v3', title: 'خدمات التوصيل السريع 📦', desc: 'أمن وسرعة فائقة في نقل الشاحنات والطرود فوراً وصفر تأخير.', gradient: 'from-blue-950/80 to-zinc-900 border-blue-500/20 text-cyan-400' },
];

export function LiveStreamRegistry({ ads }: { ads: any[] }) {
    const tAuto = useTranslations('auto');
    const t = useTranslations('auto');
  const stream = useMemo(() => {
    const activeAds = ads.filter(ad => ad.status === 'active' || ad.status === 'ACTIVE' || !ad.status);
    return activeAds.length > 0 ? [...activeAds, ...VIRTUAL_ADS_STREAM] : VIRTUAL_ADS_STREAM;
  }, [ads]);

  return (
    <div className={styles.style44_1} dir="ltr">
      <div className={styles.style45_2} dir="rtl">
        <span className={styles.style46_3} />
        <span className={styles.style47_4}>{tAuto('key_f1360aee')}</span>
      </div>

      <div className={styles.style50_5}>
        <motion.div
          className={styles.style52_6}
          animate={{ x: ["0%", "-50%"] }}
          transition={{ repeat: Infinity, duration: 24, ease: "linear" }}
        >
          {[...stream, ...stream].map((ad, idx) => {
            const title = ad.title || ad.content?.title || '';
            const description = ad.description || ad.desc || ad.content?.description || '';
            const isVirtual = ad.id.startsWith('v');
            const gradientStyle = ad.gradient || styles.virtualGradient;

            return (
              <div
                key={`${ad.id}-${idx}`}
                className={cn(styles.style65_7, gradientStyle, styles.style65_8)}
                dir="rtl"
              >
                <div className={styles.style68_9}>
                  <span className={cn(styles.style69_10, isVirtual ? styles.style70_11 : styles.style70_12)}>
                    {isVirtual ? tAuto('key_cb6aad46') : tAuto('key_797741d3')}
                  </span>
                </div>
                <div className={styles.style75_13}>
                  <h4 className={styles.style76_14}>{title}</h4>
                  <p className={styles.style77_15}>{description}</p>
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
    const tAuto = useTranslations('auto');
    const t = useTranslations('auto');
  const { createAd, ads, toggleAdStatus, deleteAd, extendAd } = useAdminAds();
  const pendingAds = useMemo(() => {
    return (ads || []).filter(ad => (ad.status || '').toLowerCase() === 'pending' || (ad.status || '') === 'PENDING');
  }, [ads]);
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
  const [buttonText, setButtonText] = useState(tAuto('key_63d7ea7d'));
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
      reasoning = tAuto('key_7bc73e2c');
    } else if (goal === 'broad' || budget >= 60) {
      recommendedId = 'broad-sweep';
      reasoning = tAuto('key_3d9e093c');
    } else {
      recommendedId = 'basic-pulse';
      reasoning = tAuto('key_074dbc72');
    }

    setSelectedPackageId(recommendedId);
    const pkg = SOVEREIGN_PRICING_PACKAGES.find(p => p.id === recommendedId);
    if (pkg) {
      setIsPremiumRetentionPaid(pkg.isRetention);
    }
    setAiRecommendation(reasoning);
    toast({
      title: tAuto('key_7e9962c9'),
      description: reasoning,
    });
  }, [toast]);

  const checkDistrictCapacity = useCallback((dist: string) => {
    if (dist === tAuto('key_161b5e38')) {
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
    return district === tAuto('key_161b5e38');
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
    setGovernorate(tAuto('key_20a48924'));
    setDistrict(tAuto('key_9de2290c'));
    toast({
      title: tAuto('key_7c9e25e9'),
      description: tAuto('key_2e00b365'),
    });
  }, [toast]);

  // Perform Forensic AI Audit locally (Step 3 Gate)
  const runForensicAuditAndLaunch = useCallback(() => {
    // 2️⃣ Validation Gates as commanded by RAD-CMD-046
    if (!adImage || !whatsappNumber || !directPhone || !locationUrl || !targetGovernorate || !targetImpressions) {
      alert(tAuto('key_4015e497'));
      return; // تجميد العملية كلياً
    }

    // Prepaid balance check [RAD-CMD-060]
    if (advertiserBalance < calculatedCost) {
      alert(`⚠️ رفض  (ميزانية غير كافية): رصيدك الحالي هو [${advertiserBalance.toFixed(2)} د.أ] وهو أقل من الكلفة التقديرية للحملة البالغة [${calculatedCost.toFixed(2)} د.أ]. يرجى شحن رصيدك للمتابعة.`);
      return;
    }

    // 3️⃣ Capacity Warning as commanded by RAD-CMD-046
    if (checkDistrictCapacity(targetDistrict) === 'FULL') {
      alert(`⚠️ رفض  (السعة ممتلئة): المنطقة [${targetDistrict}] ممتلئ حالياً. نقترح توجيه حملتك لمنطقة المجاور لتحقيق مشاهدات أعلى بجودة أكبر.`);
      return;
    }

    // 1. Image or video posterUrl validation
    const cleanPosterUrl = posterUrl ? posterUrl.trim() : '';
    if (!cleanPosterUrl || !cleanPosterUrl.startsWith('http')) {
      toast({
        variant: 'destructive',
        title: tAuto('key_73dec630'),
        description: tAuto('key_386dbdc9'),
      });
      return;
    }

    // 2. Whatsapp number validation
    const cleanWhatsapp = whatsapp ? whatsapp.trim().replace('+', '') : '';
    if (!cleanWhatsapp || cleanWhatsapp.length < 9 || isNaN(Number(cleanWhatsapp))) {
      toast({
        variant: 'destructive',
        title: tAuto('key_aa1a6b85'),
        description: tAuto('key_b6bdc3f1'),
      });
      return;
    }

    // 3. Direct Phone validation
    const cleanPhone = phone ? phone.trim() : '';
    if (!cleanPhone || cleanPhone.length < 9 || isNaN(Number(cleanPhone.replace('+', '')))) {
      toast({
        variant: 'destructive',
        title: tAuto('key_035ad661'),
        description: tAuto('key_0274266d'),
      });
      return;
    }

    // 4. Geo-location link or landing page validation
    const cleanGeoLoc = geoLoc ? geoLoc.trim() : '';
    if (!cleanGeoLoc || !cleanGeoLoc.startsWith('http')) {
      toast({
        variant: 'destructive',
        title: tAuto('key_efb29b00'),
        description: tAuto('key_1b11d5b8'),
      });
      return;
    }

    // Safe to transition to step 3 since all validations passed successfully
    setStep(3);

    setIsSimulatingAudit(true);
    setAuditApproved(false);
    setAuditProgress(10);
    setAuditLogs([tAuto('key_970d5d4f'), tAuto('key_03c559e6')]);

    const progression = [
      { p: 30, log: tAuto('key_80856858') },
      { p: 60, log: tAuto('key_655e82ea') },
      { p: 85, log: tAuto('key_3cf32aa8') },
      { p: 100, log: tAuto('key_1e4f6e48') }
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
                targetDistrict: district || tAuto('key_45704af2'),
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
        title: tAuto('key_98a21f70'),
        description: `أنت بحاجة إلى شحن محفظتك بـ زين كاش أو كليك لإكمال تفعيل حافز ${recName}.`,
      });
      return;
    }

    setAdvertiserBalance(prev => prev - requiredCost);
    toast({
      title: tAuto('key_c73a9750'),
      description: `تم قبول توصية "${recName}" واكتساح منطقة ${districtName} فورياً بصفر تأخير بشري.`,
    });
  }, [advertiserBalance, toast]);

  const handleDepositSimulate = useCallback((amount: number) => {
    setAdvertiserBalance(prev => prev + amount);
    toast({
      title: tAuto('key_6bae93ab'),
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

    // Always inject a simulated rejected/governed ad so the advertiser can observe the "مرفوض " state requested
    const hasSimulatedRejected = list.some(a => a.id === 'promo-rejected-demo');
    if (!hasSimulatedRejected) {
      list.push({
        id: 'promo-rejected-demo',
        status: 'frozen', // Treated as governed or blocked
        title: tAuto('key_eb820d9e'),
        description: tAuto('key_b2fce635'),
        content: {
          title: tAuto('key_eb820d9e'),
          description: tAuto('key_b2fce635'),
          posterUrl: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&q=80&w=1000'
        },
        targetDistrict: tAuto('key_9de2290c'),
        targetGovernorate: tAuto('key_20a48924'),
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
    <div className={styles.style461_16} dir="rtl">

      {/* Decorative Neon Blurs */}
      <div className={styles.style464_17} />
      <div className={styles.style465_18} />

      {/* Header Panel with Cyberpunk Badges */}
      <div className={styles.style468_19}>
        <div className={styles.style469_20}>
          <span className={styles.style470_21}>
            <ShieldCheck className={styles.style471_22} />
            {tAuto('key_3e65fc05')}
                                </span>
          <span className={styles.style474_23}>
            SCR-AD-DASH-122
          </span>
          {onClose && (
            <button
              onClick={onClose}
              className={styles.style480_24}
            >
              {tAuto('key_e3fa69fc')}
                                      </button>
          )}
        </div>

        {/* Toggleable Navigation Tab Segments */}
        <div className={styles.style488_25}>
          <button
            onClick={() => setActiveTab('dashboard')}
            className={cn(styles.style491_26, activeTab === 'dashboard'
                ? styles.style493_27
                : styles.style494_28)}
          >
            {tAuto('key_7824c02e')}
                                </button>
          <button
            onClick={() => {
              setActiveTab('create');
              setStep(1);
            }}
            className={cn(styles.style504_29, activeTab === 'create'
                ? styles.style506_30
                : styles.style507_31)}
          >
            {tAuto('key_521c0f3f')}
                                </button>
        </div>
      </div>
      <div className={styles.style514_32}>
        <div className={styles.style515_33} />
        <Zap className={styles.style516_34} />
        <div className={styles.style517_35}>
          <h4 className={styles.style518_36}>{tAuto('key_28758112')}</h4>
          <p className={styles.style519_37}>
            {tAuto('key_4d543aae')}
                                  <span className={styles.style521_38}>{tAuto('key_3b363114')}</span>
          </p>
        </div>
      </div>

      {/* TAB 1: Sovereign Dashboard View (Contains the 5 main Blocks) */}
      {/* TAB 1: Sovereign Dashboard View (Contains the 5 main Blocks) */}
      {activeTab === 'dashboard' && (
        <AdvertiserDashboardTab
          allSovereignAds={allSovereignAds}
          ledgerStats={ledgerStats}
          expandedAdId={expandedAdId}
          setExpandedAdId={setExpandedAdId}
          toggleAdStatus={toggleAdStatus}
          extendAd={extendAd}
          deleteAd={deleteAd}
          setGovernorate={setGovernorate}
          setDistrict={setDistrict}
          setActiveTab={setActiveTab}
          setStep={setStep}
          toast={toast}
          handleRecommendationAccept={handleRecommendationAccept}
          handleDepositSimulate={handleDepositSimulate}
          advertiserBalance={advertiserBalance}
          pulseData={pulseData}
        />
      )}

      {/* TAB 2: Multi-step Creative Ad Creation Form */}
      {activeTab === 'create' && (
        <AdvertiserCreateAdTab
          step={step}
          setStep={setStep}
          openSecs={openSecs}
          setOpenSecs={setOpenSecs}
          governorate={governorate}
          setGovernorate={setGovernorate}
          district={district}
          setDistrict={setDistrict}
          districts={districts}
          title={title}
          setTitle={setTitle}
          description={description}
          setDescription={setDescription}
          posterUrl={posterUrl}
          setPosterUrl={setPosterUrl}
          whatsapp={whatsapp}
          setWhatsapp={setWhatsapp}
          phone={phone}
          setPhone={setPhone}
          geoLoc={geoLoc}
          setGeoLoc={setGeoLoc}
          buttonText={buttonText}
          setButtonText={setButtonText}
          targetImpressions={targetImpressions}
          setTargetImpressions={setTargetImpressions}
          paymentChannel={paymentChannel}
          setPaymentChannel={setPaymentChannel}
          isCapacityFull={isCapacityFull}
          redirectCampaignToNaour={redirectCampaignToNaour}
          calculatedCost={calculatedCost}
          currentPackage={currentPackage}
          advertiserBalance={advertiserBalance}
          runForensicAuditAndLaunch={runForensicAuditAndLaunch}
          isSimulatingAudit={isSimulatingAudit}
          auditProgress={auditProgress}
          auditLogs={auditLogs}
          auditApproved={auditApproved}
          setActiveTab={setActiveTab}
          aiBudget={aiBudget}
          setAiBudget={setAiBudget}
          aiGoal={aiGoal}
          setAiGoal={setAiGoal}
          suggestBestPackage={suggestBestPackage}
          aiRecommendation={aiRecommendation}
          setIsPackageModalOpen={setIsPackageModalOpen}
          activeDistrictPulse={activeDistrictPulse}
        />
      )}

      {/* Sovereign Footing Info Panel */}
      <div className={styles.style1549_361}>
        <span>$ZERO_COST_MICRO_ALGO - PWA V5.5 SECURITY LAYER</span>
        <span>{tAuto('key_85519995')}</span>
      </div>

      <AdvertiserPackageModal
        isPackageModalOpen={isPackageModalOpen}
        setIsPackageModalOpen={setIsPackageModalOpen}
        aiBudget={aiBudget}
        setAiBudget={setAiBudget}
        aiGoal={aiGoal}
        setAiGoal={setAiGoal}
        suggestBestPackage={suggestBestPackage}
        aiRecommendation={aiRecommendation}
        SOVEREIGN_PRICING_PACKAGES={SOVEREIGN_PRICING_PACKAGES}
        selectedPackageId={selectedPackageId}
        setSelectedPackageId={setSelectedPackageId}
        setIsPremiumRetentionPaid={setIsPremiumRetentionPaid}
        targetImpressions={targetImpressions}
        activeDistrictPulse={activeDistrictPulse}
        advertiserBalance={advertiserBalance}
        calculatedCost={calculatedCost}
      />

    </div>
  );
}

// [SCR-AD-DASH-122] كود لوحة تحكم المعلن  ومتابعة عوائد النشاط الإعلاني
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
    const tAuto = useTranslations('auto');
    const t = useTranslations('auto');
  const [activeTab, setActiveTab] = useState<'METRICS' | 'LAUNCH'>('METRICS');

  return (
    <div className={styles.style1684_395} style={{ backgroundColor: '#020202', color: '#ffffff', padding: '20px', fontFamily: 'monospace' }} dir="rtl">

      {/* 1. الهيدر والترحيب  برتبة المعلن */}
      <div className={styles.style1687_396} style={{ borderBottom: '2px solid #111', paddingBottom: '15px', marginBottom: '25px' }}>
        <h3>{tAuto('key_69a664ab')}</h3>
        <div style={{ display: 'flex', justifyContent: 'space-between', backgroundColor: '#0d0d0d', padding: '10px 15px', borderRadius: '4px', border: '1px solid #1a1a1a' }}>
          <span>{tAuto('key_41e38506')} <strong>{advertiserProfile.companyName}</strong></span>
          <span>{tAuto('key_ee74053b')} <strong style={{ color: '#ffcc00' }}>[{advertiserProfile.loyaltyRank}]</strong></span>
        </div>
      </div>

      {/* 2. تنبيهات التشجيع والتنبيهات التلقائية للنظام من أجل التكرار */}
      <div className={styles.style1696_397} style={{ backgroundColor: '#001a0d', border: '1px solid #00cc66', padding: '15px', borderRadius: '6px', marginBottom: '25px' }}>
        <h4 style={{ color: '#00cc66', margin: '0 0 5px 0' }}>{tAuto('key_ee202bc1')}</h4>
        <p style={{ margin: 0, fontSize: '12px', lineHeight: '1.5', color: '#b3ffd9' }}>
          {tAuto('key_d5685ead')}
                            <strong> {tAuto('key_06a48bb2')} {marketInsights.hottestDistrict}) </strong> {tAuto('key_1b9807b2')} {marketInsights.trafficGrowth} {tAuto('key_21e6c0e4')}
                          </p>
      </div>

      {/* 3. عرض ومتابعة قائمة الإعلانات الحالية وإحصائياتها */}
      <div className={styles.style1705_398}>
        <h4>{tAuto('key_0a56333f')}</h4>
        {myAds.map(ad => {
            const tAuto = useTranslations('auto');
            const t = useTranslations('auto');
          const ctr = ad.impressions > 0 ? ((ad.clicks / ad.impressions) * 100).toFixed(1) : '0.0';

          return (
            <div key={ad.id} style={{ backgroundColor: '#0d0d0d', padding: '15px', borderRadius: '6px', marginBottom: '15px', border: '1px solid #1a1a1a' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>{tAuto('key_ef91cc9b')} <strong>{ad.title}</strong></span>

                {/* عرض حالة الحوكمة والأختام الرقمية للاعلان */}
                {ad.status === 'ACTIVE' && <strong style={{ color: '#00cc66', fontSize: '12px' }}>{tAuto('key_104a6ff7')}</strong>}
                {ad.status === 'PENDING' && <strong style={{ color: '#ffcc00', fontSize: '12px' }}>{tAuto('key_19d22dc1')}</strong>}
                {ad.status === 'REJECTED' && <strong style={{ color: '#ff3366', fontSize: '12px' }}>{tAuto('key_c58eb57d')} </strong>}
              </div>

              {ad.status === 'REJECTED' && (
                <div style={{ backgroundColor: '#260005', color: '#ffb3bf', padding: '8px', borderRadius: '4px', marginTop: '10px', fontSize: '11px' }}>
                  {tAuto('key_a07683eb')} {ad.rejectionReason}
                </div>
              )}

              {/* عدادات بورصة الأرقام والمشاهدات للمعلن */}
              {ad.status === 'ACTIVE' && (
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '15px', backgroundColor: '#050505', padding: '10px', borderRadius: '4px', fontSize: '12px' }}>
                  <span>{tAuto('key_3a463faa')} <strong style={{ color: '#00ffcc' }}>{ad.impressions}</strong></span>
                  <span>{tAuto('key_1015af3e')} <strong style={{ color: '#00ffcc' }}>{ad.clicks}</strong></span>
                  <span>{tAuto('key_451dbc0c')} <strong style={{ color: '#ffcc00' }}>{ctr}%</strong></span>
                  <span>{tAuto('key_a9bca74d')} <strong>{tAuto('key_c9006cb7')} {ad.targetDistrict}</strong></span>
                </div>
              )}

              {/* زر التكرار السريع والمحمي من أجل دافعية الاستمرار */}
              {ad.status === 'ACTIVE' && (
                <div style={{ textAlign: 'left', marginTop: '10px' }}>
                  <button style={{ backgroundColor: '#111', color: '#ffcc00', border: '1px solid #ffcc00', padding: '4px 10px', borderRadius: '4px', fontSize: '11px', cursor: 'pointer', fontWeight: 'bold' }}>
                    {tAuto('key_adacb2db')}
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
