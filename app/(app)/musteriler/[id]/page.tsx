import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Has } from "@/components/Has";
import { RevealTc } from "@/components/RevealTc";
import { MovementForm, type ItemType } from "@/components/MovementForm";
import {
  TIP_BILGI,
  fmtDate,
  fmtGram,
  fmtMoney,
  type Birim,
  type HareketTipi,
} from "@/lib/labels";

type Balance = {
  item_type_id: string;
  urun: string;
  birim: Birim;
  milyem: number | null;
  net_adet: number;
  net_gram: number;
  net_has: number;
  net_tutar: number;
  para_kodu: string | null;
};

type Movement = {
  id: number;
  tip: HareketTipi;
  milyem: number | null;
  adet: number | null;
  gram: number | null;
  has_gram: number | null;
  tutar: number | null;
  yon: number;
  aciklama: string | null;
  created_at: string;
  item_types: { ad: string; para_kodu: string | null } | null;
};

export default async function CustomerPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const supabase = await createClient();

  const [{ data: c }, { data: balances }, { data: moves }, { data: types }] =
    await Promise.all([
      supabase
        .from("customers")
        .select("id, ad, soyad, tc_maske, telefon, adres, aciklama, created_at")
        .eq("id", id)
        .maybeSingle(),
      supabase
        .from("customer_balances")
        .select("*")
        .eq("customer_id", id)
        .order("urun"),
      supabase
        .from("customer_movements")
        .select(
          "id, tip, milyem, adet, gram, has_gram, tutar, yon, aciklama, created_at, item_types(ad, para_kodu)",
        )
        .eq("customer_id", id)
        .order("created_at", { ascending: false })
        .limit(100),
      supabase
        .from("item_types")
        .select("id, ad, birim, varsayilan_milyem, birim_gram, para_kodu")
        .eq("aktif", true)
        .order("ad"),
    ]);

  if (!c) notFound();

  const rows = (balances ?? []) as Balance[];
  const history = (moves ?? []) as unknown as Movement[];
  const netHas = rows.reduce((sum, b) => sum + Number(b.net_has), 0);
  const state =
    Math.abs(netHas) < 0.0005 ? "kapali" : netHas > 0 ? "borc" : "alacak";
  const paraBakiyeleri = rows.filter((b) => b.birim === "para");

  return (
    <>
      <div className="pagehead">
        <Link href="/musteriler" className="back">
          Müşteriler
        </Link>
      </div>

      <section className="stone" aria-label="Müşteri özeti">
        <div className="stone-who">
          <h1>
            {c.ad} {c.soyad}
          </h1>
          <dl>
            {c.tc_maske && (
              <div>
                <dt>TC kimlik</dt>
                <dd>
                  <RevealTc id={c.id} masked={c.tc_maske} />
                </dd>
              </div>
            )}
            {c.telefon && (
              <div>
                <dt>Telefon</dt>
                <dd className="num">
                  <a href={`tel:${c.telefon}`}>{c.telefon}</a>
                </dd>
              </div>
            )}
            {c.adres && (
              <div>
                <dt>Adres</dt>
                <dd>{c.adres}</dd>
              </div>
            )}
            {c.aciklama && (
              <div>
                <dt>Açıklama</dt>
                <dd>{c.aciklama}</dd>
              </div>
            )}
          </dl>
        </div>
        <div className={`streak ${state}`}>
          <span className="big num">{fmtGram(Math.abs(netHas))}</span>
          <span className="unit">gr has</span>
          <span className="verdict">
            {state === "kapali"
              ? paraBakiyeleri.length
                ? "Altın bakiyesi yok"
                : "Hesap kapalı"
              : state === "borc"
                ? "Müşteri firmaya borçlu"
                : "Firma müşteriye borçlu"}
          </span>
          {paraBakiyeleri.map((b) => (
            <span
              key={b.item_type_id}
              className={`money num ${Number(b.net_tutar) > 0 ? "borc" : "alacak"}`}
            >
              {Number(b.net_tutar) > 0 ? "+" : "−"}
              {fmtMoney(Math.abs(Number(b.net_tutar)), b.para_kodu)}
            </span>
          ))}
        </div>
      </section>

      <div className="cols">
        <section className="panel">
          <h2>Ürün bazında bakiye</h2>
          {rows.length === 0 ? (
            <p className="aside">Açık bakiye yok.</p>
          ) : (
            <div className="scroll">
              <table className="tbl">
                <thead>
                  <tr>
                    <th>Ürün</th>
                    <th>Milyem</th>
                    <th className="r">Miktar</th>
                    <th className="r">Has</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((b) => (
                    <tr key={`${b.item_type_id}-${b.milyem}`}>
                      <td>{b.urun}</td>
                      <td className="num">{b.milyem ?? ""}</td>
                      <td className="r num">
                        {b.birim === "para"
                          ? fmtMoney(Math.abs(Number(b.net_tutar)), b.para_kodu)
                          : b.birim === "adet"
                            ? `${Math.abs(Number(b.net_adet))} adet`
                            : `${fmtGram(Math.abs(Number(b.net_gram)))} gr`}
                      </td>
                      <td className="r">
                        {b.birim === "para" ? (
                          <span
                            className={`has ${Number(b.net_tutar) > 0 ? "borc" : "alacak"}`}
                          >
                            <small>
                              {Number(b.net_tutar) > 0
                                ? "Müşteri borçlu"
                                : "Emaneti var"}
                            </small>
                          </span>
                        ) : (
                          <Has value={Number(b.net_has)} />
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section className="panel">
          <h2>Yeni hareket</h2>
          <MovementForm customerId={c.id} types={(types ?? []) as ItemType[]} />
        </section>
      </div>

      <section className="panel history">
        <h2>Hareketler</h2>
        {history.length === 0 ? (
          <p className="aside">Bu müşteri için henüz hareket girilmedi.</p>
        ) : (
          <div className="scroll">
            <table className="tbl">
              <thead>
                <tr>
                  <th>Tarih</th>
                  <th>İşlem</th>
                  <th>Ürün</th>
                  <th>Milyem</th>
                  <th className="r">Miktar</th>
                  <th className="r">Has</th>
                  <th>Açıklama</th>
                </tr>
              </thead>
              <tbody>
                {history.map((m) => (
                  <tr key={m.id}>
                    <td className="num nowrap">{fmtDate(m.created_at)}</td>
                    <td>{TIP_BILGI[m.tip].ad}</td>
                    <td>{m.item_types?.ad}</td>
                    <td className="num">{m.milyem ?? ""}</td>
                    <td className="r num nowrap">
                      {m.tutar != null
                        ? `${m.yon > 0 ? "+" : "−"}${fmtMoney(Number(m.tutar), m.item_types?.para_kodu)}`
                        : m.adet
                          ? `${m.adet} adet`
                          : `${fmtGram(Number(m.gram))} gr`}
                    </td>
                    <td
                      className={`r num nowrap ${m.yon > 0 ? "t-borc" : "t-alacak"}`}
                    >
                      {m.has_gram != null
                        ? `${m.yon > 0 ? "+" : "−"}${fmtGram(Number(m.has_gram))}`
                        : ""}
                    </td>
                    <td className="muted">{m.aciklama}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <p className="aside">
          Kayıtlar silinmez. Hatalı girişi düzeltmek için ters işlem girin.
        </p>
      </section>
    </>
  );
}
