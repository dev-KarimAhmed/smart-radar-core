'use client';

import dynamic from 'next/dynamic';
import { useState, type ReactNode } from 'react';
import {
  Bell,
  Languages,
  Loader2,
  Minus,
  RadioTower,
  Settings,
  Shield,
  TrendingDown,
  TrendingUp,
} from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Sheet, SheetContent, SheetDescription, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Switch } from '@/components/ui/switch';
import { useAuth } from '@/hooks/use-auth';
import { useDashboardLanguage } from '@/hooks/use-dashboard-language';
import { useDriverOperations } from '@/hooks/use-driver-operations';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

const DriverPricingCard = dynamic(
  () => import('@/components/dashboard/driver-pricing-card').then((module) => module.DriverPricingCard),
  { ssr: false },
);

const styles = {
  root: 'sticky top-0 z-50 flex w-full flex-col shadow-xl',
  primary: 'flex h-16 items-center justify-between border-b border-white/[0.06] bg-[#0A0F1D]/80 px-4 shadow-[0_4px_30px_rgba(0,0,0,0.3)] backdrop-blur-xl',
  spacer: 'h-10 w-10',
  menuButton: 'relative h-10 w-10 rounded-full p-0 shadow-sm transition-transform hover:scale-105',
  menuAvatar: 'h-10 w-10 border-2 border-white/20',
  menuFallback: 'bg-black/50 font-bold text-white',
  menuContent: 'w-[288px] border-white/[0.06] bg-[#0A0F1D]/95 p-0 backdrop-blur-xl sm:max-w-xs',
  actions: 'flex items-center gap-4',
  notification: 'relative h-10 w-10 text-white/70 hover:bg-white/10',
  language: 'ms-auto h-8 shrink-0 gap-1 rounded-lg border border-[#14B8A6]/25 bg-[#14B8A6]/10 px-2 text-[10px] font-black text-[#14F5D5] hover:bg-[#14B8A6]/20 hover:text-[#14F5D5]',
  smallIcon: 'h-3.5 w-3.5',
  icon: 'h-5 w-5',
  pulseLoading: 'h-5 w-5 animate-spin text-white/50',
  pulse: 'flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-bold',
  pulseHighDemand: 'border-emerald-500/50 bg-emerald-950/50 text-emerald-400',
  pulseHighSupply: 'border-red-500/50 bg-red-950/50 text-red-400',
  pulseBalanced: 'border-gray-500/50 bg-gray-950/50 text-gray-400',
  pulseIcon: 'h-4 w-4',
  pulseLabel: 'hidden sm:inline',
  cabin: 'flex h-16 items-center justify-between px-2 transition-all duration-500 md:px-4',
  cabinActive: 'border-b border-primary/50 bg-primary text-primary-foreground shadow-lg shadow-primary/20',
  cabinBusy: 'border-b border-[hsl(var(--busy))]/50 bg-[hsl(var(--busy))] text-black shadow-lg',
  cabinIdle: 'border-b border-white/10 bg-background/95',
  status: 'flex items-center gap-2 rounded-full bg-black/20 p-1.5 backdrop-blur-sm',
  switch: 'data-[state=checked]:bg-white',
  statusLabel: 'cursor-pointer px-2 text-sm font-bold',
  driverActions: 'flex items-center gap-1 sm:gap-2',
  operations: 'flex h-10 cursor-pointer items-center gap-1.5 rounded-full border border-[#10b981]/20 bg-[#10b981]/10 px-3 text-xs font-black text-[#00ffcc] shadow-sm transition-all hover:bg-[#10b981]/20 active:scale-95',
  shield: 'h-4 w-4 animate-pulse text-[#00ffcc]',
  roundAction: 'h-10 w-10 rounded-full hover:bg-black/20',
  srOnly: 'sr-only',
} as const;

const pulseMap = {
  high_demand: { icon: TrendingUp, text: 'طلب عالٍ', className: styles.pulseHighDemand },
  high_supply: { icon: TrendingDown, text: 'منافسة شديدة', className: styles.pulseHighSupply },
  balanced: { icon: Minus, text: 'سوق مستقر', className: styles.pulseBalanced },
} as const;

function PulseIndicator() {
  const { user } = useAuth();
  const driverOps = useDriverOperations();
  const pulseData = driverOps?.pulseData || [];

  if (driverOps?.loadingPulse) return <Loader2 className={styles.pulseLoading} />;
  if (!user?.district) return null;

  const trend = pulseData.find((pulse) => pulse.id === user.district)?.trend || 'balanced';
  const pulseInfo = pulseMap[trend as keyof typeof pulseMap] || pulseMap.balanced;
  const Icon = pulseInfo.icon;

  return (
    <div className={cn(styles.pulse, pulseInfo.className)}>
      <Icon className={styles.pulseIcon} />
      <span className={styles.pulseLabel}>{pulseInfo.text}</span>
    </div>
  );
}

function DriverCabin() {
  const driverOps = useDriverOperations();
  const driverStatus = driverOps?.driverStatus || 'idle';
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const isDriverBusy = driverStatus === 'busy' || driverStatus === 'rating';
  const cabinStatusStyle =
    driverStatus === 'active' ? styles.cabinActive : isDriverBusy ? styles.cabinBusy : styles.cabinIdle;

  return (
    <>
      <div className={cn(styles.cabin, cabinStatusStyle)}>
        <div className={styles.status}>
          {driverOps?.toggleDriverStatus ? (
            <Switch
              id="driver-status-switch"
              checked={driverStatus === 'active'}
              onCheckedChange={(checked) => driverOps.toggleDriverStatus?.(checked ? 'active' : 'idle')}
              disabled={isDriverBusy}
              className={styles.switch}
            />
          ) : null}
          <Label htmlFor="driver-status-switch" className={styles.statusLabel}>
            {driverStatus === 'active' ? 'نشط' : isDriverBusy ? 'بمهمة' : 'خامل'}
          </Label>
        </div>

        <PulseIndicator />

        <div className={styles.driverActions}>
          <Button
            variant="ghost"
            size="sm"
            className={styles.operations}
            onClick={() => window.dispatchEvent(new CustomEvent('open-captain-dashboard'))}
          >
            <Shield className={styles.shield} />
            <span>لوحة العمليات</span>
          </Button>
          {driverOps?.toggleRequestList ? (
            <Button
              variant="ghost"
              size="icon"
              className={styles.roundAction}
              onClick={() => driverOps.toggleRequestList?.(true)}
            >
              <RadioTower className={styles.icon} />
              <span className={styles.srOnly}>Open Radar</span>
            </Button>
          ) : null}
          <Button
            variant="ghost"
            size="icon"
            className={styles.roundAction}
            onClick={() => setIsSettingsOpen(true)}
          >
            <Settings className={styles.icon} />
            <span className={styles.srOnly}>Open Settings</span>
          </Button>
        </div>
      </div>
      {isSettingsOpen ? (
        <DriverPricingCard
          mode="setup"
          onConfirm={() => setIsSettingsOpen(false)}
          onCancel={() => setIsSettingsOpen(false)}
        />
      ) : null}
    </>
  );
}

function initials(name = '') {
  const names = name.trim().split(/\s+/);
  if (names.length > 1) return `${names[0]?.[0] || ''}${names[1]?.[0] || ''}`;
  return name.substring(0, 2);
}

export function AppHeader({ sidebar }: { sidebar?: ReactNode }) {
  const { user, isCaptain } = useAuth();
  const { toast } = useToast();
  const { isArabic, toggleLanguage } = useDashboardLanguage();

  return (
    <div className={styles.root}>
      <header className={styles.primary}>
        {sidebar && user ? (
          <Sheet>
            <SheetTrigger asChild>
              <Button
                aria-label="فتح قائمة الحساب"
                className={styles.menuButton}
                size="icon"
                variant="ghost"
              >
                <Avatar className={styles.menuAvatar}>
                  <AvatarFallback className={styles.menuFallback}>{initials(user.name)}</AvatarFallback>
                </Avatar>
              </Button>
            </SheetTrigger>
            <SheetContent className={styles.menuContent} side="right">
              <SheetTitle className={styles.srOnly}>القائمة</SheetTitle>
              <SheetDescription className={styles.srOnly}>قائمة حساب الراكب</SheetDescription>
              {sidebar}
            </SheetContent>
          </Sheet>
        ) : <div className={styles.spacer} />}
        <div className={styles.actions}>
          <Button
            size="icon"
            variant="ghost"
            className={styles.notification}
            onClick={() => toast({ title: 'التنبيهات', description: 'لا توجد تنبيهات جديدة حالياً.' })}
          >
            <Bell className={styles.icon} />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={toggleLanguage}
            aria-label={isArabic ? 'Switch to English' : 'التبديل إلى العربية'}
            title={isArabic ? 'English' : 'العربية'}
            className={styles.language}
          >
            <Languages className={styles.smallIcon} />
            <span>{isArabic ? 'EN' : 'ع'}</span>
          </Button>
        </div>
      </header>
      {user && isCaptain ? <DriverCabin /> : null}
    </div>
  );
}
