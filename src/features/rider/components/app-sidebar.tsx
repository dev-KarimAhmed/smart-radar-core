'use client';

import { Clock, Heart, History, LogOut, MessageSquare, ShieldCheck, UserCircle, X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { SheetClose } from '@/components/ui/sheet';
import { useAuth } from '@/hooks/use-auth';
import { calculateRiderRank } from '@/core/utils';
import { cn } from '@/lib/utils';
import { useRiderSidebarRadar } from '../hooks/use-rider-sidebar-radar';

const styles = {
  root: 'flex h-full flex-col bg-[#0A0F1D]',
  header: 'flex shrink-0 items-center justify-between border-b border-white/[0.06] bg-[#060B18] p-5',
  role: 'border-[#14B8A6]/30 bg-[#14B8A6]/10 px-3 py-1 font-bold text-[#14B8A6] shadow-sm',
  brand: 'flex items-center gap-2',
  brandTitle: 'text-2xl font-black tracking-widest text-white drop-shadow-md',
  brandIcon: 'h-7 w-7 text-[#14B8A6]',
  close: 'h-10 w-10 rounded-full text-gray-400 hover:bg-white/10 hover:text-white',
  closeIcon: 'h-6 w-6',
  scroll: 'w-full flex-1',
  profile: 'mb-6 flex flex-col items-center pt-6',
  avatar: 'mb-3 flex h-20 w-20 items-center justify-center rounded-full border-2 border-[#14B8A6]/30 bg-[#060B18] shadow-lg shadow-[#14B8A6]/10',
  avatarIcon: 'h-12 w-12 text-[#14B8A6]',
  name: 'text-xl font-black tracking-wide text-white',
  phone: 'mt-1 font-mono text-sm text-[#14B8A6]/80',
  content: 'mx-auto w-full max-w-sm space-y-6',
  rating: 'border-y border-[#14B8A6]/15 bg-[#14B8A6]/10 px-4 py-2',
  ratingRow: 'flex items-center justify-between',
  ratingLabel: 'text-[10px] font-black uppercase tracking-tighter text-[#14B8A6]',
  ratingBadge: 'border-[#14B8A6]/40 text-[10px] text-[#14B8A6]',
  ratingBody: 'mt-1 text-xs text-white/70',
  buffer: 'mx-4 animate-pulse rounded-lg border border-amber-500/30 bg-amber-950/40 p-3',
  bufferTitle: 'mb-2 flex items-center gap-2 text-amber-400',
  bufferIcon: 'h-4 w-4',
  bufferHeading: 'text-xs font-bold',
  bufferBody: 'mb-2 text-[10px] text-white/60',
  bufferCall: 'h-7 w-full border-amber-500/50 text-[10px] text-amber-400',
  operations: 'space-y-3 px-5',
  sectionTitle: 'mb-2 flex items-center justify-end gap-2 px-1 text-white',
  sectionText: 'text-sm font-bold tracking-wider',
  operationLink: 'block w-full',
  operationButton: 'h-14 w-full justify-end gap-3 rounded-xl border border-transparent text-white shadow-sm transition-all hover:border-[#14B8A6]/15 hover:bg-[#14B8A6]/10 hover:text-[#14B8A6]',
  operationText: 'text-base font-bold',
  operationIcon: 'h-5 w-5 text-[#14B8A6]/70',
  favorites: 'mt-6 px-5',
  favoritesLabel: 'flex items-center justify-end gap-2 text-xs font-bold text-muted-foreground',
  heart: 'h-4 w-4 text-red-500',
  favoriteList: 'mt-2 space-y-2',
  favoriteItem: 'flex items-center justify-between rounded-lg border border-white/10 bg-muted/30 px-3 py-2 text-sm text-white/80',
  favoriteName: 'font-bold',
  favoriteStatus: 'flex items-center gap-2',
  favoriteStatusText: 'text-xs capitalize',
  favoriteStatusDot: 'h-2 w-2 rounded-full',
  empty: 'py-4 text-center text-xs text-muted-foreground',
  skeleton: 'h-8 animate-pulse rounded-lg bg-muted/30',
  footer: 'mt-auto w-full shrink-0 space-y-3 border-t border-white/[0.06] bg-[#060B18] p-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))] text-center',
  footerText: 'text-center text-xs tracking-wide text-[#94A3B8]',
  logout: 'flex h-14 w-full cursor-pointer items-center justify-center gap-3 rounded-xl bg-red-600/90 text-lg font-black tracking-widest shadow-[0_0_15px_rgba(239,68,68,0.3)] transition-all hover:bg-red-500',
  logoutIcon: 'h-5 w-5',
} as const;

function statusClass(status?: string) {
  if (status === 'active') return 'bg-green-500';
  if (status === 'busy' || status === 'rating') return 'bg-yellow-500';
  return 'bg-gray-500';
}

function RiderFavoriteDrivers() {
  const { nearbyFavorites, isLoading } = useRiderSidebarRadar();

  if (isLoading) {
    return (
      <div className={styles.favoriteList}>
        {[0, 1].map((item) => <div className={styles.skeleton} key={item} />)}
      </div>
    );
  }

  if (nearbyFavorites.length === 0) {
    return <p className={styles.empty}>لا يوجد سائقون مفضلون بالقرب منك حالياً.</p>;
  }

  return (
    <div className={styles.favoriteList}>
      {nearbyFavorites.map((driver) => (
        <div className={styles.favoriteItem} key={driver.uid}>
          <span className={styles.favoriteName}>{driver.name}</span>
          <div className={styles.favoriteStatus}>
            <span className={styles.favoriteStatusText}>{driver.status || 'غير متاح'}</span>
            <span className={cn(styles.favoriteStatusDot, statusClass(driver.status))} />
          </div>
        </div>
      ))}
    </div>
  );
}

export function AppSidebar() {
  const { logout, user } = useAuth();

  if (!user || user.role !== 'rider') return null;

  return (
    <nav aria-label="قائمة حساب الراكب" className={styles.root}>
      <div className={styles.header}>
        <Badge className={styles.role} variant="outline">راكب</Badge>
        <div className={styles.brand}>
          <h2 className={styles.brandTitle}>رادار</h2>
          <ShieldCheck className={styles.brandIcon} />
        </div>
        <SheetClose asChild>
          <Button aria-label="إغلاق قائمة الحساب" className={styles.close} size="icon" variant="ghost">
            <X className={styles.closeIcon} />
          </Button>
        </SheetClose>
      </div>

      <ScrollArea className={styles.scroll} type="scroll">
        <div className={styles.profile}>
          <div className={styles.avatar}><UserCircle className={styles.avatarIcon} /></div>
          <h3 className={styles.name}>{user.name || 'مستخدم جديد'}</h3>
          <p className={styles.phone}>{user.phone}</p>
        </div>

        <div className={styles.content}>
          <div className={styles.rating}>
            <div className={styles.ratingRow}>
              <span className={styles.ratingLabel}>تقييم الحساب</span>
              <Badge className={styles.ratingBadge} variant="outline">
                {calculateRiderRank(user.ratingSum, user.ratingCount)}
              </Badge>
            </div>
            <p className={styles.ratingBody}>تقييمك جيد كراكب ملتزم.</p>
          </div>

          {user.isBufferActive && user.lastTripBuffer ? (
            <div className={styles.buffer}>
              <div className={styles.bufferTitle}>
                <Clock className={styles.bufferIcon} />
                <span className={styles.bufferHeading}>تواصل بعد الرحلة (24 ساعة)</span>
              </div>
              <p className={styles.bufferBody}>يمكنك التواصل مع سائق الرحلة الأخيرة عند الحاجة.</p>
              <Button asChild className={styles.bufferCall} size="sm" variant="outline">
                <a href={`tel:${user.lastTripBuffer.driverPhone}`}>
                  اتصال بالسائق: {user.lastTripBuffer.driverName}
                </a>
              </Button>
            </div>
          ) : null}

          <div className={styles.operations}>
            <div className={styles.sectionTitle}><span className={styles.sectionText}>العمليات</span></div>
            <SheetClose asChild>
              <a className={styles.operationLink} href="#history">
                <Button className={styles.operationButton} variant="ghost">
                  <span className={styles.operationText}>سجل الرحلات السابقة</span>
                  <History className={styles.operationIcon} />
                </Button>
              </a>
            </SheetClose>
            <SheetClose asChild>
              <a className={styles.operationLink} href="#messages">
                <Button className={styles.operationButton} variant="ghost">
                  <span className={styles.operationText}>رسائل الرادار</span>
                  <MessageSquare className={styles.operationIcon} />
                </Button>
              </a>
            </SheetClose>
          </div>

          <div className={styles.favorites}>
            <span className={styles.favoritesLabel}>
              <Heart className={styles.heart} />
              السائقون المفضلون
            </span>
            <RiderFavoriteDrivers />
          </div>
        </div>
      </ScrollArea>

      <div className={styles.footer}>
        <div className={styles.footerText}>منصة وساطة مستقلة لطلب الرحلات</div>
        <Button className={styles.logout} onClick={() => void logout()} variant="destructive">
          <span>تسجيل الخروج</span>
          <LogOut className={styles.logoutIcon} />
        </Button>
      </div>
    </nav>
  );
}
