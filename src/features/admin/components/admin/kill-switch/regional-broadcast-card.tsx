'use client';

import React from 'react';
import { useTranslations } from 'next-intl';
import { Radio, Send, Loader2 } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { styles } from './kill-switch-styles';

interface RegionalBroadcastCardProps {
  selectedDistrict: string;
  setSelectedDistrict: (v: string) => void;
  alertType: 'REGIONAL_ALERT' | 'GLOBAL_FREEZE';
  setAlertType: (v: 'REGIONAL_ALERT' | 'GLOBAL_FREEZE') => void;
  broadcastMessage: string;
  setBroadcastMessage: (v: string) => void;
  isBroadcasting: boolean;
  onSendBroadcast: () => void;
}

export function RegionalBroadcastCard({
  selectedDistrict,
  setSelectedDistrict,
  alertType,
  setAlertType,
  broadcastMessage,
  setBroadcastMessage,
  isBroadcasting,
  onSendBroadcast,
}: RegionalBroadcastCardProps) {
  const t = useTranslations('adminTab.killSwitch');
  const tAuto = useTranslations('auto');

  return (
    <Card className={styles.style342_65}>
      <CardHeader className={styles.style343_66}>
        <CardTitle className={styles.style344_67}>
          <Radio className={styles.style345_68} />
          {t('broadcast.title')}
        </CardTitle>
        <CardDescription className={styles.style348_69}>{t('broadcast.description')}</CardDescription>
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
                <SelectItem value={tAuto('key_91559fa2')} className={styles.customSelectItem}>
                  {t('broadcast.districts.all')}
                </SelectItem>
                <SelectItem value={tAuto('key_cd57565c')} className={styles.customSelectItem}>
                  {t('broadcast.districts.ju')}
                </SelectItem>
                <SelectItem value={tAuto('key_dece580e')} className={styles.customSelectItem}>
                  {t('broadcast.districts.kasaba')}
                </SelectItem>
                <SelectItem value={tAuto('key_6d2b91d3')} className={styles.customSelectItem}>
                  {t('broadcast.districts.wadiSeer')}
                </SelectItem>
                <SelectItem value={tAuto('key_e07be56d')} className={styles.customSelectItem}>
                  {t('broadcast.districts.marka')}
                </SelectItem>
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
                <SelectItem value="REGIONAL_ALERT" className={styles.customSelectItem}>
                  {t('broadcast.types.regional')}
                </SelectItem>
                <SelectItem value="GLOBAL_FREEZE" className={styles.customSelectItem}>
                  {t('broadcast.types.freeze')}
                </SelectItem>
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
          onClick={onSendBroadcast}
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
  );
}
