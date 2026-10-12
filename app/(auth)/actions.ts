'use server';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import type { FormState } from '@/lib/labels';

const text = (fd: FormData, k: string) => String(fd.get(k) ?? '').trim();
const safeNext = (n: string) => (n.startsWith('/') && !n.startsWith('//') ? n : '/musteriler');

export async function login(_: FormState, fd: FormData): Promise<FormState> {
  const email = text(fd, 'email');
  const password = String(fd.get('password') ?? '');
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    return {
      error:
        error.code === 'email_not_confirmed'
          ? 'E-posta adresiniz henüz doğrulanmadı. Gelen kutunuzdaki bağlantıya tıklayın.'
          : 'E-posta veya şifre hatalı.',
    };
  }
  redirect(safeNext(text(fd, 'next')));
}

export async function signup(_: FormState, fd: FormData): Promise<FormState> {
  const firmaAdi = text(fd, 'firma_adi');
  const adSoyad = text(fd, 'ad_soyad');
  const email = text(fd, 'email');
  const password = String(fd.get('password') ?? '');

  if (firmaAdi.length < 2) return { error: 'Firma adını yazın.' };
  if (!adSoyad) return { error: 'Adınızı ve soyadınızı yazın.' };
  if (password.length < 8) return { error: 'Şifre en az 8 karakter olmalı.' };

  const origin = (await headers()).get('origin') ?? '';
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${origin}/auth/confirm`,
      data: { firma_adi: firmaAdi, ad_soyad: adSoyad },
    },
  });

  if (error) {
    return {
      error:
        error.code === 'user_already_exists'
          ? 'Bu e-posta ile kayıtlı bir hesap var.'
          : `Hesap oluşturulamadı: ${error.message}`,
    };
  }
  if (!data.session) {
    return {
      message: `${email} adresine doğrulama bağlantısı gönderdik. Bağlantıya tıkladıktan sonra giriş yapabilirsiniz.`,
    };
  }
  redirect('/musteriler');
}

export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect('/giris');
}
