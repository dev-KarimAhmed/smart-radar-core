'use client';

import React from 'react';
import { Facebook, Instagram, Phone, ShieldCheck, X } from 'lucide-react';
import { cn, formatTelUri } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { useTranslations } from 'next-intl';
import { supabase } from '@/lib/supabase-client';
import {
  getRefreshedSupabaseAuthHeaders,
  getSupabaseAuthHeaders,
} from '@/shared/services/supabase-auth-headers';
import type { UseTripMutualCancellationReturn } from '@/shared/hooks/use-trip-mutual-cancellation';
import type { RiderActiveTrip } from '../../state/rider-state-machine';

export interface TripActionsPanelProps {
  isArabic: boolean;
  activeTrip: RiderActiveTrip;
  tripHasStarted: boolean;
  mutualCancel: UseTripMutualCancellationReturn;
  isCancellingRideRequest: boolean;
  onEmergencyWhatsapp: () => void;
  onCancelRideRequest: () => void;
}

export function TripActionsPanel({
  isArabic,
  activeTrip,
  tripHasStarted,
  mutualCancel,
  isCancellingRideRequest,
  onEmergencyWhatsapp,
  onCancelRideRequest,
}: TripActionsPanelProps) {
  const t = useTranslations('riderView');
  const { toast } = useToast();
  const [isConfirmingDirectCancel, setIsConfirmingDirectCancel] = React.useState(false);
  const [isDirectCancelling, setIsDirectCancelling] = React.useState(false);

  const captainPhone = activeTrip.captainPhone || activeTrip.captain?.phone;

  const handleDirectCancelRider = React.useCallback(async () => {
    setIsDirectCancelling(true);
    try {
      let cancelled = false;
      try {
        const { error } = await supabase.rpc('cancel_ride_request', { p_request_id: activeTrip.tripId });
        if (!error) {
          cancelled = true;
        } else {
          const msg = String(error.message || '').toLowerCase();
          if (msg.includes('cannot_cancel_active_trip')) {
            toast({
              variant: 'warning',
              title: isArabic ? 'الرحلة بدأت بالفعل' : 'Trip Already Started',
              description: isArabic
                ? 'لا يمكن إلغاء الرحلة بشكل فردي بعد بدئها؛ يرجى استخدام طلب الإلغاء بالتوافق.'
                : 'Cannot cancel unilaterally after trip start; please request mutual cancellation.',
            });
            return;
          }
          if (msg.includes('ride_request_closed')) {
            cancelled = true;
          }
        }
      } catch {}

      if (!cancelled) {
        const baseHeaders = { 'Content-Type': 'application/json' };
        let authHeaders = await getSupabaseAuthHeaders(baseHeaders);
        if (!authHeaders.Authorization) {
          authHeaders = await getRefreshedSupabaseAuthHeaders(baseHeaders);
        }
        let res = await fetch('/api/trip/mutual-cancel', {
          method: 'POST',
          headers: authHeaders,
          body: JSON.stringify({
            requestId: activeTrip.tripId,
            action: 'ACCEPT',
            cancelledByRole: 'rider',
          }),
        });
        if (res.status === 401) {
          const refreshedHeaders = await getRefreshedSupabaseAuthHeaders(baseHeaders);
          if (refreshedHeaders.Authorization) {
            res = await fetch('/api/trip/mutual-cancel', {
              method: 'POST',
              headers: refreshedHeaders,
              body: JSON.stringify({
                requestId: activeTrip.tripId,
                action: 'ACCEPT',
                cancelledByRole: 'rider',
              }),
            });
          }
        }
        const json = (await res.json().catch(() => null)) as { success?: boolean } | null;
        if (!res.ok || !json?.success) {
          throw new Error('direct_cancel_failed');
        }
      }

      toast({
        title: isArabic ? 'تم إلغاء الرحلة' : 'Trip Cancelled',
        description: isArabic ? 'تم إلغاء الرحلة بنجاح قبل بدئها.' : 'Trip cancelled successfully before start.',
      });
      onCancelRideRequest?.();
    } catch {
      toast({
        variant: 'destructive',
        title: isArabic ? 'فشل الإلغاء' : 'Cancellation Failed',
        description: isArabic ? 'تعذر إلغاء الرحلة، يرجى المحاولة مجدداً.' : 'Could not cancel trip, please try again.',
      });
    } finally {
      setIsDirectCancelling(false);
      setIsConfirmingDirectCancel(false);
    }
  }, [activeTrip.tripId, isArabic, onCancelRideRequest, toast]);

  return (
    <div className="space-y-2.5 pt-1">
      {/* زر الاتصال بالكابتن */}
      <a
        href={captainPhone ? formatTelUri(captainPhone) : '#'}
        onClick={(e) => {
          if (!captainPhone) {
            e.preventDefault();
          }
        }}
        className={cn(
          "w-full flex items-center justify-center gap-2.5 h-12 rounded-xl border border-[#14B8A6]/40 bg-[#14B8A6]/15 hover:bg-[#14B8A6]/25 text-[#14F5D5] font-black text-sm py-2.5 transition-all active:scale-[0.98] cursor-pointer shadow-md shadow-[#14B8A6]/10",
          !captainPhone && "opacity-50 cursor-not-allowed pointer-events-none"
        )}
        title={isArabic ? 'اتصال بالكابتن المعلن' : t('trip.callCaptain')}
      >
        <Phone className="h-4 w-4 shrink-0" />
        <span>{isArabic ? 'اتصال بالكابتن المعلن' : 'Call Captain'}</span>
      </a>

      {/* زر الإلغاء قبل البدء أو زر SOS وطلب الإلغاء بالتوافق بعد بدء الرحلة */}
      {!mutualCancel.pendingRequestFrom && !tripHasStarted ? (
        !isConfirmingDirectCancel ? (
          <button
            type="button"
            onClick={() => setIsConfirmingDirectCancel(true)}
            disabled={isCancellingRideRequest || isDirectCancelling}
            className="w-full flex items-center justify-center gap-2 h-12 rounded-xl border border-rose-500/40 bg-rose-500/15 hover:bg-rose-500/25 text-rose-200 font-black text-sm py-2.5 transition-all active:scale-[0.98] cursor-pointer disabled:opacity-50 shadow-md shadow-rose-500/10"
          >
            <X className="h-4 w-4 text-rose-400" />
            <span>{isArabic ? 'إلغاء الرحلة ×' : 'Cancel Trip ×'}</span>
          </button>
        ) : (
          <div className="space-y-3 rounded-2xl border border-rose-500/30 bg-rose-950/30 p-4 text-center">
            <p className="text-xs text-rose-200 font-bold leading-relaxed">
              {isArabic
                ? 'هل أنت متأكد من رغبتك في إلغاء الرحلة؟'
                : 'Are you sure you want to cancel the trip?'}
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                disabled={isDirectCancelling}
                onClick={handleDirectCancelRider}
                className="h-10 flex-1 rounded-xl bg-rose-600 hover:bg-rose-500 text-xs font-black text-white transition cursor-pointer disabled:opacity-50"
              >
                {isDirectCancelling
                  ? (isArabic ? 'جاري الإلغاء...' : 'Cancelling...')
                  : (isArabic ? 'تأكيد الإلغاء' : 'Confirm Cancel')}
              </button>
              <button
                type="button"
                disabled={isDirectCancelling}
                onClick={() => setIsConfirmingDirectCancel(false)}
                className="h-10 flex-1 rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-200 transition cursor-pointer"
              >
                {isArabic ? 'تراجع' : 'Back'}
              </button>
            </div>
          </div>
        )
      ) : tripHasStarted ? (
        <div className="space-y-2.5">
          <button
            type="button"
            onClick={onEmergencyWhatsapp}
            className="w-full flex items-center justify-center gap-2 h-12 bg-red-600 hover:bg-red-700 active:bg-red-800 text-white font-black text-sm py-2.5 rounded-xl transition-all active:scale-[0.98] cursor-pointer shadow-lg shadow-red-600/30 border border-red-500/40"
          >
            <ShieldCheck className="h-5 w-5 animate-pulse" />
            <span>{t('emergency.sosButton')}</span>
          </button>
          {!mutualCancel.pendingRequestFrom && (
            <button
              type="button"
              onClick={() => void mutualCancel.requestCancel()}
              disabled={isCancellingRideRequest || mutualCancel.isProcessing}
              className="w-full flex items-center justify-center gap-2 h-10 rounded-xl border border-rose-500/30 bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 font-bold text-xs py-2 transition-all active:scale-[0.98] cursor-pointer disabled:opacity-50"
            >
              <X className="h-3.5 w-3.5 text-rose-400" />
              <span>{mutualCancel.isProcessing ? (isArabic ? 'جاري الإرسال...' : 'Sending...') : (isArabic ? 'طلب إلغاء الرحلة بالتوافق' : 'Request Mutual Cancellation')}</span>
            </button>
          )}
        </div>
      ) : null}

      {/* روابط السوشيال إن وجدت */}
      {(activeTrip.captain?.facebook_url || activeTrip.captain?.instagram_url) && (
        <div className="flex items-center justify-center gap-2 pt-1">
          {activeTrip.captain?.facebook_url && (
            <a
              href={activeTrip.captain.facebook_url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-slate-300 hover:text-white hover:bg-white/10 transition-colors"
              title="Facebook"
            >
              <Facebook className="h-4 w-4" />
            </a>
          )}
          {activeTrip.captain?.instagram_url && (
            <a
              href={activeTrip.captain.instagram_url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-slate-300 hover:text-white hover:bg-white/10 transition-colors"
              title="Instagram"
            >
              <Instagram className="h-4 w-4" />
            </a>
          )}
        </div>
      )}
    </div>
  );
}
