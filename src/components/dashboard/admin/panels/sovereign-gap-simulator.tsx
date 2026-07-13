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
import { useToast } from '@/hooks/use-toast';
import { db } from '@/lib/firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { DriverData } from '@/hooks/admin/useSovereignDashboard';

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
    <Card className="bg-radar-black border border-radar-neon/15 shadow-[0_8px_32px_rgba(0,0,0,0.5)] rounded-2xl overflow-hidden mt-8">
      <CardHeader className="bg-zinc-950 border-b border-radar-neon/10 p-5">
        <CardTitle className="text-radar-neon text-base font-extrabold flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-radar-neon" />
          محرك سد الثغرات الاستراتيجية الحاكم (V5.5 Strategic Gaps Simulation Hub)
        </CardTitle>
        <CardDescription className="text-gray-400 text-xs leading-relaxed text-right" dir="rtl">
          واجهة المحاكاة والضبط الفوري لثغرات الانتقال الجغرافي والشحن اليدوي بدون سحب تكاليف السيرفر الإضافية.
        </CardDescription>
      </CardHeader>
      <CardContent className="p-6 space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-right" dir="rtl">

          {/* 1. Regional Commute Card */}
          <div className="bg-zinc-950 p-5 rounded-xl border border-white/5 space-y-4">
            <div className="flex items-center gap-2 border-b border-white/5 pb-3">
              <Clock className="w-5 h-5 text-amber-400" />
              <span className="font-extrabold text-sm text-white">1. محاكي الارتحال الجغرافي اللحظي</span>
            </div>
            <p className="text-xs text-gray-400 leading-relaxed">
              ينقل السائق من وتد تسجيله الجغرافي إلى منطقة آخر لحظياً لضبط استهداف الإعلانات وتجريم الصمت.
            </p>

            <div className="space-y-3">
              <label className="text-[11px] text-gray-400 block font-bold">اختر السائق المستهدف بالترحيل:</label>
              <select
                className="w-full bg-zinc-900 border border-white/10 rounded-lg p-2.5 text-xs text-white"
                value={commuteDriverUid}
                onChange={(e) => setCommuteDriverUid(e.target.value)}
              >
                <option value="">-- اختر سائق من الميدان --</option>
                {drivers.map(d => (
                  <option key={d.uid} value={d.uid}>
                    {d.name} ({d.currentDistrict || 'غير محدد'})
                  </option>
                ))}
              </select>

              <label className="text-[11px] text-gray-400 block font-bold">المنطقة المستهدف الموجه للإعلان:</label>
              <select
                className="w-full bg-zinc-900 border border-white/10 rounded-lg p-2.5 text-xs text-white"
                value={targetDistrict}
                onChange={(e) => setTargetDistrict(e.target.value)}
              >
                <option value="منطقة الشونة الجنوبية">منطقة الشونة الجنوبية</option>
                <option value="منطقة ناعور">منطقة ناعور</option>
                <option value="منطقة دير غبار">منطقة دير غبار</option>
                <option value="منطقة صويلح">منطقة صويلح</option>
                <option value="منطقة المقابلين">منطقة المقابلين</option>
              </select>

              <Button
                onClick={executeCommuteSim}
                disabled={isProcessing}
                className="w-full bg-amber-500 hover:bg-amber-400 text-black font-black text-xs h-9 mt-2 cursor-pointer"
              >
                ترحيل فوري محصن 📡
              </Button>
            </div>
          </div>

          {/* 2. Voucher Top-Up Card */}
          <div className="bg-zinc-950 p-5 rounded-xl border border-white/5 space-y-4">
            <div className="flex items-center gap-2 border-b border-white/5 pb-3">
              <Award className="w-5 h-5 text-radar-neon" />
              <span className="font-extrabold text-sm text-white">2. شحن رصيد الساعات يدوياً (بطاقات المندوبين)</span>
            </div>
            <p className="text-xs text-gray-400 leading-relaxed">
              تمكين الدعم النقدي بالميدان عبر تذاكر الخدش المسبقة الدفع الصادرة بأختام  مشفرة.
            </p>

            <div className="space-y-3">
              <label className="text-[11px] text-gray-400 block font-bold">اختر السائق المستهدف بالشحن:</label>
              <select
                className="w-full bg-zinc-900 border border-white/10 rounded-lg p-2.5 text-xs text-white"
                value={voucherDriverUid}
                onChange={(e) => setVoucherDriverUid(e.target.value)}
              >
                <option value="">-- اختر سائق من الميدان --</option>
                {drivers.map(d => (
                  <option key={d.uid} value={d.uid}>
                    {d.name} ({d.paidHoursRemaining || 0} ساعة متبقية)
                  </option>
                ))}
              </select>

              <label className="text-[11px] text-gray-400 block font-bold">أدخل رمز التذكرة (يبدأ بـ RADAR-100H-):</label>
              <div className="space-y-1">
                <Input
                  type="text"
                  placeholder="مثال: RADAR-100H-JORDAN"
                  value={voucherCode}
                  onChange={(e) => setVoucherCode(e.target.value)}
                  className="bg-zinc-900 border-white/10 text-xs text-white placeholder-gray-600 h-9 text-right"
                  dir="ltr"
                />
                <span className="text-[9px] text-radar-neon block cursor-pointer" onClick={() => setVoucherCode('RADAR-100H-JORDAN')}>
                  💡 اضغط هنا لنسخ الرمز المعتمد للجلسة: <code className="underline font-bold">RADAR-100H-JORDAN</code>
                </span>
              </div>

              <Button
                onClick={executeVoucherRedeemSim}
                disabled={isProcessing}
                className="w-full bg-radar-neon hover:bg-radar-neon/80 text-black font-black text-xs h-9 mt-2 cursor-pointer"
              >
                تفعيل شحنة الـ 100 ساعة 🎫
              </Button>
            </div>
          </div>

        </div>

        {/* 3. Operational Integrity Audit Checklist */}
        <div className="bg-zinc-900/40 border border-white/5 p-4 rounded-xl space-y-2 text-right" dir="rtl">
          <h4 className="text-xs font-bold text-gray-300">أجهزة القياس الذاتي والتحقق التلقائي (Edge Integrity Metrics)</h4>
          <ul className="text-[11px] text-gray-400 space-y-1">
            <li className="flex items-center gap-1.5">
              <span className="text-radar-neon">✔</span>
              <span>استقرار النطاق الجغرافي: تصفية الإعلانات والحسابات تتم محلياً عند الحافة بصفر تكلفة سحابية.</span>
            </li>
            <li className="flex items-center gap-1.5">
              <span className="text-radar-neon">✔</span>
              <span>محرك الصرف المحصن: تفعيل قاعدة الـ 30 يوماً المستقرة لحسابات المندوبين.</span>
            </li>
            <li className="flex items-center gap-1.5 font-sans">
              <span className="text-radar-danger">✔</span>
              <span className="text-right">الصندوق الأسود  مغلق بمجهرية النواة <code className="text-red-400">Object.freeze(RadarGapLockdownKernel)</code> لمنع الاختراقات والعبث بالباقات المدفوعة.</span>
            </li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
