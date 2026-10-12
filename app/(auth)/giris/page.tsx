import { LoginForm } from '@/components/AuthForms';

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; hata?: string }>;
}) {
  const { next, hata } = await searchParams;
  return (
    <>
      <h1>Giriş yap</h1>
      <LoginForm
        next={next}
        notice={hata === 'dogrulama' ? 'Doğrulama bağlantısı geçersiz ya da süresi dolmuş. Tekrar giriş yapmayı deneyin.' : undefined}
      />
    </>
  );
}
