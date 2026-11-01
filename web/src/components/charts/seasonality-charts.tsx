"use client";

import { max } from "d3-array";
import { scaleLinear, scalePoint, scaleQuantize } from "d3-scale";
import { area, curveMonotoneX, line } from "d3-shape";
import { motion } from "motion/react";
import { useMemo, useState } from "react";
import { seasonality } from "@/lib/data";
import { fill } from "@/lib/format";
import { useWidth } from "@/lib/use-size";
import { ChartFrame, ChartTooltip, Segmented, TooltipRow } from "../chart-frame";
import { useChartInView } from "../motion";
import { useI18n } from "../providers";

const HEIGHT = 300;
const M = { top: 36, right: 16, bottom: 32, left: 68 };
type Metric = "revenue" | "orders";

export function MonthlyChart() {
  const { t, f } = useI18n();
  const [box, width] = useWidth<HTMLDivElement>();
  const [ref, inView] = useChartInView<SVGSVGElement>();
  const [metric, setMetric] = useState<Metric>("revenue");
  const [hover, setHover] = useState<number | null>(null);
  const data = seasonality.monthly;

  const x = scalePoint<string>()
    .domain(data.map((d) => d.month))
    .range([M.left, width - M.right]);
  const y = scaleLinear()
    .domain([0, max(data, (d) => d[metric])! * 1.12])
    .nice()
    .range([HEIGHT - M.bottom, M.top]);

  const linePath = line<(typeof data)[number]>()
    .x((d) => x(d.month)!)
    .y((d) => y(d[metric]))
    .curve(curveMonotoneX)(data)!;
  const areaPath = area<(typeof data)[number]>()
    .x((d) => x(d.month)!)
    .y0(y(0))
    .y1((d) => y(d[metric]))
    .curve(curveMonotoneX)(data)!;

  const fmt = metric === "revenue" ? f.brlCompact : f.int;
  const axisFmt = metric === "revenue" ? f.brlCompact : f.compact;
  const peak = data.find((d) => d.month === "2017-11");
  const step = width < 520 ? 4 : 2;

  const onMove = (clientX: number, rect: DOMRect) => {
    const px = clientX - rect.left;
    let best = 0;
    data.forEach((d, i) => {
      if (Math.abs(x(d.month)! - px) < Math.abs(x(data[best].month)! - px)) best = i;
    });
    setHover(best);
  };
  const h = hover === null ? null : data[hover];

  return (
    <ChartFrame
      title={t.seasonality.lineTitle}
      subtitle={t.seasonality.lineSubtitle}
      sqlId="03a_vendas_mensais"
      controls={
        <Segmented
          label={t.seasonality.lineTitle}
          value={metric}
          onChange={setMetric}
          options={[
            { value: "revenue", label: t.seasonality.metricRevenue },
            { value: "orders", label: t.seasonality.metricOrders },
          ]}
        />
      }
      table={{
        columns: [t.table.month, t.seasonality.metricOrders, t.seasonality.metricRevenue, "MoM"],
        rows: data.map((d) => [
          f.month(d.month),
          f.int(d.orders),
          f.brlCompact(d.revenue),
          d.revenue_mom === null ? "–" : f.pct(d.revenue_mom),
        ]),
      }}
    >
      <div ref={box} className="relative">
        <svg
          ref={ref}
          width={width}
          height={HEIGHT}
          role="img"
          aria-label={t.seasonality.lineTitle}
          className="block touch-pan-y"
          onPointerMove={(e) => onMove(e.clientX, e.currentTarget.getBoundingClientRect())}
          onPointerLeave={() => setHover(null)}
        >
          <defs>
            <linearGradient id="area-fill" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="var(--series-1)" stopOpacity={0.22} />
              <stop offset="100%" stopColor="var(--series-1)" stopOpacity={0} />
            </linearGradient>
          </defs>
          {y.ticks(4).map((tick) => (
            <g key={tick}>
              <line x1={M.left} x2={width - M.right} y1={y(tick)} y2={y(tick)} stroke="var(--grid)" />
              <text x={M.left - 8} y={y(tick)} dy="0.32em" textAnchor="end" className="fill-muted text-[11px] tabular">
                {axisFmt(tick)}
              </text>
            </g>
          ))}
          {data.map((d, i) =>
            i % step === 0 ? (
              <text key={d.month} x={x(d.month)} y={HEIGHT - 10} textAnchor="middle" className="fill-muted text-[11px]">
                {f.month(d.month)}
              </text>
            ) : null,
          )}
          <motion.path
            key={`a-${metric}`}
            d={areaPath}
            fill="url(#area-fill)"
            initial={{ opacity: 0 }}
            animate={{ opacity: inView ? 1 : 0 }}
            transition={{ duration: 1, delay: 0.6 }}
          />
          <motion.path
            key={`l-${metric}`}
            d={linePath}
            fill="none"
            stroke="var(--series-1)"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: inView ? 1 : 0 }}
            transition={{ duration: 1.6, ease: [0.65, 0, 0.35, 1] }}
          />
          {peak && (
            <motion.g
              initial={{ opacity: 0, y: -6 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: 1.4, duration: 0.6 }}
            >
              <line
                x1={x(peak.month)}
                x2={x(peak.month)}
                y1={y(peak[metric]) - 8}
                y2={M.top - 14}
                stroke="var(--axis)"
              />
              <text x={x(peak.month)} y={M.top - 20} textAnchor="middle" className="fill-ink text-[11px] font-semibold">
                {t.seasonality.annotation}
              </text>
              <circle cx={x(peak.month)} cy={y(peak[metric])} r={5} fill="var(--series-1)" stroke="var(--surface)" strokeWidth={2} />
            </motion.g>
          )}
          {h && (
            <g pointerEvents="none">
              <line x1={x(h.month)} x2={x(h.month)} y1={M.top} y2={HEIGHT - M.bottom} stroke="var(--axis)" />
              <circle cx={x(h.month)} cy={y(h[metric])} r={5} fill="var(--series-1)" stroke="var(--surface)" strokeWidth={2} />
            </g>
          )}
          <line x1={M.left} x2={width - M.right} y1={y(0)} y2={y(0)} stroke="var(--axis)" />
        </svg>
        {h && (
          <ChartTooltip x={x(h.month)!} y={y(h[metric])} width={width}>
            <p className="mb-1 font-medium text-ink">{f.month(h.month, "long")}</p>
            <TooltipRow value={fmt(h[metric])} label={metric === "revenue" ? t.seasonality.metricRevenue : t.seasonality.metricOrders} color="var(--series-1)" />
            {h.revenue_mom !== null && (
              <TooltipRow value={f.signed(h.revenue_mom * 100, 1) + "%"} label={t.seasonality.vsPrev} />
            )}
          </ChartTooltip>
        )}
      </div>
    </ChartFrame>
  );
}

export function HeatmapChart() {
  const { t, f } = useI18n();
  const [box, width] = useWidth<HTMLDivElement>();
  const [ref, inView] = useChartInView<SVGSVGElement>();
  const [hover, setHover] = useState<{ dow: number; hour: number; orders: number } | null>(null);
  const cells = seasonality.heatmap;

  const stats = useMemo(() => {
    const best = cells.reduce((a, b) => (b.orders > a.orders ? b : a));
    const byDay = [1, 2, 3, 4, 5, 6, 7].map((d) =>
      cells.filter((c) => c.dow === d).reduce((s, c) => s + c.orders, 0),
    );
    const weekday = byDay.slice(0, 5).reduce((a, b) => a + b, 0) / 5;
    const weekend = (byDay[5] + byDay[6]) / 2;
    return { best, gap: 1 - weekend / weekday };
  }, [cells]);

  const left = 34;
  const top = 4;
  const cell = Math.max(Math.min((width - left) / 24, 30), 9);
  const gap = cell > 14 ? 2 : 1;
  const height = top + cell * 7 + 24;
  const ramp = ["--seq-100", "--seq-200", "--seq-300", "--seq-400", "--seq-500", "--seq-600", "--seq-700"];
  const color = scaleQuantize<number>()
    .domain([0, max(cells, (c) => c.orders)!])
    .range(ramp.map((_, i) => i));

  return (
    <ChartFrame
      title={t.seasonality.heatTitle}
      subtitle={t.seasonality.heatSubtitle}
      sqlId="03b_vendas_dia_hora"
      table={{
        columns: [t.table.day, ...[0, 6, 12, 18].map((h) => `${h}h`)],
        rows: t.seasonality.days.map((d, i) => [
          d,
          ...[0, 6, 12, 18].map((h) => f.int(cells.find((c) => c.dow === i + 1 && c.hour === h)?.orders ?? 0)),
        ]),
      }}
    >
      <div ref={box} className="relative">
        <svg ref={ref} width={width} height={height} role="img" aria-label={t.seasonality.heatTitle} className="block">
          {t.seasonality.days.map((d, i) => (
            <text key={d} x={left - 8} y={top + i * cell + cell / 2} dy="0.32em" textAnchor="end" className="fill-muted text-[11px]">
              {d}
            </text>
          ))}
          {[0, 6, 12, 18, 23].map((h) => (
            <text key={h} x={left + h * cell + cell / 2} y={top + cell * 7 + 16} textAnchor="middle" className="fill-muted text-[11px] tabular">
              {h}h
            </text>
          ))}
          {cells.map((c) => {
            const idx = color(c.orders);
            const active = hover && hover.dow === c.dow && hover.hour === c.hour;
            return (
              <motion.rect
                key={`${c.dow}-${c.hour}`}
                x={left + c.hour * cell + gap / 2}
                y={top + (c.dow - 1) * cell + gap / 2}
                width={cell - gap}
                height={cell - gap}
                rx={Math.min(4, cell / 4)}
                fill={`var(${ramp[idx]})`}
                stroke={active ? "var(--ink)" : "none"}
                strokeWidth={1.5}
                initial={{ opacity: 0 }}
                animate={{ opacity: inView ? 1 : 0 }}
                transition={{ duration: 0.4, delay: inView ? c.hour * 0.025 + (c.dow - 1) * 0.04 : 0 }}
                onPointerEnter={() => setHover(c)}
                onPointerLeave={() => setHover(null)}
              />
            );
          })}
        </svg>
        {hover && (
          <ChartTooltip x={left + hover.hour * cell + cell} y={top + (hover.dow - 1) * cell + cell / 2} width={width}>
            <p className="mb-1 font-medium text-ink">
              {t.seasonality.days[hover.dow - 1]} · {hover.hour}h
            </p>
            <TooltipRow value={f.int(hover.orders)} label={t.seasonality.metricOrders.toLowerCase()} />
          </ChartTooltip>
        )}
        <div className="mt-2 flex items-center gap-2 text-[11px] text-muted" aria-hidden>
          {t.seasonality.heatLegendLow}
          <span className="flex h-2 w-28 overflow-hidden rounded-full">
            {ramp.map((c) => (
              <span key={c} className="flex-1" style={{ background: `var(${c})` }} />
            ))}
          </span>
          {t.seasonality.heatLegendHigh}
        </div>
        <p className="mt-4 text-sm leading-relaxed text-ink-2">
          {fill(t.seasonality.heatInsight, {
            day: t.seasonality.daysLong[stats.best.dow - 1],
            hour: stats.best.hour,
            weekendGap: f.pct(stats.gap, 0),
          })}
        </p>
      </div>
    </ChartFrame>
  );
}
