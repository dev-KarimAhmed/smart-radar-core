import React, { useState } from 'react';
import { useTranslations } from 'next-intl';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { LogOut, Loader2 } from 'lucide-react';
import { clearSupabaseSessionCache } from '@/lib/supabase-auth';
import { purgeTransientFrontendCache } from '@/hooks/use-auth';
import { supabase } from '@/lib/supabase-client';
import { cn } from '@/lib/utils';

interface AdminLogoutDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  direction: 'rtl' | 'ltr';
  isArabic: boolean;
}

export function AdminLogoutDialog({
  open,
  onOpenChange,
  direction,
  isArabic,
}: AdminLogoutDialogProps) {
  const t = useTranslations('adminTopBar');
  const [loggingOut, setLoggingOut] = useState(false);

  const handleConfirmLogout = async () => {
    setLoggingOut(true);
    try {
      clearSupabaseSessionCache();
      purgeTransientFrontendCache();
      await supabase.auth.signOut().catch(() => {});

      if (typeof window !== 'undefined') {
        window.sessionStorage.clear();
        window.location.href = '/login/admin';
      }
    } catch (err) {
      console.error('[AdminTopBar] Logout error:', err);
      if (typeof window !== 'undefined') {
        window.location.href = '/login/admin';
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-[#0B0F19] border border-rose-500/30 text-white shadow-2xl rounded-2xl" dir={direction}>
        <DialogHeader className={cn("space-y-2", isArabic ? "text-right" : "text-left")}>
          <div className="flex items-center gap-2.5 text-rose-400">
            <div className="p-2 rounded-xl bg-rose-500/10 border border-rose-500/20">
              <LogOut className="w-5 h-5 text-rose-400" />
            </div>
            <DialogTitle className="text-lg font-black text-white">
              {t('logoutDialogTitle')}
            </DialogTitle>
          </div>
          <DialogDescription className="text-slate-400 text-xs leading-relaxed">
            {t('logoutDialogDesc')}
          </DialogDescription>
        </DialogHeader>

        <DialogFooter className="flex-row gap-2 sm:justify-start pt-4 border-t border-white/10">
          <Button
            type="button"
            onClick={handleConfirmLogout}
            disabled={loggingOut}
            className="flex-1 bg-rose-600 hover:bg-rose-700 text-white font-black text-xs sm:text-sm h-10 rounded-xl transition-all shadow-lg shadow-rose-950/40"
          >
            {loggingOut ? (
              <>
                <Loader2 className={cn("w-4 h-4 animate-spin", isArabic ? "ml-2" : "mr-2")} />
                {t('loggingOut')}
              </>
            ) : (
              <>
                <LogOut className={cn("w-4 h-4", isArabic ? "ml-1.5" : "mr-1.5")} />
                {t('confirmLogout')}
              </>
            )}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loggingOut}
            className="border-white/10 text-slate-300 hover:bg-white/5 h-10 rounded-xl text-xs"
          >
            {t('back')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
