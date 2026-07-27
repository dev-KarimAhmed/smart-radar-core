
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { usePricingMatrix, PricingMatrix } from '@/hooks/use-pricing-matrix';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { AlertCircle, ArrowDown, ArrowUp, BarChart2, ShieldAlert, Activity, TrendingUp, TrendingDown, ShieldCheck, Loader2, Info } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { RadarBundleIntegrityKernel, GlobalPulseDoc, RadarSovereignIntegrationKernel, AdSovereignPass } from '@/core/logic/sovereign-market-kernel';
import { useAuth } from '@/hooks/use-auth';
import { usePromoStream } from '@/hooks/use-promo-stream';
import { MessageCircle, Wrench } from 'lucide-react';
import { AdDisplayCard } from '@/features/ads/ad-display/contract';
import { useDashboardLanguage } from '@/hooks/use-dashboard-language';

import { cn } from '@/lib/utils';
const styles = {
  style30_1: "space-y-1 font-sans",
  style31_2: "text-sm text-gray-400 flex items-center gap-2",
  style39_3: "bg-black border rounded p-2 text-white text-lg focus:outline-none transition-all duration-300 w-full",
  style41_4: "border-red-500/80 focus:border-red-500 shadow-[0_0_10px_rgba(239,68,68,0.2)] bg-red-950/10",
  style42_5: "border-green-900 focus:border-green-500",
  style240_6: "fixed inset-0 z-[150] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in-25",
  style241_7: "bg-[#0F172A] border border-white/[0.06] rounded-xl w-full max-w-lg text-white shadow-2xl overflow-y-auto max-h-[90vh] relative",
  style245_8: "absolute inset-0 z-50 bg-[#0A0F1D]/98 backdrop-blur-xl p-6 flex flex-col justify-between overflow-y-auto",
  style245_9: "text-right",
  style245_10: "text-left",
  style246_11: "space-y-4",
  style247_12: "flex items-start gap-2.5 text-red-400 border border-red-500/30 bg-red-950/20 p-4 rounded-xl shadow-lg",
  style248_13: "w-5 h-5 shrink-0 animate-bounce text-red-500 mt-0.5",
  style250_14: "text-sm font-black text-red-500",
  style251_15: "text-[11px] text-gray-300 mt-1 leading-normal",
  style263_16: "h-[300px] rounded-[28px]",
  style272_17: "relative rounded-2xl overflow-hidden border border-amber-500/30 bg-[#140b03]/80 space-y-3 p-4 shadow-xl",
  style276_18: "w-full h-32 object-cover rounded-lg opacity-85 hover:scale-102 transition-all duration-500",
  style279_19: "space-y-1",
  style280_20: "inline-block bg-amber-500/10 border border-amber-500/30 text-amber-400 text-[9px] font-black px-2.5 py-0.5 rounded-full mb-1",
  style283_21: "text-base font-black text-white",
  style284_22: "text-[11px] text-gray-300 leading-relaxed",
  style291_23: "w-full h-11 bg-amber-600 hover:bg-amber-500 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-md mt-1",
  style293_24: "w-4 h-4",
  style300_25: "space-y-3 pt-6 border-t border-green-900/40",
  style301_26: "text-center text-[10px] text-gray-400 font-bold uppercase tracking-wider",
  style305_27: "flex gap-2.5",
  style315_28: "flex-1 h-12 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-black text-xs flex items-center justify-center gap-1.5 transition-all shadow-md shadow-emerald-950/20",
  style323_29: "h-12 px-5 bg-white/5 hover:bg-white/10 text-gray-300 border border-white/10 rounded-xl text-xs font-bold",
  style332_30: "p-6 pb-0",
  style333_31: "p-4 rounded-xl border border-green-500/30 bg-green-500/5 backdrop-blur-md animate-pulse-slow",
  style334_32: "flex justify-between items-start mb-2",
  style335_33: "flex items-center gap-2",
  style336_34: "w-5 h-5 text-green-400",
  style337_35: "text-sm font-bold text-green-400",
  style339_36: "bg-green-950 text-green-400 border-green-500/50",
  style340_37: "w-3 h-3 ml-1",
  style340_38: "w-3 h-3 ml-1",
  style344_39: "text-xs text-gray-300 leading-relaxed",
  style350_40: "p-6",
  style351_41: "text-xl font-bold mb-2 text-center text-green-400",
  style352_42: "text-center text-gray-400 text-xs mb-6",
  style354_43: "mt-2 mb-6 p-4 rounded-xl border border-yellow-500/20 bg-yellow-500/5 backdrop-blur-sm",
  style355_44: "flex items-center justify-between mb-3",
  style356_45: "space-y-1",
  style357_46: "text-sm font-bold text-yellow-500 flex items-center gap-2",
  style358_47: "w-4 h-4",
  style360_48: "text-[10px] text-gray-400 leading-tight max-w-[250px]",
  style367_49: "data-[state=checked]:bg-yellow-600",
  style371_50: "bg-black/40 p-2 rounded border border-white/5",
  style372_51: "text-[9px] text-gray-500 italic leading-relaxed",
  style381_52: "mb-4 space-y-2.5",
  style384_53: "p-3 bg-[#330005]/95 border-r-4 border-red-500 rounded-xl text-[#ffb3bf] font-sans text-xs flex items-start gap-2.5 animate-pulse shadow-lg shadow-red-950/20",
  style385_54: "text-sm",
  style386_55: "space-y-1",
  style387_56: "block text-red-400 font-bold",
  style388_57: "leading-relaxed",
  style397_58: "p-3 bg-[#2d1a00]/95 border-r-4 border-amber-500 rounded-xl text-[#ffe0b3] font-sans text-xs flex items-start gap-2.5 animate-pulse shadow-lg shadow-amber-950/20",
  style398_59: "text-sm",
  style399_60: "space-y-1",
  style400_61: "block text-amber-500 font-bold",
  style401_62: "leading-relaxed",
  style410_63: "p-3 bg-[#1d0033]/95 border-r-4 border-purple-500 rounded-xl text-[#eed4ff] font-sans text-xs flex items-start gap-2.5 animate-pulse shadow-lg shadow-purple-950/20",
  style411_64: "text-sm",
  style412_65: "space-y-1",
  style413_66: "block text-purple-400 font-bold",
  style414_67: "leading-relaxed",
  style423_68: "space-y-6 transition-opacity duration-300",
  style423_69: "opacity-30 pointer-events-none",
  style423_70: "opacity-100",
  style425_71: "font-semibold text-green-500 mb-3 text-sm",
  style426_72: "space-y-3",
  style427_73: "w-4 h-4",
  style431_74: "bg-green-800/50",
  style434_75: "font-semibold text-green-500 mb-3 text-sm",
  style435_76: "space-y-3",
  style436_77: "w-4 h-4",
  style437_78: "w-4 h-4",
  style442_79: "mt-4 p-2 bg-red-900/50 border border-red-500 text-red-200 text-sm rounded flex items-center gap-2",
  style442_80: "w-4 h-4",
  style444_81: "mt-6 flex gap-3",
  style448_82: "flex-1 font-bold py-3 rounded transition-all duration-300",
  style450_83: "bg-red-950/40 text-red-400 border border-red-500/20 cursor-not-allowed shadow-[inset_0_0_10px_rgba(239,68,68,0.1)]",
  style451_84: "bg-green-600 hover:bg-green-500 text-white",
  style454_85: "animate-spin",
  style456_86: "px-6 border-gray-600 hover:bg-gray-800 text-gray-300 font-bold py-3 rounded transition-colors",
  style467_87: "fixed inset-0 z-[150] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in-25",
  style468_88: "bg-[#0F172A] border-2 border-yellow-600/50 rounded-2xl p-6 w-full max-w-sm text-white shadow-2xl space-y-4",
  style469_89: "text-lg font-black text-center text-yellow-400 flex items-center justify-center gap-2",
  style470_90: "w-5 h-5 text-yellow-500 animate-pulse",
  style473_91: "text-center text-gray-400 text-xs leading-normal font-semibold",
  style477_92: "text-center p-4 bg-black/60 rounded-xl border border-yellow-600/20",
  style478_93: "text-[10px] text-gray-500 font-bold uppercase tracking-wider mb-1",
  style479_94: "text-3xl font-black text-yellow-400",
  style480_95: "text-sm font-bold text-white mr-1",
  style482_96: "text-[9px] text-gray-500 font-bold block mt-1",
  style485_97: "text-center text-[9px] text-yellow-600/90 leading-tight font-black uppercase",
  style489_98: "space-y-3 pt-2",
  style494_99: "w-full h-14 justify-center bg-yellow-600 hover:bg-yellow-500 text-black font-black text-sm tracking-wide shadow-lg shadow-yellow-900/10 rounded-xl",
  style496_100: "animate-spin text-black",
  style502_101: "w-full h-11 border-white/5 hover:bg-white/10 text-gray-405 hover:text-white rounded-xl text-xs font-bold",
  style515_102: "fixed inset-0 z-[150] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4",
  style516_103: "bg-[#0F172A] border border-yellow-700 rounded-xl p-6 w-full max-w-md text-white shadow-2xl",
  style517_104: "text-xl font-bold mb-2 text-center text-yellow-400 flex items-center justify-center gap-2",
  style517_105: "w-6 h-6",
  style518_106: "text-center text-gray-400 text-sm mb-6",
  style521_107: "text-center mb-6 p-4 bg-black/50 rounded-lg border border-yellow-900",
  style522_108: "text-gray-400 text-sm",
  style523_109: "text-3xl font-bold text-yellow-400 animate-pulse",
  style525_110: "text-center text-gray-300 font-semibold mb-4",
  style526_111: "space-y-3",
  style527_112: "w-full h-16 justify-center bg-yellow-600 hover:bg-yellow-700 text-black",
  style528_113: "animate-spin",
  style528_114: "font-bold",
  style531_115: "w-full mt-6 text-gray-400 hover:text-white",
  style538_116: "fixed inset-0 z-[150] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4",
  style539_117: "bg-[#0F172A] border border-white/[0.06] rounded-xl p-6 w-full max-w-md text-white shadow-2xl",
  style540_118: "text-xl font-bold mb-2 text-center text-green-400",
  style541_119: "text-center text-gray-400 text-sm mb-6",
  style545_120: "text-center mb-6 p-4 bg-black/50 rounded-lg border border-green-900",
  style546_121: "text-gray-400 text-sm",
  style547_122: "text-3xl font-bold text-green-400 animate-pulse",
  style547_123: "text-lg",
  style550_124: "text-center text-gray-300 font-semibold mb-4",
  style551_125: "space-y-3",
  style552_126: "w-full h-16 justify-between border-blue-500/50 hover:bg-blue-900/50 text-white",
  style553_127: "animate-spin",
  style553_128: "font-bold",
  style554_129: "text-xl font-mono bg-blue-900/80 px-3 py-1 rounded",
  style556_130: "w-full h-16 justify-between bg-green-600 hover:bg-green-700 text-white",
  style557_131: "animate-spin",
  style557_132: "font-bold",
  style558_133: "text-xl font-mono bg-green-800 px-3 py-1 rounded",
  style560_134: "w-full h-16 justify-between border-yellow-500/50 hover:bg-yellow-900/50 text-white",
  style561_135: "animate-spin",
  style561_136: "font-bold",
  style562_137: "text-xl font-mono bg-yellow-900/80 px-3 py-1 rounded",
  style565_138: "w-full mt-6 text-gray-400 hover:text-white",
} as const;


interface PricingCardProps {
  mode: 'setup' | 'offer';
  tripDistance?: number;
  tripDuration?: number;
  requiresOfficialRate?: boolean;
  onConfirm: (data: PricingMatrix | number) => void;
  onCancel: () => void;
  isSubmitting?: boolean;
}

const PricingInput = React.memo(({ id, label, icon, value, onChange, hasError }: { id: string, label: string, icon: React.ReactNode, value: number, onChange: (val: number) => void, hasError?: boolean }) => (
  <div className={styles.style30_1}>
    <Label htmlFor={id} className={styles.style31_2}>{icon} {label}</Label>
    <Input
      id={id}
      type="number"
      min="0"
      step="0.05"
      value={value}
      onChange={e => onChange(parseFloat(e.target.value) || 0)}
      className={cn(styles.style39_3, hasError
          ? styles.style41_4
          : styles.style42_5)}
    />
  </div>
));
PricingInput.displayName = 'PricingInput';

export function DriverPricingCard({ mode, tripDistance = 0, tripDuration = 0, requiresOfficialRate = false, onConfirm, onCancel, isSubmitting = false }: PricingCardProps) {
  const { isArabic } = useDashboardLanguage();
  const { matrix: savedMatrix, saveMatrix, isSaving } = usePricingMatrix();
  const { toast } = useToast();
  const [matrix, setMatrix] = useState<Omit<PricingMatrix, 'isOperatorLinked'>>(savedMatrix);
  const [isOperatorLinked, setIsOperatorLinked] = useState(savedMatrix.isOperatorLinked || false);
  const [error, setError] = useState('');

  const [pulseData, setPulseData] = useState<{ trend: 'up' | 'down', msg: string, change: string } | null>(null);

  const { user } = useAuth();

  const { activeAds } = usePromoStream(user?.district || 'وادي السير', user?.governorate || 'عمان');

  const currentRating = useMemo(() => {
    if (!user) return 5.0;
    if (user.rating !== undefined) return user.rating;
    if (user.ratingSum && user.ratingCount) return user.ratingSum / user.ratingCount;
    return 5.0;
  }, [user]);

  const dynamicDeviationRatio = useMemo(() => {
    const TEST_KM = 5;
    const TEST_MIN = 10;
    const marketRefPrice = 1.00 + (0.25 * TEST_KM) + (0.05 * TEST_MIN); // 1.00 + 1.25 + 0.50 = 2.75
    const driverFareTest = (matrix.shortTripFare || 0) + ((matrix.longTripKmRate || 0) * TEST_KM) + ((matrix.minuteRate || 0) * TEST_MIN);
    return marketRefPrice ? (marketRefPrice - driverFareTest) / marketRefPrice : 0;
  }, [matrix.shortTripFare, matrix.longTripKmRate, matrix.minuteRate]);

  const isBlocked = useMemo(() => {
    return dynamicDeviationRatio >= 0.15 || (matrix.shortTripFare || 0) < 1.0;
  }, [dynamicDeviationRatio, matrix.shortTripFare]);

  const isWarned = useMemo(() => {
    return dynamicDeviationRatio >= 0.10 && dynamicDeviationRatio < 0.15 && (matrix.shortTripFare || 0) >= 1.0;
  }, [dynamicDeviationRatio, matrix.shortTripFare]);

  const isImmuneRisk = useMemo(() => {
    return currentRating <= 4.3;
  }, [currentRating]);

  const professionalAd = useMemo(() => {
    const defaultProfessionalAd = {
      adId: 'promo-captain-professional-default',
      title: 'مركز صيانة للسائقين',
      description: 'عرض صيانة قريب للسائقين والناقلين مع حجز مباشر وسعر واضح.',
      actionUrl: 'https://wa.me/962790000000',
      buttonText: 'احجز العرض',
      bannerUrl: 'https://images.unsplash.com/photo-1486006920555-c77dce18193b?auto=format&fit=crop&q=80&w=1200'
    };

    if (!isBlocked) return defaultProfessionalAd;

    // Convert to AdSovereignPass
    const passAds = activeAds.map(ad => ({
      adId: ad.id,
      targetScale: ad.targetDistrict ? 'District' : 'Governorate' as any,
      targetLocationName: ad.targetDistrict || ad.targetGovernorate || 'وادي السير',
      adType: ad.adType as any,
      bannerUrl: ad.content?.posterUrl || ''
    })).filter(ad => ad.adType === 'CAPTAIN_PROFESSIONAL');

    if (passAds.length === 0) {
      return {
        adId: 'promo-captain-professional-default',
        title: '🛠️ مركز تكنولوجيا الزيوت والصيانة المعتمد للناقلين',
        description: 'للقباطنة والناقلين الأحرار: وفر وقت غضبك واستفد من التجميد السعري! احصل على غيار زيت توتال بخصم 25% مجاناً وفحص كمبيوتر فوري لمركبتك.',
        actionUrl: 'https://wa.me/962790000000',
        buttonText: 'احجز العرض الفوري للناقلين',
        bannerUrl: 'https://images.unsplash.com/photo-1486006920555-c77dce18193b?auto=format&fit=crop&q=80&w=1200'
      };
    }

    const matchedPass = RadarSovereignIntegrationKernel.triggerContextualAdStream(
      dynamicDeviationRatio, // deviation ratio here is >= 0.15
      { role: 'captain', district: user?.district || 'وادي السير', governorate: user?.governorate || 'عمان' },
      passAds as any
    );

    if (matchedPass) {
      const realAd = activeAds.find(ad => ad.id === matchedPass.adId);
      return {
        adId: matchedPass.adId,
        title: realAd?.content?.title || '🛠️ عرض صيانة مهني معتمد',
        description: realAd?.content?.description || 'عرض تكنولوجي للناقلين الأحرار في جهتهم الصيانة.',
        actionUrl: realAd?.action?.actionUrl || realAd?.actionUrl || 'https://wa.me/962790000000',
        buttonText: realAd?.action?.buttonText || realAd?.buttonText || 'احجز العرض',
        bannerUrl: realAd?.content?.posterUrl || 'https://images.unsplash.com/photo-1486006920555-c77dce18193b?auto=format&fit=crop&q=80&w=1200'
      };
    }

    return defaultProfessionalAd;
  }, [isBlocked, activeAds, user, dynamicDeviationRatio]);

  useEffect(() => {
    setPulseData({
      trend: 'up',
      msg: 'السوق متعطش في قطاعك الحالي، يمكنك المناورة برفع قيمك.',
      change: '+5.2%'
    });
  }, [mode]);

  const handleSetupSave = useCallback(async () => {
    const matrixToSave: PricingMatrix = { ...matrix, isOperatorLinked };

    if (!isOperatorLinked) {
      if (matrixToSave.shortTripFare <= 0 || matrixToSave.longTripKmRate <= 0) {
        setError('يُمنع وجود قيم صفرية أو سالبة في الحقول الأساسية عند استخدام التسعير اليدوي.');
        return;
      }

      // V5.5 Bundle integrity evaluation
      const bundle = {
        basePrice: matrixToSave.shortTripFare,
        perKmPrice: matrixToSave.longTripKmRate,
        perMinPrice: matrixToSave.minuteRate
      };

      const defaultPulseDoc: GlobalPulseDoc = {
        market_base_avg: 1.00,
        market_km_avg: 0.25,
        market_min_avg: 0.05,
        last_updated: Date.now()
      };

      const evaluation = RadarBundleIntegrityKernel.validateBundleIntegrity(bundle, defaultPulseDoc);

      if (evaluation.status === 'REJECTED') {
        setError(evaluation.message);
        toast({
          variant: 'destructive',
          title: 'تم رفض العرض',
          description: evaluation.message,
        });
        return;
      }

      if (evaluation.status === 'APPROVED_WITH_WARNING') {
        toast({
          variant: 'default',
          title: 'تنبيه',
          description: evaluation.message
        });
      }
    }

    setError('');

    const result = await saveMatrix(matrixToSave);

    if (result.success) {
      onConfirm(matrixToSave);
    } else if (result.error && result.error !== 'User cancelled.') {
      setError(result.error);
    }
  }, [matrix, isOperatorLinked, saveMatrix, onConfirm, toast]);


  // 1. احتساب تسعيرة العداد الموحد (γ = 1.35)
  const officialRateFare = useMemo(() => {
    if (!tripDistance) return 0;
    const GAMMA = 1.35;
    const baseFare = 1.20;
    const additionalDistance = Math.max(0, tripDistance - 1);
    const distanceCost = additionalDistance * 0.25;
    const timeCost = 0.05 * tripDuration;
    return Math.max(1.00, Number(((baseFare + distanceCost + timeCost) * GAMMA).toFixed(2)));
  }, [tripDistance, tripDuration]);

  const calculatedOffers = useMemo(() => {
    if (mode !== 'offer' || !tripDistance || !tripDuration) return null;

    // [المادة 11] التعرف على المسافة الإضافية والسعر الأساسي
    const additionalDistance = Math.max(0, tripDistance - 1);
    const calculatedBaseFare = savedMatrix.shortTripFare + (savedMatrix.longTripKmRate * additionalDistance);

    // 2. حساب الوقت: ضرب الدقائق الناتجة في سعر دقيقة السائق
    const timeSovereigntyCharge = savedMatrix.minuteRate * tripDuration;

    const finalCalculatedFare = calculatedBaseFare + timeSovereigntyCharge;

    return {
      min: Number((finalCalculatedFare * 0.85).toFixed(2)),
      avg: Number(finalCalculatedFare.toFixed(2)),
      peak: Number((finalCalculatedFare * 1.30).toFixed(2)),
    };
  }, [mode, tripDistance, tripDuration, savedMatrix]);


  if (mode === 'setup') {
    return (
       <div className={styles.style240_6}>
          <div className={styles.style241_7}>

            {/* [المادة 4] تجميد شاشة السائق وعرض الإعلان المهني الموجه عند تجاوز الـ 15% */}
            {isBlocked && (
              <div className={cn(styles.style245_8, isArabic ? styles.style245_9 : styles.style245_10)} dir={isArabic ? 'rtl' : 'ltr'}>
                <div className={styles.style246_11}>
                  <div className={styles.style247_12}>
                    <AlertCircle className={styles.style248_13} />
                    <div>
                      <h4 className={styles.style250_14}>{isArabic ? "🚫 خطأ في المداخلات: القيمة غير منطقية تشغيلياً" : "🚫 Input Error: Value is operationally illogical"}</h4>
                      <p className={styles.style251_15}>
                        {isArabic ? "السعر المدخل بعيد جداً عن السعر المناسب. تم إيقاف العرض مؤقتاً حتى تعدل السعر بما يناسب السوق." : "The entered price is too far from the appropriate market price. The offer has been paused until you adjust it."}
                      </p>
                    </div>
                  </div>

                  {professionalAd && (
                    <AdDisplayCard
                      ad={professionalAd}
                      showHeart={false}
                      badgeText={isArabic ? "دعم السائق" : "Driver Support"}
                      ctaText={professionalAd.buttonText}
                      className={styles.style263_16}
                      onOpen={(event: React.MouseEvent) => {
                        event.stopPropagation();
                        window.open(professionalAd.actionUrl, '_blank');
                      }}
                    />
                  )}

                  {professionalAd && false && (
                    <div className={styles.style272_17}>
                      <img
                        src={professionalAd.bannerUrl}
                        alt={professionalAd.title}
                        className={styles.style276_18}
                        referrerPolicy="no-referrer"
                      />
                      <div className={styles.style279_19}>
                        <span className={styles.style280_20}>
                          🛠️ إعلانات مهنية موجهة للناقلين
                        </span>
                        <h3 className={styles.style283_21}>{professionalAd.title}</h3>
                        <p className={styles.style284_22}>
                          {professionalAd.description}
                        </p>
                      </div>

                      <Button
                        onClick={() => window.open(professionalAd.actionUrl, '_blank')}
                        className={styles.style291_23}
                      >
                        <MessageCircle className={styles.style293_24} />
                        <span>{professionalAd.buttonText} ($Zero-Click ROI)</span>
                      </Button>
                    </div>
                  )}
                </div>

                <div className={styles.style300_25}>
                  <p className={styles.style301_26}>
                    عد إلى السعر المناسب لاستقبال طلبات الركاب في منطقتك:
                  </p>

                  <div className={styles.style305_27}>
                    <Button
                      onClick={() => {
                        setMatrix({
                          shortTripFare: 1.20,
                          longTripKmRate: 0.25,
                          minuteRate: 0.05
                        });
                        setError('');
                      }}
                      className={styles.style315_28}
                    >
                      <span>استعادة السعر المناسب بضغطة واحدة</span>
                    </Button>

                    <Button
                      onClick={onCancel}
                      variant="outline"
                      className={styles.style323_29}
                    >
                      إلغاء الخروج
                    </Button>
                  </div>
                </div>
              </div>
            )}

            <div className={styles.style332_30}>
                <div className={styles.style333_31}>
                    <div className={styles.style334_32}>
                        <div className={styles.style335_33}>
                        <Activity className={styles.style336_34} />
                        <span className={styles.style337_35}>متوسط السعر المحلي</span>
                        </div>
                        <Badge variant="outline" className={styles.style339_36}>
                        {pulseData?.trend === 'up' ? <TrendingUp className={styles.style340_37} /> : <TrendingDown className={styles.style340_38} />}
                        {pulseData?.change}
                        </Badge>
                    </div>
                    <p className={styles.style344_39}>
                        "{pulseData?.msg}"
                    </p>
                </div>
            </div>

            <div className={styles.style350_40}>
              <h3 className={styles.style351_41}>إعدادات التسعير</h3>
              <p className={styles.style352_42}>هذه هي هويتك المالية في الميدان. اضبطها مرة واحدة.</p>

               <div className={styles.style354_43}>
                  <div className={styles.style355_44}>
                      <div className={styles.style356_45}>
                          <Label className={styles.style357_46}>
                              <ShieldCheck className={styles.style358_47} /> التزام بنمط المشغل (أوبر/كريم/تكسي)
                          </Label>
                          <p className={styles.style360_48}>
                              تفعيل هذا الزر يعني أنك تزاول المهنة حالياً تحت مظلة مشغلك الرسمي، والمنصة مجرد وسيط تقني لعرض هويتك.
                          </p>
                      </div>
                      <Switch
                          checked={isOperatorLinked}
                          onCheckedChange={setIsOperatorLinked}
                          className={styles.style367_49}
                      />
                  </div>

                  <div className={styles.style371_50}>
                      <p className={styles.style372_51}>
                          "بصفتي الناقل، أقر بأن تفعيل هذا الخيار هو تصريح مني للركاب بتبعية مرجعتي السعرية للمشغل المسجل في ملفي،
                          وأن الرادار الذكي لا يتدخل في هذا العقد التشغيلي."
                      </p>
                  </div>
              </div>

              {/* Sovereign Alerts Panel */}
              {!isOperatorLinked && (
                <div className={styles.style381_52}>
                  {/* Warning 1: Blocked (Deviation >= 15% or Base < 1.0) */}
                  {isBlocked && (
                    <div className={styles.style384_53}>
                      <span className={styles.style385_54}>🚫</span>
                      <div className={styles.style386_55}>
                        <strong className={styles.style387_56}>خطأ في المداخلات: القيمة غير منطقية تشغيلياً.</strong>
                        <p className={styles.style388_57}>
                          السعر الحالي غير مناسب للسوق. يرجى مراجعة قيم التسعير.
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Warning 2: Amber Deviation Warning (10% to 14.9%) */}
                  {isWarned && (
                    <div className={styles.style397_58}>
                      <span className={styles.style398_59}>⚠️</span>
                      <div className={styles.style399_60}>
                        <strong className={styles.style400_61}>تنبيه: سعرك الحالي بعيد عن متوسط السوق.</strong>
                        <p className={styles.style401_62}>
                          هذا السعر قد يؤثر على تقييمك وظهورك للركاب.
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Warning 3: Immune system risk (Rating <= 4.3) */}
                  {isImmuneRisk && (
                    <div className={styles.style410_63}>
                      <span className={styles.style411_64}>🧬</span>
                      <div className={styles.style412_65}>
                        <strong className={styles.style413_66}>تحذير مناعي حرج: رصيد الثقة الخاص بك يقترب من عتبة الحظر التلقائي (4.2).</strong>
                        <p className={styles.style414_67}>
                          أي انخفاض إضافي قد يؤدي إلى إيقاف الحساب مؤقتاً لحماية جودة الخدمة.
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              )}

              <div className={cn(styles.style423_68, isOperatorLinked ? styles.style423_69 : styles.style423_70)}>
                <div>
                   <h4 className={styles.style425_71}>🟢 المنطقة الأولى: التسعير المقطوع (الأساس)</h4>
                   <div className={styles.style426_72}>
                     <PricingInput id="shortTripFare" label="السعر الأساسي المقطوع (يشمل أول 1 كم) 🚕" value={matrix.shortTripFare} onChange={val => setMatrix(m => ({...m, shortTripFare: val}))} icon={<BarChart2 className={styles.style427_73}/>} hasError={!isOperatorLinked && ((matrix.shortTripFare || 0) < 1.0 || isBlocked)}/>
                   </div>
                </div>

                <Separator className={styles.style431_74}/>

                <div>
                   <h4 className={styles.style434_75}>🟡 المنطقة الثانية: التسعير المدمج (المسافة + الوقت)</h4>
                   <div className={styles.style435_76}>
                    <PricingInput id="longTripKmRate" label="سعر الكيلومتر الإضافي (بعد أول كم) 🛣️" value={matrix.longTripKmRate} onChange={val => setMatrix(m => ({...m, longTripKmRate: val}))} icon={<BarChart2 className={styles.style436_77}/>} hasError={!isOperatorLinked && isBlocked}/>
                    <PricingInput id="minuteRate" label="سعر دقيقة الطريق (لمواجهة الأزمات) ⏱️" value={matrix.minuteRate} onChange={val => setMatrix(m => ({...m, minuteRate: val}))} icon={<ShieldAlert className={styles.style437_78}/>} hasError={!isOperatorLinked && isBlocked}/>
                   </div>
                </div>
              </div>

              {error && <div className={styles.style442_79}><AlertCircle className={styles.style442_80}/> {error}</div>}

              <div className={styles.style444_81}>
                <Button
                  onClick={handleSetupSave}
                  disabled={isSaving || (!isOperatorLinked && isBlocked)}
                  className={cn(styles.style448_82, !isOperatorLinked && isBlocked
                      ? styles.style450_83
                      : styles.style451_84)}
                >
                  {isSaving ? <Loader2 className={styles.style454_85} /> : 'حفظ الهوية السعرية 💾'}
                </Button>
                <Button onClick={onCancel} variant="outline" className={styles.style456_86}>إغلاق</Button>
              </div>
            </div>
          </div>
       </div>
    );
  }

  if (mode === 'offer') {
    if (requiresOfficialRate) {
      return (
        <div className={styles.style467_87}>
          <div className={styles.style468_88}>
             <h3 className={styles.style469_89}>
               <ShieldAlert className={styles.style470_90} />
               طلب مقيد بالعداد الموحد
             </h3>
             <p className={styles.style473_91}>
               اختار الراكب نمط "عداد التطبيقات الذكية". تم إلغاء وتجميد تسعيرتك الحرة قسرياً لهذا الطلب التزاماً بالعدالة.
             </p>

             <div className={styles.style477_92}>
                <p className={styles.style478_93}>تسعيرة العداد الموحد المجمد</p>
                <div className={styles.style479_94}>
                  {officialRateFare.toFixed(2)} <span className={styles.style480_95}>دينار عراقي</span>
                </div>
                <span className={styles.style482_96}>تشمل معامل الطريق التقريبي (γ = 1.35)</span>
             </div>

             <p className={styles.style485_97}>
               بموجب ميثاق صفر عمولة، السعر مستقطع بالكامل لصالحك والمنصة تعمل كحارس أمين للقيمة بصفر تكلفة سحابة ($0.00).
             </p>

             <div className={styles.style489_98}>
                <Button
                  onClick={() => onConfirm(officialRateFare)}
                  disabled={isSubmitting}
                  size="lg"
                  className={styles.style494_99}
                >
                   {isSubmitting ? <Loader2 className={styles.style496_100} /> : 'تقديم عرض العداد وتجميد القيمة'}
                </Button>

                <Button
                  onClick={onCancel}
                  variant="outline"
                  className={styles.style502_101}
                >
                  تجاهل وإغلاق
                </Button>
             </div>
          </div>
        </div>
      );
    }

    if (calculatedOffers) {
    if (savedMatrix.isOperatorLinked) {
      return (
        <div className={styles.style515_102}>
          <div className={styles.style516_103}>
             <h3 className={styles.style517_104}><ShieldCheck className={styles.style517_105}/> وضع التسعير المؤسسي</h3>
             <p className={styles.style518_106}>
                أنت تعمل حالياً تحت مظلة مشغلك الرسمي. السعر سيتم تحديده بناءً على عداد المشغل الرسمي عند انتهاء الرحلة.
             </p>
             <div className={styles.style521_107}>
                <p className={styles.style522_108}>السعر المعتمد</p>
                <p className={styles.style523_109}>حسب عداد المشغل</p>
             </div>
             <p className={styles.style525_110}>هل توافق على قبول المهمة بهذا الشرط؟</p>
             <div className={styles.style526_111}>
                <Button onClick={() => onConfirm(-1)} disabled={isSubmitting} size="lg" className={styles.style527_112}>
                   {isSubmitting ? <Loader2 className={styles.style528_113} /> : <span className={styles.style528_114}>نعم، أقبل وألتزم بتسعيرة المشغل</span>}
                </Button>
             </div>
             <Button onClick={onCancel} variant="ghost" className={styles.style531_115}>تجاهل وإغلاق</Button>
          </div>
        </div>
      );
    }

    return (
      <div className={styles.style538_116}>
        <div className={styles.style539_117}>
           <h3 className={styles.style540_118}>محاكي العرض الذكي 🎯</h3>
           <p className={styles.style541_119}>
              بناءً على هويتك، هذه هي خياراتك للمسافة ({tripDistance.toFixed(1)} كم).
           </p>

           <div className={styles.style545_120}>
              <p className={styles.style546_121}>السعر المرجعي المحسوب</p>
              <p className={styles.style547_122}>{calculatedOffers.avg.toFixed(2)} <span className={styles.style547_123}>دينار</span></p>
           </div>

           <p className={styles.style550_124}>اختر استراتيجيتك بضغطة واحدة:</p>
           <div className={styles.style551_125}>
              <Button onClick={() => onConfirm(calculatedOffers.min)} disabled={isSubmitting} variant="outline" size="lg" className={styles.style552_126}>
                {isSubmitting ? <Loader2 className={styles.style553_127} /> : <span className={styles.style553_128}>إرسال الحد الأدنى (تنافسي)</span>}
                <span className={styles.style554_129}>{calculatedOffers.min.toFixed(2)}</span>
              </Button>
              <Button onClick={() => onConfirm(calculatedOffers.avg)} disabled={isSubmitting} size="lg" className={styles.style556_130}>
                 {isSubmitting ? <Loader2 className={styles.style557_131} /> : <span className={styles.style557_132}>إرسال السعر المتوسط (المعتاد)</span>}
                 <span className={styles.style558_133}>{calculatedOffers.avg.toFixed(2)}</span>
              </Button>
              <Button onClick={() => onConfirm(calculatedOffers.peak)} disabled={isSubmitting} variant="outline" size="lg" className={styles.style560_134}>
                {isSubmitting ? <Loader2 className={styles.style561_135} /> : <span className={styles.style561_136}>إرسال سعر الذروة (الأعلى)</span>}
                <span className={styles.style562_137}>{calculatedOffers.peak.toFixed(2)}</span>
              </Button>
           </div>
           <Button onClick={onCancel} variant="ghost" className={styles.style565_138}>تجاهل وإغلاق</Button>
        </div>
      </div>
    );
  }
  }

  return null;
}
