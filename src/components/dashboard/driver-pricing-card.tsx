
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
  <div className="space-y-1 font-sans">
    <Label htmlFor={id} className="text-sm text-gray-400 flex items-center gap-2">{icon} {label}</Label>
    <Input
      id={id}
      type="number"
      min="0"
      step="0.05"
      value={value}
      onChange={e => onChange(parseFloat(e.target.value) || 0)}
      className={`bg-black border rounded p-2 text-white text-lg focus:outline-none transition-all duration-300 w-full ${
        hasError 
          ? 'border-red-500/80 focus:border-red-500 shadow-[0_0_10px_rgba(239,68,68,0.2)] bg-red-950/10' 
          : 'border-green-900 focus:border-green-500'
      }`}
    />
  </div>
));
PricingInput.displayName = 'PricingInput';

export function DriverPricingCard({ mode, tripDistance = 0, tripDuration = 0, requiresOfficialRate = false, onConfirm, onCancel, isSubmitting = false }: PricingCardProps) {
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
    if (!isBlocked) return null;
    
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
    
    return null;
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
          title: '🚫 تم السد الجنائي والرفض',
          description: evaluation.message,
        });
        return;
      }

      if (evaluation.status === 'APPROVED_WITH_WARNING') {
        toast({
          variant: 'default',
          title: '⚠️ تنبيه سيادي',
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


  // 1. احتساب تسعيرة العداد الموحد السيادي للفرقاء (γ = 1.35)
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

    // 2. سيادة الوقت: ضرب الدقائق الناتجة عن النبض في سعر دقيقة الكابتن
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
       <div className="fixed inset-0 z-[150] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in-25">
          <div className="bg-[#091B09] border border-green-800 rounded-xl w-full max-w-lg text-white shadow-2xl overflow-y-auto max-h-[90vh] relative">
            
            {/* [المادة 4] تجميد شاشة السائق وعرض الإعلان المهني الموجه عند تجاوز الـ 15% */}
            {isBlocked && (
              <div className="absolute inset-0 z-50 bg-[#061206]/98 backdrop-blur-xl p-6 flex flex-col justify-between overflow-y-auto text-right" dir="rtl">
                <div className="space-y-4">
                  <div className="flex items-start gap-2.5 text-red-400 border border-red-500/30 bg-red-950/20 p-4 rounded-xl shadow-lg">
                    <AlertCircle className="w-5 h-5 shrink-0 animate-bounce text-red-500 mt-0.5" />
                    <div>
                      <h4 className="text-sm font-black text-red-500">🚫 خطأ في المداخلات: القيمة غير منطقية تشغيلياً</h4>
                      <p className="text-[11px] text-gray-300 mt-1 leading-normal">
                        الرادار الذكي لا يقبل نبضاً يهدد استدامة الميدان. تم حظر العرض الخارجي وتجميد الشاشة مؤقتاً لتصحيح أسعارك بما يلائم السوق الموحد.
                      </p>
                    </div>
                  </div>

                  {professionalAd && (
                    <div className="relative rounded-2xl overflow-hidden border border-amber-500/30 bg-[#140b03]/80 space-y-3 p-4 shadow-xl">
                      <img 
                        src={professionalAd.bannerUrl}
                        alt={professionalAd.title}
                        className="w-full h-32 object-cover rounded-lg opacity-85 hover:scale-102 transition-all duration-500"
                        referrerPolicy="no-referrer"
                      />
                      <div className="space-y-1">
                        <span className="inline-block bg-amber-500/10 border border-amber-500/30 text-amber-400 text-[9px] font-black px-2.5 py-0.5 rounded-full mb-1">
                          🛠️ إعلانات مهنية موجهة للناقلين
                        </span>
                        <h3 className="text-base font-black text-white">{professionalAd.title}</h3>
                        <p className="text-[11px] text-gray-300 leading-relaxed">
                          {professionalAd.description}
                        </p>
                      </div>
                      
                      <Button 
                        onClick={() => window.open(professionalAd.actionUrl, '_blank')}
                        className="w-full h-11 bg-amber-600 hover:bg-amber-500 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-md mt-1"
                      >
                        <MessageCircle className="w-4 h-4" />
                        <span>{professionalAd.buttonText} ($Zero-Click ROI)</span>
                      </Button>
                    </div>
                  )}
                </div>

                <div className="space-y-3 pt-6 border-t border-green-900/40">
                  <p className="text-center text-[10px] text-gray-400 font-bold uppercase tracking-wider">
                    عُد للحدود الآمنة لتسييل نبضك الرقمي واستقبال ركاب اللواء:
                  </p>
                  
                  <div className="flex gap-2.5">
                    <Button
                      onClick={() => {
                        setMatrix({
                          shortTripFare: 1.20,
                          longTripKmRate: 0.25,
                          minuteRate: 0.05
                        });
                        setError('');
                      }}
                      className="flex-1 h-12 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-black text-xs flex items-center justify-center gap-1.5 transition-all shadow-md shadow-emerald-950/20"
                    >
                      <span>استعادة القيم العادلة للنبض (بضغطة واحدة) ⚖️</span>
                    </Button>
                    
                    <Button
                      onClick={onCancel}
                      variant="outline"
                      className="h-12 px-5 bg-white/5 hover:bg-white/10 text-gray-300 border border-white/10 rounded-xl text-xs font-bold"
                    >
                      إلغاء الخروج
                    </Button>
                  </div>
                </div>
              </div>
            )}
            
            <div className="p-6 pb-0">
                <div className="p-4 rounded-xl border border-green-500/30 bg-green-500/5 backdrop-blur-md animate-pulse-slow">
                    <div className="flex justify-between items-start mb-2">
                        <div className="flex items-center gap-2">
                        <Activity className="w-5 h-5 text-green-400" />
                        <span className="text-sm font-bold text-green-400">نبض البورصة المحلية</span>
                        </div>
                        <Badge variant="outline" className="bg-green-950 text-green-400 border-green-500/50">
                        {pulseData?.trend === 'up' ? <TrendingUp className="w-3 h-3 ml-1" /> : <TrendingDown className="w-3 h-3 ml-1" />}
                        {pulseData?.change}
                        </Badge>
                    </div>
                    <p className="text-xs text-gray-300 leading-relaxed">
                        "{pulseData?.msg}"
                    </p>
                </div>
            </div>

            <div className="p-6">
              <h3 className="text-xl font-bold mb-2 text-center text-green-400">مصفوفة التسعير السيادية</h3>
              <p className="text-center text-gray-400 text-xs mb-6">هذه هي هويتك المالية في الميدان. اضبطها مرة واحدة.</p>
              
               <div className="mt-2 mb-6 p-4 rounded-xl border border-yellow-500/20 bg-yellow-500/5 backdrop-blur-sm">
                  <div className="flex items-center justify-between mb-3">
                      <div className="space-y-1">
                          <Label className="text-sm font-bold text-yellow-500 flex items-center gap-2">
                              <ShieldCheck className="w-4 h-4" /> التزام بنمط المشغل (أوبر/كريم/تكسي)
                          </Label>
                          <p className="text-[10px] text-gray-400 leading-tight max-w-[250px]">
                              تفعيل هذا الزر يعني أنك تزاول المهنة حالياً تحت مظلة مشغلك الرسمي، والمنصة مجرد وسيط تقني لعرض هويتك.
                          </p>
                      </div>
                      <Switch 
                          checked={isOperatorLinked} 
                          onCheckedChange={setIsOperatorLinked}
                          className="data-[state=checked]:bg-yellow-600"
                      />
                  </div>
                  
                  <div className="bg-black/40 p-2 rounded border border-white/5">
                      <p className="text-[9px] text-gray-500 italic leading-relaxed">
                          "بصفتي الناقل، أقر بأن تفعيل هذا الخيار هو تصريح مني للركاب بتبعية مرجعتي السعرية للمشغل المسجل في ملفي، 
                          وأن الرادار الذكي لا يتدخل في هذا العقد التشغيلي."
                      </p>
                  </div>
              </div>

              {/* Sovereign Alerts Panel */}
              {!isOperatorLinked && (
                <div className="mb-4 space-y-2.5">
                  {/* Warning 1: Blocked (Deviation >= 15% or Base < 1.0) */}
                  {isBlocked && (
                    <div className="p-3 bg-[#330005]/95 border-r-4 border-red-500 rounded-xl text-[#ffb3bf] font-sans text-xs flex items-start gap-2.5 animate-pulse shadow-lg shadow-red-950/20">
                      <span className="text-sm">🚫</span>
                      <div className="space-y-1">
                        <strong className="block text-red-400 font-bold">خطأ في المداخلات: القيمة غير منطقية تشغيلياً.</strong>
                        <p className="leading-relaxed">
                          الرادار الذكي لا يقبل نبضاً يهدد استدامة الميدان. يرجى مراجعة قيم التسعير.
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Warning 2: Amber Deviation Warning (10% to 14.9%) */}
                  {isWarned && (
                    <div className="p-3 bg-[#2d1a00]/95 border-r-4 border-amber-500 rounded-xl text-[#ffe0b3] font-sans text-xs flex items-start gap-2.5 animate-pulse shadow-lg shadow-amber-950/20">
                      <span className="text-sm">⚠️</span>
                      <div className="space-y-1">
                        <strong className="block text-amber-500 font-bold">تنبيه سيادي: سعرك الحالي يبتعد عن استقرار السوق.</strong>
                        <p className="leading-relaxed">
                          هذا النبض قد يؤثر سلباً على 'تقييم الوسيط' ورتبتك في الرادار، مما يقلل من ظهورك للركاب.
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Warning 3: Immune system risk (Rating <= 4.3) */}
                  {isImmuneRisk && (
                    <div className="p-3 bg-[#1d0033]/95 border-r-4 border-purple-500 rounded-xl text-[#eed4ff] font-sans text-xs flex items-start gap-2.5 animate-pulse shadow-lg shadow-purple-950/20">
                      <span className="text-sm">🧬</span>
                      <div className="space-y-1">
                        <strong className="block text-purple-400 font-bold">تحذير مناعي حرج: رصيد الثقة الخاص بك يقترب من عتبة الحظر التلقائي (4.2).</strong>
                        <p className="leading-relaxed">
                          أي هبوط إضافي سيؤدي إلى تفعيل 'بروتوكول ديكتاتورية الخادم' وإغلاق الحساب فوراً لتطهير الميدان.
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              )}

              <div className={`space-y-6 transition-opacity duration-300 ${isOperatorLinked ? 'opacity-30 pointer-events-none' : 'opacity-100'}`}>
                <div>
                   <h4 className="font-semibold text-green-500 mb-3 text-sm">🟢 المنطقة الأولى: التسعير المقطوع (الأساس)</h4>
                   <div className="space-y-3">
                     <PricingInput id="shortTripFare" label="السعر الأساسي المقطوع (يشمل أول 1 كم) 🚕" value={matrix.shortTripFare} onChange={val => setMatrix(m => ({...m, shortTripFare: val}))} icon={<BarChart2 className="w-4 h-4"/>} hasError={!isOperatorLinked && ((matrix.shortTripFare || 0) < 1.0 || isBlocked)}/>
                   </div>
                </div>

                <Separator className="bg-green-800/50"/>
                
                <div>
                   <h4 className="font-semibold text-green-500 mb-3 text-sm">🟡 المنطقة الثانية: التسعير المدمج (المسافة + الوقت)</h4>
                   <div className="space-y-3">
                    <PricingInput id="longTripKmRate" label="سعر الكيلومتر الإضافي (بعد أول كم) 🛣️" value={matrix.longTripKmRate} onChange={val => setMatrix(m => ({...m, longTripKmRate: val}))} icon={<BarChart2 className="w-4 h-4"/>} hasError={!isOperatorLinked && isBlocked}/>
                    <PricingInput id="minuteRate" label="سعر دقيقة الطريق (لمواجهة الأزمات) ⏱️" value={matrix.minuteRate} onChange={val => setMatrix(m => ({...m, minuteRate: val}))} icon={<ShieldAlert className="w-4 h-4"/>} hasError={!isOperatorLinked && isBlocked}/>
                   </div>
                </div>
              </div>
              
              {error && <div className="mt-4 p-2 bg-red-900/50 border border-red-500 text-red-200 text-sm rounded flex items-center gap-2"><AlertCircle className="w-4 h-4"/> {error}</div>}

              <div className="mt-6 flex gap-3">
                <Button 
                  onClick={handleSetupSave} 
                  disabled={isSaving || (!isOperatorLinked && isBlocked)} 
                  className={`flex-1 font-bold py-3 rounded transition-all duration-300 ${
                    !isOperatorLinked && isBlocked 
                      ? 'bg-red-950/40 text-red-400 border border-red-500/20 cursor-not-allowed shadow-[inset_0_0_10px_rgba(239,68,68,0.1)]' 
                      : 'bg-green-600 hover:bg-green-500 text-white'
                  }`}
                >
                  {isSaving ? <Loader2 className="animate-spin" /> : 'حفظ الهوية السعرية 💾'}
                </Button>
                <Button onClick={onCancel} variant="outline" className="px-6 border-gray-600 hover:bg-gray-800 text-gray-300 font-bold py-3 rounded transition-colors">إغلاق</Button>
              </div>
            </div>
          </div>
       </div>
    );
  }

  if (mode === 'offer') {
    if (requiresOfficialRate) {
      return (
        <div className="fixed inset-0 z-[150] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in-25">
          <div className="bg-[#091B09] border-2 border-yellow-600/50 rounded-2xl p-6 w-full max-w-sm text-white shadow-2xl space-y-4">
             <h3 className="text-lg font-black text-center text-yellow-400 flex items-center justify-center gap-2">
               <ShieldAlert className="w-5 h-5 text-yellow-500 animate-pulse" />
               طلب مقيد بالعداد الموحد
             </h3>
             <p className="text-center text-gray-400 text-xs leading-normal font-semibold">
               اختار الراكب نمط "عداد التطبيقات الذكية". تم إلغاء وتجميد تسعيرتك الحرة قسرياً لهذا الطلب التزاماً بالعدالة.
             </p>

             <div className="text-center p-4 bg-black/60 rounded-xl border border-yellow-600/20">
                <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mb-1">تسعيرة العداد الموحد المجمد</p>
                <div className="text-3xl font-black text-yellow-400">
                  {officialRateFare.toFixed(2)} <span className="text-sm font-bold text-white mr-1">دينار عراقي</span>
                </div>
                <span className="text-[9px] text-gray-500 font-bold block mt-1">مصنّعة للتعارج الميداني (γ = 1.35)</span>
             </div>
             
             <p className="text-center text-[9px] text-yellow-600/90 leading-tight font-black uppercase">
               بموجب ميثاق صفر عمولة، السعر مستقطع بالكامل لصالحك والمنصة تعمل كحارس أمين للقيمة بصفر تكلفة سحابة ($0.00).
             </p>

             <div className="space-y-3 pt-2">
                <Button 
                  onClick={() => onConfirm(officialRateFare)} 
                  disabled={isSubmitting} 
                  size="lg" 
                  className="w-full h-14 justify-center bg-yellow-600 hover:bg-yellow-500 text-black font-black text-sm tracking-wide shadow-lg shadow-yellow-900/10 rounded-xl"
                >
                   {isSubmitting ? <Loader2 className="animate-spin text-black" /> : 'تقديم عرض العداد وتجميد القيمة'}
                </Button>
                
                <Button 
                  onClick={onCancel} 
                  variant="outline" 
                  className="w-full h-11 border-white/5 hover:bg-white/10 text-gray-405 hover:text-white rounded-xl text-xs font-bold"
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
        <div className="fixed inset-0 z-[150] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-[#091B09] border border-yellow-700 rounded-xl p-6 w-full max-w-md text-white shadow-2xl">
             <h3 className="text-xl font-bold mb-2 text-center text-yellow-400 flex items-center justify-center gap-2"><ShieldCheck className="w-6 h-6"/> وضع التسعير المؤسسي</h3>
             <p className="text-center text-gray-400 text-sm mb-6">
                أنت تعمل حالياً تحت مظلة مشغلك الرسمي. السعر سيتم تحديده بناءً على عداد المشغل الرسمي عند انتهاء الرحلة.
             </p>
             <div className="text-center mb-6 p-4 bg-black/50 rounded-lg border border-yellow-900">
                <p className="text-gray-400 text-sm">السعر المعتمد</p>
                <p className="text-3xl font-bold text-yellow-400 animate-pulse">حسب عداد المشغل</p>
             </div>
             <p className="text-center text-gray-300 font-semibold mb-4">هل توافق على قبول المهمة بهذا الشرط؟</p>
             <div className="space-y-3">
                <Button onClick={() => onConfirm(-1)} disabled={isSubmitting} size="lg" className="w-full h-16 justify-center bg-yellow-600 hover:bg-yellow-700 text-black">
                   {isSubmitting ? <Loader2 className="animate-spin" /> : <span className="font-bold">نعم، أقبل وألتزم بتسعيرة المشغل</span>}
                </Button>
             </div>
             <Button onClick={onCancel} variant="ghost" className="w-full mt-6 text-gray-400 hover:text-white">تجاهل وإغلاق</Button>
          </div>
        </div>
      );
    }

    return (
      <div className="fixed inset-0 z-[150] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
        <div className="bg-[#091B09] border border-green-800 rounded-xl p-6 w-full max-w-md text-white shadow-2xl">
           <h3 className="text-xl font-bold mb-2 text-center text-green-400">محاكي العرض الذكي 🎯</h3>
           <p className="text-center text-gray-400 text-sm mb-6">
              بناءً على هويتك، هذه هي خياراتك للمسافة ({tripDistance.toFixed(1)} كم).
           </p>

           <div className="text-center mb-6 p-4 bg-black/50 rounded-lg border border-green-900">
              <p className="text-gray-400 text-sm">السعر المرجعي المحسوب</p>
              <p className="text-3xl font-bold text-green-400 animate-pulse">{calculatedOffers.avg.toFixed(2)} <span className="text-lg">دينار</span></p>
           </div>
           
           <p className="text-center text-gray-300 font-semibold mb-4">اختر استراتيجيتك بضغطة واحدة:</p>
           <div className="space-y-3">
              <Button onClick={() => onConfirm(calculatedOffers.min)} disabled={isSubmitting} variant="outline" size="lg" className="w-full h-16 justify-between border-blue-500/50 hover:bg-blue-900/50 text-white">
                {isSubmitting ? <Loader2 className="animate-spin" /> : <span className="font-bold">إرسال الحد الأدنى (تنافسي)</span>}
                <span className="text-xl font-mono bg-blue-900/80 px-3 py-1 rounded">{calculatedOffers.min.toFixed(2)}</span>
              </Button>
              <Button onClick={() => onConfirm(calculatedOffers.avg)} disabled={isSubmitting} size="lg" className="w-full h-16 justify-between bg-green-600 hover:bg-green-700 text-white">
                 {isSubmitting ? <Loader2 className="animate-spin" /> : <span className="font-bold">إرسال السعر المتوسط (المعتاد)</span>}
                 <span className="text-xl font-mono bg-green-800 px-3 py-1 rounded">{calculatedOffers.avg.toFixed(2)}</span>
              </Button>
              <Button onClick={() => onConfirm(calculatedOffers.peak)} disabled={isSubmitting} variant="outline" size="lg" className="w-full h-16 justify-between border-yellow-500/50 hover:bg-yellow-900/50 text-white">
                {isSubmitting ? <Loader2 className="animate-spin" /> : <span className="font-bold">إرسال سعر الذروة (الأعلى)</span>}
                <span className="text-xl font-mono bg-yellow-900/80 px-3 py-1 rounded">{calculatedOffers.peak.toFixed(2)}</span>
              </Button>
           </div>
           <Button onClick={onCancel} variant="ghost" className="w-full mt-6 text-gray-400 hover:text-white">تجاهل وإغلاق</Button>
        </div>
      </div>
    );
  }
  }

  return null;
}
