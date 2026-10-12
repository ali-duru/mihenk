import Link from "next/link";
import { fmtGram } from "@/lib/labels";
import {
  fmtCell,
  fmtTotal,
  sheetCells,
  unitLabel,
  type ReportData,
} from "@/lib/report";

/** Excel benzeri tablo: her müşteri bir satır, her ürün bir sütun. Veri yoksa hücre boş. */
export function SheetTable({ d }: { d: ReportData }) {
  return (
    <div
      className="sheet-wrap"
      role="region"
      aria-label="Müşteri bakiye tablosu"
      tabIndex={0}
    >
      <table className="sheet">
        <thead>
          <tr>
            <th className="sh-no" scope="col">
              #
            </th>
            <th className="sh-name" scope="col">
              Müşteri
            </th>
            {/* <th className="sh-phone" scope="col">
              Telefon
            </th> */}
            {d.products.map((p) => (
              <th key={p.key} scope="col" className="sh-prod">
                <span>{p.urun}</span>
                <small className="num">{unitLabel(p)}</small>
              </th>
            ))}
            <th scope="col" className="sh-sum">
              Borç<small>gr has</small>
            </th>
            <th scope="col" className="sh-sum">
              Emanet<small>gr has</small>
            </th>
          </tr>
        </thead>
        <tbody>
          {d.rows.map((r, i) => {
            const cells = sheetCells(r);
            return (
              <tr key={r.id}>
                <td className="sh-no num">{i + 1}</td>
                <td className="sh-name">
                  <Link href={`/musteriler/${r.id}`}>
                    {r.ad} {r.soyad}
                  </Link>
                </td>
                {/* <td className="sh-phone num">{r.telefon ?? ""}</td> */}
                {d.products.map((p) => {
                  const c = cells.get(p.key);
                  return (
                    <td
                      key={p.key}
                      className={`num r${c ? (c.qty > 0 ? " t-borc" : " t-alacak") : ""}`}
                    >
                      {c ? fmtCell(c, fmtGram) : ""}
                    </td>
                  );
                })}
                <td className="num r sh-sum t-borc">
                  {r.net > 0 ? fmtGram(r.net) : ""}
                </td>
                <td className="num r sh-sum t-alacak">
                  {r.net < 0 ? fmtGram(Math.abs(r.net)) : ""}
                </td>
              </tr>
            );
          })}
        </tbody>
        <tfoot>
          <tr>
            <td className="sh-no" />
            <th scope="row" className="sh-name">
              Müşteride toplam
            </th>
            {/* <td className="sh-phone" /> */}
            {d.products.map((p) => (
              <td key={p.key} className="num r t-borc">
                {p.musteride ? fmtTotal(p, p.musteride, fmtGram) : ""}
              </td>
            ))}
            <td className="num r sh-sum t-borc">{fmtGram(d.toplamBorc)}</td>
            <td className="sh-sum" />
          </tr>
          <tr>
            <td className="sh-no" />
            <th scope="row" className="sh-name">
              Emanette toplam
            </th>
            {/* <td className="sh-phone" /> */}
            {d.products.map((p) => (
              <td key={p.key} className="num r t-alacak">
                {p.emanette ? `−${fmtTotal(p, p.emanette, fmtGram)}` : ""}
              </td>
            ))}
            <td className="sh-sum" />
            <td className="num r sh-sum t-alacak">{fmtGram(d.toplamEmanet)}</td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
}
