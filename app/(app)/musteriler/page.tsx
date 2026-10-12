import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { hashTc } from '@/lib/tc';
import { Has } from '@/components/Has';

export default async function CustomersPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q = '' } = await searchParams;
  const term = q.trim();
  const supabase = await createClient();

  let query = supabase
    .from('customer_list')
    .select('id, ad, soyad, tc_maske, telefon, net_has')
    .order('soyad')
    .order('ad')
    .limit(100);

  if (/^\d{11}$/.test(term)) {
    query = query.eq('tc_kimlik_hash', hashTc(term)); // TC ile tam eşleşme
  } else if (term) {
    const safe = term.replace(/[,()"\\%*]/g, ' ').trim();
    if (safe) query = query.or(`ad.ilike."%${safe}%",soyad.ilike."%${safe}%",telefon.ilike."%${safe}%"`);
  }

  const { data: customers, error } = await query;

  return (
    <>
      <div className="pagehead">
        <h1>Müşteriler</h1>
        <div className="actions">
          <Link href="/musteriler/rapor" className="btn btn-ghost">Bakiye raporu</Link>
          <Link href="/musteriler/yeni" className="btn">Yeni müşteri</Link>
        </div>
      </div>

      <form className="search" role="search">
        <label className="field">
          <span>Ara</span>
          <input name="q" defaultValue={term} placeholder="Ad, soyad, telefon ya da 11 haneli TC" />
        </label>
        <button className="btn btn-ghost">Ara</button>
      </form>

      {error && <p className="alert">Müşteriler yüklenemedi: {error.message}</p>}

      {customers && customers.length === 0 ? (
        <div className="empty">
          {term ? (
            <p>“{term}” ile eşleşen müşteri yok.</p>
          ) : (
            <>
              <p>Henüz müşteri kaydı yok. İlk müşteriyi ekleyerek emanet ve borç hareketlerini tutmaya başlayın.</p>
              <Link href="/musteriler/yeni" className="btn">İlk müşteriyi ekle</Link>
            </>
          )}
        </div>
      ) : (
        <ul className="ledger">
          {customers?.map((c) => (
            <li key={c.id}>
              <Link href={`/musteriler/${c.id}`}>
                <span className="who">
                  <strong>{c.ad} {c.soyad}</strong>
                  <small className="num">{[c.tc_maske, c.telefon].filter(Boolean).join('   ') || 'Ek bilgi yok'}</small>
                </span>
                <Has value={Number(c.net_has)} compact />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
