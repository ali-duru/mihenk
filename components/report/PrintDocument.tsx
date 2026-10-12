import { IBM_Plex_Serif } from "next/font/google";
import { fmtGram } from "@/lib/labels";
import {
  DURUM_ETIKET,
  SIRALA_ETIKET,
  fmtCell,
  fmtQty,
  fmtTotal,
  sheetCells,
  unitLabel,
  type ReportData,
} from "@/lib/report";

const serif = IBM_Plex_Serif({
  subsets: ["latin", "latin-ext"],
  weight: ["500", "600"],
  variable: "--font-plex-serif",
});

/** A4 baskı belgesi: antetli başlık, özet, borç/emanet sütunlu döküm, ürün toplamları ve imza alanı */
export function PrintDocument({ d }: { d: ReportData }) {
  const yatay = d.products.length > 4; // çok ürün sütunu varsa A4 yatay
  return (
    <article
      className={`doc ${serif.variable}${yatay ? " doc-landscape" : ""}`}
    >
      {yatay && <style>{"@page { size: A4 landscape; }"}</style>}
      <header className="doc-head">
        <div>
          <div className="doc-firm">{d.firma}</div>
          <div className="doc-kind">Müşteri cari bakiye listesi</div>
        </div>
        <table className="doc-meta">
          <tbody>
            <tr>
              <th>Rapor tarihi</th>
              <td>{d.tarih}</td>
            </tr>
            <tr>
              <th>Kapsam</th>
              <td>
                {DURUM_ETIKET[d.durum]}
                {d.q ? `, “${d.q}”` : ""}
              </td>
            </tr>
            <tr>
              <th>Sıralama</th>
              <td>{SIRALA_ETIKET[d.sirala]}</td>
            </tr>
            <tr>
              <th>Kayıt</th>
              <td>{d.rows.length} müşteri</td>
            </tr>
          </tbody>
        </table>
      </header>

      <table className="doc-sum">
        <tbody>
          <tr>
            <td>
              <span>Müşterilerin toplam borcu</span>
              <strong>{fmtGram(d.toplamBorc)} gr has</strong>
              <em>{d.borcluSayisi} müşteri</em>
            </td>
            <td>
              <span>Firmadaki toplam emanet</span>
              <strong>{fmtGram(d.toplamEmanet)} gr has</strong>
              <em>{d.emanetSayisi} müşteri</em>
            </td>
            <td>
              <span>Fark (borç − emanet)</span>
              <strong>
                {d.toplamBorc - d.toplamEmanet < 0 ? "−" : ""}
                {fmtGram(Math.abs(d.toplamBorc - d.toplamEmanet))} gr has
              </strong>
              <em>
                {d.toplamBorc >= d.toplamEmanet
                  ? "Firma lehine"
                  : "Müşteriler lehine"}
              </em>
            </td>
          </tr>
        </tbody>
      </table>

      <h2 className="doc-h2">Müşteri dökümü</h2>
      {d.rows.length === 0 ? (
        <p className="doc-empty">Bu kapsamda açık bakiyesi olan müşteri yok.</p>
      ) : (
        <table className="doc-tbl doc-sheet">
          <thead>
            <tr>
              <th className="c-no">#</th>
              <th className="c-name">Müşteri</th>
              <th className="c-phone">Telefon</th>
              {d.products.map((p) => (
                <th key={p.key} className="r">
                  {p.urun}
                  <br />
                  <span className="doc-sub">{unitLabel(p)}</span>
                </th>
              ))}
              <th className="r">
                Borç
                <br />
                <span className="doc-sub">gr has</span>
              </th>
              <th className="r">
                Emanet
                <br />
                <span className="doc-sub">gr has</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {d.rows.map((r, i) => {
              const cells = sheetCells(r);
              return (
                <tr key={r.id}>
                  <td className="num">{i + 1}</td>
                  <td>
                    {r.ad} {r.soyad}
                  </td>
                  {/* <td className="num">{r.telefon ?? ""}</td> */}
                  {d.products.map((p) => {
                    const c = cells.get(p.key);
                    return (
                      <td key={p.key} className="r num">
                        {c ? fmtCell(c, fmtGram) : ""}
                      </td>
                    );
                  })}
                  <td className="r num">{r.net > 0 ? fmtGram(r.net) : ""}</td>
                  <td className="r num">
                    {r.net < 0 ? fmtGram(Math.abs(r.net)) : ""}
                  </td>
                </tr>
              );
            })}
            <tr className="doc-total">
              <td colSpan={3}>Müşteride toplam</td>
              {d.products.map((p) => (
                <td key={p.key} className="r num">
                  {p.musteride ? fmtTotal(p, p.musteride, fmtGram) : ""}
                </td>
              ))}
              <td className="r num">{fmtGram(d.toplamBorc)}</td>
              <td />
            </tr>
            <tr className="doc-total">
              <td colSpan={3}>Emanette toplam</td>
              {d.products.map((p) => (
                <td key={p.key} className="r num">
                  {p.emanette ? `−${fmtTotal(p, p.emanette, fmtGram)}` : ""}
                </td>
              ))}
              <td />
              <td className="r num">{fmtGram(d.toplamEmanet)}</td>
            </tr>
          </tbody>
        </table>
      )}

      {/* {d.products.length > 0 && (
        <section className="doc-keep">
          <h2 className="doc-h2">Ürün bazında toplamlar</h2>
          <table className="doc-tbl">
            <thead>
              <tr>
                <th>Ürün</th>
                <th className="r">Milyem</th>
                <th className="r">Müşteride</th>
                <th className="r">gr has</th>
                <th className="r">Emanette</th>
                <th className="r">gr has</th>
              </tr>
            </thead>
            <tbody>
              {d.products.map((p) => (
                <tr key={p.key}>
                  <td>{p.urun}</td>
                  <td className="r num">{p.milyem ?? ""}</td>
                  <td className="r num">
                    {p.musteride
                      ? fmtQty(p.birim, p.musteride, fmtGram, p.para_kodu)
                      : ""}
                  </td>
                  <td className="r num">
                    {p.musterideHas ? fmtGram(p.musterideHas) : ""}
                  </td>
                  <td className="r num">
                    {p.emanette
                      ? fmtQty(p.birim, p.emanette, fmtGram, p.para_kodu)
                      : ""}
                  </td>
                  <td className="r num">
                    {p.emanetteHas ? fmtGram(p.emanetteHas) : ""}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )} */}

      {/* <footer className="doc-keep doc-foot">
        <p>
          Borç sütunu müşterinin firmaya olan borcunu, emanet sütunu firmada
          duran müşteri emanetini gösterir. Has karşılığı gram × milyem / 1000
          ile hesaplanır; para birimleri has toplamına katılmaz. Ürün
          sütunlarında işaretsiz değer müşteride duran, − işaretli değer
          emanette duran malı gösterir; boş hücre o üründe hareket olmadığını
          belirtir.
        </p>
        <div className="doc-sign">
          <div>
            <span>Hazırlayan</span>
          </div>
          <div>
            <span>Kontrol eden</span>
          </div>
          <div>
            <span>Tarih ve kaşe</span>
          </div>
        </div>
      </footer> */}
    </article>
  );
}
