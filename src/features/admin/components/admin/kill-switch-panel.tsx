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

const styles = {
  style143_1: "space-y-8 text-right",
  style145_2: "bg-red-950/15 border border-red-500/30 shadow-[0_4px_30px_rgba(239,68,68,0.05)] rounded-2xl overflow-hidden",
  style146_3: "bg-red-950/20 border-b border-red-500/10 p-5",
  style147_4: "text-red-400 text-sm sm:text-base font-extrabold flex items-center gap-2",
  style148_5: "w-5 h-5 text-red-500 animate-pulse",
  style151_6: "text-red-300/60 text-[10px] sm:text-[11px] leading-relaxed",
  style155_7: "p-6 space-y-6",
  style156_8: "grid grid-cols-1 md:grid-cols-2 gap-6",
  style158_9: "bg-black/40 border border-white/[0.04] p-4 rounded-xl space-y-4",
  style159_10: "text-xs font-bold text-red-300/80 block border-b border-red-900/40 pb-2",
  style161_11: "space-y-3",
  style163_12: "flex items-center gap-2.5 p-3 rounded-xl border text-xs font-semibold cursor-pointer transition-all",
  style164_13: "border-red-500/40 bg-red-950/20 text-white",
  style164_14: "border-white/5 bg-zinc-900/20 text-gray-400 hover:bg-zinc-900/40",
  style173_15: "h-4 w-4 rounded border-red-500 text-red-600 focus:ring-red-500 cursor-pointer",
  style179_16: "flex items-center gap-2.5 p-3 rounded-xl border text-xs font-semibold cursor-pointer transition-all",
  style180_17: "border-red-500/40 bg-red-950/20 text-white",
  style180_18: "border-white/5 bg-zinc-900/20 text-gray-400 hover:bg-zinc-900/40",
  style189_19: "h-4 w-4 rounded border-red-500 text-red-600 focus:ring-red-500 cursor-pointer",
  style200_20: "w-full h-9 text-xs font-black rounded-lg cursor-pointer transition-all",
  style202_21: "bg-emerald-600 hover:bg-emerald-500 text-white",
  style203_22: "bg-red-900/20 hover:bg-red-900/40 text-red-400 border border-red-500/30",
  style207_23: "flex items-center gap-1.5 justify-center",
  style208_24: "w-3.5 h-3.5",
  style212_25: "flex items-center gap-1.5 justify-center",
  style213_26: "w-3.5 h-3.5",
  style221_27: "flex flex-col justify-center items-center p-4 bg-black/40 border border-white/[0.04] rounded-xl text-center",
  style222_28: "space-y-1 mb-4",
  style223_29: "text-xs font-bold text-gray-400",
  style224_30: "flex items-center justify-center gap-2",
  style226_31: "h-2 w-2 rounded-full animate-ping",
  style227_32: "bg-emerald-500",
  style227_33: "bg-red-500",
  style230_34: "text-sm font-black font-sans uppercase",
  style231_35: "text-emerald-400",
  style231_36: "text-red-400",
  style242_37: "w-full h-16 text-sm font-black tracking-wider shadow-lg rounded-xl flex items-center justify-center gap-3 transition-all cursor-pointer",
  style244_38: "bg-zinc-800 text-zinc-500 cursor-not-allowed border border-white/5",
  style246_39: "bg-red-600 hover:bg-red-500 text-white shadow-red-950/50 hover:scale-[1.01] active:scale-[0.99]",
  style247_40: "bg-[#14b8a6] hover:bg-[#14b8a6]/90 text-black shadow-[#14b8a6]/20 hover:scale-[1.01] active:scale-[0.99]",
  style251_41: "w-5 h-5 animate-spin",
  style254_42: "w-5 h-5",
  style259_43: "w-5 h-5",
  style265_44: "text-[9px] text-red-400/50 mt-3 block px-4 leading-normal",
  style274_45: "grid grid-cols-1 md:grid-cols-12 gap-6",
  style275_46: "md:col-span-6",
  style276_47: "bg-slate-950/80 border border-[#14b8a6]/20 shadow-lg rounded-2xl flex-1 flex flex-col h-full",
  style277_48: "p-5 border-b border-white/[0.04]",
  style278_49: "text-white text-sm sm:text-base font-black flex items-center gap-2",
  style279_50: "w-5 h-5 text-red-500 animate-pulse",
  style282_51: "text-gray-500 text-[10px] sm:text-[11px]",
  style286_52: "p-5 space-y-4 flex-1",
  style288_53: "space-y-1.5Packed",
  style289_54: "text-xs font-bold text-gray-400",
  style293_55: "w-full h-11 bg-black border border-white/10 rounded-xl px-3 text-xs text-white focus:border-red-500 text-right font-semibold",
  style306_56: "space-y-1.5Packed",
  style307_57: "text-xs font-bold text-gray-300",
  style312_58: "w-full bg-black border border-white/10 text-white rounded-xl pr-3 text-xs focus:border-red-500 text-right h-10",
  style321_59: "w-full h-11 text-xs font-black rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer",
  style323_60: "bg-zinc-800 text-zinc-500 cursor-not-allowed",
  style324_61: "bg-red-600 hover:bg-red-500 text-white shadow-xl hover:shadow-red-950/60",
  style328_62: "w-4 h-4 animate-spin",
  style331_63: "w-4 h-4",
  style341_64: "md:col-span-6",
  style342_65: "bg-slate-950/80 border border-[#14b8a6]/25 shadow-lg rounded-2xl flex-1 flex flex-col h-full",
  style343_66: "p-5 border-b border-white/[0.04]",
  style344_67: "text-white text-sm sm:text-base font-black flex items-center gap-2",
  style345_68: "w-5 h-5 text-[#14b8a6]",
  style348_69: "text-gray-500 text-[10px] sm:text-[11px]",
  style352_70: "p-5 space-y-4 flex-1",
  style353_71: "grid grid-cols-2 gap-3",
  style355_72: "space-y-1",
  style356_73: "text-xs font-bold text-gray-400",
  style360_74: "w-full h-10 bg-black border border-white/10 rounded-xl px-2 text-[11px] text-white focus:border-[#14b8a6] text-right",
  style371_75: "space-y-1",
  style372_76: "text-xs font-bold text-gray-400",
  style376_77: "w-full h-10 bg-black border border-white/10 rounded-xl px-2 text-[11px] text-white focus:border-[#14b8a6] text-right",
  style385_78: "space-y-1",
  style386_79: "text-xs font-bold text-gray-300 font-sans",
  style391_80: "w-full h-16 bg-black border border-white/10 text-white rounded-xl p-3 text-xs focus:border-[#14b8a6] text-right resize-none focus:outline-none focus:ring-1 focus:ring-[#14b8a6]",
  style399_81: "w-full h-10 text-xs font-black bg-[#14b8a6] hover:bg-[#14b8a6]/95 text-black rounded-xl flex items-center justify-center gap-1.5 cursor-pointer leading-none",
  style402_82: "w-4 h-4 animate-spin",
  style405_83: "w-3.5 h-3.5 ml-1",
} as const;


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
        description: 'يتعين عليك تفعيل بوابتي التأكيد ومطابقة الفرز الأمني لفك حماية الزر الأحمر.'
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
        description: 'يرجى تحديد الحملة الإعلانية النشطة المستهدفة للإيقاف ال.'
      });
      return;
    }
    if (!annihilationReason.trim()) {
      toast({
        variant: 'destructive',
        title: 'مطلوب إفادة رسمية',
        description: 'إدخال مبرر الحذف الأمني إلزامي لتبرير نشاطة الإيقاف.'
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
        description: 'يرجى صياغة رسالة بث واضحة لتصل لهواتف السائقون والركاب.'
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
        title: '📡 تم نشر نشاطة العرض ',
        description: `تم نشر الإشعار اللحظي [${selectedDistrict}] في طبقة الهواتف المفتوحة.`
      });
      setBroadcastMessage('');
    }
  };

  return (
    <div className={styles.style143_1} dir="rtl">
      {/* ⚠️ GATE-GUARDED MASTER EMERGENCY KILL SWITCH */}
      <Card className={styles.style145_2}>
        <CardHeader className={styles.style146_3}>
          <CardTitle className={styles.style147_4}>
            <ShieldAlert className={styles.style148_5} />
            بروتوكول الطوارئ الإداري: مفتاح الفصل الشامل [30-Emergency]
          </CardTitle>
          <CardDescription className={styles.style151_6}>
            التحكم الكلي في بوابات الرادار في الأردن. تفعيل هذا المقبس يجبر هواتف المستخدمين كافة على تعليق الملاحة فوراً، لعزل الخوادم وتفادي حروق النشاط في حالات القوة القاهرة.
          </CardDescription>
        </CardHeader>
        <CardContent className={styles.style155_7}>
          <div className={styles.style156_8}>
            {/* Safety Confirmation Checklist */}
            <div className={styles.style158_9}>
              <span className={styles.style159_10}>🔒 بوابات الأمان المصاحبة للزر :</span>

              <div className={styles.style161_11}>
                <label className={cn(
                  styles.style163_12,
                  gate1 ? styles.style164_13 : styles.style164_14
                )}>
                  <input
                    type="checkbox"
                    checked={gate1}
                    onChange={(e) => {
                      setGate1(e.target.checked);
                      if (!e.target.checked) setSafetyCleared(false);
                    }}
                    className={styles.style173_15}
                  />
                  <span>أقر بنية تعليق الملاحة كلياً في ولاية عمان والوسط.</span>
                </label>

                <label className={cn(
                  styles.style179_16,
                  gate2 ? styles.style180_17 : styles.style180_18
                )}>
                  <input
                    type="checkbox"
                    checked={gate2}
                    onChange={(e) => {
                      setGate2(e.target.checked);
                      if (!e.target.checked) setSafetyCleared(false);
                    }}
                    className={styles.style189_19}
                  />
                  <span>مطابقة البصمة الحالية للقيادة لمنع المضاربة.</span>
                </label>
              </div>

              {/* Step 3: Unlock button */}
              <Button
                onClick={handleSafetyToggle}
                disabled={!gate1 || !gate2}
                className={cn(
                  styles.style200_20,
                  safetyCleared
                    ? styles.style202_21
                    : styles.style203_22
                )}
              >
                {safetyCleared ? (
                  <span className={styles.style207_23}>
                    <Unlock className={styles.style208_24} />
                    تم فك قفل الأمان - المقبس جاهز للإطلاق
                  </span>
                ) : (
                  <span className={styles.style212_25}>
                    <Lock className={styles.style213_26} />
                    تفعيل مفتاح الفك
                  </span>
                )}
              </Button>
            </div>

            {/* Lethal Red Execution Button */}
            <div className={styles.style221_27}>
              <div className={styles.style222_28}>
                <span className={styles.style223_29}>حالة رادار الملاحة الحالية:</span>
                <div className={styles.style224_30}>
                  <span className={cn(
                    styles.style226_31,
                    isRadarActive ? styles.style227_32 : styles.style227_33
                  )} />
                  <span className={cn(
                    styles.style230_34,
                    isRadarActive ? styles.style231_35 : styles.style231_36
                  )}>
                    {isRadarActive ? "مفتوح ونشط ●" : "معلق طارئ 🚫"}
                  </span>
                </div>
              </div>

              <Button
                onClick={handleExecuteKillSwitch}
                disabled={isLoadingControls || isTogglingKillSwitch || !safetyCleared}
                className={cn(
                  styles.style242_37,
                  !safetyCleared
                    ? styles.style244_38
                    : isRadarActive
                      ? styles.style246_39
                      : styles.style247_40
                )}
              >
                {isLoadingControls ? (
                  <Loader2 className={styles.style251_41} />
                ) : isRadarActive ? (
                  <>
                    <PowerOff className={styles.style254_42} />
                    اضغط لتنفيذ التعليق الكلي للميدان 💥
                  </>
                ) : (
                  <>
                    <Power className={styles.style259_43} />
                    اضغط لإلغاء القفل وإعادة فتح الملاحة 📡
                  </>
                )}
              </Button>

              <span className={styles.style265_44}>
                * تحذير: هذا التدخل فوري وسيتم ترحيله سحابياً لكافة هواتف السائقون والراكبين في المملكة الأردنية مباشرة.
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 💥 AD ANNIHILATION AND SOVEREIGN PURGE (Digital Annihilation) */}
      <div className={styles.style274_45}>
        <div className={styles.style275_46}>
          <Card className={styles.style276_47}>
            <CardHeader className={styles.style277_48}>
              <CardTitle className={styles.style278_49}>
                <Flame className={styles.style279_50} />
                إيقاف الإيقاف الرقمية للحملات (Ad Annihilation)
              </CardTitle>
              <CardDescription className={styles.style282_51}>
                بروتوكول [30-Annihilation] لحذف الميدان آلياً. يرسل إشعارات صامتة Silent Web Pushes لإيقاف ومسح الإعلانات المرفوضة من هواتف المستخدمين نهائياً في ثوانٍ.
              </CardDescription>
            </CardHeader>
            <CardContent className={styles.style286_52}>
              {/* Select Active Ads dropdown */}
              <div className={styles.style288_53}>
                <Label className={styles.style289_54}>حدد الحملة المستهدفة للإحراق ال:</Label>
                <select
                  value={selectedAdId}
                  onChange={(e) => setSelectedAdId(e.target.value)}
                  className={styles.style293_55}
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
              <div className={styles.style306_56}>
                <Label className={styles.style307_57}>مبرر الحذف والمذكرة الأمنية للهواتف:</Label>
                <Input
                  value={annihilationReason}
                  onChange={(e) => setAnnihilationReason(e.target.value)}
                  placeholder="مثال: انتهاك وثيقة الآداب، تحريض على المضاربة، إلخ..."
                  className={styles.style312_58}
                />
              </div>

              {/* Execution CTA button */}
              <Button
                onClick={handleAnnihilateAd}
                disabled={isAnnihilating || !selectedAdId}
                className={cn(
                  styles.style321_59,
                  !selectedAdId
                    ? styles.style323_60
                    : styles.style324_61
                )}
              >
                {isAnnihilating ? (
                  <Loader2 className={styles.style328_62} />
                ) : (
                  <>
                    <EyeOff className={styles.style331_63} />
                    بث نشاطة الإيقاف وحذف الهواتف الميدانية 💥
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* 📡 REGIONAL BROADCAST PULSES (Silent Web Pushes Helper) */}
        <div className={styles.style341_64}>
          <Card className={styles.style342_65}>
            <CardHeader className={styles.style343_66}>
              <CardTitle className={styles.style344_67}>
                <Radio className={styles.style345_68} />
                بث راداري صامت (Silent Broadcast Pulses)
              </CardTitle>
              <CardDescription className={styles.style348_69}>
                إضافة وبث تنبيهات توجيهية لحظية غير مكلفة لخلية سداسية معينة أو الميدان بالكامل، لتعديل سلوك الهواتف والتسجيل في سجل الطوارئ مباشرة.
              </CardDescription>
            </CardHeader>
            <CardContent className={styles.style352_70}>
              <div className={styles.style353_71}>
                {/* District targeting selector */}
                <div className={styles.style355_72}>
                  <Label className={styles.style356_73}>الإقليم الجغرافي المستهدف:</Label>
                  <select
                    value={selectedDistrict}
                    onChange={(e) => setSelectedDistrict(e.target.value)}
                    className={styles.style360_74}
                  >
                    <option value="الجميع">كل منطقة الأردنيين</option>
                    <option value="منطقة الجامعة">منطقة الجامعة - عمان</option>
                    <option value="منطقة قصبة عمان">منطقة قصبة عمان - عمان</option>
                    <option value="منطقة وادي السير">منطقة وادي السير - عمان</option>
                    <option value="منطقة ماركا">منطقة ماركا - عمان</option>
                  </select>
                </div>

                {/* Pulse Classification */}
                <div className={styles.style371_75}>
                  <Label className={styles.style372_76}>تصنيف النشاطة :</Label>
                  <select
                    value={alertType}
                    onChange={(e) => setAlertType(e.target.value as any)}
                    className={styles.style376_77}
                  >
                    <option value="REGIONAL_ALERT">تنبيه إقليمي توجيهي</option>
                    <option value="GLOBAL_FREEZE">تجميد اضطراري للأسعار</option>
                  </select>
                </div>
              </div>

              {/* Message text area */}
              <div className={styles.style385_78}>
                <Label className={styles.style386_79}>نص بلاغ القيادة العامة (بث لحظي):</Label>
                <textarea
                  value={broadcastMessage}
                  onChange={(e) => setBroadcastMessage(e.target.value)}
                  placeholder="اكتب مضمون الإشعار الميداني هنا..."
                  className={styles.style391_80}
                />
              </div>

              {/* Broadcast command button */}
              <Button
                onClick={handleSendBroadcast}
                disabled={isBroadcasting || !broadcastMessage.trim()}
                className={styles.style399_81}
              >
                {isBroadcasting ? (
                  <Loader2 className={styles.style402_82} />
                ) : (
                  <>
                    <Send className={styles.style405_83} />
                    إطلاق النشاطة الصامتة Silent Broadcast 📡
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
