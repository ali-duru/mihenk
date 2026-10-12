import { createClient } from "@/lib/supabase/server";
import { getSession } from "@/lib/session";
import {
  buildReport,
  type Durum,
  type Gorunum,
  type ReportBalance,
  type ReportCustomer,
  type Sirala,
} from "@/lib/report";
import { ReportFrame } from "@/components/report/ReportFrame";
import { ScreenReport } from "@/components/report/ScreenReport";
import { PrintDocument } from "@/components/report/PrintDocument";
// @ts-expect-error CSS imports are handled by the Next.js bundler.
import "./report.css";

const PAGE = 1000; // PostgREST tek sorguda en fazla 1000 satır döndürür

async function fetchAll<T>(
  build: (
    from: number,
    to: number,
  ) => PromiseLike<{ data: T[] | null; error: unknown }>,
) {
  const rows: T[] = [];
  for (let from = 0; ; from += PAGE) {
    const { data, error } = await build(from, from + PAGE - 1);
    if (error) throw error;
    rows.push(...(data ?? []));
    if (!data || data.length < PAGE) return rows;
  }
}

export default async function BalanceReportPage({
  searchParams,
}: {
  searchParams: Promise<{
    durum?: string;
    sirala?: string;
    q?: string;
    gorunum?: string;
  }>;
}) {
  const sp = await searchParams;
  const durum: Durum =
    sp.durum === "borclu" || sp.durum === "emanet" ? sp.durum : "hepsi";
  const sirala: Sirala = sp.sirala === "miktar" ? "miktar" : "ad";
  const q = (sp.q ?? "").trim().slice(0, 80);
  const gorunum: Gorunum = sp.gorunum === "liste" ? "liste" : "tablo";

  const supabase = await createClient();
  const [session, rows] = await Promise.all([
    getSession(),
    fetchAll<ReportBalance & Omit<ReportCustomer, "id">>((a, b) =>
      supabase
        .from("customer_balance_report")
        .select(
          "customer_id, ad, soyad, telefon, urun, birim, milyem, net_adet, net_gram, net_has, net_tutar, para_kodu",
        )
        .order("soyad")
        .order("ad")
        .order("customer_id")
        .order("urun")
        .order("milyem")
        .range(a, b),
    ),
  ]);

  // Görünüm müşteri başına birden fazla satır döndürür: müşteri listesini buradan çıkar
  const seen = new Map<string, ReportCustomer>();
  for (const r of rows) {
    if (!seen.has(r.customer_id))
      seen.set(r.customer_id, {
        id: r.customer_id,
        ad: r.ad,
        soyad: r.soyad,
        telefon: r.telefon,
      });
  }

  const d = buildReport({
    firma: session?.member?.firms?.ad ?? "",
    customers: [...seen.values()],
    balances: rows,
    durum,
    sirala,
    gorunum,
    q,
  });

  return (
    <ReportFrame
      screen={<ScreenReport d={d} />}
      doc={<PrintDocument d={d} />}
    />
  );
}
