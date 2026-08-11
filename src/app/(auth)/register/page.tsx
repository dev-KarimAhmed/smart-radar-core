import { RegisterRoute } from '@/features/auth/components/register-route';

const styles = { root: 'contents' } as const;

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const role = typeof params.role === 'string' ? params.role : 'rider';
  const language = typeof params.lang === 'string' ? params.lang : undefined;

  return (
    <div className={styles.root}>
      <RegisterRoute initialLanguage={language} initialRole={role} />
    </div>
  );
}
