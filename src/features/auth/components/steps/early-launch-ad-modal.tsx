'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { Sparkles } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { EarlyLaunchAdShareView } from './early-launch-ad-share-view';
import { EarlyLaunchAdForm } from './early-launch-ad-form';
import { getCountryLabel, useSupabaseCountries } from '../../hooks/use-supabase-countries';
import { getLocationLabel, useSupabaseDistricts, useSupabaseGovernorates } from '../../hooks/use-supabase-locations';

export type EarlyLaunchCardType = 'COMMERCIAL' | 'CRAFTS';

interface EarlyLaunchAdModalProps {
  cardType: EarlyLaunchCardType | null;
  isArabic: boolean;
  onClose: () => void;
}

export function EarlyLaunchAdModal({ cardType, isArabic, onClose }: EarlyLaunchAdModalProps) {
  const [entityOrCategory, setEntityOrCategory] = useState('');
  const [specialty, setSpecialty] = useState('');
  const [phone, setPhone] = useState('');
  const [selectedCountryId, setSelectedCountryId] = useState<string>('');
  const [selectedGovId, setSelectedGovId] = useState<string>('');
  const [selectedDistrict, setSelectedDistrict] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [shareCode, setShareCode] = useState('');
  const [copied, setCopied] = useState(false);

  const { countryRows, loading: countriesLoading } = useSupabaseCountries();
  const activeCountryId = useMemo(() => {
    if (selectedCountryId) return Number(selectedCountryId) || null;
    const jordan = countryRows.find((c) => String(c.country_code || '').toUpperCase() === 'JO');
    return jordan?.id ?? countryRows[0]?.id ?? null;
  }, [countryRows, selectedCountryId]);

  useEffect(() => {
    if (!selectedCountryId && activeCountryId) {
      setSelectedCountryId(String(activeCountryId));
    }
  }, [activeCountryId, selectedCountryId]);

  const { governorateRows, loading: govLoading } = useSupabaseGovernorates(activeCountryId);
  const govIdNum = selectedGovId ? Number(selectedGovId) : null;
  const { districtRows, loading: distLoading } = useSupabaseDistricts(govIdNum);

  useEffect(() => {
    setEntityOrCategory('');
    setSpecialty('');
    setPhone('');
    setSelectedGovId('');
    setSelectedDistrict('');
    setError('');
    setShareCode('');
    setCopied(false);
  }, [cardType]);

  if (!cardType) return null;

  const isCommercial = cardType === 'COMMERCIAL';

  const title = isCommercial
    ? (isArabic ? 'إعلانات منشآت تجارية' : 'Commercial Establishments Ads')
    : (isArabic ? 'إعلانات مهن يدوية والحرفيين' : 'Handcrafts & Artisans Ads');

  const subtitle = isCommercial
    ? (isArabic ? 'احجز أولوية الظهور المجاني' : 'Book free priority visibility')
    : (isArabic ? 'احجز أولوية الانتشار' : 'Book priority reach');

  const promoCopy = isCommercial
    ? (isArabic
        ? 'انشر رابط بينكم، وسجّل بيانات منشأتك، واحجز 30 يومًا من الظهور الإعلاني المجاني مع انطلاق البث في منطقتك.'
        : 'Share the byncom link, register your establishment details, and reserve 30 days of free ad visibility upon launch in your area.')
    : (isArabic
        ? 'انشر رابط بينكم، وسجّل بياناتك، واحجز 30 يومًا من الظهور الإعلاني المجاني مع انطلاق البث في منطقتك.'
        : 'Share the byncom link, register your details, and reserve 30 days of free ad visibility upon launch in your area.');

  const firstFieldLabel = isCommercial
    ? (isArabic ? 'اسم المنشأة' : 'Establishment Name')
    : (isArabic ? 'التصنيف' : 'Category');

  const shareUrl = typeof window !== 'undefined' && shareCode
    ? `${window.location.origin}/?promo_ref=${encodeURIComponent(shareCode)}`
    : '';

  const selectedCountryRow = countryRows.find((c) => String(c.id) === selectedCountryId);
  const selectedCountryName = selectedCountryRow ? getCountryLabel(selectedCountryRow, 'ar') : '';
  const selectedGovRow = governorateRows.find((g) => String(g.id) === selectedGovId);
  const selectedGovName = selectedGovRow ? getLocationLabel(selectedGovRow, 'ar') : '';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!entityOrCategory.trim() || !specialty.trim() || !phone.trim() || !selectedCountryName || !selectedGovName || !selectedDistrict) {
      setError(isArabic ? 'يرجى تعبئة جميع الحقول المطلوبة' : 'Please fill in all required fields');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/early-launch-ads/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cardType,
          entityOrCategory: entityOrCategory.trim(),
          specialty: specialty.trim(),
          phone: phone.trim(),
          country: selectedCountryName,
          governorate: selectedGovName,
          district: selectedDistrict,
        }),
      });
      const json = await res.json().catch(() => null);
      if (!res.ok || !json?.success || !json?.lead?.shareCode) {
        setError(
          json?.error === 'invalid_phone'
            ? (isArabic ? 'يرجى إدخال رقم هاتف صحيح' : 'Please enter a valid phone number')
            : (isArabic ? 'تعذر حفظ البيانات، يرجى المحاولة مرة أخرى' : 'Could not save data, please try again')
        );
        return;
      }
      setShareCode(json.lead.shareCode);
    } catch {
      setError(isArabic ? 'حدث خطأ في الاتصال، حاول مرة أخرى' : 'Connection error, please try again');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCopy = async () => {
    if (!shareUrl) return;
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {}
  };

  const handleShare = async () => {
    if (!shareUrl) return;
    if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
      try {
        await navigator.share({ title, text: promoCopy, url: shareUrl });
        return;
      } catch {
        // Fallback to copy
      }
    }
    await handleCopy();
  };

  return (
    <Dialog open={Boolean(cardType)} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent
        dir={isArabic ? 'rtl' : 'ltr'}
        className="max-w-lg w-[95vw] rounded-3xl border border-teal-500/30 bg-[#0B0F19] text-white p-5 sm:p-6 shadow-2xl max-h-[90vh] overflow-y-auto"
      >
        <DialogHeader className="text-start space-y-2 pe-8">
          <div className="inline-flex w-fit items-center gap-1.5 rounded-full border border-teal-400/40 bg-teal-500/15 px-3 py-1 text-xs font-black text-[#14F5D5]">
            <Sparkles className="h-3.5 w-3.5" />
            <span>{isArabic ? '30 يوم مجاناً · عرض الإطلاق المبكر' : '30 Days Free · Early Launch Offer'}</span>
          </div>
          <DialogTitle className="text-xl font-black text-white">{title}</DialogTitle>
          <p className="text-xs font-bold text-teal-300">{subtitle}</p>
        </DialogHeader>

        <p className="mt-2 rounded-2xl border border-white/10 bg-white/[0.03] p-3.5 text-xs sm:text-sm leading-relaxed text-slate-200">
          {promoCopy}
        </p>

        {!shareCode ? (
          <EarlyLaunchAdForm
            isArabic={isArabic}
            firstFieldLabel={firstFieldLabel}
            entityOrCategory={entityOrCategory}
            setEntityOrCategory={setEntityOrCategory}
            specialty={specialty}
            setSpecialty={setSpecialty}
            phone={phone}
            setPhone={setPhone}
            selectedCountryId={selectedCountryId}
            onSelectCountry={(val) => {
              setSelectedCountryId(val);
              setSelectedGovId('');
              setSelectedDistrict('');
            }}
            selectedGovId={selectedGovId}
            onSelectGov={(val) => {
              setSelectedGovId(val);
              setSelectedDistrict('');
            }}
            selectedDistrict={selectedDistrict}
            setSelectedDistrict={setSelectedDistrict}
            countryRows={countryRows}
            governorateRows={governorateRows}
            districtRows={districtRows}
            countriesLoading={countriesLoading}
            govLoading={govLoading}
            distLoading={distLoading}
            error={error}
            isSubmitting={isSubmitting}
            onSubmit={handleSubmit}
          />
        ) : (
          <EarlyLaunchAdShareView
            isArabic={isArabic}
            shareUrl={shareUrl}
            copied={copied}
            onCopy={handleCopy}
            onShare={handleShare}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
