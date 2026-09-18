'use client';

import React from 'react';
import { Sparkles, Award, Zap, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SOVEREIGN_PRICING_PACKAGES, SovereignPricingPackage } from '@/lib/constants';

interface AdvertiserPackagesCardProps {
  selectedPackageId: string;
  onSelectPackage: (id: string) => void;
  aiBudget: string;
  setAiBudget: (b: string) => void;
  aiGoal: 'awareness' | 'retention' | 'broad';
  setAiGoal: (g: 'awareness' | 'retention' | 'broad') => void;
  aiRecommendation: string | null;
  onSuggestPackage: (budget: string, goal: 'awareness' | 'retention' | 'broad') => void;
}

export function AdvertiserPackagesCard({
  selectedPackageId,
  onSelectPackage,
  aiBudget,
  setAiBudget,
  aiGoal,
  setAiGoal,
  aiRecommendation,
  onSuggestPackage,
}: AdvertiserPackagesCardProps) {
  return (
    <div className="rounded-2xl border border-white/10 bg-[#070b14] p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Award className="h-5 w-5 text-emerald-400" />
          <h3 className="text-sm font-black text-white">باقات الرعاية والإشهار السيادية</h3>
        </div>
        <span className="text-[10px] font-mono font-bold text-slate-400">
          RAD-CMD-060
        </span>
      </div>

      {/* Package Selection Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {SOVEREIGN_PRICING_PACKAGES.map((pkg) => {
          const isSelected = selectedPackageId === pkg.id;
          return (
            <button
              key={pkg.id}
              type="button"
              onClick={() => onSelectPackage(pkg.id)}
              className={`flex flex-col justify-between p-3.5 rounded-xl border text-right transition-all ${
                isSelected
                  ? 'border-emerald-500 bg-emerald-950/40 ring-2 ring-emerald-500/50 shadow-lg shadow-emerald-500/10'
                  : 'border-white/10 bg-black/40 hover:border-white/20 hover:bg-white/5'
              }`}
            >
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-white">{pkg.name}</span>
                  {pkg.isRetention && (
                    <span className="text-[8px] font-bold text-emerald-300 bg-emerald-900/60 px-1.5 py-0.5 rounded">
                      تخليد
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-slate-400 leading-snug">{pkg.description}</p>
              </div>

              <div className="mt-3 pt-2 border-t border-white/5 flex items-baseline justify-between">
                <span className="text-[10px] text-slate-400 font-bold">سعر الظهور</span>
                <span className="text-sm font-black text-emerald-400 font-mono">
                  {pkg.pricePerImpression.toFixed(2)}{' '}
                  <span className="text-[10px] font-normal text-slate-300">د.أ</span>
                </span>
              </div>
            </button>
          );
        })}
      </div>

      {/* AI Package Recommender */}
      <div className="rounded-xl border border-emerald-500/20 bg-emerald-950/20 p-3 space-y-2">
        <div className="flex items-center gap-1.5 text-xs font-black text-emerald-300">
          <Sparkles className="h-4 w-4 text-emerald-400" />
          <span>مستشار الذكاء الاصطناعي لاختيار الباقة الأنسب لميزانيتك</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          <input
            type="number"
            value={aiBudget}
            onChange={(e) => setAiBudget(e.target.value)}
            placeholder="ميزانيتك بالدينار..."
            className="h-10 rounded-xl border border-white/10 bg-black/50 px-3 text-xs font-bold text-white placeholder-slate-500 outline-none focus:border-emerald-500"
          />

          <select
            value={aiGoal}
            onChange={(e) => setAiGoal(e.target.value as any)}
            className="h-10 rounded-xl border border-white/10 bg-black/50 px-3 text-xs font-bold text-white outline-none focus:border-emerald-500"
          >
            <option value="retention">تثبيت وتخليد العلامة التجارية</option>
            <option value="awareness">زيادة المشاهدات والوعي السريع</option>
            <option value="broad">اكتساح واسع لكافة المحافظات</option>
          </select>

          <Button
            type="button"
            onClick={() => onSuggestPackage(aiBudget, aiGoal)}
            className="h-10 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-black text-xs"
          >
            تحليل واقتراح الباقة 🚀
          </Button>
        </div>

        {aiRecommendation && (
          <p className="text-xs text-emerald-200/90 font-bold leading-relaxed pt-1">
            {aiRecommendation}
          </p>
        )}
      </div>
    </div>
  );
}
