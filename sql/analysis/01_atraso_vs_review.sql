-- Pergunta 1: o atraso na entrega afeta a nota do review? Em quanto?
-- Pedidos entregues com review. Quando há mais de um review, vale o mais recente.
WITH latest_review AS (
    SELECT order_id,
           review_score,
           ROW_NUMBER() OVER (
               PARTITION BY order_id ORDER BY review_answer_timestamp DESC
           ) AS rn
    FROM order_reviews
),
delivered AS (
    SELECT r.review_score,
           o.order_delivered_customer_date::date
             - o.order_estimated_delivery_date::date AS delay_days
    FROM orders o
    JOIN latest_review r ON r.order_id = o.order_id AND r.rn = 1
    WHERE o.order_status = 'delivered'
      AND o.order_delivered_customer_date IS NOT NULL
),
bucketed AS (
    SELECT review_score,
           CASE
               WHEN delay_days <= 0  THEN 0
               WHEN delay_days <= 3  THEN 1
               WHEN delay_days <= 7  THEN 2
               WHEN delay_days <= 14 THEN 3
               ELSE 4
           END AS bucket
    FROM delivered
)
SELECT bucket,
       CASE bucket
           WHEN 0 THEN 'on_time'
           WHEN 1 THEN 'late_1_3'
           WHEN 2 THEN 'late_4_7'
           WHEN 3 THEN 'late_8_14'
           ELSE 'late_15_plus'
       END                                                  AS bucket_id,
       COUNT(*)                                             AS orders,
       ROUND(AVG(review_score), 3)                          AS avg_score,
       ROUND(AVG((review_score <= 2)::int), 4)              AS negative_rate,
       ROUND(COUNT(*)::numeric / SUM(COUNT(*)) OVER (), 4)  AS share_of_orders
FROM bucketed
GROUP BY bucket
ORDER BY bucket;
