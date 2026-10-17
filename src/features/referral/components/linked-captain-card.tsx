'use client';

import React, { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { UserCheck, Unlink, Sparkles } from 'lucide-react';
import { getRiderLinkedCaptain, removeCaptainReferral, type LinkedCaptainInfo } from '../services/captain-referral';
import { useToast } from '@/hooks/use-toast';

interface LinkedCaptainCardProps {
  isArabic?: boolean;
  onUnlinkSuccess?: () => void;
}

export function LinkedCaptainCard({ isArabic = true, onUnlinkSuccess }: LinkedCaptainCardProps) {
  const t = useTranslations('referral.linkedCaptain');
  const [captainInfo, setCaptainInfo] = useState<LinkedCaptainInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [isUnlinkDialogOpen, setIsUnlinkDialogOpen] = useState(false);
  const [isUnlinking, setIsUnlinking] = useState(false);
  const { toast } = useToast();

  const loadLinkedCaptain = async () => {
    try {
      const data = await getRiderLinkedCaptain();
      setCaptainInfo(data);
    } catch {
      setCaptainInfo({ is_linked: false });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadLinkedCaptain();
  }, []);

  const handleConfirmUnlink = async () => {
    setIsUnlinking(true);
    try {
      const result = await removeCaptainReferral();
      if (result.success) {
        toast({
          title: t('unlinkSuccessTitle'),
          description: t('unlinkSuccessDesc'),
        });
        setCaptainInfo({ is_linked: false });
        setIsUnlinkDialogOpen(false);
        if (onUnlinkSuccess) onUnlinkSuccess();
      } else {
        toast({
          variant: 'destructive',
          title: t('unlinkErrorTitle'),
          description: result.error || t('unlinkErrorDefault'),
        });
      }
    } catch (err: any) {
      toast({
        variant: 'destructive',
        title: t('errorTitle'),
        description: err.message || t('unexpectedError'),
      });
    } finally {
      setIsUnlinking(false);
    }
  };

  if (loading || !captainInfo?.is_linked) {
    return null;
  }

  const captainDisplayName = captainInfo.captain_name || t('defaultCaptainName');

  return (
    <>
      {/* Strip matching ProfileHeaderCard info boxes */}
      <div className="flex items-center justify-between gap-3 rounded-2xl border border-white/5 bg-black/30 p-3 sm:p-3.5 transition-all">
        {/* Right side: Captain Identity */}
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-[#14B8A6]/20 bg-[#14B8A6]/10 text-[#14F5D5]">
            <UserCheck className="h-4 w-4" />
          </div>
          <div className="min-w-0 text-start">
            <div className="flex items-center gap-2 flex-wrap">
              <strong className="text-xs font-bold text-white truncate">
                {captainDisplayName}
              </strong>
              {captainInfo.captain_serial && (
                <span className="rounded-md border border-[#14B8A6]/25 bg-[#14B8A6]/10 px-1.5 py-0.5 font-mono text-[9px] font-bold text-[#14F5D5]">
                  #{captainInfo.captain_serial}
                </span>
              )}
            </div>
            <p className="text-[10px] text-slate-400 mt-0.5 flex items-center gap-1">
              <Sparkles className="h-3 w-3 text-[#14F5D5]" />
              <span>{t('badgeSubtitle')}</span>
            </p>
          </div>
        </div>

        {/* Left side: Action Button */}
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setIsUnlinkDialogOpen(true)}
          className="shrink-0 h-8 px-3 rounded-xl border border-rose-500/25 bg-rose-500/10 text-rose-300 hover:bg-rose-500/20 hover:text-rose-200 transition-all font-black text-xs flex items-center gap-1.5 cursor-pointer shadow-sm"
        >
          <Unlink className="h-3.5 w-3.5 text-rose-400" />
          <span>{t('unlinkButton')}</span>
        </Button>
      </div>

      {/* Confirmation Dialog adhering strictly to Radar Design System */}
      <AlertDialog open={isUnlinkDialogOpen} onOpenChange={setIsUnlinkDialogOpen}>
        <AlertDialogContent
          dir={isArabic ? 'rtl' : 'ltr'}
          className="border border-red-500/25 bg-[#0B0F19] text-white p-6 shadow-2xl rounded-3xl max-w-md"
        >
          {/* Top glowing ambient accent */}
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-red-500/60 to-transparent" />

          <AlertDialogHeader className="text-start">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-red-500/30 bg-red-500/10 text-red-400 mb-3 shadow-[0_0_15px_rgba(239,68,68,0.15)]">
              <Unlink className="h-6 w-6 stroke-[2.2]" />
            </div>

            <AlertDialogTitle className="text-lg font-black text-white text-start">
              {t('unlinkDialogTitle')}
            </AlertDialogTitle>

            <AlertDialogDescription className="text-xs text-slate-300 leading-relaxed text-start">
              {t('unlinkDialogDesc', { captainName: captainInfo.captain_name || t('currentCaptainFallback') })}
            </AlertDialogDescription>

            {/* Styled consequences box */}
            <div className="rounded-2xl border border-white/5 bg-black/40 p-3.5 space-y-2 mt-3 text-start">
              <div className="flex items-center gap-2 text-xs text-slate-300">
                <span className="h-1.5 w-1.5 rounded-full bg-red-400 shrink-0" />
                <span>{t('consequence1')}</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-300">
                <span className="h-1.5 w-1.5 rounded-full bg-red-400 shrink-0" />
                <span>{t('consequence2')}</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-[#14F5D5] font-bold">
                <span className="h-1.5 w-1.5 rounded-full bg-[#14F5D5] shrink-0" />
                <span>{t('consequence3')}</span>
              </div>
            </div>
          </AlertDialogHeader>

          <AlertDialogFooter className="mt-5 flex flex-row gap-3 sm:space-x-0">
            <AlertDialogCancel
              disabled={isUnlinking}
              className="flex-1 h-11 rounded-xl border border-white/10 bg-white/5 font-bold text-slate-300 hover:bg-white/10 hover:text-white transition-all text-xs cursor-pointer focus:ring-0 focus-visible:ring-0 outline-none"
            >
              {t('cancelButton')}
            </AlertDialogCancel>
            <AlertDialogAction
              disabled={isUnlinking}
              onClick={handleConfirmUnlink}
              className="flex-1 h-11 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 font-black text-white text-xs shadow-lg shadow-red-950/40 active:scale-[0.98] transition-all flex items-center justify-center gap-1.5 cursor-pointer border-0"
            >
              <Unlink className="h-4 w-4" />
              <span>
                {isUnlinking ? t('unlinkingButton') : t('confirmUnlinkButton')}
              </span>
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
