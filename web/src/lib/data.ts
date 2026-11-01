// Dados gerados por `python -m src.pipeline` (src/export.py). Não editar à mão.
import kpisJson from "@/data/kpis.json";
import deliveryReviewJson from "@/data/delivery_review.json";
import revenueJson from "@/data/revenue.json";
import seasonalityJson from "@/data/seasonality.json";
import rfmJson from "@/data/rfm.json";
import logisticsJson from "@/data/logistics.json";
import qualityJson from "@/data/quality.json";
import sqlJson from "@/data/sql.json";

export type Kpis = {
  orders: number;
  revenue: number;
  avg_ticket: number;
  customers: number;
  sellers: number;
  products: number;
  avg_score: number;
  late_rate: number;
  period_start: string;
  period_end: string;
  repeat_rate: number;
};

export type DelayBucket = {
  bucket: number;
  bucket_id: "on_time" | "late_1_3" | "late_4_7" | "late_8_14" | "late_15_plus";
  orders: number;
  avg_score: number;
  negative_rate: number;
  share_of_orders: number;
};

export type DelayStats = {
  n_on_time: number;
  n_late: number;
  late_share: number;
  mean_on_time: number;
  mean_late: number;
  mean_diff: number;
  mean_diff_ci95: [number, number];
  negative_rate_on_time: number;
  negative_rate_late: number;
  mann_whitney_u: number;
  p_value: number;
  rank_biserial: number;
  spearman_rho: number;
  avg_score_now: number;
  avg_score_if_no_delays: number;
};

export type StateRevenue = {
  state: string;
  orders: number;
  revenue: number;
  avg_ticket: number;
  revenue_share: number;
  revenue_rank: number;
};

export type CategoryRevenue = {
  category_pt: string;
  category_en: string;
  orders: number;
  items: number;
  revenue: number;
  avg_ticket: number;
  revenue_share: number;
  cumulative_share: number;
};

export type MonthlySales = {
  month: string;
  orders: number;
  revenue: number;
  avg_ticket: number;
  revenue_mom: number | null;
  revenue_ma3: number;
};

export type HeatCell = { dow: number; hour: number; orders: number };
export type PeakDay = { day: string; orders: number; vs_daily_avg: number };

export type SegmentId =
  | "champions"
  | "loyal"
  | "new_high_value"
  | "new"
  | "at_risk_high_value"
  | "need_attention"
  | "hibernating";

export type Segment = {
  segment: SegmentId;
  customers: number;
  avg_recency_days: number;
  avg_frequency: number;
  avg_monetary: number;
  revenue: number;
  customer_share: number;
  revenue_share: number;
};

export type StateLogistics = {
  state: string;
  orders: number;
  avg_delivery_days: number;
  median_delivery_days: number;
  late_rate: number;
  avg_score: number;
};

export type QualityCheck = {
  id: string;
  value: number;
  total: number;
  rate: number;
  label: { pt: string; en: string };
  treatment: { pt: string; en: string };
};

export const kpis = kpisJson as Kpis;
export const deliveryReview = deliveryReviewJson as {
  buckets: DelayBucket[];
  stats: DelayStats;
};
export const revenue = revenueJson as {
  states: StateRevenue[];
  categories: CategoryRevenue[];
};
export const seasonality = seasonalityJson as {
  monthly: MonthlySales[];
  heatmap: HeatCell[];
  peak_days: PeakDay[];
};
export const rfm = rfmJson as {
  segments: Segment[];
  repeat_rate: number;
  scenario: {
    segment: SegmentId;
    reactivation_rate: number;
    customers_reactivated: number;
    potential_revenue: number;
  };
};
export const logistics = logisticsJson as {
  states: StateLogistics[];
  correlation: { late_rate_vs_score: number; delivery_days_vs_score: number };
};
export const quality = qualityJson as {
  checks: QualityCheck[];
  tables: Record<string, { raw_rows: number; loaded_rows: number }>;
};
export const sqlFiles = sqlJson as Record<string, string>;

export type SqlId = keyof typeof sqlJson;
