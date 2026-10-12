export type FormState = {
  error?: string;
  message?: string;
  ok?: boolean;
  ts?: number;
};

export const HAREKET_TIPLERI = ["emanet_birakma", "emanet_iadesi"] as const;
export type HareketTipi = (typeof HAREKET_TIPLERI)[number];

export const TIP_BILGI: Record<HareketTipi, { ad: string; etki: string }> = {
  emanet_birakma: { ad: "Emanet bıraktı", etki: "Firma borçlanır" },
  emanet_iadesi: { ad: "Emanetini aldı", etki: "Firmanın borcu azalır" },
};

const gramFmt = new Intl.NumberFormat("tr-TR", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 3,
});
const dateFmt = new Intl.DateTimeFormat("tr-TR", {
  dateStyle: "short",
  timeStyle: "short",
  timeZone: "Europe/Istanbul",
});

export type Birim = "gram" | "adet" | "para";

const moneyFmt = new Intl.NumberFormat("tr-TR", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});
const SEMBOL: Record<string, string> = { TRY: "₺", USD: "$", EUR: "€" };

export const fmtGram = (n: number) => gramFmt.format(n);
/** 1.250,00 ₺ / 300,00 $ — bilinmeyen kodlarda kodun kendisi yazılır */
export const fmtMoney = (n: number, kod?: string | null) =>
  `${moneyFmt.format(n)} ${kod ? (SEMBOL[kod] ?? kod) : ""}`.trim();
export const fmtDate = (s: string) => dateFmt.format(new Date(s));
