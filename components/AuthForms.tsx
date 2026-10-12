'use client';
import { useActionState } from 'react';
import Link from 'next/link';
import { login, signup } from '@/app/(auth)/actions';
import { SubmitButton } from './SubmitButton';

export function LoginForm({ next, notice }: { next?: string; notice?: string }) {
  const [state, action] = useActionState(login, {});
  return (
    <form action={action} className="stack">
      <input type="hidden" name="next" value={next ?? ''} />
      <label className="field">
        <span>E-posta</span>
        <input name="email" type="email" required autoComplete="email" />
      </label>
      <label className="field">
        <span>Şifre</span>
        <input name="password" type="password" required autoComplete="current-password" />
      </label>
      {notice && !state.error && <p className="alert">{notice}</p>}
      {state.error && <p className="alert" role="alert">{state.error}</p>}
      <SubmitButton pendingText="Giriş yapılıyor…">Giriş yap</SubmitButton>
      <p className="aside">
        Firmanız kayıtlı değil mi? <Link href="/kayit">Firma hesabı oluştur</Link>
      </p>
    </form>
  );
}

export function SignupForm() {
  const [state, action] = useActionState(signup, {});
  if (state.message) {
    return (
      <div className="stack">
        <p className="notice" role="status">{state.message}</p>
        <Link href="/giris" className="btn btn-ghost">Giriş ekranına dön</Link>
      </div>
    );
  }
  return (
    <form action={action} className="stack">
      <label className="field">
        <span>Firma adı</span>
        <input name="firma_adi" required minLength={2} maxLength={120} autoComplete="organization" />
      </label>
      <label className="field">
        <span>Adınız soyadınız</span>
        <input name="ad_soyad" required autoComplete="name" />
      </label>
      <label className="field">
        <span>E-posta</span>
        <input name="email" type="email" required autoComplete="email" />
      </label>
      <label className="field">
        <span>Şifre</span>
        <input name="password" type="password" required minLength={8} autoComplete="new-password" />
        <em>En az 8 karakter</em>
      </label>
      {state.error && <p className="alert" role="alert">{state.error}</p>}
      <SubmitButton pendingText="Hesap oluşturuluyor…">Hesap oluştur</SubmitButton>
      <p className="aside">
        Hesabınız var mı? <Link href="/giris">Giriş yap</Link>
      </p>
    </form>
  );
}
