export type Durum = 'hepsi' | 'borclu' | 'emanet';
export type Sirala = 'ad' | 'miktar';

export type ReportCustomer = { id: string; ad: string; soyad: string; telefon: string | null };
export type ReportBalance = {
  customer_id: string;
  urun: string;
  birim: 'gram' | 'adet';
  milyem: number;
  net_adet: number;
  net_gram: number;
  net_has: number;
};
export type ReportRow = ReportCustomer & { items: ReportBalance[]; net: number };
export type ProductTotal = {
  key: string;
  urun: string;
  milyem: number;
  birim: 'gram' | 'adet';
  musteride: number;
  musterideHas: number;
  emanette: number;
  emanetteHas: number;
};
export type ReportData = {
  firma: string;
  tarih: string;
  durum: Durum;
  sirala: Sirala;
  q: string;
  rows: ReportRow[];
  products: ProductTotal[];
  toplamBorc: number;
  toplamEmanet: number;
  borcluSayisi: number;
  emanetSayisi: number;
  enBuyuk: number;
};

const r3 = (n: number) => Math.round(n * 1000) / 1000;

export function buildReport(input: {
  firma: string;
  customers: ReportCustomer[];
  balances: ReportBalance[];
  durum: Durum;
  sirala: Sirala;
  q: string;
}): ReportData {
  const { customers, balances, durum, sirala, q } = input;

  const byCustomer = new Map<string, ReportBalance[]>();
  for (const b of balances) {
    const list = byCustomer.get(b.customer_id) ?? [];
    list.push({ ...b, net_adet: Number(b.net_adet), net_gram: Number(b.net_gram), net_has: Number(b.net_has) });
    byCustomer.set(b.customer_id, list);
  }

  const needle = q.toLocaleLowerCase('tr');
  let rows: ReportRow[] = customers
    .map((c) => {
      const items = byCustomer.get(c.id) ?? [];
      return { ...c, items, net: r3(items.reduce((s, b) => s + b.net_has, 0)) };
    })
    .filter((r) => r.items.length > 0)
    .filter((r) => (durum === 'borclu' ? r.net > 0 : durum === 'emanet' ? r.net < 0 : true))
    .filter((r) =>
      needle
        ? `${r.ad} ${r.soyad} ${r.telefon ?? ''}`.toLocaleLowerCase('tr').includes(needle)
        : true,
    );

  if (sirala === 'miktar') rows = [...rows].sort((a, b) => Math.abs(b.net) - Math.abs(a.net));

  // Ürün toplamları: müşteride duran ve emanette duran ayrı toplanır, birbirini götürmez
  const pmap = new Map<string, ProductTotal>();
  for (const r of rows) {
    for (const b of r.items) {
      const key = `${b.urun}|${b.milyem}`;
      const t =
        pmap.get(key) ??
        { key, urun: b.urun, milyem: b.milyem, birim: b.birim, musteride: 0, musterideHas: 0, emanette: 0, emanetteHas: 0 };
      const qty = b.birim === 'adet' ? b.net_adet : b.net_gram;
      if (b.net_has > 0) {
        t.musteride += qty;
        t.musterideHas += b.net_has;
      } else {
        t.emanette += Math.abs(qty);
        t.emanetteHas += Math.abs(b.net_has);
      }
      pmap.set(key, t);
    }
  }
  const products = [...pmap.values()].sort((a, b) => a.urun.localeCompare(b.urun, 'tr') || b.milyem - a.milyem);

  const borclu = rows.filter((r) => r.net > 0);
  const emanet = rows.filter((r) => r.net < 0);

  return {
    firma: input.firma,
    tarih: new Intl.DateTimeFormat('tr-TR', { dateStyle: 'long', timeStyle: 'short', timeZone: 'Europe/Istanbul' }).format(new Date()),
    durum,
    sirala,
    q,
    rows,
    products,
    toplamBorc: r3(borclu.reduce((s, r) => s + r.net, 0)),
    toplamEmanet: r3(emanet.reduce((s, r) => s + Math.abs(r.net), 0)),
    borcluSayisi: borclu.length,
    emanetSayisi: emanet.length,
    enBuyuk: rows.reduce((m, r) => Math.max(m, Math.abs(r.net)), 0),
  };
}

export const DURUM_ETIKET: Record<Durum, string> = {
  hepsi: 'Tüm açık hesaplar',
  borclu: 'Yalnızca borçlular',
  emanet: 'Yalnızca emaneti olanlar',
};
export const SIRALA_ETIKET: Record<Sirala, string> = { ad: 'Ada göre', miktar: 'Tutara göre' };

export function reportHref(base: { durum: Durum; sirala: Sirala; q: string }, patch: Partial<{ durum: Durum; sirala: Sirala; q: string }>) {
  const m = { ...base, ...patch };
  const s = new URLSearchParams();
  if (m.durum !== 'hepsi') s.set('durum', m.durum);
  if (m.sirala !== 'ad') s.set('sirala', m.sirala);
  if (m.q) s.set('q', m.q);
  const qs = s.toString();
  return `/musteriler/rapor${qs ? `?${qs}` : ''}`;
}

export function fmtQty(birim: 'gram' | 'adet', n: number, fmtGram: (n: number) => string) {
  return birim === 'adet' ? `${Math.abs(n)} adet` : `${fmtGram(Math.abs(n))} gr`;
}
