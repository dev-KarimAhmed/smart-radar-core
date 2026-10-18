'use client';

import React, { useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { supabase } from '@/lib/supabase-client';
import { adminFetch } from '@/features/admin/lib/admin-api-client';
import { useToast } from '@/hooks/use-toast';
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
import { Badge } from '@/components/ui/badge';
import {
  ShieldCheck,
  LogOut,
  KeyRound,
  Eye,
  EyeOff,
  Lock,
  Loader2,
  AlertTriangle,
  CheckCircle2,
  User,
  ShieldAlert,
  Crown,
  Shield,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { clearSupabaseSessionCache } from '@/lib/supabase-auth';
import { purgeTransientFrontendCache } from '@/hooks/use-auth';
import { AdminNotificationCenter } from './admin-notification-center';
import { useTranslations } from 'next-intl';

export function AdminTopBar() {
  const t = useTranslations('adminTopBar');
  const { user } = useAuth();
  const { toast } = useToast();

  const isSovereignPrimary =
    user?.uid === '70b4a26f-10ac-4888-8df6-c3a5ad824b8a' ||
    user?.phone === '+201551981922';

  const [adminRank, setAdminRank] = useState<'GENERAL_ADMIN' | 'ASSISTANT_ADMIN'>(() => {
    if (isSovereignPrimary) return 'GENERAL_ADMIN';
    return user?.adminRank || 'GENERAL_ADMIN';
  });

  React.useEffect(() => {
    if (isSovereignPrimary) {
      setAdminRank('GENERAL_ADMIN');
      return;
    }
    if (user?.adminRank) {
      setAdminRank(user.adminRank);
    }
    adminFetch('/api/admin/list-admins')
      .then((res) => res.json())
      .then((data) => {
        if (isSovereignPrimary) {
          setAdminRank('GENERAL_ADMIN');
        } else if (data?.callerRank) {
          setAdminRank(data.callerRank);
        }
      })
      .catch(() => {});
  }, [user, isSovereignPrimary]);

  // Dialog States
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);
  const [logoutDialogOpen, setLogoutDialogOpen] = useState(false);

  // Password Form States
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [submittingPassword, setSubmittingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  // Logout State
  const [loggingOut, setLoggingOut] = useState(false);

  // Handle Change Password Submit
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
      // Call server-side administrative route with adminFetch
      const response = await adminFetch('/api/admin/change-password', {
        method: 'POST',
        body: JSON.stringify({ newPassword }),
      }, user?.uid);

      const data = await response.json();

      if (!response.ok || !data.success) {
        // Fallback: Attempt client-side update directly if server route has permission quirks
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

      // Reset and close
      setNewPassword('');
      setConfirmPassword('');
      setPasswordDialogOpen(false);
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

  // Handle Logout Confirmation
  const handleConfirmLogout = async () => {
    setLoggingOut(true);
    try {
      // 1. Clear cached session tokens
      clearSupabaseSessionCache();
      purgeTransientFrontendCache();

      // 2. Sign out from Supabase client
      await supabase.auth.signOut().catch(() => {});

      // 3. Clear storage specifically
      if (typeof window !== 'undefined') {
        window.sessionStorage.clear();
        // Redirect directly to admin login page
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
    <>
      {/* Top Header Card */}
      <div className="relative overflow-hidden rounded-2xl border border-teal-500/20 bg-[#0B0F19]/95 p-4 sm:p-5 shadow-2xl backdrop-blur-xl mb-6 flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Subtle decorative glow */}
        <div className="absolute top-0 right-0 w-64 h-24 bg-teal-500/5 blur-3xl pointer-events-none rounded-full" />
        <div className="absolute bottom-0 left-0 w-64 h-24 bg-rose-500/5 blur-3xl pointer-events-none rounded-full" />

        {/* Right Section: Identity & Status */}
        <div className="flex items-center gap-3.5 w-full md:w-auto">
          <div className="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-teal-500/30 bg-teal-500/10 text-teal-400 shadow-[0_0_15px_rgba(20,184,166,0.15)]">
            <ShieldCheck className="h-6 w-6" />
            <span className="absolute -top-1 -right-1 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500" />
            </span>
          </div>

          <div className="space-y-1 text-right">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-base sm:text-lg font-black text-white tracking-wide">
                {user?.name || t('sovereignAdmin')}
              </h2>
              {adminRank === 'GENERAL_ADMIN' ? (
                <Badge className="bg-amber-500/15 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[11px] font-black py-0.5 px-2 flex items-center gap-1 shadow-[0_0_12px_rgba(245,158,11,0.2)]">
                  <Crown className="w-3 h-3 text-amber-400" />
                  <span>{t('generalAdmin')}</span>
                </Badge>
              ) : (
                <Badge className="bg-cyan-500/15 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 text-[11px] font-bold py-0.5 px-2 flex items-center gap-1 shadow-[0_0_12px_rgba(6,182,212,0.15)]">
                  <Shield className="w-3 h-3 text-cyan-400" />
                  <span>{t('assistantAdmin')}</span>
                </Badge>
              )}
            </div>
            <p className="text-xs text-slate-400 font-mono flex items-center gap-1.5">
              <span>{user?.phone || user?.serial_id || 'UID: ' + (user?.uid ? user.uid.slice(0, 8) + '...' : t('officer'))}</span>
            </p>
          </div>
        </div>

        {/* Left Section: Action Buttons */}
        <div className="flex items-center gap-2.5 w-full md:w-auto justify-end flex-wrap">
          {/* Sovereign Notification Center */}
          <AdminNotificationCenter />

          {/* Change Password Button */}
          <Button
            type="button"
            onClick={() => {
              setPasswordError(null);
              setNewPassword('');
              setConfirmPassword('');
              setPasswordDialogOpen(true);
            }}
            className="flex-1 sm:flex-initial bg-[#161F30] hover:bg-[#1C273C] text-teal-300 hover:text-teal-200 border border-teal-500/30 hover:border-teal-500/50 font-bold text-xs sm:text-sm py-2 px-4 rounded-xl transition-all shadow-sm active:scale-95 flex items-center justify-center gap-2"
          >
            <KeyRound className="w-4 h-4 text-teal-400" />
            <span>{t('changePassword')}</span>
          </Button>

          {/* Logout Button */}
          <Button
            type="button"
            onClick={() => setLogoutDialogOpen(true)}
            className="flex-1 sm:flex-initial bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 hover:text-rose-300 border border-rose-500/30 hover:border-rose-500/50 font-bold text-xs sm:text-sm py-2 px-4 rounded-xl transition-all shadow-sm active:scale-95 flex items-center justify-center gap-2"
          >
            <LogOut className="w-4 h-4 text-rose-400" />
            <span>{t('logout')}</span>
          </Button>
        </div>
      </div>

      {/* ================= Dialog: تغيير كلمة السر ================= */}
      <Dialog open={passwordDialogOpen} onOpenChange={setPasswordDialogOpen}>
        <DialogContent className="sm:max-w-md bg-[#0B0F19] border border-teal-500/30 text-white shadow-2xl rounded-2xl" dir="rtl">
          <DialogHeader className="text-right space-y-2">
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

            {/* حقل كلمة المرور الجديدة */}
            <div className="space-y-1.5 text-right">
              <Label className="text-xs font-bold text-slate-300">
                {t('newPasswordLabel')}
              </Label>
              <div className="relative">
                <Input
                  type={showPassword ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="••••••••"
                  className="bg-black/60 border-white/10 focus:border-teal-500/50 text-white text-sm h-11 rounded-xl pl-10 pr-3 font-mono text-right"
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

            {/* حقل تأكيد كلمة المرور */}
            <div className="space-y-1.5 text-right">
              <Label className="text-xs font-bold text-slate-300">
                {t('confirmPasswordLabel')}
              </Label>
              <div className="relative">
                <Input
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="bg-black/60 border-white/10 focus:border-teal-500/50 text-white text-sm h-11 rounded-xl pl-10 pr-3 font-mono text-right"
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
                    <Loader2 className="w-4 h-4 animate-spin ml-2" />
                    {t('updating')}
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4 ml-1.5" />
                    {t('savePassword')}
                  </>
                )}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => setPasswordDialogOpen(false)}
                disabled={submittingPassword}
                className="border-white/10 text-slate-300 hover:bg-white/5 h-10 rounded-xl text-xs"
              >
                {t('cancel')}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ================= Dialog: تأكيد تسجيل الخروج ================= */}
      <Dialog open={logoutDialogOpen} onOpenChange={setLogoutDialogOpen}>
        <DialogContent className="sm:max-w-md bg-[#0B0F19] border border-rose-500/30 text-white shadow-2xl rounded-2xl" dir="rtl">
          <DialogHeader className="text-right space-y-2">
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
                  <Loader2 className="w-4 h-4 animate-spin ml-2" />
                  {t('loggingOut')}
                </>
              ) : (
                <>
                  <LogOut className="w-4 h-4 ml-1.5" />
                  {t('confirmLogout')}
                </>
              )}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => setLogoutDialogOpen(false)}
              disabled={loggingOut}
              className="border-white/10 text-slate-300 hover:bg-white/5 h-10 rounded-xl text-xs"
            >
              {t('back')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

