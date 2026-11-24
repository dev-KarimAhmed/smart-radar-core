'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Clock, Download, Heart, Languages, LogOut, UserCircle, X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { SheetClose } from '@/components/ui/sheet';
import { useAuth } from '@/hooks/use-auth';
import { useDashboardLanguage } from '@/hooks/use-dashboard-language';
import { usePwaInstall } from '@/hooks/usePwaInstall';
import { SovereignPwaInstallModal } from '@/components/sovereign-pwa-install-modal';
import { calculateRiderRank } from '@/core/utils';
import { formatTelUri } from '@/lib/utils';
import { getLandingPageUrl } from '@/lib/constants';
import { useNotifications } from '@/shared/hooks/use-notifications';
import { useTranslations } from "next-intl";
import { styles } from './sidebar/app-sidebar-styles';
import { RiderFavoriteDrivers } from './sidebar/rider-favorite-drivers';
import { RiderSidebarOperations } from './sidebar/rider-sidebar-operations';
import { SocialLinks } from '@/components/social-links';

export function AppSidebar({ isCritical = false }: { isCritical?: boolean } = {}) {
  const tAuto = useTranslations('auto');
  const { logout, user } = useAuth();
  const { hasUnread } = useNotifications();
  const { isArabic, toggleLanguage } = useDashboardLanguage();
  const { canShowInstallButton, canPromptNative, triggerNativeInstall } = usePwaInstall('rider');
  const [isInstallModalOpen, setIsInstallModalOpen] = useState(false);

  if (!user || user.role !== 'rider') return null;

  return (
    <nav aria-label={tAuto('key_aa21658a')} className={styles.root}>
      <div className={styles.header}>
        <Badge className={styles.role} variant="outline">{tAuto('key_3c26d043')}</Badge>
        <div className={styles.brand}>
          <a
            href={getLandingPageUrl()}
            className="inline-flex items-center cursor-pointer hover:opacity-90 transition-opacity"
          >
            <Image
              src="/icons/logo-header.png"
              alt="Radar"
              width={585}
              height={152}
              priority
              className={styles.brandLogo}
            />
          </a>
          <h2 className="text-sm font-black text-white">
            {isArabic ? (
              <>
                شبكة <span className="text-[#14F5D5] font-black drop-shadow-[0_0_8px_rgba(20,245,213,0.35)]">بينكم</span> للإعلان الرقمي
              </>
            ) : (
              <>
                <span className="text-[#14F5D5] font-black">Bynkcom</span> Ad Network
              </>
            )}
          </h2>
        </div>
        <SheetClose asChild>
          <Button aria-label={tAuto('key_f050ab3c')} className={styles.close} size="icon" variant="ghost">
            <X className={styles.closeIcon} />
          </Button>
        </SheetClose>
      </div>

      <ScrollArea className={styles.scroll} type="scroll">
        <div className={styles.profile}>
          <div className={styles.avatar}><UserCircle className={styles.avatarIcon} /></div>
          <h3 className={styles.name}>{user.name || (isArabic ? 'مستخدم' : 'Rider')}</h3>
          <p className={styles.phone}>{user.phone}</p>

          <div className="mt-4 flex items-center justify-center gap-2 flex-wrap px-4">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={toggleLanguage}
              className="h-8 gap-1.5 rounded-xl border border-[#14B8A6]/30 bg-[#14B8A6]/10 px-3 text-xs font-black text-[#14F5D5] hover:bg-[#14B8A6]/20 transition-all cursor-pointer"
            >
              <Languages className="h-4 w-4" />
              <span>{isArabic ? 'English (EN)' : 'العربية'}</span>
            </Button>

            {canShowInstallButton && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  if (canPromptNative) void triggerNativeInstall();
                  else setIsInstallModalOpen(true);
                }}
                className="h-8 gap-1.5 rounded-xl border border-[#14B8A6]/30 bg-[#14B8A6]/10 px-3 text-xs font-black text-[#14F5D5] hover:bg-[#14B8A6]/20 transition-all cursor-pointer"
              >
                <Download className="h-4 w-4" />
                <span>{isArabic ? 'تثبيت التطبيق' : 'Install App'}</span>
              </Button>
            )}
          </div>
        </div>

        <div className={styles.content}>
          <div className={styles.rating}>
            <div className={styles.ratingRow}>
              <span className={styles.ratingLabel}>{tAuto('key_fcd4e169')}</span>
              <Badge className={styles.ratingBadge} variant="outline">
                {calculateRiderRank(user.ratingSum, user.ratingCount)}
              </Badge>
            </div>
            <p className={styles.ratingBody}>{tAuto('key_841c52c1')}</p>
          </div>

          {user.isBufferActive && user.lastTripBuffer ? (
            <div className={styles.buffer}>
              <div className={styles.bufferTitle}>
                <Clock className={styles.bufferIcon} />
                <span className={styles.bufferHeading}>{tAuto('key_cee0c805')}</span>
              </div>
              <p className={styles.bufferBody}>{tAuto('key_771c5823')}</p>
              <Button asChild className={styles.bufferCall} size="sm" variant="outline">
                <a href={formatTelUri(user.lastTripBuffer.driverPhone)}>
                  {tAuto('key_3b04938d')} {user.lastTripBuffer.driverName}
                </a>
              </Button>
            </div>
          ) : null}

          <RiderSidebarOperations isArabic={isArabic} hasUnread={hasUnread} />

          <div className={styles.favorites}>
            <span className={styles.favoritesLabel}>
              <Heart className={styles.heart} />
              {tAuto('key_0ae33a07')}
            </span>
            <RiderFavoriteDrivers />
          </div>
        </div>
      </ScrollArea>

      <div className={styles.footer}>
        <SocialLinks variant="compact" isArabic={isArabic} className="mb-2.5" />
        <div className={styles.footerText}>{tAuto('key_89b66bbd')}</div>
        <Button className={styles.logout} onClick={() => void logout()} variant="destructive">
          <span>{tAuto('key_5c4e4796')}</span>
          <LogOut className={styles.logoutIcon} />
        </Button>
      </div>

      <SovereignPwaInstallModal
        isOpen={isInstallModalOpen}
        onClose={() => setIsInstallModalOpen(false)}
        isArabic={isArabic}
        role="rider"
      />
    </nav>
  );
}
