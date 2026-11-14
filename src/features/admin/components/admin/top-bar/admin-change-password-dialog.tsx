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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Lock, AlertTriangle, Eye, EyeOff, Loader2, CheckCircle2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { adminFetch } from '@/features/admin/lib/admin-api-client';
import { supabase } from '@/lib/supabase-client';
import { cn } from '@/lib/utils';

interface AdminChangePasswordDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  direction: 'rtl' | 'ltr';
  isArabic: boolean;
  userId?: string;
}

export function AdminChangePasswordDialog({
  open,
  onOpenChange,
  direction,
  isArabic,
  userId,
}: AdminChangePasswordDialogProps) {
  const t = useTranslations('adminTopBar');
  const { toast } = useToast();

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [submittingPassword, setSubmittingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  const handleChangePassword = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setPasswordError(null);

    if (!newPassword || newPassword.length < 6) {
      setPasswordError(t('passwordLengthError'));
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError(t('passwordMismatchError'));
      return;
    }

    setSubmittingPassword(true);

    try {
      const response = await adminFetch('/api/admin/change-password', {
        method: 'POST',
        body: JSON.stringify({ newPassword }),
      }, userId);

      const data = await response.json();

      if (!response.ok || !data.success) {
        const { error: clientErr } = await supabase.auth.updateUser({
          password: newPassword,
        });

        if (clientErr) {
          throw new Error(data.error || clientErr.message || t('passwordGenericError'));
        }
      }

      toast({
        title: t('passwordSuccessTitle'),
        description: t('passwordSuccessDesc'),
        variant: 'default',
      });

      setNewPassword('');
      setConfirmPassword('');
      onOpenChange(false);
    } catch (err: any) {
      console.error('[AdminTopBar] Change password error:', err);
      setPasswordError(err.message || t('passwordGenericError'));
      toast({
        title: t('passwordErrorTitle'),
        description: err.message || t('passwordGenericError'),
        variant: 'destructive',
      });
    } finally {
      setSubmittingPassword(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-[#0B0F19] border border-teal-500/30 text-white shadow-2xl rounded-2xl" dir={direction}>
        <DialogHeader className={cn("space-y-2", isArabic ? "text-right" : "text-left")}>
          <div className="flex items-center gap-2.5 text-teal-400">
            <div className="p-2 rounded-xl bg-teal-500/10 border border-teal-500/20">
              <Lock className="w-5 h-5 text-teal-400" />
            </div>
            <DialogTitle className="text-lg font-black text-white">
              {t('passwordDialogTitle')}
            </DialogTitle>
          </div>
          <DialogDescription className="text-slate-400 text-xs leading-relaxed">
            {t('passwordDialogDesc')}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleChangePassword} className="space-y-4 my-2">
          {passwordError && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{passwordError}</span>
            </div>
          )}

          <div className={cn("space-y-1.5", isArabic ? "text-right" : "text-left")}>
            <Label className="text-xs font-bold text-slate-300">
              {t('newPasswordLabel')}
            </Label>
            <div className="relative">
              <Input
                type={showPassword ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="••••••••"
                className={cn("bg-black/60 border-white/10 focus:border-teal-500/50 text-white text-sm h-11 rounded-xl pl-10 pr-3 font-mono", isArabic ? "text-right" : "text-left")}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className={cn("space-y-1.5", isArabic ? "text-right" : "text-left")}>
            <Label className="text-xs font-bold text-slate-300">
              {t('confirmPasswordLabel')}
            </Label>
            <div className="relative">
              <Input
                type={showConfirmPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                className={cn("bg-black/60 border-white/10 focus:border-teal-500/50 text-white text-sm h-11 rounded-xl pl-10 pr-3 font-mono", isArabic ? "text-right" : "text-left")}
                required
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors"
                tabIndex={-1}
              >
                {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <DialogFooter className="flex-row gap-2 sm:justify-start pt-3 border-t border-white/10">
            <Button
              type="submit"
              disabled={submittingPassword || !newPassword || !confirmPassword}
              className="flex-1 bg-teal-500 hover:bg-teal-600 text-[#0B0F19] font-black text-xs sm:text-sm h-10 rounded-xl transition-all"
            >
              {submittingPassword ? (
                <>
                  <Loader2 className={cn("w-4 h-4 animate-spin", isArabic ? "ml-2" : "mr-2")} />
                  {t('updating')}
                </>
              ) : (
                <>
                  <CheckCircle2 className={cn("w-4 h-4", isArabic ? "ml-1.5" : "mr-1.5")} />
                  {t('savePassword')}
                </>
              )}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={submittingPassword}
              className="border-white/10 text-slate-300 hover:bg-white/5 h-10 rounded-xl text-xs"
            >
              {t('cancel')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
