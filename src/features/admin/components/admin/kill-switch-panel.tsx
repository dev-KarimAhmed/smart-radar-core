'use client';

import React, { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useSovereignControls } from '@/hooks/use-sovereign-controls';
import { useAdminAds } from '@/hooks/use-admin-ads';
import { broadcastSilentPush } from '@/lib/push-notifications';
import { useToast } from '@/hooks/use-toast';
import { styles } from './kill-switch/kill-switch-styles';
import { EmergencyKillSwitchCard } from './kill-switch/emergency-kill-switch-card';
import { AdAnnihilationCard } from './kill-switch/ad-annihilation-card';
import { RegionalBroadcastCard } from './kill-switch/regional-broadcast-card';

export { EmergencyKillSwitchCard } from './kill-switch/emergency-kill-switch-card';
export { AdAnnihilationCard } from './kill-switch/ad-annihilation-card';
export { RegionalBroadcastCard } from './kill-switch/regional-broadcast-card';
export { styles as killSwitchStyles } from './kill-switch/kill-switch-styles';

export function KillSwitchPanel() {
  const tAuto = useTranslations('auto');
  const { toast } = useToast();
  const {
    isRadarActive,
    toggleKillSwitch,
    isTogglingKillSwitch,
    isLoadingControls,
  } = useSovereignControls();

  const { ads, executeAdAnnihilation } = useAdminAds();
  const t = useTranslations('adminTab.killSwitch');

  // Control confirmation gates
  const [gate1, setGate1] = useState(false);
  const [gate2, setGate2] = useState(false);
  const [safetyCleared, setSafetyCleared] = useState(false);

  // Annihilation selector states
  const [selectedAdId, setSelectedAdId] = useState('');
  const [annihilationReason, setAnnihilationReason] = useState('');
  const [isAnnihilating, setIsAnnihilating] = useState(false);

  // Broadcast Alert tool states
  const [broadcastMessage, setBroadcastMessage] = useState('');
  const [selectedDistrict, setSelectedDistrict] = useState(tAuto('key_91559fa2'));
  const [alertType, setAlertType] = useState<'REGIONAL_ALERT' | 'GLOBAL_FREEZE'>('REGIONAL_ALERT');
  const [isBroadcasting, setIsBroadcasting] = useState(false);

  // Active Ads helper for the dropdown filter
  const activeAds = ads.filter((ad) => ad.status === 'active' || ad.status === 'ACTIVE');

  const handleSafetyToggle = () => {
    if (!gate1 || !gate2) {
      toast({
        variant: 'destructive',
        title: t('toasts.safetyLockedTitle'),
        description: t('toasts.safetyLockedDesc'),
      });
      return;
    }
    setSafetyCleared(!safetyCleared);
  };

  const handleExecuteKillSwitch = async () => {
    if (!safetyCleared) return;
    try {
      await toggleKillSwitch();
      setGate1(false);
      setGate2(false);
      setSafetyCleared(false);
    } catch (e) {
      // logged by hook
    }
  };

  const handleAnnihilateAd = async () => {
    if (!selectedAdId) {
      toast({
        variant: 'destructive',
        title: t('toasts.noTargetTitle'),
        description: t('toasts.noTargetDesc'),
      });
      return;
    }
    if (!annihilationReason.trim()) {
      toast({
        variant: 'destructive',
        title: t('toasts.noReasonTitle'),
        description: t('toasts.noReasonDesc'),
      });
      return;
    }

    setIsAnnihilating(true);
    const success = await executeAdAnnihilation(selectedAdId, annihilationReason);
    setIsAnnihilating(false);

    if (success) {
      setSelectedAdId('');
      setAnnihilationReason('');
    }
  };

  const handleSendBroadcast = async () => {
    if (!broadcastMessage.trim()) {
      toast({
        variant: 'destructive',
        title: t('toasts.emptyBroadcastTitle'),
        description: t('toasts.emptyBroadcastDesc'),
      });
      return;
    }

    setIsBroadcasting(true);
    const success = await broadcastSilentPush({
      type: alertType,
      targetDistrict: selectedDistrict === tAuto('key_91559fa2') ? undefined : selectedDistrict,
      message: broadcastMessage,
    });
    setIsBroadcasting(false);

    if (success) {
      toast({
        title: t('toasts.broadcastSuccessTitle'),
        description: t('toasts.broadcastSuccessDesc', { district: selectedDistrict }),
      });
      setBroadcastMessage('');
    }
  };

  return (
    <div className={styles.style143_1} dir="rtl">
      <EmergencyKillSwitchCard
        gate1={gate1}
        setGate1={setGate1}
        gate2={gate2}
        setGate2={setGate2}
        safetyCleared={safetyCleared}
        setSafetyCleared={setSafetyCleared}
        onSafetyToggle={handleSafetyToggle}
        isRadarActive={isRadarActive}
        isLoadingControls={isLoadingControls}
        isTogglingKillSwitch={isTogglingKillSwitch}
        onExecuteKillSwitch={handleExecuteKillSwitch}
      />

      <div className={styles.style274_45}>
        <div className={styles.style275_46}>
          <AdAnnihilationCard
            activeAds={activeAds}
            selectedAdId={selectedAdId}
            setSelectedAdId={setSelectedAdId}
            annihilationReason={annihilationReason}
            setAnnihilationReason={setAnnihilationReason}
            isAnnihilating={isAnnihilating}
            onAnnihilateAd={handleAnnihilateAd}
          />
        </div>

        <div className={styles.style341_64}>
          <RegionalBroadcastCard
            selectedDistrict={selectedDistrict}
            setSelectedDistrict={setSelectedDistrict}
            alertType={alertType}
            setAlertType={setAlertType}
            broadcastMessage={broadcastMessage}
            setBroadcastMessage={setBroadcastMessage}
            isBroadcasting={isBroadcasting}
            onSendBroadcast={handleSendBroadcast}
          />
        </div>
      </div>
    </div>
  );
}
