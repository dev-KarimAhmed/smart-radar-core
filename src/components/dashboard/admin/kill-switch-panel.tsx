'use client';

import React, { useState } from 'react';
import { useSovereignControls } from '@/hooks/use-sovereign-controls';
import { useAdminAds } from '@/hooks/use-admin-ads';
import { broadcastSilentPush } from '@/lib/push-notifications';
import { useToast } from '@/hooks/use-toast';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { 
  AlertTriangle, 
  Loader2, 
  Power, 
  PowerOff, 
  ShieldAlert, 
  Flame, 
  Send, 
  Sliders, 
  Clock, 
  Sparkles,
  MapPin,
  Lock,
  Unlock,
  Radio,
  EyeOff
} from 'lucide-react';
import { cn } from '@/lib/utils';

export function KillSwitchPanel() {
  const { toast } = useToast();
  const { 
    isRadarActive, 
    toggleKillSwitch, 
    isTogglingKillSwitch, 
    isLoadingControls 
  } = useSovereignControls();

  const { ads, executeAdAnnihilation } = useAdminAds();

  // Control confirmation gates
  const [gate1, setGate1] = useState(false);
  const [gate2, setGate2] = useState(false);
  const [safetyCleared, setSafetyCleared] = useState(false);

  // Annihilation selector states
  const [selectedAdId, setSelectedAdId] = useState('');
  const [annihilationReason, setAnnihilationReason] = useState('');
  const [isAnnihilating, setIsAnnihilating] = useState(false);

  // Broadcast Alert tool states
  const [broadcastMessage, setBroadcastMessage] = useState('');
  const [selectedDistrict, setSelectedDistrict] = useState('الجميع');
  const [alertType, setAlertType] = useState<'REGIONAL_ALERT' | 'GLOBAL_FREEZE'>('REGIONAL_ALERT');
  const [isBroadcasting, setIsBroadcasting] = useState(false);

  // Active Ads helper for the dropdown filter
  const activeAds = ads.filter(ad => ad.status === 'active' || ad.status === 'ACTIVE');

  const handleSafetyToggle = () => {
    if (!gate1 || !gate2) {
      toast({
        variant: 'destructive',
        title: 'بوابات الأمان مقفلة 🔒',
        description: 'يتعين عليك تفعيل بوابتي التأكيد ومطابقة الفرز الجنائي لفك حماية الزر الأحمر.'
      });
      return;
    }
    setSafetyCleared(!safetyCleared);
  };

  const handleExecuteKillSwitch = async () => {
    if (!safetyCleared) return;
    try {
      await toggleKillSwitch();
      // Reset safety gates after toggle
      setGate1(false);
      setGate2(false);
      setSafetyCleared(false);
    } catch (e) {
      // logged by hook
    }
  };

  const handleAnnihilateAd = async () => {
    if (!selectedAdId) {
      toast({
        variant: 'destructive',
        title: 'لم يتم تحديد هدف',
        description: 'يرجى تحديد الحملة الإعلانية النشطة المستهدفة للإعدام الكوانتي.'
      });
      return;
    }
    if (!annihilationReason.trim()) {
      toast({
        variant: 'destructive',
        title: 'مطلوب إفادة رسمية',
        description: 'إدخال مبرر التطهير الجنائي إلزامي لتبرير نبضة الإعدام.'
      });
      return;
    }

    setIsAnnihilating(true);
    const success = await executeAdAnnihilation(selectedAdId, annihilationReason);
    setIsAnnihilating(false);

    if (success) {
      setSelectedAdId('');
      setAnnihilationReason('');
    }
  };

  const handleSendBroadcast = async () => {
    if (!broadcastMessage.trim()) {
      toast({
        variant: 'destructive',
        title: 'فراغ نص الإطلاق',
        description: 'يرجى صياغة رسالة بث واضحة لتصل لهواتف الكباتن والركاب.'
      });
      return;
    }

    setIsBroadcasting(true);
    const success = await broadcastSilentPush({
      type: alertType,
      targetDistrict: selectedDistrict === 'الجميع' ? undefined : selectedDistrict,
      message: broadcastMessage
    });
    setIsBroadcasting(false);

    if (success) {
      toast({
        title: '📡 تم قذف نبضة البث السيادي',
        description: `تم نشر الإشعار اللحظي [${selectedDistrict}] في طبقة الهواتف المفتوحة.`
      });
      setBroadcastMessage('');
    }
  };

  return (
    <div className="space-y-8 text-right" dir="rtl">
      {/* ⚠️ GATE-GUARDED MASTER EMERGENCY KILL SWITCH */}
      <Card className="bg-red-950/15 border border-red-500/30 shadow-[0_4px_30px_rgba(239,68,68,0.05)] rounded-2xl overflow-hidden">
        <CardHeader className="bg-red-950/20 border-b border-red-500/10 p-5">
          <CardTitle className="text-red-400 text-sm sm:text-base font-extrabold flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-red-500 animate-pulse" />
            بروتوكول الطوارئ الإداري: مفتاح الفصل الشامل [30-Emergency]
          </CardTitle>
          <CardDescription className="text-red-300/60 text-[10px] sm:text-[11px] leading-relaxed">
            التحكم الكلي في بوابات الرادار في الأردن. تفعيل هذا المقبس يجبر هواتف المستخدمين كافة على تعليق الملاحة فوراً، لعزل الخوادم وتفادي حروق النبض في حالات القوة القاهرة.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Safety Confirmation Checklist */}
            <div className="bg-black/40 border border-white/[0.04] p-4 rounded-xl space-y-4">
              <span className="text-xs font-bold text-red-300/80 block border-b border-red-900/40 pb-2">🔒 بوابات الأمان المصاحبة للزر السيادي:</span>
              
              <div className="space-y-3">
                <label className={cn(
                  "flex items-center gap-2.5 p-3 rounded-xl border text-xs font-semibold cursor-pointer transition-all",
                  gate1 ? "border-red-500/40 bg-red-950/20 text-white" : "border-white/5 bg-zinc-900/20 text-gray-400 hover:bg-zinc-900/40"
                )}>
                  <input 
                    type="checkbox" 
                    checked={gate1} 
                    onChange={(e) => {
                      setGate1(e.target.checked);
                      if (!e.target.checked) setSafetyCleared(false);
                    }}
                    className="h-4 w-4 rounded border-red-500 text-red-600 focus:ring-red-500 cursor-pointer"
                  />
                  <span>أقر بنية تعليق الملاحة كلياً في ولاية عمان والوسط.</span>
                </label>

                <label className={cn(
                  "flex items-center gap-2.5 p-3 rounded-xl border text-xs font-semibold cursor-pointer transition-all",
                  gate2 ? "border-red-500/40 bg-red-950/20 text-white" : "border-white/5 bg-zinc-900/20 text-gray-400 hover:bg-zinc-900/40"
                )}>
                  <input 
                    type="checkbox" 
                    checked={gate2} 
                    onChange={(e) => {
                      setGate2(e.target.checked);
                      if (!e.target.checked) setSafetyCleared(false);
                    }}
                    className="h-4 w-4 rounded border-red-500 text-red-600 focus:ring-red-500 cursor-pointer"
                  />
                  <span>مطابقة البصمة الدستورية للقيادة لمنع المضاربة.</span>
                </label>
              </div>

              {/* Step 3: Unlock button */}
              <Button
                onClick={handleSafetyToggle}
                disabled={!gate1 || !gate2}
                className={cn(
                  "w-full h-9 text-xs font-black rounded-lg cursor-pointer transition-all",
                  safetyCleared
                    ? "bg-emerald-600 hover:bg-emerald-500 text-white"
                    : "bg-red-900/20 hover:bg-red-900/40 text-red-400 border border-red-500/30"
                )}
              >
                {safetyCleared ? (
                  <span className="flex items-center gap-1.5 justify-center">
                    <Unlock className="w-3.5 h-3.5" />
                    تم فك قفل الأمان - المقبس جاهز للإطلاق
                  </span>
                ) : (
                  <span className="flex items-center gap-1.5 justify-center">
                    <Lock className="w-3.5 h-3.5" />
                    تفعيل مفتاح الفك السيادي
                  </span>
                )}
              </Button>
            </div>

            {/* Lethal Red Execution Button */}
            <div className="flex flex-col justify-center items-center p-4 bg-black/40 border border-white/[0.04] rounded-xl text-center">
              <div className="space-y-1 mb-4">
                <span className="text-xs font-bold text-gray-400">حالة رادار الملاحة الحالية:</span>
                <div className="flex items-center justify-center gap-2">
                  <span className={cn(
                    "h-2 w-2 rounded-full animate-ping",
                    isRadarActive ? "bg-emerald-500" : "bg-red-500"
                  )} />
                  <span className={cn(
                    "text-sm font-black font-sans uppercase",
                    isRadarActive ? "text-emerald-400" : "text-red-400"
                  )}>
                    {isRadarActive ? "مفتوح ونشط ●" : "معلق طارئ 🚫"}
                  </span>
                </div>
              </div>

              <Button
                onClick={handleExecuteKillSwitch}
                disabled={isLoadingControls || isTogglingKillSwitch || !safetyCleared}
                className={cn(
                  "w-full h-16 text-sm font-black tracking-wider shadow-lg rounded-xl flex items-center justify-center gap-3 transition-all cursor-pointer",
                  !safetyCleared 
                    ? "bg-zinc-800 text-zinc-500 cursor-not-allowed border border-white/5"
                    : isRadarActive
                      ? "bg-red-600 hover:bg-red-500 text-white shadow-red-950/50 hover:scale-[1.01] active:scale-[0.99]"
                      : "bg-[#14b8a6] hover:bg-[#14b8a6]/90 text-black shadow-[#14b8a6]/20 hover:scale-[1.01] active:scale-[0.99]"
                )}
              >
                {isLoadingControls ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : isRadarActive ? (
                  <>
                    <PowerOff className="w-5 h-5" />
                    اضغط لتنفيذ التعليق الكلي للميدان 💥
                  </>
                ) : (
                  <>
                    <Power className="w-5 h-5" />
                    اضغط لإلغاء القفل وإعادة فتح الملاحة 📡
                  </>
                )}
              </Button>

              <span className="text-[9px] text-red-400/50 mt-3 block px-4 leading-normal">
                * تحذير: هذا التدخل فوري وسيتم ترحيله سحابياً لكافة هواتف الكباتن والمسافرين في المملكة الأردنية مباشرة.
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 💥 AD ANNIHILATION AND SOVEREIGN PURGE (Digital Annihilation) */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        <div className="md:col-span-6">
          <Card className="bg-slate-950/80 border border-[#14b8a6]/20 shadow-lg rounded-2xl flex-1 flex flex-col h-full">
            <CardHeader className="p-5 border-b border-white/[0.04]">
              <CardTitle className="text-white text-sm sm:text-base font-black flex items-center gap-2">
                <Flame className="w-5 h-5 text-red-500 animate-pulse" />
                مقصلة الإبادة الرقمية للحملات (Ad Annihilation)
              </CardTitle>
              <CardDescription className="text-gray-500 text-[10px] sm:text-[11px]">
                بروتوكول [30-Annihilation] لتطهير الميدان آلياً. يرسل إشعارات صامتة Silent Web Pushes لإبادة ومسح الإعلانات المرفوضة من هواتف المستخدمين نهائياً في ثوانٍ.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-5 space-y-4 flex-1">
              {/* Select Active Ads dropdown */}
              <div className="space-y-1.5Packed">
                <Label className="text-xs font-bold text-gray-400">حدد الحملة المستهدفة للإحراق الكوانتي:</Label>
                <select
                  value={selectedAdId}
                  onChange={(e) => setSelectedAdId(e.target.value)}
                  className="w-full h-11 bg-black border border-white/10 rounded-xl px-3 text-xs text-white focus:border-red-500 text-right font-semibold"
                  dir="rtl"
                >
                  <option value="">-- اختر حملة إعلانية بث في الميدان --</option>
                  {activeAds.map(ad => (
                    <option key={ad.id} value={ad.id}>
                      {ad.content?.title || ad.title} (ID: {ad.id})
                    </option>
                  ))}
                </select>
              </div>

              {/* Annihilation Reason justification prompt */}
              <div className="space-y-1.5Packed">
                <Label className="text-xs font-bold text-gray-300">مبرر التطهير والمذكرة الجنائية للهواتف:</Label>
                <Input
                  value={annihilationReason}
                  onChange={(e) => setAnnihilationReason(e.target.value)}
                  placeholder="مثال: انتهاك وثيقة الآداب، تحريض على المضاربة، إلخ..."
                  className="w-full bg-black border border-white/10 text-white rounded-xl pr-3 text-xs focus:border-red-500 text-right h-10"
                />
              </div>

              {/* Execution CTA button */}
              <Button
                onClick={handleAnnihilateAd}
                disabled={isAnnihilating || !selectedAdId}
                className={cn(
                  "w-full h-11 text-xs font-black rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer",
                  !selectedAdId
                    ? "bg-zinc-800 text-zinc-500 cursor-not-allowed"
                    : "bg-red-600 hover:bg-red-500 text-white shadow-xl hover:shadow-red-950/60"
                )}
              >
                {isAnnihilating ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <EyeOff className="w-4 h-4" />
                    بث نبضة الإعدام وتطهير الهواتف الميدانية 💥
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* 📡 REGIONAL BROADCAST PULSES (Silent Web Pushes Helper) */}
        <div className="md:col-span-6">
          <Card className="bg-slate-950/80 border border-[#14b8a6]/25 shadow-lg rounded-2xl flex-1 flex flex-col h-full">
            <CardHeader className="p-5 border-b border-white/[0.04]">
              <CardTitle className="text-white text-sm sm:text-base font-black flex items-center gap-2">
                <Radio className="w-5 h-5 text-[#14b8a6]" />
                بث راداري صامت (Silent Broadcast Pulses)
              </CardTitle>
              <CardDescription className="text-gray-500 text-[10px] sm:text-[11px]">
                حقن وبث نبضات توجيهية لحظية غير مكلفة لخلية سداسية معينة أو الميدان بالكامل، لتعديل سلوك الهواتف والتسجيل في سجل الطوارئ مباشرة.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-5 space-y-4 flex-1">
              <div className="grid grid-cols-2 gap-3">
                {/* District targeting selector */}
                <div className="space-y-1">
                  <Label className="text-xs font-bold text-gray-400">الإقليم الجغرافي المستهدف:</Label>
                  <select
                    value={selectedDistrict}
                    onChange={(e) => setSelectedDistrict(e.target.value)}
                    className="w-full h-10 bg-black border border-white/10 rounded-xl px-2 text-[11px] text-white focus:border-[#14b8a6] text-right"
                  >
                    <option value="الجميع">كل لواء الأردنيين</option>
                    <option value="لواء الجامعة">لواء الجامعة - عمان</option>
                    <option value="لواء قصبة عمان">لواء قصبة عمان - عمان</option>
                    <option value="لواء وادي السير">لواء وادي السير - عمان</option>
                    <option value="لواء ماركا">لواء ماركا - عمان</option>
                  </select>
                </div>

                {/* Pulse Classification */}
                <div className="space-y-1">
                  <Label className="text-xs font-bold text-gray-400">تصنيف النبضة السيادية:</Label>
                  <select
                    value={alertType}
                    onChange={(e) => setAlertType(e.target.value as any)}
                    className="w-full h-10 bg-black border border-white/10 rounded-xl px-2 text-[11px] text-white focus:border-[#14b8a6] text-right"
                  >
                    <option value="REGIONAL_ALERT">تنبيه إقليمي توجيهي</option>
                    <option value="GLOBAL_FREEZE">تجميد اضطراري للأسعار</option>
                  </select>
                </div>
              </div>

              {/* Message text area */}
              <div className="space-y-1">
                <Label className="text-xs font-bold text-gray-300 font-sans">نص بلاغ القيادة العامة (بث لحظي):</Label>
                <textarea
                  value={broadcastMessage}
                  onChange={(e) => setBroadcastMessage(e.target.value)}
                  placeholder="اكتب مضمون الإشعار الميداني هنا..."
                  className="w-full h-16 bg-black border border-white/10 text-white rounded-xl p-3 text-xs focus:border-[#14b8a6] text-right resize-none focus:outline-none focus:ring-1 focus:ring-[#14b8a6]"
                />
              </div>

              {/* Broadcast command button */}
              <Button
                onClick={handleSendBroadcast}
                disabled={isBroadcasting || !broadcastMessage.trim()}
                className="w-full h-10 text-xs font-black bg-[#14b8a6] hover:bg-[#14b8a6]/95 text-black rounded-xl flex items-center justify-center gap-1.5 cursor-pointer leading-none"
              >
                {isBroadcasting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5 ml-1" />
                    إطلاق النبضة الصامتة Silent Broadcast 📡
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
