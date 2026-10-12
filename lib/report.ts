import type { Birim } from "./labels";
import { fmtMoney } from "./labels";

export type Durum = "hepsi" | "borclu" | "emanet";
export type Sirala = "ad" | "miktar";
export type Gorunum = "tablo" | "liste";

export type ReportCustomer = {
  id: string;
  ad: string;
  soyad: string;
  telefon: string | null;
};
export type ReportBalance = {
  customer_id: string;
  urun: string;
  birim: Birim;
  milyem: number | null;
  net_adet: number;
  net_gram: number;
  net_has: number;
  net_tutar: number;
  para_kodu: string | null;
};
export type ReportRow = ReportCustomer & {
  items: ReportBalance[];
  net: number;
};
export type ProductTotal = {
  key: string;
  urun: string;
  milyem: number | null;
  birim: Birim;
  para_kodu: string | null;
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
  gorunum: Gorunum;
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
  gorunum?: Gorunum;
  q: string;
}): ReportData {
  const { customers, balances, durum, sirala, q } = input;

  const byCustomer = new Map<string, ReportBalance[]>();
  for (const b of balances) {
    const list = byCustomer.get(b.customer_id) ?? [];
    list.push({
      ...b,
      net_adet: Number(b.net_adet),
      net_gram: Number(b.net_gram),
      net_has: Number(b.net_has),
      net_tutar: Number(b.net_tutar ?? 0),
      para_kodu: b.para_kodu ?? null,
    });
    byCustomer.set(b.customer_id, list);
  }

  const needle = q.toLocaleLowerCase("tr");
  let rows: ReportRow[] = customers
    .map((c) => {
      const items = byCustomer.get(c.id) ?? [];
      return { ...c, items, net: r3(items.reduce((s, b) => s + b.net_has, 0)) };
    })
    .filter((r) => r.items.length > 0)
    .filter((r) =>
      durum === "borclu"
        ? rowSide(r) > 0
        : durum === "emanet"
          ? rowSide(r) < 0
          : true,
    )
    .filter((r) =>
      needle
        ? `${r.ad} ${r.soyad} ${r.telefon ?? ""}`
            .toLocaleLowerCase("tr")
            .includes(needle)
        : true,
    );

  if (sirala === "miktar")
    rows = [...rows].sort((a, b) => Math.abs(b.net) - Math.abs(a.net));

  // Ürün toplamları: müşteride duran ve emanette duran ayrı toplanır, birbirini götürmez
  const pmap = new Map<string, ProductTotal>();
  for (const r of rows) {
    for (const b of r.items) {
      const key = balanceKey(b);
      const t = pmap.get(key) ?? {
        key,
        urun: b.urun,
        milyem: b.milyem,
        birim: b.birim,
        para_kodu: b.para_kodu,
        musteride: 0,
        musterideHas: 0,
        emanette: 0,
        emanetteHas: 0,
      };
      const qty = qtyOf(b);
      if (qty > 0) {
        t.musteride += qty;
        t.musterideHas += b.net_has;
      } else {
        t.emanette += Math.abs(qty);
        t.emanetteHas += Math.abs(b.net_has);
      }
      pmap.set(key, t);
    }
  }
  // Altın ürünleri önce, para birimleri en sağda
  const products = [...pmap.values()].sort(
    (a, b) =>
      Number(a.birim === "para") - Number(b.birim === "para") ||
      a.urun.localeCompare(b.urun, "tr") ||
      (b.milyem ?? 0) - (a.milyem ?? 0),
  );

  const borclu = rows.filter((r) => r.net > 0);
  const emanet = rows.filter((r) => r.net < 0);

  return {
    firma: input.firma,
    tarih: new Intl.DateTimeFormat("tr-TR", {
      dateStyle: "long",
      timeStyle: "short",
      timeZone: "Europe/Istanbul",
    }).format(new Date()),
    durum,
    sirala,
    gorunum: input.gorunum ?? "tablo",
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
  hepsi: "Tüm açık hesaplar",
  borclu: "Yalnızca borçlular",
  emanet: "Yalnızca emaneti olanlar",
};
export const SIRALA_ETIKET: Record<Sirala, string> = {
  ad: "Ada göre",
  miktar: "Tutara göre",
};

type HrefState = { durum: Durum; sirala: Sirala; q: string; gorunum?: Gorunum };

export function reportHref(base: HrefState, patch: Partial<HrefState>) {
  const m = { ...base, ...patch };
  const s = new URLSearchParams();
  if (m.gorunum === "liste") s.set("gorunum", "liste");
  if (m.durum !== "hepsi") s.set("durum", m.durum);
  if (m.sirala !== "ad") s.set("sirala", m.sirala);
  if (m.q) s.set("q", m.q);
  const qs = s.toString();
  return `/musteriler/rapor${qs ? `?${qs}` : ""}`;
}

export function fmtQty(
  birim: Birim,
  n: number,
  fmtGram: (n: number) => string,
  paraKodu?: string | null,
) {
  if (birim === "para") return fmtMoney(Math.abs(n), paraKodu);
  return birim === "adet"
    ? `${Math.abs(n)} adet`
    : `${fmtGram(Math.abs(n))} gr`;
}

/** İşaretli miktar: + müşteride / müşteri borçlu, − emanette */
export function qtyOf(b: ReportBalance): number {
  return b.birim === "para"
    ? b.net_tutar
    : b.birim === "adet"
      ? b.net_adet
      : b.net_gram;
}

export function balanceKey(b: { urun: string; milyem: number | null }) {
  return `${b.urun}|${b.milyem ?? ""}`;
}

/** Sütun başlığındaki alt satır: "916 · gr", "916 · adet", "USD" */
export function unitLabel(p: {
  birim: Birim;
  milyem: number | null;
  para_kodu: string | null;
}) {
  if (p.birim === "para") return p.para_kodu ?? "";
  return `${p.milyem} · ${p.birim === "adet" ? "adet" : "gr"}`;
}

/** Ürün toplamını birimine göre yaz (para için sembolsüz tutar) */
export function fmtTotal(
  p: { birim: Birim },
  n: number,
  fmtGram: (n: number) => string,
) {
  if (p.birim === "adet") return String(n);
  if (p.birim === "para") return fmtMoney(n);
  return fmtGram(n);
}

/** Borç/emanet yönü: önce has bakiyesine, has sıfırsa para bakiyesine bakılır */
export function rowSide(r: ReportRow): number {
  if (r.net !== 0) return Math.sign(r.net);
  const para = r.items.find((b) => b.birim === "para" && b.net_tutar !== 0);
  return para ? Math.sign(para.net_tutar) : 0;
}

/** Excel düzeni için tek hücre: işaretli miktar (+ müşteride, − emanette) */
export type SheetCell = { qty: number; has: number; birim: Birim };

/** Müşteri başına bir satır, ürün (ad + milyem) başına bir sütun */
export function sheetCells(r: ReportRow): Map<string, SheetCell> {
  const m = new Map<string, SheetCell>();
  for (const b of r.items) {
    m.set(balanceKey(b), { qty: qtyOf(b), has: b.net_has, birim: b.birim });
  }
  return m;
}

export function fmtCell(c: SheetCell, fmtGram: (n: number) => string) {
  const abs = Math.abs(c.qty);
  const v =
    c.birim === "adet"
      ? String(abs)
      : c.birim === "para"
        ? fmtMoney(abs)
        : fmtGram(abs);
  return c.qty < 0 ? `−${v}` : v;
}
