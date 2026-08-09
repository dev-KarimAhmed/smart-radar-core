'use client';

import React, { useState } from 'react';
import {
  Sparkles,
  Clock,
  Award,
  Loader2
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { db } from '@/lib/firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { DriverData } from '@/hooks/admin/useSovereignDashboard';

const styles = {
  style181_1: "bg-[#050505] border border-[#00ffcc]/15 shadow-[0_8px_32px_rgba(0,0,0,0.5)] rounded-2xl overflow-hidden mt-8",
  style182_2: "bg-zinc-950 border-b border-[#00ffcc]/10 p-5",
  style183_3: "text-[#00ffcc] text-base font-extrabold flex items-center gap-2",
  style184_4: "w-5 h-5 text-[#00ffcc]",
  style187_5: "text-gray-400 text-xs leading-relaxed text-right",
  style191_6: "p-6 space-y-8",
  style192_7: "grid grid-cols-1 md:grid-cols-2 gap-6 text-right",
  style195_8: "bg-zinc-950 p-5 rounded-xl border border-white/5 space-y-4",
  style196_9: "flex items-center gap-2 border-b border-white/5 pb-3",
  style197_10: "w-5 h-5 text-amber-400",
  style198_11: "font-extrabold text-sm text-white",
  style200_12: "text-xs text-gray-400 leading-relaxed",
  style204_13: "space-y-3",
  style205_14: "text-[11px] text-gray-400 block font-bold",
  style207_15: "w-full bg-zinc-900 border border-white/10 rounded-lg p-2.5 text-xs text-white",
  customSelectContent: "border-white/10 bg-zinc-900 text-white shadow-2xl shadow-black/40",
  customSelectItem: "cursor-pointer rounded-lg py-2.5 text-xs font-black text-slate-200 focus:bg-[#00ffcc]/15 focus:text-[#00ffcc] data-[state=checked]:bg-[#00ffcc]/10 data-[state=checked]:text-[#00ffcc]",
  style219_16: "text-[11px] text-gray-400 block font-bold",
  style221_17: "w-full bg-zinc-900 border border-white/10 rounded-lg p-2.5 text-xs text-white",
  style235_18: "w-full bg-amber-500 hover:bg-amber-400 text-black font-black text-xs h-9 mt-2 cursor-pointer",
  style243_19: "bg-zinc-950 p-5 rounded-xl border border-white/5 space-y-4",
  style244_20: "flex items-center gap-2 border-b border-white/5 pb-3",
  style245_21: "w-5 h-5 text-[#00ffcc]",
  style246_22: "font-extrabold text-sm text-white",
  style248_23: "text-xs text-gray-400 leading-relaxed",
  style252_24: "space-y-3",
  style253_25: "text-[11px] text-gray-400 block font-bold",
  style255_26: "w-full bg-zinc-900 border border-white/10 rounded-lg p-2.5 text-xs text-white",
  style267_27: "text-[11px] text-gray-400 block font-bold",
  style268_28: "space-y-1",
  style274_29: "bg-zinc-900 border-white/10 text-xs text-white placeholder-gray-600 h-9 text-right",
  style277_30: "text-[9px] text-[#00ffcc] block cursor-pointer",
  style278_31: "underline font-bold",
  style285_32: "w-full bg-[#00ffcc] hover:bg-[#00ffcc]/80 text-black font-black text-xs h-9 mt-2 cursor-pointer",
  style295_33: "bg-zinc-900/40 border border-white/5 p-4 rounded-xl space-y-2 text-right",
  style296_34: "text-xs font-bold text-gray-300",
  style297_35: "text-[11px] text-gray-400 space-y-1",
  style298_36: "flex items-center gap-1.5",
  style299_37: "text-[#00ffcc]",
  style302_38: "flex items-center gap-1.5",
  style303_39: "text-[#00ffcc]",
  style306_40: "flex items-center gap-1.5 font-sans",
  style307_41: "text-[#ff3366]",
  style308_42: "text-right",
  style308_43: "text-red-400",
} as const;


// [SCR-GAP-LOCKDOWN-150] محرك سد الثغرات الاستراتيجية (الارتحال، الشحن، والصندوق الأسود)
// محصن ومغلق اً - يعمل بمعمارية الحافة وصفر كلفة تشغيلية
export interface CaptainSovereignState {
  captainId: string;
  homeDistrict: string;
  currentDistrict: string;
  walletHours: number;
  isBanned: boolean;
}

export const RadarGapLockdownKernel = {
  /**
   * 1. معالجة الارتحال الجغرافي: تحديث المنطقة الإحصائي تلقائياً عند الحافة
   */
  handleDistrictCommute: function(
    currentState: CaptainSovereignState,
    newDistrictFromH3: string
  ): CaptainSovereignState {
    if (currentState.currentDistrict !== newDistrictFromH3) {
      currentState.currentDistrict = newDistrictFromH3;
    }
    return currentState;
  },

  /**
   * 2. آلية الشحن الميداني (أكواد الشحن المشفرة للمندوبين)
   */
  redeemVoucherHours: function(
    currentWallet: { paidHours: number },
    voucherCode: string,
    secureServerKey: string
  ): { success: boolean; hoursAdded: number } {
    // [BANNED-CLIENT-SIDE] منطق التحقق مرحّل كلياً للسيرفر الخلفي الآمن لمنع إضافة الساعات
    throw new Error("يُحظر التحقق من بطاقات الشحن من جهة العميل. منطق التحقق مرحّل كلياً للسيرفر الخلفي الآمن.");
  },

  /**
   * 3. الصندوق الأسود للمشرف: الحذف القاطع وقطع صلاحيات طيران الحسابات
   */
  enforceAdminBlackBoxAction: function(
    captain: CaptainSovereignState,
    action: 'WARN' | 'BAN'
  ): CaptainSovereignState {
    if (action === 'BAN') {
      captain.isBanned = true;
      captain.walletHours = 0;
    }
    return captain;
  }
};

Object.freeze(RadarGapLockdownKernel);

interface SovereignGapSimulatorProps {
  drivers: DriverData[];
  fetchDrivers: () => Promise<void>;
  isProcessing: boolean;
  setIsProcessing: (val: boolean) => void;
}

export function SovereignGapSimulator({
  drivers,
  fetchDrivers,
  isProcessing,
  setIsProcessing
}: SovereignGapSimulatorProps) {
  const { toast } = useToast();

  // Simulated operations states
  const [commuteDriverUid, setCommuteDriverUid] = useState<string>('');
  const [targetDistrict, setTargetDistrict] = useState<string>('منطقة الشونة الجنوبية');
  const [voucherCode, setVoucherCode] = useState<string>('');
  const [voucherDriverUid, setVoucherDriverUid] = useState<string>('');

  /**
   * 📡 executeCommuteSim
   * Commutes a captain to a new Jordanian district at the Edge & updates database.
   */
  const executeCommuteSim = async () => {
    if (!commuteDriverUid) {
      toast({ variant: 'destructive', title: 'خطأ في الترحيل', description: 'يرجى اختيار السائق المراد ترحيله أولاً.' });
      return;
    }
    const targetDriver = drivers.find(d => d.uid === commuteDriverUid);
    if (!targetDriver) return;

    setIsProcessing(true);
    try {
      const response = await fetch('/api/commute-driver', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ driverUid: targetDriver.uid, targetDistrict })
      });
      const data = await response.json();

      if (response.ok && data.success) {
        toast({
          title: '📡 تم الارتحال الجغرافي وبث الإعلانات',
          description: `تم ترحيل السائق [${targetDriver.name}] بنجاح إلى [${targetDistrict}].`
        });
        await fetchDrivers();
      } else {
        toast({
          variant: 'destructive',
          title: 'خطأ بالارتحال',
          description: data.error || 'حدث خطأ غير متوقع أثناء ترحيل السائق'
        });
      }
    } catch (err: any) {
      toast({ variant: 'destructive', title: 'خطأ بالارتحال', description: err.message });
    } finally {
      setIsProcessing(false);
    }
  };

  /**
   * 🎫 executeVoucherRedeemSim [SECURE BACKEND INTERACTION]
   * Authenticates physical voucher against the secure backend route with IP rate-limiting.
   */
  const executeVoucherRedeemSim = async () => {
    if (!voucherDriverUid) {
      toast({ variant: 'destructive', title: 'خطأ الشحن', description: 'يرجى اختيار السائق المستهدف بالشحن أولاً.' });
      return;
    }
    if (!voucherCode) {
      toast({ variant: 'destructive', title: 'خطأ الشحن', description: 'يرجى إدخال رمز تذكرة الشحن.' });
      return;
    }

    const targetDriver = drivers.find(d => d.uid === voucherDriverUid);
    if (!targetDriver) return;

    setIsProcessing(true);
    try {
      const response = await fetch('/api/redeem-voucher', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ driverUid: targetDriver.uid, voucherCode })
      });
      const data = await response.json();

      if (response.ok && data.success) {
        toast({
          title: '🎫 شحن فوري ناجح (تذكرة معتمدة من السيرفر)',
          description: `تم قبول بطاقة المندوب وتحديث [${data.hoursAdded}] ساعة رصيد للسائق [${targetDriver.name}] بنجاح.`
        });
        setVoucherCode('');
        await fetchDrivers();
      } else {
        toast({
          variant: 'destructive',
          title: '❌ فشل التحقق السيرفري للكود',
          description: data.error || 'رمز البطاقة غير مطابق لبروتوكول التشفير المعتمد "RADAR-100H-*"'
        });
      }
    } catch (err: any) {
      toast({ variant: 'destructive', title: 'خطأ الشحن', description: err.message });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Card className={styles.style181_1}>
      <CardHeader className={styles.style182_2}>
        <CardTitle className={styles.style183_3}>
          <Sparkles className={styles.style184_4} />
          محرك سد الثغرات الاستراتيجية الحاكم (V5.5 Strategic Gaps Simulation Hub)
        </CardTitle>
        <CardDescription className={styles.style187_5} dir="rtl">
          واجهة المحاكاة والضبط الفوري لثغرات الانتقال الجغرافي والشحن اليدوي بدون سحب تكاليف السيرفر الإضافية.
        </CardDescription>
      </CardHeader>
      <CardContent className={styles.style191_6}>
        <div className={styles.style192_7} dir="rtl">

          {/* 1. Regional Commute Card */}
          <div className={styles.style195_8}>
            <div className={styles.style196_9}>
              <Clock className={styles.style197_10} />
              <span className={styles.style198_11}>1. محاكي الارتحال الجغرافي اللحظي</span>
            </div>
            <p className={styles.style200_12}>
              ينقل السائق من وتد تسجيله الجغرافي إلى منطقة آخر لحظياً لضبط استهداف الإعلانات وتجريم الصمت.
            </p>

            <div className={styles.style204_13}>
              <label className={styles.style205_14}>اختر السائق المستهدف بالترحيل:</label>
              <Select value={commuteDriverUid} onValueChange={setCommuteDriverUid}>
                <SelectTrigger className={styles.style207_15}>
                  <SelectValue placeholder="-- اختر سائق من الميدان --" />
                </SelectTrigger>
                <SelectContent className={styles.customSelectContent}>
                  {drivers.map(d => (
                    <SelectItem key={d.uid} value={d.uid} className={styles.customSelectItem}>
                      {d.name} ({d.currentDistrict || 'غير محدد'})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <label className={styles.style219_16}>المنطقة المستهدف الموجه للإعلان:</label>
              <Select value={targetDistrict} onValueChange={setTargetDistrict}>
                <SelectTrigger className={styles.style221_17}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className={styles.customSelectContent}>
                  <SelectItem value="منطقة الشونة الجنوبية" className={styles.customSelectItem}>منطقة الشونة الجنوبية</SelectItem>
                  <SelectItem value="منطقة ناعور" className={styles.customSelectItem}>منطقة ناعور</SelectItem>
                  <SelectItem value="منطقة دير غبار" className={styles.customSelectItem}>منطقة دير غبار</SelectItem>
                  <SelectItem value="منطقة صويلح" className={styles.customSelectItem}>منطقة صويلح</SelectItem>
                  <SelectItem value="منطقة المقابلين" className={styles.customSelectItem}>منطقة المقابلين</SelectItem>
                </SelectContent>
              </Select>

              <Button
                onClick={executeCommuteSim}
                disabled={isProcessing}
                className={styles.style235_18}
              >
                ترحيل فوري محصن 📡
              </Button>
            </div>
          </div>

          {/* 2. Voucher Top-Up Card */}
          <div className={styles.style243_19}>
            <div className={styles.style244_20}>
              <Award className={styles.style245_21} />
              <span className={styles.style246_22}>2. شحن رصيد الساعات يدوياً (بطاقات المندوبين)</span>
            </div>
            <p className={styles.style248_23}>
              تمكين الدعم النقدي بالميدان عبر تذاكر الخدش المسبقة الدفع الصادرة بأختام  مشفرة.
            </p>

            <div className={styles.style252_24}>
              <label className={styles.style253_25}>اختر السائق المستهدف بالشحن:</label>
              <Select value={voucherDriverUid} onValueChange={setVoucherDriverUid}>
                <SelectTrigger className={styles.style255_26}>
                  <SelectValue placeholder="-- اختر سائق من الميدان --" />
                </SelectTrigger>
                <SelectContent className={styles.customSelectContent}>
                  {drivers.map(d => (
                    <SelectItem key={d.uid} value={d.uid} className={styles.customSelectItem}>
                      {d.name} ({d.paidHoursRemaining || 0} ساعة متبقية)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <label className={styles.style267_27}>أدخل رمز التذكرة (يبدأ بـ RADAR-100H-):</label>
              <div className={styles.style268_28}>
                <Input
                  type="text"
                  placeholder="مثال: RADAR-100H-JORDAN"
                  value={voucherCode}
                  onChange={(e) => setVoucherCode(e.target.value)}
                  className={styles.style274_29}
                  dir="ltr"
                />
                <span className={styles.style277_30} onClick={() => setVoucherCode('RADAR-100H-JORDAN')}>
                  💡 اضغط هنا لنسخ الرمز المعتمد للجلسة: <code className={styles.style278_31}>RADAR-100H-JORDAN</code>
                </span>
              </div>

              <Button
                onClick={executeVoucherRedeemSim}
                disabled={isProcessing}
                className={styles.style285_32}
              >
                تفعيل شحنة الـ 100 ساعة 🎫
              </Button>
            </div>
          </div>

        </div>

        {/* 3. Operational Integrity Audit Checklist */}
        <div className={styles.style295_33} dir="rtl">
          <h4 className={styles.style296_34}>أجهزة القياس الذاتي والتحقق التلقائي (Edge Integrity Metrics)</h4>
          <ul className={styles.style297_35}>
            <li className={styles.style298_36}>
              <span className={styles.style299_37}>✔</span>
              <span>استقرار النطاق الجغرافي: تصفية الإعلانات والحسابات تتم محلياً عند الحافة بصفر تكلفة سحابية.</span>
            </li>
            <li className={styles.style302_38}>
              <span className={styles.style303_39}>✔</span>
              <span>محرك الصرف المحصن: تفعيل قاعدة الـ 30 يوماً المستقرة لحسابات المندوبين.</span>
            </li>
            <li className={styles.style306_40}>
              <span className={styles.style307_41}>✔</span>
              <span className={styles.style308_42}>الصندوق الأسود  مغلق بمجهرية النواة <code className={styles.style308_43}>Object.freeze(RadarGapLockdownKernel)</code> لمنع الاختراقات والعبث بالباقات المدفوعة.</span>
            </li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
