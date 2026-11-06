'use client';

import React, { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { Copy, Check, Users, Sparkles, Link2, ArrowLeft } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { buildCaptainReferralLink, getCaptainReferredRiders, type ReferredRiderInfo } from '../services/captain-referral';
import { ReferredRidersModal } from './referred-riders-modal';
import type { User } from '@/core/types';
import { useAuth } from '@/hooks/use-auth';
import { cn } from '@/lib/utils';

function WhatsAppIcon({ className = 'h-4 w-4' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
    </svg>
  );
}

interface DriverReferralCardProps {
  user: User | null;
  isArabic?: boolean;
  onOpenHistory?: () => void;
}

export function DriverReferralCard({ user, isArabic = true, onOpenHistory }: DriverReferralCardProps) {
  const t = useTranslations('referral.driverCard');
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);
  const [referredCount, setReferredCount] = useState<number>(0);
  const [riders, setRiders] = useState<ReferredRiderInfo[]>([]);
  const [loadingRiders, setLoadingRiders] = useState(false);
  const [ridersModalOpen, setRidersModalOpen] = useState(false);

  const { user: authUser } = useAuth();
  const effectiveUser = user || authUser;
  const captainIdentifier = effectiveUser?.serial_id || effectiveUser?.uid || 'CAPTAIN';
  const referralLink = typeof window !== 'undefined' ? buildCaptainReferralLink(captainIdentifier) : `/?ref=${captainIdentifier}`;

  useEffect(() => {
    let mounted = true;
    async function fetchRiders() {
      try {
        setLoadingRiders(true);
        const data = await getCaptainReferredRiders();
        if (mounted) {
          setRiders(data);
          setReferredCount(data.length);
          setLoadingRiders(false);
        }
      } catch {
        if (mounted) setLoadingRiders(false);
      }
    }

    if (user?.uid) {
      void fetchRiders();
    }

    const handleUpdated = () => {
      if (user?.uid) void fetchRiders();
    };
    window.addEventListener('radar_favorites_updated', handleUpdated);

    return () => {
      mounted = false;
      window.removeEventListener('radar_favorites_updated', handleUpdated);
    };
  }, [user?.uid]);

  const handleCopy = async () => {
    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard) {
        await navigator.clipboard.writeText(referralLink);
      } else {
        const textArea = document.createElement('textarea');
        textArea.value = referralLink;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
      }
      setCopied(true);
      toast({
        title: t('copySuccessTitle'),
        description: t('copySuccessDesc'),
      });
      setTimeout(() => setCopied(false), 3000);
    } catch {
      toast({
        variant: 'destructive',
        title: t('copyErrorTitle'),
        description: t('copyErrorDesc'),
      });
    }
  };

  const handleWhatsAppShare = () => {
    const text = t('whatsAppShareMessage', { link: referralLink });
    const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
    if (typeof window !== 'undefined') {
      window.open(url, '_blank');
    }
  };

  const handleGoToHistory = () => {
    if (onOpenHistory) {
      onOpenHistory();
    } else if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('radar_open_history'));
    }
  };

  return (
    <>
      <div className="relative overflow-hidden rounded-3xl border border-teal-500/25 bg-[#0B0F19]/90 p-4 sm:p-5 text-white shadow-xl backdrop-blur-xl transition-all duration-300">
        {/* Top glowing ambient accent */}
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#14F5D5]/50 to-transparent" />

        {/* Header Row: Title & Linked Count */}
        <div className="flex items-center justify-between gap-3 mb-2">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-teal-500/30 bg-teal-500/10 text-[#14F5D5]">
              <Sparkles className="h-4 w-4" />
            </div>
            <h4 className="text-sm font-black text-white truncate">
              {t('title')}
            </h4>
          </div>

          {/* Interactive Badge that opens Riders Modal */}
          <button
            type="button"
            onClick={() => setRidersModalOpen(true)}
            className="flex items-center gap-1.5 shrink-0 rounded-full border border-teal-500/30 bg-teal-500/10 hover:bg-teal-500/25 hover:border-teal-400 active:scale-95 px-2.5 py-1 text-xs font-bold text-[#14F5D5] transition-all cursor-pointer shadow-sm group/badge"
            title={isArabic ? 'عرض قائمة الركاب' : 'View riders list'}
          >
            <Users className="h-3.5 w-3.5 group-hover/badge:scale-110 transition-transform" />
            <span>
              {t('ridersCount', { count: referredCount })}
            </span>
          </button>
        </div>

        <p className="text-xs text-slate-400 mb-3 leading-relaxed text-start">
          {isArabic
            ? 'أرسل الرابط لعملائك... حافظ عليهم، واجعل طلباتهم تبدأ منك أنت قبل أي سائق آخر، وامنح نفسك فرص دخل إضافي من الإعلانات.'
            : t('description')}
        </p>

        {/* Link, Copy, and WhatsApp Action Box */}
        <div
          dir="ltr"
          className="flex items-center justify-between gap-2.5 sm:gap-4 rounded-2xl sm:rounded-full border border-white/10 bg-[#060B13]/95 px-2.5 sm:px-4 py-2 sm:py-2.5 shadow-[inset_0_1px_4px_rgba(0,0,0,0.6)] backdrop-blur-md"
        >
          {/* Action buttons on the left */}
          <div className="flex items-center gap-2 shrink-0">
            {/* WhatsApp Direct Share Button */}
            <button
              type="button"
              onClick={handleWhatsAppShare}
              title={t('whatsAppTooltip')}
              aria-label="WhatsApp"
              className="flex h-9 w-9 sm:h-10 sm:w-10 shrink-0 items-center justify-center rounded-xl sm:rounded-2xl border border-[#10B981]/70 bg-[#061E16]/80 text-[#25D366] hover:bg-[#10B981]/20 hover:border-[#10B981] active:scale-95 transition-all cursor-pointer shadow-sm"
            >
              <WhatsAppIcon className="h-4.5 w-4.5 sm:h-5 sm:w-5 fill-current text-[#25D366]" />
            </button>

            {/* Copy Button */}
            <button
              type="button"
              onClick={handleCopy}
              className="flex h-9 sm:h-10 shrink-0 items-center justify-center gap-2 px-3 sm:px-4 rounded-xl sm:rounded-2xl border border-[#14F5D5]/80 bg-[#061F22]/80 text-[#14F5D5] hover:bg-[#14F5D5]/20 hover:border-[#14F5D5] active:scale-95 transition-all cursor-pointer shadow-sm group"
            >
              {copied ? (
                <>
                  <span className="text-xs sm:text-sm font-black text-emerald-400 select-none">
                    {t('copiedButton')}
                  </span>
                  <Check className="h-4 w-4 text-emerald-400" />
                </>
              ) : (
                <>
                  <span className="text-xs sm:text-sm font-black text-[#14F5D5] select-none">
                    {t('copyButton')}
                  </span>
                  <Copy className="h-4 w-4 text-[#14F5D5] group-hover:scale-110 transition-transform" />
                </>
              )}
            </button>
          </div>

          {/* URL and Link Icon on the right */}
          <div className="flex items-center gap-2 sm:gap-2.5 min-w-0 flex-1 justify-end overflow-hidden ps-2">
            <span
              className="text-xs sm:text-sm font-mono font-bold text-slate-100 truncate select-all text-right tracking-tight sm:tracking-normal"
              title={referralLink}
            >
              {referralLink}
            </span>
            <Link2 className="h-4.5 w-4.5 text-[#14F5D5] shrink-0" />
          </div>
        </div>

        {/* Navigation to Favorites in "سجلاتي" (per Page 3 & Page 5) */}
        <div className="mt-3 flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-white/5">
          <p className="text-[11px] text-slate-400">
            {isArabic
              ? 'متابعة وإدارة عملائك المفضلين المسجلين معك:'
              : 'Track and manage your favorite referred riders:'}
          </p>
          <button
            type="button"
            onClick={handleGoToHistory}
            className="flex items-center gap-2 rounded-xl border border-teal-500/30 bg-teal-500/10 hover:bg-teal-500/20 px-3 py-1.5 text-xs font-bold text-[#14F5D5] transition-all cursor-pointer shadow-sm group active:scale-95"
          >
            <span className="px-1.5 py-0.5 rounded-md bg-teal-500/20 text-[10px] font-black text-[#14F5D5]">
              {isArabic ? 'متابعة السجل ⬅' : 'Track Log ⬅'}
            </span>
            <span>{isArabic ? 'الانتقال إلى سجل المفضلين في شاشة سجلاتي' : 'View Favorite Riders in My Records'}</span>
            <ArrowLeft className={cn("h-3.5 w-3.5 group-hover:-translate-x-0.5 transition-transform", !isArabic && "rotate-180 group-hover:translate-x-0.5")} />
          </button>
        </div>
      </div>

      <ReferredRidersModal
        open={ridersModalOpen}
        onOpenChange={setRidersModalOpen}
        riders={riders}
        loading={loadingRiders}
        isArabic={isArabic}
      />
    </>
  );
}
