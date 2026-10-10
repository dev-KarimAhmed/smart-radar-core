'use client';

import { useTranslations } from 'next-intl';
import { useNotifications } from '@/shared/hooks/use-notifications';
import { Bell, Check, Trash2, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useDashboardLanguage } from '@/hooks/use-dashboard-language';

export function NotificationsTab() {
  const t = useTranslations('auto');
  const { isArabic } = useDashboardLanguage();
  const { notifications, hasUnread, markAllAsRead } = useNotifications();

  return (
    <div className='flex flex-col h-full w-full max-w-3xl mx-auto space-y-6'>
      <div className='flex items-center justify-between'>
        <h1 className='text-2xl font-black text-white'>
          {isArabic ? 'التنبيهات' : 'Notifications'}
        </h1>
        {hasUnread && (
          <Button 
            variant='outline' 
            onClick={markAllAsRead}
            className='border-[#14B8A6]/40 text-[#14F5D5] hover:bg-[#14B8A6]/20'
          >
            <Check className='h-4 w-4 mr-2' />
            {isArabic ? 'تعليم الكل كمقروء' : 'Mark all read'}
          </Button>
        )}
      </div>

      <div className='flex-1 rounded-2xl border border-white/10 bg-[#0B0F19]/50 overflow-hidden shadow-xl'>
        {notifications.length === 0 ? (
          <div className='flex flex-col items-center justify-center h-64 text-center'>
            <Bell className='h-12 w-12 text-slate-600 mb-4' />
            <p className='text-slate-400 font-bold'>
              {isArabic ? 'لا توجد إشعارات حالياً' : 'No notifications yet'}
            </p>
          </div>
        ) : (
          <div className='divide-y divide-white/5'>
            {notifications.map((item) => (
              <div 
                key={item.id} 
                className={cn(
                  'p-4 transition-colors hover:bg-white/5',
                  !item.read && 'bg-[#14B8A6]/5'
                )}
              >
                <div className='flex items-start gap-4'>
                  <div className={cn(
                    'mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-full',
                    !item.read ? 'bg-[#14B8A6]/20 text-[#14F5D5]' : 'bg-white/10 text-slate-400'
                  )}>
                    <Bell className='h-5 w-5' />
                  </div>
                  <div className='flex-1 space-y-1'>
                    <div className='flex items-center justify-between'>
                      <h3 className={cn('text-sm font-bold', !item.read ? 'text-white' : 'text-slate-300')}>
                        {item.title}
                      </h3>
                      <span className='text-xs text-slate-500'>
                        {new Date(item.timestamp).toLocaleDateString(isArabic ? 'ar-EG' : 'en-US')}
                      </span>
                    </div>
                    <p className='text-sm text-slate-400'>
                      {item.description}
                    </p>
                  </div>
                  {!item.read && (
                    <span className='mt-2 h-2.5 w-2.5 shrink-0 rounded-full bg-[#14F5D5] shadow-[0_0_8px_#14F5D5]' />
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
