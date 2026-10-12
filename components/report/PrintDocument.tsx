import { IBM_Plex_Serif } from 'next/font/google';
import { fmtGram } from '@/lib/labels';
import { DURUM_ETIKET, SIRALA_ETIKET, fmtQty, type ReportData } from '@/lib/report';

const serif = IBM_Plex_Serif({ subsets: ['latin', 'latin-ext'], weight: ['500', '600'], variable: '--font-plex-serif' });

/** A4 baskı belgesi: antetli başlık, özet, borç/emanet sütunlu döküm, ürün toplamları ve imza alanı */
export function PrintDocument({ d }: { d: ReportData }) {
  return (
    <article className={`doc ${serif.variable}`}>
      <header className="doc-head">
        <div>
          <div className="doc-firm">{d.firma}</div>
          <div className="doc-kind">Müşteri cari bakiye listesi</div>
        </div>
        <table className="doc-meta">
          <tbody>
            <tr><th>Rapor tarihi</th><td>{d.tarih}</td></tr>
            <tr><th>Kapsam</th><td>{DURUM_ETIKET[d.durum]}{d.q ? `, “${d.q}”` : ''}</td></tr>
            <tr><th>Sıralama</th><td>{SIRALA_ETIKET[d.sirala]}</td></tr>
            <tr><th>Kayıt</th><td>{d.rows.length} müşteri</td></tr>
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
              <strong>{d.toplamBorc - d.toplamEmanet < 0 ? '−' : ''}{fmtGram(Math.abs(d.toplamBorc - d.toplamEmanet))} gr has</strong>
              <em>{d.toplamBorc >= d.toplamEmanet ? 'Firma lehine' : 'Müşteriler lehine'}</em>
            </td>
          </tr>
        </tbody>
      </table>

      <h2 className="doc-h2">Müşteri dökümü</h2>
      {d.rows.length === 0 ? (
        <p className="doc-empty">Bu kapsamda açık bakiyesi olan müşteri yok.</p>
      ) : (
        <table className="doc-tbl">
          <colgroup>
            <col style={{ width: '6%' }} />
            <col style={{ width: '22%' }} />
            <col style={{ width: '15%' }} />
            <col />
            <col style={{ width: '13%' }} />
            <col style={{ width: '13%' }} />
          </colgroup>
          <thead>
            <tr>
              <th>Sıra</th>
              <th>Müşteri</th>
              <th>Telefon</th>
              <th>Ürün dökümü</th>
              <th className="r">Borç<br />gr has</th>
              <th className="r">Emanet<br />gr has</th>
            </tr>
          </thead>
          <tbody>
            {d.rows.map((r, i) => (
              <tr key={r.id}>
                <td className="num">{i + 1}</td>
                <td>{r.ad} {r.soyad}</td>
                <td className="num">{r.telefon}</td>
                <td>
                  {r.items.map((b) => (
                    <div key={`${b.urun}-${b.milyem}`} className="doc-item">
                      <span className="num">{b.net_has > 0 ? '+' : '−'}</span> {b.urun} ({b.milyem}){' '}
                      <span className="num">{fmtQty(b.birim, b.birim === 'adet' ? b.net_adet : b.net_gram, fmtGram)}</span>
                    </div>
                  ))}
                </td>
                <td className="r num">{r.net > 0 ? fmtGram(r.net) : ''}</td>
                <td className="r num">{r.net < 0 ? fmtGram(Math.abs(r.net)) : ''}</td>
              </tr>
            ))}
            <tr className="doc-total">
              <td colSpan={4}>Toplam</td>
              <td className="r num">{fmtGram(d.toplamBorc)}</td>
              <td className="r num">{fmtGram(d.toplamEmanet)}</td>
            </tr>
          </tbody>
        </table>
      )}

      {d.products.length > 0 && (
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
                  <td className="r num">{p.milyem}</td>
                  <td className="r num">{p.musteride ? fmtQty(p.birim, p.musteride, fmtGram) : ''}</td>
                  <td className="r num">{p.musterideHas ? fmtGram(p.musterideHas) : ''}</td>
                  <td className="r num">{p.emanette ? fmtQty(p.birim, p.emanette, fmtGram) : ''}</td>
                  <td className="r num">{p.emanetteHas ? fmtGram(p.emanetteHas) : ''}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}

      <footer className="doc-keep doc-foot">
        <p>
          Borç sütunu müşterinin firmaya olan borcunu, emanet sütunu firmada duran müşteri emanetini gösterir.
          Has karşılığı gram × milyem / 1000 ile hesaplanır. Ürün dökümünde + müşteride duran, − emanette duran malı ifade eder.
        </p>
        <div className="doc-sign">
          <div><span>Hazırlayan</span></div>
          <div><span>Kontrol eden</span></div>
          <div><span>Tarih ve kaşe</span></div>
        </div>
      </footer>
    </article>
  );
}
