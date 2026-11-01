import type { Locale } from "@/i18n/config";

const intlLocale: Record<Locale, string> = { pt: "pt-BR", en: "en-US" };

export function formatters(locale: Locale) {
  const loc = intlLocale[locale];
  const cache = new Map<string, Intl.NumberFormat>();
  const nf = (key: string, opts: Intl.NumberFormatOptions) => {
    if (!cache.has(key)) cache.set(key, new Intl.NumberFormat(loc, opts));
    return cache.get(key)!;
  };

  return {
    /** 98.199 */
    int: (v: number) => nf("int", { maximumFractionDigits: 0 }).format(v),
    /** 4,29 */
    dec: (v: number, digits = 2) =>
      nf(`dec${digits}`, { minimumFractionDigits: digits, maximumFractionDigits: digits }).format(v),
    /** 12,1% */
    pct: (v: number, digits = 1) =>
      nf(`pct${digits}`, {
        style: "percent",
        minimumFractionDigits: digits,
        maximumFractionDigits: digits,
      }).format(v),
    /** R$ 160,24 */
    brl: (v: number) =>
      nf("brl", { style: "currency", currency: "BRL", maximumFractionDigits: 2 }).format(v),
    /** R$ 15,7 mi */
    brlCompact: (v: number) =>
      nf("brlc", {
        style: "currency",
        currency: "BRL",
        notation: "compact",
        maximumFractionDigits: 1,
      }).format(v),
    /** 12,9 mil */
    compact: (v: number) =>
      nf("compact", { notation: "compact", maximumFractionDigits: 1 }).format(v),
    /** −0,88 (sinal de menos tipográfico) */
    signed: (v: number, digits = 2) =>
      nf(`signed${digits}`, {
        minimumFractionDigits: digits,
        maximumFractionDigits: digits,
        signDisplay: "exceptZero",
      })
        .format(v)
        .replace("-", "−"),
    month: (ym: string, style: "short" | "long" = "short") => {
      const [y, m] = ym.split("-").map(Number);
      return new Intl.DateTimeFormat(loc, { month: style, year: "2-digit", timeZone: "UTC" })
        .format(new Date(Date.UTC(y, m - 1, 1)))
        .replace(".", "");
    },
    date: (iso: string) =>
      new Intl.DateTimeFormat(loc, { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" }).format(
        new Date(`${iso}T00:00:00Z`),
      ),
  };
}

export type Formatters = ReturnType<typeof formatters>;

/** Substitui {chave} no texto. */
export function fill(template: string, vars: Record<string, string | number>) {
  return template.replace(/\{(\w+)\}/g, (_, k) => String(vars[k] ?? `{${k}}`));
}
