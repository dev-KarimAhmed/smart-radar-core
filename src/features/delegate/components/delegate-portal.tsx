'use client';

import React, { useEffect, useState } from 'react';
import { Bell, CheckCircle2, ClipboardList, LogOut, RefreshCw, UserRound } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { supabase } from '@/lib/supabase-client';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

const styles = {
  style85_1: "min-h-screen bg-[#0B0F19] px-4 py-6 text-white sm:px-8",
  style86_2: "mx-auto flex w-full max-w-6xl flex-col gap-6",
  style87_3: "rounded-[24px] border border-teal-400/15 bg-white/[0.04] p-6 shadow-2xl shadow-black/30 backdrop-blur-xl",
  style88_4: "flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between",
  style89_5: "flex items-center gap-4",
  style90_6: "flex h-14 w-14 items-center justify-center rounded-2xl border border-teal-400/25 bg-teal-400/10 text-teal-300",
  style91_7: "h-7 w-7",
  style94_8: "mb-2 border-teal-400/25 bg-teal-400/10 text-teal-200",
  style95_9: "text-2xl font-black text-white",
  style96_10: "mt-1 text-sm text-slate-400",
  style100_11: "flex flex-wrap items-center gap-3",
  style104_12: "border-white/10 bg-white/5 text-white hover:bg-white/10",
  style107_13: "ml-2 h-4 w-4",
  style112_14: "bg-red-600 font-bold text-white hover:bg-red-500",
  style115_15: "ml-2 h-4 w-4",
  style122_16: "grid gap-4 md:grid-cols-3",
  style123_17: "h-5 w-5",
  style124_18: "h-5 w-5",
  style125_19: "h-5 w-5",
  style128_20: "rounded-[24px] border border-teal-400/15 bg-black/30 p-5 shadow-2xl shadow-black/30",
  style129_21: "mb-5 flex items-center justify-between gap-3",
  style131_22: "text-xl font-black text-white",
  style132_23: "mt-1 text-sm text-slate-400",
  style134_24: "bg-teal-400/10 text-teal-200",
  style138_25: "grid gap-3",
  style140_26: "rounded-2xl border border-white/10 bg-white/[0.03] p-4",
  style141_27: "flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between",
  style143_28: "font-black text-white",
  style144_29: "mt-2 text-sm leading-6 text-slate-400",
  style146_30: "border-teal-400/20 bg-teal-400/10 text-teal-200",
  style152_31: "rounded-2xl border border-dashed border-white/10 bg-white/[0.02] p-8 text-center",
  style153_32: "mx-auto mb-3 h-9 w-9 text-slate-500",
  style154_33: "font-bold text-white",
  style155_34: "mt-2 text-sm text-slate-400",
  style166_35: "rounded-2xl border border-teal-400/15 bg-white/[0.04] p-5",
  style167_36: "mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-teal-400/10 text-teal-300",
  style170_37: "text-sm text-slate-400",
  style171_38: "mt-2 text-3xl font-black text-white",
} as const;


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
    <main className={styles.style85_1} dir="rtl">
      <section className={styles.style86_2}>
        <header className={styles.style87_3}>
          <div className={styles.style88_4}>
            <div className={styles.style89_5}>
              <div className={styles.style90_6}>
                <UserRound className={styles.style91_7} />
              </div>
              <div>
                <Badge className={styles.style94_8}>بوابة المندوب</Badge>
                <h1 className={styles.style95_9}>{user?.name || 'مندوب'}</h1>
                <p className={styles.style96_10}>{user?.phone || 'لا يوجد رقم هاتف مسجل'}</p>
              </div>
            </div>

            <div className={styles.style100_11}>
              <Button
                type="button"
                variant="outline"
                className={styles.style104_12}
                onClick={() => window.location.reload()}
              >
                <RefreshCw className={styles.style107_13} />
                تحديث
              </Button>
              <Button
                type="button"
                className={styles.style112_14}
                onClick={() => void logout()}
              >
                <LogOut className={styles.style115_15} />
                تسجيل الخروج
              </Button>
            </div>
          </div>
        </header>

        <section className={styles.style122_16}>
          <StatusCard label="المهام المفتوحة" value={tasks.filter((task) => task.status !== 'completed').length.toString()} icon={<ClipboardList className={styles.style123_17} />} />
          <StatusCard label="المهام المكتملة" value={tasks.filter((task) => task.status === 'completed').length.toString()} icon={<CheckCircle2 className={styles.style124_18} />} />
          <StatusCard label="التنبيهات" value="0" icon={<Bell className={styles.style125_19} />} />
        </section>

        <section className={styles.style128_20}>
          <div className={styles.style129_21}>
            <div>
              <h2 className={styles.style131_22}>المهام الحالية</h2>
              <p className={styles.style132_23}>تظهر هنا المهام المرسلة لك من الخادم.</p>
            </div>
            {loading && <Badge className={styles.style134_24}>جاري التحميل...</Badge>}
          </div>

          {tasks.length > 0 ? (
            <div className={styles.style138_25}>
              {tasks.map((task) => (
                <article key={task.id} className={styles.style140_26}>
                  <div className={styles.style141_27}>
                    <div>
                      <h3 className={styles.style143_28}>{task.title || 'مهمة بدون عنوان'}</h3>
                      {task.description && <p className={styles.style144_29}>{task.description}</p>}
                    </div>
                    <Badge className={styles.style146_30}>{formatStatus(task.status)}</Badge>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className={styles.style152_31}>
              <ClipboardList className={styles.style153_32} />
              <p className={styles.style154_33}>{syncMessage || 'لا توجد مهام حالياً.'}</p>
              <p className={styles.style155_34}>عند وصول مهام جديدة ستظهر هنا مباشرة.</p>
            </div>
          )}
        </section>
      </section>
    </main>
  );
}

function StatusCard({ label, value, icon }: { label: string; value: string; icon: React.ReactNode }) {
  return (
    <div className={styles.style166_35}>
      <div className={styles.style167_36}>
        {icon}
      </div>
      <p className={styles.style170_37}>{label}</p>
      <p className={styles.style171_38}>{value}</p>
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
