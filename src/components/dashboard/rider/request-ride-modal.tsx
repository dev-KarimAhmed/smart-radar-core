'use client';

import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Zap, Search, CheckCircle2, Loader2, ExternalLink, Clipboard, Ruler, MapPinned, Clock, AlertCircle } from 'lucide-react';
import { useRiderOperations } from '@/hooks/use-rider-operations';
import { cn } from '@/lib/utils';

/**
 * [SCR-2026-055] منصة الإطلاق الماسية (Advanced Disclosure Version V5.2)
 * مجهزة بمرجعية الأوامر الثابتة وقانون التوازن المالي والجغرافي.
 */
export function RequestRideModal() {
  const {
    isRequestModalOpen, closeRequestModal,
    seats, setSeats,
    dropoff, setDropoff,
    pickup, setPickup,
    requiresOfficialRate, setRequiresOfficialRate,
    isResolvingUrl, openMapsForDestination,
    requestRide, isRequesting,
    estimatedDistance, estimatedTime,
    isLocationConfirmed, calculateSovereignMetrics,
    pasteFromClipboard, resetLocationMetrics,
    pulsedDrivers = [], isPulsing = false
  } = useRiderOperations();

  const isBlindSpot = estimatedDistance > 0 && estimatedDistance < 0.1;

  return (
    <Dialog open={isRequestModalOpen} onOpenChange={(open) => !open && closeRequestModal()}>
      <DialogContent className="sm:max-w-md bg-[#050D05] border-emerald-950/80 text-white shadow-2xl p-0 overflow-hidden">
        
        <div className="bg-gradient-to-b from-emerald-950/40 to-transparent p-6 text-center border-b border-white/5">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black flex items-center justify-center gap-2 tracking-tighter text-emerald-400">
              <Zap className="w-6 h-6 text-emerald-500 fill-emerald-500/20" />
              إطلاق نداء الرادار الذكي
            </DialogTitle>
            <DialogDescription className="text-gray-400 text-[10px] font-bold uppercase tracking-widest mt-1">
               بروتوكول الهندسة الماسية والتحقق المالي V5.2
            </DialogDescription>
          </DialogHeader>
        </div>

        <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto scrollbar-thin">
          
          {/* الخطوة 1: تحديد الوجهة نصياً */}
          <div className="space-y-3">
            <Label className="text-[10px] font-black text-emerald-500/70 uppercase tracking-[0.2em] flex items-center gap-1">
              <span>1. وجهتك (نصياً)</span>
            </Label>
            <div className="flex gap-2">
                <div className="relative flex-1">
                    <Input
                        placeholder="إلى أين تريد الذهاب؟"
                        value={dropoff}
                        onChange={(e) => setDropoff(e.target.value)}
                        className="h-12 bg-black/40 border-white/10 text-white placeholder:text-gray-600 rounded-xl pr-10 focus:border-emerald-500 focus:ring-0 transition-all font-bold text-sm"
                    />
                    <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                </div>
                <Button 
                    onClick={openMapsForDestination}
                    variant="outline" 
                    className="h-12 w-12 border-white/10 bg-black/40 hover:bg-emerald-500/10 rounded-xl shrink-0"
                    title="افتح خرائط جوجل للبحث عن الوجهة"
                >
                    <ExternalLink className="w-5 h-5 text-emerald-500" />
                </Button>
            </div>
          </div>

          {/* الخطوة 2: الختم الملاحي وتفعيل اللصق (علاجات الخطوة 4 و 5) */}
          <div className="space-y-3">
             <Label className="text-[10px] font-black text-emerald-500/70 uppercase tracking-[0.2em]">2. الختم الملاحي (الرابط المستخرج)</Label>
             <div className="space-y-3">
                <div className="w-full">
                    <div className="relative w-full">
                        <Input
                            placeholder="اضغط مطولاً للصق رابط الخريطة"
                            value={pickup}
                            onChange={(e) => setPickup(e.target.value)}
                            className="h-11 sm:h-12 bg-black/40 border-white/10 text-white placeholder:text-gray-500 rounded-xl pr-10 focus:border-emerald-500 text-xs font-mono w-full"
                            title="الحقل (5): حقل رابط الخارطة للتأمين الجنائي"
                        />
                        <Clipboard className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-500/60" />
                    </div>

                </div>

                {/* الخطوة 6: تشغيل العدسة الجنائية وحساب المسار */}
                {!isLocationConfirmed ? (
                    <Button 
                        onClick={calculateSovereignMetrics}
                        disabled={isResolvingUrl || !pickup}
                        className={cn(
                            "w-full h-12 sm:h-14 rounded-xl border-2 border-emerald-500/30 bg-emerald-500/10 hover:bg-emerald-500/20 transition-all flex items-center justify-center gap-3 animate-pulse-neon",
                            (!pickup || isResolvingUrl) && "opacity-50 grayscale pointer-events-none animate-none"
                        )}
                    >
                        {isResolvingUrl ? (
                            <Loader2 className="w-5 h-5 text-emerald-500 animate-spin" />
                        ) : (
                            <Ruler className="w-5 h-5 text-emerald-500" />
                        )}
                        <span className="text-xs sm:text-sm font-black text-emerald-400 uppercase tracking-widest">
                           6. تفعيل العدسة الجنائية واحتساب المسار
                        </span>
                    </Button>
                ) : (
                    <div className="bg-emerald-500/10 border-2 border-emerald-500/30 rounded-2xl p-3 sm:p-4 animate-in zoom-in-95 duration-300 space-y-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <div className="bg-emerald-500 rounded-full p-1">
                                    <CheckCircle2 className="w-3 h-3 text-black" />
                                </div>
                                <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">6. تمت المصادقة والاحتساب الملاحي</span>
                            </div>
                            <Button 
                                variant="ghost" 
                                size="sm" 
                                onClick={() => { setPickup(''); resetLocationMetrics(); }} 
                                className="h-6 text-[9px] font-bold text-gray-500 hover:text-white px-2"
                            >
                                إعادة الضبط
                            </Button>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-2 sm:gap-4">
                            <div className="bg-black/40 rounded-xl p-2 sm:p-3 border border-white/5 flex items-center gap-2 sm:gap-3">
                                <div className="bg-emerald-500/10 p-1.5 sm:p-2 rounded-lg shrink-0">
                                    <MapPinned className="w-4 h-4 text-emerald-500" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-[8px] text-gray-500 font-bold uppercase">المسافة الفعلية</p>
                                    <p className="text-xs sm:text-sm font-black text-white truncate">
                                        {isBlindSpot ? (
                                            <span className="text-amber-400 flex items-center gap-1"><AlertCircle className="w-2 h-2"/> لواء لاهوت</span>
                                        ) : (
                                            <>
                                                {estimatedDistance.toFixed(2)}
                                                <span className="text-[10px] text-emerald-500 mr-1">كم</span>
                                            </>
                                        )}
                                    </p>
                                </div>
                            </div>
                            <div className="bg-black/40 rounded-xl p-2 sm:p-3 border border-white/5 flex items-center gap-2 sm:gap-3">
                                <div className="bg-blue-500/10 p-1.5 sm:p-2 rounded-lg shrink-0">
                                    <Clock className="w-4 h-4 text-blue-400" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-[8px] text-gray-500 font-bold uppercase">الزمن التقديري</p>
                                    <p className="text-xs sm:text-sm font-black text-white">
                                        {estimatedTime > 0 ? `~${estimatedTime}` : '--'} 
                                        <span className="text-[10px] text-blue-400 mr-1">دقيقة</span>
                                    </p>
                                </div>
                            </div>
                        </div>

                        {!isBlindSpot && estimatedDistance > 0 && (
                            <div className="bg-black/60 border border-emerald-500/20 rounded-xl p-3 mt-2 text-[10px] space-y-1.5 font-sans">
                                <div className="flex justify-between items-center border-b border-emerald-500/10 pb-1.5">
                                    <span className="text-emerald-400 font-extrabold flex items-center gap-1">
                                        📐 معادلة العدالة الميدانية V5.1
                                    </span>
                                    <span className="text-gray-500 font-mono text-[9px]">SSOT Engine</span>
                                </div>
                                <div className="space-y-1 font-mono text-gray-300">
                                    <div className="flex justify-between">
                                        <span>مسافة الدورة العظمى (Haversine):</span>
                                        <span>{(estimatedDistance / 1.35).toFixed(2)} كم</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span>معامل التعرج النسيجي (γ):</span>
                                        <span className="text-emerald-400">× 1.35</span>
                                    </div>
                                    <div className="flex justify-between border-t border-white/5 pt-1 mt-1 font-black">
                                        <span className="text-white">المسافة السيادية المعتمدة:</span>
                                        <span className="text-emerald-400 font-mono">{estimatedDistance.toFixed(2)} كم</span>
                                    </div>
                                    <div className="flex justify-between border-t border-white/5 pt-1 mt-1 font-mono">
                                        <span>حساب الزمن (المسافة / السرعة 40 كم/س):</span>
                                        <span className="text-blue-400 font-black">~{estimatedTime} دقيقة</span>
                                    </div>
                                </div>
                            </div>
                        )}

                        {isBlindSpot && (
                            <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-2.5 mt-2 animate-pulse">
                                <p className="text-[10px] sm:text-xs text-amber-400 font-extrabold leading-normal">
                                    ⚠️ تعذر استخراج الإحداثيات؛ تم تفعيل "بروتوكول النقطة العمياء" لتأمين استمرارية الرادار على مستوى اللواء.
                                </p>
                            </div>
                        )}
                    </div>
                )}
             </div>
          </div>

          {/* الخطوات 7 و 8: فرز المقاعد وتحديث ميزان النبض المالي محلياً */}
          <div className="grid grid-cols-2 gap-4 pt-2">
            <div className="space-y-2">
                <span className="text-[10px] text-emerald-500/70 font-black mr-1 uppercase block">7. عدد المقاعد المطلوبة</span>
                <Select value={seats} onValueChange={setSeats}>
                    <SelectTrigger className="h-11 bg-black/40 border-white/10 rounded-xl text-xs font-extrabold focus:border-emerald-500">
                        <SelectValue placeholder="حدد المقاعد" />
                    </SelectTrigger>
                    <SelectContent className="bg-[#091B09] border-emerald-900/50 text-white font-bold text-xs">
                        {[1, 2, 3, 4].map(n => <SelectItem key={n} value={n.toString()}>{n} {n === 1 ? 'راكب واحد' : 'ركاب'}</SelectItem>)}
                    </SelectContent>
                </Select>
            </div>
            
            <div className="space-y-2">
                <span className="text-[10px] text-emerald-500/70 font-black mr-1 uppercase block">8. نمط المحاسبة</span>
                <div className="flex items-center justify-between bg-black/40 border border-white/10 rounded-xl px-3 h-11">
                    <span className="text-[10px] font-black text-gray-400">عداد تطبيقات</span>
                    <Switch checked={requiresOfficialRate} onCheckedChange={setRequiresOfficialRate} className="data-[state=checked]:bg-emerald-600 scale-75" />
                </div>
            </div>
          </div>

          {/* ميزان النبض اللوجستي وعزم الطاقة للخطوات 7 و 8 */}
          <div className="p-3 bg-black/20 rounded-xl border border-emerald-900/10 space-y-2 text-center">
            <span className="text-[9px] sm:text-[10px] text-gray-500 font-extrabold block uppercase">8. ميزان النبض اللوجستي وعزم توازن الطاقة للواء</span>
            <div className="flex justify-center items-center gap-2">
              <span className={cn(
                "px-2.5 py-0.5 rounded-full text-[9px] sm:text-[10px] font-extrabold tracking-wide",
                parseInt(seats) <= 2 ? "bg-emerald-900/20 text-emerald-400 border border-emerald-500/20" : "bg-amber-950/25 text-amber-500 border border-amber-500/20"
              )}>
                {parseInt(seats) <= 2 ? "🔴 زخم العرض: صاعد ومتوفر" : "⚠️ زخم الطاقة: كثيف ويتطلب سيارة صالون واسعة"}
              </span>
              <span className="bg-black/40 text-gray-400 text-[8px] px-2 py-0.5 rounded border border-white/5 font-mono">
                γ = 1.35
              </span>
            </div>
          </div>

          {/* تنويه السيادة والعمى التقني الموحد للتصميم الصارم */}
          <div className="bg-[#081808] border border-emerald-900/30 rounded-2xl p-4 space-y-2 animate-in fade-in duration-500">
             <div className="flex items-center gap-1.5 text-emerald-400 font-black text-xs uppercase tracking-wider">
                <AlertCircle className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>النزاهة الميدانية لـ "الرادار الذكي"</span>
             </div>
             <p className="text-[10px] sm:text-xs text-gray-400 font-bold leading-normal">
                بموجب ميثاق صفر تشتت وصفر سحابة (SC55)، يمتنع الرادار عن عرض الخرائط للراكب نهائياً (العمى التقني) أو تجاوز فقاعة 1.5 كم. يتم السيطرة وحساب الأبعاد تجميداً بصفر عمولة.
             </p>
          </div>

        </div>

        <DialogFooter className="p-6 bg-black/40 border-t border-white/5">
          <Button
            onClick={requestRide}
            disabled={isRequesting || !isLocationConfirmed || !dropoff}
            className={cn(
              "w-full h-16 rounded-2xl font-black text-xl tracking-tighter transition-all",
              isLocationConfirmed && dropoff 
                ? "bg-emerald-600 hover:bg-emerald-500 text-white shadow-[0_10px_30px_rgba(16,185,129,0.3)] border border-emerald-500/20" 
                : "bg-white/5 text-white/10 grayscale pointer-events-none"
            )}
          >
            {isRequesting ? (
              <div className="flex items-center gap-2">
                <Loader2 className="w-6 h-6 animate-spin text-emerald-400" />
                <span>يرسل الإشارة الملاحية...</span>
              </div>
            ) : (
              'تفعيل العوامة السيادية للرادار'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
