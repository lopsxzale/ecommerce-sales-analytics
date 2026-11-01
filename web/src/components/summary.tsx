"use client";

import { motion } from "motion/react";
import { deliveryReview, logistics, rfm, seasonality } from "@/lib/data";
import { fill } from "@/lib/format";
import { CountUp } from "./motion";
import { useI18n } from "./providers";

export function Summary() {
  const { t, f } = useI18n();
  const s = deliveryReview.stats;
  const peak = seasonality.peak_days[0];

  const values: Record<string, { value: number; format: (v: number) => string }> = {
    delayDiff: { value: s.mean_diff, format: (v) => f.signed(-v, 1) },
    repeat: { value: rfm.repeat_rate, format: (v) => f.pct(v) },
    peak: { value: peak.vs_daily_avg, format: (v) => `${f.dec(v, 1)}×` },
    correlation: {
      value: logistics.correlation.late_rate_vs_score,
      format: (v) => `r = ${f.signed(v)}`,
    },
  };

  return (
    <section id="summary" className="scroll-mt-20 px-4 pt-8 sm:px-6">
      <div className="mx-auto max-w-6xl">
        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="mb-3 text-xs font-medium uppercase tracking-[0.18em] text-accent-ink"
        >
          {t.summary.eyebrow}
        </motion.p>
        <h2 className="mb-8 text-2xl font-semibold tracking-tight text-ink sm:text-3xl">{t.summary.title}</h2>
        <motion.ul
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "0px 0px -10% 0px" }}
          variants={{ show: { transition: { staggerChildren: 0.1 } } }}
          className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
        >
          {t.summary.cards.map((card) => {
            const v = values[card.value];
            return (
              <motion.li
                key={card.value}
                variants={{
                  hidden: { opacity: 0, y: 30, scale: 0.97 },
                  show: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.8 } },
                }}
                whileHover={{ y: -4 }}
                className="card group relative overflow-hidden p-6"
              >
                <div
                  aria-hidden
                  className="absolute -right-16 -top-16 size-40 rounded-full opacity-0 blur-2xl transition-opacity duration-500 group-hover:opacity-100"
                  style={{ background: "var(--glow-a)" }}
                />
                <p className="text-4xl font-semibold tracking-tight text-ink">
                  <CountUp value={v.value} format={v.format} />
                </p>
                <p className="mt-1 text-sm font-medium text-ink-2">{card.title}</p>
                <p className="mt-4 text-sm leading-relaxed text-muted">
                  {fill(card.text, { late: f.dec(s.mean_late), onTime: f.dec(s.mean_on_time) })}
                </p>
              </motion.li>
            );
          })}
        </motion.ul>
      </div>
    </section>
  );
}
