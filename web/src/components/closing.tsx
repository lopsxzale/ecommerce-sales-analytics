"use client";

import { motion } from "motion/react";
import { deliveryReview, kpis, quality, rfm, seasonality } from "@/lib/data";
import { fill } from "@/lib/format";
import { site } from "@/site.config";
import { Reveal } from "./motion";
import { useI18n } from "./providers";

export function Actions() {
  const { t, f } = useI18n();
  const s = deliveryReview.stats;
  const atRisk = rfm.segments.find((x) => x.segment === "at_risk_high_value")!;
  const newcomers = rfm.segments
    .filter((x) => x.segment === "new" || x.segment === "new_high_value")
    .reduce((sum, x) => sum + x.customers, 0);
  const vars = {
    now: f.dec(s.avg_score_now),
    ideal: f.dec(s.avg_score_if_no_delays),
    customers: f.int(atRisk.customers),
    avg: f.brl(atRisk.avg_monetary),
    revenue: f.brlCompact(rfm.scenario.potential_revenue),
    newCustomers: f.int(newcomers),
    repeat: f.pct(kpis.repeat_rate),
    peakX: `${f.dec(seasonality.peak_days[0].vs_daily_avg, 1)}×`,
  };

  return (
    <motion.ol
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: "0px 0px -10% 0px" }}
      variants={{ show: { transition: { staggerChildren: 0.09 } } }}
      className="grid gap-4 md:grid-cols-2 lg:grid-cols-3"
    >
      {t.actions.items.map((item, i) => (
        <motion.li
          key={item.title}
          variants={{ hidden: { opacity: 0, y: 30 }, show: { opacity: 1, y: 0, transition: { duration: 0.75 } } }}
          whileHover={{ y: -4 }}
          className={`card group relative flex flex-col overflow-hidden p-6 ${i === 0 ? "lg:col-span-2" : ""} ${i === 4 ? "md:col-span-2 lg:col-span-1" : ""}`}
        >
          <span className="font-mono text-xs text-muted">{String(i + 1).padStart(2, "0")}</span>
          <h3 className="mt-3 text-lg font-semibold tracking-tight text-ink">{item.title}</h3>
          <p className="mt-2 flex-1 text-sm leading-relaxed text-ink-2">{fill(item.text, vars)}</p>
          <div className="mt-6 flex items-center gap-2 border-t border-line pt-4">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden className="shrink-0 text-good">
              <path d="M2 11l4-4 3 3 5-5M10 5h4v4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <p className="text-sm">
              <span className="sr-only">{t.actions.impact}: </span>
              <span className="font-semibold text-ink">{fill(item.impact, vars)}</span>
            </p>
          </div>
        </motion.li>
      ))}
    </motion.ol>
  );
}

const STACK = ["Python", "pandas", "SciPy", "PostgreSQL", "SQL", "Docker", "pytest", "Next.js", "TypeScript", "D3", "Motion", "Tailwind CSS"];

export function Method() {
  const { lang, t, f } = useI18n();

  return (
    <div className="space-y-6">
      <ol className="relative grid gap-4 md:grid-cols-5">
        <motion.div
          aria-hidden
          className="absolute left-[10%] right-[10%] top-6 hidden h-px origin-left bg-gradient-to-r from-accent via-accent/50 to-accent md:block"
          initial={{ scaleX: 0 }}
          whileInView={{ scaleX: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 1.6, ease: [0.65, 0, 0.35, 1] }}
        />
        {t.method.steps.map((step, i) => (
          <motion.li
            key={step.title}
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, delay: 0.25 * i }}
            className="relative flex gap-4 md:block md:text-center"
          >
            <span className="relative z-10 grid size-12 shrink-0 place-items-center rounded-2xl border border-line bg-surface font-mono text-sm font-semibold text-accent-ink shadow-sm md:mx-auto">
              {String(i + 1).padStart(2, "0")}
            </span>
            <div className="md:mt-4">
              <h3 className="font-semibold tracking-tight text-ink">{step.title}</h3>
              <p className="mt-1 text-sm leading-relaxed text-ink-2">{step.text}</p>
            </div>
          </motion.li>
        ))}
      </ol>

      <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr] [&>*]:min-w-0">
        <Reveal>
          <div className="card h-full overflow-hidden">
            <div className="p-6 pb-4">
              <h3 className="font-semibold tracking-tight text-ink">{t.method.qualityTitle}</h3>
              <p className="mt-0.5 text-xs text-muted">{t.method.qualitySubtitle}</p>
            </div>
            <div className="overflow-x-auto" data-lenis-prevent>
              <table className="w-full min-w-[520px] text-left text-sm">
                <thead className="bg-surface-2 text-xs text-muted">
                  <tr>
                    <th scope="col" className="px-6 py-2 font-medium">{t.method.qualityCols.check}</th>
                    <th scope="col" className="px-3 py-2 text-right font-medium">{t.method.qualityCols.found}</th>
                    <th scope="col" className="px-6 py-2 font-medium">{t.method.qualityCols.treatment}</th>
                  </tr>
                </thead>
                <tbody>
                  {quality.checks
                    .filter((c) => c.value > 0)
                    .map((c) => (
                      <tr key={c.id} className="border-t border-line">
                        <td className="px-6 py-3 text-ink">{c.label[lang]}</td>
                        <td className="px-3 py-3 text-right tabular text-ink">
                          {f.int(c.value)}
                          <span className="block text-xs text-muted">{f.pct(c.rate)}</span>
                        </td>
                        <td className="px-6 py-3 text-ink-2">{c.treatment[lang]}</td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        </Reveal>

        <div className="grid gap-4">
          <Reveal delay={0.1}>
            <div className="card p-6">
              <h3 className="font-semibold tracking-tight text-ink">{t.method.stackTitle}</h3>
              <ul className="mt-4 flex flex-wrap gap-2">
                {STACK.map((s, i) => (
                  <motion.li
                    key={s}
                    initial={{ opacity: 0, scale: 0.8 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.03 * i, type: "spring", bounce: 0.4 }}
                    className="rounded-full border border-line bg-surface-2 px-3 py-1 text-xs font-medium text-ink-2"
                  >
                    {s}
                  </motion.li>
                ))}
              </ul>
            </div>
          </Reveal>
          <Reveal delay={0.2}>
            <div className="card overflow-hidden">
              <p className="px-6 pt-5 text-sm font-semibold text-ink">{t.method.reproduce}</p>
              <pre className="mt-3 overflow-x-auto bg-surface-2 px-6 py-4 font-mono text-[13px] leading-relaxed text-ink-2" data-lenis-prevent>
                <code>
                  <span className="text-muted">$ </span>docker compose up -d{"\n"}
                  <span className="text-muted">$ </span>pip install -r requirements.txt{"\n"}
                  <span className="text-muted">$ </span>python -m src.pipeline
                </code>
              </pre>
            </div>
          </Reveal>
        </div>
      </div>
    </div>
  );
}

export function About() {
  const { t } = useI18n();
  const links = [
    { href: site.linkedin, label: t.about.linkedin },
    { href: site.github, label: t.about.github },
    { href: site.email ? `mailto:${site.email}` : "", label: t.about.email },
    { href: site.cv, label: t.about.cv },
  ].filter((l) => l.href);

  return (
    <section id="about" className="relative overflow-hidden px-4 py-24 sm:px-6 sm:py-32">
      <div aria-hidden className="absolute inset-0 -z-10" style={{ background: "radial-gradient(700px circle at 50% 100%, var(--glow-a), transparent 70%)" }} />
      <Reveal className="mx-auto max-w-3xl text-center">
        <p className="text-xs font-medium uppercase tracking-[0.18em] text-accent-ink">{t.about.eyebrow}</p>
        <h2 className="mt-4 text-balance text-3xl font-semibold tracking-tight text-ink sm:text-5xl">{t.about.title}</h2>
        <p className="mx-auto mt-5 max-w-xl text-base leading-relaxed text-ink-2 sm:text-lg">
          {fill(t.about.text, { author: site.author })}
        </p>
        {links.length > 0 && (
          <ul className="mt-9 flex flex-wrap justify-center gap-3">
            {links.map((l, i) => (
              <li key={l.label}>
                <a
                  href={l.href}
                  target={l.href.startsWith("mailto:") ? undefined : "_blank"}
                  rel="noreferrer"
                  className={`inline-flex h-12 items-center rounded-full px-6 text-sm font-semibold transition hover:-translate-y-0.5 ${
                    i === 0 ? "bg-ink text-page shadow-lg" : "border border-line bg-surface text-ink hover:bg-surface-2"
                  }`}
                >
                  {l.label}
                </a>
              </li>
            ))}
          </ul>
        )}
      </Reveal>
    </section>
  );
}

export function Footer({ generatedAt }: { generatedAt: string }) {
  const { t, f } = useI18n();
  return (
    <footer className="border-t border-line px-4 py-8 text-xs text-muted sm:px-6">
      <div className="mx-auto flex max-w-6xl flex-col justify-between gap-2 sm:flex-row">
        <p>{t.footer.data}</p>
        <p>
          © {new Date(generatedAt).getUTCFullYear()} {site.author} · {fill(t.footer.generated, { date: f.date(generatedAt.slice(0, 10)) })}
        </p>
      </div>
    </footer>
  );
}
