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

export const fmtGram = (n: number) => gramFmt.format(n);
export const fmtDate = (s: string) => dateFmt.format(new Date(s));
