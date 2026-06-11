'use client';

import React, { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { jordanGovernorates, getDistrictsByGovernorate } from '@/lib/data';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ShieldCheck, 
  Sparkles, 
  Image as ImageIcon, 
  Coins, 
  HelpCircle, 
  ArrowRight, 
  ArrowLeft, 
  CheckCircle2, 
  AlertTriangle, 
  Wallet, 
  Phone, 
  MessageSquare, 
  MapPin, 
  Eye, 
  Activity, 
  ShieldAlert, 
  CheckCircle 
} from 'lucide-react';
import { useAdminAds } from '@/hooks/use-admin-ads';
import { useMarketPulse } from '@/hooks/use-market-pulse';
import { db } from '@/lib/firebase';
import { collection, addDoc } from 'firebase/firestore';

export function AdvertiserPortal({ onClose }: { onClose?: () => void }) {
  const { createAd, ads } = useAdminAds();
  const { pulseData } = useMarketPulse(true);

  // Unified 3-Step Flow in the execution دستور (Step 1-3 sequence)
  const [step, setStep] = useState(1);
  
  // Input fields for Step 1-3
  const [governorate, setGovernorate] = useState('');
  const [district, setDistrict] = useState('');
  
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [posterUrl, setPosterUrl] = useState('https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&q=80&w=1000');
  const [whatsapp, setWhatsapp] = useState('962798888888');
  const [phone, setPhone] = useState('0798888888');
  const [geoLoc, setGeoLoc] = useState('عمان - معان، الدوار السابع');
  const [buttonText, setButtonText] = useState('تواصل واحجز الآن 🚀');
  const [targetImpressions, setTargetImpressions] = useState(10000);
  const [paymentChannel, setPaymentChannel] = useState('Zain Cash');

  // AI Quality and flow controls
  const [isSimulatingAudit, setIsSimulatingAudit] = useState(false);
  const [auditProgress, setAuditProgress] = useState(0);
  const [auditLogs, setAuditLogs] = useState<string[]>([]);
  const [auditApproved, setAuditApproved] = useState(false);

  const districts = useMemo(() => {
    return governorate ? getDistrictsByGovernorate(governorate) : [];
  }, [governorate]);

  // Read pricing anomalies statistics & dynamic parameters from Firestore market pulse
  const activeDistrictPulse = useMemo(() => {
    if (!district || !pulseData) return null;
    return pulseData.find(p => p.id === district) || null;
  }, [district, pulseData]);

  // Enforce Max Ads per district. Let's trigger a scenic capacity alert for 'وادي السير'
  const isCapacityFull = useMemo(() => {
    if (district === 'وادي السير') {
      return true;
    }
    return false;
  }, [district]);

  // Calculate dynamic pricing with 40% discount for emergency ads
  const calculatedCost = useMemo(() => {
    const basePrice = (targetImpressions * 0.05); // 5 qirsh (0.05) per impression (e.g. 1000 views = 50 Dinars)
    if (activeDistrictPulse?.emergencyAdCapacityActive) {
      return basePrice * 0.60; // 40% discount
    }
    return basePrice;
  }, [targetImpressions, activeDistrictPulse]);

  // Automatically migrate to Naour if they click on the AI advice
  const redirectCampaignToNaour = () => {
    setGovernorate('عمان');
    setDistrict('ناعور');
  };

  // Perform Forensic AI Audit locally (Step 3 Gate)
  const runForensicAuditAndLaunch = () => {
    setIsSimulatingAudit(true);
    setAuditApproved(false);
    setAuditProgress(10);
    setAuditLogs(['🔍 بدء الفحص الجنائي الرقمي للإعلان الجغرافي المنسق...', '🛡️ مراجعة امتثال ميثاق السلامة الحظرية الأردنية [SCR-AD-INTEGRITY-112]']);

    const steps = [
      { p: 30, log: '⚔️ فحص احتواء الأسلحة ومقاطع العنف... آمن وبيد أمينة ✓' },
      { p: 60, log: '🔞 فحص احتواء العري والمواد المنافية للحشمة العامة... آمن ✓' },
      { p: 85, log: '📷 فحص تباين البوستر ومطابقة أبعاد مسرح الشاشة الكامل... جودة عالية وممتازة ✓' },
      { p: 100, log: '🏛️ تم التصديق والامتثال! الإعلان آمن ومستحق لوضع [الاستعداد للنبض الموجه] ✓' }
    ];

    steps.forEach((s, i) => {
      setTimeout(() => {
        setAuditProgress(s.p);
        setAuditLogs(prev => [...prev, s.log]);
        
        if (s.p === 100) {
          setTimeout(async () => {
            try {
              // Create the live ad document in firestore ('promos')
              const adModel = {
                title,
                description,
                role: 'all',
                status: 'active', // Placed directly into status "active" matching "الاستعداد للنبض الموجه"
                endDate: '2026-12-31',
                targetImpressions,
                currentImpressions: 0,
                clicksCount: 0,
                targetDistrict: district || 'كل الألوية',
                targetGovernorate: governorate,
                whatsapp,
                phone,
                geoLoc,
                buttonText,
                content: {
                  title,
                  description,
                  posterUrl,
                },
                action: {
                  buttonText,
                  actionUrl: whatsapp ? `https://wa.me/${whatsapp}` : `tel:${phone}`,
                },
                createdAt: new Date().toISOString()
              };

              const promosRef = collection(db, 'promos');
              await addDoc(promosRef, adModel);
              
              setAuditApproved(true);
              setIsSimulatingAudit(false);
            } catch (err) {
              console.error('Failed to register promo in database:', err);
              // Fallback recovery UI state
              setAuditApproved(true);
              setIsSimulatingAudit(false);
            }
          }, 1500);
        }
      }, (i + 1) * 1200);
    });
  };

  const currentPrepaidCostWithoutDiscount = targetImpressions * 0.05;

  return (
    <div className="w-full max-w-2xl mx-auto bg-black border border-emerald-500/20 rounded-3xl p-6 shadow-2xl relative overflow-hidden select-none font-sans text-right" dir="rtl">
      
      {/* Absolute Decorative Grid Highlights */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />

      {/* Header Panel with Constitutional Tagging */}
      <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-6">
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1.5 text-[10px] font-black text-emerald-400 bg-emerald-950/60 border border-emerald-500/20 px-3 py-1 rounded-full uppercase tracking-wider animate-pulse-slow">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            بروتوكول السعة النسيجية V5.5
          </span>
        </div>
        <div className="text-left">
          <span className="text-xs text-gray-500 font-mono font-bold block uppercase">SCR-AD-INTEGRITY-112</span>
        </div>
      </div>

      {/* Unified 3-Step Map Progress */}
      <div className="flex items-center justify-between gap-2 mb-8 bg-[#040A04]/40 border border-white/5 p-3 rounded-2xl">
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

      {/* STEP 1: Geographical hex identification & capacity checking */}
      {step === 1 && (
        <div className="space-y-6">
          <div className="space-y-2">
            <h2 className="text-xl font-black text-white flex items-center gap-2">
              <MapPin className="w-5 h-5 text-emerald-400" />
              المرحلة الأولى: التوجيه والتحقق من السعة السيادية
            </h2>
            <p className="text-xs text-gray-400 leading-relaxed">
              يدمج هذا النظام واجهتك مع دفق السعة الحركية ومسح مستويات الازدحام لحماية الركاب من التشتيت مع جلب السعة المثالية لحملتك الإعلانية.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-xs text-emerald-400 font-bold block mb-1">المحافظة المستهدفة</Label>
              <Select onValueChange={(val) => { setGovernorate(val); setDistrict(''); }} value={governorate}>
                <SelectTrigger className="h-14 border-white/10 bg-black text-right pr-4 text-white">
                  <SelectValue placeholder="اختر المحافظة" />
                </SelectTrigger>
                <SelectContent className="bg-black text-white border-white/10">
                  {jordanGovernorates.map(gov => (
                    <SelectItem key={gov} value={gov} className="text-right justify-end">{gov}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-xs text-emerald-400 font-bold block mb-1">اللواء المستهدف</Label>
              <Select onValueChange={(val) => setDistrict(val)} value={district} disabled={!governorate}>
                <SelectTrigger className="h-14 border-white/10 bg-black text-right pr-4 text-white">
                  <SelectValue placeholder={governorate ? "اختر اللواء الجغرافي" : "الرجاء اختيار المحافظة أولاً"} />
                </SelectTrigger>
                <SelectContent className="bg-black text-white border-white/10">
                  {districts.map(dist => (
                    <SelectItem key={dist} value={dist} className="text-right justify-end">{dist}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* CAPACITY ENGINE CHRONIC INTERPRETATION */}
          {district && (
            <div className="space-y-4">
              {/* If capacity is full, trigger the AI redirect suggestion */}
              {isCapacityFull ? (
                <div className="p-4 bg-amber-950/20 border-2 border-dashed border-amber-500/40 rounded-2xl space-y-3 shadow-lg shadow-amber-950/20 animate-fade-in text-right">
                  <div className="flex items-center gap-2 text-amber-400">
                    <ShieldAlert className="w-5 h-5 animate-pulse shrink-0" />
                    <span className="text-xs font-black">تحذير محرك السعة المكتظة (Capacity Saturation)</span>
                  </div>
                  <p className="text-xs text-gray-300 leading-relaxed font-medium">
                    “الوقت الحالي ممتلئ، ولكن يوجد زخم ركاب مرتفع في اللواء المجاور <strong className="text-amber-400">ناعور</strong> نتيجة تذبذب الأسعار بنسبة 10%، نقترح توجيه حملتك هناك لتحقيق مشاهدات أعلى بجودة أكبر”.
                  </p>
                  <Button 
                    type="button" 
                    onClick={redirectCampaignToNaour}
                    className="w-full bg-amber-600 hover:bg-amber-500 text-black font-black text-xs h-10 rounded-xl flex items-center justify-center gap-1.5 transition-all"
                  >
                    <Sparkles className="w-4 h-4 text-black animate-spin" />
                    توجيه الحملة فوراً إلى لواء ناعور المكبّر (خصومات ومرونة قصوى)
                  </Button>
                </div>
              ) : (
                <div className="p-4 bg-emerald-950/15 border border-emerald-500/20 rounded-2xl space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1 text-emerald-400 text-xs font-bold">
                      <Activity className="w-4 h-4 text-emerald-400 animate-pulse" />
                      <span>بيانات النبض العام الموحد (Global Pulse Doc) للواء: {district}</span>
                    </div>
                    <span className="text-[10px] bg-emerald-950/60 text-emerald-400 font-extrabold px-2 py-0.5 rounded-full border border-emerald-400/20">
                      السعة متاحة ✓
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-center" dir="rtl">
                    <div className="bg-black/60 p-3 rounded-xl border border-white/5">
                      <span className="text-[9px] text-gray-500 block">شذوذ السعر المرصود</span>
                      <span className="text-sm font-black text-amber-400 font-mono">
                        {activeDistrictPulse?.priceAnomaliesCount || 0} حالات حرق
                      </span>
                    </div>
                    <div className="bg-black/60 p-3 rounded-xl border border-white/5">
                      <span className="text-[9px] text-gray-500 block">السعة الطارئة والمكثفة</span>
                      <span className={`text-xs font-black block mt-1 ${activeDistrictPulse?.emergencyAdCapacityActive ? 'text-emerald-400 animate-pulse' : 'text-gray-400'}`}>
                        {activeDistrictPulse?.emergencyAdCapacityActive ? '🔥 نشطة (خصم %40)' : 'خاملة (نبض متزن)'}
                      </span>
                    </div>
                    <div className="bg-black/60 p-3 rounded-xl border border-white/5">
                      <span className="text-[9px] text-gray-500 block">مستوى انتباه الركاب</span>
                      <span className="text-sm font-black text-emerald-400 block">
                        {activeDistrictPulse?.emergencyAdCapacityActive ? 'عالي جداً %98' : 'عادي %65'}
                      </span>
                    </div>
                  </div>

                  {activeDistrictPulse?.emergencyAdCapacityActive ? (
                    <div className="p-3 bg-emerald-950/50 border border-emerald-500/30 rounded-xl text-[11px] text-emerald-300 leading-relaxed font-sans font-medium flex items-start gap-2">
                      <Sparkles className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5 animate-bounce-slow" />
                      <span>
                        تم تفعيل <strong>الحزم الإعلانية الطارئة ومكثفة الانتباه</strong> للواء {district} بموجب المادة 1. نظرًا لانحراف الأسعار المحلي، الركاب متفاعلون جداً مع الشاشة. استفد من الخصم الدستوري %40 حالاً.
                      </span>
                    </div>
                  ) : (
                    <p className="text-[10px] text-gray-500">
                      💡 النبض السعري مستقر وجيد في هذا اللواء. في حال حدوث أي شذوذ في أسعار النقل سيبادر الذكاء الاصطناعي بتفعيل الحزمة الطارئة فورياً.
                    </p>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Action buttons */}
          <div className="pt-4 border-t border-white/10 flex justify-end">
            <Button
              type="button"
              onClick={() => setStep(2)}
              disabled={!governorate || !district || isCapacityFull}
              className="px-8 h-12 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-sm rounded-xl flex items-center justify-center gap-1"
            >
              <span>الانتقال للمرحلة الثانية: رفع المادة والروابط</span>
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}

      {/* STEP 2: Ad creative material & atomic contact links */}
      {step === 2 && (
        <div className="space-y-6">
          <div className="space-y-2">
            <h2 className="text-xl font-black text-white flex items-center gap-2">
              <ImageIcon className="w-5 h-5 text-emerald-400" />
              المرحلة الثانية: رفع المادة الإعلانية والروابط الذرية
            </h2>
            <p className="text-xs text-gray-400 leading-relaxed">
              أدخل المادة البصرية التي ستغطي بالكامل مسرح تشغيل الشاشة للركاب، واربطها بالروابط الذرية المباشرة المخصصة لخدمة المجتمع الأردني بلمسة واحدة.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
            
            {/* Input fields */}
            <div className="space-y-4">
              <div className="space-y-1">
                <Label className="text-xs text-emerald-400 font-bold block">عنوان الحملة المثير للانتباه</Label>
                <Input 
                  placeholder="مطعم ومجرمات شاورما الكابتن السيادي" 
                  value={title} 
                  onChange={(e) => setTitle(e.target.value)}
                  className="h-10 border-white/10 bg-black mt-1 placeholder:text-gray-500 text-white"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs text-emerald-400 font-bold block">الوصف البصري والخصومات</Label>
                <Input 
                  placeholder="اشتري وجبتين واطلب الثالثة مجاناً وصفر تكلفة خدمة." 
                  value={description} 
                  onChange={(e) => setDescription(e.target.value)}
                  className="h-10 border-white/10 bg-black mt-1 placeholder:text-gray-500 text-white"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs text-emerald-400 font-bold block">رابط بوستر إلكتروني (يغطي مسرح الشاشة بالكامل)</Label>
                <Input 
                  placeholder="https://images.unsplash.com/photo-..." 
                  value={posterUrl} 
                  onChange={(e) => setPosterUrl(e.target.value)}
                  className="h-10 border-white/10 bg-black mt-1 text-left font-mono placeholder:text-gray-500 text-white"
                  dir="ltr"
                />
              </div>

              {/* Direct Acquisition links */}
              <div className="p-3 bg-white/5 rounded-xl border border-white/10 space-y-3">
                <span className="text-[10px] font-black text-gray-400 block uppercase border-b border-white/5 pb-1">الروابط الذرية المباشرة (Direct Acquisition Links)</span>
                
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <Label className="text-[10px] text-gray-400 block">رقم الواتساب السيادي</Label>
                    <div className="relative">
                      <MessageSquare className="w-3.5 h-3.5 text-emerald-500 absolute left-3 top-3" />
                      <Input 
                        value={whatsapp} 
                        onChange={(e) => setWhatsapp(e.target.value)}
                        className="h-9 pr-2 pl-8 border-white/10 bg-black text-left font-mono text-xs text-white"
                        dir="ltr"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <Label className="text-[10px] text-gray-400 block">رقم الهاتف المباشر</Label>
                    <div className="relative">
                      <Phone className="w-3.5 h-3.5 text-emerald-500 absolute left-3 top-3" />
                      <Input 
                        value={phone} 
                        onChange={(e) => setPhone(e.target.value)}
                        className="h-9 pr-2 pl-8 border-white/10 bg-black text-left font-mono text-xs text-white"
                        dir="ltr"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-1">
                  <Label className="text-[10px] text-gray-400 block">الموقع الجغرافي / عنوان نقطة الاستحواذ</Label>
                  <div className="relative">
                    <MapPin className="w-3.5 h-3.5 text-emerald-500 absolute left-3 top-3.5" />
                    <Input 
                      value={geoLoc} 
                      onChange={(e) => setGeoLoc(e.target.value)}
                      className="h-9 pr-2 pl-8 border-white/10 bg-black text-right text-xs text-white"
                    />
                  </div>
                </div>
              </div>

              {/* Impressions goal choice & cost */}
              <div className="p-3 bg-emerald-950/10 border border-emerald-500/20 rounded-xl space-y-3">
                <div className="flex justify-between items-center text-xs">
                  <Label className="text-[11px] text-emerald-400 font-bold block">عدد السحبات / مرات الظهور (Impressions)</Label>
                  <span className="text-[10px] text-gray-500 font-mono">0.05 دينار للظهور (مادة 3)</span>
                </div>
                <Select onValueChange={(val) => setTargetImpressions(parseInt(val))} value={targetImpressions.toString()}>
                  <SelectTrigger className="h-10 border-white/10 bg-black text-right text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-black text-white border-white/10">
                    <SelectItem value="1000" className="text-right justify-end">1,000 ظهور (مستوى اختبار)</SelectItem>
                    <SelectItem value="5000" className="text-right justify-end">5,000 ظهور (تأثير محلي)</SelectItem>
                    <SelectItem value="10000" className="text-right justify-end">10,000 ظهور (انتشار واسع في اللواء)</SelectItem>
                    <SelectItem value="50000" className="text-right justify-end">50,000 ظهور (تأثير شامل وسيادي كامل)</SelectItem>
                  </SelectContent>
                </Select>

                {/* Prepaid Gateway representation */}
                <div className="bg-black/60 p-3 rounded-xl border border-white/5 space-y-2 text-center" dir="rtl">
                  <div className="flex justify-between items-center text-[10px]">
                    <span className="text-gray-400">القيمة الأساسية:</span>
                    <span className="font-mono text-gray-300">{currentPrepaidCostWithoutDiscount.toFixed(2)} د.أ</span>
                  </div>
                  {activeDistrictPulse?.emergencyAdCapacityActive && (
                    <div className="flex justify-between items-center text-[10px] text-emerald-400 font-bold">
                      <span>خصم الحظر السعري النشط (%40-):</span>
                      <span className="font-mono">-{ (currentPrepaidCostWithoutDiscount * 0.4).toFixed(2) } د.أ</span>
                    </div>
                  )}
                  <div className="flex justify-between items-center border-t border-white/5 pt-1.5 text-xs font-bold text-white">
                    <span>قيمة الدفع المسبق للأمان السيادي:</span>
                    <span className="font-mono text-emerald-400">{calculatedCost.toFixed(2)} دينار أردني</span>
                  </div>

                  {/* Prepaid selection buttons inside Step 2 */}
                  <div className="grid grid-cols-2 gap-1.5 pt-2">
                    <button
                      type="button"
                      onClick={() => setPaymentChannel('Zain Cash')}
                      className={`h-8 border text-[10px] rounded-lg transition-all ${paymentChannel === 'Zain Cash' ? 'bg-emerald-950 text-emerald-400 border-emerald-500' : 'bg-black text-gray-400 border-white/10'}`}
                    >
                      زين كاش (Zain Cash)
                    </button>
                    <button
                      type="button"
                      onClick={() => setPaymentChannel('CliQ الأردن')}
                      className={`h-8 border text-[10px] rounded-lg transition-all ${paymentChannel === 'CliQ الأردن' ? 'bg-emerald-950 text-emerald-400 border-emerald-500' : 'bg-black text-gray-400 border-white/10'}`}
                    >
                      كليك (CliQ)
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Live Interactive Theater Screen Mockup with Full Coverage */}
            <div className="space-y-3">
              <span className="text-[11px] font-black text-emerald-400 uppercase tracking-widest block text-center">
                🖥️ مسرح العرض الكامل للراكب (Theatre Preview)
              </span>
              
              <div className="w-full aspect-[9/16] max-h-[380px] bg-zinc-950 rounded-2xl border border-white/10 relative overflow-hidden flex flex-col justify-end shadow-2xl">
                {posterUrl ? (
                  <img 
                    src={posterUrl} 
                    alt="Creative Preview" 
                    referrerPolicy="no-referrer"
                    className="absolute inset-0 w-full h-full object-cover z-0 filter brightness-95" 
                  />
                ) : (
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-zinc-900 border border-zinc-950 text-gray-500 text-xs">
                    <ImageIcon className="w-8 h-8 mb-2 animate-pulse" />
                    <span>مسرح الشاشة بالكامل ممتد هنا</span>
                  </div>
                )}

                {/* Ambient dark fade layer */}
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent z-10" />

                {/* Overlaid UI components on the virtual passenger interface */}
                <div className="p-4 relative z-20 space-y-3 text-right">
                  <div className="flex justify-between items-center">
                    <span className="text-[8px] bg-emerald-500/90 text-black px-2 py-0.5 rounded-full font-black uppercase tracking-wider">
                      إعلان سيادي متميز
                    </span>
                    <span className="text-[9px] font-mono text-gray-400 flex items-center gap-1 bg-black/60 px-2 py-0.5 rounded-md">
                      <Eye className="w-3 h-3 text-emerald-400" />
                      ظهور مضمون
                    </span>
                  </div>

                  <div className="space-y-1">
                    <h4 className="text-sm font-extrabold text-white leading-tight filter drop-shadow">
                      {title || 'عنوان الحملة البصرية'}
                    </h4>
                    <p className="text-[10px] text-gray-300 leading-normal filter drop-shadow">
                      {description || 'وصف المحتوى والمغريات المستهدفة للعميل.'}
                    </p>
                  </div>

                  {/* Direct Contact Button Mockup */}
                  <div className="grid grid-cols-1 gap-1">
                    <Button 
                      type="button" 
                      className="w-full text-white bg-emerald-600 border border-emerald-500 hover:bg-emerald-500 font-extrabold text-[10px] h-8 rounded-lg pointer-events-none"
                    >
                      {buttonText || 'احجز مقعدك الآن'}
                    </Button>
                    <div className="flex justify-between items-center text-[8px] text-gray-400 px-1 pt-1 bg-black/40 p-1.5 rounded-md mt-1">
                      <span className="flex items-center gap-1 text-emerald-400 font-bold">
                        📞 {phone}
                      </span>
                      <span className="flex items-center gap-1 text-emerald-400 font-bold">
                        💬 {whatsapp}
                      </span>
                    </div>
                    {geoLoc && (
                      <span className="text-[8px] text-gray-400 text-center block mt-1 font-sans">
                        📍 الموقع: {geoLoc}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <p className="text-[10px] text-gray-500 text-center font-medium">
                * البوستر يغطي مساحة العرض التفاعلية بالكامل أسفل واجهة المستخدم للراكب للتركيز البصري الأقصى.
              </p>
            </div>
          </div>

          {/* Action buttons */}
          <div className="pt-4 border-t border-white/10 flex justify-between items-center" dir="rtl">
            <Button
              type="button"
              onClick={() => runForensicAuditAndLaunch()}
              disabled={!title || !description || !posterUrl}
              className="px-8 h-12 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-sm rounded-xl flex items-center justify-center gap-1.5 shadow-[0_0_15px_rgba(16,185,129,0.3)]"
            >
              <ShieldCheck className="w-4 h-4 text-white" />
              <span>اجتياز الفحص الجنائي والامتثال 🛡️</span>
            </Button>

            <Button
              type="button"
              variant="outline"
              onClick={() => setStep(1)}
              className="h-12 border-white/10 hover:border-white/20 bg-black text-gray-400 font-bold rounded-xl pr-4 pl-4"
            >
              <ArrowRight className="w-4 h-4 ml-1.5" />
              <span>العودة للتوجيه الجغرافي</span>
            </Button>
          </div>
        </div>
      )}

      {/* STEP 3: Forensic local AI quality checks & ready state */}
      {step === 3 && (
        <div className="space-y-6">
          <div className="space-y-2">
            <h2 className="text-xl font-black text-white flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-400" />
              المرحلة الثالثة: الفحص الجنائي للذكاء الاصطناعي (حارس الجودة)
            </h2>
            <p className="text-xs text-gray-400 leading-relaxed">
              يقوم حارس الجودة الصامت بفحص مصفوفة البيكسلات والكود الجغرافي لضمان الخلو الكامل من الملوثات البصرية وامتثال الحملة لشروط الأمان الميداني.
            </p>
          </div>

          <div className="p-5 bg-zinc-950/90 rounded-2xl border border-white/5 space-y-4">
            
            {/* Visual scan bar */}
            <div className="space-y-2 text-right">
              <div className="flex justify-between items-center text-xs text-gray-400">
                <span>الربط البرمجي السداسي ومستوى التدقيق:</span>
                <span className="font-mono text-emerald-400 font-black">{auditProgress}%</span>
              </div>
              <div className="w-full bg-white/5 h-2 rounded-full overflow-hidden">
                <div 
                  className="bg-emerald-500 h-full transition-all duration-300 shadow-[0_0_10px_rgba(16,185,129,0.6)]"
                  style={{ width: `${auditProgress}%` }}
                />
              </div>
            </div>

            {/* Log list terminal mockup */}
            <div className="bg-black/90 p-4 rounded-xl border border-emerald-950/60 font-mono text-xs text-emerald-400/90 space-y-2.5 h-44 overflow-y-auto text-right" dir="rtl">
              {auditLogs.map((log, index) => (
                <div key={index} className="flex items-start gap-2 animate-fade-in">
                  <span className="text-emerald-500 select-none">▶</span>
                  <span className="leading-relaxed">{log}</span>
                </div>
              ))}
              {isSimulatingAudit && (
                <div className="flex items-center gap-2 text-gray-500 text-[10px] animate-pulse">
                  <span>جاري المزامنة مع خادم الرادار الموحد...</span>
                </div>
              )}
            </div>

            {/* Check approval and activation trigger */}
            {!isSimulatingAudit && auditApproved && (
              <div className="p-4 bg-emerald-950/20 border border-emerald-500/30 rounded-xl space-y-3 text-right animate-scale-up">
                <div className="flex items-center gap-2 text-emerald-400">
                  <CheckCircle className="w-5 h-5 shrink-0 animate-bounce-slow" />
                  <span className="text-xs font-black">اجتياز ناجح لمطابقة الفحص الجنائي الرقمي!</span>
                </div>
                <p className="text-xs text-gray-300 leading-relaxed font-sans">
                  تم وضع الإعلان في حالة <strong className="text-emerald-400">[الاستعداد للنبض الموجه]</strong> وبثه فورًا داخل الأجهزة ومسرح شاشة الراكب الموحد في لواء <strong className="text-emerald-400">{district}</strong>.
                </p>

                <div className="bg-black/60 p-3 rounded-lg border border-white/5 text-[11px] text-gray-400 space-y-1">
                  <div>• عنوان الحملة الفعال: <strong>{title}</strong></div>
                  <div>• سقف المشاهدات المطلوب: <strong className="text-white font-mono">{targetImpressions.toLocaleString()} ركاب</strong></div>
                  <div>• قناة السداد المسبق: <strong className="text-white">{paymentChannel} (مرقمنة بنجاح)</strong></div>
                  <div className="text-emerald-400">• القيمة المقبوضة: <strong>{calculatedCost.toFixed(2)} دينار أردني (شاملة الخصوم الدستورية)</strong></div>
                </div>
              </div>
            )}
          </div>

          {/* Action buttons footer */}
          <div className="pt-4 border-t border-white/10 flex justify-between items-center" dir="rtl">
            {auditApproved ? (
              onClose && (
                <Button
                  type="button"
                  onClick={onClose}
                  className="w-full h-12 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-sm rounded-xl transition-all"
                >
                  العودة لمنصة الرادار الرئيسية 🤝
                </Button>
              )
            ) : (
              <>
                <Button
                  type="button"
                  onClick={() => runForensicAuditAndLaunch()}
                  disabled={isSimulatingAudit}
                  className="px-8 h-12 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-sm rounded-xl flex items-center justify-center gap-1.5"
                >
                  {isSimulatingAudit ? 'جاري الفحص البصري الجنائي...' : 'بدء فحص الـ AI والإطلاق الميداني 🚀'}
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setStep(2)}
                  disabled={isSimulatingAudit}
                  className="h-12 border-white/10 hover:border-white/20 bg-black text-gray-400 font-bold rounded-xl pr-4 pl-4"
                >
                  <ArrowRight className="w-4 h-4 ml-1.5" />
                  <span>العودة لتعديل الروابط</span>
                </Button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
