'use server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { decryptTc, encryptTc, hashTc, isValidTc, maskTc } from '@/lib/tc';
import { HAREKET_TIPLERI, type FormState, type HareketTipi } from '@/lib/labels';

const text = (fd: FormData, k: string) => String(fd.get(k) ?? '').trim();

export async function createCustomer(_: FormState, fd: FormData): Promise<FormState> {
  const ad = text(fd, 'ad');
  const soyad = text(fd, 'soyad');
  const tc = text(fd, 'tc').replace(/\D/g, '');
  const telefon = text(fd, 'telefon').replace(/[^\d+]/g, '');
  const adres = text(fd, 'adres');
  const aciklama = text(fd, 'aciklama');

  if (!ad || !soyad) return { error: 'Ad ve soyad zorunlu.' };
  if (tc && !isValidTc(tc)) {
    return { error: 'TC kimlik numarası geçersiz. Numara 11 hane olmalı ve doğrulamadan geçmeli. Bilmiyorsanız boş bırakın.' };
  }
  if (aciklama.length > 1000) return { error: 'Açıklama en fazla 1000 karakter olabilir.' };
  if (telefon && telefon.replace(/\D/g, '').length < 10) return { error: 'Telefon numarası eksik görünüyor.' };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from('customers')
    .insert({
      ad,
      soyad,
      tc_kimlik_enc: tc ? encryptTc(tc) : null,
      tc_kimlik_hash: tc ? hashTc(tc) : null,
      tc_maske: tc ? maskTc(tc) : null,
      telefon: telefon || null,
      adres: adres || null,
      aciklama: aciklama || null,
    })
    .select('id')
    .single();

  if (error) {
    if (error.code === '23505') return { error: 'Bu TC kimlik numarasıyla kayıtlı bir müşteri zaten var.' };
    return { error: `Müşteri kaydedilemedi: ${error.message}` };
  }
  revalidatePath('/musteriler');
  redirect(`/musteriler/${data.id}`);
}

export async function createMovement(_: FormState, fd: FormData): Promise<FormState> {
  const customerId = text(fd, 'customer_id');
  const itemTypeId = text(fd, 'item_type_id');
  const tip = text(fd, 'tip') as HareketTipi;
  const milyem = Number(text(fd, 'milyem'));
  const miktar = Number(text(fd, 'miktar').replace(',', '.'));
  const aciklama = text(fd, 'aciklama');

  if (!HAREKET_TIPLERI.includes(tip)) return { error: 'İşlem türünü seçin.' };
  if (!Number.isInteger(milyem) || milyem < 1 || milyem > 1000) {
    return { error: 'Milyem 1 ile 1000 arasında tam sayı olmalı (22 ayar için 916).' };
  }
  if (!(miktar > 0)) return { error: 'Miktar sıfırdan büyük olmalı.' };

  // Birim formdan gelir; gerçek kural veritabanı tetikleyicisinde uygulanır
  // (adetli üründe gram adet × birim gramdan hesaplanır, gramlı üründe adet silinir).
  const birim = text(fd, 'birim') === 'adet' ? 'adet' : 'gram';
  const row: Record<string, unknown> = {
    customer_id: customerId,
    item_type_id: itemTypeId,
    tip,
    milyem,
    aciklama: aciklama || null,
  };
  if (birim === 'adet') {
    if (!Number.isInteger(miktar)) return { error: 'Adet tam sayı olmalı.' };
    row.adet = miktar;
  } else {
    row.gram = Math.round(miktar * 1000) / 1000;
  }

  const supabase = await createClient();
  const { error } = await supabase.from('customer_movements').insert(row);
  if (error) return { error: `Hareket kaydedilemedi: ${error.message}` };

  revalidatePath(`/musteriler/${customerId}`);
  revalidatePath('/musteriler');
  return { ok: true, message: 'Hareket kaydedildi.', ts: Date.now() };
}

export async function revealTc(customerId: string): Promise<string | null> {
  const supabase = await createClient();
  // RLS sayesinde yalnızca kendi firmasının müşterisi okunabilir
  const { data } = await supabase.from('customers').select('tc_kimlik_enc').eq('id', customerId).maybeSingle();
  if (!data?.tc_kimlik_enc) return null;
  return decryptTc(data.tc_kimlik_enc);
}
