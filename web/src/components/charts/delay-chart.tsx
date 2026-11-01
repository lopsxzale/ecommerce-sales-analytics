"use client";

import { scaleBand, scaleLinear } from "d3-scale";
import { motion } from "motion/react";
import { useState } from "react";
import { deliveryReview } from "@/lib/data";
import { fill } from "@/lib/format";
import { useWidth } from "@/lib/use-size";
import { ChartFrame, ChartTooltip, TooltipRow } from "../chart-frame";
import { CountUp, Reveal, useChartInView } from "../motion";
import { useI18n } from "../providers";

const HEIGHT = 320;
const M = { top: 28, right: 8, bottom: 44, left: 32 };

export function DelayChart() {
  const { t, f } = useI18n();
  const [box, width] = useWidth<HTMLDivElement>();
  const [ref, inView] = useChartInView<SVGSVGElement>();
  const [hover, setHover] = useState<number | null>(null);
  const { buckets, stats } = deliveryReview;

  const x = scaleBand<string>()
    .domain(buckets.map((b) => b.bucket_id))
    .range([M.left, width - M.right])
    .padding(0.3);
  const y = scaleLinear().domain([0, 5]).range([HEIGHT - M.bottom, M.top]);
  const barW = Math.min(x.bandwidth(), 40);
  const narrow = width < 480;
  const colorOf = (id: string) => (id === "on_time" ? "var(--series-1)" : "var(--series-2)");

  const hovered = hover === null ? null : buckets[hover];

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_300px]">
      <ChartFrame
        title={t.delays.chartTitle}
        subtitle={t.delays.chartSubtitle}
        sqlId="01_atraso_vs_review"
        legend={[
          { label: t.delays.legendOnTime, color: "var(--series-1)" },
          { label: t.delays.legendLate, color: "var(--series-2)" },
        ]}
        table={{
          columns: [t.table.bucket, t.delays.tooltipOrders, "★", t.delays.tooltipNegative],
          rows: buckets.map((b) => [
            t.delays.buckets[b.bucket_id],
            f.int(b.orders),
            f.dec(b.avg_score),
            f.pct(b.negative_rate),
          ]),
        }}
      >
        <div ref={box} className="relative">
          <svg ref={ref} width={width} height={HEIGHT} role="img" aria-label={t.delays.chartTitle} className="block overflow-visible">
            {[0, 1, 2, 3, 4, 5].map((tick) => (
              <g key={tick}>
                <line x1={M.left} x2={width - M.right} y1={y(tick)} y2={y(tick)} stroke="var(--grid)" />
                <text x={M.left - 10} y={y(tick)} dy="0.32em" textAnchor="end" className="fill-muted text-[11px] tabular">
                  {tick}
                </text>
              </g>
            ))}
            {buckets.map((b, i) => {
              const cx = x(b.bucket_id)! + x.bandwidth() / 2;
              const h = y(0) - y(b.avg_score);
              return (
                <g
                  key={b.bucket_id}
                  onPointerEnter={() => setHover(i)}
                  onPointerLeave={() => setHover(null)}
                  onFocus={() => setHover(i)}
                  onBlur={() => setHover(null)}
                  tabIndex={0}
                  role="graphics-symbol"
                  aria-label={`${t.delays.buckets[b.bucket_id]}: ${f.dec(b.avg_score)}`}
                  className="outline-none"
                >
                  {/* Área de hover maior que a barra */}
                  <rect x={x(b.bucket_id)} y={M.top} width={x.bandwidth()} height={HEIGHT - M.top - M.bottom} fill="transparent" />
                  {hover === i && (
                    <rect x={x(b.bucket_id)} y={M.top} width={x.bandwidth()} height={HEIGHT - M.top - M.bottom} rx={8} fill="var(--surface-2)" opacity={0.6} />
                  )}
                  <motion.path
                    d={`M${cx - barW / 2},${y(0)} v${-h + 4} q0,-4 4,-4 h${barW - 8} q4,0 4,4 v${h - 4} z`}
                    fill={colorOf(b.bucket_id)}
                    style={{ transformOrigin: `${cx}px ${y(0)}px`, transformBox: "view-box" }}
                    initial={{ scaleY: 0 }}
                    animate={{ scaleY: inView ? 1 : 0, opacity: hover === null || hover === i ? 1 : 0.45 }}
                    transition={{ scaleY: { duration: 1.1, delay: 0.15 + i * 0.12, ease: [0.22, 1, 0.36, 1] }, opacity: { duration: 0.2 } }}
                  />
                  <motion.text
                    x={cx}
                    y={y(b.avg_score) - 10}
                    textAnchor="middle"
                    className="fill-ink text-[13px] font-semibold tabular"
                    initial={{ opacity: 0, y: 8 }}
                    animate={inView ? { opacity: 1, y: 0 } : {}}
                    transition={{ delay: 0.7 + i * 0.12, duration: 0.5 }}
                  >
                    {f.dec(b.avg_score)}
                  </motion.text>
                  <text x={cx} y={HEIGHT - M.bottom + 20} textAnchor="middle" className="fill-ink-2 text-[11px] sm:text-xs">
                    {/* Em telas estreitas o rótulo quebra em duas linhas para não colidir. */}
                    {narrow
                      ? t.delays.buckets[b.bucket_id].split(" ").map((part, j) => (
                          <tspan key={j} x={cx} dy={j === 0 ? 0 : "1.2em"}>
                            {part}
                          </tspan>
                        ))
                      : t.delays.buckets[b.bucket_id]}
                  </text>
                </g>
              );
            })}
            <line x1={M.left} x2={width - M.right} y1={y(0)} y2={y(0)} stroke="var(--axis)" />
          </svg>
          {hovered && hover !== null && (
            <ChartTooltip x={x(hovered.bucket_id)! + x.bandwidth() / 2} y={y(hovered.avg_score) + 30} width={width}>
              <p className="mb-1 font-medium text-ink">{t.delays.buckets[hovered.bucket_id]}</p>
              <TooltipRow value={`${f.dec(hovered.avg_score)} ★`} label="" color={colorOf(hovered.bucket_id)} />
              <TooltipRow value={f.int(hovered.orders)} label={t.delays.tooltipOrders} />
              <TooltipRow value={f.pct(hovered.negative_rate)} label={t.delays.tooltipNegative} />
            </ChartTooltip>
          )}
        </div>
      </ChartFrame>

      <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-1">
        {[
          {
            label: t.delays.statDiff,
            value: stats.mean_diff,
            format: (v: number) => `${f.signed(-v)} ★`,
            note: fill(t.delays.statDiffNote, {
              lo: f.dec(stats.mean_diff_ci95[0]),
              hi: f.dec(stats.mean_diff_ci95[1]),
            }),
          },
          {
            label: t.delays.statTest,
            value: 0.001,
            format: () => `p < ${f.dec(0.001, 3)}`,
            note: t.delays.statTestNote,
          },
          {
            label: t.delays.statEffect,
            value: stats.rank_biserial,
            format: (v: number) => f.dec(v),
            note: t.delays.statEffectNote,
          },
        ].map((s, i) => (
          <Reveal key={s.label} delay={0.1 * i}>
            <div className="card h-full p-5">
              <p className="text-xs font-medium uppercase tracking-wider text-muted">{s.label}</p>
              <p className="mt-2 text-3xl font-semibold tracking-tight text-ink">
                <CountUp value={s.value} format={s.format} />
              </p>
              <p className="mt-1 text-xs text-ink-2">{s.note}</p>
            </div>
          </Reveal>
        ))}
      </div>
    </div>
  );
}
