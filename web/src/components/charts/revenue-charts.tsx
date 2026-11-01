"use client";

import { scaleLinear, scaleQuantize } from "d3-scale";
import { motion } from "motion/react";
import { useMemo, useState } from "react";
import { revenue, type StateRevenue } from "@/lib/data";
import { categoryLabel } from "@/lib/labels";
import { useWidth } from "@/lib/use-size";
import { ChartFrame, ChartTooltip, Segmented, TooltipRow } from "../chart-frame";
import { useChartInView } from "../motion";
import { useI18n } from "../providers";

// Cartograma em grade: cada estado é um quadrado na sua posição aproximada (coluna, linha).
const TILES: Record<string, [number, number]> = {
  RR: [1, 0], AP: [3, 0],
  AM: [1, 1], PA: [2, 1], MA: [3, 1], CE: [4, 1], RN: [5, 1],
  AC: [0, 2], RO: [1, 2], TO: [2, 2], PI: [3, 2], PE: [4, 2], PB: [5, 2],
  MT: [1, 3], GO: [2, 3], DF: [3, 3], BA: [4, 3], AL: [5, 3],
  MS: [1, 4], MG: [2, 4], ES: [3, 4], SE: [5, 4],
  PR: [1, 5], SP: [2, 5], RJ: [3, 5],
  SC: [1, 6],
  RS: [1, 7],
};
const COLS = 6;
const ROWS = 8;
const RAMP = ["--seq-100", "--seq-200", "--seq-300", "--seq-400", "--seq-500", "--seq-600", "--seq-700"];

export function StateTileMap() {
  const { t, f } = useI18n();
  const [box, width] = useWidth<HTMLDivElement>(420);
  const [ref, inView] = useChartInView<SVGSVGElement>();
  const [hover, setHover] = useState<StateRevenue | null>(null);

  const size = Math.min(width / COLS, 64);
  const gap = 4;
  const w = size * COLS;
  const h = size * ROWS;
  // Escala logarítmica: SP sozinho tem 37%, uma escala linear apagaria o resto do país.
  const color = scaleQuantize<number>()
    .domain([Math.log10(Math.min(...revenue.states.map((s) => s.revenue_share))), Math.log10(0.4)])
    .range(RAMP.map((_, i) => i));

  return (
    <ChartFrame
      title={t.revenue.mapTitle}
      subtitle={t.revenue.mapSubtitle}
      sqlId="02a_receita_por_estado"
      table={{
        columns: [t.table.state, t.revenue.metricRevenue, t.revenue.share, t.revenue.ticket],
        rows: revenue.states.map((s) => [s.state, f.brlCompact(s.revenue), f.pct(s.revenue_share), f.brl(s.avg_ticket)]),
      }}
    >
      <div ref={box} className="relative">
        <svg ref={ref} width={w} height={h} viewBox={`0 0 ${w} ${h}`} role="img" aria-label={t.revenue.mapTitle} className="mx-auto block">
          {revenue.states.map((s) => {
            const pos = TILES[s.state];
            if (!pos) return null;
            const idx = color(Math.log10(s.revenue_share));
            const delay = (pos[0] + pos[1]) * 0.05;
            return (
              <motion.g
                key={s.state}
                tabIndex={0}
                role="graphics-symbol"
                aria-label={`${s.state}: ${f.pct(s.revenue_share)}`}
                onPointerEnter={() => setHover(s)}
                onPointerLeave={() => setHover(null)}
                onFocus={() => setHover(s)}
                onBlur={() => setHover(null)}
                initial={{ opacity: 0, scale: 0.6 }}
                animate={inView ? { opacity: hover && hover.state !== s.state ? 0.55 : 1, scale: 1 } : {}}
                transition={{ delay: hover ? 0 : delay, duration: hover ? 0.2 : 0.6, ease: [0.22, 1, 0.36, 1] }}
                style={{ transformOrigin: `${pos[0] * size + size / 2}px ${pos[1] * size + size / 2}px` }}
                className="cursor-default outline-none"
              >
                <rect
                  x={pos[0] * size + gap / 2}
                  y={pos[1] * size + gap / 2}
                  width={size - gap}
                  height={size - gap}
                  rx={8}
                  fill={`var(${RAMP[idx]})`}
                />
                <text
                  x={pos[0] * size + size / 2}
                  y={pos[1] * size + size / 2}
                  dy="0.35em"
                  textAnchor="middle"
                  fill={`var(${RAMP[idx].replace("seq", "seq-ink")})`}
                  className="pointer-events-none text-[11px] font-semibold sm:text-xs"
                >
                  {s.state}
                </text>
              </motion.g>
            );
          })}
        </svg>
        {hover && TILES[hover.state] && (
          <ChartTooltip
            x={(width - w) / 2 + TILES[hover.state][0] * size + size}
            y={TILES[hover.state][1] * size + size / 2}
            width={width}
          >
            <p className="mb-1 font-medium text-ink">{hover.state}</p>
            <TooltipRow value={f.brlCompact(hover.revenue)} label={`· ${f.pct(hover.revenue_share)} ${t.revenue.share}`} />
            <TooltipRow value={f.int(hover.orders)} label={t.revenue.orders} />
            <TooltipRow value={f.brl(hover.avg_ticket)} label={t.revenue.ticket} />
          </ChartTooltip>
        )}
        <div className="mt-4 flex items-center justify-center gap-2 text-[11px] text-muted" aria-hidden>
          {t.revenue.mapLegendLow}
          <span className="flex h-2 w-32 overflow-hidden rounded-full">
            {RAMP.map((c) => (
              <span key={c} className="flex-1" style={{ background: `var(${c})` }} />
            ))}
          </span>
          {t.revenue.mapLegendHigh}
        </div>
      </div>
    </ChartFrame>
  );
}

type Metric = "revenue" | "avg_ticket";

export function CategoryBars() {
  const { lang, t, f } = useI18n();
  const [box, width] = useWidth<HTMLDivElement>(480);
  const [ref, inView] = useChartInView<HTMLDivElement>();
  const [metric, setMetric] = useState<Metric>("revenue");
  const top = useMemo(() => revenue.categories.slice(0, 10), []);
  const sorted = useMemo(() => [...top].sort((a, b) => b[metric] - a[metric]), [top, metric]);
  const max = Math.max(...top.map((c) => c[metric]));
  const labelW = width < 420 ? 128 : 176;
  const x = scaleLinear().domain([0, max]).range([0, Math.max(width - labelW - 92, 40)]);
  const ROW = 34;

  return (
    <ChartFrame
      title={t.revenue.catTitle}
      subtitle={t.revenue.catSubtitle}
      sqlId="02b_receita_por_categoria"
      controls={
        <Segmented
          label={t.revenue.catTitle}
          value={metric}
          onChange={setMetric}
          options={[
            { value: "revenue", label: t.revenue.metricRevenue },
            { value: "avg_ticket", label: t.revenue.metricTicket },
          ]}
        />
      }
      table={{
        columns: [t.table.category, t.revenue.metricRevenue, t.revenue.share, t.revenue.ticket],
        rows: top.map((c) => [categoryLabel(c, lang), f.brlCompact(c.revenue), f.pct(c.revenue_share), f.brl(c.avg_ticket)]),
      }}
    >
      <div ref={box}>
        <div ref={ref} className="relative" style={{ height: sorted.length * ROW }} role="list" aria-label={t.revenue.catTitle}>
          {sorted.map((c, i) => {
            const value = c[metric];
            return (
              <motion.div
                key={c.category_pt}
                layout
                role="listitem"
                transition={{ layout: { type: "spring", stiffness: 260, damping: 30 } }}
                className="absolute inset-x-0 flex items-center"
                style={{ top: i * ROW, height: ROW }}
              >
                <span className="shrink-0 truncate pr-3 text-right text-xs text-ink-2 sm:text-sm" style={{ width: labelW }}>
                  {categoryLabel(c, lang)}
                </span>
                <motion.span
                  className="h-[18px] rounded-r-[4px] bg-accent"
                  initial={{ width: 0 }}
                  animate={{ width: inView ? x(value) : 0 }}
                  transition={{ duration: 0.9, delay: inView ? 0.05 * i : 0, ease: [0.22, 1, 0.36, 1] }}
                />
                <span className="pl-2 text-xs font-medium text-ink tabular">
                  {metric === "revenue" ? f.brlCompact(value) : f.brl(value)}
                </span>
              </motion.div>
            );
          })}
        </div>
      </div>
    </ChartFrame>
  );
}
