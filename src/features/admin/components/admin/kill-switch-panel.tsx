'use client';

import React, { useState } from 'react';
import { useSovereignControls } from '@/hooks/use-sovereign-controls';
import { useAdminAds } from '@/hooks/use-admin-ads';
import { broadcastSilentPush } from '@/lib/push-notifications';
import { useToast } from '@/hooks/use-toast';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertTriangle,
  Loader2,
  Power,
  PowerOff,
  ShieldAlert,
  Flame,
  Send,
  Sliders,
  Clock,
  Sparkles,
  MapPin,
  Lock,
  Unlock,
  Radio,
  EyeOff
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTranslations } from 'next-intl';
import { styles } from './kill-switch-panel-styles';


export function KillSwitchPanel() {
    const tAuto = useTranslations('auto');
  const { toast } = useToast();
  const {
    isRadarActive,
    toggleKillSwitch,
    isTogglingKillSwitch,
    isLoadingControls
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
  const activeAds = ads.filter(ad => ad.status === 'active' || ad.status === 'ACTIVE');

  const handleSafetyToggle = () => {
    if (!gate1 || !gate2) {
      toast({
        variant: 'destructive',
        title: t('toasts.safetyLockedTitle'),
        description: t('toasts.safetyLockedDesc')
      });
      return;
    }
    setSafetyCleared(!safetyCleared);
  };

  const handleExecuteKillSwitch = async () => {
    if (!safetyCleared) return;
    try {
      await toggleKillSwitch();
      // Reset safety gates after toggle
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
        description: t('toasts.noTargetDesc')
      });
      return;
    }
    if (!annihilationReason.trim()) {
      toast({
        variant: 'destructive',
        title: t('toasts.noReasonTitle'),
        description: t('toasts.noReasonDesc')
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
        description: t('toasts.emptyBroadcastDesc')
      });
      return;
    }

    setIsBroadcasting(true);
    const success = await broadcastSilentPush({
      type: alertType,
      targetDistrict: selectedDistrict === tAuto('key_91559fa2') ? undefined : selectedDistrict,
      message: broadcastMessage
    });
    setIsBroadcasting(false);

    if (success) {
      toast({
        title: t('toasts.broadcastSuccessTitle'),
        description: t('toasts.broadcastSuccessDesc', { district: selectedDistrict })
      });
      setBroadcastMessage('');
    }
  };

  return (
    <div className={styles.style143_1} dir="rtl">
      {/* ⚠️ GATE-GUARDED MASTER EMERGENCY KILL SWITCH */}
      <Card className={styles.style145_2}>
        <CardHeader className={styles.style146_3}>
          <CardTitle className={styles.style147_4}>
            <ShieldAlert className={styles.style148_5} />
            {t('emergency.title')}
          </CardTitle>
          <CardDescription className={styles.style151_6}>
            {t('emergency.description')}
          </CardDescription>
        </CardHeader>
        <CardContent className={styles.style155_7}>
          <div className={styles.style156_8}>
            {/* Safety Confirmation Checklist */}
            <div className={styles.style158_9}>
              <span className={styles.style159_10}>{t('emergency.safetyLabel')}</span>

              <div className={styles.style161_11}>
                <label className={cn(
                  styles.style163_12,
                  gate1 ? styles.style164_13 : styles.style164_14
                )}>
                  <input
                    type="checkbox"
                    checked={gate1}
                    onChange={(e) => {
                      setGate1(e.target.checked);
                      if (!e.target.checked) setSafetyCleared(false);
                    }}
                    className={styles.style173_15}
                  />
                  <span>{t('emergency.gate1')}</span>
                </label>

                <label className={cn(
                  styles.style179_16,
                  gate2 ? styles.style180_17 : styles.style180_18
                )}>
                  <input
                    type="checkbox"
                    checked={gate2}
                    onChange={(e) => {
                      setGate2(e.target.checked);
                      if (!e.target.checked) setSafetyCleared(false);
                    }}
                    className={styles.style189_19}
                  />
                  <span>{t('emergency.gate2')}</span>
                </label>
              </div>

              {/* Step 3: Unlock button */}
              <Button
                onClick={handleSafetyToggle}
                disabled={!gate1 || !gate2}
                className={cn(
                  styles.style200_20,
                  safetyCleared
                    ? styles.style202_21
                    : styles.style203_22
                )}
              >
                {safetyCleared ? (
                  <span className={styles.style207_23}>
                    <Unlock className={styles.style208_24} />
                    {t('emergency.unlockedBtn')}
                  </span>
                ) : (
                  <span className={styles.style212_25}>
                    <Lock className={styles.style213_26} />
                    {t('emergency.lockBtn')}
                  </span>
                )}
              </Button>
            </div>

            {/* Lethal Red Execution Button */}
            <div className={styles.style221_27}>
              <div className={styles.style222_28}>
                <span className={styles.style223_29}>{t('emergency.radarStatus')}</span>
                <div className={styles.style224_30}>
                  <span className={cn(
                    styles.style226_31,
                    isRadarActive ? styles.style227_32 : styles.style227_33
                  )} />
                  <span className={cn(
                    styles.style230_34,
                    isRadarActive ? styles.style231_35 : styles.style231_36
                  )}>
                    {isRadarActive ? t('emergency.active') : t('emergency.suspended')}
                  </span>
                </div>
              </div>

              <Button
                onClick={handleExecuteKillSwitch}
                disabled={isLoadingControls || isTogglingKillSwitch || !safetyCleared}
                className={cn(
                  styles.style242_37,
                  !safetyCleared
                    ? styles.style244_38
                    : isRadarActive
                      ? styles.style246_39
                      : styles.style247_40
                )}
              >
                {isLoadingControls ? (
                  <Loader2 className={styles.style251_41} />
                ) : isRadarActive ? (
                  <>
                    <PowerOff className={styles.style254_42} />
                    {t('emergency.suspendBtn')}
                  </>
                ) : (
                  <>
                    <Power className={styles.style259_43} />
                    {t('emergency.resumeBtn')}
                  </>
                )}
              </Button>

              <span className={styles.style265_44}>
                {t('emergency.warning')}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 💥 AD ANNIHILATION AND SOVEREIGN PURGE (Digital Annihilation) */}
      <div className={styles.style274_45}>
        <div className={styles.style275_46}>
          <Card className={styles.style276_47}>
            <CardHeader className={styles.style277_48}>
              <CardTitle className={styles.style278_49}>
                <Flame className={styles.style279_50} />
                {t('annihilation.title')}
              </CardTitle>
              <CardDescription className={styles.style282_51}>
                {t('annihilation.description')}
              </CardDescription>
            </CardHeader>
            <CardContent className={styles.style286_52}>
              {/* Select Active Ads dropdown */}
              <div className={styles.style288_53}>
                <Label className={styles.style289_54}>{t('annihilation.selectTarget')}</Label>
                <Select value={selectedAdId} onValueChange={setSelectedAdId}>
                  <SelectTrigger className={styles.style293_55}>
                    <SelectValue placeholder={t('annihilation.selectPlaceholder')} />
                  </SelectTrigger>
                  <SelectContent className={styles.customSelectContent}>
                    {activeAds.map(ad => (
                      <SelectItem key={ad.id} value={ad.id} className={styles.customSelectItem}>
                        {ad.content?.title || ad.title} (ID: {ad.id})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Annihilation Reason justification prompt */}
              <div className={styles.style306_56}>
                <Label className={styles.style307_57}>{t('annihilation.reasonLabel')}</Label>
                <Input
                  value={annihilationReason}
                  onChange={(e) => setAnnihilationReason(e.target.value)}
                  placeholder={t('annihilation.reasonPlaceholder')}
                  className={styles.style312_58}
                />
              </div>

              {/* Execution CTA button */}
              <Button
                onClick={handleAnnihilateAd}
                disabled={isAnnihilating || !selectedAdId}
                className={cn(
                  styles.style321_59,
                  !selectedAdId
                    ? styles.style323_60
                    : styles.style324_61
                )}
              >
                {isAnnihilating ? (
                  <Loader2 className={styles.style328_62} />
                ) : (
                  <>
                    <EyeOff className={styles.style331_63} />
                    {t('annihilation.executeBtn')}
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* 📡 REGIONAL BROADCAST PULSES (Silent Web Pushes Helper) */}
        <div className={styles.style341_64}>
          <Card className={styles.style342_65}>
            <CardHeader className={styles.style343_66}>
              <CardTitle className={styles.style344_67}>
                <Radio className={styles.style345_68} />
                {t('broadcast.title')}
              </CardTitle>
              <CardDescription className={styles.style348_69}>
                {t('broadcast.description')}
              </CardDescription>
            </CardHeader>
            <CardContent className={styles.style352_70}>
              <div className={styles.style353_71}>
                {/* District targeting selector */}
                <div className={styles.style355_72}>
                  <Label className={styles.style356_73}>{t('broadcast.districtLabel')}</Label>
                  <Select value={selectedDistrict} onValueChange={setSelectedDistrict}>
                    <SelectTrigger className={styles.style360_74}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className={styles.customSelectContent}>
                      <SelectItem value={tAuto('key_91559fa2')} className={styles.customSelectItem}>{t('broadcast.districts.all')}</SelectItem>
                      <SelectItem value={tAuto('key_cd57565c')} className={styles.customSelectItem}>{t('broadcast.districts.ju')}</SelectItem>
                      <SelectItem value={tAuto('key_dece580e')} className={styles.customSelectItem}>{t('broadcast.districts.kasaba')}</SelectItem>
                      <SelectItem value={tAuto('key_6d2b91d3')} className={styles.customSelectItem}>{t('broadcast.districts.wadiSeer')}</SelectItem>
                      <SelectItem value={tAuto('key_e07be56d')} className={styles.customSelectItem}>{t('broadcast.districts.marka')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Pulse Classification */}
                <div className={styles.style371_75}>
                  <Label className={styles.style372_76}>{t('broadcast.typeLabel')}</Label>
                  <Select value={alertType} onValueChange={(value) => setAlertType(value as any)}>
                    <SelectTrigger className={styles.style376_77}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className={styles.customSelectContent}>
                      <SelectItem value="REGIONAL_ALERT" className={styles.customSelectItem}>{t('broadcast.types.regional')}</SelectItem>
                      <SelectItem value="GLOBAL_FREEZE" className={styles.customSelectItem}>{t('broadcast.types.freeze')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Message text area */}
              <div className={styles.style385_78}>
                <Label className={styles.style386_79}>{t('broadcast.messageLabel')}</Label>
                <textarea
                  value={broadcastMessage}
                  onChange={(e) => setBroadcastMessage(e.target.value)}
                  placeholder={t('broadcast.messagePlaceholder')}
                  className={styles.style391_80}
                />
              </div>

              {/* Broadcast command button */}
              <Button
                onClick={handleSendBroadcast}
                disabled={isBroadcasting || !broadcastMessage.trim()}
                className={styles.style399_81}
              >
                {isBroadcasting ? (
                  <Loader2 className={styles.style402_82} />
                ) : (
                  <>
                    <Send className={styles.style405_83} />
                    {t('broadcast.executeBtn')}
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
