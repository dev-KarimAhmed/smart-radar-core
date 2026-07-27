'use client';

import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Zap, CheckCircle2, Loader2, Clipboard, Ruler, MapPinned, Clock, AlertCircle } from 'lucide-react';
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
    isResolvingUrl,
    requestRide, isRequesting,
    estimatedDistance, estimatedTime,
    isLocationConfirmed, calculateSovereignMetrics,
    pasteFromClipboard, resetLocationMetrics,
    pulsedDrivers = [], isPulsing = false,
    isRadarActive
  } = useRiderOperations()!;

  const destinationOptions = [
    { id: 'amman-wadi-seer', governorate: 'عمان', district: 'وادي السير', label: 'وادي السير - عمان', coords: '31.958600, 35.868400' },
    { id: 'amman-downtown', governorate: 'عمان', district: 'وسط البلد', label: 'وسط البلد - عمان', coords: '31.951900, 35.939300' },
    { id: 'zarqa-center', governorate: 'الزرقاء', district: 'الزرقاء الجديدة', label: 'الزرقاء الجديدة', coords: '32.072800, 36.087000' },
    { id: 'irbid-center', governorate: 'إربد', district: 'إربد البلد', label: 'إربد البلد', coords: '32.555600, 35.850000' },
    { id: 'madaba-center', governorate: 'مأدبا', district: 'مأدبا البلد', label: 'مأدبا البلد', coords: '31.716700, 35.793600' },
  ];

  const selectedDestination = destinationOptions.find((option) => option.label === dropoff);
  const isBlindSpot = estimatedDistance > 0 && estimatedDistance < 0.1;

  return (
    <Dialog open={isRequestModalOpen} onOpenChange={(open) => !open && closeRequestModal()}>
      <DialogContent className="sm:max-w-md bg-[#0A0F1D]/95 border-white/[0.06] backdrop-blur-xl text-white shadow-2xl p-0 overflow-hidden">

        <div className="bg-gradient-to-b from-[#14B8A6]/10 to-transparent p-6 text-center border-b border-white/5">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black flex items-center justify-center gap-2 tracking-tighter text-[#14B8A6]">
              <Zap className="w-6 h-6 text-[#14B8A6] fill-[#14B8A6]/20" />
              طلب رحلة
            </DialogTitle>
            <DialogDescription className="text-gray-400 text-[10px] font-bold uppercase tracking-widest mt-1">
               اختر وجهتك واحسب المسافة محليا
            </DialogDescription>
          </DialogHeader>
        </div>

        <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto scrollbar-thin">

          {/* الخطوة 1: تحديد الوجهة محليا */}
          <div className="space-y-3">
            <Label className="text-[10px] font-black text-[#14B8A6]/70 uppercase tracking-[0.2em] flex items-center gap-1">
              <span>1. اختر الوجهة</span>
            </Label>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Select
                value={selectedDestination?.governorate || ''}
                onValueChange={(governorate) => {
                  const option = destinationOptions.find((item) => item.governorate === governorate);
                  if (!option) return;
                  resetLocationMetrics();
                  setDropoff(option.label);
                  setPickup(option.coords);
                }}
              >
                <SelectTrigger className="h-12 bg-black/40 border-white/10 rounded-xl text-xs font-extrabold focus:border-[#14B8A6]">
                  <SelectValue placeholder="المحافظة" />
                </SelectTrigger>
                <SelectContent className="bg-[#0F172A] border-white/[0.06] text-white font-bold text-xs">
                  {[...new Set(destinationOptions.map((item) => item.governorate))].map((governorate) => (
                    <SelectItem key={governorate} value={governorate}>{governorate}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select
                value={selectedDestination?.id || ''}
                onValueChange={(id) => {
                  const option = destinationOptions.find((item) => item.id === id);
                  if (!option) return;
                  resetLocationMetrics();
                  setDropoff(option.label);
                  setPickup(option.coords);
                }}
              >
                <SelectTrigger className="h-12 bg-black/40 border-white/10 rounded-xl text-xs font-extrabold focus:border-[#14B8A6]">
                  <SelectValue placeholder="المنطقة" />
                </SelectTrigger>
                <SelectContent className="bg-[#0F172A] border-white/[0.06] text-white font-bold text-xs">
                  {destinationOptions.map((option) => (
                    <SelectItem key={option.id} value={option.id}>{option.district}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* الخطوة 2: إحداثيات الوجهة المحلية */}
          <div className="space-y-3">
             <Label className="text-[10px] font-black text-[#14B8A6]/70 uppercase tracking-[0.2em]">2. إحداثيات الوجهة</Label>
             <div className="space-y-3">
                <div className="w-full">
                    <div className="relative w-full">
                        <Input
                            placeholder="اختر منطقة أو اكتب الإحداثيات مثل 31.95, 35.91"
                            value={pickup}
                            onChange={(e) => setPickup(e.target.value)}
                            className="h-11 sm:h-12 bg-black/40 border-white/10 text-white placeholder:text-gray-500 rounded-xl pr-10 focus:border-[#14B8A6] text-xs font-mono w-full"
                            title="إحداثيات محلية بدون geocoding"
                        />
                        <Clipboard className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#14B8A6]/60" />
                    </div>

                </div>

                {/* حساب المسافة محليا */}
                {!isLocationConfirmed ? (
                    <Button
                        onClick={calculateSovereignMetrics}
                        disabled={isResolvingUrl || !pickup}
                        className={cn(
                            "w-full h-12 sm:h-14 rounded-xl border-2 border-[#14B8A6]/30 bg-[#14B8A6]/10 hover:bg-[#14B8A6]/20 transition-all flex items-center justify-center gap-3 animate-pulse-neon",
                            (!pickup || isResolvingUrl) && "opacity-50 grayscale pointer-events-none animate-none"
                        )}
                    >
                        {isResolvingUrl ? (
                            <Loader2 className="w-5 h-5 text-[#14B8A6] animate-spin" />
                        ) : (
                            <Ruler className="w-5 h-5 text-[#14B8A6]" />
                        )}
                        <span className="text-xs sm:text-sm font-black text-[#14B8A6] uppercase tracking-widest">
                           حساب المسافة والسعر
                        </span>
                    </Button>
                ) : (
                    <div className="bg-[#14B8A6]/10 border-2 border-[#14B8A6]/30 rounded-2xl p-3 sm:p-4 animate-in zoom-in-95 duration-300 space-y-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <div className="bg-[#14B8A6] rounded-full p-1">
                                    <CheckCircle2 className="w-3 h-3 text-black" />
                                </div>
                                <span className="text-[10px] font-black text-[#14B8A6] uppercase tracking-widest">تم حساب المسافة محليا</span>
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
                                <div className="bg-[#14B8A6]/10 p-1.5 sm:p-2 rounded-lg shrink-0">
                                    <MapPinned className="w-4 h-4 text-[#14B8A6]" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-[8px] text-gray-500 font-bold uppercase">المسافة الفعلية</p>
                                    <p className="text-xs sm:text-sm font-black text-white truncate">
                                        {isBlindSpot ? (
                                            <span className="text-amber-400 flex items-center gap-1"><AlertCircle className="w-2 h-2"/> منطقة لاهوت</span>
                                        ) : (
                                            <>
                                                {estimatedDistance.toFixed(2)}
                                                <span className="text-[10px] text-[#14B8A6] mr-1">كم</span>
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
                            <div className="bg-black/60 border border-[#14B8A6]/20 rounded-xl p-3 mt-2 text-[10px] space-y-1.5 font-sans">
                                <div className="flex justify-between items-center border-b border-[#14B8A6]/10 pb-1.5">
                                    <span className="text-[#14B8A6] font-extrabold flex items-center gap-1">
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
                                        <span>معامل التعرج المحلي (γ):</span>
                                        <span className="text-[#14B8A6]">× 1.35</span>
                                    </div>
                                    <div className="flex justify-between border-t border-white/5 pt-1 mt-1 font-black">
                                        <span className="text-white">المسافة المعتمدة:</span>
                                        <span className="text-[#14B8A6] font-mono">{estimatedDistance.toFixed(2)} كم</span>
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
                                    ⚠️ تعذر استخراج الإحداثيات؛ تم تفعيل "بروتوكول النقطة العمياء" لتأمين استمرارية الرادار على مستوى المنطقة.
                                </p>
                            </div>
                        )}
                    </div>
                )}
             </div>
          </div>

          {/* المقاعد ونوع الحساب */}
          <div className="grid grid-cols-2 gap-4 pt-2">
            <div className="space-y-2">
                <span className="text-[10px] text-[#14B8A6]/70 font-black mr-1 uppercase block">7. عدد المقاعد المطلوبة</span>
                <Select value={seats} onValueChange={setSeats}>
                    <SelectTrigger className="h-11 bg-black/40 border-white/10 rounded-xl text-xs font-extrabold focus:border-[#14B8A6]">
                        <SelectValue placeholder="حدد المقاعد" />
                    </SelectTrigger>
                    <SelectContent className="bg-[#0F172A] border-white/[0.06] text-white font-bold text-xs">
                        {[1, 2, 3, 4].map(n => <SelectItem key={n} value={n.toString()}>{n} {n === 1 ? 'راكب واحد' : 'ركاب'}</SelectItem>)}
                    </SelectContent>
                </Select>
            </div>

            <div className="space-y-2">
                <span className="text-[10px] text-[#14B8A6]/70 font-black mr-1 uppercase block">8. نمط المحاسبة</span>
                <div className="flex items-center justify-between bg-black/40 border border-white/10 rounded-xl px-3 h-11">
                    <span className="text-[10px] font-black text-gray-400">عداد تطبيقات</span>
                    <Switch checked={requiresOfficialRate} onCheckedChange={setRequiresOfficialRate} className="data-[state=checked]:bg-[#14B8A6] scale-75" />
                </div>
            </div>
          </div>

          {/* حالة الطلب */}
          <div className="p-3 bg-black/20 rounded-xl border border-[#14B8A6]/10 space-y-2 text-center">
            <span className="text-[9px] sm:text-[10px] text-gray-500 font-extrabold block uppercase">حالة توفر السائقون</span>
            <div className="flex justify-center items-center gap-2">
              <span className={cn(
                "px-2.5 py-0.5 rounded-full text-[9px] sm:text-[10px] font-extrabold tracking-wide",
                parseInt(seats) <= 2 ? "bg-[#14B8A6]/10 text-[#14B8A6] border border-[#14B8A6]/20" : "bg-amber-950/25 text-amber-500 border border-amber-500/20"
              )}>
                {parseInt(seats) <= 2 ? "🔴 زخم العرض: صاعد ومتوفر" : "⚠️ زخم الطاقة: كثيف ويتطلب سيارة صالون واسعة"}
              </span>
              <span className="bg-black/40 text-gray-400 text-[8px] px-2 py-0.5 rounded border border-white/5 font-mono">
                γ = 1.35
              </span>
            </div>
          </div>

          {/* تنويه الإدارة والعمى التقني الموحد للتصميم الصارم */}
          <div className="bg-[#0A1628] border border-[#14B8A6]/20 rounded-2xl p-4 space-y-2 animate-in fade-in duration-500">
             <div className="flex items-center gap-1.5 text-[#14B8A6] font-black text-xs uppercase tracking-wider">
                <AlertCircle className="w-4 h-4 text-[#14B8A6] shrink-0" />
                <span>النزاهة الميدانية لـ "الرادار الذكي"</span>
             </div>
             <p className="text-[10px] sm:text-xs text-gray-400 font-bold leading-normal">
                بموجب ميثاق صفر تشتت وصفر سحابة (SC55)، يمتنع الرادار عن عرض الخرائط للراكب نهائياً (العمى التقني) أو تجاوز فقاعة 1.5 كم. يتم السيطرة وحساب الأبعاد تجميداً بصفر عمولة.
             </p>
          </div>

        </div>

        <DialogFooter className="p-6 bg-black/40 border-t border-white/5">
          {isRadarActive === false ? (
            <div className="w-full h-16 bg-rose-950/20 border border-rose-500/30 rounded-2xl flex items-center justify-center p-3 animate-pulse">
              <span className="text-xs sm:text-sm font-black text-rose-400 text-center leading-normal">
                الخدمة معلقة مؤقتاً بناءً على القرارات الرسمية
              </span>
            </div>
          ) : (
            <Button
              onClick={requestRide}
              disabled={isRequesting || !isLocationConfirmed || !dropoff}
              className={cn(
                "w-full h-16 rounded-2xl font-black text-xl tracking-tighter transition-all",
                isLocationConfirmed && dropoff
                  ? "bg-[#14B8A6] hover:bg-[#2DD4BF] text-[#031315] shadow-[0_10px_30px_rgba(20,184,166,0.3)] border border-[#14B8A6]/20"
                  : "bg-white/5 text-white/10 grayscale pointer-events-none"
              )}
            >
              {isRequesting ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="w-6 h-6 animate-spin text-[#14B8A6]" />
                  <span>يرسل الطلب...</span>
                </div>
              ) : (
                'إرسال طلب الرحلة'
              )}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
