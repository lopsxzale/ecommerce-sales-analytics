-- Pergunta 4 (base do RFM): recência, frequência e valor monetário por cliente único.
-- A pontuação e os segmentos são calculados em src/rfm.py.
-- Data de referência = dia seguinte à última compra do dataset.
WITH customer_orders AS (
    SELECT c.customer_unique_id,
           o.order_id,
           o.order_purchase_timestamp,
           SUM(i.price + i.freight_value) AS revenue
    FROM orders o
    JOIN customers c USING (customer_id)
    JOIN order_items i USING (order_id)
    WHERE o.order_status NOT IN ('canceled', 'unavailable')
    GROUP BY c.customer_unique_id, o.order_id, o.order_purchase_timestamp
),
reference AS (
    SELECT MAX(order_purchase_timestamp)::date + 1 AS ref_date
    FROM customer_orders
)
SELECT customer_unique_id,
       r.ref_date - MAX(order_purchase_timestamp)::date  AS recency_days,
       COUNT(*)                                          AS frequency,
       ROUND(SUM(revenue), 2)                            AS monetary
FROM customer_orders
CROSS JOIN reference r
GROUP BY customer_unique_id, r.ref_date;
