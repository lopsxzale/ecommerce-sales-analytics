import { notFound } from "next/navigation";
import { codeToHtml } from "shiki";
import { CategoryBars, StateTileMap } from "@/components/charts/revenue-charts";
import { DelayChart } from "@/components/charts/delay-chart";
import { HeatmapChart, MonthlyChart } from "@/components/charts/seasonality-charts";
import { LogisticsChart } from "@/components/charts/logistics-chart";
import { RfmChart } from "@/components/charts/rfm-chart";
import { About, Actions, Footer, Method } from "@/components/closing";
import { Header } from "@/components/header";
import { Hero } from "@/components/hero";
import { Providers, type HighlightedSql } from "@/components/providers";
import { Section } from "@/components/section";
import { Summary } from "@/components/summary";
import { hasLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n";
import { deliveryReview, logistics, revenue, rfm, seasonality, sqlFiles } from "@/lib/data";
import { fill, formatters } from "@/lib/format";
import { categoryLabel } from "@/lib/labels";
import meta from "@/data/meta.json";

// Destaque de sintaxe roda no build; o cliente recebe só o HTML pronto.
async function highlightSql(): Promise<HighlightedSql> {
  const entries = await Promise.all(
    Object.entries(sqlFiles).map(async ([id, raw]) => {
      const html = await codeToHtml(raw, {
        lang: "sql",
        themes: { light: "github-light", dark: "github-dark" },
        defaultColor: "light",
      });
      return [id, { html, raw }] as const;
    }),
  );
  return Object.fromEntries(entries);
}

export default async function Page({ params }: PageProps<"/[lang]">) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  const t = getDictionary(lang);
  const f = formatters(lang);
  const sql = await highlightSql();

  const s = deliveryReview.stats;
  const shareOf = (codes: string[]) =>
    revenue.states.filter((x) => codes.includes(x.state)).reduce((sum, x) => sum + x.revenue_share, 0);
  const top10 = revenue.categories.slice(0, 10);
  const bestTicket = top10.reduce((a, b) => (b.avg_ticket > a.avg_ticket ? b : a));
  const peak = seasonality.peak_days[0];
  const totalCustomers = rfm.segments.reduce((sum, x) => sum + x.customers, 0);
  const atRisk = rfm.segments.find((x) => x.segment === "at_risk_high_value")!;

  return (
    <Providers lang={lang} sql={sql}>
      <Header />
      <main>
        <Hero />
        <Summary />

        <Section
          id="delays"
          index="01"
          eyebrow={t.delays.eyebrow}
          title={t.delays.title}
          lede={fill(t.delays.lede, {
            n: f.int(s.n_on_time + s.n_late),
            onTime: f.dec(s.mean_on_time),
            late: f.dec(s.mean_late),
            negOnTime: f.pct(s.negative_rate_on_time, 0),
            negLate: f.pct(s.negative_rate_late, 0),
          })}
          takeaway={fill(t.delays.takeaway, {
            now: f.dec(s.avg_score_now),
            ideal: f.dec(s.avg_score_if_no_delays),
          })}
        >
          <DelayChart />
        </Section>

        <Section
          id="revenue"
          index="02"
          eyebrow={t.revenue.eyebrow}
          title={t.revenue.title}
          lede={fill(t.revenue.lede, {
            top3: f.pct(shareOf(["SP", "RJ", "MG"]), 0),
            categories: revenue.categories.length,
            top10: f.pct(top10[top10.length - 1].cumulative_share, 0),
          })}
          takeaway={fill(t.revenue.takeaway, {
            bestCategory: categoryLabel(bestTicket, lang),
            bestTicket: f.brl(bestTicket.avg_ticket),
          })}
        >
          <div className="grid gap-4 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
            <StateTileMap />
            <CategoryBars />
          </div>
        </Section>

        <Section
          id="seasonality"
          index="03"
          eyebrow={t.seasonality.eyebrow}
          title={t.seasonality.title}
          lede={fill(t.seasonality.lede, {
            peakDay: f.date(peak.day),
            peakOrders: f.int(peak.orders),
            peakX: `${f.dec(peak.vs_daily_avg, 1)}×`,
          })}
          takeaway={t.seasonality.takeaway}
        >
          <div className="grid gap-4 xl:grid-cols-2 [&>*]:min-w-0">
            <MonthlyChart />
            <HeatmapChart />
          </div>
        </Section>

        <Section
          id="customers"
          index="04"
          eyebrow={t.customers.eyebrow}
          title={fill(t.customers.title, { oneTime: f.pct(1 - rfm.repeat_rate, 0) })}
          lede={fill(t.customers.lede, {
            customers: f.int(totalCustomers),
            atRisk: f.int(atRisk.customers),
            avg: f.brl(atRisk.avg_monetary),
            months: Math.round(atRisk.avg_recency_days / 30),
            share: f.pct(atRisk.revenue_share, 0),
          })}
          takeaway={fill(t.customers.takeaway, {
            rate: f.pct(rfm.scenario.reactivation_rate, 0),
            customers: f.int(rfm.scenario.customers_reactivated),
            revenue: f.brlCompact(rfm.scenario.potential_revenue),
          })}
        >
          <RfmChart />
          <p className="mt-3 text-xs text-muted">{t.customers.scenarioNote}</p>
        </Section>

        <Section
          id="logistics"
          index="05"
          eyebrow={t.logistics.eyebrow}
          title={t.logistics.title}
          lede={fill(t.logistics.lede, {
            rLate: f.signed(logistics.correlation.late_rate_vs_score),
            rDays: f.signed(logistics.correlation.delivery_days_vs_score),
          })}
          takeaway={t.logistics.takeaway}
        >
          <LogisticsChart />
        </Section>

        <Section id="actions" index="06" eyebrow={t.actions.eyebrow} title={t.actions.title} lede={t.actions.lede}>
          <Actions />
        </Section>

        <Section id="method" index="07" eyebrow={t.method.eyebrow} title={t.method.title} lede={t.method.lede}>
          <Method />
        </Section>

        <About />
      </main>
      <Footer generatedAt={meta.generated_at} />
    </Providers>
  );
}
