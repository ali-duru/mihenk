'use client';
import { useActionState } from 'react';
import { createCustomer } from '@/app/(app)/musteriler/actions';
import { SubmitButton } from './SubmitButton';

export function CustomerForm() {
  const [state, action] = useActionState(createCustomer, {});
  return (
    <form action={action} className="stack panel">
      <div className="row2">
        <label className="field">
          <span>Ad</span>
          <input name="ad" required maxLength={80} autoComplete="off" />
        </label>
        <label className="field">
          <span>Soyad</span>
          <input name="soyad" required maxLength={80} autoComplete="off" />
        </label>
      </div>
      <p className="aside">Yalnızca ad ve soyad zorunlu. Diğer alanları bilmiyorsanız boş bırakabilirsiniz.</p>
      <label className="field">
        <span>TC kimlik no <small className="opt">isteğe bağlı</small></span>
        <input name="tc" inputMode="numeric" pattern="\d{11}" maxLength={11} autoComplete="off" className="num" />
        <em>Şifrelenerek saklanır. Listede yalnızca ilk ve son iki hane görünür.</em>
      </label>
      <label className="field">
        <span>Telefon <small className="opt">isteğe bağlı</small></span>
        <input name="telefon" type="tel" inputMode="tel" placeholder="05xx xxx xx xx" autoComplete="off" />
      </label>
      <label className="field">
        <span>Adres <small className="opt">isteğe bağlı</small></span>
        <textarea name="adres" rows={3} maxLength={500} />
      </label>
      <label className="field">
        <span>Açıklama <small className="opt">isteğe bağlı</small></span>
        <textarea name="aciklama" rows={3} maxLength={1000} placeholder="Müşteriyle ilgili not" />
      </label>
      {state.error && <p className="alert" role="alert">{state.error}</p>}
      <div>
        <SubmitButton>Müşteriyi kaydet</SubmitButton>
      </div>
    </form>
  );
}
