'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/hooks/use-auth';
import { adminFetch } from '@/features/admin/lib/admin-api-client';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { LogOut, KeyRound, Languages, BarChart3 } from 'lucide-react';
import { AdminNotificationCenter } from './admin-notification-center';
import { useTranslations } from 'next-intl';
import { useDashboardLanguage } from '@/hooks/use-dashboard-language';
import { AdminChangePasswordDialog } from './top-bar/admin-change-password-dialog';
import { AdminLogoutDialog } from './top-bar/admin-logout-dialog';
import { AdminIdentityBadge } from './top-bar/admin-identity-badge';

export function AdminTopBar() {
  const t = useTranslations('adminTopBar');
  const { user } = useAuth();
  const { toast } = useToast();
  const { direction, isArabic, toggleLanguage } = useDashboardLanguage();

  const isSovereignPrimary =
    user?.uid === '70b4a26f-10ac-4888-8df6-c3a5ad824b8a' ||
    user?.phone === '+201551981922' ||
    user?.phone === '+201551981977' ||
    user?.phone === '201551981977';

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

  const adminDisplayName = isSovereignPrimary
    ? t('sovereignAdmin')
    : !isArabic && user?.name && (/[\u0600-\u06FF]/.test(user.name) && (user.name.includes('المدير') || user.name.includes('سيادي')))
    ? t('sovereignAdmin')
    : user?.name || t('sovereignAdmin');

  // Dialog States
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);
  const [logoutDialogOpen, setLogoutDialogOpen] = useState(false);

  return (
    <>
      {/* Top Header Card */}
      <div className="relative overflow-hidden rounded-2xl border border-teal-500/20 bg-[#0B0F19]/95 p-4 sm:p-5 shadow-2xl backdrop-blur-xl mb-6 flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Subtle decorative glow */}
        <div className="absolute top-0 right-0 w-64 h-24 bg-teal-500/5 blur-3xl pointer-events-none rounded-full" />
        <div className="absolute bottom-0 left-0 w-64 h-24 bg-rose-500/5 blur-3xl pointer-events-none rounded-full" />

        {/* Right Section: Identity & Status */}
        <AdminIdentityBadge
          adminDisplayName={adminDisplayName}
          adminRank={adminRank}
          isArabic={isArabic}
          userPhone={user?.phone}
          userSerialId={user?.serial_id}
          userUid={user?.uid}
        />

        {/* Left Section: Action Buttons */}
        <div className="flex items-center gap-2.5 w-full md:w-auto justify-end flex-wrap">
          {/* General Admin Exclusive Analytics Screen Button */}
          {adminRank === 'GENERAL_ADMIN' && (
            <Button
              asChild
              className="flex-1 sm:flex-initial bg-gradient-to-r from-teal-500/20 to-emerald-500/20 hover:from-teal-500/30 hover:to-emerald-500/30 text-[#14F5D5] border border-[#14B8A6]/45 hover:border-[#14F5D5] font-black text-xs sm:text-sm py-2 px-3.5 sm:px-4 rounded-xl transition-all shadow-[0_0_16px_rgba(20,184,166,0.18)] active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
            >
              <Link href="/admin/analytics">
                <BarChart3 className="w-4 h-4 text-[#14F5D5] shrink-0" />
                <span>{isArabic ? 'الإحصائيات والمؤشرات' : 'Analytics'}</span>
              </Link>
            </Button>
          )}

          {/* Sovereign Notification Center */}
          <AdminNotificationCenter />

          {/* Language Switcher */}
          <Button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              const targetLang = isArabic ? 'en' : 'ar';
              toggleLanguage();
              toast({
                title: targetLang === 'ar' ? '🌐 تم التحويل إلى العربية' : '🌐 Switched to English',
                description:
                  targetLang === 'ar'
                    ? 'واجهة لوحة الإدارة تعمل الآن باللغة العربية.'
                    : 'Admin dashboard interface is now in English.',
                duration: 2500,
              });
            }}
            title={t('switchLanguage')}
            className="flex-1 sm:flex-initial bg-[#161F30] hover:bg-[#1C273C] text-cyan-300 hover:text-cyan-200 border border-cyan-500/30 hover:border-cyan-500/50 font-bold text-xs sm:text-sm py-2 px-3 sm:px-3.5 rounded-xl transition-all shadow-sm active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer select-none"
          >
            <Languages className="w-4 h-4 text-cyan-400 shrink-0" />
            <span>{t('languageLabel')}</span>
          </Button>

          {/* Change Password Button */}
          <Button
            type="button"
            onClick={() => setPasswordDialogOpen(true)}
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

      {/* Dialog: تغيير كلمة السر */}
      <AdminChangePasswordDialog
        open={passwordDialogOpen}
        onOpenChange={setPasswordDialogOpen}
        direction={direction}
        isArabic={isArabic}
        userId={user?.uid}
      />

      {/* Dialog: تأكيد تسجيل الخروج */}
      <AdminLogoutDialog
        open={logoutDialogOpen}
        onOpenChange={setLogoutDialogOpen}
        direction={direction}
        isArabic={isArabic}
      />
    </>
  );
}
