'use client';

import React, { useEffect, useState } from 'react';
import { Bell, CheckCircle2, ClipboardList, LogOut, RefreshCw, UserRound } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { supabase } from '@/lib/supabase-client';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

type DelegateTask = {
  id: string;
  title: string | null;
  description?: string | null;
  status: string | null;
  created_at?: string | null;
};

export function DelegatePortal() {
  const { user, logout } = useAuth();
  const [tasks, setTasks] = useState<DelegateTask[]>([]);
  const [loading, setLoading] = useState(false);
  const [syncMessage, setSyncMessage] = useState('');

  useEffect(() => {
    if (!user?.uid) {
      setTasks([]);
      return;
    }

    let active = true;
    const delegateId = user.uid;

    async function loadTasks() {
      setLoading(true);
      setSyncMessage('');

      try {
        const { data, error } = await supabase
          .from('delegate_tasks')
          .select('id,title,description,status,created_at')
          .eq('delegate_id', delegateId)
          .order('created_at', { ascending: false })
          .limit(20);

        if (error) throw error;
        if (active) setTasks(Array.isArray(data) ? data as DelegateTask[] : []);
      } catch (error) {
        if ((process.env.NODE_ENV !== 'production')) {
          console.warn('[DelegatePortal] Supabase task sync failed', error);
        }
        if (active) {
          setTasks([]);
          setSyncMessage('لا توجد مهام متاحة حالياً أو تعذر تحميلها من الخادم.');
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    void loadTasks();

    const channel = supabase
      .channel(`delegate-tasks-${delegateId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'delegate_tasks',
          filter: `delegate_id=eq.${delegateId}`,
        },
        () => {
          void loadTasks();
        },
      )
      .subscribe();

    return () => {
      active = false;
      void supabase.removeChannel(channel);
    };
  }, [user?.uid]);

  return (
    <main className="min-h-screen bg-radar-bg-deep px-4 py-6 text-white sm:px-8" dir="rtl">
      <section className="mx-auto flex w-full max-w-6xl flex-col gap-6">
        <header className="rounded-[24px] border border-teal-400/15 bg-white/[0.04] p-6 shadow-2xl shadow-black/30 backdrop-blur-xl">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-teal-400/25 bg-teal-400/10 text-teal-300">
                <UserRound className="h-7 w-7" />
              </div>
              <div>
                <Badge className="mb-2 border-teal-400/25 bg-teal-400/10 text-teal-200">بوابة المندوب</Badge>
                <h1 className="text-2xl font-black text-white">{user?.name || 'مندوب'}</h1>
                <p className="mt-1 text-sm text-slate-400">{user?.phone || 'لا يوجد رقم هاتف مسجل'}</p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <Button
                type="button"
                variant="outline"
                className="border-white/10 bg-white/5 text-white hover:bg-white/10"
                onClick={() => window.location.reload()}
              >
                <RefreshCw className="ml-2 h-4 w-4" />
                تحديث
              </Button>
              <Button
                type="button"
                className="bg-red-600 font-bold text-white hover:bg-red-500"
                onClick={() => void logout()}
              >
                <LogOut className="ml-2 h-4 w-4" />
                تسجيل الخروج
              </Button>
            </div>
          </div>
        </header>

        <section className="grid gap-4 md:grid-cols-3">
          <StatusCard label="المهام المفتوحة" value={tasks.filter((task) => task.status !== 'completed').length.toString()} icon={<ClipboardList className="h-5 w-5" />} />
          <StatusCard label="المهام المكتملة" value={tasks.filter((task) => task.status === 'completed').length.toString()} icon={<CheckCircle2 className="h-5 w-5" />} />
          <StatusCard label="التنبيهات" value="0" icon={<Bell className="h-5 w-5" />} />
        </section>

        <section className="rounded-[24px] border border-teal-400/15 bg-black/30 p-5 shadow-2xl shadow-black/30">
          <div className="mb-5 flex items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-black text-white">المهام الحالية</h2>
              <p className="mt-1 text-sm text-slate-400">تظهر هنا المهام المرسلة لك من الخادم.</p>
            </div>
            {loading && <Badge className="bg-teal-400/10 text-teal-200">جاري التحميل...</Badge>}
          </div>

          {tasks.length > 0 ? (
            <div className="grid gap-3">
              {tasks.map((task) => (
                <article key={task.id} className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <h3 className="font-black text-white">{task.title || 'مهمة بدون عنوان'}</h3>
                      {task.description && <p className="mt-2 text-sm leading-6 text-slate-400">{task.description}</p>}
                    </div>
                    <Badge className="border-teal-400/20 bg-teal-400/10 text-teal-200">{formatStatus(task.status)}</Badge>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.02] p-8 text-center">
              <ClipboardList className="mx-auto mb-3 h-9 w-9 text-slate-500" />
              <p className="font-bold text-white">{syncMessage || 'لا توجد مهام حالياً.'}</p>
              <p className="mt-2 text-sm text-slate-400">عند وصول مهام جديدة ستظهر هنا مباشرة.</p>
            </div>
          )}
        </section>
      </section>
    </main>
  );
}

function StatusCard({ label, value, icon }: { label: string; value: string; icon: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-teal-400/15 bg-white/[0.04] p-5">
      <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-teal-400/10 text-teal-300">
        {icon}
      </div>
      <p className="text-sm text-slate-400">{label}</p>
      <p className="mt-2 text-3xl font-black text-white">{value}</p>
    </div>
  );
}

function formatStatus(status: string | null) {
  switch (status) {
    case 'completed':
      return 'مكتملة';
    case 'acknowledged':
      return 'قيد المتابعة';
    case 'closed':
      return 'مغلقة';
    case 'pending':
      return 'بانتظار المتابعة';
    default:
      return 'غير محددة';
  }
}

export default DelegatePortal;
