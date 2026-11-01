"use client";

import { extent } from "d3-array";
import { scaleLinear } from "d3-scale";
import { motion } from "motion/react";
import { useState } from "react";
import { logistics, type StateLogistics } from "@/lib/data";
import { useWidth } from "@/lib/use-size";
import { ChartFrame, ChartTooltip, TooltipRow } from "../chart-frame";
import { useChartInView } from "../motion";
import { useI18n } from "../providers";

const HEIGHT = 300;
const M = { top: 16, right: 16, bottom: 40, left: 40 };
// Rótulos seletivos por painel (os estados que contam a história), com deslocamento
// para não colidirem: AM, AP e SP ficam quase no mesmo ponto no painel de atraso.
type LabelPos = { dx: number; dy: number; anchor?: "start" | "middle" };
const RIGHT: LabelPos = { dx: 9, dy: 0 };
const LABELS: Record<Key, Record<string, LabelPos>> = {
  late_rate: { AL: RIGHT, MA: RIGHT },
  avg_delivery_days: {
    SP: RIGHT,
    AL: RIGHT,
    MA: RIGHT,
    AM: { dx: 0, dy: -13, anchor: "middle" },
    AP: { dx: 0, dy: 15, anchor: "middle" },
  },
};

type Key = "late_rate" | "avg_delivery_days";

function linearFit(points: [number, number][]) {
  const n = points.length;
  const mx = points.reduce((s, p) => s + p[0], 0) / n;
  const my = points.reduce((s, p) => s + p[1], 0) / n;
  const slope =
    points.reduce((s, p) => s + (p[0] - mx) * (p[1] - my), 0) / points.reduce((s, p) => s + (p[0] - mx) ** 2, 0);
  return (x: number) => my + slope * (x - mx);
}

function Panel({
  xKey,
  title,
  r,
  formatX,
  yDomain,
  showYAxis,
  hover,
  setHover,
}: {
  xKey: Key;
  title: string;
  r: number;
  formatX: (v: number) => string;
  yDomain: [number, number];
  showYAxis: boolean;
  hover: string | null;
  setHover: (s: string | null) => void;
}) {
  const { t, f } = useI18n();
  const [box, width] = useWidth<HTMLDivElement>(360);
  const [ref, inView] = useChartInView<SVGSVGElement>();
  const states = logistics.states;
  const left = showYAxis ? M.left : 12;

  const [x0, x1] = extent(states, (s) => s[xKey]) as [number, number];
  const pad = (x1 - x0) * 0.08;
  const x = scaleLinear().domain([x0 - pad, x1 + pad]).range([left, width - M.right]);
  const y = scaleLinear().domain(yDomain).range([HEIGHT - M.bottom, M.top]);
  const fit = linearFit(states.map((s) => [s[xKey], s.avg_score]));
  const [d0, d1] = x.domain();
  const hovered: StateLogistics | undefined = states.find((s) => s.state === hover);

  return (
    <div ref={box} className="relative min-w-0">
      <p className="mb-2 flex items-baseline justify-between gap-2 text-sm font-medium text-ink">
        {title}
        <span className="rounded-full bg-surface-2 px-2 py-0.5 font-mono text-xs text-ink-2">r = {f.signed(r)}</span>
      </p>
      <svg ref={ref} width={width} height={HEIGHT} role="img" aria-label={`${title}, r = ${f.signed(r)}`} className="block overflow-visible">
        {y.ticks(5).map((tick) => (
          <g key={tick}>
            <line x1={left} x2={width - M.right} y1={y(tick)} y2={y(tick)} stroke="var(--grid)" />
            {showYAxis && (
              <text x={left - 8} y={y(tick)} dy="0.32em" textAnchor="end" className="fill-muted text-[11px] tabular">
                {f.dec(tick, 1)}
              </text>
            )}
          </g>
        ))}
        {x.ticks(4).map((tick) => (
          <text key={tick} x={x(tick)} y={HEIGHT - M.bottom + 18} textAnchor="middle" className="fill-muted text-[11px] tabular">
            {formatX(tick)}
          </text>
        ))}
        <line x1={left} x2={width - M.right} y1={HEIGHT - M.bottom} y2={HEIGHT - M.bottom} stroke="var(--axis)" />
        <motion.line
          x1={x(d0)}
          y1={y(fit(d0))}
          x2={x(d1)}
          y2={y(fit(d1))}
          stroke="var(--ink-2)"
          strokeWidth={1.5}
          strokeLinecap="round"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={inView ? { pathLength: 1, opacity: 0.55 } : {}}
          transition={{ duration: 1.2, delay: 0.9 }}
        />
        {states.map((s, i) => {
          const cx = x(s[xKey]);
          const cy = y(s.avg_score);
          const dim = hover !== null && hover !== s.state;
          return (
            <g
              key={s.state}
              tabIndex={0}
              role="graphics-symbol"
              aria-label={`${s.state}: ${formatX(s[xKey])}, ${f.dec(s.avg_score)}`}
              onPointerEnter={() => setHover(s.state)}
              onPointerLeave={() => setHover(null)}
              onFocus={() => setHover(s.state)}
              onBlur={() => setHover(null)}
              className="outline-none"
            >
              <circle cx={cx} cy={cy} r={14} fill="transparent" />
              <motion.circle
                cx={cx}
                cy={cy}
                fill="var(--series-1)"
                stroke="var(--surface)"
                strokeWidth={2}
                initial={{ r: 0 }}
                animate={{ r: inView ? (hover === s.state ? 7 : 5) : 0, opacity: dim ? 0.3 : 1 }}
                transition={{ r: { duration: 0.5, delay: hover ? 0 : 0.2 + i * 0.03 }, opacity: { duration: 0.2 } }}
              />
              {(LABELS[xKey][s.state] || hover === s.state) && (
                <motion.text
                  x={cx + (LABELS[xKey][s.state] ?? RIGHT).dx}
                  y={cy + (LABELS[xKey][s.state] ?? RIGHT).dy}
                  dy="0.32em"
                  textAnchor={(LABELS[xKey][s.state] ?? RIGHT).anchor ?? "start"}
                  className="pointer-events-none fill-ink-2 text-[11px] font-semibold"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: inView ? (dim ? 0.3 : 1) : 0 }}
                  transition={{ delay: hover ? 0 : 1.2 }}
                >
                  {s.state}
                </motion.text>
              )}
            </g>
          );
        })}
      </svg>
      {hovered && (
        <ChartTooltip x={x(hovered[xKey])} y={y(hovered.avg_score)} width={width}>
          <p className="mb-1 font-medium text-ink">{hovered.state}</p>
          <TooltipRow value={`${f.dec(hovered.avg_score)} ★`} label={t.logistics.score} color="var(--series-1)" />
          <TooltipRow value={f.pct(hovered.late_rate)} label={t.logistics.late} />
          <TooltipRow value={f.dec(hovered.avg_delivery_days, 1)} label={t.logistics.days} />
          <TooltipRow value={f.int(hovered.orders)} label={t.logistics.orders} />
        </ChartTooltip>
      )}
    </div>
  );
}

export function LogisticsChart() {
  const { t, f } = useI18n();
  const [hover, setHover] = useState<string | null>(null);
  const scores = logistics.states.map((s) => s.avg_score);
  const yDomain: [number, number] = [Math.floor(Math.min(...scores) * 10) / 10 - 0.1, Math.ceil(Math.max(...scores) * 10) / 10 + 0.1];

  return (
    <ChartFrame
      title={t.logistics.chartTitle}
      subtitle={t.logistics.chartSubtitle}
      sqlId="05_entrega_por_estado"
      table={{
        columns: [t.table.state, t.logistics.score, t.logistics.late, t.logistics.days],
        rows: [...logistics.states]
          .sort((a, b) => a.avg_score - b.avg_score)
          .map((s) => [s.state, f.dec(s.avg_score), f.pct(s.late_rate), f.dec(s.avg_delivery_days, 1)]),
      }}
    >
      <div className="grid gap-8 md:grid-cols-2 md:gap-6">
        <Panel
          xKey="late_rate"
          title={t.logistics.panelLate}
          r={logistics.correlation.late_rate_vs_score}
          formatX={(v) => f.pct(v, 0)}
          yDomain={yDomain}
          showYAxis
          hover={hover}
          setHover={setHover}
        />
        <Panel
          xKey="avg_delivery_days"
          title={t.logistics.panelDays}
          r={logistics.correlation.delivery_days_vs_score}
          formatX={(v) => f.int(v)}
          yDomain={yDomain}
          showYAxis
          hover={hover}
          setHover={setHover}
        />
      </div>
    </ChartFrame>
  );
}
