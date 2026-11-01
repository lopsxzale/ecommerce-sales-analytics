"use client";

import { hierarchy, treemap, treemapSquarify } from "d3-hierarchy";
import { AnimatePresence, motion } from "motion/react";
import { useMemo, useState } from "react";
import { rfm, type Segment, type SegmentId } from "@/lib/data";
import { useWidth } from "@/lib/use-size";
import { ChartFrame } from "../chart-frame";
import { useChartInView } from "../motion";
import { useI18n } from "../providers";

type GroupId = "repeat" | "recent" | "lapsing";

const GROUP_OF: Record<SegmentId, GroupId> = {
  champions: "repeat",
  loyal: "repeat",
  new_high_value: "recent",
  new: "recent",
  at_risk_high_value: "lapsing",
  need_attention: "lapsing",
  hibernating: "lapsing",
};
const GROUP_COLOR: Record<GroupId, string> = {
  repeat: "var(--series-1)",
  recent: "var(--series-3)",
  lapsing: "var(--series-2)",
};

type Node = { name: string; children?: Node[]; segment?: Segment };

export function RfmChart() {
  const { t, f } = useI18n();
  const [box, width] = useWidth<HTMLDivElement>();
  const [ref, inView] = useChartInView<HTMLDivElement>();
  const [selected, setSelected] = useState<SegmentId>("at_risk_high_value");
  const height = width < 520 ? 420 : 380;

  const leaves = useMemo(() => {
    const groups: GroupId[] = ["repeat", "recent", "lapsing"];
    const root: Node = {
      name: "root",
      children: groups.map((g) => ({
        name: g,
        children: rfm.segments.filter((s) => GROUP_OF[s.segment] === g).map((s) => ({ name: s.segment, segment: s })),
      })),
    };
    const h = hierarchy(root)
      .sum((d) => d.segment?.customers ?? 0)
      .sort((a, b) => (b.value ?? 0) - (a.value ?? 0));
    return treemap<Node>().tile(treemapSquarify.ratio(1.2)).size([width, height]).paddingInner(2).round(true)(h).leaves();
  }, [width, height]);

  const seg = rfm.segments.find((s) => s.segment === selected)!;
  const copy = t.customers.segments[selected];

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
      <ChartFrame
        title={t.customers.chartTitle}
        subtitle={t.customers.chartSubtitle}
        sqlId="04_rfm_base"
        legend={(["repeat", "recent", "lapsing"] as GroupId[]).map((g) => ({
          label: t.customers.groups[g],
          color: GROUP_COLOR[g],
        }))}
        table={{
          columns: [t.table.segment, t.customers.customersLabel, t.customers.revenueLabel, t.customers.avgLabel],
          rows: rfm.segments.map((s) => [
            t.customers.segments[s.segment].name,
            f.int(s.customers),
            f.pct(s.revenue_share),
            f.brl(s.avg_monetary),
          ]),
        }}
      >
        <div ref={box}>
          <div ref={ref} className="relative" style={{ height }} role="listbox" aria-label={t.customers.chartTitle}>
            {leaves.map((leaf, i) => {
              const s = leaf.data.segment!;
              const w = leaf.x1 - leaf.x0;
              const h = leaf.y1 - leaf.y0;
              const active = s.segment === selected;
              const roomy = w > 110 && h > 56;
              return (
                <motion.button
                  key={s.segment}
                  role="option"
                  aria-selected={active}
                  aria-label={`${t.customers.segments[s.segment].name}: ${f.pct(s.customer_share)}`}
                  onClick={() => setSelected(s.segment)}
                  onPointerEnter={(e) => e.pointerType === "mouse" && setSelected(s.segment)}
                  className="absolute flex flex-col items-start justify-start overflow-hidden rounded-lg p-3 text-left text-[#0b0b0b] outline-none focus-visible:ring-2 focus-visible:ring-ink"
                  style={{ left: leaf.x0, top: leaf.y0, width: w, height: h, background: GROUP_COLOR[GROUP_OF[s.segment]] }}
                  initial={{ opacity: 0, scale: 0.85 }}
                  animate={inView ? { opacity: 1, scale: 1 } : {}}
                  transition={{ duration: 0.7, delay: inView ? i * 0.07 : 0, ease: [0.22, 1, 0.36, 1] }}
                >
                  {active && (
                    <motion.span
                      layoutId="rfm-active"
                      className="absolute inset-0 rounded-lg ring-[3px] ring-inset ring-ink"
                      transition={{ type: "spring", bounce: 0.15, duration: 0.5 }}
                    />
                  )}
                  {roomy ? (
                    <>
                      <span className="block text-xs font-semibold leading-tight sm:text-sm">
                        {t.customers.segments[s.segment].name}
                      </span>
                      <span className="mt-1 block text-xl font-semibold tracking-tight sm:text-2xl">{f.pct(s.customer_share, 0)}</span>
                    </>
                  ) : (
                    w > 44 && h > 26 && <span className="block text-[11px] font-semibold">{f.pct(s.customer_share, 0)}</span>
                  )}
                </motion.button>
              );
            })}
          </div>
        </div>
      </ChartFrame>

      <div className="card relative overflow-hidden p-6" aria-live="polite">
        <AnimatePresence mode="wait">
          <motion.div
            key={selected}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.3 }}
          >
            <p className="flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-muted">
              <span aria-hidden className="size-2.5 rounded-[3px]" style={{ background: GROUP_COLOR[GROUP_OF[selected]] }} />
              {t.customers.groups[GROUP_OF[selected]]}
            </p>
            <h4 className="mt-2 text-2xl font-semibold tracking-tight text-ink">{copy.name}</h4>
            <p className="mt-1 text-sm text-ink-2">{copy.desc}</p>
            <dl className="mt-6 grid grid-cols-2 gap-x-4 gap-y-5">
              {[
                [f.int(seg.customers), t.customers.customersLabel],
                [f.pct(seg.revenue_share), t.customers.revenueLabel],
                [f.brl(seg.avg_monetary), t.customers.avgLabel],
                [f.int(seg.avg_recency_days), t.customers.recencyLabel],
              ].map(([v, l]) => (
                <div key={l} className="flex flex-col-reverse">
                  <dt className="text-xs text-muted">{l}</dt>
                  <dd className="text-xl font-semibold tracking-tight text-ink">{v}</dd>
                </div>
              ))}
            </dl>
            <div className="mt-6 rounded-xl bg-surface-2 p-4">
              <p className="text-xs font-medium uppercase tracking-wider text-muted">{t.customers.actionLabel}</p>
              <p className="mt-1 text-sm font-medium text-ink">{copy.action}</p>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
