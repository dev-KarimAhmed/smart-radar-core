'use client';

import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Zap, CheckCircle2, Loader2, Clipboard, Ruler, MapPinned, Clock, AlertCircle } from 'lucide-react';
import { useRiderOperations } from '../hooks/use-rider-operations';
import { useLocaleContext } from '@/components/providers/locale-provider';
import { cn } from '@/lib/utils';

const styles = {
  style47_1: "sm:max-w-md bg-[#0A0F1D]/95 border-white/[0.06] backdrop-blur-xl text-white shadow-2xl p-0 overflow-hidden",
  style49_2: "bg-gradient-to-b from-[#14B8A6]/10 to-transparent p-6 text-center border-b border-white/5",
  style51_3: "text-2xl font-black flex items-center justify-center gap-2 tracking-tighter text-[#14B8A6]",
  style52_4: "w-6 h-6 text-[#14B8A6] fill-[#14B8A6]/20",
  style55_5: "text-gray-400 text-[10px] font-bold uppercase tracking-widest mt-1",
  style61_6: "p-6 space-y-6 max-h-[70vh] overflow-y-auto scrollbar-thin",
  style64_7: "space-y-3",
  style65_8: "text-[10px] font-black text-[#14B8A6]/70 uppercase tracking-[0.2em] flex items-center gap-1",
  style68_9: "grid grid-cols-1 gap-3 sm:grid-cols-2",
  style79_10: "h-12 bg-black/40 border-white/10 rounded-xl text-xs font-extrabold focus:border-[#14B8A6]",
  style82_11: "bg-[#0F172A] border-white/[0.06] text-white font-bold text-xs",
  style99_12: "h-12 bg-black/40 border-white/10 rounded-xl text-xs font-extrabold focus:border-[#14B8A6]",
  style102_13: "bg-[#0F172A] border-white/[0.06] text-white font-bold text-xs",
  style112_14: "space-y-3",
  style113_15: "text-[10px] font-black text-[#14B8A6]/70 uppercase tracking-[0.2em]",
  style114_16: "space-y-3",
  style115_17: "w-full",
  style116_18: "relative w-full",
  style121_19: "h-11 sm:h-12 bg-black/40 border-white/10 text-white placeholder:text-gray-500 rounded-xl pr-10 focus:border-[#14B8A6] text-xs font-mono w-full",
  style124_20: "absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#14B8A6]/60",
  style135_21: "w-full h-12 sm:h-14 rounded-xl border-2 border-[#14B8A6]/30 bg-[#14B8A6]/10 hover:bg-[#14B8A6]/20 transition-all flex items-center justify-center gap-3 animate-pulse-neon",
  style136_22: "opacity-50 grayscale pointer-events-none animate-none",
  style140_23: "w-5 h-5 text-[#14B8A6] animate-spin",
  style142_24: "w-5 h-5 text-[#14B8A6]",
  style144_25: "text-xs sm:text-sm font-black text-[#14B8A6] uppercase tracking-widest",
  style149_26: "bg-[#14B8A6]/10 border-2 border-[#14B8A6]/30 rounded-2xl p-3 sm:p-4 animate-in zoom-in-95 duration-300 space-y-4",
  style150_27: "flex items-center justify-between",
  style151_28: "flex items-center gap-2",
  style152_29: "bg-[#14B8A6] rounded-full p-1",
  style153_30: "w-3 h-3 text-black",
  style155_31: "text-[10px] font-black text-[#14B8A6] uppercase tracking-widest",
  style161_32: "h-6 text-[9px] font-bold text-gray-500 hover:text-white px-2",
  style167_33: "grid grid-cols-2 gap-2 sm:gap-4",
  style168_34: "bg-black/40 rounded-xl p-2 sm:p-3 border border-white/5 flex items-center gap-2 sm:gap-3",
  style169_35: "bg-[#14B8A6]/10 p-1.5 sm:p-2 rounded-lg shrink-0",
  style170_36: "w-4 h-4 text-[#14B8A6]",
  style172_37: "flex-1 min-w-0",
  style173_38: "text-[8px] text-gray-500 font-bold uppercase",
  style174_39: "text-xs sm:text-sm font-black text-white truncate",
  style176_40: "text-amber-400 flex items-center gap-1",
  style176_41: "w-2 h-2",
  style180_42: "text-[10px] text-[#14B8A6] mr-1",
  style186_43: "bg-black/40 rounded-xl p-2 sm:p-3 border border-white/5 flex items-center gap-2 sm:gap-3",
  style187_44: "bg-blue-500/10 p-1.5 sm:p-2 rounded-lg shrink-0",
  style188_45: "w-4 h-4 text-blue-400",
  style190_46: "flex-1 min-w-0",
  style191_47: "text-[8px] text-gray-500 font-bold uppercase",
  style192_48: "text-xs sm:text-sm font-black text-white",
  style194_49: "text-[10px] text-blue-400 mr-1",
  style201_50: "bg-black/60 border border-[#14B8A6]/20 rounded-xl p-3 mt-2 text-[10px] space-y-1.5 font-sans",
  style202_51: "flex justify-between items-center border-b border-[#14B8A6]/10 pb-1.5",
  style203_52: "text-[#14B8A6] font-extrabold flex items-center gap-1",
  style206_53: "text-gray-500 font-mono text-[9px]",
  style208_54: "space-y-1 font-mono text-gray-300",
  style209_55: "flex justify-between",
  style213_56: "flex justify-between",
  style215_57: "text-[#14B8A6]",
  style217_58: "flex justify-between border-t border-white/5 pt-1 mt-1 font-black",
  style218_59: "text-white",
  style219_60: "text-[#14B8A6] font-mono",
  style221_61: "flex justify-between border-t border-white/5 pt-1 mt-1 font-mono",
  style223_62: "text-blue-400 font-black",
  style230_63: "bg-amber-500/10 border border-amber-500/30 rounded-xl p-2.5 mt-2 animate-pulse",
  style231_64: "text-[10px] sm:text-xs text-amber-400 font-extrabold leading-normal",
  style242_65: "grid grid-cols-2 gap-4 pt-2",
  style243_66: "space-y-2",
  style244_67: "text-[10px] text-[#14B8A6]/70 font-black mr-1 uppercase block",
  style246_68: "h-11 bg-black/40 border-white/10 rounded-xl text-xs font-extrabold focus:border-[#14B8A6]",
  style249_69: "bg-[#0F172A] border-white/[0.06] text-white font-bold text-xs",
  style255_70: "space-y-2",
  style256_71: "text-[10px] text-[#14B8A6]/70 font-black mr-1 uppercase block",
  style257_72: "flex items-center justify-between bg-black/40 border border-white/10 rounded-xl px-3 h-11",
  style258_73: "text-[10px] font-black text-gray-400",
  style259_74: "data-[state=checked]:bg-[#14B8A6] scale-75",
  style265_75: "p-3 bg-black/20 rounded-xl border border-[#14B8A6]/10 space-y-2 text-center",
  style266_76: "text-[9px] sm:text-[10px] text-gray-500 font-extrabold block uppercase",
  style267_77: "flex justify-center items-center gap-2",
  style269_78: "px-2.5 py-0.5 rounded-full text-[9px] sm:text-[10px] font-extrabold tracking-wide",
  style270_79: "bg-[#14B8A6]/10 text-[#14B8A6] border border-[#14B8A6]/20",
  style270_80: "bg-amber-950/25 text-amber-500 border border-amber-500/20",
  style274_81: "bg-black/40 text-gray-400 text-[8px] px-2 py-0.5 rounded border border-white/5 font-mono",
  style281_82: "bg-[#0A1628] border border-[#14B8A6]/20 rounded-2xl p-4 space-y-2 animate-in fade-in duration-500",
  style282_83: "flex items-center gap-1.5 text-[#14B8A6] font-black text-xs uppercase tracking-wider",
  style283_84: "w-4 h-4 text-[#14B8A6] shrink-0",
  style286_85: "text-[10px] sm:text-xs text-gray-400 font-bold leading-normal",
  style293_86: "p-6 bg-black/40 border-t border-white/5",
  style295_87: "w-full h-16 bg-rose-950/20 border border-rose-500/30 rounded-2xl flex items-center justify-center p-3 animate-pulse",
  style296_88: "text-xs sm:text-sm font-black text-rose-400 text-center leading-normal",
  style305_89: "w-full h-16 rounded-2xl font-black text-xl tracking-tighter transition-all",
  style307_90: "bg-[#14B8A6] hover:bg-[#2DD4BF] text-[#031315] shadow-[0_10px_30px_rgba(20,184,166,0.3)] border border-[#14B8A6]/20",
  style308_91: "bg-white/5 text-white/10 grayscale pointer-events-none",
  style312_92: "flex items-center gap-2",
  style313_93: "w-6 h-6 animate-spin text-[#14B8A6]",
} as const;


/**
 * [SCR-2026-055] منصة الإطلاق الماسية (Advanced Disclosure Version V5.2)
 * مجهزة بمرجعية الأوامر الثابتة وقانون التوازن المالي والجغرافي.
 */
export function RequestRideModal() {
  const { currentLocale } = useLocaleContext();
  const isArabic = currentLocale === 'ar';

  const {
    isRequestModalOpen, closeRequestModal,
    seats, setSeats,
    dropoff, setDropoff,
    pickup, setPickup,
    pricingPreference, setPricingPreference,
    isResolvingUrl,
    requestRide, isRequesting,
    estimatedDistance, estimatedTime,
    isLocationConfirmed, calculateSovereignMetrics,
    pasteFromClipboard, resetLocationMetrics,
    pulsedDrivers = [], isPulsing = false,
    isRadarActive
  } = useRiderOperations()!;

  const destinationOptions = [
    { id: 'amman-wadi-seer', governorate: isArabic ? 'عمان' : 'Amman', district: isArabic ? 'وادي السير' : 'Wadi Al-Seer', label: isArabic ? 'وادي السير - عمان' : 'Wadi Al-Seer - Amman', coords: '31.958600, 35.868400' },
    { id: 'amman-downtown', governorate: isArabic ? 'عمان' : 'Amman', district: isArabic ? 'وسط البلد' : 'Downtown', label: isArabic ? 'وسط البلد - عمان' : 'Downtown - Amman', coords: '31.951900, 35.939300' },
    { id: 'zarqa-center', governorate: isArabic ? 'الزرقاء' : 'Zarqa', district: isArabic ? 'الزرقاء الجديدة' : 'New Zarqa', label: isArabic ? 'الزرقاء الجديدة' : 'New Zarqa', coords: '32.072800, 36.087000' },
    { id: 'irbid-center', governorate: isArabic ? 'إربد' : 'Irbid', district: isArabic ? 'إربد البلد' : 'Irbid Downtown', label: isArabic ? 'إربد البلد' : 'Irbid Downtown', coords: '32.555600, 35.850000' },
    { id: 'madaba-center', governorate: isArabic ? 'مأدبا' : 'Madaba', district: isArabic ? 'مأدبا البلد' : 'Madaba Downtown', label: isArabic ? 'مأدبا البلد' : 'Madaba Downtown', coords: '31.716700, 35.793600' },
  ];

  const selectedDestination = destinationOptions.find((option) => option.label === dropoff);
  const isBlindSpot = estimatedDistance > 0 && estimatedDistance < 0.1;

  return (
    <Dialog open={isRequestModalOpen} onOpenChange={(open) => !open && closeRequestModal()}>
      <DialogContent className={styles.style47_1}>

        <div className={styles.style49_2}>
          <DialogHeader>
            <DialogTitle className={styles.style51_3}>
              <Zap className={styles.style52_4} />
              {isArabic ? 'طلب رحلة' : 'Request Ride'}
            </DialogTitle>
            <DialogDescription className={styles.style55_5}>
               {isArabic ? 'اختر وجهتك واحسب المسافة محلياً' : 'Select your destination and calculate distance locally'}
            </DialogDescription>
          </DialogHeader>
        </div>

        <div className={styles.style61_6}>

          {/* الخطوة 1: تحديد الوجهة محليا */}
          <div className={styles.style64_7}>
            <Label className={styles.style65_8}>
              <span>{isArabic ? '1. اختر الوجهة' : '1. Select Destination'}</span>
            </Label>
            <div className={styles.style68_9}>
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
                <SelectTrigger className={styles.style79_10}>
                  <SelectValue placeholder={isArabic ? 'المحافظة' : 'Governorate'} />
                </SelectTrigger>
                <SelectContent className={styles.style82_11}>
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
                <SelectTrigger className={styles.style99_12}>
                  <SelectValue placeholder={isArabic ? 'المنطقة' : 'District'} />
                </SelectTrigger>
                <SelectContent className={styles.style102_13}>
                  {destinationOptions.map((option) => (
                    <SelectItem key={option.id} value={option.id}>{option.district}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* الخطوة 2: إحداثيات الوجهة المحلية */}
          <div className={styles.style112_14}>
             <Label className={styles.style113_15}>{isArabic ? '2. إحداثيات الوجهة' : '2. Destination Coordinates'}</Label>
             <div className={styles.style114_16}>
                <div className={styles.style115_17}>
                    <div className={styles.style116_18}>
                        <Input
                            placeholder={isArabic ? 'اختر منطقة أو اكتب الإحداثيات مثل 31.95, 35.91' : 'Select an area or enter coordinates like 31.95, 35.91'}
                            value={pickup}
                            onChange={(e) => setPickup(e.target.value)}
                            className={styles.style121_19}
                            title={isArabic ? 'إحداثيات محلية بدون geocoding' : 'Local coordinates without geocoding'}
                        />
                        <Clipboard className={styles.style124_20} />
                    </div>

                </div>

                {/* حساب المسافة محليا */}
                {!isLocationConfirmed ? (
                    <Button
                        onClick={calculateSovereignMetrics}
                        disabled={isResolvingUrl || !pickup}
                        className={cn(
                            styles.style135_21,
                            (!pickup || isResolvingUrl) && styles.style136_22
                        )}
                    >
                        {isResolvingUrl ? (
                            <Loader2 className={styles.style140_23} />
                        ) : (
                            <Ruler className={styles.style142_24} />
                        )}
                        <span className={styles.style144_25}>
                           {isArabic ? 'حساب المسافة والسعر' : 'Calculate Distance & Fare'}
                        </span>
                    </Button>
                ) : (
                    <div className={styles.style149_26}>
                        <div className={styles.style150_27}>
                            <div className={styles.style151_28}>
                                <div className={styles.style152_29}>
                                    <CheckCircle2 className={styles.style153_30} />
                                </div>
                                <span className={styles.style155_31}>{isArabic ? 'تم حساب المسافة محلياً' : 'Distance calculated locally'}</span>
                            </div>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => { setPickup(''); resetLocationMetrics(); }}
                                className={styles.style161_32}
                            >
                                {isArabic ? 'إعادة الضبط' : 'Reset'}
                            </Button>
                        </div>

                        <div className={styles.style167_33}>
                            <div className={styles.style168_34}>
                                <div className={styles.style169_35}>
                                    <MapPinned className={styles.style170_36} />
                                </div>
                                <div className={styles.style172_37}>
                                    <p className={styles.style173_38}>{isArabic ? 'المسافة الفعلية' : 'Actual Distance'}</p>
                                    <p className={styles.style174_39}>
                                        {isBlindSpot ? (
                                            <span className={styles.style176_40}><AlertCircle className={styles.style176_41}/> {isArabic ? 'منطقة لاهوت' : 'Blind spot area'}</span>
                                        ) : (
                                            <>
                                                {estimatedDistance.toFixed(2)}
                                                <span className={styles.style180_42}>{isArabic ? 'كم' : 'km'}</span>
                                            </>
                                        )}
                                    </p>
                                </div>
                            </div>
                            <div className={styles.style186_43}>
                                <div className={styles.style187_44}>
                                    <Clock className={styles.style188_45} />
                                </div>
                                <div className={styles.style190_46}>
                                    <p className={styles.style191_47}>{isArabic ? 'الزمن التقديري' : 'Estimated Time'}</p>
                                    <p className={styles.style192_48}>
                                        {estimatedTime > 0 ? `~${estimatedTime}` : '--'}
                                        <span className={styles.style194_49}>{isArabic ? 'دقيقة' : 'min'}</span>
                                    </p>
                                </div>
                            </div>
                        </div>

                        {!isBlindSpot && estimatedDistance > 0 && (
                            <div className={styles.style201_50}>
                                <div className={styles.style202_51}>
                                    <span className={styles.style203_52}>
                                        {isArabic ? '📐 معادلة العدالة الميدانية V5.1' : '📐 Field Equity Formula V5.1'}
                                    </span>
                                    <span className={styles.style206_53}>SSOT Engine</span>
                                </div>
                                <div className={styles.style208_54}>
                                    <div className={styles.style209_55}>
                                        <span>{isArabic ? 'مسافة الدورة العظمى (Haversine):' : 'Great-circle distance (Haversine):'}</span>
                                        <span>{(estimatedDistance / 1.35).toFixed(2)} {isArabic ? 'كم' : 'km'}</span>
                                    </div>
                                    <div className={styles.style213_56}>
                                        <span>{isArabic ? 'معامل التعرج المحلي (γ):' : 'Local tortuosity factor (γ):'}</span>
                                        <span className={styles.style215_57}>× 1.35</span>
                                    </div>
                                    <div className={styles.style217_58}>
                                        <span className={styles.style218_59}>{isArabic ? 'المسافة المعتمدة:' : 'Approved distance:'}</span>
                                        <span className={styles.style219_60}>{estimatedDistance.toFixed(2)} {isArabic ? 'كم' : 'km'}</span>
                                    </div>
                                    <div className={styles.style221_61}>
                                        <span>{isArabic ? 'حساب الزمن (المسافة / السرعة 40 كم/س):' : 'Time calculation (Distance / Speed 40 km/h):'}</span>
                                        <span className={styles.style223_62}>~{estimatedTime} {isArabic ? 'دقيقة' : 'min'}</span>
                                    </div>
                                </div>
                            </div>
                        )}

                        {isBlindSpot && (
                            <div className={styles.style230_63}>
                                <p className={styles.style231_64}>
                                    {isArabic
                                        ? '⚠️ تعذر استخراج الإحداثيات؛ تم تفعيل "بروتوكول النقطة العمياء" لتأمين استمرارية الرادار على مستوى المنطقة.'
                                        : '⚠️ Unable to extract coordinates; "Blind Spot Protocol" activated to ensure region-level radar continuity.'}
                                </p>
                            </div>
                        )}
                    </div>
                )}
             </div>
          </div>

          {/* المقاعد ونوع الحساب */}
          <div className={styles.style242_65}>
            <div className={styles.style243_66}>
                <span className={styles.style244_67}>{isArabic ? '7. عدد المقاعد المطلوبة' : '7. Required Seats'}</span>
                <Select value={seats} onValueChange={setSeats}>
                    <SelectTrigger className={styles.style246_68}>
                        <SelectValue placeholder={isArabic ? 'حدد المقاعد' : 'Select seats'} />
                    </SelectTrigger>
                    <SelectContent className={styles.style249_69}>
                        {[1, 2, 3, 4].map(n => (
                            <SelectItem key={n} value={n.toString()}>
                                {n} {isArabic ? (n === 1 ? 'راكب واحد' : 'ركاب') : (n === 1 ? 'Passenger' : 'Passengers')}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            <div className={styles.style255_70}>
                <span className={styles.style256_71}>{isArabic ? '8. طريقة التسعير' : '8. Pricing Mode'}</span>
                <div className={styles.style257_72}>
                    <Select value={pricingPreference || 'none'} onValueChange={(val) => setPricingPreference(val === 'none' ? null : val as any)}>
                        <SelectTrigger className="w-full">
                            <SelectValue placeholder={isArabic ? 'بدون تحديد' : 'No Preference'} />
                        </SelectTrigger>
                        <SelectContent className="border-white/10 bg-[#0F172A] text-white">
                            <SelectItem value="none">{isArabic ? 'بدون تحديد' : 'No Preference'}</SelectItem>
                            <SelectItem value="FREE">{isArabic ? 'سعر حر' : 'Free Price'}</SelectItem>
                            <SelectItem value="APP">{isArabic ? 'حسب تسعيرة التطبيق' : 'App Pricing'}</SelectItem>
                            <SelectItem value="TAXI">{isArabic ? 'حسب عداد التاكسي' : 'Taxi Meter'}</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>
          </div>

          {/* حالة الطلب */}
          <div className={styles.style265_75}>
            <span className={styles.style266_76}>{isArabic ? 'حالة توفر السائقون' : 'Driver Availability Status'}</span>
            <div className={styles.style267_77}>
              <span className={cn(
                styles.style269_78,
                parseInt(seats) <= 2 ? styles.style270_79 : styles.style270_80
              )}>
                {parseInt(seats) <= 2
                  ? (isArabic ? '🔴 زخم العرض: صاعد ومتوفر' : '🔴 Supply Momentum: High & Available')
                  : (isArabic ? '⚠️ زخم الطاقة: كثيف ويتطلب سيارة صالون واسعة' : '⚠️ High Demand: Requires Large Sedan')}
              </span>
              <span className={styles.style274_81}>
                γ = 1.35
              </span>
            </div>
          </div>

          {/* تنويه الإدارة والعمى التقني الموحد للتصميم الصارم */}
          <div className={styles.style281_82}>
             <div className={styles.style282_83}>
                <AlertCircle className={styles.style283_84} />
                <span>{isArabic ? 'النزاهة الميدانية لـ "الرادار الذكي"' : 'Smart Radar Field Integrity'}</span>
             </div>
             <p className={styles.style286_85}>
                {isArabic
                    ? 'بموجب ميثاق صفر تشتت وصفر سحابة (SC55)، يمتنع الرادار عن عرض الخرائط للراكب نهائياً (العمى التقني) أو تجاوز فقاعة 1.5 كم. يتم السيطرة وحساب الأبعاد تجميداً بصفر عمولة.'
                    : 'Under the Zero Distraction and Zero Cloud Charter (SC55), Radar refrains from displaying maps to riders (technical blindness) or exceeding 1.5 km radius. Dimensions are computed frozen at zero commission.'}
             </p>
          </div>

        </div>

        <DialogFooter className={styles.style293_86}>
          {isRadarActive === false ? (
            <div className={styles.style295_87}>
              <span className={styles.style296_88}>
                {isArabic ? 'الخدمة معلقة مؤقتاً بناءً على القرارات الرسمية' : 'Service is temporarily suspended by official directive'}
              </span>
            </div>
          ) : (
            <Button
              onClick={requestRide}
              disabled={isRequesting || !isLocationConfirmed || !dropoff}
              className={cn(
                styles.style305_89,
                isLocationConfirmed && dropoff
                  ? styles.style307_90
                  : styles.style308_91
              )}
            >
              {isRequesting ? (
                <div className={styles.style312_92}>
                  <Loader2 className={styles.style313_93} />
                  <span>{isArabic ? 'يرسل الطلب...' : 'Sending request...'}</span>
                </div>
              ) : (
                isArabic ? 'إرسال طلب الرحلة' : 'Send Ride Request'
              )}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
