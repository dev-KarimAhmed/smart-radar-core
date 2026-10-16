'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase-client';
import { Sliders, DollarSign, Layers, Save, CheckCircle2, Loader2, MapPin, Gauge } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { useTranslations } from 'next-intl';

const styles = {
  container: "space-y-6 text-right text-white",
  card: "rounded-2xl border border-white/10 bg-[#0B0F19]/90 p-5",
  inputField: "bg-black/60 border-white/10 text-white text-xs rounded-xl focus:border-[#14B8A6] font-mono",
  grid2: "grid gap-4 sm:grid-cols-2",
  saveBtn: "w-full bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs py-3 rounded-xl transition",
} as const;

export function CapacityPricingPanel() {
  const t = useTranslations('adminCapacityPricing');
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Pricing Engine State
  const [impressionPrice, setImpressionPrice] = useState('0.05');
  const [videoSurcharge, setVideoSurcharge] = useState('0.08');
  const [radarHourPrice, setRadarHourPrice] = useState('10');
  const [tripMinTariff, setTripMinTariff] = useState('0.25');

  // Capacity Limits
  const [ammanCapacity, setAmmanCapacity] = useState('50');
  const [zarqaCapacity, setZarqaCapacity] = useState('30');
  const [irbidCapacity, setIrbidCapacity] = useState('30');
  const [aqabaCapacity, setAqabaCapacity] = useState('20');

  useEffect(() => {
    async function loadCountryPricing() {
      try {
        setLoading(true);
        const { data } = await supabase
          .from('countries')
          .select('radar_hour_price, tariff_per_km, tariff_per_min')
          .eq('id', 1)
          .maybeSingle();

        if (data) {
          if (data.radar_hour_price) setRadarHourPrice(String(data.radar_hour_price));
          if (data.tariff_per_min) setTripMinTariff(String(data.tariff_per_min));
        }
      } catch (err) {
        console.warn('Failed to load country pricing:', err);
      } finally {
        setLoading(false);
      }
    }

    void loadCountryPricing();
  }, []);

  const handleSaveSettings = async () => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from('countries')
        .update({
          radar_hour_price: Number(radarHourPrice),
          tariff_per_min: Number(tripMinTariff),
          updated_at: new Date().toISOString(),
        })
        .eq('id', 1);

      if (error && (process.env.NODE_ENV !== 'production')) {
        console.warn('Country update note:', error);
      }

      toast({ title: t('savedTitle'), description: t('savedDescription') });
    } catch (err: any) {
      toast({ variant: 'destructive', title: 'خطأ', description: err?.message || 'فشل الحفظ' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className={styles.container} dir="rtl">
      {/* 1. محرك التسعير (Pricing Engine) */}
      <Card className={styles.card}>
        <CardHeader className="p-0 pb-4">
          <CardTitle className="text-lg font-black text-white flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-emerald-400" />
            {t('pricingEngineTitle')}
          </CardTitle>
          <CardDescription className="text-xs text-slate-400">
            {t('pricingEngineSubtitle')}
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0 space-y-4">
          <div className={styles.grid2}>
            <div>
              <label className="text-xs font-bold text-slate-300 block mb-1.5">{t('impressionPriceLabel')} (د.أ)</label>
              <Input
                value={impressionPrice}
                onChange={(e) => setImpressionPrice(e.target.value)}
                inputMode="decimal"
                className={styles.inputField}
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-300 block mb-1.5">{t('videoSurchargeLabel')} (د.أ)</label>
              <Input
                value={videoSurcharge}
                onChange={(e) => setVideoSurcharge(e.target.value)}
                inputMode="decimal"
                className={styles.inputField}
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-300 block mb-1.5">{t('radarHourPriceLabel')} (د.أ / ساعة)</label>
              <Input
                value={radarHourPrice}
                onChange={(e) => setRadarHourPrice(e.target.value)}
                inputMode="decimal"
                className={styles.inputField}
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-300 block mb-1.5">{t('tripMinTariffLabel')} (د.أ / دقيقة)</label>
              <Input
                value={tripMinTariff}
                onChange={(e) => setTripMinTariff(e.target.value)}
                inputMode="decimal"
                className={styles.inputField}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 2. محرك السعة الإقليمية (Capacity Engine) */}
      <Card className={styles.card}>
        <CardHeader className="p-0 pb-4">
          <CardTitle className="text-lg font-black text-white flex items-center gap-2">
            <Gauge className="h-5 w-5 text-amber-400" />
            {t('capacityEngineTitle')}
          </CardTitle>
          <CardDescription className="text-xs text-slate-400">
            {t('capacityEngineSubtitle')}
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0 space-y-4">
          <div className={styles.grid2}>
            <div>
              <label className="text-xs font-bold text-slate-300 block mb-1.5 flex items-center gap-1">
                <MapPin className="h-3 w-3 text-[#14B8A6]" />
                {t('capAmman')} (حملة إعلانية)
              </label>
              <Input
                value={ammanCapacity}
                onChange={(e) => setAmmanCapacity(e.target.value)}
                type="number"
                className={styles.inputField}
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-300 block mb-1.5 flex items-center gap-1">
                <MapPin className="h-3 w-3 text-[#14B8A6]" />
                {t('capZarqa')} (حملة إعلانية)
              </label>
              <Input
                value={zarqaCapacity}
                onChange={(e) => setZarqaCapacity(e.target.value)}
                type="number"
                className={styles.inputField}
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-300 block mb-1.5 flex items-center gap-1">
                <MapPin className="h-3 w-3 text-[#14B8A6]" />
                {t('capIrbid')} (حملة إعلانية)
              </label>
              <Input
                value={irbidCapacity}
                onChange={(e) => setIrbidCapacity(e.target.value)}
                type="number"
                className={styles.inputField}
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-300 block mb-1.5 flex items-center gap-1">
                <MapPin className="h-3 w-3 text-[#14B8A6]" />
                {t('capAqaba')} (حملة إعلانية)
              </label>
              <Input
                value={aqabaCapacity}
                onChange={(e) => setAqabaCapacity(e.target.value)}
                type="number"
                className={styles.inputField}
              />
            </div>
          </div>

          <Button
            onClick={handleSaveSettings}
            disabled={saving || loading}
            className={styles.saveBtn}
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin ml-2" /> : <Save className="h-4 w-4 ml-2" />}
            {t('saveAction')}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

