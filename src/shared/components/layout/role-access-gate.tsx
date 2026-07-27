import Link from 'next/link';

const styles = {
  root: 'flex min-h-screen items-center justify-center bg-[#0A0F1D] p-6 text-center text-white',
  card: 'max-w-sm space-y-3 rounded-3xl border border-[#14B8A6]/20 bg-[#0B1120] p-6',
  title: 'text-xl font-black text-[#14F5D5]',
  body: 'text-sm text-slate-400',
  link: 'inline-flex rounded-xl bg-[#14B8A6] px-5 py-3 text-sm font-black text-[#06111f]',
} as const;

export function RoleAccessGate({ body, title }: { body: string; title: string }) {
  return (
    <main className={styles.root}>
      <section className={styles.card}>
        <h1 className={styles.title}>{title}</h1>
        <p className={styles.body}>{body}</p>
        <Link className={styles.link} href="/">تسجيل الدخول</Link>
      </section>
    </main>
  );
}
