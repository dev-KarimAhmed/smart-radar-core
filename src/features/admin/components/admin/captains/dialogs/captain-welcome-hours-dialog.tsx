import React from 'react';
import { Gift, Clock, Calendar, Sparkles, Loader2, Zap, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

export interface WelcomeHoursConfigState {
  enabled: boolean;
  hours: number;
  minutes: number;
  validityDays: number;
}

interface CaptainWelcomeHoursDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  direction: 'rtl' | 'ltr';
  isArabic: boolean;
  t: (key: string, params?: Record<string, any>) => string;
  welcomeConfig: WelcomeHoursConfigState;
  setWelcomeConfig: React.Dispatch<React.SetStateAction<WelcomeHoursConfigState>>;
  handleApplyToExisting: () => Promise<void>;
  handleSaveWelcomeSettings: () => Promise<void>;
  applyingToExisting: boolean;
  savingWelcomeConfig: boolean;
}

export const CaptainWelcomeHoursDialog: React.FC<CaptainWelcomeHoursDialogProps> = ({
  open,
  onOpenChange,
  direction,
  isArabic,
  t,
  welcomeConfig,
  setWelcomeConfig,
  handleApplyToExisting,
  handleSaveWelcomeSettings,
  applyingToExisting,
  savingWelcomeConfig,
}) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={cn(
          "max-w-xl bg-[#0B0F19] border border-emerald-500/30 text-white rounded-3xl p-6 shadow-2xl shadow-emerald-950/40 max-h-[90vh] overflow-y-auto",
          isArabic ? "text-right" : "text-left"
        )}
        dir={direction}
      >
        <div className="space-y-5">
          <DialogHeader>
            <DialogTitle className="text-lg font-black text-white flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
                <Gift className="w-5 h-5" />
              </div>
              <div>
                <div>{t('welcomeHoursTitle')}</div>
                <div className="text-xs font-normal text-slate-400 mt-0.5">
                  {t('welcomeHoursSubtitle')}
                </div>
              </div>
            </DialogTitle>
          </DialogHeader>

          {/* 1. Master Enable/Disable Toggle */}
          <div className="p-4 rounded-2xl bg-black/40 border border-white/10 flex items-center justify-between gap-4">
            <div className="space-y-0.5">
              <div className="text-sm font-bold text-white flex items-center gap-2">
                <span>{t('welcomeHoursEnableLabel')}</span>
                <Badge
                  className={cn(
                    "text-[10px] font-bold",
                    welcomeConfig.enabled
                      ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40"
                      : "bg-slate-700 text-slate-400"
                  )}
                >
                  {welcomeConfig.enabled ? (isArabic ? "مفعل تلقائياً" : "Enabled") : (isArabic ? "معطل" : "Disabled")}
                </Badge>
              </div>
              <p className="text-xs text-slate-400">
                {t('welcomeHoursEnableDesc')}
              </p>
            </div>
            <Switch
              checked={welcomeConfig.enabled}
              onCheckedChange={(val) => setWelcomeConfig(prev => ({ ...prev, enabled: val }))}
              className="data-[state=checked]:bg-emerald-500"
            />
          </div>

          {/* 2. Number of Hours Configuration */}
          <div className="p-4 rounded-2xl bg-black/40 border border-white/10 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-emerald-400" />
                <span>{t('welcomeHoursAmountLabel')}</span>
              </label>
              <Badge className="bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 text-xs font-mono font-bold">
                {t('welcomeHoursMinutesEquiv', { minutes: (welcomeConfig.hours * 60).toLocaleString() })}
              </Badge>
            </div>

            <div className="flex items-center gap-3">
              <Input
                type="number"
                min={0}
                max={500}
                value={welcomeConfig.hours}
                onChange={(e) => {
                  const val = Math.max(0, Number(e.target.value) || 0);
                  setWelcomeConfig(prev => ({ ...prev, hours: val, minutes: val * 60 }));
                }}
                className="bg-black/60 border-white/20 text-white font-mono text-lg font-bold text-center h-11 w-32 rounded-xl focus:border-emerald-500"
              />
              <span className="text-xs font-bold text-slate-400">{t('welcomeHoursHoursUnit')}</span>
            </div>

            {/* Quick Presets */}
            <div className="flex items-center gap-2 pt-1 flex-wrap">
              <span className="text-[11px] font-bold text-slate-400">{t('welcomeHoursQuickPresets')}</span>
              {[10, 20, 30, 40, 50].map((h) => (
                <button
                  key={h}
                  type="button"
                  onClick={() => setWelcomeConfig(prev => ({ ...prev, hours: h, minutes: h * 60 }))}
                  className={cn(
                    "px-2.5 py-1 rounded-lg text-xs font-bold border transition-all cursor-pointer",
                    welcomeConfig.hours === h
                      ? "bg-emerald-500/20 border-emerald-500 text-emerald-300 shadow-sm shadow-emerald-500/20"
                      : "bg-white/5 border-white/10 text-slate-400 hover:text-white hover:bg-white/10"
                  )}
                >
                  {h === 20 ? `${h} ${isArabic ? 'س (الافتراضي)' : 'h (Default)'}` : `${h} ${isArabic ? 'س' : 'h'}`}
                </button>
              ))}
            </div>
          </div>

          {/* 3. Validity Days Configuration */}
          <div className="p-4 rounded-2xl bg-black/40 border border-white/10 space-y-3">
            <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-emerald-400" />
              <span>{t('welcomeHoursValidityLabel')}</span>
            </label>

            <div className="flex items-center gap-3">
              <Input
                type="number"
                min={1}
                max={365}
                value={welcomeConfig.validityDays}
                onChange={(e) => {
                  const val = Math.max(1, Number(e.target.value) || 30);
                  setWelcomeConfig(prev => ({ ...prev, validityDays: val }));
                }}
                className="bg-black/60 border-white/20 text-white font-mono text-lg font-bold text-center h-11 w-32 rounded-xl focus:border-emerald-500"
              />
              <span className="text-xs font-bold text-slate-400">{t('welcomeHoursDaysUnit')}</span>
            </div>

            {/* Quick Validity Presets */}
            <div className="flex items-center gap-2 pt-1 flex-wrap">
              <span className="text-[11px] font-bold text-slate-400">{t('welcomeHoursDaysPresets')}</span>
              {[14, 30, 60, 90].map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => setWelcomeConfig(prev => ({ ...prev, validityDays: d }))}
                  className={cn(
                    "px-2.5 py-1 rounded-lg text-xs font-bold border transition-all cursor-pointer",
                    welcomeConfig.validityDays === d
                      ? "bg-emerald-500/20 border-emerald-500 text-emerald-300 shadow-sm shadow-emerald-500/20"
                      : "bg-white/5 border-white/10 text-slate-400 hover:text-white hover:bg-white/10"
                  )}
                >
                  {d} {isArabic ? 'يوم' : 'Days'}
                </button>
              ))}
            </div>
          </div>

          {/* 4. Live Dual-Language Preview Accordion / Cards */}
          <div className="p-4 rounded-2xl bg-gradient-to-br from-black/80 to-[#0F172A] border border-amber-500/20 space-y-3">
            <div className="flex items-center justify-between">
              <div className="text-xs font-black text-amber-300 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-amber-400" />
                <span>{t('welcomeHoursPreviewTitle')}</span>
              </div>
              <Badge className="bg-amber-500/20 text-amber-300 border-amber-500/40 text-[10px]">
                {isArabic ? 'ثنائي اللغة آلياً' : 'Auto Dual-Language'}
              </Badge>
            </div>

            {/* Arabic preview */}
            <div className="p-3 rounded-xl bg-black/50 border border-white/5 space-y-1 text-right" dir="rtl">
              <div className="flex items-center justify-between text-[11px] font-bold text-emerald-400">
                <span>🎁 هدية ترحيبية: {welcomeConfig.hours} ساعة رادار مجاناً ⚡</span>
                <Badge className="bg-emerald-950 text-emerald-400 border-none text-[9px]">عربي</Badge>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                أهلاً بك يا كابتن! تم إيداع رصيد ترحيبي قدره ({welcomeConfig.hours}) ساعة طيران رادار في محفظتك بنجاح وتمديد الصلاحية لـ {welcomeConfig.validityDays} يوماً لتنطلق في استقبال الرحلات فوراً.
              </p>
            </div>

            {/* English preview */}
            <div className="p-3 rounded-xl bg-black/50 border border-white/5 space-y-1 text-left" dir="ltr">
              <div className="flex items-center justify-between text-[11px] font-bold text-teal-400">
                <span>🎁 Welcome Gift: {welcomeConfig.hours} Free Radar Hours ⚡</span>
                <Badge className="bg-teal-950 text-teal-400 border-none text-[9px]">English</Badge>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                Welcome Captain! A welcome credit of ({welcomeConfig.hours}) radar flight hours has been deposited into your wallet, valid for {welcomeConfig.validityDays} days, to start accepting rides immediately.
              </p>
            </div>
          </div>

          {/* 5. Footer Actions */}
          <DialogFooter className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-3 border-t border-white/10">
            <Button
              type="button"
              variant="outline"
              onClick={handleApplyToExisting}
              disabled={applyingToExisting || savingWelcomeConfig}
              className="border-amber-500/40 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 font-bold text-xs h-10 px-4 rounded-xl flex items-center gap-1.5 cursor-pointer"
            >
              {applyingToExisting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-amber-300" />
                  <span>{t('welcomeHoursApplyingExisting')}</span>
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4 text-amber-400" />
                  <span>{t('welcomeHoursApplyExistingBtn')}</span>
                </>
              )}
            </Button>

            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="ghost"
                onClick={() => onOpenChange(false)}
                className="text-slate-400 hover:text-white text-xs h-10 px-4 rounded-xl"
              >
                {t('close')}
              </Button>

              <Button
                type="button"
                onClick={handleSaveWelcomeSettings}
                disabled={savingWelcomeConfig || applyingToExisting}
                className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-xs h-10 px-6 rounded-xl shadow-lg shadow-emerald-600/20 flex items-center gap-1.5 active:scale-95 transition-all cursor-pointer"
              >
                {savingWelcomeConfig ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>{t('welcomeHoursSaving')}</span>
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    <span>{t('welcomeHoursSaveBtn')}</span>
                  </>
                )}
              </Button>
            </div>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
};
