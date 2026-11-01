-- Pergunta 5: tempo de entrega por estado e seu impacto na satisfação.
WITH latest_review AS (
    SELECT order_id,
           review_score,
           ROW_NUMBER() OVER (
               PARTITION BY order_id ORDER BY review_answer_timestamp DESC
           ) AS rn
    FROM order_reviews
),
delivered AS (
    SELECT c.customer_state AS state,
           EXTRACT(EPOCH FROM o.order_delivered_customer_date
                              - o.order_purchase_timestamp)::float8 / 86400  AS delivery_days,
           o.order_delivered_customer_date::date
             > o.order_estimated_delivery_date::date                           AS is_late,
           r.review_score
    FROM orders o
    JOIN customers c USING (customer_id)
    LEFT JOIN latest_review r ON r.order_id = o.order_id AND r.rn = 1
    WHERE o.order_status = 'delivered'
      AND o.order_delivered_customer_date IS NOT NULL
)
SELECT state,
       COUNT(*)                                                     AS orders,
       ROUND(AVG(delivery_days)::numeric, 1)                        AS avg_delivery_days,
       ROUND((PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY delivery_days))::numeric, 1)
                                                                    AS median_delivery_days,
       ROUND(AVG(is_late::int), 4)                                  AS late_rate,
       ROUND(AVG(review_score), 3)                                  AS avg_score
FROM delivered
GROUP BY state
ORDER BY avg_delivery_days;
