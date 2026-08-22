'use client';

import React, { useState } from 'react';
import { AlertOctagon, ThumbsDown, ThumbsUp, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';

import { cn } from '@/lib/utils';

const styles = {
  content: "max-h-[92vh] w-[95%] overflow-y-auto rounded-3xl border-white/[0.06] bg-[#0A0F1D]/95 px-6 pb-8 pt-10 text-white backdrop-blur-xl sm:max-w-md",
  headerRtl: "mt-2 flex flex-row items-center justify-between border-b border-white/5 pb-2",
  headerTextRtl: "text-right",
  headerTextLtr: "text-left",
  title: "text-xl font-black text-white",
  description: "mt-1 text-gray-400",
  closeButton: "rounded-full p-1 text-slate-400 transition-colors hover:bg-white/5 hover:text-white",
  closeIcon: "h-5 w-5",
  body: "space-y-6 py-4",
  commentWrap: "space-y-2",
  commentLabel: "text-sm font-bold text-white",
  commentInput: "w-full resize-none rounded-xl border border-white/10 bg-white/5 p-3 text-sm text-white placeholder-slate-500 backdrop-blur-sm transition-all focus:border-[#14B8A6] focus:outline-none focus:ring-1 focus:ring-[#14B8A6]",
  actions: "space-y-3 pt-2",
  submitButton: "h-12 w-full rounded-xl bg-[#14B8A6] text-base font-black text-[#0A0F1D] transition-all hover:bg-[#2DD4BF]",
  blockButton: "mb-2 flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl border border-red-500/20 bg-red-500/10 py-3 text-sm font-bold text-red-400 transition-colors hover:bg-red-500/20",
  blockIcon: "h-4 w-4",
  blockConfirmWrap: "mb-2 space-y-3 rounded-2xl border border-red-500/20 bg-red-500/5 p-4",
  blockConfirmText: "text-center text-xs font-bold leading-relaxed text-red-200",
  blockConfirmActions: "flex gap-2.5",
  blockConfirmButton: "h-10 flex-1 rounded-lg text-xs font-bold",
  blockCancelButton: "h-10 flex-1 rounded-lg border-white/10 bg-white/5 text-xs font-bold text-white hover:bg-white/10",
  criteriaSection: "space-y-3",
  criteriaLabel: "text-sm font-bold text-white",
  criteriaList: "divide-y divide-white/5 rounded-2xl border border-white/10 bg-white/5 px-3.5",
  criteriaRow: "flex items-center justify-between gap-3 py-2.5",
  criteriaItemLabel: "min-w-0 flex-1 text-xs font-medium leading-tight text-slate-300",
  criteriaVerdicts: "flex shrink-0 items-center gap-2",
  criteriaButton: "flex h-9 w-9 cursor-pointer items-center justify-center rounded-xl border transition-all duration-200 active:scale-90",
  criteriaIcon: "h-4 w-4 transition-all duration-200",
  criteriaIdle: "border-white/10 bg-black/20 text-slate-500 hover:border-white/20 hover:text-slate-300",
  criteriaUpActive: "border-[#14B8A6]/70 bg-[#14B8A6]/20 text-[#2DD4BF] shadow-[0_0_12px_rgba(20,184,166,0.3)]",
  criteriaDownActive: "border-red-500/60 bg-red-500/20 text-red-300 shadow-[0_0_12px_rgba(239,68,68,0.25)]",
  criteriaHint: "text-[10px] font-medium leading-relaxed text-slate-500",
} as const;

/**
 * Unanswered criteria stay `null` and never reach the payload, so the server averages only
 * what the captain actually judged. See the matching note in the rider's rating modal.
 */
type CriterionVerdict = 'up' | 'down' | null;

interface DriverRatingModalProps {
  isOpen: boolean;
  onClose: () => void;
  language: 'ar' | 'en';
  tripId: string;
  riderId: string;
  captainId: string;
  supabase: any;
  onSuccess: () => void;
  riderName?: string;
}

type RiderRatingKey = 'respect' | 'punctuality' | 'cleanliness' | 'communication' | 'cooperation';

const initialRiderRatings: Record<RiderRatingKey, CriterionVerdict> = {
  respect: null,
  punctuality: null,
  cleanliness: null,
  communication: null,
  cooperation: null,
};

export function DriverRatingModal({
  isOpen,
  onClose,
  language,
  tripId,
  riderId,
  captainId,
  supabase,
  onSuccess,
}: DriverRatingModalProps) {
  const { toast } = useToast();
  const isArabic = language === 'ar';
  const copy = driverRatingModalCopy[language];
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isBlocking, setIsBlocking] = useState(false);
  const [confirmBlock, setConfirmBlock] = useState(false);
  const [comment, setComment] = useState('');
  const [rider, setRider] = useState(initialRiderRatings);

  React.useEffect(() => {
    if (!isOpen) return;
    setConfirmBlock(false);
    setComment('');
    setRider(initialRiderRatings);
  }, [isOpen, tripId]);

  // Re-tapping the chosen verdict clears it back to "no opinion".
  const handleSelect = (key: RiderRatingKey, verdict: Exclude<CriterionVerdict, null>) => {
    setRider((previous) => ({ ...previous, [key]: previous[key] === verdict ? null : verdict }));
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const detailedStarsPayload = {
        rider: Object.fromEntries(
          Object.entries(rider)
            .filter(([, verdict]) => verdict !== null)
            .map(([key, verdict]) => [key, verdict === 'up' ? 1 : 0]),
        ),
      };

      const { error } = await supabase.from('reviews').insert({
        trip_id: tripId,
        reviewer_id: captainId,
        reviewee_id: riderId,
        detailed_stars: detailedStarsPayload,
        comment: comment.trim() || null,
      });

      if (error) throw error;

      toast({
        title: copy.submitSuccessTitle,
        description: copy.submitSuccessDescription,
      });

      onSuccess();
    } catch (error: any) {
      if ((process.env.NODE_ENV !== 'production')) console.error('[Driver Rating Modal] Submit rating error:', error);
      toast({
        variant: 'destructive',
        title: copy.submitErrorTitle,
        description: error?.message || copy.submitErrorDescription,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBlockRider = async () => {
    setIsBlocking(true);
    try {
      const { error } = await supabase.from('user_blocks').insert({
        blocker_id: captainId,
        blocked_id: riderId,
      });

      if (error) throw error;

      toast({
        title: copy.blockSuccessTitle,
        description: copy.blockSuccessDescription,
      });

      onSuccess();
    } catch (error: any) {
      if ((process.env.NODE_ENV !== 'production')) console.error('[Driver Rating Modal] Block rider error:', error);
      toast({
        variant: 'destructive',
        title: copy.blockErrorTitle,
        description: error?.message || copy.blockErrorDescription,
      });
    } finally {
      setIsBlocking(false);
      setConfirmBlock(false);
    }
  };

  const riderCriteria = [
    { key: 'respect' as const, label: copy.riderRespect },
    { key: 'punctuality' as const, label: copy.riderPunctuality },
    { key: 'cleanliness' as const, label: copy.riderCleanliness },
    { key: 'communication' as const, label: copy.riderCommunication },
    { key: 'cooperation' as const, label: copy.riderCooperation },
  ];

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        className={styles.content}
        dir={isArabic ? 'rtl' : 'ltr'}
      >
        <DialogHeader className={cn(styles.headerRtl, isArabic ? styles.headerTextRtl : styles.headerTextLtr)}>
          <div>
            <DialogTitle className={styles.title}>{copy.title}</DialogTitle>
            <DialogDescription className={styles.description}>{copy.description}</DialogDescription>
          </div>
          <button onClick={onClose} className={styles.closeButton}>
            <X className={styles.closeIcon} />
          </button>
        </DialogHeader>

        <div className={styles.body}>
          <div className={styles.criteriaSection}>
            <Label className={styles.criteriaLabel}>{copy.riderSection}</Label>
            <div className={styles.criteriaList}>
              {riderCriteria.map((item) => {
                const verdict = rider[item.key];
                return (
                  <div key={item.key} className={styles.criteriaRow}>
                    <span className={styles.criteriaItemLabel}>{item.label}</span>
                    <div className={styles.criteriaVerdicts}>
                      <button
                        type="button"
                        onClick={() => handleSelect(item.key, 'up')}
                        className={cn(styles.criteriaButton, verdict === 'up' ? styles.criteriaUpActive : styles.criteriaIdle)}
                        aria-pressed={verdict === 'up'}
                        aria-label={item.label}
                      >
                        <ThumbsUp className={styles.criteriaIcon} />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleSelect(item.key, 'down')}
                        className={cn(styles.criteriaButton, verdict === 'down' ? styles.criteriaDownActive : styles.criteriaIdle)}
                        aria-pressed={verdict === 'down'}
                        aria-label={item.label}
                      >
                        <ThumbsDown className={styles.criteriaIcon} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
            <p className={styles.criteriaHint}>{copy.criteriaHint}</p>
          </div>

          <div className={styles.commentWrap}>
            <Label className={styles.commentLabel}>{copy.commentLabel}</Label>
            <textarea
              value={comment}
              onChange={(event) => setComment(event.target.value)}
              placeholder={copy.commentPlaceholder}
              rows={3}
              className={styles.commentInput}
            />
          </div>
        </div>

        <div className={styles.actions}>
          {!confirmBlock ? (
            <Button
              className={styles.submitButton}
              disabled={isSubmitting || isBlocking}
              onClick={handleSubmit}
            >
              {isSubmitting ? copy.submitting : copy.submit}
            </Button>
          ) : null}

          {!confirmBlock ? (
            <button
              type="button"
              disabled={isSubmitting || isBlocking}
              onClick={() => setConfirmBlock(true)}
              className={styles.blockButton}
            >
              <AlertOctagon className={styles.blockIcon} />
              {copy.blockRider}
            </button>
          ) : (
            <div className={styles.blockConfirmWrap}>
              <p className={styles.blockConfirmText}>{copy.blockConfirm}</p>
              <div className={styles.blockConfirmActions}>
                <Button
                  variant="destructive"
                  className={styles.blockConfirmButton}
                  disabled={isBlocking}
                  onClick={handleBlockRider}
                >
                  {isBlocking ? copy.blocking : copy.confirmBlock}
                </Button>
                <Button
                  variant="outline"
                  className={styles.blockCancelButton}
                  disabled={isBlocking}
                  onClick={() => setConfirmBlock(false)}
                >
                  {copy.back}
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

const driverRatingModalCopy = {
  ar: {
    title: 'قيّم الراكب',
    description: 'يساعدنا تقييمك على تحسين تجربة الرحلات.',
    riderSection: 'تقييم الراكب',
    criteriaHint: 'قيّم البنود اللي تحب فقط — البند اللي تسيبه فاضي مش محسوب ضد الراكب.',
    riderRespect: 'الاحترام',
    riderPunctuality: 'الالتزام بالوقت',
    riderCleanliness: 'المحافظة على نظافة المركبة',
    riderCommunication: 'التواصل',
    riderCooperation: 'حسن التعاون',
    commentLabel: 'ملاحظات إضافية (اختياري)',
    commentPlaceholder: 'اكتب رأيك في الراكب والرحلة...',
    submit: 'إرسال التقييم',
    submitting: 'جاري إرسال التقييم...',
    blockRider: 'حظر هذا الراكب',
    blockConfirm: 'هل أنت متأكد من حظر هذا الراكب؟ لن تظهر لك طلباته مرة أخرى.',
    blocking: 'جاري الحظر...',
    confirmBlock: 'نعم، تأكيد الحظر',
    back: 'تراجع',
    submitSuccessTitle: 'تم إرسال التقييم بنجاح',
    submitSuccessDescription: 'شكراً لك. يساعدنا تقييمك على تحسين الخدمة.',
    submitErrorTitle: 'تعذر حفظ التقييم',
    submitErrorDescription: 'حدث خطأ غير متوقع أثناء حفظ تقييمك.',
    blockSuccessTitle: 'تم حظر الراكب',
    blockSuccessDescription: 'لن تظهر لك طلبات هذا الراكب مرة أخرى.',
    blockErrorTitle: 'تعذر حظر الراكب',
    blockErrorDescription: 'حدث خطأ غير متوقع أثناء حظر الراكب.',
  },
  en: {
    title: 'Rate the rider',
    description: 'Your feedback helps us improve the ride experience.',
    riderSection: 'Rider rating',
    criteriaHint: 'Answer only the points you want — anything left blank is not counted against the rider.',
    riderRespect: 'Respect',
    riderPunctuality: 'Punctuality',
    riderCleanliness: 'Care for the vehicle',
    riderCommunication: 'Communication',
    riderCooperation: 'Cooperation',
    commentLabel: 'Additional notes (optional)',
    commentPlaceholder: 'Write your feedback about the rider and trip...',
    submit: 'Submit rating',
    submitting: 'Submitting rating...',
    blockRider: 'Block this rider',
    blockConfirm: 'Are you sure you want to block this rider? Their requests will not appear again.',
    blocking: 'Blocking...',
    confirmBlock: 'Yes, block rider',
    back: 'Back',
    submitSuccessTitle: 'Rating submitted',
    submitSuccessDescription: 'Thank you. Your feedback helps us improve the service.',
    submitErrorTitle: 'Could not save rating',
    submitErrorDescription: 'An unexpected error occurred while saving your rating.',
    blockSuccessTitle: 'Rider blocked',
    blockSuccessDescription: 'This rider’s requests will not appear again.',
    blockErrorTitle: 'Could not block rider',
    blockErrorDescription: 'An unexpected error occurred while blocking this rider.',
  },
} as const satisfies Record<'ar' | 'en', Record<string, string>>;
