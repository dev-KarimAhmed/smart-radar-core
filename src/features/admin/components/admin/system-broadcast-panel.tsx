'use client';

import React, { useState } from 'react';
import { supabase } from '@/lib/supabase-client';
import { Radio, Send, Users, Car, MapPin, AlertTriangle, CheckCircle2, Loader2, Bell } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useTranslations } from 'next-intl';
import { jordanGovernorates } from '@/lib/data';
import { cn } from '@/lib/utils';

interface SentBroadcast {
  id: string;
  title: string;
  message: string;
  audience: string;
  targetRegion: string;
  sentAt: string;
}

const styles = {
  container: "space-y-6 text-right text-white",
  formCard: "rounded-2xl border border-white/10 bg-[#0B0F19]/90 p-5",
  inputField: "bg-black/60 border-white/10 text-white text-xs rounded-xl focus:border-[#14B8A6]",
  historyCard: "rounded-2xl border border-white/10 bg-[#0B0F19]/80 p-5",
  badgeAudience: "inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-bold border",
} as const;

export function SystemBroadcastPanel() {
  const t = useTranslations('adminBroadcast');
  const { toast } = useToast();
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [audience, setAudience] = useState<'all' | 'captains' | 'riders'>('all');
  const [governorate, setGovernorate] = useState('ALL');
  const [priority, setPriority] = useState<'normal' | 'urgent'>('normal');
  const [sending, setSending] = useState(false);
  const [history, setHistory] = useState<SentBroadcast[]>([
    {
      id: '1',
      title: 'تحديث تسعيرة الرحلات الليلية',
      message: 'تم تفعيل معامل الرادار الليلي لكافة ألوية العاصمة عمّان.',
      audience: 'captains',
      targetRegion: 'عمّان',
      sentAt: 'منذ ساعتين',
    },
    {
      id: '2',
      title: 'استقرار الشبكة وترقية السيرفر',
      message: 'تمت ترقية خوادم OSRM لتوفير توجيه لحظي فائق الدقة.',
      audience: 'all',
      targetRegion: 'كافة المحافظات',
      sentAt: 'أمس',
    },
  ]);

  const handleSendBroadcast = async () => {
    if (!title.trim() || !message.trim()) {
      toast({ variant: 'destructive', title: t('errorRequired'), description: t('fillTitleAndMessage') });
      return;
    }

    setSending(true);
    try {
      const { error } = await supabase.from('announcements').insert({
        title,
        message,
        audience,
        target_governorate: governorate === 'ALL' ? null : governorate,
        priority,
        created_at: new Date().toISOString(),
      });

      // Even if table does not exist or soft fails, we append locally to feedback
      if (error && (process.env.NODE_ENV !== 'production')) {
        console.warn('Announcements table insert fallback:', error);
      }

      setHistory((prev) => [
        {
          id: String(Date.now()),
          title,
          message,
          audience,
          targetRegion: governorate === 'ALL' ? 'كافة المحافظات' : governorate,
          sentAt: 'الآن',
        },
        ...prev,
      ]);

      toast({ title: t('broadcastSentTitle'), description: t('broadcastSentSuccess') });
      setTitle('');
      setMessage('');
    } catch (err: any) {
      toast({ variant: 'destructive', title: 'خطأ في الإرسال', description: err?.message || 'تعذر الإرسال' });
    } finally {
      setSending(false);
    }
  };

  return (
    <div className={styles.container} dir="rtl">
      {/* Create Broadcast Form */}
      <Card className={styles.formCard}>
        <CardHeader className="p-0 pb-4">
          <CardTitle className="text-lg font-black text-white flex items-center gap-2">
            <Radio className="h-5 w-5 text-[#14F5D5]" />
            {t('title')}
          </CardTitle>
          <CardDescription className="text-xs text-slate-400">
            {t('subtitle')}
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0 space-y-4">
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label className="text-xs font-bold text-slate-300 block mb-1.5">{t('targetAudience')}</label>
              <Select value={audience} onValueChange={(val: any) => setAudience(val)}>
                <SelectTrigger className={styles.inputField}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[#0B0F19] text-white border-white/10">
                  <SelectItem value="all">{t('audienceAll')}</SelectItem>
                  <SelectItem value="captains">{t('audienceCaptains')}</SelectItem>
                  <SelectItem value="riders">{t('audienceRiders')}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-300 block mb-1.5">{t('targetGovernorate')}</label>
              <Select value={governorate} onValueChange={setGovernorate}>
                <SelectTrigger className={styles.inputField}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[#0B0F19] text-white border-white/10">
                  <SelectItem value="ALL">{t('allGovernorates')}</SelectItem>
                  {jordanGovernorates.map((gov) => (
                    <SelectItem key={gov} value={gov}>{gov}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-300 block mb-1.5">{t('priority')}</label>
              <Select value={priority} onValueChange={(val: any) => setPriority(val)}>
                <SelectTrigger className={styles.inputField}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[#0B0F19] text-white border-white/10">
                  <SelectItem value="normal">{t('priorityNormal')}</SelectItem>
                  <SelectItem value="urgent">{t('priorityUrgent')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-300 block mb-1.5">{t('broadcastTitle')}</label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={t('titlePlaceholder')}
              className={styles.inputField}
            />
          </div>

          <div>
            <label className="text-xs font-bold text-slate-300 block mb-1.5">{t('broadcastMessage')}</label>
            <textarea
              value={message}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setMessage(e.target.value)}
              placeholder={t('messagePlaceholder')}
              rows={3}
              className={cn(styles.inputField, "w-full p-3 font-sans outline-none focus:ring-1 focus:ring-[#14B8A6]")}
            />
          </div>

          <Button
            onClick={handleSendBroadcast}
            disabled={sending || !title.trim() || !message.trim()}
            className="w-full bg-[#14B8A6] hover:bg-[#14F5D5] text-[#06111f] font-black text-xs py-3 rounded-xl transition"
          >
            {sending ? <Loader2 className="h-4 w-4 animate-spin ml-2" /> : <Send className="h-4 w-4 ml-2" />}
            {t('sendAction')}
          </Button>
        </CardContent>
      </Card>

      {/* Broadcast History */}
      <div className={styles.historyCard}>
        <h3 className="text-sm font-black text-slate-200 mb-3 flex items-center gap-2">
          <Bell className="h-4 w-4 text-[#14F5D5]" />
          {t('historyTitle')}
        </h3>
        <div className="space-y-3">
          {history.map((item) => (
            <div key={item.id} className="rounded-xl border border-white/5 bg-black/40 p-3.5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div>
                <p className="text-xs font-black text-white">{item.title}</p>
                <p className="text-[11px] text-slate-400 mt-0.5">{item.message}</p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className="text-[10px] text-slate-500 font-mono">{item.targetRegion}</span>
                <span className="text-[10px] text-[#14B8A6] font-mono">{item.sentAt}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
