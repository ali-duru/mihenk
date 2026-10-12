import Link from "next/link";
import { fmtGram } from "@/lib/labels";
import { SheetTable } from "./SheetTable";
import {
  DURUM_ETIKET,
  SIRALA_ETIKET,
  fmtQty,
  qtyOf,
  reportHref,
  rowSide,
  type Durum,
  type ReportData,
  type Sirala,
} from "@/lib/report";

export function ScreenReport({ d }: { d: ReportData }) {
  const base = { durum: d.durum, sirala: d.sirala, q: d.q, gorunum: d.gorunum };
  const toplam = d.toplamBorc + d.toplamEmanet;
  const borcPay = toplam > 0 ? (d.toplamBorc / toplam) * 100 : 50;

  return (
    <>
      <header className="r-head">
        <h1>Bakiye raporu</h1>
        <p>{d.tarih} itibarıyla açık hesaplar</p>
      </header>

      <section className="r-summary" aria-label="Özet">
        <div className="r-fig borc">
          <span className="r-label">Müşterilerdeki altın</span>
          <span className="r-big num">{fmtGram(d.toplamBorc)}</span>
          <span className="r-unit">
            gr has, {d.borcluSayisi} borçlu müşteri
          </span>
        </div>
        <div className="r-fig alacak">
          <span className="r-label">Firmadaki emanet</span>
          <span className="r-big num">{fmtGram(d.toplamEmanet)}</span>
          <span className="r-unit">gr has, {d.emanetSayisi} müşteri</span>
        </div>
        <div
          className="r-scale"
          role="img"
          aria-label={`Borç payı yüzde ${Math.round(borcPay)}`}
        >
          <span className="seg-borc" style={{ width: `${borcPay}%` }} />
          <span className="seg-alacak" style={{ width: `${100 - borcPay}%` }} />
        </div>
      </section>

      {d.products.length > 0 && (
        <section className="panel r-products">
          <h2>Ürün bazında</h2>
          <div className="scroll">
            <table className="tbl">
              <thead>
                <tr>
                  <th>Ürün</th>
                  <th className="r">Müşteride</th>
                  <th className="r">Has</th>
                  <th className="r">Emanette</th>
                  <th className="r">Has</th>
                </tr>
              </thead>
              <tbody>
                {d.products.map((p) => (
                  <tr key={p.key}>
                    <td>
                      {p.urun}{" "}
                      <span className="muted num">
                        {p.birim === "para" ? p.para_kodu : p.milyem}
                      </span>
                    </td>
                    <td className="r num">
                      {p.musteride
                        ? fmtQty(p.birim, p.musteride, fmtGram, p.para_kodu)
                        : ""}
                    </td>
                    <td className="r num t-borc">
                      {p.musterideHas ? fmtGram(p.musterideHas) : ""}
                    </td>
                    <td className="r num">
                      {p.emanette
                        ? fmtQty(p.birim, p.emanette, fmtGram, p.para_kodu)
                        : ""}
                    </td>
                    <td className="r num t-alacak">
                      {p.emanetteHas ? fmtGram(p.emanetteHas) : ""}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      <section className="r-list">
        <div className="r-controls">
          <nav className="seg" aria-label="Görünüm">
            <Link
              href={reportHref(base, { gorunum: "tablo" })}
              aria-current={d.gorunum === "tablo" ? "page" : undefined}
            >
              Tablo
            </Link>
            <Link
              href={reportHref(base, { gorunum: "liste" })}
              aria-current={d.gorunum === "liste" ? "page" : undefined}
            >
              Liste
            </Link>
          </nav>
          <nav className="seg" aria-label="Kapsam">
            {(Object.keys(DURUM_ETIKET) as Durum[]).map((k) => (
              <Link
                key={k}
                href={reportHref(base, { durum: k })}
                aria-current={d.durum === k ? "page" : undefined}
              >
                {k === "hepsi"
                  ? "Tümü"
                  : k === "borclu"
                    ? "Borçlular"
                    : "Emanetler"}
              </Link>
            ))}
          </nav>
          <nav className="seg" aria-label="Sıralama">
            {(Object.keys(SIRALA_ETIKET) as Sirala[]).map((k) => (
              <Link
                key={k}
                href={reportHref(base, { sirala: k })}
                aria-current={d.sirala === k ? "page" : undefined}
              >
                {SIRALA_ETIKET[k]}
              </Link>
            ))}
          </nav>
          <form className="r-search" role="search">
            {d.durum !== "hepsi" && (
              <input type="hidden" name="durum" value={d.durum} />
            )}
            {d.sirala !== "ad" && (
              <input type="hidden" name="sirala" value={d.sirala} />
            )}
            {d.gorunum === "liste" && (
              <input type="hidden" name="gorunum" value="liste" />
            )}
            <input
              name="q"
              defaultValue={d.q}
              placeholder="Ad veya telefon ara"
              aria-label="Müşteri ara"
            />
          </form>
        </div>

        {d.rows.length === 0 ? (
          <div className="empty">
            <p>
              {d.q
                ? `“${d.q}” ile eşleşen açık hesap yok.`
                : "Bu kapsamda açık bakiyesi olan müşteri yok."}
            </p>
          </div>
        ) : d.gorunum === "tablo" ? (
          <SheetTable d={d} />
        ) : (
          <ul className="r-rows">
            {d.rows.map((r) => {
              const yon = rowSide(r);
              const durum = yon > 0 ? "borc" : yon < 0 ? "alacak" : "denk";
              const genislik =
                d.enBuyuk > 0
                  ? Math.max(3, (Math.abs(r.net) / d.enBuyuk) * 100)
                  : 0;
              return (
                <li key={r.id}>
                  <Link href={`/musteriler/${r.id}`} className="r-row">
                    <span className="who">
                      <strong>
                        {r.ad} {r.soyad}
                      </strong>
                      {/* {r.telefon && <small className="num">{r.telefon}</small>} */}
                    </span>
                    <span className="chips">
                      {r.items.map((b) => (
                        <span
                          key={`${b.urun}-${b.milyem}`}
                          className={`chip ${qtyOf(b) > 0 ? "borc" : "alacak"}`}
                        >
                          {b.urun}{" "}
                          <span className="num">
                            {fmtQty(b.birim, qtyOf(b), fmtGram, b.para_kodu)}
                          </span>
                        </span>
                      ))}
                    </span>
                    <span className={`amount ${durum}`}>
                      <strong className="num">
                        {fmtGram(Math.abs(r.net))} gr
                      </strong>
                      <small>
                        {durum === "borc"
                          ? "Borçlu"
                          : durum === "alacak"
                            ? "Emaneti var"
                            : "Denk"}
                      </small>
                      <span className="meter">
                        <span style={{ width: `${genislik}%` }} />
                      </span>
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </>
  );
}
