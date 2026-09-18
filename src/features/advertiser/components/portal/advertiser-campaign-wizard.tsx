'use client';

import React from 'react';
import {
  Sparkles,
  Image as ImageIcon,
  Phone,
  MessageSquare,
  MapPin,
  ShieldCheck,
  CheckCircle,
  Loader2,
  AlertTriangle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { jordanGovernorates, getDistrictsByGovernorate } from '@/lib/data';

interface AdvertiserCampaignWizardProps {
  step: number;
  setStep: (s: number) => void;
  title: string;
  setTitle: (t: string) => void;
  description: string;
  setDescription: (d: string) => void;
  governorate: string;
  setGovernorate: (g: string) => void;
  district: string;
  setDistrict: (d: string) => void;
  districts: string[];
  posterUrl: string;
  setPosterUrl: (u: string) => void;
  whatsapp: string;
  setWhatsapp: (w: string) => void;
  phone: string;
  setPhone: (p: string) => void;
  geoLoc: string;
  setGeoLoc: (l: string) => void;
  buttonText: string;
  setButtonText: (b: string) => void;
  targetImpressions: number;
  setTargetImpressions: (i: number) => void;
  currentPackage: any;
  calculatedCost: number;
  advertiserBalance: number;
  isSimulatingAudit: boolean;
  auditProgress: number;
  auditLogs: string[];
  auditApproved: boolean;
  onLaunchAudit: () => void;
  onReset: () => void;
}

export function AdvertiserCampaignWizard({
  step,
  setStep,
  title,
  setTitle,
  description,
  setDescription,
  governorate,
  setGovernorate,
  district,
  setDistrict,
  districts,
  posterUrl,
  setPosterUrl,
  whatsapp,
  setWhatsapp,
  phone,
  setPhone,
  geoLoc,
  setGeoLoc,
  buttonText,
  setButtonText,
  targetImpressions,
  setTargetImpressions,
  currentPackage,
  calculatedCost,
  advertiserBalance,
  isSimulatingAudit,
  auditProgress,
  auditLogs,
  auditApproved,
  onLaunchAudit,
  onReset,
}: AdvertiserCampaignWizardProps) {
  return (
    <div className="rounded-2xl border border-emerald-500/20 bg-[#070b14] p-5 space-y-5">
      {/* Wizard Progress Steps Indicator */}
      <div className="flex items-center justify-between border-b border-white/10 pb-4">
        {[
          { num: 1, label: 'البيانات والاستهداف' },
          { num: 2, label: 'الوسائط والاستحواذ' },
          { num: 3, label: 'الفحص السيادي والإطلاق' },
        ].map((s) => (
          <div
            key={s.num}
            className={`flex items-center gap-2 ${
              step === s.num
                ? 'text-emerald-400 font-black'
                : step > s.num
                ? 'text-white/80 font-bold'
                : 'text-slate-500 font-semibold'
            }`}
          >
            <span
              className={`h-7 w-7 rounded-full flex items-center justify-center text-xs font-black ${
                step === s.num
                  ? 'bg-emerald-500 text-black shadow-lg shadow-emerald-500/30'
                  : step > s.num
                  ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/40'
                  : 'bg-white/5 border border-white/10'
              }`}
            >
              {step > s.num ? '✓' : s.num}
            </span>
            <span className="text-xs hidden sm:inline">{s.label}</span>
          </div>
        ))}
      </div>

      {/* Step 1: Basic Info & Targeting */}
      {step === 1 && (
        <div className="space-y-4 animate-in fade-in duration-200">
          <div className="space-y-1.5">
            <Label className="text-xs font-bold text-slate-300">عنوان الحملة الإعلانية</Label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="مثال: خصم 20% على طلبات الصيانة الميدانية..."
              className="h-11 rounded-xl border-white/10 bg-black/40 text-sm font-bold text-white placeholder-slate-500"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-bold text-slate-300">وصف الإعلان الجذاب</Label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              placeholder="اكتب رسالتك التسويقية الموجهة للركاب والكباتن..."
              className="w-full rounded-xl border border-white/10 bg-black/40 p-3 text-sm font-bold text-white placeholder-slate-500 outline-none focus:border-emerald-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-slate-300">المحافظة المستهدفة</Label>
              <select
                value={governorate}
                onChange={(e) => {
                  setGovernorate(e.target.value);
                  const dists = getDistrictsByGovernorate(e.target.value);
                  if (dists.length > 0) setDistrict(dists[0]);
                }}
                className="h-11 w-full rounded-xl border border-white/10 bg-black/40 px-3 text-xs font-bold text-white outline-none focus:border-emerald-500"
              >
                {jordanGovernorates.map((gov) => (
                  <option key={gov} value={gov}>
                    {gov}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-slate-300">اللواء / المنطقة</Label>
              <select
                value={district}
                onChange={(e) => setDistrict(e.target.value)}
                className="h-11 w-full rounded-xl border border-white/10 bg-black/40 px-3 text-xs font-bold text-white outline-none focus:border-emerald-500"
              >
                {districts.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="pt-2 flex justify-end">
            <Button
              type="button"
              onClick={() => {
                if (!title) {
                  alert('يرجى كتابة عنوان الحملة أولاً');
                  return;
                }
                setStep(2);
              }}
              className="h-11 px-6 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-black text-xs"
            >
              متابعة إلى روابط الاستحواذ ⬅
            </Button>
          </div>
        </div>
      )}

      {/* Step 2: Creative & Direct Links */}
      {step === 2 && (
        <div className="space-y-4 animate-in fade-in duration-200">
          <div className="space-y-1.5">
            <Label className="text-xs font-bold text-slate-300">رابط صورة البوستر أو الفيديو</Label>
            <Input
              value={posterUrl}
              onChange={(e) => setPosterUrl(e.target.value)}
              placeholder="https://... رابط صورة البوستر بجودة عالية"
              className="h-11 rounded-xl border-white/10 bg-black/40 text-sm font-bold text-white placeholder-slate-500 font-mono text-left"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-slate-300">رقم الواتساب للاستحواذ المباشر</Label>
              <Input
                value={whatsapp}
                onChange={(e) => setWhatsapp(e.target.value)}
                placeholder="962798888888"
                className="h-11 rounded-xl border-white/10 bg-black/40 text-sm font-bold text-white placeholder-slate-500 font-mono text-left"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-slate-300">رقم الاتصال الهاتفي السريع</Label>
              <Input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="0798888888"
                className="h-11 rounded-xl border-white/10 bg-black/40 text-sm font-bold text-white placeholder-slate-500 font-mono text-left"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-slate-300">رابط خرائط جوجل أو صفحة الهبوط</Label>
              <Input
                value={geoLoc}
                onChange={(e) => setGeoLoc(e.target.value)}
                placeholder="https://maps.google.com/..."
                className="h-11 rounded-xl border-white/10 bg-black/40 text-sm font-bold text-white placeholder-slate-500 font-mono text-left"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-slate-300">نص زر التفاعل (Call to Action)</Label>
              <Input
                value={buttonText}
                onChange={(e) => setButtonText(e.target.value)}
                placeholder="تواصل واحجز الآن 🚀"
                className="h-11 rounded-xl border-white/10 bg-black/40 text-sm font-bold text-white placeholder-slate-500"
              />
            </div>
          </div>

          <div className="space-y-1.5 pt-2">
            <Label className="text-xs font-bold text-slate-300">عدد المشاهدات المستهدفة</Label>
            <div className="flex items-center gap-3">
              <input
                type="range"
                min="1000"
                max="50000"
                step="1000"
                value={targetImpressions}
                onChange={(e) => setTargetImpressions(Number(e.target.value))}
                className="flex-1 accent-emerald-500"
              />
              <span className="w-24 text-center font-mono font-black text-emerald-400 bg-black/50 p-2 rounded-xl border border-white/10 text-xs">
                {targetImpressions.toLocaleString()} ظهور
              </span>
            </div>
          </div>

          {/* Cost Summary Preview */}
          <div className="rounded-xl border border-emerald-500/20 bg-emerald-950/30 p-3.5 flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-400 font-bold">التكلفة الإجمالية للحملة:</p>
              <p className="text-xl font-black text-emerald-300 font-mono">
                {calculatedCost.toFixed(2)} د.أ
              </p>
            </div>
            <div className="text-left text-[11px] font-bold text-slate-400 font-mono">
              رصيدك الحالي: {advertiserBalance.toFixed(2)} د.أ
            </div>
          </div>

          <div className="pt-2 flex items-center justify-between">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setStep(1)}
              className="h-11 rounded-xl text-slate-400 hover:text-white"
            >
              ➡ العودة للخطوة السابقة
            </Button>
            <Button
              type="button"
              onClick={onLaunchAudit}
              className="h-11 px-6 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-black text-xs shadow-lg shadow-emerald-500/20"
            >
              بدء الفحص الجنائي والإطلاق السيادي 🛡️
            </Button>
          </div>
        </div>
      )}

      {/* Step 3: Forensic AI Audit Simulation & Status */}
      {step === 3 && (
        <div className="space-y-4 animate-in fade-in duration-200">
          <div className="rounded-2xl border border-white/10 bg-black/60 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-emerald-400" />
                <h4 className="text-xs font-black text-white">
                  محرك التحقق الجنائي السيادي [SCR-AD-INTEGRITY-112]
                </h4>
              </div>
              <span className="text-xs font-mono font-black text-emerald-400">
                {auditProgress}%
              </span>
            </div>

            {/* Progress Bar */}
            <div className="h-2 w-full rounded-full bg-white/10 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-300"
                style={{ width: `${auditProgress}%` }}
              />
            </div>

            {/* Audit Logs */}
            <div className="rounded-xl border border-white/5 bg-black/80 p-3 space-y-1.5 font-mono text-[11px]">
              {auditLogs.map((log, index) => (
                <p key={index} className="text-emerald-300/90 leading-relaxed">
                  {log}
                </p>
              ))}
              {isSimulatingAudit && (
                <div className="flex items-center gap-2 text-slate-400 pt-1">
                  <Loader2 className="h-3.5 w-3.5 animate-spin text-emerald-400" />
                  <span>جاري إكمال بروتوكولات التدقيق ومطابقة السجل...</span>
                </div>
              )}
            </div>

            {auditApproved && (
              <div className="rounded-xl border border-emerald-500/40 bg-emerald-950/40 p-4 text-center space-y-2">
                <CheckCircle className="h-8 w-8 text-emerald-400 mx-auto" />
                <h3 className="text-sm font-black text-white">
                  تم إطلاق الحملة وتوزيعها جغرافياً بنجاح!
                </h3>
                <p className="text-xs text-slate-300 leading-relaxed">
                  الحملة أصبحت نشطة وتظهر للركاب والكباتن في نطاق {district}، وتم خصم التكلفة مسبقاً من رصيدك السيادي.
                </p>
                <div className="pt-2">
                  <Button
                    type="button"
                    onClick={onReset}
                    className="h-10 px-5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-black text-xs"
                  >
                    العودة للوحة الإعلانات الرئيسية
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
