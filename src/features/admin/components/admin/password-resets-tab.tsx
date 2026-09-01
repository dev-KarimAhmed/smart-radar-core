'use client';

import React from 'react';
import { AlertTriangle, Copy, KeyRound, Loader2, RefreshCw, ShieldCheck, XCircle } from 'lucide-react';

import { useToast } from '@/hooks/use-toast';
import {
  issuePasswordResetToken,
  listPasswordResetRequests,
  rejectPasswordResetRequest,
  type PasswordResetRequestRow,
} from '@/features/auth/contract';

const styles = {
  wrap: 'space-y-4',
  headerRow: 'flex flex-wrap items-center justify-between gap-3',
  title: 'text-lg font-black text-white',
  subtitle: 'mt-1 max-w-2xl text-xs leading-relaxed text-slate-400',
  refresh: 'inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-bold text-slate-200 transition hover:bg-white/10 disabled:opacity-50',
  refreshIcon: 'h-3.5 w-3.5',
  spin: 'h-3.5 w-3.5 animate-spin',
  warning: 'flex items-start gap-2.5 rounded-2xl border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-xs font-bold leading-relaxed text-amber-200',
  warningIcon: 'mt-0.5 h-4 w-4 shrink-0',
  empty: 'rounded-2xl border border-white/10 bg-black/20 px-4 py-8 text-center text-xs font-bold text-slate-400',
  list: 'space-y-3',
  card: 'rounded-2xl border border-white/10 bg-[#0B0F19] p-4',
  cardTop: 'flex flex-wrap items-center justify-between gap-2',
  phone: 'font-mono text-sm font-black text-white',
  meta: 'mt-1 text-[10px] text-slate-500',
  unmatched: 'inline-flex items-center gap-1.5 rounded-lg border border-rose-500/40 bg-rose-500/10 px-2 py-1 text-[10px] font-black text-rose-200',
  matched: 'inline-flex items-center gap-1.5 rounded-lg border border-emerald-500/40 bg-emerald-500/10 px-2 py-1 text-[10px] font-black text-emerald-200',
  badgeIcon: 'h-3 w-3',
  noteLabel: 'mt-3 block text-[11px] font-bold text-slate-300',
  noteInput: 'mt-1.5 w-full rounded-xl border border-slate-800 bg-black/50 px-3 py-2 text-xs text-white outline-none transition focus:border-[#14B8A6]',
  actions: 'mt-3 flex flex-wrap gap-2',
  approve: 'inline-flex items-center gap-2 rounded-xl bg-[#14B8A6] px-3.5 py-2 text-xs font-black text-[#04140F] transition hover:bg-[#2DD4BF] disabled:cursor-not-allowed disabled:opacity-50',
  reject: 'inline-flex items-center gap-2 rounded-xl border border-rose-500/40 bg-rose-500/10 px-3.5 py-2 text-xs font-black text-rose-200 transition hover:bg-rose-500/20 disabled:opacity-50',
  tokenBox: 'mt-3 rounded-2xl border border-[#14B8A6]/40 bg-[#14B8A6]/10 p-3',
  tokenLabel: 'text-[10px] font-black text-[#5eead4]',
  tokenValue: 'mt-1.5 block break-all font-mono text-[11px] font-bold text-white',
  tokenHint: 'mt-2 text-[10px] leading-relaxed text-amber-200',
  copy: 'mt-2 inline-flex items-center gap-1.5 rounded-lg border border-white/15 bg-white/5 px-2.5 py-1.5 text-[10px] font-bold text-slate-200 transition hover:bg-white/10',
  copyIcon: 'h-3 w-3',
} as const;

interface IssuedToken {
  requestId: string;
  url: string;
  expiresInMinutes: number;
}

/**
 * The admin side of password recovery for phone-only accounts.
 *
 * This screen hands out the ability to set someone else's password. That cannot be made
 * risk-free, so it is made accountable instead: approving requires a written note saying how
 * identity was checked, and every issue/reject/completion is written to
 * password_reset_audit.
 */
export function PasswordResetsTab() {
  const { toast } = useToast();
  const [requests, setRequests] = React.useState<PasswordResetRequestRow[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [notes, setNotes] = React.useState<Record<string, string>>({});
  const [busyId, setBusyId] = React.useState<string | null>(null);
  const [issued, setIssued] = React.useState<IssuedToken | null>(null);

  const load = React.useCallback(async () => {
    setIsLoading(true);
    try {
      setRequests(await listPasswordResetRequests('PENDING'));
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'تعذّر تحميل الطلبات',
        description: error instanceof Error ? error.message : 'خطأ غير معروف.',
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  React.useEffect(() => { void load(); }, [load]);

  const approve = async (request: PasswordResetRequestRow) => {
    const note = (notes[request.id] || '').trim();
    if (note.length < 10) {
      toast({
        variant: 'destructive',
        title: 'اكتب طريقة التحقق',
        description: 'لازم تسجّل إزاي اتأكدت من هوية صاحب الحساب (10 أحرف على الأقل).',
      });
      return;
    }

    setBusyId(request.id);
    try {
      const result = await issuePasswordResetToken(request.id, note);
      setIssued({
        requestId: request.id,
        url: `${window.location.origin}/reset-password?token=${result.token}`,
        expiresInMinutes: result.expiresInMinutes,
      });
      await load();
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'تعذّر إصدار الرمز',
        description: error instanceof Error ? error.message : 'خطأ غير معروف.',
      });
    } finally {
      setBusyId(null);
    }
  };

  const reject = async (request: PasswordResetRequestRow) => {
    setBusyId(request.id);
    try {
      await rejectPasswordResetRequest(request.id, (notes[request.id] || '').trim());
      await load();
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'تعذّر رفض الطلب',
        description: error instanceof Error ? error.message : 'خطأ غير معروف.',
      });
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className={styles.wrap}>
      <div className={styles.headerRow}>
        <div>
          <h2 className={styles.title}>طلبات استرجاع كلمة المرور</h2>
          <p className={styles.subtitle}>
            الحسابات اللي مالهاش إيميل استرجاع بتوصل هنا. اتأكد من هوية صاحب الحساب بنفسك
            (رقم قومي، لوحة المركبة، آخر رحلة) قبل ما تصدر الرمز.
          </p>
        </div>
        <button type="button" onClick={() => void load()} disabled={isLoading} className={styles.refresh}>
          {isLoading ? <Loader2 className={styles.spin} /> : <RefreshCw className={styles.refreshIcon} />}
          تحديث
        </button>
      </div>

      <p className={styles.warning}>
        <AlertTriangle className={styles.warningIcon} />
        إصدار الرمز معناه إن صاحبه هيقدر يحط كلمة مرور جديدة ويدخل الحساب. كل عملية بتتسجّل
        باسمك في سجل التدقيق.
      </p>

      {issued ? (
        <div className={styles.tokenBox}>
          <span className={styles.tokenLabel}>رابط الاسترجاع — ابعته لصاحب الحساب</span>
          <code className={styles.tokenValue}>{issued.url}</code>
          <p className={styles.tokenHint}>
            صالح لمدة {issued.expiresInMinutes} دقيقة، ويشتغل مرة واحدة بس. مش هيتعرض تاني بعد
            ما تقفل الشاشة — انسخه دلوقتي.
          </p>
          <button
            type="button"
            onClick={() => {
              void navigator.clipboard.writeText(issued.url);
              toast({ title: 'تم نسخ الرابط' });
            }}
            className={styles.copy}
          >
            <Copy className={styles.copyIcon} />
            نسخ الرابط
          </button>
        </div>
      ) : null}

      {isLoading ? null : requests.length === 0 ? (
        <p className={styles.empty}>مفيش طلبات استرجاع منتظرة.</p>
      ) : (
        <div className={styles.list}>
          {requests.map((request) => (
            <div key={request.id} className={styles.card}>
              <div className={styles.cardTop}>
                <div>
                  <span className={styles.phone} dir="ltr">{request.claimed_phone}</span>
                  <p className={styles.meta}>
                    {new Date(request.created_at).toLocaleString('ar-EG')}
                  </p>
                </div>
                {request.profile_id ? (
                  <span className={styles.matched}>
                    <ShieldCheck className={styles.badgeIcon} />
                    مرتبط بحساب
                  </span>
                ) : (
                  <span className={styles.unmatched}>
                    <XCircle className={styles.badgeIcon} />
                    الرقم مش مسجّل
                  </span>
                )}
              </div>

              <label className={styles.noteLabel} htmlFor={`note-${request.id}`}>
                إزاي اتأكدت من هويته؟
              </label>
              <input
                id={`note-${request.id}`}
                value={notes[request.id] || ''}
                onChange={(event) => setNotes((current) => ({ ...current, [request.id]: event.target.value }))}
                placeholder="مثال: طابق الرقم القومي ولوحة المركبة وآخر رحلة"
                className={styles.noteInput}
              />

              <div className={styles.actions}>
                <button
                  type="button"
                  onClick={() => void approve(request)}
                  disabled={busyId === request.id || !request.profile_id}
                  className={styles.approve}
                >
                  {busyId === request.id ? <Loader2 className={styles.spin} /> : <KeyRound className={styles.refreshIcon} />}
                  إصدار رمز الاسترجاع
                </button>
                <button
                  type="button"
                  onClick={() => void reject(request)}
                  disabled={busyId === request.id}
                  className={styles.reject}
                >
                  <XCircle className={styles.refreshIcon} />
                  رفض
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
