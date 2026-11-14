'use client';

import React from 'react';
import { MessageCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import type { CaptainUser } from '@/features/admin/types/driver-management';

interface DriverMessageBannerProps {
  captain: CaptainUser;
  isArabic: boolean;
  t: (key: string, values?: Record<string, any>) => string;
}

export function DriverMessageBanner({ captain, isArabic, t }: DriverMessageBannerProps) {
  const whatsappUrl = captain.phone
    ? `https://wa.me/${captain.phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(
        isArabic
          ? `مرحباً كابتن معلن ${captain.full_name}، نتواصل معك من إدارة بينكم - bynkcom.`
          : `Hello Captain ${captain.full_name}, contacting you from bynkcom Administration.`
      )}`
    : null;

  return (
    <div className="bg-[#161F30]/60 border border-white/10 p-3.5 rounded-2xl flex items-center justify-between gap-3">
      <div className="flex items-center gap-3">
        <Avatar className="h-10 w-10 border border-teal-500/40 rounded-xl">
          <AvatarFallback className="bg-teal-500/20 text-teal-300 font-bold text-xs">
            {captain.full_name.substring(0, 2)}
          </AvatarFallback>
        </Avatar>
        <div>
          <div className="flex items-center gap-2">
            <span className="font-bold text-white text-sm">{captain.full_name}</span>
            <Badge className="bg-teal-500/15 text-teal-300 border border-teal-500/30 text-[10px] font-mono">
              {captain.serial_id}
            </Badge>
          </div>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-[11px] text-slate-400 font-mono">
              {captain.phone} • {captain.governorate}
            </span>
            {(captain.preferred_language || 'ar').toLowerCase() === 'en' ? (
              <Badge variant="outline" className="font-sans text-[10px] font-bold bg-blue-950/70 border-blue-500/40 text-blue-300 px-1.5 py-0 rounded flex items-center gap-1">
                <span>🇬🇧</span>
                <span>{isArabic ? 'الإنجليزية' : 'English'}</span>
              </Badge>
            ) : (
              <Badge variant="outline" className="font-sans text-[10px] font-bold bg-emerald-950/70 border-emerald-500/40 text-emerald-300 px-1.5 py-0 rounded flex items-center gap-1">
                <span>🇸🇦</span>
                <span>{isArabic ? 'العربية' : 'Arabic'}</span>
              </Badge>
            )}
          </div>
        </div>
      </div>

      {whatsappUrl && (
        <a
          href={whatsappUrl}
          target="_blank"
          rel="noreferrer"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-300 text-xs font-bold transition-all shrink-0 cursor-pointer"
          title={isArabic ? "فتح محادثة واتساب فورية" : "Open instant WhatsApp chat"}
        >
          <MessageCircle className="w-3.5 h-3.5 text-emerald-400" />
          <span>{t('whatsappBtn')}</span>
        </a>
      )}
    </div>
  );
}

