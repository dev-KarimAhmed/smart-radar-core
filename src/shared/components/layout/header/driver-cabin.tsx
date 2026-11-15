'use client';

import dynamic from 'next/dynamic';
import { useState } from 'react';
import {
  Loader2,
  Minus,
  RadioTower,
  Settings,
  Shield,
  TrendingDown,
  TrendingUp,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useAuth } from '@/hooks/use-auth';
import { useDriverOperations } from '@/hooks/use-driver-operations';
import { cn } from '@/lib/utils';
import { useTranslations } from 'next-intl';

const DriverPricingCard = dynamic(
  () => import('@/components/dashboard/driver-pricing-card').then((module) => module.DriverPricingCard),
  { ssr: false },
);

const styles = {
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
  icon: 'h-5 w-5',
  srOnly: 'sr-only',
} as const;

const pulseMap = {
  high_demand: { icon: TrendingUp, text: 'طلب عالٍ', className: styles.pulseHighDemand },
  high_supply: { icon: TrendingDown, text: 'منافسة شديدة', className: styles.pulseHighSupply },
  balanced: { icon: Minus, text: 'سوق مستقر', className: styles.pulseBalanced },
} as const;

export function PulseIndicator() {
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

export function DriverCabin() {
  const tAuto = useTranslations('auto');
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
            {driverStatus === 'active' ? tAuto('key_8caaf953') : isDriverBusy ? tAuto('key_628d6c16') : tAuto('key_c813d1e8')}
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
            <span>{tAuto('key_36099fc4')}</span>
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
