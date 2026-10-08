import { useToast } from "@/hooks/use-toast";
import { cn } from '@/lib/utils';
import { AlertCircle, AlertTriangle, Bell, Car, CheckCircle2, X } from 'lucide-react';

export function Toaster() {
  const { toasts, dismiss } = useToast();

  if (!toasts || toasts.length === 0) return null;

  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[99999] flex flex-col gap-2.5 w-[90vw] max-w-sm sm:max-w-md pointer-events-none px-2">
      {toasts.map((toast) => {
        const isDestructive = toast.variant === 'destructive';
        const isWarning = toast.variant === 'warning';
        const isSuccess = toast.variant === 'success';

        // Dynamic detection for trip & arrival toasts
        const isTripOrArrival =
          toast.title?.includes('كابتن') ||
          toast.title?.includes('رحل') ||
          toast.title?.includes('Captain') ||
          toast.title?.includes('Driver') ||
          toast.title?.includes('Trip') ||
          toast.description?.includes('كابتن') ||
          toast.description?.includes('الركوب') ||
          toast.description?.includes('وصول');

        return (
          <div
            key={toast.id}
            className={cn(
              "relative flex items-start justify-between gap-3 p-3.5 sm:p-4 rounded-xl shadow-xl border backdrop-blur-xl transition-all duration-300 pointer-events-auto animate-in fade-in slide-in-from-top-4",
              isDestructive && "bg-red-950/95 border-red-500/80 text-red-50 shadow-red-950/50",
              isWarning && "bg-amber-950/95 border-amber-500/80 text-amber-50 shadow-amber-950/50",
              (isSuccess || (!isDestructive && !isWarning && isTripOrArrival)) && "bg-emerald-950/95 border-emerald-500/80 text-emerald-50 shadow-emerald-950/50 ring-1 ring-emerald-500/30",
              (!isDestructive && !isWarning && !isSuccess && !isTripOrArrival) && "bg-slate-900/95 border-teal-500/60 text-slate-100 shadow-slate-950/70"
            )}
          >
            <div className="flex items-start gap-2.5 sm:gap-3 flex-1 min-w-0">
              {isDestructive ? (
                <AlertCircle className="h-5 w-5 sm:h-6 sm:w-6 shrink-0 text-red-400 mt-0.5" />
              ) : isWarning ? (
                <AlertTriangle className="h-5 w-5 sm:h-6 sm:w-6 shrink-0 text-amber-400 mt-0.5" />
              ) : isTripOrArrival ? (
                <div className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-400 shrink-0 mt-0.5">
                  <Car className="h-5 w-5 sm:h-6 sm:w-6 animate-bounce" />
                </div>
              ) : isSuccess ? (
                <CheckCircle2 className="h-5 w-5 sm:h-6 sm:w-6 shrink-0 text-emerald-400 mt-0.5" />
              ) : (
                <Bell className="h-5 w-5 sm:h-6 sm:w-6 shrink-0 text-teal-400 mt-0.5" />
              )}

              <div className="flex-1 min-w-0">
                <h4 className="font-bold text-sm sm:text-base text-white leading-snug tracking-tight">
                  {toast.title}
                </h4>
                {toast.description && (
                  <p className="text-xs sm:text-sm font-medium text-slate-200 mt-0.5 leading-relaxed">
                    {toast.description}
                  </p>
                )}
              </div>
            </div>

            <button
              onClick={() => dismiss(toast.id)}
              className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-white/10 transition-colors shrink-0"
              aria-label="Close notification"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
}


